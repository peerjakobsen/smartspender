# Product Roadmap

## Phase 1: MVP

Core workflows that deliver the primary value proposition:

- **Transaction Sync (Enable Banking)** -- Sync transactions from 50+ Danish banks via Enable Banking Open Banking API. Sessions last 90-180 days between MitID re-authentication.
- **Transaction Categorization** -- Categorize transactions using rule-based merchant matching, pattern detection, and intelligent classification with Danish merchant/category knowledge
- **Subscription Detection** -- Identify recurring charges by analyzing transaction patterns (frequency, amount, merchant)
- **Spending Overview** -- Generate spending summaries by category with month-over-month comparisons and subscription totals. Use `--detailed` flag for full monthly reports.
- **Subscription Cancellation** -- Guide users through cancelling unwanted subscriptions via browser automation with human-in-the-loop authentication
- **Local CSV Storage** -- Store all data (transactions, categories, subscriptions, summaries, action log) in local CSV files in the working directory
- **Financial Advice** -- Personalized financial guidance based on Danish 5-step framework

### MVP Slash Commands
- `/smartspender:add-account [bank]` — Add bank account (includes first-time Enable Banking setup)
- `/smartspender:sync`
- `/smartspender:analyze`
- `/smartspender:overview [month]` — Add `--detailed` for full monthly report
- `/smartspender:subscriptions`
- `/smartspender:cancel [service]`
- `/smartspender:advice`

### MVP Architecture

| Aspect | Approach |
|--------|----------|
| Bank sync | Enable Banking API (all banks, one adapter) |
| Auth frequency | Every 90-180 days |
| Speed | Fast (<5s per sync) |
| Reliability | Stable API |
| Bank coverage | 50+ Danish banks through BEC/Bankdata |

## Phase 2: Enhanced Features

### Post-Launch Enhancements
- Budget tracking with category limits and alerts
- Savings goals with progress tracking
- Bill reminders for upcoming recurring charges
- Multi-currency support for foreign transactions
- Investment/depot account tracking
- Tax preparation export (aarsopgoerelse)
- Family sharing for shared household expenses
- Merchant enrichment (logos, enhanced categories)
- Predictive spending forecasts based on patterns

## Phase 3: Receipt & Invoice Enrichment

Unlock detailed spending insights by parsing line-item data from receipts and invoices.

### The Problem
Bank transactions show aggregated amounts without detail:
- `FOETEX 4123 -847,50 kr` → No breakdown of alcohol vs. dairy vs. impulse buys
- `TDC A/S -549,00 kr` → No visibility into unused services or add-ons

### Value Proposition
| Without Receipt Data | With Receipt Data |
|---------------------|-------------------|
| "Du bruger 4.500 kr/md paa dagligvarer" | "Du bruger 800 kr/md paa alkohol og 600 kr paa snacks" |
| "TDC koster 549 kr/md" | "Du betaler for 3 tjenester du ikke bruger (149 kr/md)" |
| "Foetex 847 kr" | "23% af dit koeb var impulskoeb ved kassen" |

### Phase 3a: Direct Upload (Foundation)
- **Photo/Scan OCR** -- User uploads receipt image, Claude Vision extracts line items
- **PDF Invoice Parsing** -- Extract cost breakdowns from utility bills, telecom invoices
- **Transaction Matching** -- Link receipts to transactions by date ± 1 day and amount match
- **Receipt Items Storage** -- CSV files storing item-level data with categories/subcategories
- **Command: `/smartspender:receipt upload`** -- Upload and process a single receipt
- **Receipt Spending Breakdown** -- After upload, show subcategory spending breakdown (e.g., Alkohol 24%, Koed 13%) so users can see where their grocery money goes

### Phase 3b: Grocery Chain Integration
- **Coop Member Portal** -- Browser automation to extract receipts from coop.dk/medlem (Kvickly, Brugsen, Irma)
- **Command: `/smartspender:receipt coop`** -- Sync Coop receipts

### Phase 3c: Digital Invoice Sources
- **Email Attachment Processing** -- Gmail MCP to extract receipts from order confirmations
- **Command: `/smartspender:receipt email`** -- Scan Gmail for receipt attachments

### Phase 3d: Learning Invoice Parser

Invoices are discussed interactively with Cowork. As you verify and correct extractions, Cowork learns the structure. That knowledge persists for future invoices from the same vendor.

**The Loop:**
1. Upload invoice → Check `invoice-knowledge/{vendor}/PARSER.md`
2. If exists → Use learned structure, extract confidently
3. If not → Parse best-effort, discuss with user, verify
4. After verification → Save learnings to parser file

**Cowork for discovery, persist what it learns.** Same pattern that worked for the bank adapter.

**File Structure:**
```
invoice-knowledge/
├── tdc/
│   └── PARSER.md
├── hofor/
│   └── PARSER.md
├── orsted/
│   └── PARSER.md
└── _template.md
```

**Parser File Contents:**
- Vendor name and type
- Invoice structure (pages, sections)
- Extraction rules (what to pull, how to categorize)
- Learned corrections from user feedback
- Last updated timestamp

**Command: `/smartspender:receipt learn`** -- Save current conversation's learnings to parser file

### Data Architecture: Receipt Items Files
| Column | Type | Description |
|--------|------|-------------|
| receipt_id | string | Unique receipt identifier |
| transaction_id | string | Links to transactions.csv |
| source | string | upload/storebox/coop/eboks/email |
| item_name | string | "Oeko letmaelk 1L" |
| quantity | number | 2 |
| unit_price | number | 14.95 |
| total_price | number | 29.90 |
| category | string | Dagligvarer |
| subcategory | string | Mejeriprodukter |
| discount | number | -5.00 |
| created_at | datetime | When imported |

### Insights Enabled
- Grocery spending breakdown by product category (dairy, meat, alcohol, snacks, household)
- Telecom bill optimization (identify unused services, suggest plan changes)
- Utility consumption trends (electricity, water, heating over time)
- Impulse purchase detection (items near checkout, small add-ons)
- Brand loyalty analysis (where you spend most per category)

## Phase 4: Cost Optimization

### Phase 4a: Subscription Negotiation
- Negotiation email drafts with competitor research
- Danish consumer rights and negotiation tactics knowledge
- Command: `/smartspender:negotiate [service]`

### Future Phase 4 Features
- Price tracking over time
- Bulk negotiation suggestions
- Negotiation outcome tracking
- Phone script generation
- Automatic follow-up reminders
