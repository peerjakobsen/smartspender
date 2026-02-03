# Bank Adapter Template

## Purpose

This template is for the Enable Banking API adapter. All bank sync operations use the Enable Banking Open Banking API, which provides consistent access to 50+ Danish banks.

## Directory Structure

```
banks/enable-banking/
├── BANK.md              # API integration overview and supported banks
├── export-format.md     # API response mapping to common schema
└── quirks.md            # Bank-specific field variations
```

## BANK.md Template

```markdown
# Enable Banking Adapter

## Basic Info
- **Bank ID**: `enable-banking`
- **API Provider**: Enable Banking (enablebanking.com)
- **Authentication**: MitID via OAuth2 redirect flow
- **Session Duration**: 90-180 days depending on bank

## Supported Banks

Danish banks available via Enable Banking:
- Nykredit, Danske Bank, Nordea, Jyske Bank
- Sydbank, Spar Nord, Arbejdernes Landsbank
- Lunar, Bank Norwegian
- Plus 50+ smaller Danish banks through BEC/Bankdata

## API Flow

1. User creates Enable Banking account and application
2. User runs `eb-api.py auth --bank <aspsp>` to initiate MitID consent
3. Browser redirects to bank's MitID login
4. After consent, session token is stored locally
5. Transactions fetched via `eb-api.py transactions --account <uid> --from <date>`
6. Session valid for 90-180 days (bank-dependent)

## Session Notes
- **Session refresh**: Re-authenticate when session expires
- **Rate limits**: PSD2 limits to 4 requests per day per account
- **Consent scope**: Read-only access to account list and transactions
```

## export-format.md Template

```markdown
# Enable Banking Export Format

## Response Format
- **Type**: JSON (API response)
- **Decimal format**: Standard decimal (period separator)
- **Date format**: YYYY-MM-DD (ISO 8601)

## Transaction Fields

| API Field | Common Field | Transform |
|-----------|--------------|-----------|
| booking_date | date | Direct (already YYYY-MM-DD) |
| transaction_amount.amount | amount | Negate if credit_debit_indicator = DBIT |
| transaction_amount.currency | currency | Direct |
| creditor.name or debtor.name | description | Use creditor for DBIT, debtor for CRDT |
| remittance_information | raw_text | Join array with space |
| balance_after_transaction | (dedup) | Used for tx_hash computation |
| credit_debit_indicator | (direction) | DBIT = expense, CRDT = income |
| status | (filter) | Only include BOOK transactions |

## Sample Response

{
  "transactions": [
    {
      "entry_reference": "...",
      "booking_date": "2026-01-15",
      "value_date": "2026-01-15",
      "transaction_amount": {
        "amount": "847.50",
        "currency": "DKK"
      },
      "credit_debit_indicator": "DBIT",
      "status": "BOOK",
      "creditor": {
        "name": "FOETEX"
      },
      "remittance_information": ["Dankort-koeb FOETEX 4123"],
      "balance_after_transaction": {
        "amount": "12543.25",
        "credit_debit_indicator": "CRDT"
      }
    }
  ]
}
```

## quirks.md Template

```markdown
# Enable Banking Quirks

## Known Issues

### Balance Field Availability
Some banks don't provide `balance_after_transaction`. In this case, use the fallback hash formula with normalized raw_text.

### Merchant Name Variations
Different banks format creditor/debtor names differently:
- Some use uppercase (FOETEX)
- Some include location codes (FOETEX 4123)
- Some truncate names

## Bank-Specific Notes

### Nykredit
- Provides balance consistently
- Clean creditor names

### Danske Bank
- May include branch codes in names
- Balance usually available

### Lunar
- Clean JSON responses
- Balance not always available

## Tips

- Always check for balance_after_transaction before using primary hash formula
- Normalize merchant names for matching (uppercase, remove trailing codes)
- Filter to status = BOOK to avoid pending transactions
```
