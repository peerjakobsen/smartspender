# Plugin Directory Structure

## Context

SmartSpender follows the standard Cowork plugin structure. This standard defines how files and directories should be organized within the plugin.

## Required Structure

```
smartspender/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest (required)
├── .mcp.json                    # MCP connector configuration
├── commands/                    # Slash commands (user-invoked)
│   ├── sync.md
│   ├── analyze.md
│   ├── overview.md
│   ├── subscriptions.md
│   ├── cancel.md
│   ├── report.md
│   └── add-account.md
├── skills/                      # Domain knowledge (auto-activated)
│   ├── transaction-schema/
│   │   └── SKILL.md
│   ├── categorization/
│   │   └── SKILL.md
│   ├── spending-analysis/
│   │   └── SKILL.md
│   ├── subscription-detection/
│   │   └── SKILL.md
│   └── sheets-schema/
│       └── SKILL.md
├── banks/                       # Bank-specific adapters
│   ├── _template.md             # Template for new banks
│   └── nykredit/
│       ├── BANK.md              # Navigation and auth flow
│       ├── export-format.md     # CSV parsing rules
│       └── quirks.md            # Bank-specific issues
└── subscriptions/               # Subscription service knowledge
    ├── _template.md             # Template for new services
    ├── netflix.md
    └── ...
```

## Directory Purposes

### `.claude-plugin/`
Contains the `plugin.json` manifest. This is required by Cowork to recognize the directory as a plugin. Nothing else goes here.

### `commands/`
One file per slash command. Each file defines what happens when a user invokes `/smartspender:<command>`. Commands are user-initiated actions.

### `skills/`
Each skill gets its own subdirectory containing a `SKILL.md` file. This allows skills to grow with supporting files (lookup tables, examples) without restructuring. Claude loads skills automatically when their content is relevant to the current conversation.

### `banks/`
One subdirectory per supported bank. Each bank directory contains a standard set of files (BANK.md, export-format.md, quirks.md). The `_template.md` provides the starting point for adding new banks.

### `subscriptions/`
One file per subscription service with cancellation instructions. The `_template.md` provides the starting point for adding new services.

## Rules

- Never put application code in the plugin -- only markdown and JSON
- Keep the root directory clean; use subdirectories for grouping
- Every new bank gets its own subdirectory under `banks/`
- Every new subscription service gets its own file under `subscriptions/`
- Templates (prefixed with `_`) document the expected structure for new entries
- The `.mcp.json` lives at the plugin root, not inside `.claude-plugin/`
