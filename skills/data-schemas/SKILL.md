---
name: data-schemas
description: Data structure definitions for all SmartSpender CSV files. Reference this when reading or writing to any data file.
---

# Data Schemas

## Purpose

Defines the local CSV file structure that stores all SmartSpender data. All read/write operations use the Filesystem tool to access CSV files in the working directory. Files are created automatically on first use if they don't exist — write the header row first, then append data rows.

---

## 1. Transaction Schema

### Purpose

Defines the common data format for all transactions in SmartSpender. Every bank adapter normalizes its export into this schema before storing locally.

### Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tx_id | string | yes | Unique transaction ID (auto-generated UUID) |
| tx_hash | string | yes | Deduplication hash |
| date | date | yes | Transaction date (YYYY-MM-DD) |
| amount | number | yes | Amount with sign (negative = expense, positive = income) |
| currency | string | yes | ISO currency code (default: DKK) |
| description | string | yes | Cleaned, human-readable description |
| raw_text | string | yes | Original text from bank export, unmodified |
| bank | string | yes | Bank identifier (e.g., `enable-banking`) |
| account | string | yes | Account identifier from the bank |
| synced_at | datetime | yes | When the transaction was imported (YYYY-MM-DD HH:MM:SS) |

### Hash Computation

The `tx_hash` prevents duplicate imports across multiple sync runs.

#### Primary formula (when bank provides running balance)

```
"{account}|{date}|{amount}|{saldo}"
```

Where:
- `account` is the account identifier from the bank export (e.g., the Enable Banking account UID for API sync)
- `date` is in YYYY-MM-DD format
- `amount` is formatted to exactly 2 decimal places (e.g., `-55.00`)
- `saldo` is the running balance after the transaction, formatted to exactly 2 decimal places (e.g., `927.83`)

The running balance is a natural disambiguator — even two identical purchases at the same merchant on the same day produce different balances.

#### Fallback formula (when bank does not provide running balance)

```
"{account}|{date}|{amount}|{raw_text_normalized}"
```

Where:
- `raw_text_normalized` is the raw_text trimmed of whitespace and lowercased

This fallback is used when:
- Enable Banking API response lacks `balance_after_transaction` for a specific transaction

Before appending any row to transactions.csv, check whether a row with the same `tx_hash` already exists. If it does, skip the row.

### Transformation Rules

#### Date Normalization
- Enable Banking API provides YYYY-MM-DD (no conversion needed)
- Always convert to: **YYYY-MM-DD**
- Reject any date in the future — this likely indicates a parsing error

#### Amount Normalization
- Danish number format uses period as thousands separator and comma as decimal: `1.234,56`
- Convert to standard decimal: `1234.56`
- Enable Banking API provides amounts as positive strings with a `credit_debit_indicator` — negate DBIT amounts
- Expenses are **negative**, income is **positive**
- Always store with exactly 2 decimal places
- Currency defaults to `DKK` unless the transaction specifies otherwise

#### Description Cleaning
- Trim leading and trailing whitespace
- Collapse multiple consecutive spaces into one
- Preserve bank-specific prefixes that indicate payment method (e.g., `Debitcard DK` indicates card payment)
- For Enable Banking: use `creditor.name` (expenses) or `debtor.name` (income) as the description
- Store the original unmodified text in `raw_text`
- Store the cleaned version in `description`

#### Bank and Account Fields
- `bank` uses the lowercase bank identifier: `enable-banking`
- `account` uses the Enable Banking account UID

### Validation Rules

Before storing a transaction, verify all of the following:
- `date` is a valid date and not in the future
- `amount` is a non-zero number
- `raw_text` is not empty
- `tx_hash` does not already exist in transactions.csv (deduplication)

If validation fails, log the issue but do not halt the entire sync — skip the invalid row and continue.

### Transaction Examples

#### Enable Banking Card Payment (API Sync, with balance)
```
tx_id: "d4e5f6a7-b8c9-0123-defa-234567890123"
tx_hash: "eb-uid-abc123|2026-01-15|-847.50|12543.25"
date: 2026-01-15
amount: -847.50
currency: DKK
description: FOETEX
raw_text: "Dankort-koeb FOETEX 4123"
bank: enable-banking
account: "eb-uid-abc123"
synced_at: 2026-02-02 14:00:00
```

#### Enable Banking Salary (API Sync, with balance)
```
tx_id: "e5f6a7b8-c9d0-1234-efab-345678901234"
tx_hash: "eb-uid-abc123|2026-01-31|32500.00|45043.25"
date: 2026-01-31
amount: 32500.00
currency: DKK
description: Virksomhed A/S
raw_text: "Loen januar 2026"
bank: enable-banking
account: "eb-uid-abc123"
synced_at: 2026-02-02 14:00:00
```

#### Enable Banking Subscription (API Sync, no balance — fallback hash)
```
tx_id: "f6a7b8c9-d0e1-2345-fabc-456789012345"
tx_hash: "eb-uid-abc123|2026-01-15|-149.00|netflix.com"
date: 2026-01-15
amount: -149.00
currency: DKK
description: Netflix
raw_text: "NETFLIX.COM"
bank: enable-banking
account: "eb-uid-abc123"
synced_at: 2026-02-02 14:00:00
```

---

## 2. Receipt Schema

### Purpose

Defines the CSV file structure for storing receipt metadata and line-item detail. Two files work together: `receipts.csv` holds one row per receipt with match status; `receipt-items-YYYY-MM.csv` files hold one row per line item with product-level categories, partitioned by month based on the receipt date.

### receipts.csv (Receipt Metadata)

Stores one row per uploaded receipt with extraction results and transaction match status.

**Header row**:
```
receipt_id,transaction_id,date,merchant,total_amount,currency,source,file_reference,match_status,match_confidence,item_count,created_at
```

| Column | Type | Description |
|--------|------|-------------|
| receipt_id | string | Unique receipt ID (`rcpt-` prefix + 8 hex chars, e.g. `rcpt-a1b2c3d4`) |
| transaction_id | string | Matched tx_id from transactions.csv (empty if unmatched) |
| date | date | Receipt date (YYYY-MM-DD) |
| merchant | string | Normalized merchant name (e.g. Foetex, TDC) |
| total_amount | number | Receipt total as positive number (e.g. 347.50) |
| currency | string | ISO currency code (DKK) |
| source | string | How the receipt was obtained: `upload`, `storebox`, `coop`, `eboks`, `email` |
| file_reference | string | Local archive path (e.g. `receipts/rcpt-a1b2c3d4.jpg`) |
| match_status | string | `matched`, `unmatched`, `ambiguous` |
| match_confidence | number | Confidence of the transaction match (0.0-1.0) |
| item_count | number | Number of line items extracted |
| created_at | datetime | When the receipt was processed (YYYY-MM-DD HH:MM:SS) |

**File operations**:
- Append row: after receipt extraction and matching completes
- Read all: for deduplication check before appending
- Read filtered by transaction_id: to find receipts linked to a specific transaction
- Update row: when user corrects a match (update transaction_id, match_status, match_confidence)

### receipt-items-YYYY-MM.csv (Line Items, Monthly Files)

Stores individual line items from each receipt with product-level categorization. Items are partitioned into monthly files based on the receipt's `date` in `receipts.csv`. For example, a receipt dated 2026-01-28 has its items stored in `receipt-items-2026-01.csv`.

**Header row**:
```
item_id,receipt_id,item_name,quantity,unit_price,total_price,category,subcategory,discount,created_at
```

| Column | Type | Description |
|--------|------|-------------|
| item_id | string | Unique item ID (`ritm-` prefix + 8 hex chars, e.g. `ritm-e5f6g7h8`) |
| receipt_id | string | Reference to receipts.csv |
| item_name | string | Product name as printed on receipt (e.g. `Minimælk 1L`) |
| quantity | number | Quantity purchased (default 1) |
| unit_price | number | Price per unit as positive number |
| total_price | number | Line total as positive number (quantity x unit_price - discount) |
| category | string | Danish product category (e.g. Dagligvarer, Bolig, Abonnementer) |
| subcategory | string | Product-level subcategory (e.g. Mejeriprodukter, Koed, Alkohol) |
| discount | number | Discount amount as positive number (0 if no discount) |
| created_at | datetime | When the item was extracted (YYYY-MM-DD HH:MM:SS) |

**File operations**:
- Append rows: determine the receipt date from `receipts.csv`, then write items to `receipt-items-{YYYY-MM}.csv` (create the file with header row if it doesn't exist)
- Read filtered by receipt_id: get the receipt date from `receipts.csv`, open the corresponding monthly file, filter by receipt_id
- Read filtered by date range: get receipt dates from `receipts.csv`, open only the relevant monthly files, filter by receipt_id

### ID Generation

#### Receipt IDs
- Format: `rcpt-` + 8 random hex characters
- Example: `rcpt-a1b2c3d4`, `rcpt-f9e8d7c6`
- Must be unique across all rows in receipts.csv

#### Item IDs
- Format: `ritm-` + 8 random hex characters
- Example: `ritm-e5f6g7h8`, `ritm-1a2b3c4d`
- Must be unique across all monthly receipt-items files

### Receipt Deduplication

Before appending a new receipt, check for duplicates using three fields:
- `date` — same date
- `merchant` — same normalized merchant name
- `total_amount` — same total (exact match)

If all three match an existing receipt, warn the user: "Denne kvittering ligner en der allerede er registreret ({receipt_id} fra {date}). Vil du tilfoeje den alligevel?"

### File Archiving

Receipt images and PDFs are saved to a local `receipts/` directory in the working directory. The directory is created automatically on first use.

#### Naming Convention
- Format: `receipts/{receipt_id}.{ext}`
- Extension preserved from the original file (jpg, png, pdf, etc.)
- Example: `receipts/rcpt-a1b2c3d4.jpg`, `receipts/rcpt-b2c3d4e5.pdf`

#### Archive Rules
- Save the file immediately after generating the receipt_id, before writing CSV rows
- If the file cannot be saved, log a warning but continue processing (the extracted data is still valuable)
- The `file_reference` column in receipts.csv stores the relative path (e.g. `receipts/rcpt-a1b2c3d4.jpg`)

### Receipt Examples

#### Foetex Grocery Receipt

**receipts.csv row**:
```
rcpt-a1b2c3d4,tx-uuid-001,2026-01-28,Foetex,347.50,DKK,upload,receipts/rcpt-a1b2c3d4.jpg,matched,0.95,8,2026-02-01 10:30:00
```

**receipt-items-2026-01.csv rows** (receipt date is 2026-01-28):
```
ritm-e5f6g7h8,rcpt-a1b2c3d4,Minimælk 1L,2,12.95,25.90,Dagligvarer,Mejeriprodukter,0,2026-02-01 10:30:00
ritm-f1g2h3i4,rcpt-a1b2c3d4,Hakket oksekød 500g,1,45.00,45.00,Dagligvarer,Kød,0,2026-02-01 10:30:00
ritm-a2b3c4d5,rcpt-a1b2c3d4,Øko bananer,1,22.95,22.95,Dagligvarer,Frugt og grønt,0,2026-02-01 10:30:00
ritm-b3c4d5e6,rcpt-a1b2c3d4,Coca-Cola 1.5L,2,22.00,44.00,Dagligvarer,Drikkevarer,0,2026-02-01 10:30:00
ritm-c4d5e6f7,rcpt-a1b2c3d4,Rødvin Chianti,1,79.95,79.95,Dagligvarer,Alkohol,0,2026-02-01 10:30:00
ritm-d5e6f7g8,rcpt-a1b2c3d4,Tandbørstehoveder,1,89.95,89.95,Sundhed,Personlig pleje,0,2026-02-01 10:30:00
ritm-e6f7g8h9,rcpt-a1b2c3d4,Rugbrød,1,24.95,24.95,Dagligvarer,Brød og bagværk,0,2026-02-01 10:30:00
ritm-f7g8h9i0,rcpt-a1b2c3d4,Pose 2 kr,1,2.00,2.00,Andet,Andet,0,2026-02-01 10:30:00
```

Note: Items sum to 334.70, but receipt total is 347.50. The difference (12.80) is likely pant (bottle deposit) or rounding — flag for user review if variance > 5%.

#### TDC Telecom Invoice

**receipts.csv row**:
```
rcpt-b2c3d4e5,tx-uuid-042,2026-01-15,TDC,299.00,DKK,upload,receipts/rcpt-b2c3d4e5.pdf,matched,1.00,3,2026-02-01 11:00:00
```

**receipt-items-2026-01.csv rows** (receipt date is 2026-01-15):
```
ritm-g8h9i0j1,rcpt-b2c3d4e5,Mobilabonnement Frihed+,1,199.00,199.00,Abonnementer,Mobilabonnement,0,2026-02-01 11:00:00
ritm-h9i0j1k2,rcpt-b2c3d4e5,Ekstra data 10GB,1,49.00,49.00,Abonnementer,Mobilabonnement,0,2026-02-01 11:00:00
ritm-i0j1k2l3,rcpt-b2c3d4e5,Forsikring Mobil+,1,51.00,51.00,Abonnementer,Forsikring,0,2026-02-01 11:00:00
```

---

## 3. CSV File Reference

All data is stored as CSV files in the working directory. Use comma as the delimiter. Enclose fields in double quotes if they contain commas.

### transactions.csv

Stores raw imported transactions from all bank syncs.

**Header row**:
```
tx_id,tx_hash,date,amount,currency,description,raw_text,bank,account,synced_at
```

| Column | Type | Description |
|--------|------|-------------|
| tx_id | string | Unique transaction ID (UUID) |
| tx_hash | string | Deduplication hash (`"{account}\|{date}\|{amount}\|{saldo}"`) |
| date | date | Transaction date (YYYY-MM-DD) |
| amount | number | Amount with sign (negative = expense) |
| currency | string | ISO currency code (DKK) |
| description | string | Cleaned description |
| raw_text | string | Original bank text |
| bank | string | Bank identifier |
| account | string | Account identifier |
| synced_at | datetime | Import timestamp |

**File operations**:
- Append rows: after sync completes
- Read all rows: before sync (for deduplication by tx_hash)
- Read filtered: by date range for analysis

### categorized.csv

Stores transactions with assigned categories and merchant info.

**Header row**:
```
tx_id,date,amount,description,category,subcategory,merchant,is_recurring,confidence,manual_override
```

| Column | Type | Description |
|--------|------|-------------|
| tx_id | string | Reference to transactions.csv |
| date | date | Transaction date (YYYY-MM-DD) |
| amount | number | Amount |
| description | string | Description |
| category | string | Assigned Danish category (e.g., Dagligvarer) |
| subcategory | string | Optional subcategory (e.g., Supermarked) |
| merchant | string | Normalized merchant name (e.g., Netto) |
| is_recurring | boolean | TRUE if detected as recurring |
| confidence | number | Categorization confidence (0.0-1.0) |
| manual_override | boolean | TRUE if user corrected this category |

**File operations**:
- Append rows: after analyze command categorizes transactions
- Read all: for spending analysis and reporting
- Update row: when user manually corrects a category (set `manual_override` to TRUE)

### subscriptions.csv

Detected recurring charges and their status.

**Header row**:
```
subscription_id,merchant,category,amount,frequency,annual_cost,first_seen,last_seen,status,cancelled_date,notes
```

| Column | Type | Description |
|--------|------|-------------|
| subscription_id | string | Unique ID |
| merchant | string | Service name (e.g., Netflix) |
| category | string | Subscription category (e.g., Streaming) |
| amount | number | Recurring charge amount |
| frequency | string | monthly, yearly, weekly |
| annual_cost | number | Calculated annual cost |
| first_seen | date | First transaction date |
| last_seen | date | Most recent transaction |
| status | string | active, cancelled, paused |
| cancelled_date | date | When cancelled (if applicable) |
| notes | string | Any notes |

**File operations**:
- Append rows: after analyze detects new subscriptions
- Read all: for subscriptions list and overview
- Update row: when subscription is cancelled (set `status`, `cancelled_date`)

### monthly-summary.csv

Aggregated spending by month and category.

**Header row**:
```
month,category,total,transaction_count,avg_transaction,vs_prev_month,vs_prev_month_pct
```

| Column | Type | Description |
|--------|------|-------------|
| month | string | YYYY-MM format |
| category | string | Danish category name |
| total | number | Total spent in this category |
| transaction_count | number | Number of transactions |
| avg_transaction | number | Average transaction size |
| vs_prev_month | number | Change from previous month (absolute) |
| vs_prev_month_pct | number | Percentage change from previous month |

**File operations**:
- Write/overwrite rows: after analyze command completes
- Read filtered by month: for overview and report commands

### action-log.csv

Audit trail of all agent actions for transparency.

**Header row**:
```
timestamp,action_type,target,status,details,savings_amount,notes
```

| Column | Type | Description |
|--------|------|-------------|
| timestamp | datetime | When action occurred (YYYY-MM-DD HH:MM:SS) |
| action_type | string | sync, analyze, cancel, suggest, report |
| target | string | What the action targeted (e.g., "enable-banking", "netflix") |
| status | string | suggested, in_progress, completed, failed |
| details | string | Additional details |
| savings_amount | number | Estimated or actual savings (kr/year) |
| notes | string | Any notes |

**File operations**:
- Append row: after every command execution
- Read filtered: for report command (actions in a given month)

### accounts.csv

Configured bank accounts.

**Header row**:
```
account_id,bank,account_name,account_type,last_synced,is_active,eb_account_uid,eb_session_id,balance,balance_type,balance_date
```

| Column | Type | Description |
|--------|------|-------------|
| account_id | string | Unique account identifier |
| bank | string | Bank identifier (e.g., enable-banking) |
| account_name | string | User-friendly name (e.g., Lonkonto) |
| account_type | string | checking, savings, credit |
| last_synced | datetime | Last successful sync timestamp |
| is_active | boolean | TRUE if currently tracked |
| eb_account_uid | string | Enable Banking account UID |
| eb_session_id | string | Enable Banking session ID |
| balance | number | Current account balance |
| balance_type | string | Balance type code (e.g., CLBD, ITAV) |
| balance_date | date | When balance was last updated (YYYY-MM-DD) |

**Balance type codes**:
- `CLBD`: Closing booked balance (end of day settled) — preferred
- `ITAV`: Intraday available (current available)
- `XPCD`: Expected balance

**File operations**:
- Append row: when user adds a new account
- Update row: after each sync (update `last_synced`, `balance`, `balance_type`, `balance_date`)
- Read all: to list configured accounts

### settings.csv

Plugin configuration stored as key-value pairs.

**Header row**:
```
setting_key,setting_value,updated_at
```

| Column | Type | Description |
|--------|------|-------------|
| setting_key | string | Setting name (snake_case) |
| setting_value | string | Setting value |
| updated_at | datetime | Last updated timestamp |

**Default settings**:

| Key | Default Value | Description |
|-----|---------------|-------------|
| default_currency | DKK | Currency for all transactions |
| categorization_confidence_threshold | 0.7 | Minimum confidence to auto-assign category |
| subscription_detection_months | 3 | Minimum occurrences to detect subscription |
| preferred_language | da | Language for user-facing output |

**File operations**:
- Read all: at command startup to load configuration
- Update row: when user changes a setting

### merchant-overrides.csv

Learned merchant categorization rules from user corrections. When a user manually recategorizes a transaction, the correction is stored here as a reusable rule for future transactions from the same merchant.

**Header row**:
```
raw_pattern,merchant,category,subcategory,created_at
```

| Column | Type | Description |
|--------|------|-------------|
| raw_pattern | string | Normalized pattern from raw_text (uppercase, trimmed) e.g. `NORMAL FREDERIK` |
| merchant | string | User-corrected merchant name e.g. `Normal` |
| category | string | User-corrected category e.g. `Shopping` |
| subcategory | string | User-corrected subcategory (can be empty) |
| created_at | datetime | When the override was created (YYYY-MM-DD HH:MM:SS) |

**File operations**:
- Read all: before categorization to apply learned rules first
- Append row: when a manual correction in categorized.csv introduces a new merchant override
- Check for duplicates: don't add a row if raw_pattern already exists

---

## 3. Payslip Schema

### Purpose

Defines the CSV file structure for storing payslip data extracted from Danish lønsedler. Enables accurate pension tracking and income analysis based on actual gross salary rather than net deposits.

### payslips.csv

Stores one row per uploaded payslip with extracted salary breakdown and pension data.

**Header row**:
```
payslip_id,pay_period,employer,employer_id,gross_salary,a_skat,am_bidrag,pension_employer,pension_employee,pension_total,pension_pct,atp,feriepenge,net_salary,benefits_json,transaction_id,file_reference,created_at
```

| Column | Type | Description |
|--------|------|-------------|
| payslip_id | string | Unique payslip ID (`ps-` prefix + 8 hex chars, e.g. `ps-a1b2c3d4`) |
| pay_period | string | Pay period in YYYY-MM format (e.g. `2026-01`) |
| employer | string | Company name as shown on payslip |
| employer_id | string | Normalized employer ID (lowercase, no spaces) |
| gross_salary | number | Bruttoløn — total earnings before deductions |
| a_skat | number | Income tax withheld |
| am_bidrag | number | Labor market contribution (8% of gross) |
| pension_employer | number | Employer's pension contribution |
| pension_employee | number | Employee's pension contribution |
| pension_total | number | Combined pension (employer + employee) |
| pension_pct | number | Pension as percentage of gross salary |
| atp | number | ATP contribution |
| feriepenge | number | Holiday pay accrued this period |
| net_salary | number | Nettoløn — amount deposited to bank |
| benefits_json | string | JSON string of additional benefits (sundhedsforsikring, fritvalgskonto, etc.) |
| transaction_id | string | Matched tx_id from transactions.csv (empty if unmatched) |
| file_reference | string | Local archive path (e.g. `payslips/ps-a1b2c3d4.pdf`) |
| created_at | datetime | When the payslip was processed (YYYY-MM-DD HH:MM:SS) |

**File operations**:
- Append row: after payslip extraction and validation completes
- Read all: for deduplication check before appending
- Read filtered by pay_period: to analyze pension trends over time
- Read filtered by transaction_id: to find payslip linked to a salary transaction
- Update row: when user corrects extracted data

### ID Generation

#### Payslip IDs
- Format: `ps-` + 8 random hex characters
- Example: `ps-a1b2c3d4`, `ps-f9e8d7c6`
- Must be unique across all rows in payslips.csv

### Payslip Deduplication

Before appending a new payslip, check for duplicates using two fields:
- `employer_id` — same normalized employer
- `pay_period` — same month

If both match an existing payslip, warn the user: "Denne lønseddel ligner en der allerede er registreret ({payslip_id} for {pay_period}). Vil du tilføje den alligevel?"

### File Archiving

Payslip images and PDFs are saved to a local `payslips/` directory in the working directory. The directory is created automatically on first use.

#### Naming Convention
- Format: `payslips/{payslip_id}.{ext}`
- Extension preserved from the original file (jpg, png, pdf)
- Example: `payslips/ps-a1b2c3d4.pdf`

#### Archive Rules
- Save the file immediately after generating the payslip_id, before writing CSV row
- The `file_reference` column stores the relative path (e.g. `payslips/ps-a1b2c3d4.pdf`)
- **Privacy**: Never store CPR numbers — mask any detected CPR in logs

### Payslip Examples

#### Standard Monthly Payslip

**payslips.csv row**:
```
ps-a1b2c3d4,2026-01,Teknologi A/S,teknologi,42000.00,11200.00,3360.00,4200.00,2100.00,6300.00,15.00,94.65,5250.00,25245.35,"{""sundhedsforsikring"":150}",tx-uuid-045,payslips/ps-a1b2c3d4.pdf,2026-02-01 14:30:00
```

#### Payslip with Bonus

**payslips.csv row**:
```
ps-b2c3d4e5,2026-03,Startup ApS,startup,55000.00,16500.00,4400.00,5500.00,2750.00,8250.00,15.00,94.65,6875.00,31255.35,"{""bonus"":10000}",tx-uuid-089,payslips/ps-b2c3d4e5.pdf,2026-04-02 10:15:00
```

---

## 5. File Relationships

```
transactions.csv --[tx_id]--> categorized.csv
transactions.csv --[tx_id]--> receipts.csv (via transaction_id)
transactions.csv --[tx_id]--> payslips.csv (via transaction_id)
receipts.csv --[receipt_id + date]--> receipt-items-YYYY-MM.csv
categorized.csv --[merchant + is_recurring]--> subscriptions.csv
categorized.csv --[month + category]--> monthly-summary.csv
merchant-overrides.csv <-- learned from manual corrections in categorized.csv
payslips.csv --> advice command (pension_pct for Step 3 assessment)
All commands --> action-log.csv
accounts.csv <--> Sync commands (last_synced updated)
```

---

## Related Skills

- See `skills/document-parsing/SKILL.md` for extraction rules and product subcategories
- See `skills/payslip-parsing/SKILL.md` for payslip extraction rules and validation
- See `skills/transaction-matching/SKILL.md` for how receipts and payslips are matched to transactions
- See `skills/categorization/SKILL.md` for merchant-level categories
