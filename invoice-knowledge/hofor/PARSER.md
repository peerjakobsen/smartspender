# HOFOR Invoice Parser

## Vendor Info

| Field | Value |
|-------|-------|
| **Vendor ID** | `hofor` |
| **Type** | Utility (Water) |
| **Website** | https://www.hofor.dk |
| **Transaction patterns** | "HOFOR", "PBS HOFOR", "Betalingsservice HOFOR A/S" |
| **Invoice format** | PDF |

## Invoice Structure

Typical HOFOR invoice layout:

```
[Page 1]
HOFOR logo top-left
Customer info (name, address, installation number)
Invoice summary: invoice number, date, due date
Consumption overview: meter readings, consumption in m3
Charge breakdown: water, sewage, fixed charges
Total including moms

[Page 2+ if present]
Detailed consumption history
Previous payments and balance
```

### Sections

| Section | Location | Contains |
|---------|----------|----------|
| Invoice header | Page 1 top | Invoice number, date, due date |
| Customer info | Page 1 top-right | Name, address, installation number |
| Consumption | Page 1 middle | Meter readings (start/end), m3 consumed |
| Charge breakdown | Page 1 middle-bottom | Water, sewage, fixed fees, moms |
| Total | Page 1 bottom | Total including moms |

## Extraction Rules

### Metadata

| Field | Rule | Example |
|-------|------|---------|
| merchant | Always "HOFOR" — identified by logo or header text | HOFOR |
| date | Look for "Fakturadato" or "Dato" | 01-01-2026 |
| billing_period | Look for "Aflæsningsperiode" or "Periode" with date range | 01-07-2025 til 31-12-2025 |
| total | Look for "I alt" or "Total inkl. moms" at bottom | 1.847,50 |
| currency | Always DKK | DKK |

### Line Items

| Item Pattern | Category | Subcategory | Keywords |
|-------------|----------|-------------|----------|
| Water consumption | Bolig | Vand | vand, vandforbrug, m3, kubikmeter, drikkevand |
| Sewage charge | Bolig | Vand | afledning, spildevand, kloakafgift |
| Fixed water charge | Bolig | Vand | fast afgift, abonnement, maalerafgift, vandafgift |
| State water tax | Bolig | Vand | statsafgift, vandafgift, grundvand |
| Meter reading fee | Bolig | Vand | aflaesning, maaler |

### Special Handling

- **Consumption-based pricing**: HOFOR charges per m3. The invoice shows meter start/end readings and calculated consumption. Extract the m3 value as quantity and the per-m3 rate as unit_price.
- **Half-year billing**: HOFOR typically bills every 6 months. The billing period is important context for the user.
- **Aconto vs. afregning**: HOFOR uses aconto (estimated) payments during the year and a final settlement (afregning). Aconto invoices may not show consumption details — extract total only.
- **Multiple charge types**: Water, sewage, and fixed charges are separate line items even though they relate to the same water supply. Extract each as a separate line item.
- **Danish number format**: Amounts use comma as decimal separator (1.847,50 = 1847.50). Period is thousands separator.

## Learned Corrections

Corrections discovered during receipt processing (populated by `/smartspender:receipt learn`):

| Date | Correction |
|------|------------|
| — | No corrections yet |

## Last Updated

2026-02-01
