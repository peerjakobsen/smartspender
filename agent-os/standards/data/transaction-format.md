# Common Transaction Format

## Context

All bank adapters normalize transactions into a common format before storing in Google Sheets. This standard defines that format and the transformation rules.

## Common Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tx_id | string | yes | Unique transaction ID (auto-generated UUID) |
| tx_hash | string | yes | Deduplication hash |
| date | date | yes | Transaction date (YYYY-MM-DD) |
| amount | number | yes | Amount with sign (negative = expense) |
| currency | string | yes | ISO currency code (default: DKK) |
| description | string | yes | Cleaned, human-readable description |
| raw_text | string | yes | Original text from bank export |
| bank | string | yes | Bank identifier (e.g., "nykredit") |
| account | string | yes | Account identifier from the bank |
| synced_at | datetime | yes | When the transaction was imported |

## Hash Computation

The `tx_hash` prevents duplicate imports across multiple sync runs. Compute it as:

### Primary formula (when bank provides running balance)

```
hash_input = "{account}|{date}|{amount}|{saldo}"
```

Where:
- `account` is the account identifier from the bank export (e.g., `54740001351377`)
- `date` is in YYYY-MM-DD format
- `amount` is formatted to exactly 2 decimal places (e.g., `-55.00`)
- `saldo` is the running balance after the transaction, formatted to exactly 2 decimal places (e.g., `927.83`)

**Example** (Nykredit bank fee):
`"54740001351377|2026-01-30|-55.00|927.83"`

The running balance is a natural disambiguator — even two identical purchases at the same merchant on the same day produce different balances.

### Fallback formula (when bank does not provide running balance)

```
hash_input = "{account}|{date}|{amount}|{raw_text_normalized}"
```

Where:
- `raw_text_normalized` is the raw_text trimmed and lowercased

**Example**: `"54740001351377|2026-01-15|-149.00|netflix.com"`

### Why account and saldo?

- `account` prevents cross-account collisions (e.g., identical fees on two accounts on the same day)
- `saldo` prevents same-merchant-same-day collisions (e.g., two coffees at Starbucks for the same amount — the balance after each differs)
- Saldo is standard in Danish bank CSV exports

## Transformation Rules

### Date Normalization
- Input varies by bank: DD-MM-YYYY (Nykredit), DD/MM/YYYY (others)
- Output always: YYYY-MM-DD
- Reject dates in the future (likely parsing error)

### Amount Normalization
- Convert Danish number format if needed: `1.234,56` -> `1234.56`
- Expenses are negative, income is positive
- Always store with exactly 2 decimal places
- Currency defaults to DKK unless the transaction specifies otherwise

### Description Cleaning
- Trim leading/trailing whitespace
- Collapse multiple spaces into one
- Remove bank-specific prefixes if they add no value (e.g., "Dankort-koeb" prefix can be preserved as it indicates payment method)
- Preserve the original in `raw_text`, put the cleaned version in `description`

### Bank and Account
- `bank` uses the bank identifier from the adapter: `nykredit`, `danske-bank`
- `account` uses the value from the bank's export (e.g., account number or name)

## Validation Rules

Before storing a transaction, verify:
- `date` is a valid date and not in the future
- `amount` is a non-zero number
- `raw_text` is not empty
- `tx_hash` does not already exist in the Transactions sheet
