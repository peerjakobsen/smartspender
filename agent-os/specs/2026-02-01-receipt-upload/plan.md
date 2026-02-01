# Phase 3a: Receipt & Invoice Enrichment — Implementation Plan

## Summary

Add receipt upload capability to SmartSpender. Users paste a receipt photo or PDF invoice in chat, Claude Vision extracts line items, matches the receipt to an existing bank transaction, and stores item-level data in new CSV files.

**Scope**: Phase 3a only (direct upload). Storebox, Coop, e-Boks, email integrations are Phase 3b/3c.

**New files**: 1 command, 3 skills, spec docs
**Updated files**: sheets-schema skill, plugin manifest

## Tasks

### Task 1: Save spec documentation
Create `agent-os/specs/2026-02-01-receipt-upload/` with plan.md, shape.md, standards.md, references.md.

### Task 2: Create receipt-schema skill
`skills/receipt-schema/SKILL.md` — Define receipts.csv and receipt-items.csv schemas.

### Task 3: Create receipt-parsing skill
`skills/receipt-parsing/SKILL.md` — OCR extraction rules, product subcategory taxonomy, confidence scoring.

### Task 4: Create transaction-matching skill
`skills/transaction-matching/SKILL.md` — Rules for linking receipts to transactions.

### Task 5: Update sheets-schema skill
`skills/sheets-schema/SKILL.md` — Add receipts.csv and receipt-items.csv sections.

### Task 6: Create receipt command
`commands/receipt.md` — The `/smartspender:receipt upload` workflow.

### Task 7: Update plugin manifest
`.claude-plugin/plugin.json` — Bump version from 1.1.0 to 1.2.0.

### Task 8: Integration verification
Cross-check all files for consistency.

## Dependency Order

```
Task 1 (spec docs)             -- no deps
Task 2 (receipt-schema)        -- no deps
Task 3 (receipt-parsing)       -- after Task 2
Task 4 (transaction-matching)  -- after Task 2
Task 5 (update sheets-schema)  -- after Task 2
Task 6 (receipt command)       -- after Tasks 3 + 4
Task 7 (update manifest)       -- after Task 6
Task 8 (verification)          -- after all
```

Tasks 3, 4, 5 can run in parallel after Task 2.

## Verification

1. Review each new file against its corresponding standard
2. Verify all cross-references between files resolve to real paths
3. Package plugin: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/`
4. Upload to Cowork and test `/smartspender:receipt upload` with a real receipt image
5. Verify receipts.csv and receipt-items.csv are created with correct headers and data
6. Test transaction matching with synced transactions present
