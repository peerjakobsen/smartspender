# Nykredit Adapter

## Basic Info
- **Bank ID**: `nykredit`
- **Website**: nykredit.dk
- **Netbank URL**: `https://netbank.nykredit.dk`
- **Export URL**: `https://netbank.nykredit.dk/privat/accounts/save-postings`
- **Authentication**: MitID

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

A pre-configured export preset named "smartspender" exists in Nykredit with value `0000000001`. This preset auto-configures:

**Selected Accounts**: All 5 DKK accounts (excludes EUR account)

**Export Fields**:
- Exportkonto
- Afsenderkonto
- Modtagerkonto
- Dato
- Tekst
- Beløb
- Saldo
- Indbetaler
- Supp. tekst til modtager
- Tekst til modtager

**Checkboxes** (pre-configured):
- Medtag kolonneoverskrifter: checked
- Konverter decimaltegn til punktum: checked
- Hent kun posteringer, der ikke tidligere er eksporteret: unchecked (gets all transactions)

**Format**: CSV (Kommasepareret)

**Filename**: `nykredit_transactions_2025_2026`

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

## Navigation Flow

1. Navigate to: `https://netbank.nykredit.dk`
2. Announce: "Jeg har åbnet Nykredit netbank. Log venligst ind med MitID. Sig til, når du er logget ind."
3. **[USER ACTION]**: User completes MitID login
4. **[USER ACTION]**: User confirms login complete
5. Navigate to: `https://netbank.nykredit.dk/privat/accounts/save-postings`
6. Wait for: the iframe to load (check for `document.querySelector('iframe')`)
7. Access iframe document:
   ```javascript
   const iframe = document.querySelector('iframe');
   const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
   ```
8. Select the smartspender preset:
   ```javascript
   const standardExport = iframeDoc.getElementById('standardExport');
   standardExport.value = '0000000001';
   standardExport.dispatchEvent(new Event('change', { bubbles: true }));
   ```
9. Wait 500ms for the form to populate with preset values
10. Set the period to "3 måneder tilbage":
    ```javascript
    const periode = iframeDoc.getElementById('periode');
    periode.value = '6';
    periode.dispatchEvent(new Event('change', { bubbles: true }));
    ```
11. Click the "Næste" button to proceed to step 2

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

  // Step 1: Select smartspender preset
  const standardExport = doc.getElementById('standardExport');
  standardExport.value = '0000000001';
  standardExport.dispatchEvent(new Event('change', { bubbles: true }));

  // Wait for form to populate
  await new Promise(r => setTimeout(r, 500));

  // Step 2: Set period (3 months)
  const periode = doc.getElementById('periode');
  periode.value = '6';
  periode.dispatchEvent(new Event('change', { bubbles: true }));

  // Wait for period to apply
  await new Promise(r => setTimeout(r, 500));

  // Step 3: Click "Næste" button to proceed to download
  // Find the button by its text content or class
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
- **Multiple accounts**: The smartspender preset includes all 5 DKK accounts but excludes the EUR account
