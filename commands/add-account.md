---
description: Set up a new bank account and run initial transaction sync
---

# /smartspender:add-account

## Trigger
- `/smartspender:add-account [bank]`
- "Tilføj en bankkonto"
- "Set up Nykredit"
- "Add my bank account"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| bank | yes | nykredit | - |

Only banks with adapters in `banks/` are supported. Currently: `nykredit`.

## Prerequisites
- Claude in Chrome extension active

## Workflow

1. Normalize the bank argument to lowercase
2. Check if a bank adapter exists: `banks/{bank}/BANK.md`
3. If no adapter exists: "Banken '{bank}' er ikke understøttet endnu. Tilgængelige banker: nykredit"
4. Check if accounts.csv exists. If not, create it with the header row.
5. Check if this bank already has an active account in accounts.csv
6. If the bank already has an active account:
   - Inform the user: "Du har allerede en konto hos {bank}. Vil du tilføje endnu en?"
   - **[USER ACTION]**: User confirms or declines
   - If declines, abort
7. Load the bank adapter: `banks/{bank}/BANK.md`
8. Open the bank's netbank URL in the browser
9. Announce: "Jeg har åbnet {bank} netbank. Log venligst ind med MitID for at bekræfte kontoadgangen. Sig til, når du er logget ind."
10. **[USER ACTION]**: User completes MitID login
11. **[USER ACTION]**: User confirms login complete
12. Verify login succeeded
13. Identify available accounts:
    - For Nykredit: The smartspender preset includes all DKK accounts
    - Note the account identifiers visible after login
14. Append an entry to accounts.csv for each account:
    - `account_id`: Auto-generated
    - `bank`: {bank}
    - `account_name`: Ask user for a friendly name (e.g., "Lonkonto", "Budgetkonto")
    - `account_type`: Ask user (checking, savings, credit)
    - `last_synced`: (empty — not yet synced)
    - `is_active`: TRUE
15. Check if settings.csv exists. If not, create it with the header row and write the default settings:
    - `default_currency`: DKK
    - `categorization_confidence_threshold`: 0.7
    - `subscription_detection_months`: 3
    - `preferred_language`: da
16. Run the first sync: Execute the `/smartspender:sync {bank}` workflow
17. Append the setup event to action-log.csv (create with header row if it doesn't exist):
    - `action_type`: add-account
    - `target`: {bank}
    - `status`: completed
    - `details`: "Account added and initial sync completed"

## Output

"Konto hos {bank} er tilføjet. {count} transaktioner synkroniseret."

**Example**: "Konto hos Nykredit er tilføjet. 127 transaktioner synkroniseret."

Followed by: "Kør /smartspender:analyze for at kategorisere dine transaktioner."

## Error Cases

| Error | Message |
|-------|---------|
| Unknown bank | "Banken '{bank}' er ikke understøttet endnu. Tilgængelige banker: nykredit" |
| Login failed | "Login mislykkedes. Prøv venligst igen med MitID." |

## Side Effects
- Writes to accounts.csv (new account entry)
- Writes to settings.csv (default settings if first setup)
- Writes to transactions.csv (initial sync)
- Writes to action-log.csv

## Related Commands
- `/smartspender:sync` — Sync transactions after account is set up
- `/smartspender:analyze` — Categorize transactions after first sync
