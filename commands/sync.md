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

> **Vigtigt:** Enable Banking API-kald koerer lokalt via `eb-api.py` — Cowork kan ikke koere dem direkte. Denne kommando guider brugeren til at koere terminale kommandoer og indsaette output.

## Workflow

1. Read accounts.csv to get all active accounts
2. If no active accounts found: "Ingen konti konfigureret. Koer /smartspender:add-account foerst."
3. Tell user: "Koer denne kommando i din terminal for at tjekke session-status:"
   ```
   python3 ~/projects/SmartSpender/tools/eb-api.py status
   ```
   "Indsaet output her."
4. **[USER ACTION]**: User pastes status output
5. Parse the pasted JSON:
   - If `status` is `expired`: "Samtykke er udloebet. Koer denne kommando i terminalen for at forny:" `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` — then start over
   - If `status` is `no_session`: "Ingen aktiv session. Koer `/smartspender:add-account` for at oprette forbindelse."
   - If `days_remaining` < 7: warn "Samtykke udloeber om {days} dage. Overvej at forny snart."
6. For each Enable Banking account in accounts.csv:
   a. Get the `eb_account_uid` from accounts.csv
   b. Determine `last_synced` date. If empty, default to 90 days ago
   c. Check rate limit from pasted status output (`fetches_today`). If 4/4: "PSD2-graense naaet (4/4 daglige forespoergsler) for konto {account_name}. Proev igen i morgen." Skip this account.
   d. Tell user: "Koer denne kommando i din terminal for at hente transaktioner:"
      ```
      python3 ~/projects/SmartSpender/tools/eb-api.py transactions --account <eb_account_uid> --from <last_synced_date>
      ```
      "Indsaet output her."
   e. **[USER ACTION]**: User pastes transactions JSON output
   f. Parse the pasted JSON. If error: report and skip this account.
   g. Filter transactions: only include those with `status: BOOK`
   h. Map each transaction to common schema per `banks/enable-banking/export-format.md`:
      - `date` ← `booking_date` (already YYYY-MM-DD)
      - `amount` ← `transaction_amount.amount`, negated if `credit_debit_indicator` = `DBIT`
      - `currency` ← `transaction_amount.currency`
      - `description` ← `creditor.name` (DBIT) or `debtor.name` (CRDT) or first `remittance_information`
      - `raw_text` ← `remittance_information` joined with space
      - `bank` ← `enable-banking`
      - `account` ← `eb_account_uid`
7. Normalize each row to the common transaction schema (per `skills/data-schemas/SKILL.md`):
    - Convert dates to YYYY-MM-DD
    - Normalize amounts
    - Clean descriptions
    - Extract the balance from `balance_after_transaction` for API sync
    - Generate tx_hash for each transaction: `"{account}|{date}|{amount}|{saldo}"`
    - If no saldo available (API sync without `balance_after_transaction`): use fallback formula `"{account}|{date}|{amount}|{raw_text_normalized}"`
8. Read existing transactions.csv (if it exists) and extract all `tx_hash` values
9. If transactions.csv doesn't exist, create it with the header row
10. Filter out transactions whose `tx_hash` already exists (deduplication)
11. Append new transactions to transactions.csv
12. Update the account's `last_synced` timestamp in accounts.csv
13. Append the sync event to action-log.csv:
    - `action_type`: sync
    - `target`: enable-banking
    - `status`: completed
    - `details`: "{count} new transactions ({date_range})"

## Output

"Synkroniserede {count} nye transaktioner fra Enable Banking ({date_range})"

**Example**: "Synkroniserede 82 nye transaktioner fra Enable Banking (1. jan – 2. feb)"

If no new transactions: "Ingen nye transaktioner fundet siden sidste synkronisering ({last_sync_date})"

If multiple accounts: report per account, then total:
"Synkroniserede 47 nye transaktioner fra Lonkonto + 35 fra Budgetkonto = 82 i alt"

## Error Cases

| Error | Message |
|-------|---------|
| No accounts configured | "Ingen konti konfigureret. Koer /smartspender:add-account foerst." |
| EB session expired | "Samtykke er udloebet. Koer `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` i terminalen for at forny." |
| EB rate limit | "PSD2-graense naaet (4/4 daglige forespoergsler). Proev igen i morgen." |
| EB API error | Parse error from pasted output and provide guidance |
| User pastes error output | Parse the error from pasted output and provide guidance |
| No new transactions | "Ingen nye transaktioner fundet siden sidste synkronisering ({date})." |

## Side Effects
- Writes to transactions.csv (new rows)
- Updates accounts.csv (`last_synced` timestamp)
- Writes to action-log.csv

## Related Commands
- `/smartspender:analyze` — Categorize the synced transactions
- `/smartspender:add-account` — Set up a new bank account before first sync
