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
| bank | yes | nykredit, enable-banking | - |

Only banks with adapters in `banks/` are supported. Currently: `nykredit` (browser automation), `enable-banking` (Open Banking API).

## Prerequisites
- For `nykredit`: Claude in Chrome extension active
- For `enable-banking`: Enable Banking configured via `/smartspender:setup-enable-banking`

## Workflow

1. Normalize the bank argument to lowercase
2. Check if a bank adapter exists: `banks/{bank}/BANK.md`
3. If no adapter exists: "Banken '{bank}' er ikke understøttet endnu. Tilgængelige banker: nykredit, enable-banking"
4. Check if accounts.csv exists. If not, create it with the header row:
   `account_id,bank,account_name,account_type,last_synced,is_active,sync_method,eb_account_uid,eb_session_id`
5. Branch based on bank type:

### Branch A: Browser-Based Banks (nykredit)

6. Check if this bank already has an active account in accounts.csv
7. If the bank already has an active account:
   - Inform the user: "Du har allerede en konto hos {bank}. Vil du tilføje endnu en?"
   - **[USER ACTION]**: User confirms or declines
   - If declines, abort
8. Load the bank adapter: `banks/{bank}/BANK.md`
9. Open the bank's netbank URL in the browser
10. Announce: "Jeg har åbnet {bank} netbank. Log venligst ind med MitID for at bekræfte kontoadgangen. Sig til, når du er logget ind."
11. **[USER ACTION]**: User completes MitID login
12. **[USER ACTION]**: User confirms login complete
13. Verify login succeeded
14. Identify available accounts:
    - For Nykredit: The smartspender preset includes all DKK accounts
    - Note the account identifiers visible after login
15. Append an entry to accounts.csv for each account:
    - `account_id`: Auto-generated
    - `bank`: {bank}
    - `account_name`: Ask user for a friendly name (e.g., "Lonkonto", "Budgetkonto")
    - `account_type`: Ask user (checking, savings, credit)
    - `last_synced`: (empty — not yet synced)
    - `is_active`: TRUE
    - `sync_method`: browser
    - `eb_account_uid`: (empty)
    - `eb_session_id`: (empty)
16. Check if settings.csv exists. If not, create it with the header row and write the default settings:
    - `default_currency`: DKK
    - `categorization_confidence_threshold`: 0.7
    - `subscription_detection_months`: 3
    - `preferred_language`: da
17. Run the first sync: Execute the `/smartspender:sync {bank}` workflow
18. Append the setup event to action-log.csv (create with header row if it doesn't exist):
    - `action_type`: add-account
    - `target`: {bank}
    - `status`: completed
    - `details`: "Account added and initial sync completed"

### Branch B: Enable Banking (API)

6. Check that Enable Banking is configured: verify `~/.config/smartspender/eb-config.json` exists
7. If not configured: "Enable Banking er ikke konfigureret. Kør `/smartspender:setup-enable-banking` først."
8. Load the bank adapter: `banks/enable-banking/BANK.md`
9. Ask which specific bank to connect (show list of supported Danish banks from the adapter):
   - Nykredit, Danske Bank, Nordea, Jyske Bank, Sydbank, Spar Nord, Lunar, Arbejdernes Landsbank
10. **[USER ACTION]**: User selects bank
11. Run: `python3 tools/eb-api.py auth --bank <selected_bank_aspsp_name>`
12. Announce: "Browser åbner for at oprette samtykke via MitID. Følg trinene i browseren."
13. **[USER ACTION]**: User completes MitID consent in browser
14. Wait for `eb-api.py auth` to complete (localhost callback captures code and creates session automatically)
15. Parse the JSON output. If error: show error message and abort.
16. Run: `python3 tools/eb-api.py accounts`
17. Parse the JSON output to get list of available accounts
18. Display accounts to user with UID, name, type, and currency
19. **[USER ACTION]**: User selects which accounts to track
20. For each selected account, append an entry to accounts.csv:
    - `account_id`: Auto-generated
    - `bank`: enable-banking
    - `account_name`: Use account name from API, or ask user for friendly name
    - `account_type`: Derive from API `product` field, or ask user (checking, savings, credit)
    - `last_synced`: (empty — not yet synced)
    - `is_active`: TRUE
    - `sync_method`: enable-banking
    - `eb_account_uid`: Account UID from Enable Banking API
    - `eb_session_id`: Session ID from `eb-session.json`
21. Check if settings.csv exists. If not, create it with the default settings (same as Branch A step 16)
22. Run the first sync: Execute the `/smartspender:sync enable-banking` workflow
23. Append the setup event to action-log.csv:
    - `action_type`: add-account
    - `target`: enable-banking ({selected_bank_name})
    - `status`: completed
    - `details`: "{count} accounts added via Enable Banking API and initial sync completed"

## Output

"Konto hos {bank} er tilføjet. {count} transaktioner synkroniseret."

**Example (browser)**: "Konto hos Nykredit er tilføjet. 127 transaktioner synkroniseret."

**Example (API)**: "2 konti hos Danske Bank er tilføjet via Enable Banking. 243 transaktioner synkroniseret."

Followed by: "Kør /smartspender:analyze for at kategorisere dine transaktioner."

## Error Cases

| Error | Message |
|-------|---------|
| Unknown bank | "Banken '{bank}' er ikke understøttet endnu. Tilgængelige banker: nykredit, enable-banking" |
| Login failed | "Login mislykkedes. Prøv venligst igen med MitID." |
| EB not configured | "Enable Banking er ikke konfigureret. Kør `/smartspender:setup-enable-banking` først." |
| EB auth failed | "Samtykke mislykkedes. Prøv igen med `/smartspender:add-account enable-banking`." |
| No accounts found | "Ingen konti fundet. Tjek at du gav samtykke til kontoadgang." |
| eb-api.py not found | "tools/eb-api.py ikke fundet. Kør `/smartspender:setup-enable-banking` først." |

## Side Effects
- Writes to accounts.csv (new account entry)
- Writes to settings.csv (default settings if first setup)
- Writes to transactions.csv (initial sync)
- Writes to action-log.csv
- Creates `~/.config/smartspender/eb-session.json` (Enable Banking only)

## Related Commands
- `/smartspender:setup-enable-banking` — One-time Enable Banking setup
- `/smartspender:sync` — Sync transactions after account is set up
- `/smartspender:analyze` — Categorize transactions after first sync
