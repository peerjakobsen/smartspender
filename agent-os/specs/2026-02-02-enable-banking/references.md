# Phase 3e: Enable Banking Integration — References

## Existing Commands (Pattern References)

- `commands/sync.md` — Primary update target: add API sync path alongside browser export
- `commands/add-account.md` — Update target: add enable-banking as valid bank argument
- `commands/cancel.md` — Pattern reference: service argument lookup, user action points

## Existing Skills (Content References)

- `skills/transaction-schema/SKILL.md` — Schema to extend with Enable Banking hash examples
- `skills/sheets-schema/SKILL.md` — CSV schema to extend with new accounts.csv columns

## Bank Adapters (Pattern References)

- `banks/nykredit/BANK.md` — Reference implementation for browser-based adapter
- `banks/nykredit/export-format.md` — Reference for field mapping documentation
- `banks/nykredit/quirks.md` — Reference for quirks documentation
- `banks/_template.md` — Template for new bank adapters

## External References

- Enable Banking API: `https://enablebanking.com/docs/api/`
- Enable Banking Dashboard: `https://enablebanking.com/`
- PSD2 Rate Limits: Max 4 account information requests per day per account
- JWT Authentication: RSA-256 signed tokens for API access

## Data Files (Runtime)

- `transactions.csv` — Transaction storage (append target for API-sourced transactions)
- `accounts.csv` — Account registry (new columns: sync_method, eb_account_uid, eb_session_id)
- `action-log.csv` — Audit trail for sync actions

## Configuration Files (Outside Repo)

- `~/.config/smartspender/eb-config.json` — Application ID and RSA key path
- `~/.config/smartspender/eb-session.json` — Session data, account UIDs, consent expiry

## Plugin Manifest

- `.claude-plugin/plugin.json` — Must update version from 1.5.0 to 1.6.0
