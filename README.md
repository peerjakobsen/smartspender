# SmartSpender 💰

![Claude Cowork Plugin](https://img.shields.io/badge/Claude-Cowork%20Plugin-blueviolet)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-alpha-orange)
![Language](https://img.shields.io/badge/language-Markdown-blue)

A Claude Cowork plugin that turns Danish bank statements into actionable financial insights.

## What it does

- **Sync transactions** from your netbank via browser automation (Nykredit supported, more banks coming)
- **Categorize spending** automatically using Danish merchant and category knowledge
- **Detect subscriptions** by analyzing recurring charge patterns
- **Cancel unwanted subscriptions** with guided browser automation
- **Generate reports** with monthly breakdowns, trends, and savings suggestions

## Requirements

- [Claude Desktop](https://claude.ai/download) with Cowork enabled (Pro, Max, Team, or Enterprise)
- [Claude in Chrome](https://chromewebstore.google.com/detail/claude/danfoaagkamggbpcigppcfchnamefnbcl) extension
- Nykredit netbank account (more banks planned)
- Google account (for Sheets data storage)

## Installation

1. Download or clone this repo
2. Package the plugin: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/`
3. Upload `smartspender.zip` as a plugin in Claude Cowork
4. Configure Google Sheets MCP with your credentials
5. Run `/smartspender:add-account nykredit` to get started

## Commands

| Command | Description |
|---------|-------------|
| `/smartspender:sync [bank]` | Sync transactions from your bank |
| `/smartspender:analyze` | Categorize transactions and detect subscriptions |
| `/smartspender:overview [month]` | Spending summary with insights |
| `/smartspender:subscriptions` | List detected subscriptions |
| `/smartspender:cancel [service]` | Cancel a subscription with guided automation |
| `/smartspender:report [month]` | Detailed monthly spending report |
| `/smartspender:add-account [bank]` | Set up a new bank account |

## Privacy

SmartSpender stores all financial data in your own Google Sheets — no external databases, no third-party services. The plugin never handles bank credentials; you authenticate directly with your bank via MitID. All agent actions are logged to an audit trail in your spreadsheet for full transparency.

## License

MIT — see [LICENSE](LICENSE)
