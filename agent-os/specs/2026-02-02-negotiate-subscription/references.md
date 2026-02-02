# Phase 4a: Subscription Negotiation — References

## Existing Commands (Pattern References)

- `commands/cancel.md` — Closest pattern: service argument lookup, subscription status check, user action points, action logging
- `commands/overview.md` — Pattern for reading categorized.csv and subscription data

## Existing Skills (Content References)

- `skills/subscription-detection/SKILL.md` — Subscription status definitions, detection criteria
- `skills/spending-analysis/SKILL.md` — Danish currency formatting rules, savings recommendation patterns
- `skills/categorization/SKILL.md` — Merchant normalization rules

## Invoice Knowledge (Data References)

- `invoice-knowledge/tdc/PARSER.md` — Example of vendor-specific parser with contact patterns
- `invoice-knowledge/hofor/PARSER.md` — Utility vendor parser
- `invoice-knowledge/orsted/PARSER.md` — Utility vendor parser

## Subscription Files (Domain References)

- `subscriptions/tdc.md` — Telecom subscription with retention tactics, pricing tiers
- `subscriptions/telenor.md` — Competitor reference for telecom negotiation
- `subscriptions/telia.md` — Competitor reference for telecom negotiation
- `subscriptions/netflix.md` — Streaming subscription reference
- `subscriptions/fitness-world.md` — Fitness subscription reference

## Standards

- `agent-os/standards/` — All standards files defining conventions for commands, skills, and content

## Data Files (Runtime)

- `subscriptions.csv` — Active/cancelled subscription records
- `categorized.csv` — Transaction history with categories
- `receipts.csv` — Receipt metadata for line-item detail
- `receipt-items-{YYYY-MM}.csv` — Receipt line items by month
- `action-log.csv` — Audit trail for negotiate actions

## Plugin Manifest

- `.claude-plugin/plugin.json` — Must update version for this release
