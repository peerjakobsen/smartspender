# Phase 3e: Enable Banking Integration — Shaping Notes

## Scope

Add Enable Banking (Open Banking API) as an alternative sync path alongside the existing Nykredit browser automation. A Python helper script (`tools/eb-api.py`) handles JWT signing and API calls. New bank adapter in `banks/enable-banking/`, new setup command, updated sync/add-account commands, and supporting skill + schema changes. Plugin version bump to 1.6.0.

**Includes**: 1 helper script, 3 bank adapter files, 1 skill, 1 command, updated sync + add-account commands, schema updates.
**Excludes**: Automatic bank detection, multi-country support, business account access.

## Key Decisions

### Python Helper Script for API Communication
`eb-api.py` handles all Enable Banking API communication — JWT generation, REST calls, session management. Same pattern as `uvx mcp-google-sheets`: infrastructure tooling that the plugin's markdown instructions orchestrate. Not included in the plugin zip.

### One Sync Method Per Account
Don't mix browser and API for the same bank account. Different source identifiers produce different tx_hashes, which would cause duplicate detection failures. Users choose one method when adding the account.

### Localhost Callback Listener
`eb-api.py auth` starts a temporary HTTP server on port 19876 to catch the Enable Banking redirect after MitID consent. Eliminates manual URL copying from the browser address bar.

### Session Persistence
`eb-session.json` stores session_id, account UIDs, consent expiry, and last-fetch timestamps. Enables rate limit tracking and consent renewal warnings. Lives in `~/.config/smartspender/`, never in the project directory.

### Credentials Outside Repo
RSA key and session data live in `~/.config/smartspender/`. `.gitignore` patterns as safety net. No secrets in the plugin directory.

### PSD2 Rate Limit Awareness
Track fetch count per account per day. Warn before 4th fetch. This is a PSD2 regulatory constraint, not a SmartSpender limitation.

## Context

- Builds on existing sync/add-account infrastructure and transaction schema
- Browser automation (Nykredit) remains the primary path — Enable Banking is an alternative for users who want faster, more reliable syncs
- Enable Banking's restricted production mode is free for personal use (linking your own bank accounts)
- PSD2 consent lasts 90-180 days depending on bank, then requires MitID re-consent
- Covers 2,500+ European banks including all major Danish banks via a single integration
