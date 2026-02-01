---
description: Learn vendor-specific invoice extraction rules from corrections made during receipt processing
---

# /smartspender:receipt learn

## Trigger
- `/smartspender:receipt learn`
- "Gem udtraeksregler"
- "Laer denne faktura"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| action | yes | learn | - |

## Prerequisites
- A receipt or invoice has been processed in the current conversation
- User has verified and/or corrected the extraction results
- The processed receipt was a PDF invoice (not a grocery receipt or card slip)

## Workflow

1. Check if the current conversation contains a receipt/invoice processing session with extraction results. If not, respond: "Jeg kan ikke finde en behandlet faktura i denne samtale. Behandl venligst en faktura med /smartspender:receipt upload foerst."
2. Identify the vendor from the conversation context:
   - Use the extracted merchant name from the receipt processing
   - Normalize to vendor-id (lowercase, no spaces, no A/S suffix)
3. Analyze the conversation for corrections the user made:
   - Changed merchant name
   - Changed date or billing period
   - Changed total amount
   - Changed line item names, categories, or subcategories
   - Added missing line items
   - Removed incorrect line items
   - Changed extraction approach (e.g., "the total is on page 2, not page 1")
4. Summarize the learned rules and present to user for confirmation:
   ```
   Jeg har identificeret foelgende regler for {Vendor Name} fakturaer:

   Leverandoer: {vendor name} (ID: {vendor-id})
   Fakturetype: {type, e.g., Telecom, Forsyning}

   Udtraeksregler:
   - {rule 1, e.g., "Fakturadato findes efter 'Dato:' paa side 1"}
   - {rule 2, e.g., "Total findes efter 'I alt inkl. moms'"}
   - {rule 3, e.g., "Linjer kategoriseres som Abonnementer > Mobilabonnement"}

   Rettelser fra denne session:
   - {correction 1, e.g., "'Ekstra data' skal vaere Mobilabonnement, ikke Internet"}

   Skal jeg gemme disse regler? (ja/nej)
   ```
5. **[USER ACTION]**: User confirms or provides additional corrections
6. If user says no: respond "Reglerne blev ikke gemt." and stop.
7. Check if `invoice-knowledge/{vendor-id}/PARSER.md` already exists:
   - **EXISTS**: Update the existing file:
     - Add new entries to the Learned Corrections table with today's date
     - Update extraction rules if the user's corrections change the approach
     - Update Last Updated date
   - **DOES NOT EXIST**: Create a new parser:
     - Create directory `invoice-knowledge/{vendor-id}/`
     - Copy structure from `invoice-knowledge/_template.md`
     - Fill in Vendor Info from conversation context
     - Fill in Extraction Rules from the processed invoice structure
     - Fill in Line Items from the extracted (and corrected) items
     - Add any corrections to the Learned Corrections table
     - Set Last Updated to today
8. Write the file to `invoice-knowledge/{vendor-id}/PARSER.md`
9. Output confirmation:
   ```
   Regler for {Vendor Name} er gemt i invoice-knowledge/{vendor-id}/PARSER.md.

   {If new}: Ny leverandoer-parser oprettet med {n} udtraeksregler.
   {If updated}: Eksisterende parser opdateret med {n} nye rettelser.

   Naeste gang du behandler en faktura fra {Vendor Name}, vil disse regler
   automatisk blive brugt til mere praecis udtraekning.
   ```

## Output

### New Parser Created
```
Regler for {Vendor Name} er gemt i invoice-knowledge/{vendor-id}/PARSER.md.

Ny leverandoer-parser oprettet med {n} udtraeksregler.

Naeste gang du behandler en faktura fra {Vendor Name}, vil disse regler
automatisk blive brugt til mere praecis udtraekning.
```

### Existing Parser Updated
```
Regler for {Vendor Name} er opdateret i invoice-knowledge/{vendor-id}/PARSER.md.

Eksisterende parser opdateret med {n} nye rettelser.

Naeste gang du behandler en faktura fra {Vendor Name}, vil de opdaterede
regler automatisk blive brugt.
```

## Error Cases

| Error | Message |
|-------|---------|
| No receipt in conversation | "Jeg kan ikke finde en behandlet faktura i denne samtale. Behandl venligst en faktura med /smartspender:receipt upload foerst." |
| Receipt is a grocery receipt | "Laering fungerer bedst med PDF-fakturaer fra faste leverandoerer. Dagligvarekvitteringer bruger generelle regler." |
| No corrections found | "Udtraekningen var korrekt uden rettelser. Vil du stadig gemme regler for {vendor}? Det kan hjaelpe med fremtidige fakturaer." |
| User cancels | "Reglerne blev ikke gemt." |

## Side Effects
- Creates or updates `invoice-knowledge/{vendor-id}/PARSER.md`
- May create `invoice-knowledge/{vendor-id}/` directory

## Related Commands
- `/smartspender:receipt upload` — Process a receipt (triggers learning suggestion)
- `/smartspender:receipt email` — Scan emails for receipts (also triggers learning suggestion)
