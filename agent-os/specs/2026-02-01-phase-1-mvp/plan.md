# SmartSpender Phase 1 MVP — Implementation Plan

## Overview

Implement the complete Phase 1 MVP of SmartSpender, a Claude Cowork plugin for Danish personal finance. This is a **file-based architecture** — all deliverables are markdown (.md) and JSON files. No application code.

**Total files to create: ~45**
- 2 config files (plugin.json, .mcp.json)
- 7 command files
- 5 skill directories (each with SKILL.md)
- 4 bank adapter files (template + 3 Nykredit files)
- 22 subscription files (template + 21 services)
- Update: plugin structure standard (skill subdirectory format)

## Decisions

- **Browser automation**: Claude in Chrome (not Playwright MCP)
- **Skill format**: Subdirectory with SKILL.md (`skills/categorization/SKILL.md`)
- **Subscription scope**: All 21 services from the product spec
- **Visuals**: None needed

## Tasks

1. Save spec documentation
2. Plugin foundation (plugin.json, .mcp.json)
3. Data schema skills (transaction-schema, sheets-schema)
4. Nykredit bank adapter (BANK.md, export-format.md, quirks.md)
5. Categorization & analysis skills
6. Core commands (sync, analyze, overview)
7. Subscription knowledge base (21 services)
8. Action commands (subscriptions, cancel, report, add-account)
9. Integration verification

## Dependency Graph

```
Task 1: Spec docs (no deps)
Task 2: Foundation (no deps)
Task 3: Data Schema Skills (after Task 2)
Task 4: Nykredit Adapter (after Task 3)
Task 5: Analysis Skills (after Task 3)
Task 6: Core Commands (after Tasks 4 + 5)
Task 7: Subscription Knowledge (after Task 5, parallel with Task 6)
Task 8: Action Commands (after Tasks 6 + 7)
Task 9: Integration Check (after all)
```
