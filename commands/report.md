---
description: Generate a detailed monthly financial report with comparisons and recommendations
---

# /smartspender:report

## Trigger
- `/smartspender:report [month]`
- "Lav en rapport for januar"
- "Månedlig rapport"
- "Generate a monthly report"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| month | yes | januar, februar, ..., 2026-01, etc. | - |

Accepts Danish month names (januar, februar, marts, april, maj, juni, juli, august, september, oktober, november, december) or YYYY-MM format.

## Prerequisites
- Transactions synced and analyzed for the target month

## Workflow

1. Parse the `month` argument. Convert Danish month name to YYYY-MM format if needed.
2. Read data from all relevant CSV files for the target month:
   - **monthly-summary.csv**: Category totals and comparisons
   - **categorized.csv**: Individual transactions for the month
   - **subscriptions.csv**: Active and changed subscriptions
   - **action-log.csv**: Actions taken during the month
   - **monthly-summary.csv (previous month)**: For comparison data
3. If no data for the target month: "Ingen data for {month}. Kør /smartspender:sync og /smartspender:analyze først."
4. Compile the report sections:

### Spending Summary
- Total spending (excluding Indkomst and Opsparing)
- Total income
- Net cash flow (income - spending)
- Number of transactions

### Category Breakdown
- All categories sorted by total (highest first)
- Percentage of total spending
- Month-over-month change (absolute and percentage)
- Flag categories with > 20% change

### Month-Over-Month Comparison
- Highlight the 3 largest increases
- Highlight the 3 largest decreases
- Note any new categories not present in previous month

### Unusual Transactions
- Transactions > 3x category average
- Single transactions > 5.000 kr (except Bolig and Indkomst)
- Potential duplicate charges (same merchant, same day, same amount)

### Subscription Changes
- Any new subscriptions detected this month
- Any cancellations made this month
- Price changes on existing subscriptions
- Total subscription cost (monthly and annual)

### Actions Taken
- Read from action-log.csv for the target month
- List syncs, analyses, cancellations, and other actions
- Include savings achieved from cancellations

### Recommendations
- Generate savings suggestions per `skills/spending-analysis/SKILL.md`
- Include estimated annual savings for each recommendation

5. Append the report generation to action-log.csv:
   - `action_type`: report
   - `target`: {month}
   - `status`: completed

## Output

```
## {Month} {Year} — Månedlig rapport

### Resume
I {month} brugte du {total} kr fordelt på {count} transaktioner.
Din indkomst var {income} kr, hvilket giver et netto cashflow på {net} kr.

### Forbrug pr. kategori
| Kategori | Beløb | Andel | Ændr. vs. {prev_month} |
|----------|-------|-------|------------------------|
| Bolig | 12.000 kr | 42% | — |
| Dagligvarer | 4.200 kr | 15% | +8% |
| Transport | 2.100 kr | 7% | -12% |
| ... | ... | ... | ... |
**Samlet forbrug**: {total} kr

### Sammenlignet med {previous_month}
- Restauranter steg med 25% (1.650 kr vs. 1.320 kr)
- Shopping steg med 15% (1.400 kr vs. 1.217 kr)
- Transport faldt med 12% (2.100 kr vs. 2.386 kr)

### Usaedvanlige transaktioner
- 15. jan: IKEA — 4.500 kr (3,2x gennemsnit for Shopping)
- 22. jan: Restaurant Cofoco — 1.200 kr (enkelt transaktion > gennemsnit)

### Abonnementer
| Tjeneste | Månedlig | Status |
|----------|----------|--------|
| Netflix | 149 kr | Aktiv |
| Spotify | 179 kr | Aktiv |
| Viaplay | 99 kr | Opsagt 15. jan |
| ... | ... | ... |
**Total aktive**: {total} kr/måned ({annual} kr/år)
Opsagt denne måned: Viaplay (besparelse: 1.188 kr/år)

### Handlinger i {month}
- 1. jan: Synkroniseret 47 transaktioner fra Nykredit
- 2. jan: Kategoriseret 47 transaktioner
- 15. jan: Opsagt Viaplay (besparelse: 1.188 kr/år)

### Anbefalinger
1. Overvej at konsolidere streamingtjenester — Spar op til 1.788 kr/år
2. Restaurantforbrug steg 25% — Overvej madlavning hjemme
3. Tjek Adobe CC — 459 kr/måned kan muligvis nedgraderes
```

## Error Cases

| Error | Message |
|-------|---------|
| No data for month | "Ingen data for {month}. Kør /smartspender:sync og /smartspender:analyze først." |
| Invalid month argument | "Ugyldigt månedsnavn: '{input}'. Brug f.eks. 'januar' eller '2026-01'." |

## Side Effects
- Writes to action-log.csv (report generation logged)

## Related Commands
- `/smartspender:overview` — Quick spending overview (less detailed than report)
- `/smartspender:analyze` — Run analysis before generating report
- `/smartspender:subscriptions` — Focus on subscription details
