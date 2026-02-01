# Command Design Principles

## Context

Commands are slash commands that users invoke directly. Each command triggers a specific workflow. This standard defines how to design commands that are intuitive and reliable.

## Design Principles

### One Command, One Job
Each command should do one clear thing. Don't combine unrelated actions.

**Good**: `/smartspender:sync nykredit` -- syncs transactions from one bank
**Bad**: `/smartspender:sync-and-analyze` -- combining two distinct workflows

### Predictable Arguments
Users should be able to guess valid arguments.

- Bank commands accept bank IDs: `nykredit`, `danske-bank`
- Time commands accept months: `january`, `2026-01`
- Service commands accept service names: `netflix`, `spotify`
- Use `all` as a special argument when applicable: `/smartspender:sync all`

### Clear Feedback
Every command should report what it did when finished.

**Good**: "Synced 47 new transactions from Nykredit (Jan 15 - Feb 1)"
**Bad**: "Done."

### Human-in-the-Loop by Default
Any step that requires authentication or irreversible action should pause for user confirmation.

**Required handoff points**:
- Bank login (MitID)
- Service login (for cancellation)
- Final cancellation confirmation
- Any action that spends money or changes account settings

### Graceful Failure
Commands should handle common failures explicitly:
- No internet / bank site down: "Could not reach Nykredit netbank. Please check your connection."
- Session expired: "Bank session has expired. Please log in again with MitID."
- No new data: "No new transactions found since last sync (Jan 28)."
- MCP not configured: "Google Sheets MCP is not configured. Run /smartspender:add-account first."

## Command Naming Rules

- Use verbs for actions: `sync`, `analyze`, `cancel`
- Use nouns for views: `overview`, `report`, `subscriptions`
- Keep names short -- one word when possible
- Use hyphens for multi-word: `add-account`
- Namespace: all commands use `/smartspender:` prefix

## Workflow Design Checklist

When designing a new command, answer these questions:
1. What triggers this command? (slash command, natural language, both?)
2. What data does it need? (Google Sheets, bank site, user input?)
3. Where are the human-in-the-loop points?
4. What does success look like? (what message does the user see?)
5. What can go wrong? (list failure modes and how to handle each)
6. What gets logged to the Action Log sheet?
