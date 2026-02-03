---
description: Categorize transactions and detect recurring subscriptions
---

# /smartspender:analyze

## Trigger
- `/smartspender:analyze`
- "Analyser mine transaktioner"
- "Kategoriser mit forbrug"
- "Analyze my spending"

## Arguments

None.

## Prerequisites
- Transactions synced (transactions.csv has data)

## Workflow

0. Load user memory skill:
   - Load `skills/user-memory/SKILL.md` for learning detection
   - Read `learnings/categorization.md` for previously learned category corrections
   - Read `learnings/subscriptions.md` for subscription confirmations/denials
   - Read `learnings/merchants.md` for merchant aliases

1. Read all transactions from transactions.csv
2. Read existing categorized transactions from categorized.csv (by tx_id)
3. Read merchant-overrides.csv (if it exists) — these are learned categorization rules from previous user corrections
4. Identify uncategorized transactions: tx_ids present in transactions.csv but not in categorized.csv
5. If no uncategorized transactions found, skip to step 8 (still check for new overrides to learn)
6. For each uncategorized transaction, apply categorization using `skills/categorization/SKILL.md`:
   a. Normalize the raw_text for pattern matching
   b. Check merchant-overrides.csv first — if raw_text (normalized) matches a `raw_pattern`, use that override's merchant/category/subcategory (confidence 1.0)
   c. If no override match, check against the merchant pattern database (exact match -> confidence 1.0)
   d. If no exact match, try partial pattern match (confidence 0.8)
   e. If no pattern match, use intelligent classification from transaction context (confidence 0.5-0.7)
   f. If still unmatched, assign to "Andet" category (confidence 0.0)
   g. Detect transaction type from description prefix (Dankort-kob, PBS, Overforsel, etc.)
   h. For known subscription merchants, set `is_recurring` to TRUE
7. Append categorized rows to categorized.csv (create file with header row if it doesn't exist)
8. Learn from manual corrections: scan categorized.csv for rows where `manual_override` is TRUE. For each, look up the original `raw_text` in transactions.csv. If no corresponding `raw_pattern` exists in merchant-overrides.csv yet, append a new override row with the corrected merchant/category/subcategory
9. Run subscription detection using `skills/subscription-detection/SKILL.md`:
   a. Group categorized transactions by merchant
   b. For each merchant with >=3 occurrences, check the 5 subscription criteria
   c. Calculate frequency and annual cost for detected subscriptions
10. Read existing subscriptions from subscriptions.csv
11. For newly detected subscriptions not already in the file, append rows
12. For existing subscriptions, update `last_seen` date and amount if changed
13. Calculate monthly aggregations and write to monthly-summary.csv:
    a. Group by month (YYYY-MM) and category
    b. Compute total, transaction_count, avg_transaction
    c. Compute vs_prev_month and vs_prev_month_pct where previous month data exists
14. Append the analysis event to action-log.csv:
    - `action_type`: analyze
    - `target`: all
    - `status`: completed
    - `details`: "{N} transactions categorized, {M} subscriptions detected"

## Output

"{N} transaktioner kategoriseret, {M} abonnementer fundet"

**Example**: "127 transaktioner kategoriseret, 12 abonnementer fundet"

Followed by a brief breakdown:
```
Kategorier:
- Dagligvarer: 45 transaktioner (4.230 kr)
- Abonnementer: 18 transaktioner (2.847 kr)
- Transport: 22 transaktioner (1.650 kr)
- ...

Nye abonnementer fundet:
- Netflix: 149 kr/måned
- Spotify: 179 kr/måned
- ...
```

## User Memory Integration

When user provides corrections during analysis:

1. **Category correction**: "Det er ikke Shopping, det er Hobby"
   - Detect using `skills/user-memory/SKILL.md` trigger patterns
   - Write to `learnings/categorization.md`
   - Confirm: "Forstået. Jeg kategoriserer det som Hobby fremover."

2. **Subscription correction**: "Det er (ikke) et abonnement"
   - Detect subscription confirmation/denial pattern
   - Write to `learnings/subscriptions.md` (Confirmed or Not sections)
   - Confirm: "Noteret. Jeg husker det."

3. **Merchant alias**: "NETTO FO er bare Netto"
   - Detect merchant alias pattern
   - Write to `learnings/merchants.md`
   - Confirm: "Noteret. Jeg bruger Netto fremover."

## Error Cases

| Error | Message |
|-------|---------|
| No transactions found | "Ingen transaktioner fundet. Kør /smartspender:sync først." |
| All already categorized | "Alle transaktioner er allerede kategoriseret." |
| File read error | "Kunne ikke læse datafiler. Tjek at filerne findes i working directory." |

## Side Effects
- Writes to categorized.csv (new rows)
- Writes to merchant-overrides.csv (new rows learned from manual corrections)
- Writes to subscriptions.csv (new or updated rows)
- Writes to monthly-summary.csv (overwritten for affected months)
- Writes to action-log.csv

## Related Commands
- `/smartspender:sync` — Sync transactions before analyzing
- `/smartspender:overview` — View the analysis results
- `/smartspender:subscriptions` — See detected subscriptions
