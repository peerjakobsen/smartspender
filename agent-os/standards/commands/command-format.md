# Command File Format

## Context

All command files follow a consistent markdown structure so Claude can execute them reliably. This standard defines the required and optional sections.

## Required Structure

```markdown
# /smartspender:[command]

## Trigger
How the user invokes this command (slash command and natural language alternatives).

## Arguments
What arguments the command accepts and their valid values.

## Workflow
Step-by-step instructions for Claude to follow.

## Output
What the user sees when the command completes.
```

## Section Guidelines

### Title
- Format: `# /smartspender:[command]`
- Include the full namespaced command name

### Trigger
- The primary slash command: `/smartspender:sync [bank]`
- Natural language alternatives: "sync my transactions", "download Nykredit data"
- List 2-3 natural language phrases users might say

### Arguments
- Use a table for structured argument documentation:

```markdown
| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| bank | yes | nykredit, danske-bank, nordea, all | - |
| period | no | 1m, 3m, 6m, 1y | 3m |
```

### Workflow
- Numbered steps that Claude follows in order
- Mark human-in-the-loop steps clearly: **[USER ACTION]**
- Reference specific bank adapters or skills by path: "Load `banks/nykredit/BANK.md`"
- Include error handling inline: "If no CSV downloads within 10 seconds, report timeout"

### Output
- Show the exact format of the success message
- Include an example with realistic data
- List possible error messages

## Optional Sections

### Prerequisites
What must be true before this command can run (e.g., "Google Sheets MCP must be configured").

### Side Effects
What changes this command makes (e.g., "Writes to Transactions sheet, logs to Action Log").

### Related Commands
Other commands the user might want to run after this one.

## Example Command File

```markdown
# /smartspender:sync

## Trigger
- `/smartspender:sync [bank]`
- "sync my transactions"
- "download transactions from Nykredit"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| bank | yes | nykredit, danske-bank, nordea, all | - |

## Prerequisites
- Google Sheets MCP configured
- Bank account added via /smartspender:add-account

## Workflow
1. Identify target bank from argument
2. Load bank adapter: `banks/{bank}/BANK.md`
3. Open bank netbank URL in browser
4. Announce: "Please log in with MitID. Let me know when you're logged in."
5. **[USER ACTION]**: User completes MitID login
6. **[USER ACTION]**: User confirms login complete
7. Navigate to export page (per bank adapter)
8. Execute export automation (per bank adapter)
9. Wait for CSV download
10. Parse CSV using `banks/{bank}/export-format.md`
11. Normalize to common transaction schema (per `skills/transaction-schema.md`)
12. Connect to Google Sheets via MCP
13. Deduplicate against existing data by tx_hash
14. Append new transactions to "Transactions" sheet
15. Log sync event to "Action Log" sheet

## Output
"Synced {count} new transactions from {bank} ({date_range})"

Example: "Synced 47 new transactions from Nykredit (Jan 15 - Feb 1)"

## Side Effects
- Writes to "Transactions" sheet
- Writes to "Action Log" sheet
```
