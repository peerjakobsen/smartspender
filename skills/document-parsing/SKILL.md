---
name: document-parsing
description: Extraction rules for receipts and invoices. Reference this when processing uploaded receipts or PDF invoices.
---

# Document Parsing

## 1. Overview

Provides Claude with extraction rules for converting receipt images and PDF invoices into structured line-item data. This skill covers:
- Danish grocery receipts (thermal paper with many line items)
- Telecom invoices (PDF with service line items)
- Utility bills (PDF with consumption data)
- Restaurant receipts
- Online order confirmations

It also provides a workflow for looking up and applying vendor-specific invoice parsers from `invoice-knowledge/`.

---

## 2. Vendor Detection & Parser Lookup

### Parser Lookup Workflow

When processing a receipt or invoice, follow this decision tree:

```
1. Detect vendor (see Vendor Detection below)
2. Normalize vendor name to vendor-id (lowercase, no spaces)
3. Check: does invoice-knowledge/{vendor-id}/PARSER.md exist?
   ├── YES: Load PARSER.md → use vendor-specific extraction rules
   │         Set confidence boost: +0.1 (parser-assisted extraction)
   └── NO:  Fall back to general rules (Section 3 and 4 below)
            Set confidence: 0.5-0.7 (general extraction)
            After processing: suggest /smartspender:receipt learn
```

### Vendor Detection Signals

Detect the vendor using these signals in priority order:

| Priority | Signal | Source | Example |
|----------|--------|--------|---------|
| 1 | Email sender domain | Email metadata (receipt email workflow) | `faktura@tdc.dk` → TDC |
| 2 | Filename | Uploaded file name | `faktura_orsted_jan2026.pdf` → Oersted |
| 3 | Invoice header/logo | First page content (Claude Vision) | Logo text "HOFOR" → HOFOR |
| 4 | Content keywords | Invoice body text | "TDC NET A/S" → TDC |
| 5 | Transaction match | Bank transaction description | "PBS TDC" → TDC |

### Vendor ID Normalization

| Vendor Name | Vendor ID | Aliases |
|-------------|-----------|---------|
| TDC | `tdc` | TDC NET, TDC A/S, TDC Erhverv |
| HOFOR | `hofor` | HOFOR A/S |
| Oersted | `orsted` | Oersted Salg, Oersted A/S, Oersted Danmark |
| Norlys | `norlys` | Norlys Energi, SE (former name) |
| Telenor | `telenor` | Telenor Danmark |
| Telia | `telia` | Telia Danmark, Telia Company |

For vendors not in this table: normalize to lowercase, replace spaces with hyphens, remove A/S and other suffixes.

### Parser Application

When a PARSER.md is found, apply it as follows:

1. **Load Parser**: Read `invoice-knowledge/{vendor-id}/PARSER.md` into context
2. **Extract Metadata**: Use the parser's extraction rules instead of generic rules
3. **Extract Line Items**: Use the parser's line items table to map invoice lines to categories
4. **Apply Special Handling**: Follow any special handling rules in the parser
5. **Check Learned Corrections**: Apply corrections from the Learned Corrections table
6. **Set Confidence**: Parser-assisted extractions get baseline 0.8 (vs. 0.5-0.7 for general)

### Fallback Behavior

When no vendor-specific parser exists:

1. Use general extraction rules from sections 3-4 below
2. Set extraction confidence to 0.5-0.7 (lower than parser-assisted)
3. After processing completes and the user has verified/corrected the extraction, suggest:

```
Tip: Du kan koere /smartspender:receipt learn for at gemme
udtraeksregler for {vendor}, saa fremtidige fakturaer
fra denne leverandoer bliver mere praecise.
```

Only suggest this for PDF invoices (not grocery receipts or simple card slips).

### Available Parsers

| Vendor | Type | Parser Path |
|--------|------|-------------|
| TDC | Telecom | `invoice-knowledge/tdc/PARSER.md` |
| HOFOR | Water utility | `invoice-knowledge/hofor/PARSER.md` |
| Oersted | Electricity | `invoice-knowledge/orsted/PARSER.md` |

---

## 3. Grocery Receipt Extraction

### Supported Receipt Types

| Type | Common Sources | Key Characteristics |
|------|----------------|---------------------|
| Grocery receipt | Foetex, Netto, Rema 1000, Bilka, Meny | Thermal paper, many line items, Danish keywords |
| Restaurant receipt | Restaurants, cafes | Total + tip, few items, sometimes handwritten |
| Online order | Amazon, Zalando, IKEA | PDF/email, shipping line, order number |

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
- **Variance 2-5%**: Accept but note: "Bemaerk: Summen af varerne afviger lidt fra totalen (pant, afrunding, eller manglende linje)."
- **Variance > 5%**: Flag for review: "Summen af varerne ({sum} kr) matcher ikke kvitteringens total ({total} kr). Tjek venligst om alle linjer er korrekt aflaest."

---

## 4. PDF Invoice Extraction

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

---

## 5. Product Subcategory Taxonomy

Product-level subcategories for receipt line items. These are more granular than the merchant-level subcategories in `skills/categorization/SKILL.md`.

### Dagligvarer (Groceries) Subcategories

| Subcategory | Examples | Keywords |
|-------------|----------|----------|
| Mejeriprodukter | Maelk, yoghurt, ost, smoer | maelk, yoghurt, ost, smoer, floede, skyr |
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
| Internet | Bredbaand | internet, bredbaand, fiber, wifi |

### Abonnementer (Subscriptions) Subcategories

| Subcategory | Examples | Keywords |
|-------------|----------|----------|
| Mobilabonnement | Mobiltjeneste, datatilaeg | mobil, data, tale, sms, opkald |
| Forsikring | Indboforsikring, mobilforsikring | forsikring, daekning |
| Streaming | Netflix, Spotify | (matched by merchant, not keywords) |
| Software | Adobe, Microsoft 365 | (matched by merchant, not keywords) |

---

## 6. Confidence Scoring

Rate the quality of each extraction:

| Confidence | Criteria |
|------------|----------|
| 0.9-1.0 | Clear image/PDF, all fields extracted, total validates |
| 0.7-0.8 | Mostly readable, 1-2 items uncertain, total within 5% |
| 0.5-0.6 | Partially readable, multiple items uncertain or missing |
| 0.3-0.4 | Poor quality, only merchant/date/total extractable |
| 0.0-0.2 | Unreadable or not a receipt |

Store the confidence in `match_confidence` on the receipts.csv row (this is extraction confidence, separate from the transaction match confidence in `skills/transaction-matching/SKILL.md`).

---

## 7. Edge Cases

### Blurry or Low-Quality Receipts
If the receipt image is too blurry to extract reliably:
1. Extract whatever is readable (merchant, date, total at minimum)
2. Set confidence to 0.3-0.4
3. Set item_count to 0 if no items are readable
4. Inform user: "Kvitteringen er svaer at aflaese. Jeg kunne kun finde butik, dato og total. Vil du tilfoeje varelinjer manuelt?"

### Multiple Receipts in One Image
If the image contains more than one receipt:
1. Process only the first/most prominent receipt
2. Inform user: "Billedet ser ud til at indeholde flere kvitteringer. Jeg har behandlet den foerste. Del venligst de andre enkeltvis."

### Non-Danish Receipts
If the receipt is not in Danish:
1. Still attempt extraction (most receipt formats are similar)
2. Use the receipt's currency if not DKK
3. Note in file_reference: "non-danish"
4. Categories still use Danish names

### Receipts Without Line Items
Some receipts only show a total (e.g., card terminal slips):
1. Create the receipts.csv row with item_count = 0
2. Skip writing to receipt-items files (don't create an empty monthly file)
3. Inform user: "Denne kvittering har kun en total — ingen varelinjer fundet."

### Negative Items (Returns)
Items marked with `RETUR` or negative amounts:
1. Store with negative total_price
2. Category matches the original item if identifiable
3. Discount field stays 0 (the negative price is the return, not a discount)

---

## 8. Examples

### Example 1: Grocery Receipt Extraction

**Input**: Photo of Foetex receipt

**Extracted metadata**:
```
merchant: Foetex
date: 2026-01-28
total: 347.50
currency: DKK
source: upload
```

**Extracted items**:
```
1. Minimælk 1L          qty:2  unit:12.95  total:25.90  cat:Dagligvarer  sub:Mejeriprodukter
2. Hakket oksekød 500g  qty:1  unit:45.00  total:45.00  cat:Dagligvarer  sub:Kød
3. Øko bananer          qty:1  unit:22.95  total:22.95  cat:Dagligvarer  sub:Frugt og grønt
4. Coca-Cola 1.5L       qty:2  unit:22.00  total:44.00  cat:Dagligvarer  sub:Drikkevarer
5. Rødvin Chianti       qty:1  unit:79.95  total:79.95  cat:Dagligvarer  sub:Alkohol
6. Tandbørstehoveder    qty:1  unit:89.95  total:89.95  cat:Sundhed      sub:Personlig pleje
7. Rugbrød              qty:1  unit:24.95  total:24.95  cat:Dagligvarer  sub:Brød og bagværk
8. Pose 2 kr            qty:1  unit:2.00   total:2.00   cat:Andet        sub:Andet
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
source: upload
```

**Extracted items**:
```
1. Mobilabonnement Frihed+  qty:1  unit:199.00  total:199.00  cat:Abonnementer  sub:Mobilabonnement
2. Ekstra data 10GB         qty:1  unit:49.00   total:49.00   cat:Abonnementer  sub:Mobilabonnement
3. Forsikring Mobil+        qty:1  unit:51.00   total:51.00   cat:Abonnementer  sub:Forsikring
```

Sum: 299.00 vs total 299.00 — exact match.

### Example 3: Known Vendor (TDC) with Parser

**Input**: PDF invoice uploaded, filename "TDC_faktura_jan2026.pdf"

**Vendor detection**:
1. Filename contains "TDC" → vendor candidate: TDC
2. Check `invoice-knowledge/tdc/PARSER.md` → exists
3. Load TDC parser

**Parser-assisted extraction**:
- date: Look for "Fakturadato" → 15-01-2026
- total: Look for "I alt inkl. moms" → 299,00
- Line items: Match "Mobilabonnement" → Abonnementer > Mobilabonnement

**Confidence**: 0.95 (all fields extracted cleanly with parser)

### Example 4: Unknown Vendor (Norlys, No Parser Yet)

**Input**: PDF invoice from Norlys

**Vendor detection**:
1. Invoice header shows "Norlys" → vendor candidate: Norlys
2. Normalize to vendor-id: `norlys`
3. Check `invoice-knowledge/norlys/PARSER.md` → does not exist

**Fallback extraction**:
- Use general PDF invoice rules
- Extract merchant, date, total, line items using generic patterns

**Confidence**: 0.6 (general extraction, no vendor-specific rules)

**Post-processing**: After user verifies, suggest:
"Tip: Du kan koere /smartspender:receipt learn for at gemme udtraeksregler for Norlys..."

---

## Related Skills

- See `skills/data-schemas/SKILL.md` for the CSV file structure
- See `skills/transaction-matching/SKILL.md` for how extracted receipts are matched to bank transactions
- See `skills/categorization/SKILL.md` for merchant-level categories (receipt subcategories are more granular)
- See `skills/email-receipt-scanning/SKILL.md` for email-specific vendor detection signals
