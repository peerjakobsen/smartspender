# {Vendor Name} Invoice Parser

## Vendor Info

| Field | Value |
|-------|-------|
| **Vendor ID** | `{vendor-id}` |
| **Type** | {Telecom / Utility / Insurance / Internet / Other} |
| **Website** | {vendor website URL} |
| **Transaction patterns** | {How this vendor appears in bank transactions, e.g., "PBS TDC", "Betalingsservice HOFOR"} |
| **Invoice format** | {PDF / Email HTML / Both} |

## Invoice Structure

Typical {vendor name} invoice layout:

```
[Page 1]
{Describe typical page layout — logo, customer info, summary}

[Page 2+]
{Describe detail pages — line items, consumption data, breakdown}
```

### Sections

| Section | Location | Contains |
|---------|----------|----------|
| {section name} | {page/position} | {what data is found here} |
| {section name} | {page/position} | {what data is found here} |

## Extraction Rules

### Metadata

| Field | Rule | Example |
|-------|------|---------|
| merchant | {How to identify} | {example value} |
| date | {Where to find, format} | {example value} |
| billing_period | {Where to find, format} | {example value} |
| total | {Where to find, keyword} | {example value} |
| currency | {Default or where to find} | DKK |

### Line Items

| Item Pattern | Category | Subcategory | Keywords |
|-------------|----------|-------------|----------|
| {item description pattern} | {category} | {subcategory} | {Danish keywords to match} |
| {item description pattern} | {category} | {subcategory} | {Danish keywords to match} |

### Special Handling

{Any vendor-specific parsing quirks: unusual number formats, multi-page tables, consumption calculations, etc.}

## Learned Corrections

Corrections discovered during receipt processing (populated by `/smartspender:receipt learn`):

| Date | Correction |
|------|------------|
| — | No corrections yet |

## Last Updated

{YYYY-MM-DD}
