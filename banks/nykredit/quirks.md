# Nykredit Quirks

## Known Issues

### 1. Windows-1252 Encoding (Not UTF-8)

The CSV export is Windows-1252 encoded despite being a modern web application. Danish characters (æ, ø, å) and accented characters (é) will appear as garbled replacement characters if read as UTF-8. Convert the file to UTF-8 before any text processing.

Affected columns: Beløb, Overført beløb, Overført valuta, Ovf.type, Valørdato, Kontohaver (names with special characters).

### 2. Semicolon Delimiter Despite "Kommasepareret" Label

The smartspender preset uses "CSV (Kommasepareret)" format, but the actual output is semicolon-delimited (`;`). Do not split on commas.

### 3. Trailing Semicolon on Every Row

Every row, including the header, ends with a trailing `;`. Naively splitting by `;` produces an empty 29th field. Discard it.

### 4. Leading Whitespace in Numeric Fields

Positive amounts in the Beløb, Saldo, and Overført beløb columns have leading spaces (e.g. ` 828.69`, ` 300.00`). Negative amounts do not (e.g. `-5.00`). Always trim before parsing.

### 5. Iframe Required for All Form Interactions

The export page at `https://netbank.nykredit.dk/privat/accounts/save-postings` renders the entire form inside an iframe. Calling `document.getElementById()` directly on the page will not find any form elements. You **must** access them through the iframe:

```javascript
const iframe = document.querySelector('iframe');
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
const element = iframeDoc.getElementById('standardExport');
```

### 6. Event Dispatching Required for Dropdowns

Setting a dropdown value programmatically (e.g., `select.value = '6'`) does not trigger the form's internal event handlers. Always dispatch a `change` event after setting a value:

```javascript
select.value = '6';
select.dispatchEvent(new Event('change', { bubbles: true }));
```

Without this, the form will not update dependent fields or enable the "Næste" button.

### 7. Smartspender Preset Saves ~20 Manual Interactions

The pre-configured "smartspender" preset (value `0000000001`) auto-selects accounts, export fields, format, and checkbox options. Without it, you would need to manually configure ~20 form fields. Always use the preset.

### 8. Re-Export is Safe (Previously Exported Filter Unchecked)

The smartspender preset has "Hent kun posteringer, der ikke tidligere er eksporteret" unchecked. This means every export includes all transactions in the selected period, not just new ones. Deduplication happens in SmartSpender via `tx_hash` comparison, not at the bank level.

### 9. Session Timeout (~15 Minutes)

The bank session expires after approximately 15 minutes of inactivity. If the session expires during the export flow:
- The page will redirect to the login screen
- User must re-authenticate with MitID
- The entire export flow must restart from the beginning

### 10. Multiple Accounts in Single Export

The smartspender preset includes all 5 DKK accounts but excludes the EUR account. All transactions from all included accounts appear in a single CSV file. The `Exportkonto` column identifies which account each transaction belongs to.

## Transaction Description Patterns

Patterns observed in the real `Tekst` column:

- **Debit card payments**: `Debitcard DK {MERCHANT}`
  - Merchant name is truncated/abbreviated by the bank
  - Examples: `Debitcard DK NORMAL FREDERIK`, `Debitcard DK COOP365 FREDERI`, `Debitcard DK REMA 1000 FR.BE`, `Debitcard DK 7-ELEVEN 006`, `Debitcard DK Metro Havneholmen`, `Debitcard DK STARBUCKS FISKE`
  - Special characters in merchant names replaced with `@`: `Debitcard DK F@TEX FOOD ROLI`, `Debitcard DK SK@JTEUDLEJNING`
  - The `Supp. tekst til modtager` column contains full merchant detail (see below)
- **Incoming transfers**: `Fra Konto`
  - Payer details in the `Indbetaler` column (name and address)
  - Transfer description in `Tekst til modtager` column
- **Outgoing named transfers**: Free text description set by the sender
  - Examples: `P+A vedligeholdelse`, `M+A VEDLIGEHOLDELSE`
- **Interest**: `Rente`
- **Bank fees**: `Kontoudskrift`

## Card Payment Detail in Supp. tekst til modtager

For card payments (`Debitcard DK ...`), the supplementary text field contains structured merchant data:

```
Forretning: NORMAL FREDERIK By .......: Frederiksberg Terminal .: 19155471 Notanr. ..: 05309415304800074608830 Kortnr. 5557 XXXX XXXX 3496
```

Fields within this text:
- **Forretning**: Merchant name (may be more complete than the Tekst field)
- **By**: City name
- **Terminal**: Terminal ID
- **Notanr.**: Transaction reference number
- **Kortnr.**: Masked card number (last 4 visible)

This is useful for merchant identification when the `Tekst` field is truncated.

## Ovf.type Transaction Types

The `Ovf.type` column (column 23) categorizes every transaction:

| Value | Meaning | When Used |
|-------|---------|-----------|
| Hævet | Withdrawn/Debited | Card payments (`Debitcard DK ...`), fees |
| Overførsel | Transfer | Account-to-account transfers (`Fra Konto`, named transfers) |
| Indsat | Deposited | Interest (`Rente`), incoming third-party transfers |
| Gebyr | Fee | Bank fees (`Kontoudskrift`) |

## Account Number Format

Account numbers in the export are plain numeric strings without dashes: `54740001351377`, `81140008802793`. Not the `1234-1234567` format shown in some bank documentation.

## Tips

- The export page sometimes takes 2-3 seconds to fully render the iframe. Wait for the iframe to be present before attempting to access its document.
- If the "Næste" button appears disabled, the preset may not have loaded correctly. Try re-selecting the preset value and dispatching the change event again.
- Transaction counts on step 2 (Hent posteringsfil) are a useful sanity check. If the count is 0, the period may be wrong or the accounts may not have transactions.
- The `Valørdato` (value date) can differ from `Dato` (transaction date), especially for interest postings at year boundaries.
