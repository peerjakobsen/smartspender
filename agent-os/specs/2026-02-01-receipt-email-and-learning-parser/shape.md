# Phase 3c + 3d: Email Receipts & Learning Invoice Parser — Shaping Notes

## Scope

Two phases shipping together:
- **Phase 3d**: Learning Invoice Parser — vendor-specific PARSER.md files, learning loop, pre-built parsers for TDC/HOFOR/Oersted
- **Phase 3c**: Digital Invoice Sources — Gmail MCP integration for scanning receipt/invoice emails

Phase 3d is ordered first because it creates the vendor parser infrastructure that email-imported invoices also use.

## Key Decisions

### invoice-knowledge/ as top-level directory
Same pattern as `banks/` and `subscriptions/`: a vendor directory with `_template.md` and `{vendor}/PARSER.md` files. Each vendor gets its own directory for future expansion (e.g., sample invoices, notes).

### Gmail MCP assumed available
Phase 3c commands fail gracefully if Gmail MCP is not configured. The skill documents required MCP tools and the command checks availability before proceeding.

### Email deduplication via last_email_scan timestamp
Stored in `settings.csv`, used for incremental scanning. Prevents re-processing emails already scanned in previous runs.

### Separate command files
`receipt-learn.md` and `receipt-email.md` as standalone command files (not merged into receipt.md), following single-responsibility principle. Each command has a distinct trigger and workflow.

### Pre-built parsers + learning loop
TDC, HOFOR, Oersted get pre-built PARSER.md files with vendor-specific extraction rules. New vendors use the learning loop — after a user corrects invoice extraction, `/receipt learn` captures those corrections as a new PARSER.md.

### Phase 3b skipped
Grocery chain integrations (Storebox, Coop app) skipped per user decision. May revisit later.

## Context

- SmartSpender already has receipt upload (`commands/receipt.md`) with Claude Vision extraction
- The existing receipt-parsing skill covers general extraction rules for groceries, telecom, utilities
- Vendor-specific parsers add structured extraction rules that improve accuracy for known vendors
- Gmail MCP provides email search, read, and attachment download capabilities
- All data lives as local CSV files — email receipts follow the same receipts.csv/receipt-items.csv schema

## What's Out of Scope

- Storebox integration (Phase 3b — skipped)
- Coop app receipt sync (Phase 3b — skipped)
- e-Boks invoice import (separate from email — may revisit)
- Receipt-level insights in overview/report commands (later phase)
- Bulk receipt import from filesystem
- Non-Gmail email providers
- Automatic periodic email scanning (user must invoke command)
