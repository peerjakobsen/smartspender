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
- Merchant enrichment (logos, enhanced categories)
- Predictive spending forecasts based on patterns

## Phase 3: Receipt & Invoice Enrichment

Unlock detailed spending insights by parsing line-item data from receipts and invoices.

### The Problem
Bank transactions show aggregated amounts without detail:
- `FØTEX 4123 -847,50 kr` → No breakdown of alcohol vs. dairy vs. impulse buys
- `TDC A/S -549,00 kr` → No visibility into unused services or add-ons

### Value Proposition
| Without Receipt Data | With Receipt Data |
|---------------------|-------------------|
| "Du bruger 4.500 kr/md på dagligvarer" | "Du bruger 800 kr/md på alkohol og 600 kr på snacks" |
| "TDC koster 549 kr/md" | "Du betaler for 3 tjenester du ikke bruger (149 kr/md)" |
| "Føtex 847 kr" | "23% af dit køb var impulskøb ved kassen" |

### Phase 3a: Direct Upload (Foundation)
- **Photo/Scan OCR** -- User uploads receipt image, Claude Vision extracts line items
- **PDF Invoice Parsing** -- Extract cost breakdowns from utility bills, telecom invoices
- **Transaction Matching** -- Link receipts to transactions by date ± 1 day and amount match
- **ReceiptItems Sheet** -- New Google Sheet storing item-level data with categories/subcategories
- **Command: `/smartspender:receipt upload`** -- Upload and process a single receipt
- **Receipt Spending Breakdown** -- After upload, show subcategory spending breakdown (e.g., Alkohol 24%, Kød 13%) so users can see where their grocery money goes

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

**Cowork for discovery, persist what it learns.** Same pattern that worked for the Nykredit bank adapter.

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

### Data Architecture: ReceiptItems Sheet
| Column | Type | Description |
|--------|------|-------------|
| receipt_id | string | Unique receipt identifier |
| transaction_id | string | Links to Transactions sheet |
| source | string | upload/storebox/coop/eboks/email |
| item_name | string | "Øko letmælk 1L" |
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
