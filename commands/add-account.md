---
description: Set up a new bank account via Enable Banking and run initial transaction sync
---

# /smartspender:add-account

## Trigger
- `/smartspender:add-account [bank]`
- "Tilfoej en bankkonto"
- "Set up my bank account"
- "Add my bank account"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| bank | no | danske-bank, nordea, nykredit, jyske-bank, sydbank, etc. | - |

Supported banks via Enable Banking API: Nykredit, Danske Bank, Nordea, Jyske Bank, Sydbank, Spar Nord, Lunar, Arbejdernes Landsbank, and 50+ other Danish banks.

## Prerequisites
- Python 3 installed on user's local machine
- Internet access

> **Vigtigt:** Enable Banking API-kald koerer lokalt via `eb-api.py` — Cowork kan ikke koere dem direkte. Denne kommando guider brugeren til at koere terminale kommandoer og indsaette output.

## Workflow

1. Check if Enable Banking is configured by asking user to check for `~/.config/smartspender/eb-config.json`:
   - Tell user: "Tjek om Enable Banking er konfigureret — koer dette i din terminal:" `ls ~/.config/smartspender/eb-config.json`
   - **[USER ACTION]**: User pastes output
2. Parse the output:
   - If file exists: skip to step 18 (Enable Banking workflow)
   - If "No such file": proceed to First-Time Setup (step 3)

### First-Time Setup (if Enable Banking not configured)

3. Announce: "Enable Banking er ikke konfigureret endnu. Vi saetter det op foerst."
4. Announce: "Denne guide opsaetter Enable Banking, saa du kan synkronisere transaktioner fra din bank via API."
5. Tell user: "Tjek at Python 3 er installeret — koer dette i din terminal:" `python3 --version`
6. If user reports Python 3 not found: "Python 3 er noedvendig. Installer fra python.org og proev igen."

#### Step 1: Create Enable Banking Account
7. Announce: "**Trin 1: Opret Enable Banking konto**"
8. Announce: "Aabn `https://enablebanking.com` i din browser. Opret en gratis konto — vaelg 'Restricted production', det er gratis til personligt brug. Sig til, naar du har oprettet kontoen."
9. **[USER ACTION]**: User creates account and confirms

#### Step 2: Create Application
10. Announce: "**Trin 2: Opret en applikation**"
11. Announce: "I Enable Banking dashboardet: Klik 'Applications' → 'Create Application'. Vaelg 'Restricted production'. Giv den navnet 'SmartSpender'. Saet redirect URL til `https://smartspender.mentilead.com/callback.html`. Sig til, naar applikationen er oprettet."
12. **[USER ACTION]**: User creates application and confirms

#### Step 3: Download RSA Key
13. Announce: "**Trin 3: Download RSA noegle**"
14. Announce: "Download den private noegle (.pem fil) som Enable Banking genererer til din applikation. Gem den paa et sikkert sted — f.eks. `~/.config/smartspender/private.pem`. Sig til, naar du har downloadet noeglen, og fortael mig stien til filen."
15. **[USER ACTION]**: User downloads key and provides the file path

#### Step 4: Install Dependencies
16. Announce: "**Trin 4: Installer Python-afhaengigheder**"
17. Tell user: "Koer dette i din terminal:"
    ```
    pip install requests PyJWT cryptography
    ```
    "Hvis det fejler, proev: `pip3 install requests PyJWT cryptography` eller `python3 -m pip install requests PyJWT cryptography`"
18. **[USER ACTION]**: User confirms dependencies installed

#### Step 5: Configure SmartSpender
19. Announce: "**Trin 5: Gemmer konfiguration**"
20. Ask user for their Enable Banking Application ID (visible in the dashboard)
21. **[USER ACTION]**: User provides app_id
22. Tell user: "Opret config-mappen og filen med disse kommandoer:"
    ```
    mkdir -p ~/.config/smartspender
    ```
    Then have them create `~/.config/smartspender/eb-config.json` with:
    ```json
    {
      "app_id": "<user-provided-app-id>",
      "key_path": "<user-provided-key-path>"
    }
    ```

#### Step 6: Test Connection
23. Announce: "**Trin 6: Test forbindelsen**"
24. Tell user: "Koer dette i din terminal for at teste:"
    ```
    python3 ~/projects/SmartSpender/tools/eb-api.py status
    ```
    "Indsaet output her."
25. **[USER ACTION]**: User pastes output
26. Expected: `no_session` status (which is correct — no bank linked yet)
27. If error in pasted output: troubleshoot based on error message (missing config, missing key file, etc.)

### Enable Banking Flow (Link Bank Account)

28. Load the bank adapter: `banks/enable-banking/BANK.md`
29. Ask which specific bank to connect (show list of supported Danish banks from the adapter):
   - Nykredit, Danske Bank, Nordea, Jyske Bank, Sydbank, Spar Nord, Lunar, Arbejdernes Landsbank
30. **[USER ACTION]**: User selects bank
31. Tell user: "Koer denne kommando i din terminal for at tjekke status:"
   ```
   python3 ~/projects/SmartSpender/tools/eb-api.py status
   ```
   "Indsaet output her."
32. **[USER ACTION]**: User pastes status output
33. Parse the pasted JSON:
    - If `status` is `active`: proceed to step 36
    - If `status` is `expired` or `no_session`: proceed to step 34
    - If error about missing config: troubleshoot config file
34. Tell user: "Du skal oprette en ny session. Koer denne kommando i din terminal:"
    ```
    python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <selected_bank_aspsp_name>
    ```
    "Browseren aabner — gennemfoer MitID-samtykke. Naar det er faerdigt, indsaet output fra terminalen her."
35. **[USER ACTION]**: User completes MitID consent and pastes terminal output
36. Tell user: "Koer denne kommando for at se dine konti:"
    ```
    python3 ~/projects/SmartSpender/tools/eb-api.py accounts
    ```
    "Indsaet output her."
37. **[USER ACTION]**: User pastes accounts JSON output
38. Parse the pasted JSON to get list of available accounts
39. Display accounts to user with UID, name, type, and currency
40. **[USER ACTION]**: User selects which accounts to track
41. Check if accounts.csv exists. If not, create it with the header row:
   `account_id,bank,account_name,account_type,last_synced,is_active,eb_account_uid,eb_session_id`
42. For each selected account, append an entry to accounts.csv:
    - `account_id`: Auto-generated
    - `bank`: enable-banking
    - `account_name`: Use account name from API, or ask user for friendly name
    - `account_type`: Derive from API `product` field, or ask user (checking, savings, credit)
    - `last_synced`: (empty — not yet synced)
    - `is_active`: TRUE
    - `eb_account_uid`: Account UID from Enable Banking API
    - `eb_session_id`: Session ID from pasted status output
43. Check if settings.csv exists. If not, create it with the header row and write the default settings:
    - `default_currency`: DKK
    - `categorization_confidence_threshold`: 0.7
    - `subscription_detection_months`: 3
    - `preferred_language`: da
44. Run the first sync: Execute the `/smartspender:sync` workflow
45. Append the setup event to action-log.csv (create with header row if it doesn't exist):
    - `action_type`: add-account
    - `target`: enable-banking ({selected_bank_name})
    - `status`: completed
    - `details`: "{count} accounts added via Enable Banking API"

## Output

"Konto hos {bank} er tilfojet via Enable Banking. {count} transaktioner synkroniseret."

**Example**: "2 konti hos Danske Bank er tilfojet via Enable Banking. 243 transaktioner synkroniseret."

Followed by: "Koer /smartspender:analyze for at kategorisere dine transaktioner."

## Error Cases

| Error | Message |
|-------|---------|
| Python 3 not installed | "Python 3 er noedvendig. Installer fra python.org og proev igen." |
| pip install fails | "Installation af Python-pakker mislykkedes. Proev: python3 -m pip install requests PyJWT cryptography" |
| Config file write fails | "Kunne ikke gemme konfiguration. Tjek at stien ~/.config/smartspender/ er tilgaengelig." |
| Key file not found | "RSA noeglefilen blev ikke fundet paa den angivne sti. Tjek stien og proev igen." |
| eb-api.py test fails | "Forbindelsestesten mislykkedes. Tjek din app_id og noeglesti i eb-config.json." |
| EB auth failed | "Samtykke mislykkedes. Koer `python3 ~/projects/SmartSpender/tools/eb-api.py auth --bank <bank>` igen i terminalen." |
| No accounts found | "Ingen konti fundet. Tjek at du gav samtykke til kontoadgang." |
| User pastes error output | Parse the error from pasted output and provide guidance |

## Side Effects
- Creates `~/.config/smartspender/eb-config.json` (first-time setup)
- Installs Python packages: requests, PyJWT, cryptography (first-time setup)
- Writes to accounts.csv (new account entries)
- Writes to settings.csv (default settings if first setup)
- Creates `~/.config/smartspender/eb-session.json` (via auth flow)
- Writes to transactions.csv (initial sync)
- Writes to action-log.csv

## Related Commands
- `/smartspender:sync` — Sync transactions after account is set up
- `/smartspender:analyze` — Categorize transactions after first sync
