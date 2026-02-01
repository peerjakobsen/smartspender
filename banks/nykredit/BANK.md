# Nykredit Adapter

## Basic Info
- **Bank ID**: `nykredit`
- **Website**: nykredit.dk
- **Export URL**: `https://netbank.nykredit.dk/privat/accounts/save-postings`
- **Authentication**: MitID
- **Login behavior**: Navigating to the export URL redirects to MitID login automatically. After login, the browser returns directly to the export page. **Never** navigate to the netbank homepage first — Nykredit does not carry sessions across URL changes, so a second navigation would force re-authentication.

## Critical: Iframe-Based Page Structure

The Nykredit export page renders all form elements inside an iframe. All form interactions **must** access the iframe's document. Direct `document.getElementById()` will NOT work.

```javascript
// REQUIRED: Access form elements through iframe
const iframe = document.querySelector('iframe');
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

// Then access form elements via iframeDoc
const element = iframeDoc.getElementById('standardExport');
```

## Form Elements Reference

| Element ID | Type | Purpose |
|------------|------|---------|
| `standardExport` | select | Pre-configured export presets |
| `konto` | select (multi) | Available bank accounts |
| `valgtekontofelter` | select (multi) | Selected accounts for export |
| `periode` | select | Date range presets |
| `eksportformat` | select | Export format (CSV, etc.) |

## The "smartspender" Export Preset

A pre-configured export preset named "smartspender" in the `standardExport` dropdown. The preset value is assigned by the bank and varies per user — always look it up by text label, never hardcode the value.

**Selected Accounts**: All DKK accounts (excludes EUR account)

**Export Fields**: ALL available columns (all 28) — see `export-format.md` for the full column reference.

**Checkboxes** (pre-configured):
- Medtag kolonneoverskrifter: checked
- Konverter decimaltegn til punktum: checked
- Hent kun posteringer, der ikke tidligere er eksporteret: unchecked (gets all transactions)

**Format**: CSV (Kommasepareret)

## Period Dropdown Options

| Value | Danish Text | English |
|-------|-------------|---------|
| 0 | (empty) | None |
| 1 | I går | Yesterday |
| 2 | I dag | Today |
| 3 | 7 dage tilbage | 7 days back |
| 4 | 14 dage tilbage | 14 days back |
| 5 | 1 måned tilbage | 1 month back |
| 6 | 3 måneder tilbage | 3 months back |

## First-Time Setup

On first use, the "smartspender" preset does not exist yet. Detect this by checking the `standardExport` dropdown for an option with text "smartspender" (case-insensitive). If not found, guide the user through interactive setup.

### Detection

```javascript
const iframe = document.querySelector('iframe');
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
const standardExport = iframeDoc.getElementById('standardExport');
const presetExists = Array.from(standardExport.options).some(
  opt => opt.text.toLowerCase() === 'smartspender'
);
```

### Setup Steps (interactive, in Danish)

If `presetExists` is false, announce:

> "Du skal oprette en eksportpræference i Nykredit, inden vi kan synkronisere. Jeg guider dig igennem det — det tager kun et par minutter."

Then guide the user through these steps:

1. **Opret ny præference**: "Klik på 'Opret ny' (eller tilsvarende knap) for at oprette en ny eksportpræference."
2. **Navngiv præferencen**: "Kald den `smartspender` (med lille begyndelsesbogstav)."
3. **Vælg konti**: "Vælg alle dine DKK-konti. Du kan holde Ctrl nede og klikke på hver konto. Vi anbefaler at vælge alle DKK-konti."
4. **Vælg periode**: "Sæt perioden til '3 måneder tilbage'."
5. **Vælg eksportfelter**: "Vælg ALLE tilgængelige kolonner (alle 28). Marker dem alle — vi bruger dem til at kategorisere dine transaktioner."
6. **Indstil checkbokse**:
   - "Sæt hak i 'Medtag kolonneoverskrifter'"
   - "Sæt hak i 'Konverter decimaltegn til punktum'"
   - "Fjern hakket fra 'Hent kun posteringer, der ikke tidligere er eksporteret'"
7. **Vælg format**: "Vælg 'CSV (Kommasepareret)' som eksportformat."
8. **Gem præferencen**: "Klik 'Gem' for at gemme præferencen."

After saving, announce:

> "Perfekt! Præferencen 'smartspender' er nu oprettet. Fremover vælger vi den automatisk."

Then continue with the normal navigation flow (select preset, set period, click Næste).

## Navigation Flow

1. Navigate directly to: `https://netbank.nykredit.dk/privat/accounts/save-postings` (this triggers a MitID login redirect)
2. Announce: "Jeg har åbnet Nykredits eksportside. Du bliver bedt om at logge ind med MitID — efter login kommer du direkte til eksportsiden. Sig til, når du er logget ind."
3. **[USER ACTION]**: User completes MitID login
4. **[USER ACTION]**: User confirms login complete
5. Verify the export page loaded by checking for the page title or export form elements
6. Wait for the iframe to load (check for `document.querySelector('iframe')`)
7. Access iframe document:
   ```javascript
   const iframe = document.querySelector('iframe');
   const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
   ```
8. Check if the smartspender preset exists:
   ```javascript
   const standardExport = iframeDoc.getElementById('standardExport');
   const presetOption = Array.from(standardExport.options).find(
     opt => opt.text.toLowerCase() === 'smartspender'
   );
   ```
   If `presetOption` is undefined, run the **First-Time Setup** flow above, then re-check.
9. Select the preset by its text label:
   ```javascript
   standardExport.value = presetOption.value;
   standardExport.dispatchEvent(new Event('change', { bubbles: true }));
   ```
10. Wait 500ms for the form to populate with preset values
11. Set the period to "3 måneder tilbage":
    ```javascript
    const periode = iframeDoc.getElementById('periode');
    periode.value = '6';
    periode.dispatchEvent(new Event('change', { bubbles: true }));
    ```
12. Click the "Næste" button to proceed to step 2

## 3-Step Export Flow

| Step | Tab State | Action Required |
|------|-----------|-----------------|
| 1. Udvælg posteringer | Configure export | Select preset → Set period → Click "Næste" |
| 2. Hent posteringsfil | Review & download | Verify transaction count → Click "Næste" (triggers download) |
| 3. Markér som eksporteret | Confirm | Click "OK" to mark as exported |

### Step 1: Udvælg posteringer (Configure)
Select the smartspender preset and period as described in the navigation flow, then click "Næste".

### Step 2: Hent posteringsfil (Download)
The page shows the number of transactions to be exported. Verify this number is reasonable, then click "Næste" to trigger the CSV download.

### Step 3: Markér som eksporteret (Confirm)
Click "OK" to acknowledge. This step asks if you want to mark the transactions as exported — since our preset has the "previously exported" filter unchecked, this marking doesn't affect future exports.

## Complete Automation Script

```javascript
async function syncNykreditTransactions() {
  const iframe = document.querySelector('iframe');
  const doc = iframe.contentDocument || iframe.contentWindow.document;

  // Step 1: Find smartspender preset by text label (value is user-specific)
  const standardExport = doc.getElementById('standardExport');
  const presetOption = Array.from(standardExport.options).find(
    opt => opt.text.toLowerCase() === 'smartspender'
  );

  if (!presetOption) {
    return { success: false, message: 'Preset "smartspender" not found. Run first-time setup.' };
  }

  // Step 2: Select the preset by its looked-up value
  standardExport.value = presetOption.value;
  standardExport.dispatchEvent(new Event('change', { bubbles: true }));

  // Wait for form to populate
  await new Promise(r => setTimeout(r, 500));

  // Step 3: Set period (3 months)
  const periode = doc.getElementById('periode');
  periode.value = '6';
  periode.dispatchEvent(new Event('change', { bubbles: true }));

  // Wait for period to apply
  await new Promise(r => setTimeout(r, 500));

  // Step 4: Click "Næste" button to proceed to download
  const buttons = doc.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.textContent.trim() === 'Næste') {
      btn.click();
      break;
    }
  }

  return { success: true, message: 'Form configured, ready for download' };
}
```

## Session Notes
- **Session timeout**: ~15 minutes of inactivity
- **Re-auth triggers**: Session expiry requires full MitID re-authentication
- **URL navigation re-auth**: Navigating between different URLs within an active session forces re-authentication. Always navigate directly to the target URL (export page) before the user logs in — never go to the homepage first and then redirect.
- **Multiple accounts**: The smartspender preset includes all DKK accounts but excludes the EUR account
