# Phase 3c + 3d: Email Receipts & Learning Invoice Parser — Implementation Plan

## Summary

Add vendor-specific invoice parsers with a learning loop, and Gmail-based receipt/invoice email scanning. Ships as plugin version 1.4.0.

**Scope**: Phase 3d (learning invoice parser) + Phase 3c (email receipt scanning). Phase 3b (grocery chains) skipped.

**New files**: 2 commands, 2 skills, vendor parser template + 3 pre-built parsers, spec docs
**Updated files**: receipt command, receipt-parsing skill, plugin manifest

## Tasks

### Task 1: Save spec documentation
Create `agent-os/specs/2026-02-01-receipt-email-and-learning-parser/` with plan.md, shape.md, standards.md, references.md.

### Task 2: Create invoice-knowledge/_template.md
Vendor parser template with sections for vendor info, invoice structure, extraction rules, learned corrections.

### Task 3: Pre-built PARSER.md files
TDC (telecom), HOFOR (water utility), Oersted (electricity) — populated from template with vendor-specific rules.

### Task 4: Create invoice-parsing skill
`skills/invoice-parsing/SKILL.md` — Parser lookup workflow, vendor detection, parser application, fallback behavior.

### Task 5: Create receipt learn command
`commands/receipt-learn.md` — Learning loop that creates/updates PARSER.md files from conversation corrections.

### Task 6: Update receipt command
`commands/receipt.md` — Add parser lookup between extraction and matching steps.

### Task 7: Create email-receipt-scanning skill
`skills/email-receipt-scanning/SKILL.md` — Gmail search queries, Danish sender patterns, deduplication.

### Task 8: Create receipt email command
`commands/receipt-email.md` — Gmail MCP integration for batch email receipt scanning.

### Task 9: Update receipt-parsing skill
`skills/receipt-parsing/SKILL.md` — Add invoice-parsing precedence note and email source examples.

### Task 10: Update plugin manifest
`.claude-plugin/plugin.json` — Version 1.2.0 to 1.4.0.

## Dependency Order

```
Task 1 (spec docs)              -- no deps
Task 2 (template)               -- no deps
Task 3 (pre-built parsers)      -- after Task 2
Task 4 (invoice-parsing skill)  -- after Task 2
Task 5 (receipt learn command)  -- after Tasks 2 + 4
Task 6 (update receipt command) -- after Task 4
Task 7 (email scanning skill)   -- no deps
Task 8 (receipt email command)  -- after Tasks 4 + 6 + 7
Task 9 (update receipt-parsing) -- after Task 4
Task 10 (update manifest)       -- after all
```

## Verification

1. All file paths referenced in commands resolve to real files
2. Vendor detection logic in invoice-parsing skill aligns with sender mapping in email-receipt-scanning skill
3. PARSER.md files match the template structure
4. receipts.csv schema already supports `source: email`
5. Package: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/ invoice-knowledge/`
6. Test `/smartspender:receipt upload` with a TDC PDF to verify parser lookup
7. Test `/smartspender:receipt learn` after making corrections
8. Test `/smartspender:receipt email` if Gmail MCP is available
