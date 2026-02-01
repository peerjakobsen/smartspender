# SmartSpender — Product Specification

## Overview

**SmartSpender** is a personal finance management plugin for **Claude Cowork**, Anthropic's agentic desktop automation tool. It helps Danish bank customers gain visibility into their spending, identify recurring subscriptions, and take action to optimize their finances. The agent operates with a human-in-the-loop model where the user handles authentication (MitID/bank login) and the agent handles navigation, data extraction, analysis, and action execution.

SmartSpender is built on the **Cowork plugin architecture** released by Anthropic on January 30, 2026, which enables specialized AI assistants for knowledge workers.

## Platform Foundation: Claude Cowork & Plugins

### What is Claude Cowork?

Claude Cowork is Anthropic's desktop AI environment launched January 12, 2026. Key characteristics:

- **Agentic automation**: Unlike traditional chatbots, Cowork can plan and execute multi-step workflows autonomously
- **Local file access**: Works directly with files and folders on the user's machine in a sandboxed environment
- **Browser automation**: Via Claude in Chrome extension, can navigate websites and interact with web applications
- **Built on Claude Code**: Uses the same Claude Agent SDK, bringing developer-grade automation to non-technical users
- **Research preview**: Currently available to Pro, Max, Team, and Enterprise Claude subscribers

### What are Cowork Plugins?

On January 30, 2026, Anthropic released the plugin system for Cowork, enabling specialized AI assistants:

- **Plugins bundle**: Skills, data connectors (MCP), slash commands, and sub-agents for specific job functions
- **Customizable**: Organizations can adapt plugins for their specific tools, terminology, and workflows
- **File-based**: All components are simple markdown and JSON files — no code, no infrastructure
- **Shareable**: Easy to build, edit, and share (organization-wide sharing coming soon)
- **Open source**: Anthropic released 11 reference plugins on GitHub

As Anthropic describes it: *"Plugins let you tell Claude how you like work done, which tools and data to pull from, how to handle critical workflows, and what slash commands to expose so your team gets more consistent outcomes."*

### Why Build SmartSpender as a Cowork Plugin?

1. **Native integration**: Runs within Claude Desktop, no separate app needed
2. **Browser automation**: Claude in Chrome handles bank navigation and subscription cancellation
3. **MCP connectors**: Native support for Google Sheets integration via MCP servers
4. **Human-in-the-loop**: Built-in pattern for user authentication handoff
5. **Persistent context**: Plugin skills and knowledge persist across sessions
6. **Extensible**: Easy to add new banks, categories, and subscription services

### Reference: Anthropic's Open Source Plugins

Anthropic released these 11 plugins as starting points (available at github.com/anthropics/knowledge-work-plugins):

| Plugin | Purpose |
|--------|---------|
| productivity | Tasks, calendars, daily workflows |
| sales | Prospect research, CRM integration, call prep |
| customer-support | Ticket triage, response drafting |
| product-management | Specs, roadmaps, user research |
| marketing | Content drafting, campaign planning |
| legal | Contract review, compliance |
| finance | Journal entries, reconciliation |
| data | SQL queries, dashboards, analysis |
| enterprise-search | Cross-tool search |
| bio-research | Life sciences R&D |
| cowork-plugin-management | Create and customize plugins |

**SmartSpender** follows the same architecture to create a specialized personal finance assistant.

---

## Vision

Transform fragmented bank statements into actionable financial insights. Most people don't know what they actually spend money on. SmartSpender answers: "Where does my money go?" and then helps do something about it.

## Target User

- Danish residents with Danish bank accounts
- Uses online banking (netbank)
- Has multiple subscriptions (streaming, fitness, apps, etc.)
- Wants better control over spending but doesn't have time for manual tracking
- Comfortable with AI assistance and human-in-the-loop workflows
- Claude Pro/Max/Team/Enterprise subscriber with Cowork access

## Core Value Propositions

1. **Visibility**: See all spending categorized and summarized
2. **Detection**: Automatically find subscriptions and recurring charges
3. **Insights**: Get suggestions for potential savings
4. **Action**: Actually cancel unwanted subscriptions with agent assistance

---

## Plugin Architecture

### Directory Structure

SmartSpender follows the standard Cowork plugin structure:

```
smartspender/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── .mcp.json                    # MCP connector configuration (Google Sheets)
├── commands/                    # Slash commands (user-invoked actions)
│   ├── sync.md                  # /smartspender:sync [bank]
│   ├── analyze.md               # /smartspender:analyze
│   ├── overview.md              # /smartspender:overview [month]
│   ├── subscriptions.md         # /smartspender:subscriptions
│   ├── cancel.md                # /smartspender:cancel [service]
│   ├── report.md                # /smartspender:report [month]
│   └── add-account.md           # /smartspender:add-account [bank]
├── skills/                      # Domain knowledge (auto-activated when relevant)
│   ├── transaction-schema.md    # Common data format
│   ├── categorization.md        # How to categorize transactions
│   ├── spending-analysis.md     # How to analyze spending patterns
│   ├── subscription-detection.md # How to detect recurring charges
│   └── sheets-schema.md         # Google Sheets structure
├── banks/                       # Bank-specific adapters
│   ├── _template.md             # Template for adding new banks
│   ├── nykredit/
│   │   ├── BANK.md              # Navigation and auth flow
│   │   ├── export-format.md     # CSV parsing rules
│   │   └── quirks.md            # Bank-specific issues
│   ├── danske-bank/
│   │   └── ...
│   └── nordea/
│       └── ...
└── subscriptions/               # Subscription service knowledge
    ├── _template.md             # Template for adding services
    ├── netflix.md
    ├── spotify.md
    ├── viaplay.md
    ├── fitness-world.md
    └── ...
```

### Plugin Manifest (plugin.json)

```json
{
  "name": "smartspender",
  "version": "1.0.0",
  "description": "Personal finance management for Danish bank customers. Sync transactions, analyze spending, detect subscriptions, and take action.",
  "author": "Your Name",
  "homepage": "https://github.com/yourusername/smartspender",
  "requirements": {
    "cowork": ">=1.0.0",
    "connectors": ["google-sheets"],
    "browser": true
  },
  "commands": [
    "sync",
    "analyze", 
    "overview",
    "subscriptions",
    "cancel",
    "report",
    "add-account"
  ],
  "skills": [
    "transaction-schema",
    "categorization",
    "spending-analysis",
    "subscription-detection",
    "sheets-schema"
  ]
}
```

### MCP Configuration (.mcp.json)

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

---

## Workflows

### Workflow 1: Sync Transactions

**Trigger**: User invokes `/smartspender:sync nykredit` or "sync my Nykredit transactions"

**Flow**:
1. Agent identifies the target bank from command or context
2. Agent loads bank adapter from `/banks/{bank}/BANK.md`
3. Agent opens the bank's netbank URL in browser (via Claude in Chrome)
4. Agent announces: "Please log in with MitID. Let me know when you're logged in."
5. User completes MitID authentication
6. User confirms login complete
7. Agent navigates to transaction history / account overview
8. Agent either:
   - Downloads CSV export if available, OR
   - Scrapes transaction table from the page
9. Agent parses transactions using bank-specific adapter (`export-format.md`)
10. Agent normalizes to common transaction schema
11. Agent connects to Google Sheets via MCP
12. Agent deduplicates against existing data (by transaction hash)
13. Agent appends new transactions to "Transactions" sheet
14. Agent logs sync event to "Action Log" sheet
15. Agent reports: "Synced 47 new transactions from Nykredit (Jan 15 - Feb 1)"

**Human-in-the-loop touchpoints**:
- User performs MitID/bank login
- User confirms when login is complete

### Workflow 2: Analyze Spending

**Trigger**: User invokes `/smartspender:analyze` or "analyze my spending"

**Flow**:
1. Agent reads transactions from Google Sheets via MCP
2. Agent loads categorization skill
3. Agent categorizes each uncategorized transaction:
   - Match merchant name against known merchants database
   - Apply category rules
   - Use context clues from description
4. Agent detects recurring transactions (subscription pattern detection)
5. Agent updates "Categorized" sheet with categories via MCP
6. Agent updates "Subscriptions" sheet with detected recurring charges
7. Agent calculates aggregations for "Monthly Summary" sheet
8. Agent logs analysis run to "Action Log"
9. Agent presents summary to user

**Categorization approach**:
- Rule-based matching first (known merchants)
- Pattern matching for common transaction types
- Fallback to intelligent classification based on description
- User can correct categories, which improves future matching

### Workflow 3: Overview / Report

**Trigger**: User invokes `/smartspender:overview` or "show me my spending overview"

**Flow**:
1. Agent reads from Google Sheets (Monthly Summary, Subscriptions) via MCP
2. Agent generates spending breakdown by category
3. Agent highlights:
   - Top spending categories
   - Month-over-month changes
   - Unusual transactions
   - Subscription total (monthly/yearly)
4. Agent identifies potential savings:
   - Unused subscriptions (if usage data available)
   - Duplicate services (multiple streaming, etc.)
   - Price increases
   - Forgotten trials that converted to paid
5. Agent presents actionable recommendations

**Output format**:
```
## February 2026 Overview

**Total Spending**: 28,450 kr

### By Category
- Housing: 12,000 kr (42%)
- Groceries: 4,200 kr (15%)
- Transport: 2,100 kr (7%)
- Subscriptions: 1,847 kr (6%)
- Dining: 1,650 kr (6%)
- ...

### Subscriptions (18 active)
| Service | Monthly | Annual | Status |
|---------|---------|--------|--------|
| Netflix | 149 kr | 1,788 kr | Active |
| Spotify Family | 179 kr | 2,148 kr | Active |
| Viaplay | 99 kr | 1,188 kr | ⚠️ No usage 3 months |
| Fitness World | 299 kr | 3,588 kr | Active |
| ...

### Suggested Actions
1. Cancel Viaplay — Save 1,188 kr/year
2. Review Adobe CC — 459 kr/month seems high
3. Consolidate streaming? Netflix + HBO + Viaplay = 397 kr/month
```

### Workflow 4: Cancel Subscription

**Trigger**: User invokes `/smartspender:cancel viaplay` or "cancel Viaplay"

**Flow**:
1. Agent looks up service in Subscriptions sheet via MCP
2. Agent loads cancellation instructions from `/subscriptions/{service}.md`
3. Agent opens service website in browser (via Claude in Chrome)
4. Agent announces: "Please log in to Viaplay. Let me know when ready."
5. User logs in
6. User confirms login complete
7. Agent navigates to account/subscription settings
8. Agent initiates cancellation flow
9. Agent handles confirmation dialogs, retention offers
10. If final confirmation requires user action, agent pauses: "Please confirm the cancellation on screen"
11. Agent verifies cancellation success
12. Agent updates Subscriptions sheet via MCP: status → "cancelled", cancelled_date
13. Agent logs action to Action Log: action type, service, date, outcome
14. Agent reports: "Successfully cancelled Viaplay. You'll save 1,188 kr/year."

**Human-in-the-loop touchpoints**:
- User performs service login
- User confirms final cancellation step if required
- User handles any CAPTCHA or verification

### Workflow 5: Monthly Report

**Trigger**: Scheduled or on-demand via `/smartspender:report january`

**Flow**:
1. Agent compiles data for specified month from Google Sheets via MCP
2. Agent generates comprehensive report including:
   - Spending summary
   - Category breakdown
   - Comparison to previous month
   - Subscription changes
   - Actions taken and savings achieved
   - Recommendations for next month
3. Agent can output as:
   - Chat summary
   - New sheet in the spreadsheet
   - Markdown document

---

## Data Architecture

### Google Sheets Structure

**Spreadsheet**: "SmartSpender - [Year]"

#### Sheet: Transactions (raw data)
| Column | Type | Description |
|--------|------|-------------|
| tx_id | string | Unique transaction ID (auto-generated) |
| tx_hash | string | Dedup hash (date + amount + raw_text) |
| date | date | Transaction date |
| amount | number | Amount (negative = expense) |
| currency | string | Currency code (DKK, EUR) |
| description | string | Cleaned description |
| raw_text | string | Original bank description |
| bank | string | Bank identifier |
| account | string | Account identifier |
| synced_at | datetime | Import timestamp |

#### Sheet: Categorized (enriched transactions)
| Column | Type | Description |
|--------|------|-------------|
| tx_id | string | Reference to Transactions |
| date | date | Transaction date |
| amount | number | Amount |
| description | string | Description |
| category | string | Assigned category |
| subcategory | string | Optional subcategory |
| merchant | string | Normalized merchant name |
| is_recurring | boolean | Detected as recurring |
| confidence | number | Categorization confidence (0-1) |
| manual_override | boolean | User corrected this |

#### Sheet: Subscriptions
| Column | Type | Description |
|--------|------|-------------|
| subscription_id | string | Unique ID |
| merchant | string | Service name |
| category | string | Subscription category |
| amount | number | Recurring amount |
| frequency | string | monthly, yearly, weekly |
| annual_cost | number | Calculated annual cost |
| first_seen | date | First transaction date |
| last_seen | date | Most recent transaction |
| status | string | active, cancelled, paused |
| cancelled_date | date | When cancelled (if applicable) |
| notes | string | Any notes |

#### Sheet: Monthly Summary
| Column | Type | Description |
|--------|------|-------------|
| month | string | YYYY-MM |
| category | string | Spending category |
| total | number | Total spent |
| transaction_count | number | Number of transactions |
| avg_transaction | number | Average transaction size |
| vs_prev_month | number | Change from previous month |
| vs_prev_month_pct | number | Percentage change |

#### Sheet: Action Log
| Column | Type | Description |
|--------|------|-------------|
| timestamp | datetime | When action occurred |
| action_type | string | sync, analyze, cancel, suggest, etc. |
| target | string | What the action targeted |
| status | string | suggested, in_progress, completed, failed |
| details | string | Additional details |
| savings_amount | number | Estimated or actual savings |
| notes | string | Any notes |

#### Sheet: Accounts
| Column | Type | Description |
|--------|------|-------------|
| account_id | string | Unique account identifier |
| bank | string | Bank identifier |
| account_name | string | User-friendly name |
| account_type | string | checking, savings, credit |
| last_synced | datetime | Last successful sync |
| is_active | boolean | Currently tracked |

#### Sheet: Settings
| Column | Type | Description |
|--------|------|-------------|
| setting_key | string | Setting name |
| setting_value | string | Setting value |
| updated_at | datetime | Last updated |

Settings include:
- default_currency: DKK
- categorization_confidence_threshold: 0.7
- subscription_detection_months: 3
- preferred_language: da

---

## Bank Adapter System

### Purpose
Each Danish bank has different netbank interfaces and export formats. Adapters normalize these differences. This follows the same pattern as Anthropic's plugin architecture — domain knowledge encoded in markdown files.

### Adapter Structure

For each supported bank, maintain:

#### 1. Bank Profile (BANK.md)
```markdown
# [Bank Name] Adapter

## Basic Info
- Bank ID: [lowercase identifier]
- Website: [main website]
- Netbank URL: [login URL]
- Authentication: MitID / Bank-specific

## Navigation Flow
1. Navigate to: [netbank URL]
2. Wait for: User completes MitID login
3. After login, navigate to: [transactions page path]
4. To export: [steps to download CSV or locate transaction table]

## Export Options
- CSV Download: [Yes/No, location of export button]
- Screen Scrape: [Table structure if no CSV]

## Session Notes
- Session timeout: [duration]
- Requires re-auth for: [specific actions]
```

#### 2. Export Format Mapping (export-format.md)
```markdown
# [Bank Name] Export Format

## File Format
- Type: CSV / Excel
- Delimiter: [semicolon, comma, tab]
- Encoding: [UTF-8, ISO-8859-1, etc.]
- Has header row: [Yes/No]

## Column Mapping
| Bank Column | Common Field | Transform |
|-------------|--------------|-----------|
| [Original] | date | Parse DD-MM-YYYY |
| [Original] | amount | Parse Danish number (1.234,56) |
| [Original] | raw_text | Direct |
| [Original] | (ignore) | - |

## Parsing Rules
- Date format: [format string]
- Number format: [Danish/English]
- Negative amounts: [prefix minus / parentheses / separate column]
- Special handling: [any quirks]
```

#### 3. Known Quirks (quirks.md)
```markdown
# [Bank Name] Quirks

## Known Issues
- [Issue 1 and workaround]
- [Issue 2 and workaround]

## Transaction Description Patterns
- Card payments: "Dankort-køb [merchant] [date]"
- Transfers: "Overførsel til [name]"
- Direct debit: "PBS [creditor]"

## Tips
- [Any helpful notes for this bank]
```

### Supported Banks

---

### Nykredit (Primary Bank) — Complete Technical Specification

#### Basic Info
- **Bank ID**: `nykredit`
- **Website**: nykredit.dk
- **Netbank URL**: https://netbank.nykredit.dk
- **Export URL**: https://netbank.nykredit.dk/privat/accounts/save-postings
- **Authentication**: MitID

#### Critical: Iframe-Based Page Structure

⚠️ **The Nykredit export page renders all form elements inside an iframe.** All form interactions must access the iframe's document:

```javascript
// REQUIRED: Access form elements through iframe
const iframe = document.querySelector('iframe');
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

// Then access form elements via iframeDoc
const select = iframeDoc.getElementById('standardExport');
```

Direct `document.getElementById()` will NOT work — the form is isolated in the iframe.

#### Form Elements Reference

| Element ID | Type | Purpose |
|------------|------|---------||
| `standardExport` | select | Pre-configured export presets |
| `konto` | select (multi) | Available bank accounts |
| `valgtekontofelter` | select (multi) | Selected accounts for export |
| `periode` | select | Date range presets |
| `eksportformat` | select | Export format (CSV, etc.) |

#### The "smartspender" Export Preset

A pre-configured export preset named "smartspender" has been created in Nykredit with value `0000000001`. This preset auto-configures:

**Selected Accounts**: All 5 DKK accounts (excludes EUR account)

**Export Fields**:
- Exportkonto
- Afsenderkonto
- Modtagerkonto
- Dato
- Tekst
- Beløb
- Saldo
- Indbetaler
- Supp. tekst til modtager
- Tekst til modtager

**Checkboxes**:
- ☑️ Medtag kolonneoverskrifter (Include column headers)
- ☑️ Konverter decimaltegn til punktum (Convert decimal to period)
- ☐ Hent kun posteringer, der ikke tidligere er eksporteret (unchecked — gets all transactions)

**Format**: CSV (Kommasepareret)

**Filename**: `nykredit_transactions_2025_2026`

```javascript
// Select the smartspender preset
const select = iframeDoc.getElementById('standardExport');
select.value = '0000000001';
select.dispatchEvent(new Event('change', { bubbles: true }));
```

#### Period Dropdown Options

| Value | Danish Text | English |
|-------|-------------|---------||
| 0 | (empty) | None |
| 1 | I går | Yesterday |
| 2 | I dag | Today |
| 3 | 7 dage tilbage | 7 days back |
| 4 | 14 dage tilbage | 14 days back |
| 5 | 1 måned tilbage | 1 month back |
| 6 | 3 måneder tilbage | 3 months back |

```javascript
// Set period to 3 months
const periode = iframeDoc.getElementById('periode');
periode.value = '6';
periode.dispatchEvent(new Event('change', { bubbles: true }));
```

#### Complete Automation Script

```javascript
// Full sync automation using smartspender preset
async function syncNykreditTransactions() {
  const iframe = document.querySelector('iframe');
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  
  // Step 1: Select smartspender preset
  const standardExport = doc.getElementById('standardExport');
  standardExport.value = '0000000001';
  standardExport.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Wait for form to populate
  await new Promise(r => setTimeout(r, 500));
  
  // Step 2: Set period (3 months)
  const periode = doc.getElementById('periode');
  periode.value = '6';
  periode.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Step 3: Click "Næste" button to proceed to download
  // Button needs to be found and clicked via UI automation
  
  return { success: true, message: 'Form configured, ready for download' };
}
```

#### 3-Step Export Flow

| Step | Tab State | Action Required |
|------|-----------|-----------------||
| 1. Udvælg posteringer | Configure export | Select preset → Set period → Click "Næste" |
| 2. Hent posteringsfil | Review & download | Verify count → Click "Næste" (triggers download) |
| 3. Markér som eksporteret | Confirm | Click "OK" to mark as exported |

#### CSV Output Format

With the smartspender preset, the exported CSV contains:

```
Exportkonto,Afsenderkonto,Modtagerkonto,Dato,Tekst,Beløb,Saldo,Indbetaler,Supp. tekst til modtager,Tekst til modtager
```

| Property | Value |
|----------|-------|
| Delimiter | Comma (due to "Kommasepareret" setting) |
| Decimal | Period (due to "Konverter decimaltegn til punktum") |
| Encoding | UTF-8 |
| Date format | DD/MM/YYYY |
| Has header | Yes |

#### Column Mapping to Common Schema

| Nykredit Column | → | Common Field | Transform |
|-----------------|---|--------------|-----------||
| Dato | → | date | Parse DD/MM/YYYY |
| Beløb | → | amount | Direct (already period decimal) |
| Tekst | → | raw_text | Direct |
| Exportkonto | → | account | Direct |
| Saldo | → | (ignore) | - |
| Afsenderkonto | → | (metadata) | For transfer detection |
| Modtagerkonto | → | (metadata) | For transfer detection |
| Indbetaler | → | (metadata) | Payer info |
| Supp. tekst til modtager | → | (metadata) | Additional context |
| Tekst til modtager | → | (metadata) | Additional context |

#### Nykredit Quirks & Known Issues

1. **Iframe required**: Cannot access form elements without going through iframe document
2. **Event dispatching**: Must dispatch `change` events for dropdowns to trigger form updates
3. **Preset saves time**: Using the "smartspender" preset reduces ~20 manual interactions to ~5
4. **Previously exported filter**: The preset has this unchecked, allowing re-export of all transactions (needed for deduplication strategy)
5. **Session timeout**: Bank session expires after ~15 minutes of inactivity; user must re-authenticate via MitID
6. **Multiple accounts**: The preset includes all DKK accounts but excludes EUR account

#### Nykredit Sync Workflow (Detailed)

1. Agent navigates to: `https://netbank.nykredit.dk`
2. Agent announces: "Please log in with MitID. Let me know when you're logged in."
3. **User completes MitID login**
4. User confirms: "I'm logged in"
5. Agent navigates to: `https://netbank.nykredit.dk/privat/accounts/save-postings`
6. Agent waits for iframe to load
7. Agent executes JavaScript to:
   - Access iframe document
   - Select "smartspender" preset (value: `0000000001`)
   - Set period to "3 måneder tilbage" (value: `6`)
   - Click "Næste" button
8. Agent waits for step 2 (review screen)
9. Agent clicks "Næste" to trigger download
10. Agent waits for CSV file download to complete
11. Agent parses CSV using column mapping above
12. Agent normalizes to common transaction schema
13. Agent uploads to Google Sheets via MCP

---

### Future Banks

#### Danske Bank
- Netbank: netbank.danskebank.dk
- Auth: MitID
- Status: Not yet implemented

#### Nordea
- Netbank: netbank.nordea.dk
- Auth: MitID
- Status: Not yet implemented

#### Jyske Bank
- Netbank: jyskebank.dk/netbank
- Auth: MitID
- Status: Not yet implemented

#### Lunar
- App-based (no web export)
- May need different approach (manual CSV upload?)
- Status: Not yet implemented

#### Arbejdernes Landsbank
- Netbank: al-bank.dk
- Auth: MitID
- Status: Not yet implemented

---

## Categorization System

### Categories (Danish context)

| Category | Subcategories | Example Merchants |
|----------|---------------|-------------------|
| **Bolig** (Housing) | Husleje, El, Vand, Varme, Forsikring | Ørsted, HOFOR, Tryg |
| **Dagligvarer** (Groceries) | Supermarked, Specialbutik | Netto, Føtex, Rema 1000, Irma, Lidl |
| **Transport** | Offentlig, Bil, Taxi, Cykel | DSB, Rejsekort, Q8, Circle K, Movia |
| **Abonnementer** (Subscriptions) | Streaming, Fitness, Software, Telefon | Netflix, Spotify, Fitness World, TDC |
| **Restauranter** (Dining) | Restaurant, Café, Takeaway | Wolt, Just Eat, Too Good To Go |
| **Shopping** | Tøj, Elektronik, Bolig, Andet | H&M, Zalando, IKEA, Elgiganten |
| **Sundhed** (Health) | Apotek, Læge, Tandlæge | Apoteket, Matas |
| **Underholdning** (Entertainment) | Biograf, Koncert, Spil | Nordisk Film, Ticketmaster |
| **Rejser** (Travel) | Fly, Hotel, Ferie | SAS, Norwegian, Airbnb, Hotels.com |
| **Børn** (Children) | Daginstitution, Tøj, Legetøj | BR, Børnenes Kartel |
| **Personlig pleje** | Frisør, Kosmetik | Normal, Sephora |
| **Uddannelse** (Education) | Kurser, Bøger, Materialer | Saxo, Amazon |
| **Opsparing** (Savings) | Overførsler til opsparing | (internal transfers) |
| **Indkomst** (Income) | Løn, Refusion | (positive amounts) |
| **Andet** (Other) | Ukategoriseret | (fallback) |

### Merchant Recognition

Build a merchant database mapping raw transaction text patterns to normalized merchants:

```
Pattern: "*NETTO*" → Merchant: "Netto", Category: "Dagligvarer"
Pattern: "*NETFLIX*" → Merchant: "Netflix", Category: "Abonnementer"
Pattern: "*DSB*" → Merchant: "DSB", Category: "Transport"
Pattern: "PBS *FITNESS WORLD*" → Merchant: "Fitness World", Category: "Abonnementer"
```

### Subscription Detection

Identify recurring charges by:

1. **Pattern matching**: Same merchant, similar amount, regular interval
2. **Frequency detection**: Monthly (28-31 days), Yearly (365 days), Weekly (7 days)
3. **Amount tolerance**: Allow ±5% for variable subscriptions
4. **Minimum occurrences**: At least 3 occurrences to confirm pattern
5. **Recency check**: Most recent occurrence within expected interval

---

## Danish Subscription Services Knowledge Base

For each known subscription service, maintain cancellation instructions in `/subscriptions/`:

### Template
```markdown
# [Service Name]

## Service Info
- Website: [URL]
- Category: [Streaming/Fitness/Software/etc.]
- Typical price: [amount] kr/month

## Cancellation Path
1. Navigate to: [URL]
2. Login required: Yes
3. Path: [Account] → [Subscription] → [Cancel]
4. Confirmation steps: [describe]
5. Notice period: [if any]
6. Refund policy: [if any]

## Retention Tactics
- [What offers/screens to expect]
- [How to decline]

## Quirks
- [Any special notes]
```

### Known Services (Examples)

**Streaming**
- Netflix, HBO Max, Disney+, Viaplay, TV2 Play, DR (free)
- Spotify, Apple Music, Tidal, YouTube Premium

**Fitness**
- Fitness World, Fitness DK, SATS, Repeat, Urban Sports Club

**Telecom**
- TDC, Telenor, Telia, 3, CBB, Oister

**News/Media**
- Politiken, Berlingske, Jyllands-Posten, Zetland

**Software**
- Adobe CC, Microsoft 365, Dropbox, iCloud, Google One

**Delivery/Food**
- Wolt+, Nemlig, Aarstiderne, Simple Feast

**Other Danish**
- Mofibo, Saxo Premium, Audible, LittleLife

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `/smartspender:sync [bank]` | Sync transactions from specified bank |
| `/smartspender:sync all` | Sync from all configured accounts |
| `/smartspender:analyze` | Categorize transactions and detect subscriptions |
| `/smartspender:overview` | Show spending summary and insights |
| `/smartspender:overview [month]` | Show summary for specific month |
| `/smartspender:subscriptions` | List all detected subscriptions |
| `/smartspender:subscriptions active` | List only active subscriptions |
| `/smartspender:cancel [service]` | Initiate cancellation for a service |
| `/smartspender:report [month]` | Generate detailed monthly report |
| `/smartspender:categorize [tx_id] [category]` | Manually categorize a transaction |
| `/smartspender:add-account [bank]` | Set up a new bank account |
| `/smartspender:settings` | View/modify settings |

---

## Privacy & Security Considerations

1. **Credentials**: Agent never stores or handles bank credentials. User always performs authentication directly with bank via MitID.

2. **Data storage**: All financial data stored in user's own Google Sheets. No external databases. User controls access.

3. **Service logins**: For subscription cancellation, user handles login. Agent only navigates post-authentication.

4. **Sensitive data**: Transaction data contains personal financial information. Google Sheets access should be restricted.

5. **Browser sessions**: Bank sessions are isolated within Claude in Chrome. Cowork runs in a sandboxed environment.

6. **Audit trail**: All agent actions logged to Action Log for transparency.

7. **Local plugins**: Currently plugins are stored locally on user's machine (organization-wide sharing coming later from Anthropic).

---

## Installation & Setup

### Prerequisites
- Claude Pro, Max, Team, or Enterprise subscription
- Claude Desktop app (macOS) with Cowork enabled
- Claude in Chrome extension installed
- Google account for Sheets storage

### Setup Steps

1. **Install the plugin**
   ```
   # From Cowork plugin marketplace (when available)
   # Or manually clone to plugin directory
   ```

2. **Configure Google Sheets MCP**
   - Create Google Cloud project
   - Enable Sheets API and Drive API
   - Create Service Account and download credentials
   - Create "SmartSpender - 2026" spreadsheet
   - Share with service account email

3. **Set environment variables**
   ```
   SMARTSPENDER_DRIVE_FOLDER=your-folder-id
   SMARTSPENDER_CREDENTIALS=~/.config/smartspender/credentials.json
   ```

4. **First run**
   - Invoke `/smartspender:add-account nykredit`
   - Follow prompts to sync first transactions

---

## Success Metrics

For the user:
- Transactions categorized: % of transactions with assigned categories
- Subscriptions discovered: Count of detected recurring charges
- Actions taken: Count of cancellations/changes made
- Money saved: Sum of annual savings from cancelled subscriptions
- Time saved: Reduction in manual finance tracking effort

---

## Future Enhancements

1. **Budget tracking**: Set category budgets, get alerts when approaching limits
2. **Goal setting**: Savings goals with progress tracking
3. **Bill reminders**: Upcoming recurring charges
4. **Multi-currency**: Handle foreign transactions
5. **Investment tracking**: Connect depot/investment accounts
6. **Tax preparation**: Export categorized data for tax filing (årsopgørelse)
7. **Family sharing**: Multiple users, shared household expenses
8. **Receipt matching**: Photo receipts matched to transactions
9. **Merchant enrichment**: Logos, categories from external APIs
10. **Predictive**: Forecast future spending based on patterns
11. **Organization sharing**: When Anthropic enables org-wide plugin sharing

---

## Glossary (Danish Terms)

| Danish | English |
|--------|---------|
| Kontooversigt | Account overview |
| Bevægelser | Transactions/movements |
| Overførsel | Transfer |
| Beløb | Amount |
| Saldo | Balance |
| Dankort | Danish debit card |
| PBS/Betalingsservice | Direct debit service |
| MitID | Danish national digital ID |
| Netbank | Online banking |
| Opsparing | Savings |
| Lønkonto | Salary account |
| Budgetkonto | Budget account |

---

## References

- [Claude Cowork Announcement](https://claude.ai/blog/cowork-research-preview) - January 12, 2026
- [Cowork Plugins Launch](https://claude.ai/blog/cowork-plugins) - January 30, 2026
- [Anthropic Knowledge Work Plugins (GitHub)](https://github.com/anthropics/knowledge-work-plugins)
- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [MCP Google Sheets Server](https://github.com/xing5/mcp-google-sheets)

---

*End of SmartSpender Product Specification*
