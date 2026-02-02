# Enable Banking Quirks

## Known Issues

### PSD2 Rate Limit: 4 Fetches Per Day Per Account
European regulation limits account information requests to 4 per day per account. `eb-api.py` tracks this in the session file and warns at 3/4, blocks at 4/4. Resets at midnight UTC. This cannot be worked around — it's enforced at the bank level.

### balance_after_transaction May Be Absent
Some banks or transaction types don't include the running balance. When missing, the tx_hash falls back to the `raw_text_normalized` formula instead of the `saldo` formula. This is less robust for deduplication (two identical purchases on the same day could collide), but it's the best available option.

### Transaction Descriptions Vary by Bank
The same bank may return different description text via API vs CSV export. For example, Nykredit CSV shows `Debitcard DK NORMAL FREDERIK` while the API might return `creditor.name: Normal` with `remittance_information: ["Dankort-køb"]`. This means tx_hashes from browser sync and API sync for the same transaction will differ — which is why you should not mix sync methods for the same account.

### Session Can Expire Prematurely
Banks can revoke consent at any time (e.g., user changed security settings, bank policy update). If `eb-api.py status` shows `active` but API calls return 403, the session has been revoked bank-side. Run `eb-api.py auth` to re-consent.

### One Sync Method Per Account
Never mix browser automation and API sync for the same bank account. Different sources produce different:
- Account identifiers (Nykredit export uses `Exportkonto`, EB uses `account_uid`)
- Transaction descriptions (formatting differs)
- Balance figures (timing differences)

This leads to duplicate transactions with different tx_hashes. Pick one method when adding the account and stick with it.

### ASPSP Names Are Case-Sensitive
`eb-api.py auth --bank nykredit` will fail. Use `Nykredit` with proper capitalization. Check the supported banks table in `banks/enable-banking/BANK.md` for correct names.

### Consent Duration Varies by Bank
PSD2 allows 90-180 day consent windows. Each bank chooses their own duration:
- Most Danish banks: 90 days
- Some banks: up to 180 days
- The exact expiry is in the session file after consent is granted

### Pending Transactions Appear and Disappear
Transactions with `status: PDNG` are not final. They may change amount, date, or be removed entirely. Only `BOOK` transactions are synced. If a user reports "missing" recent transactions, they may still be pending at the bank.

### HTTPS Redirect URL Required
Enable Banking requires HTTPS redirect URLs — `http://localhost` is rejected during application registration. SmartSpender uses an HTTPS relay page at `https://smartspender.mentilead.com/callback.html`. After MitID consent, the bank redirects to this page, which reads the `code` parameter and immediately redirects the browser to `http://localhost:19876/callback`. If the localhost redirect fails (e.g., `eb-api.py` isn't running), the relay page shows the authorization code with manual instructions.

### Port 19876 Must Be Available
The localhost callback listener uses port 19876. If another application is using this port, the auth flow will fail. The error message from `eb-api.py` will indicate the port is in use. Stop the conflicting application and retry.

### remittance_information Array Length Varies
Some transactions have 0 entries, some have 1, some have multiple. Always handle empty arrays. Join with space when constructing `raw_text`.

## Transaction Description Patterns

Enable Banking returns structured data rather than free-text descriptions. Common patterns:

- **Card payments**: `creditor.name` = merchant, `remittance_information` = ["Dankort-køb"] or ["Visa-køb"]
- **Transfers**: `debtor.name` or `creditor.name` = counterparty, `remittance_information` = transfer message
- **Direct debit (PBS/Betalingsservice)**: `creditor.name` = company, `remittance_information` = reference numbers
- **Salary**: `debtor.name` = employer, `remittance_information` = ["Løn {month}"]
- **Fees**: `creditor.name` = bank name, `bank_transaction_code.description` = fee type

## Tips

- Run `eb-api.py status` before every sync to catch expired sessions early
- Save your daily fetch for the evening to capture the most transactions
- After re-consent, run `eb-api.py accounts` to verify account UIDs haven't changed
- The `entry_reference` field is useful for matching with bank statements but is not used in the common schema
