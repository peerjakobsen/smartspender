---
name: sheets-schema
description: Local CSV file structure for all SmartSpender data. Reference this when reading or writing to any data file.
---

# Data Storage

## Purpose

Defines the local CSV file structure that stores all SmartSpender data. All read/write operations use the Filesystem tool to access CSV files in the working directory. Files are created automatically on first use if they don't exist — write the header row first, then append data rows.

## Data Files

All data is stored as CSV files in the working directory. Use comma as the delimiter. Enclose fields in double quotes if they contain commas.

### 1. transactions.csv (Raw Data)

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

### 2. categorized.csv (Enriched Transactions)

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

### 3. subscriptions.csv

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

### 4. monthly-summary.csv

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

### 5. action-log.csv

Audit trail of all agent actions for transparency.

**Header row**:
```
timestamp,action_type,target,status,details,savings_amount,notes
```

| Column | Type | Description |
|--------|------|-------------|
| timestamp | datetime | When action occurred (YYYY-MM-DD HH:MM:SS) |
| action_type | string | sync, analyze, cancel, suggest, report |
| target | string | What the action targeted (e.g., "nykredit", "netflix") |
| status | string | suggested, in_progress, completed, failed |
| details | string | Additional details |
| savings_amount | number | Estimated or actual savings (kr/year) |
| notes | string | Any notes |

**File operations**:
- Append row: after every command execution
- Read filtered: for report command (actions in a given month)

### 6. accounts.csv

Configured bank accounts.

**Header row**:
```
account_id,bank,account_name,account_type,last_synced,is_active
```

| Column | Type | Description |
|--------|------|-------------|
| account_id | string | Unique account identifier |
| bank | string | Bank identifier (e.g., nykredit) |
| account_name | string | User-friendly name (e.g., Lonkonto) |
| account_type | string | checking, savings, credit |
| last_synced | datetime | Last successful sync timestamp |
| is_active | boolean | TRUE if currently tracked |

**File operations**:
- Append row: when user adds a new account
- Update row: after each sync (update `last_synced`)
- Read all: to list configured accounts

### 7. settings.csv

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

### 8. merchant-overrides.csv

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

## File Relationships

```
transactions.csv --[tx_id]--> categorized.csv
categorized.csv --[merchant + is_recurring]--> subscriptions.csv
categorized.csv --[month + category]--> monthly-summary.csv
merchant-overrides.csv <-- learned from manual corrections in categorized.csv
All commands --> action-log.csv
accounts.csv <--> Sync commands (last_synced updated)
```

## Examples

### Reading Transactions for Deduplication
Before a sync, read all `tx_hash` values from transactions.csv. Compare against the hashes of incoming transactions. Only append rows whose hash is not already present.

### Writing Categorized Data
After the analyze command processes transactions:
1. Read uncategorized tx_ids from transactions.csv that are not yet in categorized.csv
2. For each transaction, apply categorization rules (see `skills/categorization/SKILL.md`)
3. Append the categorized rows to categorized.csv

### Updating Subscription Status
When a user cancels a subscription via `/smartspender:cancel`:
1. Find the row in subscriptions.csv where `merchant` matches the service
2. Update `status` to `cancelled`
3. Update `cancelled_date` to today's date
4. Append an entry to action-log.csv with `action_type: cancel`
