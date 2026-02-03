---
name: payslip-parsing
description: Extraction rules for Danish salary slips (lønsedler). Reference this when processing uploaded payslips for pension tracking and financial advice.
---

# Payslip Parsing

## 1. Overview

Provides Claude with extraction rules for converting Danish payslip images and PDFs into structured data. This skill covers:
- Standard Danish lønsedler (salary slips)
- Common payroll systems (Danløn, Proløn, Visma, Zenegy, Bluegarden)
- Employer-specific variations

It also provides a workflow for looking up and applying employer-specific parsers from `payslip-knowledge/`.

---

## 2. Danish Payslip Structure

### Legally Required Fields

Danish employers must provide lønsedler with these mandatory fields:

| Field | Danish Term | Description |
|-------|-------------|-------------|
| Pay period | Lønperiode | Month or period covered (e.g., "Januar 2026") |
| Gross salary | Bruttoløn | Total earnings before deductions |
| AM-bidrag | AM-bidrag | Labor market contribution (8% of gross) |
| A-skat | A-skat | Income tax withheld |
| ATP | ATP-bidrag | Supplementary labor market pension |
| Net salary | Nettoløn / Udbetalt | Amount deposited to bank |

### Common Additional Fields

| Field | Danish Term | Description |
|-------|-------------|-------------|
| Employer pension | Arbejdsgiverpension | Employer's pension contribution |
| Employee pension | Egetbidrag pension | Employee's pension contribution |
| Feriepenge | Feriepenge | Holiday pay accrued (12.5% for feriekonto) |
| Fritvalgskonto | Fritvalgskonto | Flex benefits contribution |
| Sundhedsforsikring | Sundhedsforsikring | Health insurance benefit |
| Transport | Befordringsfradrag | Commuting deduction |
| Bonus | Bonus / Tillæg | One-time or recurring bonus |

### Typical Lønseddel Layout

```
[Company name and logo]
[Employee name and CPR (masked)]
[Pay period]
---
INDTÆGTER (EARNINGS)
  Månedsløn                    {base_salary}
  Bonus/tillæg                 {bonus}
  Bruttoløn i alt              {gross_salary}
---
FRADRAG (DEDUCTIONS)
  AM-bidrag (8%)               {am_bidrag}
  A-skat                       {a_skat}
  ATP                          {atp}
  Pension (egetbidrag)         {pension_employee}
---
ARBEJDSGIVERBIDRAG (EMPLOYER CONTRIBUTIONS)
  Pension                      {pension_employer}
  Sundhedsforsikring           {health_insurance}
---
TIL UDBETALING                 {net_salary}
---
[Bank account info]
[YTD totals]
```

---

## 3. Employer Detection & Parser Lookup

### Parser Lookup Workflow

When processing a payslip, follow this decision tree:

```
1. Detect employer (see Employer Detection below)
2. Normalize employer name to employer-id (lowercase, no spaces, no A/S suffix)
3. Check: does payslip-knowledge/{employer-id}/PARSER.md exist?
   ├── YES: Load PARSER.md → use employer-specific extraction rules
   │         Set confidence boost: +0.1 (parser-assisted extraction)
   └── NO:  Fall back to general rules (Sections 4-5 below)
            Set confidence: 0.6-0.8 (general extraction)
            After processing: suggest /smartspender:payslip learn
```

### Employer Detection Signals

Detect the employer using these signals in priority order:

| Priority | Signal | Source | Example |
|----------|--------|--------|---------|
| 1 | Company header | Top of document | "Virksomhed A/S" |
| 2 | CVR number | Company info section | "CVR: 12345678" |
| 3 | Filename | Uploaded file name | `loenseddel_novo_jan2026.pdf` |
| 4 | Payroll system | Footer or format | Danløn format → specific employer |
| 5 | Transaction match | Bank transaction description | "Løn fra Virksomhed" |

### Employer ID Normalization

| Employer Name | Employer ID | Aliases |
|---------------|-------------|---------|
| Novo Nordisk | `novo-nordisk` | Novo Nordisk A/S |
| Danske Bank | `danske-bank` | Danske Bank A/S |
| DSB | `dsb` | DSB S-tog |
| COOP | `coop` | Coop Danmark A/S |

For employers not in this table: normalize to lowercase, replace spaces with hyphens, remove A/S, ApS, and I/S suffixes.

---

## 4. Field Extraction Rules

### Core Fields

| Field | Where to Find | Extraction Rule |
|-------|---------------|-----------------|
| pay_period | Header area | Look for "Lønperiode:", month name + year, or "YYYY-MM" format |
| gross_salary | "Bruttoløn" line | Extract amount after "Bruttoløn" or "Brutto i alt" |
| am_bidrag | "AM-bidrag" line | Extract amount, should be ~8% of gross |
| a_skat | "A-skat" line | Extract amount after "A-skat" or "Skat" |
| atp | "ATP" line | Extract amount (typically 94.65 kr for full-time 2025) |
| net_salary | "Udbetalt" or "Nettoløn" | Extract final amount, usually at bottom |

### Pension Fields

| Field | Where to Find | Extraction Rule |
|-------|---------------|-----------------|
| pension_employer | "Arbejdsgiverpension" or employer contributions section | Extract amount |
| pension_employee | "Egetbidrag" or "Medarbejderpension" | Extract amount |
| pension_total | Calculated | pension_employer + pension_employee |
| pension_pct | Calculated | (pension_total / gross_salary) * 100 |

### Optional Fields

| Field | Where to Find | Default |
|-------|---------------|---------|
| feriepenge | "Feriepenge" line | 0 if not shown |
| fritvalgskonto | "Fritvalgskonto" line | 0 if not shown |
| sundhedsforsikring | Benefits section | 0 if not shown |

---

## 5. Common Payroll Systems

### Danløn

- **Identifier**: "Danløn" in footer or header
- **Format**: PDF, clean tabular layout
- **Gross location**: "BRUTTOLØN" centered header
- **Net location**: "NETTOBELØB" or "TIL UDBETALING"
- **Pension**: Separate "PENSION" section with employer/employee split

### Proløn

- **Identifier**: "Proløn" or "Proløn Online" in document
- **Format**: PDF, two-column layout
- **Gross location**: Left column under "Løn"
- **Net location**: "Til udbetaling" at bottom left
- **Pension**: Listed under "Fradrag" section

### Visma Løn

- **Identifier**: "Visma" logo or "Visma Løn"
- **Format**: PDF, structured sections with boxes
- **Gross location**: "Bruttoløn" box
- **Net location**: "Netto til udbetaling"
- **Pension**: Employer contributions in separate "Arbejdsgiver" box

### Zenegy

- **Identifier**: "Zenegy" branding or modern minimalist design
- **Format**: PDF, clean modern layout
- **Gross location**: "Bruttoløn" with large font
- **Net location**: Highlighted "Udbetalt" amount
- **Pension**: Expandable sections (may need to look for itemized view)

### Bluegarden

- **Identifier**: "Bluegarden" or "SD Løn" (legacy)
- **Format**: PDF, traditional Danish format
- **Gross location**: "BRUTTO" line
- **Net location**: "NETTO" or "Til disposition"
- **Pension**: Under "FRADRAG" with employer portion noted separately

---

## 6. Validation Rules

### AM-bidrag Validation

AM-bidrag must be exactly 8% of the AM-bidrag base (usually gross salary minus certain exempt items).

**Validation formula**:
```
expected_am = gross_salary * 0.08
tolerance = 5  # kr
valid = |extracted_am - expected_am| <= tolerance
```

If validation fails:
- Check if there are exempt earnings (some bonuses, pension contributions)
- Ask user: "AM-bidraget ({extracted_am} kr) afviger fra forventet ({expected_am} kr). Er der fradrag før AM-bidrag?"

### Sum Validation

The payslip should balance:

**Formula**:
```
expected_net = gross_salary - am_bidrag - a_skat - atp - pension_employee - other_deductions
tolerance_pct = 0.02  # 2%
valid = |extracted_net - expected_net| / gross_salary <= tolerance_pct
```

If validation fails with variance > 2%:
- Flag for user review
- Ask: "Lønsedlen summer ikke helt ({variance}% afvigelse). Tjek venligst om alle fradrag er aflæst korrekt."

### ATP Validation

ATP contributions are fixed amounts based on employment level (2025 rates):

| Employment Level | Monthly ATP (Employee) |
|------------------|------------------------|
| Full-time (117+ hours) | 94.65 kr |
| 78-116 hours | 63.10 kr |
| 39-77 hours | 31.55 kr |
| Under 39 hours | 0 kr |

If extracted ATP doesn't match standard amounts, note as non-standard but don't flag as error.

---

## 7. Output Schema

### Extracted Payslip JSON

```json
{
  "pay_period": "2026-01",
  "employer": "Virksomhed A/S",
  "employer_id": "virksomhed",
  "gross_salary": 45000.00,
  "am_bidrag": 3600.00,
  "a_skat": 12500.00,
  "atp": 94.65,
  "pension_employer": 4500.00,
  "pension_employee": 2250.00,
  "pension_total": 6750.00,
  "pension_pct": 15.0,
  "feriepenge": 5625.00,
  "net_salary": 26555.35,
  "benefits": {
    "sundhedsforsikring": 150.00,
    "fritvalgskonto": 450.00
  },
  "extraction_confidence": 0.9
}
```

### CSV Row Mapping

Map extracted fields to payslips.csv columns per `skills/data-schemas/SKILL.md`:

| Extracted Field | CSV Column |
|-----------------|------------|
| pay_period | pay_period |
| employer | employer |
| employer_id | employer_id |
| gross_salary | gross_salary |
| a_skat | a_skat |
| am_bidrag | am_bidrag |
| pension_employer | pension_employer |
| pension_employee | pension_employee |
| pension_total | pension_total |
| pension_pct | pension_pct |
| atp | atp |
| feriepenge | feriepenge |
| net_salary | net_salary |
| benefits (JSON) | benefits_json |

---

## 8. Privacy Handling

### CPR Number Masking

Danish CPR numbers (DDMMYY-XXXX) appear on payslips. NEVER store or display CPR numbers.

**Masking rule**: If CPR detected, replace with `XXXXXX-XXXX` in any logs or confirmations.

### Bank Account Numbers

Bank account numbers may appear. Don't store in extracted data — only the net_salary amount matters.

---

## 9. Confidence Scoring

Rate the quality of each extraction:

| Confidence | Criteria |
|------------|----------|
| 0.9-1.0 | All mandatory fields extracted, validations pass, known payroll system |
| 0.8-0.9 | All mandatory fields extracted, minor validation variance |
| 0.6-0.8 | Most fields extracted, some estimated or uncertain |
| 0.4-0.6 | Only basic fields (gross, net) extracted reliably |
| 0.0-0.4 | Document unreadable or not a payslip |

---

## 10. Examples

### Example 1: Standard Danløn Payslip

**Input**: PDF payslip from Danløn system

**Extracted data**:
```
pay_period: 2026-01
employer: Teknologi A/S
employer_id: teknologi
gross_salary: 42000.00
am_bidrag: 3360.00
a_skat: 11200.00
atp: 94.65
pension_employer: 4200.00
pension_employee: 2100.00
pension_total: 6300.00
pension_pct: 15.0
feriepenge: 5250.00
net_salary: 25245.35
```

**Validation**:
- AM-bidrag: 42000 * 0.08 = 3360 ✓
- ATP: Standard full-time rate ✓
- Pension: 15% of gross ✓

**Confidence**: 0.95

### Example 2: Partial Extraction (Blurry Image)

**Input**: Photo of payslip, partially obscured

**Extracted data**:
```
pay_period: 2026-01
employer: [unclear]
gross_salary: 38000.00
am_bidrag: [estimated] 3040.00
a_skat: [unclear]
net_salary: 24500.00
pension_total: [not visible]
```

**Confidence**: 0.5

**User prompt**: "Nogle felter var svære at aflæse. Tjek venligst bruttoløn (38.000 kr) og nettoløn (24.500 kr). Pension kunne ikke aflæses — vil du tilføje det manuelt?"

### Example 3: Unknown Employer (No Parser)

**Input**: PDF payslip from new employer

**Employer detection**:
1. Header shows "Startup ApS" → employer-id: `startup`
2. Check `payslip-knowledge/startup/PARSER.md` → does not exist
3. Fall back to general extraction rules

**After processing**: Suggest:
```
Tip: Kør /smartspender:payslip learn for at gemme udtræksregler
for Startup ApS, så fremtidige lønsedler bliver mere præcise.
```

---

## 11. Edge Cases

### Multiple Pay Periods in One Document

Some employers provide YTD summaries alongside monthly slips:
1. Extract only the CURRENT period data
2. Ignore YTD columns
3. Look for "Denne periode" or "Aktuel måned" labels

### Supplementary Payments

Bonus, vacation payout, or other irregular payments:
1. Extract the total gross (including supplement)
2. Note irregular items in benefits_json
3. Set confidence slightly lower (0.7-0.8) for unusual payslips

### Foreign Currency Elements

For employees with foreign income components:
1. Only extract DKK amounts
2. Ignore foreign currency lines
3. Note in extraction if payslip contains non-DKK items

### Correction Slips (Rettelsesseddel)

Some months have correction slips instead of full payslips:
1. Detect by "Rettelse" or "Korrektion" in header
2. Extract the net change amount
3. Store with special note in benefits_json: `{"type": "correction"}`

---

## Related Skills

- See `skills/data-schemas/SKILL.md` for the payslips.csv file structure
- See `skills/transaction-matching/SKILL.md` for how payslips are matched to salary transactions
- See `skills/danish-finance-guide/SKILL.md` for pension percentage recommendations (15% target)
