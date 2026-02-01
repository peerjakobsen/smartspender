# Phase 1 MVP — Applicable Standards

## All Standards Apply

All 25 standards in `agent-os/standards/` are relevant to the Phase 1 MVP.

## Standards by Category

### Plugin Standards
- `plugin/manifest.md` — plugin.json structure and field conventions
- `plugin/structure.md` — directory layout and file organization
- `plugin/naming.md` — file, command, and identifier naming rules

### Command Standards
- `commands/command-format.md` — required sections (Trigger, Arguments, Workflow, Output)
- `commands/command-design.md` — design principles (one job, predictable args, clear feedback)

### Skill Standards
- `skills/skill-format.md` — required sections (Purpose, Domain content, Examples)
- `skills/writing-skills.md` — how to write effective skills (specific, declarative, decision rules)

### Data Standards
- `data/transaction-format.md` — common transaction schema and transformation rules
- `data/sheets-schema.md` — Google Sheets structure and access patterns
- `data/mcp-config.md` — MCP server configuration conventions

### Bank Adapter Standards
- `bank-adapters/adapter-structure.md` — directory layout and required files
- `bank-adapters/export-format.md` — export parsing documentation rules

### Browser Automation Standards
- `browser-automation/javascript.md` — iframe handling, event dispatching, async patterns
- `browser-automation/navigation.md` — URL format, wait patterns, element identification
- `browser-automation/human-handoff.md` — authentication handoff patterns

### Content Standards
- `content/danish-content.md` — Danish language, categories, currency, date formatting
- `content/markdown-style.md` — markdown formatting conventions

### Global Standards
- `global/conventions.md` — cross-cutting conventions

## Key Standards per Task

| Task | Primary Standards |
|------|-------------------|
| Task 2: Plugin Foundation | `plugin/manifest.md`, `plugin/structure.md`, `data/mcp-config.md` |
| Task 3: Data Schema Skills | `skills/skill-format.md`, `data/transaction-format.md`, `data/sheets-schema.md` |
| Task 4: Nykredit Adapter | `bank-adapters/adapter-structure.md`, `browser-automation/javascript.md`, `browser-automation/navigation.md` |
| Task 5: Analysis Skills | `skills/skill-format.md`, `skills/writing-skills.md`, `content/danish-content.md` |
| Task 6: Core Commands | `commands/command-format.md`, `commands/command-design.md`, `browser-automation/human-handoff.md` |
| Task 7: Subscriptions | `plugin/naming.md`, `content/danish-content.md`, `content/markdown-style.md` |
| Task 8: Action Commands | `commands/command-format.md`, `commands/command-design.md` |
