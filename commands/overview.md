---
description: Show spending summary with category breakdown and savings suggestions
---

# /smartspender:overview

## Trigger
- `/smartspender:overview [month]`
- `/smartspender:overview [merchant] [month]`
- "Vis mit forbrugsoverblik"
- "Hvordan ser mit forbrug ud?"
- "Show my spending overview"
- "Hvad bruger jeg hos {merchant}"
- "Fortæl mig hvad jeg bruger hos {merchant}"
- "{merchant} forbrug"
- "{merchant} breakdown"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| merchant | no | Merchant name (e.g., Bilka, Føtex, Netto) | none |
| month | no | januar, februar, ..., 2026-01, etc. | Current month (or all-time if merchant is set) |

Accepts Danish month names (januar, februar, marts, april, maj, juni, juli, august, september, oktober, november, december) or YYYY-MM format.

When `merchant` is provided, the command switches to receipt-level breakdown mode. The `month` argument becomes optional (defaults to all-time when used with merchant).

## Prerequisites
- **Standard overview**: Transactions analyzed (categorized.csv and monthly-summary.csv have data)
- **Merchant breakdown**: At least one receipt in receipts.csv for the specified merchant

## Workflow

1. Parse arguments. Determine if a `merchant` argument is present.
2. Convert Danish month name to YYYY-MM format if needed (e.g., "januar" -> "2026-01" assuming current year)

### Standard Overview (no merchant)

3. If no `month` provided, use the current month.
4. Read monthly-summary.csv, filtered to the target month
5. If no data for the target month: "Ingen data for {month}. Kør /smartspender:analyze først."
6. Read subscriptions.csv (filter to `status: active`)
7. Calculate totals:
   - Total spending (sum of all category totals, excluding Indkomst and Opsparing)
   - Category percentages
   - Subscription monthly total and annual total
8. Format using the spending overview template from `skills/spending-analysis/SKILL.md`
9. Generate savings recommendations:
   - Check for duplicate streaming subscriptions
   - Check for subscriptions with no recent usage signals
   - Check for categories with significant month-over-month increases
10. Present the formatted overview in Danish

### Merchant Breakdown (merchant provided)

3. Normalize the merchant name using rules from `skills/categorization/SKILL.md` (case-insensitive matching against known merchant patterns)
4. Read `receipts.csv`, filter by normalized merchant name (case-insensitive match on `merchant` column)
5. If `month` argument is provided, further filter receipts by `date` column (YYYY-MM prefix match). If no month, use all receipts for this merchant.
6. If no receipts match: "Ingen kvitteringer fundet for {merchant}. Upload en kvittering med `/smartspender:receipt upload`."
7. Collect all matching `receipt_id` values and their `date` values
8. Determine which monthly files to read: extract unique YYYY-MM values from the collected receipt dates
9. For each monthly file `receipt-items-{YYYY-MM}.csv`: read it if it exists, filter to rows where `receipt_id` is in the collected set. Skip if the file doesn't exist.
10. Combine all matching rows from the monthly files
11. Aggregate by `subcategory` per Receipt-Level Breakdown rules in `skills/spending-analysis/SKILL.md`:
   - Group by subcategory, compute total, percentage, item count
   - Sort by total (highest first)
   - Identify top 3 most purchased items overall
12. Format using the merchant breakdown output template (see below)
13. Present the formatted breakdown in Danish

## Output

### Standard Overview

```
## {Month} {Year} — Overblik

**Samlet forbrug**: {total} kr

### Fordeling pr. kategori
| Kategori | Beløb | Andel | Ændr. |
|----------|-------|-------|-------|
| Bolig | 12.000 kr | 42% | — |
| Dagligvarer | 4.200 kr | 15% | +8% |
| Transport | 2.100 kr | 7% | -12% |
| Abonnementer | 1.847 kr | 6% | — |
| Restauranter | 1.650 kr | 6% | +25% |
| Shopping | 1.400 kr | 5% | — |
| ... | ... | ... | ... |

### Abonnementer ({count} aktive)
| Tjeneste | Månedlig | Årlig | Status |
|----------|----------|-------|--------|
| Netflix | 149 kr | 1.788 kr | Aktiv |
| Spotify Family | 179 kr | 2.148 kr | Aktiv |
| Viaplay | 99 kr | 1.188 kr | Aktiv |
| Fitness World | 299 kr | 3.588 kr | Aktiv |
| ... | ... | ... | ... |
**Total**: {total} kr/måned ({annual} kr/år)

### Forslag til besparelser
1. Opsig Viaplay — Spar 1.188 kr/år
2. Overvej Adobe CC — 459 kr/måned virker højt
3. Konsolider streaming? Netflix + HBO + Viaplay = 397 kr/måned
```

### Merchant Breakdown

```
## {Merchant} — Indkøbsoversigt {month or "samlet"}

**Antal kvitteringer**: {count}
**Samlet forbrug**: {total} kr

### Fordeling pr. varekategori
| Kategori | Beløb | Andel | Antal varer |
|----------|-------|-------|-------------|
| Alkohol | 480 kr | 24% | 6 |
| Kød | 360 kr | 18% | 8 |
| Mejeriprodukter | 300 kr | 15% | 12 |
| Frugt og grønt | 240 kr | 12% | 9 |
| Drikkevarer | 200 kr | 10% | 5 |
| ... | ... | ... | ... |

### Hyppigst købte varer
1. Minimælk 1L — {count}x — {total} kr
2. Hakket oksekød 500g — {count}x — {total} kr
3. Øko bananer — {count}x — {total} kr
```

When showing all-time totals (no month specified), append after the table:

```
**Gennemsnit pr. måned**: {avg} kr ({month_count} måneder)
```

## Error Cases

| Error | Message |
|-------|---------|
| No data for month | "Ingen data for {month}. Kør /smartspender:analyze først." |
| No categorized data | "Ingen kategoriserede transaktioner fundet. Kør /smartspender:analyze først." |
| Invalid month argument | "Ugyldigt månedsnavn: '{input}'. Brug f.eks. 'januar' eller '2026-01'." |
| No receipts for merchant | "Ingen kvitteringer fundet for {merchant}. Upload en kvittering med `/smartspender:receipt upload`." |

## Side Effects
None — this is a read-only command.

## Related Commands
- `/smartspender:analyze` — Run analysis before viewing overview
- `/smartspender:report` — Get a more detailed monthly report
- `/smartspender:subscriptions` — Focus on subscription details
- `/smartspender:receipt upload` — Upload receipts for merchant-level breakdown
