---
description: Show spending summary with category breakdown, savings suggestions, and optional detailed report
---

# /smartspender:overview

## Trigger
- `/smartspender:overview [month]`
- `/smartspender:overview [month] --detailed`
- `/smartspender:overview [merchant] [month]`
- `/smartspender:report [month]` — Alias for overview --detailed
- "Vis mit forbrugsoverblik"
- "Hvordan ser mit forbrug ud?"
- "Show my spending overview"
- "Lav en rapport for januar" — triggers detailed mode
- "Maanedlig rapport" — triggers detailed mode
- "Hvad bruger jeg hos {merchant}"
- "Fortael mig hvad jeg bruger hos {merchant}"
- "{merchant} forbrug"
- "{merchant} breakdown"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| merchant | no | Merchant name (e.g., Bilka, Foetex, Netto) | none |
| month | no | januar, februar, ..., 2026-01, etc. | Current month (or all-time if merchant is set) |
| --detailed | no | flag | false |

Accepts Danish month names (januar, februar, marts, april, maj, juni, juli, august, september, oktober, november, december) or YYYY-MM format.

When `merchant` is provided, the command switches to receipt-level breakdown mode. The `month` argument becomes optional (defaults to all-time when used with merchant).

## Prerequisites
- **Standard overview**: Transactions analyzed (categorized.csv and monthly-summary.csv have data)
- **Merchant breakdown**: At least one receipt in receipts.csv for the specified merchant

## Workflow

1. Parse arguments. Determine if a `merchant` argument is present.
2. Convert Danish month name to YYYY-MM format if needed (e.g., "januar" -> "2026-01" assuming current year)
3. Determine mode:
   - If `--detailed` flag present: detailed mode
   - If trigger contains "rapport" or "report": detailed mode
   - If end of month (day >= 26): detailed mode automatically
   - If `merchant` provided: merchant breakdown mode
   - Otherwise: concise overview mode

### Standard Overview (no merchant, not detailed)

4. If no `month` provided, use the current month.
5. Read monthly-summary.csv, filtered to the target month
6. If no data for the target month: "Ingen data for {month}. Koer /smartspender:analyze foerst."
7. Read subscriptions.csv (filter to `status: active`)
8. Calculate totals:
   - Total spending (sum of all category totals, excluding Indkomst and Opsparing)
   - Category percentages
   - Subscription monthly total and annual total
9. Format using the spending overview template from `skills/spending-analysis/SKILL.md`
10. Generate savings recommendations:
    - Check for duplicate streaming subscriptions
    - Check for subscriptions with no recent usage signals
    - Check for categories with significant month-over-month increases
11. Present the formatted overview in Danish

### Detailed Mode (--detailed or /smartspender:report)

4. If no `month` provided, use the current month.
5. Read data from all relevant CSV files for the target month:
   - **monthly-summary.csv**: Category totals and comparisons
   - **categorized.csv**: Individual transactions for the month
   - **subscriptions.csv**: Active and changed subscriptions
   - **action-log.csv**: Actions taken during the month
   - **monthly-summary.csv (previous month)**: For comparison data
6. If no data for the target month: "Ingen data for {month}. Koer /smartspender:sync og /smartspender:analyze foerst."
7. Compile the detailed report sections:

#### Spending Summary
- Total spending (excluding Indkomst and Opsparing)
- Total income
- Net cash flow (income - spending)
- Number of transactions

#### Category Breakdown
- All categories sorted by total (highest first)
- Percentage of total spending
- Month-over-month change (absolute and percentage)
- Flag categories with > 20% change

#### Month-Over-Month Comparison
- Highlight the 3 largest increases
- Highlight the 3 largest decreases
- Note any new categories not present in previous month

#### Unusual Transactions
- Transactions > 3x category average
- Single transactions > 5.000 kr (except Bolig and Indkomst)
- Potential duplicate charges (same merchant, same day, same amount)

#### Subscription Changes
- Any new subscriptions detected this month
- Any cancellations made this month
- Price changes on existing subscriptions
- Total subscription cost (monthly and annual)

#### Actions Taken
- Read from action-log.csv for the target month
- List syncs, analyses, cancellations, and other actions
- Include savings achieved from cancellations

#### Recommendations
- Generate savings suggestions per `skills/spending-analysis/SKILL.md`
- Include estimated annual savings for each recommendation

8. Append the report generation to action-log.csv:
   - `action_type`: report
   - `target`: {month}
   - `status`: completed

### Merchant Breakdown (merchant provided)

4. Normalize the merchant name using rules from `skills/categorization/SKILL.md` (case-insensitive matching against known merchant patterns)
5. Read `receipts.csv`, filter by normalized merchant name (case-insensitive match on `merchant` column)
6. If `month` argument is provided, further filter receipts by `date` column (YYYY-MM prefix match). If no month, use all receipts for this merchant.
7. If no receipts match: "Ingen kvitteringer fundet for {merchant}. Upload en kvittering med `/smartspender:receipt upload`."
8. Collect all matching `receipt_id` values and their `date` values
9. Determine which monthly files to read: extract unique YYYY-MM values from the collected receipt dates
10. For each monthly file `receipt-items-{YYYY-MM}.csv`: read it if it exists, filter to rows where `receipt_id` is in the collected set. Skip if the file doesn't exist.
11. Combine all matching rows from the monthly files
12. Aggregate by `subcategory` per Receipt-Level Breakdown rules in `skills/spending-analysis/SKILL.md`:
   - Group by subcategory, compute total, percentage, item count
   - Sort by total (highest first)
   - Identify top 3 most purchased items overall
13. Format using the merchant breakdown output template (see below)
14. Present the formatted breakdown in Danish

## Output

### Standard Overview

```
## {Month} {Year} — Overblik

**Samlet forbrug**: {total} kr

### Fordeling pr. kategori
| Kategori | Beloeb | Andel | AEndr. |
|----------|-------|-------|-------|
| Bolig | 12.000 kr | 42% | — |
| Dagligvarer | 4.200 kr | 15% | +8% |
| Transport | 2.100 kr | 7% | -12% |
| Abonnementer | 1.847 kr | 6% | — |
| Restauranter | 1.650 kr | 6% | +25% |
| Shopping | 1.400 kr | 5% | — |
| ... | ... | ... | ... |

### Abonnementer ({count} aktive)
| Tjeneste | Maanedlig | Aarlig | Status |
|----------|----------|-------|--------|
| Netflix | 149 kr | 1.788 kr | Aktiv |
| Spotify Family | 179 kr | 2.148 kr | Aktiv |
| Viaplay | 99 kr | 1.188 kr | Aktiv |
| Fitness World | 299 kr | 3.588 kr | Aktiv |
| ... | ... | ... | ... |
**Total**: {total} kr/maaned ({annual} kr/aar)

### Forslag til besparelser
1. Opsig Viaplay — Spar 1.188 kr/aar
2. Overvej Adobe CC — 459 kr/maaned virker hoejt
3. Konsolider streaming? Netflix + HBO + Viaplay = 397 kr/maaned
```

### Detailed Report (--detailed mode)

```
## {Month} {Year} — Maanedlig rapport

### Resume
I {month} brugte du {total} kr fordelt paa {count} transaktioner.
Din indkomst var {income} kr, hvilket giver et netto cashflow paa {net} kr.

### Forbrug pr. kategori
| Kategori | Beloeb | Andel | AEndr. vs. {prev_month} |
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
| Tjeneste | Maanedlig | Status |
|----------|----------|--------|
| Netflix | 149 kr | Aktiv |
| Spotify | 179 kr | Aktiv |
| Viaplay | 99 kr | Opsagt 15. jan |
| ... | ... | ... |
**Total aktive**: {total} kr/maaned ({annual} kr/aar)
Opsagt denne maaned: Viaplay (besparelse: 1.188 kr/aar)

### Handlinger i {month}
- 1. jan: Synkroniseret 47 transaktioner
- 2. jan: Kategoriseret 47 transaktioner
- 15. jan: Opsagt Viaplay (besparelse: 1.188 kr/aar)

### Anbefalinger
1. Overvej at konsolidere streamingtjenester — Spar op til 1.788 kr/aar
2. Restaurantforbrug steg 25% — Overvej madlavning hjemme
3. Tjek Adobe CC — 459 kr/maaned kan muligvis nedgraderes
```

### Merchant Breakdown

```
## {Merchant} — Indkoebsoversigt {month or "samlet"}

**Antal kvitteringer**: {count}
**Samlet forbrug**: {total} kr

### Fordeling pr. varekategori
| Kategori | Beloeb | Andel | Antal varer |
|----------|-------|-------|-------------|
| Alkohol | 480 kr | 24% | 6 |
| Koed | 360 kr | 18% | 8 |
| Mejeriprodukter | 300 kr | 15% | 12 |
| Frugt og groent | 240 kr | 12% | 9 |
| Drikkevarer | 200 kr | 10% | 5 |
| ... | ... | ... | ... |

### Hyppigst koebte varer
1. Minimælk 1L — {count}x — {total} kr
2. Hakket oksekød 500g — {count}x — {total} kr
3. Øko bananer — {count}x — {total} kr
```

When showing all-time totals (no month specified), append after the table:

```
**Gennemsnit pr. maaned**: {avg} kr ({month_count} maaneder)
```

## Error Cases

| Error | Message |
|-------|---------|
| No data for month | "Ingen data for {month}. Koer /smartspender:analyze foerst." |
| No categorized data | "Ingen kategoriserede transaktioner fundet. Koer /smartspender:analyze foerst." |
| Invalid month argument | "Ugyldigt maanedsnavn: '{input}'. Brug f.eks. 'januar' eller '2026-01'." |
| No receipts for merchant | "Ingen kvitteringer fundet for {merchant}. Upload en kvittering med `/smartspender:receipt upload`." |

## Side Effects
- Writes to action-log.csv (report generation logged, detailed mode only)

## Related Commands
- `/smartspender:analyze` — Run analysis before viewing overview
- `/smartspender:subscriptions` — Focus on subscription details
- `/smartspender:receipt upload` — Upload receipts for merchant-level breakdown
