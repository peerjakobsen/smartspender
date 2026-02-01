---
name: spending-analysis
description: Spending analysis rules for aggregation, month-over-month comparison, unusual transaction detection, and savings recommendations. Reference this when generating overviews and reports.
---

# Spending Analysis

## Purpose

Provides rules for analyzing categorized transaction data — aggregating spending by category, comparing month-over-month, detecting unusual transactions, and generating savings recommendations.

## Category Aggregation

For a given month, aggregate all categorized transactions:

1. Group transactions by `category`
2. For each category, compute:
   - `total`: Sum of all transaction amounts (absolute values for expenses)
   - `transaction_count`: Number of transactions
   - `avg_transaction`: `total / transaction_count`
3. Calculate each category's percentage of total spending: `category_total / total_spending × 100`
4. Sort categories by total (highest first)

Write results to monthly-summary.csv.

## Receipt-Level Breakdown

For a given merchant, aggregate spending at the receipt-item level instead of the transaction level. Used when the user asks about spending at a specific merchant (e.g., "Hvad bruger jeg hos Bilka?").

### Data Source

1. Read `receipts.csv`, filter by `merchant` (case-insensitive match against normalized merchant name per `skills/categorization/SKILL.md`)
2. If `month` argument is provided, also filter by `date` column (YYYY-MM prefix match)
3. Collect all matching `receipt_id` values
4. Read `receipt-items.csv`, filter to rows where `receipt_id` is in the collected set

### Aggregation Rules

Group matching receipt items by `subcategory`:

1. For each subcategory, compute:
   - `total`: Sum of `total_price` for all items in that subcategory
   - `item_count`: Sum of `quantity` for all items in that subcategory
   - `avg_price`: `total / item_count`
2. Calculate each subcategory's percentage of total merchant spending: `subcategory_total / merchant_total × 100`
3. Sort subcategories by total (highest first)

### Top Items per Subcategory

For each subcategory, identify the top 3 most purchased individual items:

1. Group items by `item_name` within the subcategory
2. For each item, compute:
   - `purchase_count`: Sum of `quantity` across all receipts
   - `item_total`: Sum of `total_price` across all receipts
3. Sort by `purchase_count` (highest first), break ties by `item_total`
4. Return top 3

### Overall Top Items

Across all subcategories, identify the top 3 most frequently purchased items using the same logic as above but without the subcategory grouping.

### Multi-Month Handling

- **Month specified**: Show totals for that month only. Header: `{Merchant} — Indkøbsoversigt {month_name} {year}`
- **No month specified**: Show all-time totals plus a per-month average. Header: `{Merchant} — Indkøbsoversigt samlet`
  - Per-month average: `total / number_of_distinct_months` (count distinct YYYY-MM values from matching receipts)

### Output Format: Merchant Breakdown

```
## {Merchant} — Indkøbsoversigt {month or "samlet"}

**Antal kvitteringer**: {count}
**Samlet forbrug**: {total} kr

### Fordeling pr. varekategori
| Kategori | Beløb | Andel | Antal varer |
|----------|-------|-------|-------------|
| {subcategory} | {amount} kr | {pct}% | {item_count} |
| ... | ... | ... | ... |

### Hyppigst købte varer
1. {item_name} — {count}x — {total} kr
2. {item_name} — {count}x — {total} kr
3. {item_name} — {count}x — {total} kr
```

If no month is specified, append a summary line after the table:

```
**Gennemsnit pr. måned**: {avg} kr ({month_count} måneder)
```

## Month-Over-Month Comparison

Compare the current month's spending to the previous month:

1. For each category present in either month:
   - `vs_prev_month`: `current_total - previous_total` (absolute difference in kr)
   - `vs_prev_month_pct`: `(current_total - previous_total) / previous_total × 100`
2. Flag categories with significant changes:
   - Increase > 20%: highlight as notable increase
   - Decrease > 20%: highlight as notable decrease
   - New category (not in previous month): flag as new spending area

If there is no previous month data (first month of tracking), skip the comparison.

## Unusual Transaction Detection

Flag individual transactions that stand out:

### By Amount
- Transaction amount > 3× the average for its category
- Single transaction > 5.000 kr (unless the category is Bolig or Indkomst)

### By Frequency
- Multiple transactions to the same merchant on the same day (possible duplicate charges)
- Weekend transactions to work-related merchants

### By Category Mix
- A merchant that usually falls in one category appearing in a different one

## Savings Recommendations

Generate actionable suggestions based on analysis:

### Subscription Savings
- **Unused subscriptions**: Subscriptions where `status: active` but no other transactions to that merchant's category (e.g., Viaplay active but no streaming usage signals)
- **Duplicate services**: Multiple subscriptions in the same subcategory (e.g., Netflix + HBO Max + Viaplay = 3 streaming services)
- **Price increases**: Subscription amount increased > 10% from the average

### Category Savings
- **High dining spend**: If Restauranter > 15% of total, suggest cooking more
- **Transport optimization**: If Taxi subcategory > Transport total × 30%, suggest alternatives
- **Impulse shopping**: If Shopping has many small transactions (> 10 in a month, avg < 200 kr), flag as potential impulse purchases

### Formatting Suggestions
Present each suggestion as:
```
{action} — Spar {amount} kr/år
```
Example: "Opsig Viaplay — Spar 1.188 kr/år"

## Danish Currency Formatting

All user-facing monetary values must use Danish formatting:
- Thousands separator: period (`.`)
- No decimal places for whole amounts in casual output
- Suffix: `kr` (with space before)
- Examples:
  - `1.847 kr` (one thousand eight hundred forty-seven)
  - `28.450 kr` (twenty-eight thousand four hundred fifty)
  - `149 kr` (no thousands separator needed)
  - `4.200 kr` (four thousand two hundred)

## Output Format: Spending Overview

When presenting a spending overview, use this structure:

```
## {Month} {Year} — Overblik

**Samlet forbrug**: {total} kr

### Fordeling pr. kategori
| Kategori | Beløb | Andel | Ændr. |
|----------|-------|-------|-------|
| {category} | {amount} kr | {pct}% | {change} |
| ... | ... | ... | ... |

### Abonnementer ({count} aktive)
| Tjeneste | Månedlig | Årlig | Status |
|----------|----------|-------|--------|
| {service} | {amount} kr | {annual} kr | {status} |
| ... | ... | ... | ... |
**Total abonnementer**: {total} kr/måned ({annual_total} kr/år)

### Forslag til besparelser
1. {suggestion} — Spar {amount} kr/år
2. {suggestion} — Spar {amount} kr/år
```

## Output Format: Monthly Report

When generating a detailed report, include additional sections:

```
## {Month} {Year} — Månedlig rapport

### Resumé
{2-3 sentence summary of the month's spending}

### Forbrug pr. kategori
{Category breakdown table as above}

### Sammenlignet med {previous_month}
{Highlight notable changes — increases, decreases, new categories}

### Usædvanlige transaktioner
{List any flagged transactions with amounts and reasons}

### Abonnementer
{Subscription table as above}
{Note any changes: new subscriptions, cancellations, price changes}

### Handlinger i denne måned
{List actions taken from the Action Log: syncs, cancellations, etc.}

### Anbefalinger
{Savings suggestions with estimated annual impact}
```

## Examples

### Category Aggregation Example
Given 5 transactions in January 2026:
```
Netto        -347.50  Dagligvarer
Føtex        -289.00  Dagligvarer
Netflix      -149.00  Abonnementer
DSB          -72.00   Transport
Wolt         -198.00  Restauranter
```

Monthly Summary rows:
```
month: 2026-01, category: Dagligvarer, total: 636.50, count: 2, avg: 318.25
month: 2026-01, category: Restauranter, total: 198.00, count: 1, avg: 198.00
month: 2026-01, category: Abonnementer, total: 149.00, count: 1, avg: 149.00
month: 2026-01, category: Transport, total: 72.00, count: 1, avg: 72.00
```

### Savings Recommendation Example
```
Detected 3 streaming subscriptions:
- Netflix: 149 kr/måned (1.788 kr/år)
- HBO Max: 149 kr/måned (1.788 kr/år)
- Viaplay: 99 kr/måned (1.188 kr/år)
Total: 397 kr/måned (4.764 kr/år)

Suggestion: "Overvej at konsolidere streamingtjenester? Netflix + HBO Max + Viaplay = 397 kr/måned"
```
