# Enable Banking Adapter

## Basic Info
- **Bank ID**: `enable-banking`
- **Website**: https://enablebanking.com
- **API Base**: https://api.enablebanking.com
- **Sync Method**: API (not browser automation)
- **Authentication**: MitID via Enable Banking consent flow

## Prerequisites
- Python 3 installed
- `tools/eb-api.py` dependencies installed (`pip install requests PyJWT cryptography`)
- RSA private key configured at path specified in `~/.config/smartspender/eb-config.json`
- Enable Banking application created (restricted production mode)

## Auth Flow

### Initial Consent (one-time per 90-180 days)

1. Run: `python3 tools/eb-api.py auth --bank <ASPSPName>`
2. Script starts localhost listener on port 19876
3. Script opens browser to Enable Banking consent URL
4. **[USER ACTION]**: User completes MitID login in browser
5. **[USER ACTION]**: User grants consent to share account data
6. Bank redirects to `https://smartspender.mentilead.com/callback.html` (HTTPS relay page)
7. Relay page reads the authorization code and redirects browser to `http://localhost:19876/callback`
8. Script automatically captures code and creates session
9. Session stored in `~/.config/smartspender/eb-session.json`

> **Why the relay?** Enable Banking requires HTTPS redirect URLs. The relay page at `callback.html` receives the code over HTTPS and immediately forwards it to the localhost listener. If the redirect fails, the page displays the code with manual instructions.

### Re-consent (when session expires)

1. Run: `python3 tools/eb-api.py status` — check if session is expired
2. If expired, repeat the initial consent flow above
3. Existing account UIDs may change after re-consent — update accounts.csv

## Sync Flow

### Pre-sync checks

1. Run: `python3 tools/eb-api.py status`
2. Verify `status` is `active`
3. Check `days_remaining` — warn if under 7 days
4. Check `fetches_today` — warn if 3/4, abort if 4/4 (PSD2 limit)

### Fetch transactions

For each Enable Banking account in accounts.csv:

1. Get `eb_account_uid` from accounts.csv row
2. Get `last_synced` date (or default to 90 days ago if first sync)
3. Run: `python3 tools/eb-api.py transactions --account <uid> --from <last_synced_date>`
4. Parse the JSON output per `banks/enable-banking/export-format.md`
5. Only include transactions with `status: BOOK`
6. Normalize to common transaction schema per `skills/transaction-schema/SKILL.md`
7. Generate tx_hash using `balance_after_transaction` when available
8. Deduplicate against existing transactions.csv
9. Append new transactions
10. Update `last_synced` in accounts.csv

### Fetch balances (optional, after transactions)

1. Run: `python3 tools/eb-api.py balances --account <uid>`
2. Report current balance to user (informational only, not stored)

## Session Lifecycle

| Duration | Event |
|----------|-------|
| Day 0 | Consent granted via MitID |
| Day 1-89 | Session active, sync freely (4x/day limit) |
| Day 80 | Warn: "Samtykke udløber om {days} dage" |
| Day 90-180 | Session expires (varies by bank) |
| After expiry | Must re-consent via MitID |

## Supported Danish Banks

Use these names with `eb-api.py auth --bank`:

| Bank | ASPSP Name |
|------|-----------|
| Nykredit | `Nykredit` |
| Danske Bank | `Danske Bank` |
| Nordea | `Nordea` |
| Jyske Bank | `Jyske Bank` |
| Sydbank | `Sydbank` |
| Spar Nord | `Spar Nord` |
| Lunar | `Lunar` |
| Arbejdernes Landsbank | `Arbejdernes Landsbank` |

## eb-api.py Command Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `auth --bank <name>` | Initiate consent + localhost listener | `python3 tools/eb-api.py auth --bank Nykredit` |
| `session --code <code>` | Manual session creation (fallback) | `python3 tools/eb-api.py session --code abc123` |
| `status` | Check session validity | `python3 tools/eb-api.py status` |
| `accounts` | List linked accounts | `python3 tools/eb-api.py accounts` |
| `transactions --account <uid> --from <date>` | Fetch transactions | `python3 tools/eb-api.py transactions --account uid123 --from 2026-01-01` |
| `balances --account <uid>` | Fetch balances | `python3 tools/eb-api.py balances --account uid123` |

All commands output JSON to stdout. Parse the JSON to determine success (`status` field) or failure (`error` field).
