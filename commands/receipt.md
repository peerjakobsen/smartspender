---
description: Upload and process receipt images or PDF invoices, extract line items, and match to bank transactions
---

# /smartspender:receipt

## Trigger
- `/smartspender:receipt upload`
- "Upload en kvittering"
- "Registrer denne kvittering"
- "Tilfoej kvittering"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| action | yes | upload | - |

## Prerequisites
- At least one bank sync completed (transactions.csv exists with data) for matching to work
- User has a receipt image or PDF invoice ready to share

## Workflow

1. Prompt the user to share their receipt: "Del venligst kvitteringen — du kan indsaette et billede eller traekke en PDF ind i chatten."
2. **[USER ACTION]**: User attaches a receipt image or PDF invoice
3. If no file is attached, respond: "Jeg kan ikke se nogen kvittering. Indsaet venligst et billede eller en PDF."
4. Load extraction rules: `skills/receipt-parsing/SKILL.md`
5. Load invoice-parsing skill: `skills/invoice-parsing/SKILL.md`
6. Detect vendor from the uploaded file (filename, header/logo, content keywords) per the invoice-parsing skill's vendor detection workflow
7. If vendor detected: check for `invoice-knowledge/{vendor-id}/PARSER.md`
   - If parser exists: load vendor-specific extraction rules and use them for steps 8-11
   - If no parser: continue with general extraction rules from receipt-parsing skill
8. Extract receipt metadata using Claude Vision:
   - Merchant name (normalize per `skills/categorization/SKILL.md`)
   - Date (convert to YYYY-MM-DD)
   - Total amount (convert to standard decimal format)
   - Currency (default DKK)
9. Present extraction summary to user for confirmation:
   ```
   Jeg aflæste følgende fra kvitteringen:

   Butik: {merchant}
   Dato: {date, Danish format}
   Total: {total} kr

   Er det korrekt? (Eller ret de felter der er forkerte)
   ```
10. **[USER ACTION]**: User confirms or provides corrections
11. Apply any corrections from the user
12. Extract line items from the receipt:
    - Item name, quantity, unit price, total price
    - Assign category and subcategory per `skills/receipt-parsing/SKILL.md` product taxonomy (or vendor-specific PARSER.md if loaded in step 7)
    - Handle discounts (RABAT lines)
13. Validate line item sum against receipt total (per variance rules in receipt-parsing skill)
14. Load schema: `skills/receipt-schema/SKILL.md`
15. Check for duplicate receipts in receipts.csv (same date + merchant + total_amount). If duplicate found, ask: "Denne kvittering ligner en der allerede er registreret ({receipt_id} fra {date}). Vil du tilfoeje den alligevel?"
16. **[USER ACTION]** (only if duplicate): User confirms or cancels
17. If user cancels on duplicate, stop and output: "Kvitteringen blev ikke tilfojet."
18. Load matching rules: `skills/transaction-matching/SKILL.md`
19. Search transactions.csv for matching transactions (amount +-1%, date +-1 day)
20. Score candidates per transaction-matching confidence rules
21. If exactly 1 match with confidence >= 0.8: auto-link to the transaction
22. If multiple candidates or confidence < 0.8: present candidates to user:
    ```
    Jeg fandt {n} mulige transaktioner til denne kvittering:

    1. {date} — {description} — {amount} kr (match: {confidence_pct}%)
    2. {date} — {description} — {amount} kr (match: {confidence_pct}%)

    Hvilken transaktion hører kvitteringen til? (Eller "ingen" hvis ingen passer)
    ```
23. **[USER ACTION]** (only if ambiguous): User picks a candidate or says "ingen"
24. If no candidates found: store as unmatched
25. Generate receipt_id (`rcpt-` + 8 hex chars) and item_ids (`ritm-` + 8 hex chars per item)
26. Create the `receipts/` directory if it does not exist
27. Save the uploaded file to `receipts/{receipt_id}.{ext}` (preserve original extension). Set `file_reference` to this path.
28. If receipts.csv does not exist, create it with the header row
29. Append receipt row to receipts.csv
30. Determine the monthly file from the receipt date: `receipt-items-{YYYY-MM}.csv` (e.g., receipt date 2026-01-28 → `receipt-items-2026-01.csv`)
31. If the monthly file does not exist, create it with the header row
32. Append all item rows to `receipt-items-{YYYY-MM}.csv`
33. Append event to action-log.csv:
    - `action_type`: receipt
    - `target`: {merchant}
    - `status`: completed
    - `details`: "{item_count} items, {match_status} to {transaction_description or 'no transaction'}"
34. Output summary in Danish
35. If the receipt was a PDF invoice without a vendor-specific parser and the user made corrections, suggest: "Tip: Koer /smartspender:receipt learn for at gemme udtraeksregler for {vendor}."

## Output

### Matched Receipt
```
Kvittering registreret fra {merchant} ({date}):

| Vare | Antal | Pris | Kategori |
|------|-------|------|----------|
| {item_name} | {qty} | {total_price} kr | {subcategory} |
| ... | ... | ... | ... |
| **Total** | | **{total} kr** | |

Matchet med transaktion: {transaction_date} — {transaction_description} — {transaction_amount} kr
```

**Example**:
```
Kvittering registreret fra Føtex (28. jan):

| Vare | Antal | Pris | Kategori |
|------|-------|------|----------|
| Minimælk 1L | 2 | 25,90 kr | Mejeriprodukter |
| Hakket oksekød 500g | 1 | 45,00 kr | Kød |
| Øko bananer | 1 | 22,95 kr | Frugt og grønt |
| Coca-Cola 1.5L | 2 | 44,00 kr | Drikkevarer |
| Rødvin Chianti | 1 | 79,95 kr | Alkohol |
| Tandbørstehoveder | 1 | 89,95 kr | Personlig pleje |
| Rugbrød | 1 | 24,95 kr | Brød og bagværk |
| Pose | 1 | 2,00 kr | Andet |
| **Total** | | **347,50 kr** | |

Matchet med transaktion: 28. jan — Dankort-køb FØTEX ØSTERBRO — 347,50 kr
```

### Unmatched Receipt
```
Kvittering registreret fra {merchant} ({date}):

[Same table as above]

Ingen matchende transaktion fundet. Kvitteringen er gemt som ikke-matchet.
```

### Receipt Without Line Items
```
Kvittering registreret fra {merchant} ({date}):

Total: {total} kr
Ingen varelinjer fundet — kun totalen er registreret.

{Match status message}
```

## Error Cases

| Error | Message |
|-------|---------|
| No file attached | "Jeg kan ikke se nogen kvittering. Indsæt venligst et billede eller en PDF." |
| Unreadable receipt | "Kvitteringen er for utydelig til at aflæse. Prøv venligst med et tydeligere billede." |
| 0 items + no total | "Jeg kunne ikke aflæse noget fra dette billede. Er du sikker på det er en kvittering?" |
| Duplicate rejected | "Kvitteringen blev ikke tilføjet." |
| No transactions synced | "Ingen transaktioner fundet — kør /smartspender:sync først for at kunne matche kvitteringer." |
| File is not a receipt | "Dette ser ikke ud til at være en kvittering eller faktura. Del venligst et billede af en kvittering." |

## Side Effects
- Saves receipt file to `receipts/` directory
- Writes to receipts.csv (new row)
- Writes to `receipt-items-{YYYY-MM}.csv` (new rows)
- Writes to action-log.csv (receipt event)

## Related Commands
- `/smartspender:sync` — Sync transactions before uploading receipts for matching
- `/smartspender:analyze` — Categorize transactions (receipt data adds granularity)
- `/smartspender:receipt learn` — Save vendor-specific extraction rules after corrections
- `/smartspender:receipt email` — Scan Gmail for receipt and invoice emails
