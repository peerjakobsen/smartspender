---
description: List all detected subscriptions with monthly and annual costs
---

# /smartspender:subscriptions

## Trigger
- `/smartspender:subscriptions [filter]`
- "Vis mine abonnementer"
- "Hvilke abonnementer har jeg?"
- "Show my subscriptions"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| filter | no | active, cancelled, all | all |

## Prerequisites
- Transactions analyzed (subscriptions.csv has data)

## Workflow

1. Read all rows from subscriptions.csv
2. If no subscriptions found: "Ingen abonnementer fundet. Kør /smartspender:analyze først."
3. Apply filter:
   - `active`: only show rows where `status` is `active`
   - `cancelled`: only show rows where `status` is `cancelled`
   - `all` (default): show all rows
4. Sort by `amount` descending (most expensive first)
5. Calculate totals:
   - Monthly total: sum of `amount` for active subscriptions
   - Annual total: sum of `annual_cost` for active subscriptions
6. Format as a Danish-language table

## Output

```
## Dine abonnementer

### Aktive ({count})
| Tjeneste | Kategori | Månedlig | Årlig | Sidst set |
|----------|----------|----------|-------|-----------|
| Fitness World | Fitness | 299 kr | 3.588 kr | 1. jan 2026 |
| Spotify Family | Streaming | 179 kr | 2.148 kr | 1. jan 2026 |
| Netflix | Streaming | 149 kr | 1.788 kr | 1. jan 2026 |
| HBO Max | Streaming | 149 kr | 1.788 kr | 15. dec 2025 |
| Viaplay | Streaming | 99 kr | 1.188 kr | 1. dec 2025 |
| ... | ... | ... | ... | ... |

**Total**: {monthly_total} kr/måned ({annual_total} kr/år)

### Opsagte ({count})
| Tjeneste | Beløb | Opsagt |
|----------|-------|--------|
| ... | ... | ... |
```

If filter is `active`, only show the active section. If `cancelled`, only show the cancelled section.

## Error Cases

| Error | Message |
|-------|---------|
| No subscriptions found | "Ingen abonnementer fundet. Kør /smartspender:analyze først." |
| No active subscriptions | "Ingen aktive abonnementer fundet." |

## Side Effects
None — this is a read-only command.

## Related Commands
- `/smartspender:analyze` — Detect subscriptions from transactions
- `/smartspender:cancel` — Cancel a specific subscription
- `/smartspender:overview` — Full spending overview including subscriptions
