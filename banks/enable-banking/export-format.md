# Enable Banking Export Format

## Data Format
- **Type**: JSON (API response, not CSV file)
- **Encoding**: UTF-8
- **Date format**: YYYY-MM-DD (ISO 8601, no conversion needed)
- **Decimal separator**: Period (no conversion needed)
- **Amount sign**: Always positive — use `credit_debit_indicator` for sign

## Transaction JSON Structure

Each transaction in the API response:

```json
{
  "bank_transaction_code": {"code": "12", "description": "Kortbetaling"},
  "booking_date": "2026-01-15",
  "credit_debit_indicator": "DBIT",
  "creditor": {"name": "FØTEX"},
  "debtor": {"name": "Peer Jakobsen"},
  "entry_reference": "5561990681",
  "remittance_information": ["Dankort-køb", "FØTEX 4123"],
  "status": "BOOK",
  "transaction_amount": {"amount": "847.50", "currency": "DKK"},
  "balance_after_transaction": {"amount": "12543.25", "currency": "DKK", "credit_debit_indicator": "CRDT"},
  "value_date": "2026-01-15"
}
```

## Field Mapping to Common Schema

| API Field | Common Field | Transform |
|-----------|--------------|-----------|
| `booking_date` | `date` | Direct (already YYYY-MM-DD) |
| `transaction_amount.amount` + `credit_debit_indicator` | `amount` | Parse float, negate if `DBIT` |
| `transaction_amount.currency` | `currency` | Direct |
| `creditor.name` or `debtor.name` | `description` | Use `creditor.name` for DBIT, `debtor.name` for CRDT. Fall back to first entry in `remittance_information` |
| `remittance_information` | `raw_text` | Join array with space: `" ".join(remittance_information)` |
| (from accounts.csv) | `bank` | `enable-banking` |
| `eb_account_uid` (from accounts.csv) | `account` | The Enable Banking account UID |
| `balance_after_transaction.amount` + indicator | (dedup) | Running balance for tx_hash. Use sign: positive if `CRDT`, negative if `DBIT` |

## Amount Computation

1. Parse `transaction_amount.amount` as float (e.g., `"847.50"` → `847.50`)
2. Check `credit_debit_indicator`:
   - `DBIT` → negate: `-847.50` (expense)
   - `CRDT` → keep positive: `847.50` (income)
3. Format to exactly 2 decimal places

## Balance Computation (for tx_hash)

1. If `balance_after_transaction` is present:
   - Parse `balance_after_transaction.amount` as float
   - Check `balance_after_transaction.credit_debit_indicator`:
     - `CRDT` → positive balance
     - `DBIT` → negative balance (overdrawn)
   - Use this as the saldo in the primary tx_hash formula
2. If `balance_after_transaction` is absent:
   - Use the fallback tx_hash formula with `raw_text_normalized`

## Description Construction

Priority order for the `description` field:

1. For **DBIT** (expense): use `creditor.name` if present
2. For **CRDT** (income): use `debtor.name` if present
3. If neither present: use first entry from `remittance_information`
4. If all empty: use `bank_transaction_code.description`

Clean the description: trim whitespace, collapse multiple spaces.

## Status Filtering

| Status | Include? | Reason |
|--------|----------|--------|
| `BOOK` | Yes | Booked, final transaction |
| `PDNG` | No | Pending, may change or disappear |
| `INFO` | No | Informational, not a real transaction |

Only process transactions where `status` equals `BOOK`.

## Pagination

The transactions endpoint may return a `continuation_key` in the response. If present, there are more transactions to fetch. `eb-api.py` handles pagination automatically — the output contains all transactions across all pages.

## Sample Transactions

### Card Payment (DBIT)
```json
{
  "booking_date": "2026-01-15",
  "credit_debit_indicator": "DBIT",
  "creditor": {"name": "FØTEX"},
  "remittance_information": ["Dankort-køb", "FØTEX 4123"],
  "status": "BOOK",
  "transaction_amount": {"amount": "847.50", "currency": "DKK"},
  "balance_after_transaction": {"amount": "12543.25", "currency": "DKK", "credit_debit_indicator": "CRDT"}
}
```
→ `date: 2026-01-15, amount: -847.50, description: FØTEX, raw_text: "Dankort-køb FØTEX 4123"`

### Incoming Transfer (CRDT)
```json
{
  "booking_date": "2026-01-31",
  "credit_debit_indicator": "CRDT",
  "debtor": {"name": "Virksomhed A/S"},
  "remittance_information": ["Løn januar 2026"],
  "status": "BOOK",
  "transaction_amount": {"amount": "32500.00", "currency": "DKK"},
  "balance_after_transaction": {"amount": "45043.25", "currency": "DKK", "credit_debit_indicator": "CRDT"}
}
```
→ `date: 2026-01-31, amount: 32500.00, description: Virksomhed A/S, raw_text: "Løn januar 2026"`

### Subscription (DBIT, no balance_after_transaction)
```json
{
  "booking_date": "2026-01-15",
  "credit_debit_indicator": "DBIT",
  "creditor": {"name": "Netflix"},
  "remittance_information": ["NETFLIX.COM"],
  "status": "BOOK",
  "transaction_amount": {"amount": "149.00", "currency": "DKK"}
}
```
→ `date: 2026-01-15, amount: -149.00, description: Netflix, raw_text: "NETFLIX.COM"`
→ Uses fallback tx_hash (no `balance_after_transaction`)
