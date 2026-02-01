# Product Roadmap

## Phase 1: MVP

Core workflows that deliver the primary value proposition:

- **Transaction Sync (Nykredit)** -- Sync transactions from Nykredit netbank via browser automation, using the pre-configured "smartspender" export preset
- **Transaction Categorization** -- Categorize transactions using rule-based merchant matching, pattern detection, and intelligent classification with Danish merchant/category knowledge
- **Subscription Detection** -- Identify recurring charges by analyzing transaction patterns (frequency, amount, merchant)
- **Spending Overview** -- Generate spending summaries by category with month-over-month comparisons and subscription totals
- **Subscription Cancellation** -- Guide users through cancelling unwanted subscriptions via browser automation with human-in-the-loop authentication
- **Google Sheets Integration** -- Store all data (transactions, categories, subscriptions, summaries, action log) in the user's own Google Sheets via MCP
- **Monthly Reports** -- Generate comprehensive monthly spending reports

### MVP Slash Commands
- `/smartspender:sync [bank]`
- `/smartspender:analyze`
- `/smartspender:overview [month]`
- `/smartspender:subscriptions`
- `/smartspender:cancel [service]`
- `/smartspender:report [month]`
- `/smartspender:add-account [bank]`

## Phase 2: Post-Launch

### Additional Banks
- Danske Bank
- Nordea
- Jyske Bank
- Lunar (app-based -- may need manual CSV upload approach)
- Arbejdernes Landsbank

### Enhanced Features
- Budget tracking with category limits and alerts
- Savings goals with progress tracking
- Bill reminders for upcoming recurring charges
- Multi-currency support for foreign transactions
- Investment/depot account tracking
- Tax preparation export (årsopgørelse)
- Family sharing for shared household expenses
- Receipt matching (photo receipts to transactions)
- Merchant enrichment (logos, enhanced categories)
- Predictive spending forecasts based on patterns
