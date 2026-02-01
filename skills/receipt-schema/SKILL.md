---
name: receipt-schema
description: Data structure for receipt and invoice storage. Reference this when reading or writing receipt data files.
---

# Receipt Schema

## Purpose

Defines the CSV file structure for storing receipt metadata and line-item detail. Two files work together: `receipts.csv` holds one row per receipt with match status; `receipt-items.csv` holds one row per line item with product-level categories.

## Data Files

### 1. receipts.csv (Receipt Metadata)

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

### 2. receipt-items.csv (Line Items)

Stores individual line items from each receipt with product-level categorization.

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
- Append rows: batch insert all items for a receipt after extraction
- Read filtered by receipt_id: to display line items for a specific receipt
- Read filtered by category/subcategory: for product-level spending analysis (future)

## ID Generation

### Receipt IDs
- Format: `rcpt-` + 8 random hex characters
- Example: `rcpt-a1b2c3d4`, `rcpt-f9e8d7c6`
- Must be unique across all rows in receipts.csv

### Item IDs
- Format: `ritm-` + 8 random hex characters
- Example: `ritm-e5f6g7h8`, `ritm-1a2b3c4d`
- Must be unique across all rows in receipt-items.csv

## Deduplication

Before appending a new receipt, check for duplicates using three fields:
- `date` — same date
- `merchant` — same normalized merchant name
- `total_amount` — same total (exact match)

If all three match an existing receipt, warn the user: "Denne kvittering ligner en der allerede er registreret ({receipt_id} fra {date}). Vil du tilfoeje den alligevel?"

## File Relationships

```
transactions.csv --[tx_id]--> receipts.csv (via transaction_id)
receipts.csv --[receipt_id]--> receipt-items.csv
receipts.csv --> action-log.csv (receipt upload logged)
```

The `transaction_id` field in receipts.csv links back to `tx_id` in transactions.csv. A transaction can have multiple receipts (e.g., split payments). A receipt always has exactly one set of line items.

## File Archiving

Receipt images and PDFs are saved to a local `receipts/` directory in the working directory. The directory is created automatically on first use.

### Naming Convention
- Format: `receipts/{receipt_id}.{ext}`
- Extension preserved from the original file (jpg, png, pdf, etc.)
- Example: `receipts/rcpt-a1b2c3d4.jpg`, `receipts/rcpt-b2c3d4e5.pdf`

### Archive Rules
- Save the file immediately after generating the receipt_id, before writing CSV rows
- If the file cannot be saved, log a warning but continue processing (the extracted data is still valuable)
- The `file_reference` column in receipts.csv stores the relative path (e.g. `receipts/rcpt-a1b2c3d4.jpg`)

## Examples

### Example 1: Foetex Grocery Receipt

**receipts.csv row**:
```
rcpt-a1b2c3d4,tx-uuid-001,2026-01-28,Foetex,347.50,DKK,upload,receipts/rcpt-a1b2c3d4.jpg,matched,0.95,8,2026-02-01 10:30:00
```

**receipt-items.csv rows**:
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

### Example 2: TDC Telecom Invoice

**receipts.csv row**:
```
rcpt-b2c3d4e5,tx-uuid-042,2026-01-15,TDC,299.00,DKK,upload,receipts/rcpt-b2c3d4e5.pdf,matched,1.00,3,2026-02-01 11:00:00
```

**receipt-items.csv rows**:
```
ritm-g8h9i0j1,rcpt-b2c3d4e5,Mobilabonnement Frihed+,1,199.00,199.00,Abonnementer,Mobilabonnement,0,2026-02-01 11:00:00
ritm-h9i0j1k2,rcpt-b2c3d4e5,Ekstra data 10GB,1,49.00,49.00,Abonnementer,Mobilabonnement,0,2026-02-01 11:00:00
ritm-i0j1k2l3,rcpt-b2c3d4e5,Forsikring Mobil+,1,51.00,51.00,Abonnementer,Forsikring,0,2026-02-01 11:00:00
```

## Related Skills

- See `skills/receipt-parsing/SKILL.md` for extraction rules and product subcategories
- See `skills/transaction-matching/SKILL.md` for how receipts are matched to transactions
- See `skills/sheets-schema/SKILL.md` for the complete data file overview
