# TDC Invoice Parser

## Vendor Info

| Field | Value |
|-------|-------|
| **Vendor ID** | `tdc` |
| **Type** | Telecom |
| **Website** | https://www.tdc.dk |
| **Transaction patterns** | "PBS TDC", "TDC A/S", "Betalingsservice TDC", "TDC NET" |
| **Invoice format** | PDF |

## Invoice Structure

Typical TDC invoice layout:

```
[Page 1]
TDC logo top-left
Customer info (name, address, customer number) top-right
Invoice summary: invoice number, date, due date, total
Payment overview: previous balance, payments, new charges, total due

[Page 2+]
Service specification: line-by-line breakdown
  - Subscription plans (mobile, broadband)
  - Data add-ons and extras
  - Insurance products
  - One-time charges (if any)
Subtotal before moms
Moms (25%)
Total including moms
```

### Sections

| Section | Location | Contains |
|---------|----------|----------|
| Invoice header | Page 1 top | Invoice number, date, due date |
| Customer info | Page 1 top-right | Name, address, customer number |
| Payment summary | Page 1 middle | Balance overview, total due |
| Service lines | Page 2+ | Individual service charges |
| VAT summary | Last page bottom | Subtotal, moms 25%, total |

## Extraction Rules

### Metadata

| Field | Rule | Example |
|-------|------|---------|
| merchant | Always "TDC" — identified by logo or header text "TDC" / "TDC NET" | TDC |
| date | Look for "Fakturadato" followed by date in DD-MM-YYYY or DD.MM.YYYY | 15-01-2026 |
| billing_period | Look for "Periode" or "Faktureringsperiode" | 01-12-2025 til 31-12-2025 |
| total | Look for "I alt inkl. moms" or "Total" at invoice bottom | 299,00 |
| currency | Always DKK | DKK |

### Line Items

| Item Pattern | Category | Subcategory | Keywords |
|-------------|----------|-------------|----------|
| Mobile subscription plans | Abonnementer | Mobilabonnement | mobil, frihed, tale, data, abonnement |
| Data add-ons | Abonnementer | Mobilabonnement | ekstra data, datatillaeg, GB |
| Mobile insurance | Abonnementer | Forsikring | forsikring, mobil+, tryg |
| Broadband / fiber | Bolig | Internet | bredbaand, fiber, internet, wifi |
| TV packages | Abonnementer | Streaming | tv, kanal, underholdning |
| One-time fees | Andet | Andet | oprettelse, gebyr, engangs |

### Special Handling

- **Moms line**: TDC invoices always show moms (25%) as a separate line. Extract the pre-moms subtotal and moms amount but use the total including moms as the receipt total.
- **Multiple phone numbers**: If the customer has multiple lines, each line's charges are grouped under the phone number. Treat each group as separate line items but keep them in one receipt.
- **Discounts**: Look for "Rabat" lines — these appear inline after the service they discount. Apply the discount to the preceding line item.
- **Bundle pricing**: TDC bundles (e.g., "TDC Kombi") may show a single bundled price. Extract as one line item with the bundle name.

## Learned Corrections

Corrections discovered during receipt processing (populated by `/smartspender:receipt learn`):

| Date | Correction |
|------|------------|
| — | No corrections yet |

## Last Updated

2026-02-01
