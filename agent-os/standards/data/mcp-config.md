# MCP Server Configuration Standards

## Context

SmartSpender connects to Google Sheets via an MCP (Model Context Protocol) server. This standard defines how MCP configuration should be structured and maintained.

## Configuration File

MCP servers are configured in `.mcp.json` at the plugin root:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "uvx",
      "args": ["mcp-google-sheets@latest"],
      "env": {
        "DRIVE_FOLDER_ID": "${SMARTSPENDER_DRIVE_FOLDER}",
        "SERVICE_ACCOUNT_PATH": "${SMARTSPENDER_CREDENTIALS}"
      }
    }
  }
}
```

## Configuration Rules

### Environment Variables
- Never hardcode credentials or IDs in `.mcp.json`
- Use environment variable references: `${VARIABLE_NAME}`
- Required environment variables for SmartSpender:
  - `SMARTSPENDER_DRIVE_FOLDER` -- Google Drive folder ID containing the spreadsheet
  - `SMARTSPENDER_CREDENTIALS` -- Path to the Google service account credentials JSON file

### Credentials Security
- The `credentials.json` file must never be committed to git
- Add to `.gitignore`: `credentials.json`, `*.credentials.json`
- Store credentials in a standard location: `~/.config/smartspender/credentials.json`
- The service account must have edit access to the SmartSpender spreadsheet

### Server Versions
- Use `@latest` for the MCP server package during development
- Pin to a specific version for stability once the plugin is working: `mcp-google-sheets@1.2.3`

## Adding New MCP Servers

If future features require additional MCP servers (e.g., email for reports):

1. Add the server configuration to `.mcp.json` under `mcpServers`
2. Document required environment variables
3. Update the `requirements.connectors` array in `plugin.json`
4. Add setup instructions to the plugin README

## Troubleshooting

Common MCP issues to document in adapter/command files:
- "MCP server not running" -- the server process hasn't started
- "Permission denied" -- service account doesn't have access to the spreadsheet
- "Spreadsheet not found" -- wrong DRIVE_FOLDER_ID or spreadsheet hasn't been shared
- "Rate limit exceeded" -- too many rapid reads/writes to Google Sheets
