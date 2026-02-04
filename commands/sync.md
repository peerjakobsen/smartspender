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

> **Vigtigt:** Enable Banking API-kald koerer lokalt via `eb-api.py` — Cowork kan ikke koere dem direkte. Denne kommando genererer alle terminalkommandoer paa een gang, brugeren koerer dem, og Claude laeser resultatfilerne direkte.

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

Build a single code block with all commands. Always start with `mkdir -p` to ensure the directory exists, then `status`, then `transactions` per account, then `balances` per account.

Tell user: "Koer disse kommandoer i din terminal:"

```bash
mkdir -p ~/Documents/SmartSpender
python3 ~/projects/SmartSpender/tools/eb-api.py status > ~/Documents/SmartSpender/eb-status.json
python3 ~/projects/SmartSpender/tools/eb-api.py transactions --account <uid1> --from <date1> > ~/Documents/SmartSpender/eb-transactions-<slug1>.json
python3 ~/projects/SmartSpender/tools/eb-api.py transactions --account <uid2> --from <date2> > ~/Documents/SmartSpender/eb-transactions-<slug2>.json
python3 ~/projects/SmartSpender/tools/eb-api.py balances --account <uid1> > ~/Documents/SmartSpender/eb-balances-<slug1>.json
python3 ~/projects/SmartSpender/tools/eb-api.py balances --account <uid2> > ~/Documents/SmartSpender/eb-balances-<slug2>.json
```

Replace `<uid>`, `<date>`, and `<slug>` with actual values from accounts.csv.

Follow with: "Sig til naar kommandoerne er koert."

Then **wait for the user to confirm** before proceeding.

### Step 3: Read and validate status

1. **[USER ACTION]**: User confirms commands are done
2. Read `~/Documents/SmartSpender/eb-status.json` via Filesystem tool
3. If file not found: "Filen `eb-status.json` blev ikke fundet. Tjek at kommandoen koerte korrekt."
4. If file is empty: "Filen `eb-status.json` er tom. Koer kommandoen igen."
5. Parse the JSON:
   - If `status` is `expired`: "Samtykke er udloebet. Koer denne kommando i terminalen for at forny:" `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` — delete all `eb-*.json` files from `~/Documents/SmartSpender/`, then stop
   - If `status` is `no_session`: "Ingen aktiv session. Koer `/smartspender:add-account` for at oprette forbindelse." — delete all `eb-*.json` files, then stop
   - If `days_remaining` < 7: warn "Samtykke udloeber om {days} dage. Overvej at forny snart."
   - Check `fetches_today` for rate limit info (used per-account in Step 4)
6. Delete `eb-status.json` after successful processing

### Step 4: Process each account

For each active Enable Banking account in accounts.csv:

#### 4a. Check rate limit
- If `fetches_today` from status is 4/4: "PSD2-graense naaet (4/4 daglige forespoergsler) for konto {account_name}. Proev igen i morgen." Skip this account.

#### 4b. Read and process transactions
1. Read `~/Documents/SmartSpender/eb-transactions-{slug}.json` via Filesystem tool
2. Handle errors:
   - File not found: "Filen `eb-transactions-{slug}.json` blev ikke fundet. Tjek at kommandoen koerte korrekt." — skip this account
   - Empty file: "Filen `eb-transactions-{slug}.json` er tom. Koer kommandoen igen." — skip this account
   - Invalid JSON: "Filen `eb-transactions-{slug}.json` indeholder ugyldigt JSON." — keep the file for inspection, skip this account
   - API error in JSON: report the error, skip this account
3. Filter transactions: only include those with `status: BOOK`
4. Map each transaction to common schema per `banks/enable-banking/export-format.md`:
   - `date` <-- `booking_date` (already YYYY-MM-DD)
   - `amount` <-- `transaction_amount.amount`, negated if `credit_debit_indicator` = `DBIT`
   - `currency` <-- `transaction_amount.currency`
   - `description` <-- `creditor.name` (DBIT) or `debtor.name` (CRDT) or first `remittance_information`
   - `raw_text` <-- `remittance_information` joined with space
   - `bank` <-- `enable-banking`
   - `account` <-- `eb_account_uid`
5. Delete the transactions JSON file after successful processing

#### 4c. Read and process balances
1. Read `~/Documents/SmartSpender/eb-balances-{slug}.json` via Filesystem tool
2. Parse the JSON. Extract balance using priority:
   1. Prefer `CLBD` (closing booked balance)
   2. Fall back to `ITAV` (intraday available) if CLBD not present
   3. Fall back to `XPCD` (expected) if neither present
3. Store: `balance` = amount, `balance_type` = type code, `balance_date` = reference_date or today
4. If balance fetch fails (file missing, empty, parse error, rate limit): continue without balance update (non-blocking)
5. Delete the balances JSON file after successful processing

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

## Cleanup Rules

- Delete each JSON file immediately after successful processing
- If processing fails with invalid JSON: **keep** the file so the user can inspect it
- If session is expired or no_session: delete all `eb-*.json` files from `~/Documents/SmartSpender/`

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
| EB session expired | "Samtykke er udloebet. Koer `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` i terminalen for at forny." |
| EB rate limit | "PSD2-graense naaet (4/4 daglige forespoergsler). Proev igen i morgen." |
| File not found | "Filen `{filename}` blev ikke fundet. Tjek at kommandoen koerte korrekt." |
| Empty file | "Filen `{filename}` er tom. Koer kommandoen igen." |
| Invalid JSON | "Filen `{filename}` indeholder ugyldigt JSON." (keep file for inspection) |
| No new transactions | "Ingen nye transaktioner fundet siden sidste synkronisering ({date})." |

## Side Effects
- Writes to transactions.csv (new rows)
- Updates accounts.csv (`last_synced` timestamp, `balance`, `balance_type`, `balance_date`)
- Writes to action-log.csv
- Creates and deletes temporary JSON files in `~/Documents/SmartSpender/`

## Related Commands
- `/smartspender:analyze` — Categorize the synced transactions
- `/smartspender:add-account` — Set up a new bank account before first sync
