# Nykredit Export Format

## File Format

- **Type**: CSV (semicolon-delimited despite "Kommasepareret" label)
- **Delimiter**: Semicolon (`;`)
- **Encoding**: Windows-1252 (NOT UTF-8 -- Danish characters garbled without conversion)
- **Date format**: DD-MM-YYYY (dashes, not slashes)
- **Decimal separator**: Period (due to "Konverter decimaltegn til punktum" preset setting)
- **Has header row**: Yes
- **Quoting**: String fields double-quoted (`"value"`), numeric fields unquoted
- **Trailing delimiter**: Yes -- every row (including header) ends with a trailing `;`
- **Filename**: `nykredit_transactions.csv`

## Columns

28 columns in the actual export:

| # | Column Name | Description |
|---|-------------|-------------|
| 1 | Exportkonto | Account number used for the export (plain numeric, e.g. `54740001351377`) |
| 2 | Afsenderkonto | Sender account (for transfers and card payments) |
| 3 | Modtagerkonto | Receiver account (for transfers) |
| 4 | Dato | Transaction date (DD-MM-YYYY) |
| 5 | Tekst | Transaction description / merchant |
| 6 | Beløb | Amount (negative = expense, period decimal, leading spaces on positive) |
| 7 | Saldo | Account balance after transaction (leading spaces) |
| 8 | Indbetaler | Payer name and address (for incoming transfers) |
| 9 | Supp. tekst til modtager | Supplementary text -- card payments include merchant, city, terminal, card number |
| 10 | Tekst til modtager | Text to receiver (for transfers) |
| 11 | Betalingsident | Payment identification (typically empty) |
| 12 | End2end | End-to-end reference (typically empty) |
| 13 | Gebyrer(Swift) | SWIFT fees (typically empty) |
| 14 | Gebyr valuta | Fee currency (typically empty) |
| 15 | Kontohaver | Account holder name |
| 16 | Kreditorreference | Creditor reference (typically empty) |
| 17 | Modtagernavn | Receiver name (typically empty for domestic) |
| 18 | Modtaget beløb | Received amount (typically empty) |
| 19 | Modtaget valuta | Received currency (typically empty) |
| 20 | NEMkonto ID | NEM account ID (typically empty) |
| 21 | Overført beløb | Transferred amount (absolute value, always positive, leading spaces) |
| 22 | Overført valuta | Transfer currency (typically empty) |
| 23 | Ovf.type | Transaction type: Hævet, Overførsel, Indsat, or Gebyr |
| 24 | Samlepost | Batch item (typically empty) |
| 25 | Swift/BIC | SWIFT/BIC code (typically empty) |
| 26 | Valørdato | Value date (DD-MM-YYYY -- may differ from Dato) |
| 27 | Valuta | Currency (e.g. `DKK`) |
| 28 | Vekselkurs | Exchange rate (typically empty for DKK transactions) |

## CSV Header Row

```csv
"Exportkonto";"Afsenderkonto";"Modtagerkonto";"Dato";"Tekst";"Beløb";"Saldo";"Indbetaler";"Supp. tekst til modtager";"Tekst til modtager";"Betalingsident";"End2end";"Gebyrer(Swift)";"Gebyr valuta";"Kontohaver";"Kreditorreference";"Modtagernavn";"Modtaget beløb";"Modtaget valuta";"NEMkonto ID";"Overført beløb";"Overført valuta";"Ovf.type";"Samlepost";"Swift/BIC";"Valørdato";"Valuta";"Vekselkurs";
```

## Column Mapping to Common Schema

| Nykredit Column | Common Field | Transform |
|-----------------|--------------|-----------|
| Dato | date | Parse DD-MM-YYYY with dashes -> YYYY-MM-DD |
| Beløb | amount | Trim leading whitespace, use directly (period decimal) |
| Tekst | raw_text | Direct |
| Tekst | description | Trim, normalize whitespace, clean merchant name |
| Exportkonto | account | Direct (plain numeric string, no dashes) |
| Ovf.type | category_hint | Map: Hævet=expense, Overførsel=transfer, Indsat=income, Gebyr=fee |
| Supp. tekst til modtager | (metadata) | Card payment detail: merchant, city, terminal, card number |
| Indbetaler | (metadata) | Payer name and address for incoming transfers |
| Kontohaver | (metadata) | Account holder name |
| Valørdato | (metadata) | Value date -- may differ from transaction date |
| Afsenderkonto | (metadata) | Transfer detection |
| Modtagerkonto | (metadata) | Transfer detection |
| Tekst til modtager | (metadata) | Transfer description |
| Overført beløb | (metadata) | Absolute transaction amount (always positive) |
| Valuta | (metadata) | Currency code |
| Saldo | (dedup) | Running balance after transaction -- used for tx_hash computation. Trim whitespace, format to 2 decimal places. |

## Parsing Rules

### Encoding Conversion

The file is Windows-1252 encoded. Must convert to UTF-8 before processing to correctly handle Danish characters (æ, ø, å) and accented characters (é). Without conversion, `Beløb` appears garbled and names like `Éléonore` are unreadable.

### Date Parsing

Input: `03-11-2025` (DD-MM-YYYY with dashes)
Output: `2025-11-03` (YYYY-MM-DD)

Split by `-`, then recombine as `{year}-{month}-{day}`.

### Amount Parsing

Amounts use period decimals but have **leading whitespace** on positive values:
- ` 828.69` -> trim -> `828.69` (positive/income)
- `-5.00` -> trim -> `-5.00` (negative/expense)

Always trim whitespace before parsing as a number.

### Trailing Semicolon

Every row ends with a trailing `;`, producing an empty 29th field when split. Discard the last empty element after splitting.

### Empty Fields

Many columns are empty for most transaction types. Two patterns:
- **Quoted empty**: `""` (empty string in a string field)
- **Unquoted empty**: consecutive semicolons `;;` (no value at all)

Treat both as empty strings. Never skip a row because of empty fields.

### Valørdato vs Dato

The value date (Valørdato, column 26) can differ from the transaction date (Dato, column 4). Example: a `Rente` (interest) transaction dated `30-12-2025` has a value date of `01-01-2026`. Use Dato as the primary date.

## Ovf.type Values

| Value | Meaning | Typical Transactions |
|-------|---------|---------------------|
| Hævet | Withdrawn/Debited | Card payments, ATM withdrawals |
| Overførsel | Transfer | Account-to-account transfers |
| Indsat | Deposited | Interest, incoming third-party transfers |
| Gebyr | Fee | Bank fees (e.g. Kontoudskrift) |

## Sample Rows

Card payment (debit):
```csv
"54740001351377";"54740001351377";"";03-11-2025;"Debitcard DK NORMAL FREDERIK";-5.00; 828.69;"";"Forretning: NORMAL FREDERIK By .......: Frederiksberg Terminal .: 19155471 Notanr. ..: 05309415304800074608830 Kortnr. 5557 XXXX XXXX 3496";"";"";"";;;"REDACTED";"";"";;"";""; 5.00;"DKK";"Hævet";;;03-11-2025;"DKK";;
```

Incoming transfer:
```csv
"54740001351377";"";"54740001351377";03-11-2025;"Fra Konto"; 300.00; 1128.69;"REDACTED";"";"Fra Konto";"";"";;;"REDACTED";"";"";;"";""; 300.00;"DKK";"Overførsel";;;03-11-2025;"DKK";;
```

Interest:
```csv
"54740001351377";"";"54740001351377";30-12-2025;"Rente"; 4.98; 1323.17;"";"";"";"";"";;;"REDACTED";"";"";;"";""; 4.98;"DKK";"Indsat";;;01-01-2026;"DKK";;
```

Bank fee:
```csv
"54740001351377";"54740001351377";"";30-01-2026;"Kontoudskrift";-55.00; 927.83;"";"";"";"";"";;;"REDACTED";"";"";;"";""; 55.00;"DKK";"Gebyr";;;30-01-2026;"DKK";;
```
