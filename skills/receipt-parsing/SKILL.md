---
name: receipt-parsing
description: Domain knowledge for extracting structured data from receipt images and PDF invoices. Reference this when processing uploaded receipts.
---

# Receipt Parsing

## Purpose

Provides Claude with extraction rules for converting receipt images and PDF invoices into structured line-item data. Covers Danish grocery receipts, telecom invoices, utility bills, restaurant receipts, and online order confirmations.

## Supported Receipt Types

| Type | Common Sources | Key Characteristics |
|------|----------------|---------------------|
| Grocery receipt | Foetex, Netto, Rema 1000, Bilka, Meny | Thermal paper, many line items, Danish keywords |
| Telecom invoice | TDC, Telenor, Telia | PDF, service line items, billing period, moms |
| Utility bill | Oersted, HOFOR, Norlys | PDF, meter readings, consumption data |
| Restaurant receipt | Restaurants, cafes | Total + tip, few items, sometimes handwritten |
| Online order | Amazon, Zalando, IKEA | PDF/email, shipping line, order number |

## Grocery Receipt Extraction

### Structure Recognition

Danish grocery receipts follow a consistent layout:

```
[Store name and address]
[Date and time]
[Cashier / register info]
---
[Item lines]
...
---
[Subtotal]
[Discounts]
[Total]
[Payment method]
[VAT summary]
```

### Item Line Patterns

Each item line typically follows one of these formats:

| Pattern | Example | Notes |
|---------|---------|-------|
| `Name  Price` | `Minimælk 1L  12.95` | Single item |
| `Qty x Name  Price` | `2 x Minimælk 1L  25.90` | Multiple quantity |
| `Qty STK Name  Price` | `2 STK Minimælk 1L  25.90` | Alternative quantity format |
| `Name  Price A/B` | `Minimælk 1L  12.95 A` | With VAT code suffix |

### Danish Keywords

| Keyword | Meaning | Action |
|---------|---------|--------|
| `I ALT` | Total | Extract as receipt total |
| `TOTAL` | Total | Extract as receipt total |
| `SUM` | Sum | Extract as receipt total |
| `RABAT` | Discount | Extract as line discount |
| `TILBUD` | Offer/sale | Line has a promotional price |
| `PANT` | Bottle deposit | Extract as separate line item (category: Andet) |
| `POSE` | Bag fee | Extract as separate line item (category: Andet) |
| `STK` | Pieces (quantity) | Parse as quantity indicator |
| `KG` | Kilograms | Parse as weight-based quantity |
| `KONTANT` | Cash | Payment method — skip |
| `DANKORT` | Debit card | Payment method — skip |
| `VISA` | Credit card | Payment method — skip |
| `MOBILEPAY` | Mobile payment | Payment method — skip |
| `MOMS` | VAT | VAT summary — skip |
| `SUBTOTAL` | Subtotal | Before discounts — skip (use I ALT) |
| `RETUR` | Return | Negative line item |
| `BYTTEPENGE` | Change | Cash change — skip |

### Discount Handling

Discounts on Danish receipts appear in several formats:

| Format | Example | Rule |
|--------|---------|------|
| Inline discount | `RABAT -5.00` on next line after item | Apply discount to preceding item |
| Percentage | `10% RABAT` | Calculate discount from item price |
| Member discount | `COOP RABAT -3.00` | Apply to preceding item, note as member discount |
| Multi-buy | `3 FOR 2 RABAT -12.95` | Apply discount to the item group |

### Total Validation

After extracting all items, compare the sum of line totals against the receipt total:
- **Variance <= 2%**: Accept without comment
- **Variance 2-5%**: Accept but note: "Bemærk: Summen af varerne afviger lidt fra totalen (pant, afrunding, eller manglende linje)."
- **Variance > 5%**: Flag for review: "Summen af varerne ({sum} kr) matcher ikke kvitteringens total ({total} kr). Tjek venligst om alle linjer er korrekt aflæst."

## PDF Invoice Extraction

### Vendor-Specific Parsers

Before using the general rules below, check `skills/invoice-parsing/SKILL.md` for vendor-specific parsers. If a parser exists in `invoice-knowledge/{vendor-id}/PARSER.md`, use those vendor-specific extraction rules instead — they are more accurate for known vendors.

### Structure Recognition

Danish PDF invoices typically contain:

```
[Company logo and name]
[Invoice number and date]
[Customer info]
[Billing period]
---
[Service line items]
---
[Subtotal before VAT]
[Moms (25%)]
[Total including moms]
[Payment info / due date]
```

### Key Fields to Extract

| Field | Where to Find | Example |
|-------|---------------|---------|
| Merchant | Header/logo area | TDC, Oersted, HOFOR |
| Invoice date | Near invoice number | Fakturadato: 15-01-2026 |
| Billing period | Below customer info | Periode: 01-12-2025 til 31-12-2025 |
| Line items | Main table | Mobilabonnement Frihed+ — 199,00 |
| Moms | Before total | Moms 25% — 59,75 |
| Total | Bottom of invoice | I alt inkl. moms — 299,00 |

### Danish Number Formats in PDFs

Danish invoices use comma as decimal separator and period as thousands separator:
- `1.234,56` means 1234.56
- `299,00` means 299.00

Convert all amounts to standard decimal format (period as decimal separator) for storage.

## Product Subcategory Taxonomy

Product-level subcategories for receipt line items. These are more granular than the merchant-level subcategories in `skills/categorization/SKILL.md`.

### Dagligvarer (Groceries) Subcategories

| Subcategory | Examples | Keywords |
|-------------|----------|----------|
| Mejeriprodukter | Maelk, yoghurt, ost, smoer | maelk, yoghurt, ost, smoer, fløde, skyr |
| Koed | Hakket oksekoed, kylling, poelse | koed, kylling, svin, okse, poelse, bacon, lam |
| Fisk | Laks, torsk, rejer | laks, torsk, rejer, fisk, tun, sild |
| Frugt og groent | Bananer, aebler, tomater, salat | frugt, groent, banan, aeble, tomat, salat, loeg, kartoffel, gulerod |
| Broed og bagvaerk | Rugbroed, franskbroed, boller | broed, rug, bolle, kage, croissant, bagvaerk |
| Drikkevarer | Sodavand, juice, vand | cola, pepsi, fanta, juice, vand, sodavand, oel (non-alcoholic) |
| Alkohol | Vin, oel, spiritus | vin, oel, spiritus, vodka, gin, whisky, champagne |
| Frostvarer | Frosne pizzaer, is, frosne groentsager | frost, frossen, is, pizza (frozen) |
| Konserves | Daaser, pasta, ris, mel | konserves, daase, pasta, ris, mel, sukker, salt |
| Snacks | Chips, chokolade, slik | chips, chokolade, slik, noedder, popcorn, kiks |
| Personlig pleje | Shampoo, tandpasta, deodorant | shampoo, tandpasta, deodorant, saebe, creme |
| Rengoring | Opvaskemiddel, vaskepulver | rengoring, opvask, vaske, aftorring, toiletpapir |
| Husdyr | Hundefoder, kattesand | hund, kat, foder, husdyr |

### Bolig (Housing) Subcategories

| Subcategory | Examples | Keywords |
|-------------|----------|----------|
| El | Elforbrug, elafregning | el, kwh, forbrug, afregning |
| Vand | Vandforbrug | vand, m3, forbrug |
| Varme | Fjernvarme, gasforbrug | varme, fjernvarme, gas |
| Internet | Bredbånd | internet, bredbaand, fiber, wifi |

### Abonnementer (Subscriptions) Subcategories

| Subcategory | Examples | Keywords |
|-------------|----------|----------|
| Mobilabonnement | Mobiltjeneste, datatillæg | mobil, data, tale, sms, opkald |
| Forsikring | Indboforsikring, mobilforsikring | forsikring, daekning |
| Streaming | Netflix, Spotify | (matched by merchant, not keywords) |
| Software | Adobe, Microsoft 365 | (matched by merchant, not keywords) |

## Confidence Scoring

Rate the quality of each extraction:

| Confidence | Criteria |
|------------|----------|
| 0.9-1.0 | Clear image/PDF, all fields extracted, total validates |
| 0.7-0.8 | Mostly readable, 1-2 items uncertain, total within 5% |
| 0.5-0.6 | Partially readable, multiple items uncertain or missing |
| 0.3-0.4 | Poor quality, only merchant/date/total extractable |
| 0.0-0.2 | Unreadable or not a receipt |

Store the confidence in `match_confidence` on the receipts.csv row (this is extraction confidence, separate from the transaction match confidence in `skills/transaction-matching/SKILL.md`).

## Edge Cases

### Blurry or Low-Quality Receipts
If the receipt image is too blurry to extract reliably:
1. Extract whatever is readable (merchant, date, total at minimum)
2. Set confidence to 0.3-0.4
3. Set item_count to 0 if no items are readable
4. Inform user: "Kvitteringen er svær at aflæse. Jeg kunne kun finde butik, dato og total. Vil du tilføje varelinjer manuelt?"

### Multiple Receipts in One Image
If the image contains more than one receipt:
1. Process only the first/most prominent receipt
2. Inform user: "Billedet ser ud til at indeholde flere kvitteringer. Jeg har behandlet den første. Del venligst de andre enkeltvis."

### Non-Danish Receipts
If the receipt is not in Danish:
1. Still attempt extraction (most receipt formats are similar)
2. Use the receipt's currency if not DKK
3. Note in file_reference: "non-danish"
4. Categories still use Danish names

### Receipts Without Line Items
Some receipts only show a total (e.g., card terminal slips):
1. Create the receipts.csv row with item_count = 0
2. Skip receipt-items.csv
3. Inform user: "Denne kvittering har kun en total — ingen varelinjer fundet."

### Negative Items (Returns)
Items marked with `RETUR` or negative amounts:
1. Store with negative total_price
2. Category matches the original item if identifiable
3. Discount field stays 0 (the negative price is the return, not a discount)

## Examples

### Example 1: Grocery Receipt Extraction

**Input**: Photo of Foetex receipt

**Extracted metadata**:
```
merchant: Foetex
date: 2026-01-28
total: 347.50
currency: DKK
source: upload  # or "email" if imported via /smartspender:receipt email
```

**Extracted items**:
```
1. Minimælk 1L          qty:2  unit:12.95  total:25.90  cat:Dagligvarer  sub:Mejeriprodukter
2. Hakket oksekød 500g   qty:1  unit:45.00  total:45.00  cat:Dagligvarer  sub:Kød
3. Øko bananer           qty:1  unit:22.95  total:22.95  cat:Dagligvarer  sub:Frugt og grønt
4. Coca-Cola 1.5L        qty:2  unit:22.00  total:44.00  cat:Dagligvarer  sub:Drikkevarer
5. Rødvin Chianti        qty:1  unit:79.95  total:79.95  cat:Dagligvarer  sub:Alkohol
6. Tandbørstehoveder     qty:1  unit:89.95  total:89.95  cat:Sundhed      sub:Personlig pleje
7. Rugbrød               qty:1  unit:24.95  total:24.95  cat:Dagligvarer  sub:Brød og bagværk
8. Pose 2 kr             qty:1  unit:2.00   total:2.00   cat:Andet        sub:Andet
```

Sum: 334.70 vs total 347.50 — variance 3.7% — accept with note about pant/rounding.

### Example 2: TDC Invoice Extraction

**Input**: PDF invoice from TDC

**Extracted metadata**:
```
merchant: TDC
date: 2026-01-15
total: 299.00
currency: DKK
source: upload  # or "email" if imported via /smartspender:receipt email
```

**Extracted items**:
```
1. Mobilabonnement Frihed+  qty:1  unit:199.00  total:199.00  cat:Abonnementer  sub:Mobilabonnement
2. Ekstra data 10GB         qty:1  unit:49.00   total:49.00   cat:Abonnementer  sub:Mobilabonnement
3. Forsikring Mobil+         qty:1  unit:51.00   total:51.00   cat:Abonnementer  sub:Forsikring
```

Sum: 299.00 vs total 299.00 — exact match.

## Related Skills

- See `skills/receipt-schema/SKILL.md` for the CSV file structure
- See `skills/transaction-matching/SKILL.md` for how extracted receipts are matched to bank transactions
- See `skills/categorization/SKILL.md` for merchant-level categories (receipt subcategories are more granular)
