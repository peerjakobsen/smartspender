---
description: Scan Gmail for receipt and invoice emails, download attachments, extract data, and match to bank transactions
---

# /smartspender:receipt email

## Trigger
- `/smartspender:receipt email`
- `/smartspender:receipt email 30` (scan last 30 days)
- "Scan mine emails for kvitteringer"
- "Hent fakturaer fra email"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| action | yes | email | - |
| days | no | positive integer | last_email_scan or 90 |

## Prerequisites
- Gmail MCP server configured and accessible
- At least one bank sync completed (transactions.csv exists) for matching to work

## Workflow

1. Check Gmail MCP availability. If not available, respond: "Gmail MCP er ikke konfigureret. Tilfoej Gmail MCP-serveren til dit Cowork-miljoe for at kunne scanne emails."
2. Determine scan date range:
   - If `days` argument provided: scan from (today - days) to today
   - If `last_email_scan` exists in settings.csv: scan from that timestamp to today
   - Otherwise: scan last 90 days
3. Load email scanning rules: `skills/email-receipt-scanning/SKILL.md`
4. Search Gmail using the primary search query with the calculated date range
5. If primary query returns fewer than 3 results, also run supplementary queries
6. Filter results using the include/exclude heuristics from email-receipt-scanning skill
7. If no emails found, respond: "Ingen kvitterings- eller fakturaemails fundet i den valgte periode."
8. Present found emails to user:
   ```
   Jeg fandt {n} emails med kvitteringer eller fakturaer:

   1. {date} — {sender} — "{subject}" {attachment_info}
   2. {date} — {sender} — "{subject}" {attachment_info}
   3. {date} — {sender} — "{subject}" {attachment_info}
   ...

   Vil du importere alle, vaelge enkelte, eller annullere? (alle/vaelg/annuller)
   ```
9. **[USER ACTION]**: User chooses "alle", "vaelg" (then picks numbers), or "annuller"
10. If user cancels, respond: "Email-scanning annulleret." and stop.
11. Load invoice-parsing skill: `skills/invoice-parsing/SKILL.md`
12. Load extraction rules: `skills/receipt-parsing/SKILL.md`
13. Load schema: `skills/receipt-schema/SKILL.md`
14. Load matching rules: `skills/transaction-matching/SKILL.md`
15. For each selected email, process in sequence:
    a. Detect content type (PDF attachment, inline HTML, or both — prefer PDF)
    b. If PDF: download attachment
    c. Detect vendor from email sender domain (per email-receipt-scanning skill sender mapping) or fall through to invoice-parsing skill vendor detection
    d. Check for vendor-specific parser: `invoice-knowledge/{vendor-id}/PARSER.md`
    e. Extract receipt metadata and line items using vendor parser or general rules
    f. Search transactions.csv for matching transactions (amount +-1%, date +-1 day)
    g. Score candidates per transaction-matching confidence rules
    h. If exactly 1 match with confidence >= 0.8: auto-link
    i. If ambiguous: mark as `ambiguous` (batch mode — don't interrupt for each email)
    j. Check for duplicate in receipts.csv (date + merchant + total_amount)
    k. If duplicate: skip this email and note as "allerede registreret"
    l. Generate receipt_id and item_ids
    m. If PDF: save to `receipts/{receipt_id}.pdf`, set `file_reference` to this path
    n. If inline HTML only: set `file_reference` to `email:{message_id}`
    o. Set `source: email` on the receipt row
    p. Append receipt row to receipts.csv
    q. Determine the monthly file from the receipt date: `receipt-items-{YYYY-MM}.csv`
    r. If the monthly file does not exist, create it with the header row
    s. Append item rows to `receipt-items-{YYYY-MM}.csv`
    t. Log to action-log.csv
16. Update `last_email_scan` in settings.csv to current datetime. If settings.csv does not exist, create it with `key,value` header and the `last_email_scan` row.
17. Output batch summary

## Output

### Batch Summary
```
Email-scanning faerdig. {processed} af {total} emails behandlet:

| # | Dato | Leverandoer | Total | Status |
|---|------|-------------|-------|--------|
| 1 | {date} | {merchant} | {total} kr | Matchet med {tx_description} |
| 2 | {date} | {merchant} | {total} kr | Ikke-matchet |
| 3 | {date} | {merchant} | {total} kr | Allerede registreret (sprunget over) |
| 4 | {date} | {merchant} | {total} kr | Tvetydig — brug /smartspender:receipt upload for manuelt match |

{n} nye kvitteringer tilfojet. {m} sprunget over (dubletter).
{If any ambiguous}: {a} kvitteringer har flere mulige transaktioner — upload dem enkeltvis med /smartspender:receipt upload for at vaelge den rigtige transaktion.
{If any without parser}: Tip: Koer /smartspender:receipt learn for at forbedre udtraekningen for nye leverandoerer.
```

**Example**:
```
Email-scanning faerdig. 3 af 4 emails behandlet:

| # | Dato | Leverandoer | Total | Status |
|---|------|-------------|-------|--------|
| 1 | 20. jan | TDC | 299,00 kr | Matchet med PBS TDC 20. jan |
| 2 | 25. jan | Oersted | 2.156,25 kr | Matchet med PBS Oersted 26. jan |
| 3 | 28. jan | Wolt | 187,00 kr | Ikke-matchet |
| 4 | 15. jan | TDC | 299,00 kr | Allerede registreret (sprunget over) |

3 nye kvitteringer tilfojet. 1 sprunget over (dublet).
```

## Error Cases

| Error | Message |
|-------|---------|
| Gmail MCP not available | "Gmail MCP er ikke konfigureret. Tilfoej Gmail MCP-serveren til dit Cowork-miljoe for at kunne scanne emails." |
| No emails found | "Ingen kvitterings- eller fakturaemails fundet i den valgte periode." |
| Gmail auth expired | "Gmail-adgang er udloebet. Forny venligst din Gmail-godkendelse i Cowork-indstillingerne." |
| Attachment download failed | Log warning for that email, continue with next. Note in summary: "Kunne ikke hente vedhaeftning" |
| No transactions synced | "Ingen transaktioner fundet — koer /smartspender:sync foerst for at kunne matche kvitteringer." |
| User cancels | "Email-scanning annulleret." |

## Side Effects
- Downloads PDF attachments to `receipts/` directory
- Writes to receipts.csv (new rows, one per processed email)
- Writes to `receipt-items-{YYYY-MM}.csv` (new rows for extracted line items)
- Writes to action-log.csv (one event per processed email)
- Creates or updates settings.csv with `last_email_scan` timestamp

## Related Commands
- `/smartspender:receipt upload` — Upload a single receipt manually
- `/smartspender:receipt learn` — Save vendor-specific extraction rules after corrections
- `/smartspender:sync` — Sync transactions before scanning emails for matching
