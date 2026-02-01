# Plugin Manifest (plugin.json)

## Context

The `plugin.json` file inside `.claude-plugin/` is the manifest that Cowork reads to understand the plugin's capabilities. This standard defines conventions for maintaining it.

## Location

```
smartspender/.claude-plugin/plugin.json
```

## Required Fields

```json
{
  "name": "smartspender",
  "version": "1.0.0",
  "description": "Personal finance management for Danish bank customers.",
  "author": "Author Name",
  "requirements": {
    "cowork": ">=1.0.0",
    "connectors": ["google-sheets"],
    "browser": true
  },
  "commands": [],
  "skills": []
}
```

## Field Conventions

### `name`
- Lowercase, no spaces
- Must match the plugin directory name
- Used as the command namespace prefix: `/smartspender:<command>`

### `version`
- Follow semver: `major.minor.patch`
- Bump minor for new commands or skills
- Bump patch for fixes to existing files

### `description`
- One sentence, under 100 characters
- Describes what the plugin does, not how

### `requirements`
- `cowork`: Minimum Cowork version
- `connectors`: Array of MCP server names the plugin depends on
- `browser`: Set to `true` if the plugin uses Claude in Chrome

### `commands`
- Array of command names (without the namespace prefix)
- Must match filenames in `commands/` (e.g., `"sync"` maps to `commands/sync.md`)
- Keep this list in sync when adding or removing commands

### `skills`
- Array of skill names
- Must match filenames in `skills/` (e.g., `"categorization"` maps to `skills/categorization.md`)
- Keep this list in sync when adding or removing skills

## Maintenance Rules

- Update `commands` and `skills` arrays whenever files are added or removed
- Bump the version on every meaningful change
- Do not add fields that Cowork does not recognize -- stick to the documented schema
