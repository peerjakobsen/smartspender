# Oersted Invoice Parser

## Vendor Info

| Field | Value |
|-------|-------|
| **Vendor ID** | `orsted` |
| **Type** | Utility (Electricity) |
| **Website** | https://www.orsted.dk |
| **Transaction patterns** | "Oersted", "PBS Oersted", "Betalingsservice Oersted", "Oersted Salg" |
| **Invoice format** | PDF |

## Invoice Structure

Typical Oersted invoice layout:

```
[Page 1]
Oersted logo top-left
Customer info (name, address, customer number, meter number)
Invoice summary: invoice number, date, due date
Consumption overview: kWh consumed, period
Price breakdown: electricity, tariffs, taxes, fees
Total including moms

[Page 2+ if present]
Detailed consumption graph (monthly kWh)
Tariff specification
Previous payments and balance
```

### Sections

| Section | Location | Contains |
|---------|----------|----------|
| Invoice header | Page 1 top | Invoice number, date, due date |
| Customer info | Page 1 top-right | Name, address, customer/meter number |
| Consumption summary | Page 1 middle | kWh consumed, period, meter readings |
| Price breakdown | Page 1 middle-bottom | Electricity, transport, taxes, moms |
| Total | Page 1 bottom | Total including moms |

## Extraction Rules

### Metadata

| Field | Rule | Example |
|-------|------|---------|
| merchant | Always "Oersted" — identified by logo or header text "Oersted" / "Oersted Salg" | Oersted |
| date | Look for "Fakturadato" or "Dato" | 15-01-2026 |
| billing_period | Look for "Aflæsningsperiode" or "Forbrugsperiode" | 01-10-2025 til 31-12-2025 |
| total | Look for "I alt inkl. moms" or "Total" at bottom | 2.156,25 |
| currency | Always DKK | DKK |

### Line Items

| Item Pattern | Category | Subcategory | Keywords |
|-------------|----------|-------------|----------|
| Electricity consumption | Bolig | El | elforbrug, kWh, stroem, energi |
| Grid tariff | Bolig | El | nettarif, transportbetaling, netselskab, elnet |
| System tariff | Bolig | El | systemtarif, Energinet |
| PSO tariff | Bolig | El | PSO, PSO-tarif |
| Electricity tax | Bolig | El | elafgift, energiafgift, statsafgift |
| Subscription fee | Bolig | El | abonnement, fast afgift |
| Green electricity premium | Bolig | El | groen el, vindenergi, certifikat |

### Special Handling

- **Consumption-based pricing**: Oersted charges per kWh. Extract the kWh value as quantity and the per-kWh rate as unit_price. Multiple tariff components may apply to the same kWh consumption — extract each as a separate line item.
- **Variable pricing**: Oersted offers spot-price (variabel) and fixed-price (fast) plans. Spot-price invoices may show hourly or monthly averages. Extract the total electricity cost regardless of pricing model.
- **Multiple tariff lines**: A single electricity consumption generates several line items (energy, transport, system, PSO, tax). This is normal — extract each line separately.
- **Aconto vs. afregning**: Like HOFOR, Oersted uses aconto payments with annual settlement. Aconto invoices show estimated consumption; settlement invoices show actual meter readings. Both should be extracted.
- **Negative amounts**: If actual consumption is lower than aconto payments, the settlement invoice may show a credit (negative total). Store as a negative total.
- **Danish number format**: Amounts use comma as decimal separator (2.156,25 = 2156.25). Period is thousands separator.

## Learned Corrections

Corrections discovered during receipt processing (populated by `/smartspender:receipt learn`):

| Date | Correction |
|------|------------|
| — | No corrections yet |

## Last Updated

2026-02-01
