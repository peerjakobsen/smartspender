---
description: One-time setup guide for Enable Banking Open Banking API integration
---

# /smartspender:setup-enable-banking

## Trigger
- `/smartspender:setup-enable-banking`
- "Opsæt Enable Banking"
- "Set up Open Banking"

## Arguments

No arguments. This is a guided setup wizard.

## Prerequisites
- Python 3 installed on user's local machine
- Internet access

> **Vigtigt:** Opsætningen kræver terminale kommandoer som Cowork ikke kan køre direkte. Denne guide fortæller brugeren hvilke kommandoer der skal køres lokalt.

## Workflow

1. Announce: "Denne guide opsætter Enable Banking, så du kan synkronisere transaktioner fra din bank via API i stedet for browser-eksport."
2. Tell user: "Tjek at Python 3 er installeret — kør dette i din terminal:" `python3 --version`
3. If user reports Python 3 not found: "Python 3 er nødvendig. Installer fra python.org og prøv igen."

### Step 1: Create Enable Banking Account
4. Announce: "**Trin 1: Opret Enable Banking konto**"
5. Open `https://enablebanking.com` in the browser
6. Announce: "Opret en gratis konto på Enable Banking. Vælg 'Restricted production' — det er gratis til personligt brug. Sig til, når du har oprettet kontoen."
7. **[USER ACTION]**: User creates account and confirms

### Step 2: Create Application
8. Announce: "**Trin 2: Opret en applikation**"
9. Announce: "I Enable Banking dashboardet: Klik 'Applications' → 'Create Application'. Vælg 'Restricted production'. Giv den navnet 'SmartSpender'. Sæt redirect URL til `https://smartspender.mentilead.com/callback.html`. Sig til, når applikationen er oprettet."
10. **[USER ACTION]**: User creates application and confirms

### Step 3: Download RSA Key
11. Announce: "**Trin 3: Download RSA nøgle**"
12. Announce: "Download den private nøgle (.pem fil) som Enable Banking genererer til din applikation. Gem den på et sikkert sted — f.eks. `~/.config/smartspender/private.pem`. Sig til, når du har downloadet nøglen, og fortæl mig stien til filen."
13. **[USER ACTION]**: User downloads key and provides the file path

### Step 4: Install Dependencies
14. Announce: "**Trin 4: Installer Python-afhængigheder**"
15. Tell user: "Kør dette i din terminal:"
    ```
    pip install requests PyJWT cryptography
    ```
    "Hvis det fejler, prøv: `pip3 install requests PyJWT cryptography` eller `python3 -m pip install requests PyJWT cryptography`"
16. **[USER ACTION]**: User confirms dependencies installed

### Step 5: Configure SmartSpender
17. Announce: "**Trin 5: Gemmer konfiguration**"
18. Ask user for their Enable Banking Application ID (visible in the dashboard)
19. **[USER ACTION]**: User provides app_id
20. Create `~/.config/smartspender/` directory if it doesn't exist
21. Write `~/.config/smartspender/eb-config.json`:
```json
{
  "app_id": "<user-provided-app-id>",
  "key_path": "<user-provided-key-path>"
}
```

### Step 6: Test Connection
22. Announce: "**Trin 6: Test forbindelsen**"
23. Tell user: "Kør dette i din terminal for at teste:"
    ```
    python3 ~/projects/SmartSpender/tools/eb-api.py status
    ```
    "Indsæt output her."
24. **[USER ACTION]**: User pastes output
25. Expected: `no_session` status (which is correct — no bank linked yet)
26. If error in pasted output: troubleshoot based on error message (missing config, missing key file, etc.)

### Step 7: Link First Bank
26. Announce: "**Trin 7: Forbind din bank**"
27. Announce: "Opsætningen er klar. Vi tilføjer nu din første bankkonto via Enable Banking."
28. Ask which bank to connect (show list of supported Danish banks from `banks/enable-banking/BANK.md`)
29. **[USER ACTION]**: User selects bank
30. Execute `/smartspender:add-account enable-banking` flow with the selected bank

## Output

"Enable Banking er konfigureret. Din {bank} konto er tilsluttet via Open Banking API."

Followed by: "Kør `/smartspender:sync enable-banking` for at synkronisere transaktioner."

## Error Cases

| Error | Message |
|-------|---------|
| Python 3 not installed | "Python 3 er nødvendig. Installer fra python.org og prøv igen." |
| pip install fails | "Installation af Python-pakker mislykkedes. Prøv: python3 -m pip install requests PyJWT cryptography" |
| Config file write fails | "Kunne ikke gemme konfiguration. Tjek at stien ~/.config/smartspender/ er tilgængelig." |
| Key file not found | "RSA nøglefilen blev ikke fundet på den angivne sti. Tjek stien og prøv igen." |
| eb-api.py test fails | "Forbindelsestesten mislykkedes. Tjek din app_id og nøglesti i eb-config.json." |

## Side Effects
- Installs Python packages (requests, PyJWT, cryptography)
- Creates `~/.config/smartspender/eb-config.json`
- Creates accounts.csv entries (via add-account flow)
- Creates `~/.config/smartspender/eb-session.json` (via add-account flow)
- Writes to transactions.csv (via initial sync)
- Writes to action-log.csv

## Related Commands
- `/smartspender:add-account enable-banking` — Add another bank via Enable Banking
- `/smartspender:sync enable-banking` — Sync transactions via API
