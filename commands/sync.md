---
description: Sync transactions from your bank account via Enable Banking API
---

# /smartspender:sync

## Trigger
- `/smartspender:sync`
- `/smartspender:sync all`
- "Synkroniser mine transaktioner"
- "Hent transaktioner"
- "Sync my transactions"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| target | no | all | all |

If `all` (or no argument), syncs all active accounts in accounts.csv.

## Prerequisites
- Bank account added via `/smartspender:add-account`
- Enable Banking configured and session active

> **Vigtigt:** Enable Banking API-kald koerer lokalt via `eb-api.py` — Cowork kan ikke koere dem direkte. Denne kommando genererer alle terminalkommandoer paa een gang (inkl. en combine+clipboard kommando). Brugeren koerer dem i terminalen og indsaetter resultatet med Cmd+V.

## File Naming Convention

All temporary JSON files are written to `~/Documents/SmartSpender/`.

| Data | File Name |
|------|-----------|
| Status | `eb-status.json` |
| Transactions | `eb-transactions-{slug}.json` |
| Balances | `eb-balances-{slug}.json` |

**Slug computation**: Take `account_name` from accounts.csv, lowercase it, replace spaces with hyphens.

**Slug collision**: If two accounts produce the same slug, append `-1`, `-2` etc. to subsequent accounts.

## Workflow

### Step 1: Read accounts and compute commands

1. Read accounts.csv to get all active accounts
2. If no active accounts found: "Ingen konti konfigureret. Koer /smartspender:add-account foerst."
3. For each active account:
   - Compute the filename slug from `account_name` (lowercase, spaces to hyphens)
   - Check for slug collisions across accounts; append numeric suffix if needed
   - Determine `last_synced` date from accounts.csv; if empty, default to 90 days ago

### Step 2: Present batch commands

Build a single code block with all commands. Always start with `mkdir -p` to ensure the directory exists, then `status`, then `transactions` per account, then `balances` per account. End with the combine+clipboard command that merges all JSON files and copies to clipboard.

Tell user: "Koer disse kommandoer i din terminal, og indsaet derefter resultatet i chatten med Cmd+V."

```bash
mkdir -p ~/Documents/SmartSpender
python3 ~/projects/SmartSpender/tools/eb-api.py status > ~/Documents/SmartSpender/eb-status.json
python3 ~/projects/SmartSpender/tools/eb-api.py transactions --account <uid1> --from <date1> > ~/Documents/SmartSpender/eb-transactions-<slug1>.json
python3 ~/projects/SmartSpender/tools/eb-api.py transactions --account <uid2> --from <date2> > ~/Documents/SmartSpender/eb-transactions-<slug2>.json
python3 ~/projects/SmartSpender/tools/eb-api.py balances --account <uid1> > ~/Documents/SmartSpender/eb-balances-<slug1>.json
python3 ~/projects/SmartSpender/tools/eb-api.py balances --account <uid2> > ~/Documents/SmartSpender/eb-balances-<slug2>.json
python3 -c "
import json, glob, os
d = {}
for f in sorted(glob.glob(os.path.expanduser('~/Documents/SmartSpender/eb-*.json'))):
    k = os.path.basename(f)[:-5]
    try:
        d[k] = json.load(open(f))
    except Exception as e:
        d[k] = {'_error': str(e)}
print(json.dumps(d))
" | pbcopy
echo "Data kopieret til udklipsholder - indsaet i chatten med Cmd+V"
```

Replace `<uid>`, `<date>`, and `<slug>` with actual values from accounts.csv.

### Step 3: Parse combined JSON from clipboard

1. **[USER ACTION]**: User pastes the combined JSON (from clipboard via Cmd+V)
2. If pasted text is not valid JSON: "Det indsatte er ikke gyldigt JSON. Koer kommandoerne igen og proev Cmd+V."
3. The combined JSON is an object with keys like `eb-status`, `eb-transactions-lonkonto`, `eb-balances-lonkonto`, etc.
4. If a key has an `_error` property: report the error, skip that data source
5. **Validate status** from the `eb-status` key:
   - If key missing: "Status-data mangler. Tjek at kommandoen koerte korrekt."
   - If `status` is `expired`: "Samtykke er udloebet. Koer denne kommando i terminalen for at forny:" `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` — suggest cleanup: `rm ~/Documents/SmartSpender/eb-*.json`, then stop
   - If `status` is `no_session`: "Ingen aktiv session. Koer `/smartspender:add-account` for at oprette forbindelse." — suggest cleanup, then stop
   - If `days_remaining` < 7: warn "Samtykke udloeber om {days} dage. Overvej at forny snart."
   - Check `fetches_today` for rate limit info (used per-account in Step 4)

### Step 4: Process each account

For each active Enable Banking account in accounts.csv:

#### 4a. Check rate limit
- If `fetches_today` from status is 4/4: "PSD2-graense naaet (4/4 daglige forespoergsler) for konto {account_name}. Proev igen i morgen." Skip this account.

#### 4b. Process transactions
1. Look up key `eb-transactions-{slug}` in the combined JSON
2. Handle errors:
   - Key missing: "Data for `{account_name}` mangler. Tjek at kommandoen koerte korrekt." — skip this account
   - Key has `_error` value: report the error, skip this account
   - API error in data: report the error, skip this account
3. Filter transactions: only include those with `status: BOOK`
4. Map each transaction to common schema per `banks/enable-banking/export-format.md`:
   - `date` <-- `booking_date` (already YYYY-MM-DD)
   - `amount` <-- `transaction_amount.amount`, negated if `credit_debit_indicator` = `DBIT`
   - `currency` <-- `transaction_amount.currency`
   - `description` <-- `creditor.name` (DBIT) or `debtor.name` (CRDT) or first `remittance_information`
   - `raw_text` <-- `remittance_information` joined with space
   - `bank` <-- `enable-banking`
   - `account` <-- `eb_account_uid`

#### 4c. Process balances
1. Look up key `eb-balances-{slug}` in the combined JSON
2. Parse the data. Extract balance using priority:
   1. Prefer `CLBD` (closing booked balance)
   2. Fall back to `ITAV` (intraday available) if CLBD not present
   3. Fall back to `XPCD` (expected) if neither present
3. Store: `balance` = amount, `balance_type` = type code, `balance_date` = reference_date or today
4. If balance data missing, has `_error`, or parse error: continue without balance update (non-blocking)

### Step 5: Normalize, deduplicate, store

1. Normalize each row to the common transaction schema (per `skills/data-schemas/SKILL.md`):
   - Convert dates to YYYY-MM-DD
   - Normalize amounts
   - Clean descriptions
   - Extract the balance from `balance_after_transaction` for API sync
   - Generate tx_hash for each transaction: `"{account}|{date}|{amount}|{saldo}"`
   - If no saldo available (API sync without `balance_after_transaction`): use fallback formula `"{account}|{date}|{amount}|{raw_text_normalized}"`
2. Read existing transactions.csv (if it exists) and extract all `tx_hash` values
3. If transactions.csv doesn't exist, create it with the header row
4. Filter out transactions whose `tx_hash` already exists (deduplication)
5. Append new transactions to transactions.csv
6. Update the account row in accounts.csv:
   - `last_synced` <-- current timestamp
   - `balance` <-- fetched balance amount (if available)
   - `balance_type` <-- fetched balance type code (if available)
   - `balance_date` <-- fetched reference_date or today (if available)
7. Append the sync event to action-log.csv:
   - `action_type`: sync
   - `target`: enable-banking
   - `status`: completed
   - `details`: "{count} new transactions ({date_range})"

## Cleanup

JSON files remain on disk in `~/Documents/SmartSpender/` for debugging. After a successful sync, suggest cleanup:

"Ryd op med: `rm ~/Documents/SmartSpender/eb-*.json`"

Cleanup is optional and user-initiated — Claude does not delete the files.

## Output

**Single account**:
```
Synkroniserede {count} nye transaktioner fra Enable Banking ({date_range})
Kontosaldo: {balance} kr (pr. {balance_date})
```

**Example**:
```
Synkroniserede 82 nye transaktioner fra Enable Banking (1. jan – 2. feb)
Kontosaldo: 12.543,25 kr (pr. 3. feb)
```

If no new transactions: "Ingen nye transaktioner fundet siden sidste synkronisering ({last_sync_date})"
Still show balance if fetched: "Kontosaldo: {balance} kr (pr. {balance_date})"

**Multiple accounts**:
```
Synkroniserede 47 nye fra Lønkonto + 35 fra Budgetkonto = 82 i alt

Kontosaldi:
- Lønkonto: 12.543,25 kr
- Budgetkonto: 3.210,00 kr
```

If balance fetch failed for an account, omit it from the balance list (non-blocking).

## Error Cases

| Error | Message |
|-------|---------|
| No accounts configured | "Ingen konti konfigureret. Koer /smartspender:add-account foerst." |
| EB session expired | "Samtykke er udloebet. Koer `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` i terminalen for at forny." + suggest cleanup: `rm ~/Documents/SmartSpender/eb-*.json` |
| EB rate limit | "PSD2-graense naaet (4/4 daglige forespoergsler). Proev igen i morgen." |
| Pasted text not valid JSON | "Det indsatte er ikke gyldigt JSON. Koer kommandoerne igen og proev Cmd+V." |
| Key missing from combined JSON | "Data for `{account_name}` mangler. Tjek at kommandoen koerte korrekt." |
| Key has `_error` value | Report the error, skip that account |
| No new transactions | "Ingen nye transaktioner fundet siden sidste synkronisering ({date})." |

## Side Effects
- Writes to transactions.csv (new rows)
- Updates accounts.csv (`last_synced` timestamp, `balance`, `balance_type`, `balance_date`)
- Writes to action-log.csv
- Temporary JSON files are written to `~/Documents/SmartSpender/` by terminal commands (not by Claude)

## Related Commands
- `/smartspender:analyze` — Categorize the synced transactions
- `/smartspender:add-account` — Set up a new bank account before first sync
