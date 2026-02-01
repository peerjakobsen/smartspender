# Global Conventions

## Context

General conventions for developing the SmartSpender Cowork plugin. All components are file-based (markdown and JSON) -- there is no application code, backend, or frontend.

## File-Based Architecture

- All plugin logic lives in markdown (.md) and JSON files
- No compiled code, no servers, no infrastructure to deploy
- Claude interprets skill and command files at runtime
- Changes take effect immediately when files are saved

## Version Control

- Track all plugin files in git
- Write clear commit messages describing what changed and why
- Keep `.mcp.json` in the repo but never commit credentials or secrets
- Use `.gitignore` for `credentials.json`, `.env`, and any downloaded CSV files

## Documentation

- The `PRODUCT_SPEC.md` is the source of truth for product decisions
- Keep bank adapter files up to date when bank interfaces change
- Document quirks and workarounds as they are discovered
- Update `index.yml` when adding or removing standards

## File Organization

- One concern per file -- don't combine unrelated topics
- Use descriptive filenames that indicate content (e.g., `export-format.md` not `format.md`)
- Group related files in directories (e.g., all Nykredit files under `banks/nykredit/`)
- Keep the plugin root clean -- use subdirectories for organization

## Quality Standards

- Every skill and command file should be testable by invoking it in Cowork
- Prefer concrete examples over abstract descriptions
- Include "Quirks" or "Known Issues" sections when relevant
- Write for Claude as the reader -- be explicit about what to do and what to avoid
