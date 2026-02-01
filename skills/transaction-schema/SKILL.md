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
| bank | string | yes | Bank identifier (e.g., `nykredit`) |
| account | string | yes | Account identifier from the bank |
| synced_at | datetime | yes | When the transaction was imported (YYYY-MM-DD HH:MM:SS) |

## Hash Computation

The `tx_hash` prevents duplicate imports across multiple sync runs.

### Primary formula (when bank provides running balance)

```
"{account}|{date}|{amount}|{saldo}"
```

Where:
- `account` is the account identifier from the bank export (e.g., `54740001351377`)
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

Before appending any row to transactions.csv, check whether a row with the same `tx_hash` already exists. If it does, skip the row.

## Transformation Rules

### Date Normalization
- Bank exports use various formats: DD-MM-YYYY (Nykredit), DD/MM/YYYY (others)
- Always convert to: **YYYY-MM-DD**
- Reject any date in the future — this likely indicates a parsing error

### Amount Normalization
- Danish number format uses period as thousands separator and comma as decimal: `1.234,56`
- Convert to standard decimal: `1234.56`
- Expenses are **negative**, income is **positive**
- Always store with exactly 2 decimal places
- Currency defaults to `DKK` unless the transaction specifies otherwise

### Description Cleaning
- Trim leading and trailing whitespace
- Collapse multiple consecutive spaces into one
- Preserve bank-specific prefixes that indicate payment method (e.g., `Debitcard DK` indicates card payment)
- Store the original unmodified text in `raw_text`
- Store the cleaned version in `description`

### Bank and Account Fields
- `bank` uses the lowercase bank identifier matching the adapter directory name: `nykredit`, `danske-bank`
- `account` uses the value from the bank's export column (e.g., the Exportkonto value from Nykredit)

## Validation Rules

Before storing a transaction, verify all of the following:
- `date` is a valid date and not in the future
- `amount` is a non-zero number
- `raw_text` is not empty
- `tx_hash` does not already exist in transactions.csv (deduplication)

If validation fails, log the issue but do not halt the entire sync — skip the invalid row and continue.

## Examples

### Nykredit Card Payment
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

### Nykredit Incoming Transfer
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

### Nykredit Bank Fee
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
