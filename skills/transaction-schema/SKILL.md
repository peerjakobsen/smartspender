---
name: transaction-schema
description: Common transaction data format used across all bank adapters. Reference this when parsing bank exports or writing to transactions.csv.
---

# Transaction Schema

## Purpose

Defines the common data format for all transactions in SmartSpender. Every bank adapter normalizes its export into this schema before storing locally.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tx_id | string | yes | Unique transaction ID (auto-generated UUID) |
| tx_hash | string | yes | Deduplication hash |
| date | date | yes | Transaction date (YYYY-MM-DD) |
| amount | number | yes | Amount with sign (negative = expense, positive = income) |
| currency | string | yes | ISO currency code (default: DKK) |
| description | string | yes | Cleaned, human-readable description |
| raw_text | string | yes | Original text from bank export, unmodified |
| bank | string | yes | Bank identifier (e.g., `nykredit`, `enable-banking`) |
| account | string | yes | Account identifier from the bank |
| synced_at | datetime | yes | When the transaction was imported (YYYY-MM-DD HH:MM:SS) |

## Hash Computation

The `tx_hash` prevents duplicate imports across multiple sync runs.

### Primary formula (when bank provides running balance)

```
"{account}|{date}|{amount}|{saldo}"
```

Where:
- `account` is the account identifier from the bank export (e.g., `54740001351377` for Nykredit CSV, or the Enable Banking account UID for API sync)
- `date` is in YYYY-MM-DD format
- `amount` is formatted to exactly 2 decimal places (e.g., `-55.00`)
- `saldo` is the running balance after the transaction, formatted to exactly 2 decimal places (e.g., `927.83`)

The running balance is a natural disambiguator — even two identical purchases at the same merchant on the same day produce different balances.

### Fallback formula (when bank does not provide running balance)

```
"{account}|{date}|{amount}|{raw_text_normalized}"
```

Where:
- `raw_text_normalized` is the raw_text trimmed of whitespace and lowercased

This fallback is used when:
- The bank CSV doesn't include a balance column
- Enable Banking API response lacks `balance_after_transaction` for a specific transaction

Before appending any row to transactions.csv, check whether a row with the same `tx_hash` already exists. If it does, skip the row.

## Transformation Rules

### Date Normalization
- Bank exports use various formats: DD-MM-YYYY (Nykredit), DD/MM/YYYY (others)
- Enable Banking API provides YYYY-MM-DD (no conversion needed)
- Always convert to: **YYYY-MM-DD**
- Reject any date in the future — this likely indicates a parsing error

### Amount Normalization
- Danish number format uses period as thousands separator and comma as decimal: `1.234,56`
- Convert to standard decimal: `1234.56`
- Enable Banking API provides amounts as positive strings with a `credit_debit_indicator` — negate DBIT amounts
- Expenses are **negative**, income is **positive**
- Always store with exactly 2 decimal places
- Currency defaults to `DKK` unless the transaction specifies otherwise

### Description Cleaning
- Trim leading and trailing whitespace
- Collapse multiple consecutive spaces into one
- Preserve bank-specific prefixes that indicate payment method (e.g., `Debitcard DK` indicates card payment)
- For Enable Banking: use `creditor.name` (expenses) or `debtor.name` (income) as the description
- Store the original unmodified text in `raw_text`
- Store the cleaned version in `description`

### Bank and Account Fields
- `bank` uses the lowercase bank identifier matching the adapter directory name: `nykredit`, `enable-banking`
- `account` uses the value from the bank's export column (e.g., the Exportkonto value from Nykredit, or the Enable Banking account UID)

## Validation Rules

Before storing a transaction, verify all of the following:
- `date` is a valid date and not in the future
- `amount` is a non-zero number
- `raw_text` is not empty
- `tx_hash` does not already exist in transactions.csv (deduplication)

If validation fails, log the issue but do not halt the entire sync — skip the invalid row and continue.

## Examples

### Nykredit Card Payment (Browser Sync)
```
tx_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
tx_hash: "54740001351377|2025-11-03|-5.00|828.69"
date: 2025-11-03
amount: -5.00
currency: DKK
description: Debitcard DK Normal Frederiksberg
raw_text: "Debitcard DK NORMAL FREDERIK"
bank: nykredit
account: "54740001351377"
synced_at: 2026-02-01 10:30:00
```

### Nykredit Incoming Transfer (Browser Sync)
```
tx_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
tx_hash: "54740001351377|2025-11-03|300.00|1128.69"
date: 2025-11-03
amount: 300.00
currency: DKK
description: Fra Konto
raw_text: "Fra Konto"
bank: nykredit
account: "54740001351377"
synced_at: 2026-02-01 10:30:00
```

### Nykredit Bank Fee (Browser Sync)
```
tx_id: "c3d4e5f6-a7b8-9012-cdef-123456789012"
tx_hash: "54740001351377|2026-01-30|-55.00|927.83"
date: 2026-01-30
amount: -55.00
currency: DKK
description: Kontoudskrift
raw_text: "Kontoudskrift"
bank: nykredit
account: "54740001351377"
synced_at: 2026-02-01 10:30:00
```

### Enable Banking Card Payment (API Sync, with balance)
```
tx_id: "d4e5f6a7-b8c9-0123-defa-234567890123"
tx_hash: "eb-uid-abc123|2026-01-15|-847.50|12543.25"
date: 2026-01-15
amount: -847.50
currency: DKK
description: FØTEX
raw_text: "Dankort-køb FØTEX 4123"
bank: enable-banking
account: "eb-uid-abc123"
synced_at: 2026-02-02 14:00:00
```

### Enable Banking Salary (API Sync, with balance)
```
tx_id: "e5f6a7b8-c9d0-1234-efab-345678901234"
tx_hash: "eb-uid-abc123|2026-01-31|32500.00|45043.25"
date: 2026-01-31
amount: 32500.00
currency: DKK
description: Virksomhed A/S
raw_text: "Løn januar 2026"
bank: enable-banking
account: "eb-uid-abc123"
synced_at: 2026-02-02 14:00:00
```

### Enable Banking Subscription (API Sync, no balance — fallback hash)
```
tx_id: "f6a7b8c9-d0e1-2345-fabc-456789012345"
tx_hash: "eb-uid-abc123|2026-01-15|-149.00|netflix.com"
date: 2026-01-15
amount: -149.00
currency: DKK
description: Netflix
raw_text: "NETFLIX.COM"
bank: enable-banking
account: "eb-uid-abc123"
synced_at: 2026-02-02 14:00:00
```
