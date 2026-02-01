# Tech Stack

## Platform

- **Runtime**: Claude Cowork (Anthropic's desktop AI environment)
- **Architecture**: Cowork Plugin (file-based, no code infrastructure)
- **Plugin SDK**: Claude Agent SDK via Cowork plugin system

## Plugin Components

- **Skills**: Markdown files providing domain knowledge (categorization, analysis, schemas)
- **Commands**: Markdown files defining slash commands (sync, analyze, overview, etc.)
- **Bank Adapters**: Markdown files with bank-specific navigation, export formats, and quirks
- **Subscription Knowledge**: Markdown files with cancellation flows per service
- **Plugin Manifest**: JSON configuration (plugin.json)

## Data & Integration

- **Data Storage**: Google Sheets (user's own Google account)
- **Data Connector**: MCP Google Sheets server (mcp-google-sheets)
- **MCP Config**: .mcp.json with Google Sheets server configuration

## Browser Automation

- **Browser Control**: Claude in Chrome extension
- **Bank Authentication**: MitID (handled by user, human-in-the-loop)
- **Page Interaction**: JavaScript execution within browser context (iframe-aware for Nykredit)

## Environment

- **OS**: macOS (Claude Desktop requirement)
- **Prerequisites**: Claude Pro/Max/Team/Enterprise subscription, Claude in Chrome extension, Google account
