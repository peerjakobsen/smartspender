# SmartSpender

A Claude Cowork plugin for personal finance management. Danish bank customers. File-based architecture -- all components are markdown and JSON.

## Project Structure

- `agent-os/` -- Product spec, standards, and planning (development layer)
- `.claude-plugin/` -- Plugin manifest (Cowork runtime)
- `commands/` -- Slash commands (user-invoked workflows)
- `skills/` -- Domain knowledge (auto-activated by Claude)
- `banks/` -- Bank adapter (Enable Banking API)
- `subscriptions/` -- Subscription service cancellation instructions
- `invoice-knowledge/` -- Learned vendor-specific invoice parsers
- `tools/` -- Helper scripts (eb-api.py for Enable Banking API). Not included in plugin zip.

## Development Workflow

**Author in Claude Code. Test in Cowork.**

```
Plan    → /create-spec to design the command or skill
Author  → Write the markdown files following agent-os/standards/
Commit  → Git commit so you can roll back
Package → zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/
Upload  → Ask the user to upload smartspender.zip as a plugin in Claude Cowork
Test    → Invoke the command in Cowork, watch what happens
Log     → Record what worked and what broke in TEST_LOG.md
Refine  → Fix the instructions based on test results
          Repeat from Commit
```

Build one vertical slice at a time. Get `/smartspender:sync` working end-to-end before starting `/smartspender:analyze`.

## Key Constraints

- No application code -- only markdown and JSON files
- You're debugging instructions, not code. If Claude does the wrong thing, the fix is clearer markdown.
- Bank sync workflows require live MitID login -- can't be tested without the real bank site
- All data lives as local CSV files in the working directory
- Danish language for user-facing output, English for internal plugin files
