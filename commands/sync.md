---
description: Sync transactions from your bank account via CSV export or Open Banking API
---

# /smartspender:sync

## Trigger
- `/smartspender:sync [bank]`
- "Synkroniser mine transaktioner"
- "Hent transaktioner fra Nykredit"
- "Sync my transactions"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| bank | yes | nykredit, enable-banking, all | - |

## Prerequisites
- Bank account added via `/smartspender:add-account`
- For `nykredit`: Claude in Chrome extension active
- For `enable-banking`: Enable Banking configured and session active

## Workflow

1. Identify the target bank from the `bank` argument
2. If `bank` is `all`, iterate through all active accounts in accounts.csv. For each account, use the `sync_method` field to determine the correct sync flow (Branch A for `browser`, Branch B for `enable-banking`). Otherwise, proceed with the specified bank.
3. If no active accounts found for the specified bank: "Ingen konti konfigureret for {bank}. Kør /smartspender:add-account først."
4. Read the `sync_method` from accounts.csv for the target accounts. Branch accordingly:

### Branch A: Browser Sync (sync_method = browser)

5. Load the bank adapter: `banks/{bank}/BANK.md`
6. Open the bank's export URL directly in the browser (triggers MitID login redirect)
7. Announce: "Jeg har åbnet {bank} eksportsiden. Du bliver bedt om at logge ind med MitID — efter login kommer du direkte til eksportsiden. Sig til, når du er logget ind."
8. **[USER ACTION]**: User completes MitID login
9. **[USER ACTION]**: User confirms login complete ("Jeg er logget ind")
10. Verify the export page loaded correctly by checking for expected page elements
11. Check if first-time setup is needed; if the smartspender preset is missing from the dropdown, guide the user through setup (per bank adapter First-Time Setup flow)
12. Wait for the export form to load (per bank adapter — may involve waiting for iframe)
13. Execute the export automation script from the bank adapter:
    - Select the smartspender preset
    - Set the period (default: 3 months)
    - Proceed through the export flow steps
14. Wait for the CSV file to download (up to 30 seconds)
15. If no CSV downloads within 30 seconds, report: "CSV-download mislykkedes. Prøv venligst igen."
16. Parse the CSV using the bank's `banks/{bank}/export-format.md` column mapping
17. Continue to **Common Steps** below

### Branch B: API Sync (sync_method = enable-banking)

> **Vigtigt:** Enable Banking API-kald kører lokalt via `eb-api.py` — Cowork kan ikke køre dem direkte. Denne kommando guider brugeren til at køre terminale kommandoer og indsætte output.

5. Tell user: "Kør denne kommando i din terminal for at tjekke session-status:"
   ```
   python3 ~/projects/SmartSpender/tools/eb-api.py status
   ```
   "Indsæt output her."
6. **[USER ACTION]**: User pastes status output
7. Parse the pasted JSON:
   - If `status` is `expired`: "Samtykke er udløbet. Kør denne kommando i terminalen for at forny:" `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` — then start over
   - If `status` is `no_session`: "Ingen aktiv session. Kør `/smartspender:add-account enable-banking` for at oprette forbindelse."
   - If `days_remaining` < 7: warn "Samtykke udløber om {days} dage. Overvej at forny snart."
8. For each Enable Banking account in accounts.csv (matching the target):
   a. Get the `eb_account_uid` from accounts.csv
   b. Determine `last_synced` date. If empty, default to 90 days ago
   c. Check rate limit from pasted status output (`fetches_today`). If 4/4: "PSD2-grænse nået (4/4 daglige forespørgsler) for konto {account_name}. Prøv igen i morgen." Skip this account.
   d. Tell user: "Kør denne kommando i din terminal for at hente transaktioner:"
      ```
      python3 ~/projects/SmartSpender/tools/eb-api.py transactions --account <eb_account_uid> --from <last_synced_date>
      ```
      "Indsæt output her."
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
9. Continue to **Common Steps** below

### Common Steps (both branches)

18. Normalize each row to the common transaction schema (per `skills/transaction-schema/SKILL.md`):
    - Convert dates to YYYY-MM-DD
    - Normalize amounts
    - Clean descriptions
    - Extract the Saldo (running balance) — from CSV column for browser sync, from `balance_after_transaction` for API sync
    - Generate tx_hash for each transaction: `"{account}|{date}|{amount}|{saldo}"`
    - If no saldo available (API sync without `balance_after_transaction`): use fallback formula `"{account}|{date}|{amount}|{raw_text_normalized}"`
19. Read existing transactions.csv (if it exists) and extract all `tx_hash` values
20. If transactions.csv doesn't exist, create it with the header row
21. Filter out transactions whose `tx_hash` already exists (deduplication)
22. Append new transactions to transactions.csv
23. Update the account's `last_synced` timestamp in accounts.csv
24. Append the sync event to action-log.csv:
    - `action_type`: sync
    - `target`: {bank}
    - `status`: completed
    - `details`: "{count} new transactions ({date_range})"

## Output

"Synkroniserede {count} nye transaktioner fra {bank} ({date_range})"

**Example (browser)**: "Synkroniserede 47 nye transaktioner fra Nykredit (15. jan – 1. feb)"

**Example (API)**: "Synkroniserede 82 nye transaktioner fra Enable Banking (1. jan – 2. feb)"

If no new transactions: "Ingen nye transaktioner fundet siden sidste synkronisering ({last_sync_date})"

If `all` with multiple accounts: report per account, then total:
"Synkroniserede 47 nye transaktioner fra Nykredit + 82 fra Enable Banking = 129 i alt"

## Error Cases

| Error | Message |
|-------|---------|
| Bank site unreachable | "Kan ikke nå {bank} netbank. Tjek din internetforbindelse." |
| Session expired during export | "Banksessionen er udløbet. Log venligst ind igen med MitID." |
| No CSV downloaded | "CSV-download mislykkedes. Prøv venligst igen." |
| No new transactions | "Ingen nye transaktioner fundet siden sidste synkronisering ({date})." |
| Preset not found | "Præferencen 'smartspender' blev ikke fundet. Vi opretter den nu — følg vejledningen." (then trigger First-Time Setup flow from bank adapter) |
| No accounts configured | "Ingen konti konfigureret. Kør /smartspender:add-account først." |
| Unknown bank | "Banken '{bank}' er ikke understøttet. Tilgængelige banker: nykredit, enable-banking" |
| EB session expired | "Samtykke er udløbet. Kør `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` i terminalen for at forny." |
| EB rate limit | "PSD2-grænse nået (4/4 daglige forespørgsler). Prøv igen i morgen." |
| EB API error | Parse error from pasted output and provide guidance |
| User pastes error output | Parse the error from pasted output and provide guidance |

## Side Effects
- Writes to transactions.csv (new rows)
- Updates accounts.csv (`last_synced` timestamp)
- Writes to action-log.csv

## Related Commands
- `/smartspender:analyze` — Categorize the synced transactions
- `/smartspender:add-account` — Set up a new bank account before first sync
