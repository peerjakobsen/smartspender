---
description: Upload and process Danish payslips (lønsedler) for pension tracking, income analysis, and enhanced financial advice
---

# /smartspender:payslip

## Trigger
- `/smartspender:payslip upload`
- `/smartspender:payslip history`
- `/smartspender:payslip learn`
- "Upload en lønseddel"
- "Registrer min lønseddel"
- "Vis lønseddelhistorik"
- "Show my payslip history"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| action | yes | upload, history, learn | - |

---

## Action: upload

### Prerequisites
- At least one bank sync completed (transactions.csv exists with data) for matching to work
- User has a payslip image or PDF ready to share

### Workflow

1. Prompt the user to share their payslip: "Del venligst din lønseddel — du kan indsætte et billede eller trække en PDF ind i chatten."
2. **[USER ACTION]**: User attaches a payslip image or PDF
3. If no file is attached, respond: "Jeg kan ikke se nogen lønseddel. Indsæt venligst et billede eller en PDF."
4. Load extraction rules: `skills/payslip-parsing/SKILL.md`
5. Detect employer from the uploaded file (header, CVR, filename) per the payslip-parsing skill
6. If employer detected: check for `payslip-knowledge/{employer-id}/PARSER.md`
   - If parser exists: load employer-specific extraction rules
   - If no parser: continue with general extraction rules
7. Extract payslip data using Claude Vision:
   - pay_period (YYYY-MM)
   - employer (company name)
   - gross_salary (bruttoløn)
   - am_bidrag (8% labor market contribution)
   - a_skat (income tax)
   - pension_employer (arbejdsgiverpension)
   - pension_employee (egetbidrag)
   - atp (ATP contribution)
   - feriepenge (holiday pay)
   - net_salary (nettoløn / udbetalt)
   - Any additional benefits (sundhedsforsikring, fritvalgskonto, etc.)
8. Calculate derived fields:
   - pension_total = pension_employer + pension_employee
   - pension_pct = (pension_total / gross_salary) * 100
9. Validate extraction per `skills/payslip-parsing/SKILL.md`:
   - AM-bidrag should be ~8% of gross (±5 kr tolerance)
   - Sum check: gross - deductions ≈ net (±2% tolerance)
10. Present extraction summary to user for confirmation:
    ```
    Jeg aflæste følgende fra lønsedlen:

    Lønperiode: {pay_period, Danish format}
    Arbejdsgiver: {employer}

    INDTÆGTER
    Bruttoløn:              {gross_salary} kr

    FRADRAG
    AM-bidrag (8%):         {am_bidrag} kr
    A-skat:                 {a_skat} kr
    ATP:                    {atp} kr
    Pension (egetbidrag):   {pension_employee} kr

    ARBEJDSGIVERBIDRAG
    Pension:                {pension_employer} kr

    TIL UDBETALING:         {net_salary} kr

    Samlet pension: {pension_total} kr ({pension_pct}% af bruttoløn)

    Er det korrekt? (Eller ret de felter der er forkerte)
    ```
11. **[USER ACTION]**: User confirms or provides corrections
12. Apply any corrections from the user
13. Load schema: `skills/data-schemas/SKILL.md`
14. Check for duplicate payslips in payslips.csv (same employer_id + same pay_period). If duplicate found, ask: "Denne lønseddel ligner en der allerede er registreret ({payslip_id} for {pay_period}). Vil du tilføje den alligevel?"
15. **[USER ACTION]** (only if duplicate): User confirms or cancels
16. If user cancels on duplicate, stop and output: "Lønsedlen blev ikke tilføjet."
17. Load matching rules: `skills/transaction-matching/SKILL.md`
18. Search transactions.csv for matching salary transactions:
    - Amount within ±1% of net_salary
    - Date within 5 days after pay_period end (e.g., for January payslip, search Feb 1-5)
    - Transaction type: CRDT (credit/income)
    - Description patterns: "Løn", "Salary", employer name
19. Score candidates per transaction-matching confidence rules
20. If exactly 1 match with confidence >= 0.8: auto-link to the transaction
21. If multiple candidates or confidence < 0.8: present candidates to user:
    ```
    Jeg fandt {n} mulige løntransaktioner til denne lønseddel:

    1. {date} — {description} — {amount} kr (match: {confidence_pct}%)
    2. {date} — {description} — {amount} kr (match: {confidence_pct}%)

    Hvilken transaktion hører lønsedlen til? (Eller "ingen" hvis ingen passer)
    ```
22. **[USER ACTION]** (only if ambiguous): User picks a candidate or says "ingen"
23. If no candidates found: store as unmatched
24. Generate payslip_id (`ps-` + 8 hex chars)
25. Create the `payslips/` directory if it does not exist
26. Save the uploaded file to `payslips/{payslip_id}.{ext}` (preserve original extension). Set `file_reference` to this path.
27. Serialize benefits to JSON string for benefits_json column
28. If payslips.csv does not exist, create it with the header row
29. Append payslip row to payslips.csv
30. Append event to action-log.csv:
    - `action_type`: payslip
    - `target`: {employer}
    - `status`: completed
    - `details`: "{pay_period}, pension {pension_pct}%, {match_status}"
31. Output summary in Danish
32. If pension_pct < 15, add recommendation: "Bemærk: Din pensionsopsparing er {pension_pct}% — anbefalet minimum er 15% af bruttoløn."
33. If this was a new employer without a parser and the user made corrections, suggest: "Tip: Kør /smartspender:payslip learn for at gemme udtræksregler for {employer}."

### Output

#### Matched Payslip
```
Lønseddel registreret for {pay_period, Danish}:

| Post | Beløb |
|------|-------|
| Bruttoløn | {gross_salary} kr |
| AM-bidrag | -{am_bidrag} kr |
| A-skat | -{a_skat} kr |
| ATP | -{atp} kr |
| Pension (din del) | -{pension_employee} kr |
| **Nettoløn** | **{net_salary} kr** |

Arbejdsgiverpension: {pension_employer} kr
**Samlet pension: {pension_total} kr ({pension_pct}% af bruttoløn)**

Matchet med transaktion: {transaction_date} — {transaction_description} — {transaction_amount} kr
```

**Example**:
```
Lønseddel registreret for januar 2026:

| Post | Beløb |
|------|-------|
| Bruttoløn | 42.000 kr |
| AM-bidrag | -3.360 kr |
| A-skat | -11.200 kr |
| ATP | -94,65 kr |
| Pension (din del) | -2.100 kr |
| **Nettoløn** | **25.245,35 kr** |

Arbejdsgiverpension: 4.200 kr
**Samlet pension: 6.300 kr (15,0% af bruttoløn)**

Matchet med transaktion: 31. jan — Løn Teknologi A/S — 25.245,35 kr

Du indbetaler 15% til pension — flot! Det svarer til anbefalingen.
```

#### Unmatched Payslip
```
Lønseddel registreret for {pay_period}:

[Same table as above]

Ingen matchende løntransaktion fundet. Lønsedlen er gemt som ikke-matchet.
```

#### Low Pension Warning
```
Lønseddel registreret for {pay_period}:

[Same table as above]

⚠️ Bemærk: Din pensionsopsparing er 10% — anbefalet minimum er 15% af bruttoløn.
En stigning på 5 procentpoint (2.100 kr/måned) vil koste dig ca. 1.200 kr efter skat.
Kontakt din pensionsordning eller HR for at øge indbetalingen.
```

---

## Action: history

### Prerequisites
- At least one payslip uploaded (payslips.csv has data)

### Workflow

1. Load schema: `skills/data-schemas/SKILL.md`
2. Read payslips.csv
3. If no payslips found, respond: "Ingen lønsedler fundet. Kør `/smartspender:payslip upload` for at tilføje din første lønseddel."
4. Sort by pay_period descending (newest first)
5. Group by employer_id
6. Calculate trends:
   - Average pension_pct across all payslips
   - Gross salary change (if multiple payslips from same employer)
   - Most recent vs oldest gross salary = salary growth %
7. Output summary in Danish

### Output

```
## Lønseddelhistorik

### {employer}

| Periode | Bruttoløn | Pension | Pension % |
|---------|-----------|---------|-----------|
| {pay_period} | {gross_salary} kr | {pension_total} kr | {pension_pct}% |
| {pay_period} | {gross_salary} kr | {pension_total} kr | {pension_pct}% |
| ... | ... | ... | ... |

**Lønudvikling**: {salary_change}% fra {first_period} til {last_period}
**Gennemsnitlig pension**: {avg_pension_pct}%

---

### Samlet oversigt

| Metric | Værdi |
|--------|-------|
| Antal lønsedler | {count} |
| Arbejdsgivere | {employer_count} |
| Gennemsnitlig bruttoløn | {avg_gross} kr |
| Gennemsnitlig pension % | {avg_pension_pct}% |

{pension_recommendation if avg_pension_pct < 15}
```

**Example**:
```
## Lønseddelhistorik

### Teknologi A/S

| Periode | Bruttoløn | Pension | Pension % |
|---------|-----------|---------|-----------|
| Jan 2026 | 42.000 kr | 6.300 kr | 15,0% |
| Dec 2025 | 42.000 kr | 6.300 kr | 15,0% |
| Nov 2025 | 41.000 kr | 6.150 kr | 15,0% |
| Okt 2025 | 41.000 kr | 6.150 kr | 15,0% |

**Lønudvikling**: +2,4% fra okt 2025 til jan 2026
**Gennemsnitlig pension**: 15,0%

---

### Samlet oversigt

| Metric | Værdi |
|--------|-------|
| Antal lønsedler | 4 |
| Arbejdsgivere | 1 |
| Gennemsnitlig bruttoløn | 41.500 kr |
| Gennemsnitlig pension % | 15,0% |

Du indbetaler 15% til pension — det svarer til anbefalingen.
```

---

## Action: learn

### Prerequisites
- User has just uploaded a payslip with corrections
- Or user wants to set up extraction rules for a specific employer

### Workflow

1. Ask for employer context if not obvious: "Hvilken arbejdsgiver vil du gemme udtræksregler for?"
2. **[USER ACTION]**: User specifies employer (or context is clear from recent upload)
3. Normalize employer name to employer-id
4. Check if `payslip-knowledge/{employer-id}/PARSER.md` exists
   - If exists: load for editing
   - If not: create from `payslip-knowledge/_template.md`
5. Gather extraction rules from the most recent corrections or ask user:
   - Where is gross salary located on the payslip?
   - Where is pension shown?
   - Any special fields or layout?
6. Update or create the PARSER.md file with:
   - Employer info section
   - Field-by-field extraction rules
   - Learned corrections table
   - Last updated timestamp
7. Create `payslip-knowledge/{employer-id}/` directory if needed
8. Write PARSER.md
9. Append event to action-log.csv:
   - `action_type`: payslip_learn
   - `target`: {employer-id}
   - `status`: completed
10. Output confirmation

### Output

```
Udtræksregler gemt for {employer}:

Fil: payslip-knowledge/{employer-id}/PARSER.md

Næste gang du uploader en lønseddel fra {employer}, bruges disse regler automatisk.
```

---

## Error Cases

| Error | Message |
|-------|---------|
| No file attached | "Jeg kan ikke se nogen lønseddel. Indsæt venligst et billede eller en PDF." |
| Unreadable payslip | "Lønsedlen er for utydelig til at aflæse. Prøv venligst med et tydeligere billede." |
| Not a payslip | "Dette ser ikke ud til at være en lønseddel. Del venligst et billede af din lønseddel." |
| Missing gross salary | "Jeg kunne ikke finde bruttoløn på lønsedlen. Angiv venligst beløbet manuelt." |
| Duplicate rejected | "Lønsedlen blev ikke tilføjet." |
| No transactions synced | "Ingen transaktioner fundet — kør /smartspender:sync først for at kunne matche lønsedler." |
| AM-bidrag validation failed | "AM-bidraget ({amount} kr) afviger fra forventet ({expected} kr). Er der fradrag før AM-bidrag?" |
| Sum validation failed | "Lønsedlen summer ikke helt ({variance}% afvigelse). Tjek venligst om alle fradrag er aflæst korrekt." |
| No payslips for history | "Ingen lønsedler fundet. Kør `/smartspender:payslip upload` for at tilføje din første lønseddel." |

---

## Side Effects

- Saves payslip file to `payslips/` directory
- Writes to payslips.csv (new row)
- Writes to action-log.csv (payslip event)
- May create `payslip-knowledge/{employer-id}/PARSER.md` (learn action)

---

## Related Commands

- `/smartspender:sync` — Sync transactions before uploading payslips for matching
- `/smartspender:advice` — Get financial advice using payslip-derived pension data
- `/smartspender:overview` — Quick spending summary (now includes income from payslips)
