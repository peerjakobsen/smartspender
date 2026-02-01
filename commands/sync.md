---
description: Sync transactions from your bank account via CSV export
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
| bank | yes | nykredit, all | - |

## Prerequisites
- Bank account added via `/smartspender:add-account`
- Claude in Chrome extension active

## Workflow

1. Identify the target bank from the `bank` argument
2. If `bank` is `all`, iterate through all active accounts in accounts.csv. Otherwise, proceed with the specified bank.
3. Load the bank adapter: `banks/{bank}/BANK.md`
4. Open the bank's netbank URL in the browser
5. Announce: "Jeg har åbnet {bank} netbank. Log venligst ind med MitID. Sig til, når du er logget ind."
6. **[USER ACTION]**: User completes MitID login
7. **[USER ACTION]**: User confirms login complete ("Jeg er logget ind")
8. Verify login succeeded by checking for expected post-login page elements
9. Navigate to the export page (per bank adapter navigation flow)
10. Wait for the export form to load (per bank adapter — may involve waiting for iframe)
11. Execute the export automation script from the bank adapter:
    - Select the smartspender preset
    - Set the period (default: 3 months)
    - Proceed through the export flow steps
12. Wait for the CSV file to download (up to 30 seconds)
13. If no CSV downloads within 30 seconds, report: "CSV-download mislykkedes. Prøv venligst igen."
14. Parse the CSV using the bank's `banks/{bank}/export-format.md` column mapping
15. Normalize each row to the common transaction schema (per `skills/transaction-schema/SKILL.md`):
    - Convert dates to YYYY-MM-DD
    - Normalize amounts
    - Clean descriptions
    - Generate tx_hash for each transaction
16. Read existing transactions.csv (if it exists) and extract all `tx_hash` values
17. If transactions.csv doesn't exist, create it with the header row
18. Filter out transactions whose `tx_hash` already exists (deduplication)
19. Append new transactions to transactions.csv
20. Update the account's `last_synced` timestamp in accounts.csv
21. Append the sync event to action-log.csv:
    - `action_type`: sync
    - `target`: {bank}
    - `status`: completed
    - `details`: "{count} new transactions ({date_range})"

## Output

"Synkroniserede {count} nye transaktioner fra {bank} ({date_range})"

**Example**: "Synkroniserede 47 nye transaktioner fra Nykredit (15. jan – 1. feb)"

If no new transactions: "Ingen nye transaktioner fundet siden sidste synkronisering ({last_sync_date})"

## Error Cases

| Error | Message |
|-------|---------|
| Bank site unreachable | "Kan ikke nå {bank} netbank. Tjek din internetforbindelse." |
| Session expired during export | "Banksessionen er udløbet. Log venligst ind igen med MitID." |
| No CSV downloaded | "CSV-download mislykkedes. Prøv venligst igen." |
| No new transactions | "Ingen nye transaktioner fundet siden sidste synkronisering ({date})." |
| No accounts configured | "Ingen konti konfigureret. Kør /smartspender:add-account først." |
| Unknown bank | "Banken '{bank}' er ikke understøttet. Tilgængelige banker: nykredit" |

## Side Effects
- Writes to transactions.csv (new rows)
- Updates accounts.csv (`last_synced` timestamp)
- Writes to action-log.csv

## Related Commands
- `/smartspender:analyze` — Categorize the synced transactions
- `/smartspender:add-account` — Set up a new bank account before first sync
