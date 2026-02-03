# {Employer Name} Payslip Parser

## Employer Info

| Field | Value |
|-------|-------|
| **Employer ID** | `{employer-id}` |
| **CVR** | {CVR number if known} |
| **Industry** | {Tech / Finance / Retail / Healthcare / Public / Other} |
| **Payroll System** | {Danløn / Proløn / Visma / Zenegy / Bluegarden / Unknown} |
| **Transaction patterns** | {How salary appears in bank transactions, e.g., "Løn Virksomhed A/S", "LOEN FRA VIRKSOMHED"} |

## Payslip Structure

Typical {employer name} payslip layout:

```
[Page 1]
{Describe typical page layout — logo position, employee info, period display}

[Earnings Section]
{Where bruttoløn is shown, any bonus/tillæg lines}

[Deductions Section]
{Order of deductions: AM-bidrag, A-skat, pension, etc.}

[Employer Contributions]
{Where pension and benefits are shown}

[Net Section]
{Where nettoløn / udbetalt is displayed}
```

### Layout Characteristics

| Characteristic | Description |
|---------------|-------------|
| Format | {PDF / Paper scan / Email} |
| Orientation | {Portrait / Landscape} |
| Columns | {Single / Two-column / Tabular} |
| Font style | {Modern / Traditional / Monospace} |

## Extraction Rules

### Metadata

| Field | Rule | Example |
|-------|------|---------|
| pay_period | {Where to find, format} | {example value} |
| employer | {How employer name appears} | {example value} |

### Earnings (Indtægter)

| Field | Location | Keyword | Example |
|-------|----------|---------|---------|
| gross_salary | {Where on page} | {Danish keyword} | {example: 42.000,00} |
| bonus | {Where if present} | {Bonus, Tillæg} | {example if applicable} |

### Deductions (Fradrag)

| Field | Location | Keyword | Example |
|-------|----------|---------|---------|
| am_bidrag | {Where on page} | {AM-bidrag} | {example: 3.360,00} |
| a_skat | {Where on page} | {A-skat, Skat} | {example: 11.200,00} |
| atp | {Where on page} | {ATP} | {example: 94,65} |
| pension_employee | {Where on page} | {Egetbidrag, Medarbejderpension} | {example: 2.100,00} |

### Employer Contributions (Arbejdsgiverbidrag)

| Field | Location | Keyword | Example |
|-------|----------|---------|---------|
| pension_employer | {Where on page} | {Arbejdsgiverpension} | {example: 4.200,00} |
| sundhedsforsikring | {Where if present} | {Sundhedsforsikring} | {example if applicable} |

### Net Salary

| Field | Location | Keyword | Example |
|-------|----------|---------|---------|
| net_salary | {Where on page — usually bottom} | {Nettoløn, Udbetalt, Til disposition} | {example: 25.245,35} |

## Special Handling

{Any employer-specific parsing quirks:}
- {Example: Pension is combined in one line — need to split 2/3 employer, 1/3 employee}
- {Example: Holiday pay shown as separate section on page 2}
- {Example: Uses unusual number format}

## Benefits Mapping

| Payslip Line | benefits_json Key | Notes |
|--------------|-------------------|-------|
| {Line as shown} | {JSON key} | {Any notes} |
| Sundhedsforsikring | sundhedsforsikring | Employer-paid health insurance |
| Fritvalgskonto | fritvalgskonto | Flex benefit contribution |

## Learned Corrections

Corrections discovered during payslip processing (populated by `/smartspender:payslip learn`):

| Date | Field | Original Value | Corrected Value | Notes |
|------|-------|----------------|-----------------|-------|
| — | — | — | — | No corrections yet |

## Last Updated

{YYYY-MM-DD}
