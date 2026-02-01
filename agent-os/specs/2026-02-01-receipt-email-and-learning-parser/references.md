# Phase 3c + 3d: Email Receipts & Learning Invoice Parser — References

## Existing Skills (Pattern References)

- `skills/receipt-parsing/SKILL.md` — General extraction rules; invoice-parsing adds vendor-specific overrides
- `skills/receipt-schema/SKILL.md` — CSV schema for receipts.csv and receipt-items.csv; email receipts use same schema
- `skills/transaction-matching/SKILL.md` — Receipt-to-transaction matching; applies to email-imported receipts too
- `skills/categorization/SKILL.md` — Merchant-level categorization; vendor detection reuses normalization rules

## Existing Commands (Pattern References)

- `commands/receipt.md` — Phase 3a receipt upload; updated to include parser lookup
- `commands/sync.md` — Pattern reference for command structure and error handling
- `commands/analyze.md` — Pattern reference for batch data processing commands

## Existing Templates (Structural Patterns)

- `banks/_template.md` — Directory + template pattern used for invoice-knowledge/
- `subscriptions/_template.md` — Vendor-specific file pattern

## Plugin Manifest

- `.claude-plugin/plugin.json` — Must update version to 1.4.0

## Data Files (Runtime)

- `transactions.csv` — Source for transaction matching
- `receipts.csv` — Receipt metadata; email receipts append here with `source: email`
- `receipt-items.csv` — Receipt line items
- `settings.csv` — Stores `last_email_scan` timestamp for deduplication
- `action-log.csv` — Audit trail; receipt commands log here

## Previous Specs

- `agent-os/specs/2026-02-01-receipt-upload/` — Phase 3a spec; this phase extends that foundation
