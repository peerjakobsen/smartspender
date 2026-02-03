# SmartSpender

![Claude Cowork Plugin](https://img.shields.io/badge/Claude-Cowork%20Plugin-blueviolet)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-alpha-orange)
![Language](https://img.shields.io/badge/language-Markdown-blue)

A Claude Cowork plugin that turns Danish bank statements into actionable financial insights.

## What it does

- **Sync transactions** from 50+ Danish banks via Enable Banking Open Banking API
- **Categorize spending** automatically using Danish merchant and category knowledge
- **Detect subscriptions** by analyzing recurring charge patterns
- **Cancel unwanted subscriptions** with guided browser automation
- **Generate reports** with monthly breakdowns, trends, and savings suggestions
- **Upload receipts** and get item-level spending breakdowns
- **Track payslips** for accurate pension tracking and salary growth analysis
- **Financial advice** based on Danish personal finance best practices

## Requirements

- [Claude Desktop](https://claude.ai/download) with Cowork enabled (Pro, Max, Team, or Enterprise)
- Python 3 (for Enable Banking API helper)
- Danish bank account supported by Enable Banking (Nykredit, Danske Bank, Nordea, Jyske Bank, Sydbank, Spar Nord, Lunar, and 50+ others)

## Installation

1. Download or clone this repo
2. Package the plugin: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/ invoice-knowledge/ payslip-knowledge/`
3. Upload `smartspender.zip` as a plugin in Claude Cowork
4. Run `/smartspender:add-account` to set up Enable Banking and connect your bank

## Commands

| Command | Description |
|---------|-------------|
| `/smartspender:add-account [bank]` | Set up Enable Banking and connect your bank |
| `/smartspender:sync` | Sync transactions via Enable Banking API |
| `/smartspender:analyze` | Categorize transactions and detect subscriptions |
| `/smartspender:overview [month]` | Spending summary with insights |
| `/smartspender:overview [month] --detailed` | Full monthly report with comparisons |
| `/smartspender:subscriptions` | List detected subscriptions |
| `/smartspender:cancel [service]` | Cancel a subscription with guided automation |
| `/smartspender:negotiate [service]` | Draft negotiation email to lower your bill |
| `/smartspender:advice` | Personalized financial advice |
| `/smartspender:receipt upload` | Upload and process a receipt |
| `/smartspender:receipt email` | Scan Gmail for receipt emails |
| `/smartspender:payslip upload` | Upload a payslip for pension tracking |
| `/smartspender:payslip history` | View salary and pension trends |

## Supported Banks

All Danish banks available via Enable Banking, including:

- Nykredit, Danske Bank, Nordea, Jyske Bank
- Sydbank, Spar Nord, Arbejdernes Landsbank
- Lunar, Bank Norwegian
- Plus 50+ smaller Danish banks through BEC/Bankdata

## Privacy

SmartSpender stores all financial data locally in CSV files in your working directory — no external databases, no cloud storage. Bank sync uses Enable Banking's PSD2-compliant Open Banking API — you authenticate directly with your bank via MitID, and SmartSpender never sees your bank credentials. Sessions last 90-180 days between re-authentication.

## License

MIT — see [LICENSE](LICENSE)
