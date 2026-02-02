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

> **Vigtigt:** Enable Banking API-kald kører lokalt via `eb-api.py` — Cowork kan ikke køre dem direkte. Denne kommando guider brugeren til at køre terminale kommandoer og indsætte output.

6. Load the bank adapter: `banks/enable-banking/BANK.md`
7. Ask which specific bank to connect (show list of supported Danish banks from the adapter):
   - Nykredit, Danske Bank, Nordea, Jyske Bank, Sydbank, Spar Nord, Lunar, Arbejdernes Landsbank
8. **[USER ACTION]**: User selects bank
9. Tell user: "Kør denne kommando i din terminal for at tjekke status:"
   ```
   python3 ~/projects/SmartSpender/tools/eb-api.py status
   ```
   "Indsæt output her."
10. **[USER ACTION]**: User pastes status output
11. Parse the pasted JSON:
    - If `status` is `active`: proceed to step 14
    - If `status` is `expired` or `no_session`: proceed to step 12
    - If error about missing config: "Enable Banking er ikke konfigureret. Kør `/smartspender:setup-enable-banking` først."
12. Tell user: "Du skal oprette en ny session. Kør denne kommando i din terminal:"
    ```
    python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <selected_bank_aspsp_name>
    ```
    "Browseren åbner — gennemfør MitID-samtykke. Når det er færdigt, indsæt output fra terminalen her."
13. **[USER ACTION]**: User completes MitID consent and pastes terminal output
14. Tell user: "Kør denne kommando for at se dine konti:"
    ```
    python3 ~/projects/SmartSpender/tools/eb-api.py accounts
    ```
    "Indsæt output her."
15. **[USER ACTION]**: User pastes accounts JSON output
16. Parse the pasted JSON to get list of available accounts
17. Display accounts to user with UID, name, type, and currency
18. **[USER ACTION]**: User selects which accounts to track
19. For each selected account, append an entry to accounts.csv:
    - `account_id`: Auto-generated
    - `bank`: enable-banking
    - `account_name`: Use account name from API, or ask user for friendly name
    - `account_type`: Derive from API `product` field, or ask user (checking, savings, credit)
    - `last_synced`: (empty — not yet synced)
    - `is_active`: TRUE
    - `sync_method`: enable-banking
    - `eb_account_uid`: Account UID from Enable Banking API
    - `eb_session_id`: Session ID from pasted status output
20. Check if settings.csv exists. If not, create it with the default settings (same as Branch A step 16)
21. Run the first sync: Execute the `/smartspender:sync enable-banking` workflow
22. Append the setup event to action-log.csv:
    - `action_type`: add-account
    - `target`: enable-banking ({selected_bank_name})
    - `status`: completed
    - `details`: "{count} accounts added via Enable Banking API"

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
| EB auth failed | "Samtykke mislykkedes. Kør `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` igen i terminalen." |
| No accounts found | "Ingen konti fundet. Tjek at du gav samtykke til kontoadgang." |
| User pastes error output | Parse the error from pasted output and provide guidance |

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
