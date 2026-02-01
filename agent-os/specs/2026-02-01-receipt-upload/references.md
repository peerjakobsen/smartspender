# Phase 3a: Receipt & Invoice Enrichment — References

## Existing Skills (Pattern References)

- `skills/categorization/SKILL.md` — Merchant-level categorization; receipt-parsing adds product-level subcategories
- `skills/sheets-schema/SKILL.md` — Must update; defines all CSV file schemas
- `skills/transaction-schema/SKILL.md` — Transaction data format; receipts link to transactions via tx_id
- `skills/subscription-detection/SKILL.md` — Pattern reference for detection/matching logic style
- `skills/spending-analysis/SKILL.md` — Analysis patterns; will consume receipt data in a later phase

## Existing Commands (Pattern References)

- `commands/sync.md` — Pattern reference for command structure, workflow steps, error handling
- `commands/analyze.md` — Pattern reference for data processing commands

## Standards

- `agent-os/standards/` — All standards files defining conventions for commands, skills, data, and content

## Plugin Manifest

- `.claude-plugin/plugin.json` — Must update version for this release

## Data Files (Runtime)

- `transactions.csv` — Source for transaction matching
- `categorized.csv` — Enriched transactions; receipt items provide deeper granularity
- `action-log.csv` — Audit trail; receipt commands log here
