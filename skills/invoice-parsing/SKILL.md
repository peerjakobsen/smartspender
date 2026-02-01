---
name: invoice-parsing
description: Vendor-specific invoice parsing with parser lookup, vendor detection, and fallback behavior. Reference this when processing PDF invoices or receipts from known vendors.
---

# Invoice Parsing

## Purpose

Provides a structured workflow for looking up and applying vendor-specific invoice parsers from `invoice-knowledge/`. When a vendor-specific parser exists, it provides extraction rules that improve accuracy beyond the general rules in `skills/receipt-parsing/SKILL.md`. When no parser exists, falls back to general rules with lower confidence.

## Parser Lookup Workflow

When processing a receipt or invoice, follow this decision tree:

```
1. Detect vendor (see Vendor Detection below)
2. Normalize vendor name to vendor-id (lowercase, no spaces)
3. Check: does invoice-knowledge/{vendor-id}/PARSER.md exist?
   ├── YES: Load PARSER.md → use vendor-specific extraction rules
   │         Set confidence boost: +0.1 (parser-assisted extraction)
   └── NO:  Fall back to general rules in skills/receipt-parsing/SKILL.md
            Set confidence: 0.5-0.7 (general extraction)
            After processing: suggest /smartspender:receipt learn
```

## Vendor Detection

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

## Parser Application

When a PARSER.md is found, apply it as follows:

### Step 1: Load Parser
Read `invoice-knowledge/{vendor-id}/PARSER.md` into context.

### Step 2: Extract Metadata
Use the parser's **Metadata** extraction rules instead of generic rules. The parser specifies exact keywords and locations for each field (merchant, date, billing_period, total).

### Step 3: Extract Line Items
Use the parser's **Line Items** table to map invoice lines to categories and subcategories. Match lines using the vendor-specific keywords column.

### Step 4: Apply Special Handling
Follow any **Special Handling** rules in the parser (e.g., consumption calculations, multi-page tables, aconto vs. afregning).

### Step 5: Check Learned Corrections
Review the **Learned Corrections** table in the parser. If any corrections apply to the current invoice structure, apply them automatically.

### Step 6: Set Confidence
Parser-assisted extractions get a baseline confidence of 0.8 (vs. 0.5-0.7 for general extraction). Adjust up or down based on extraction quality:
- 0.9-1.0: All fields extracted cleanly using parser rules
- 0.8: Most fields extracted, minor uncertainties
- 0.6-0.7: Parser partially applicable (e.g., invoice format changed)

## Fallback Behavior

When no vendor-specific parser exists:

1. Use general extraction rules from `skills/receipt-parsing/SKILL.md`
2. Set extraction confidence to 0.5-0.7 (lower than parser-assisted)
3. After processing completes and the user has verified/corrected the extraction, suggest the learning command:

```
Tip: Du kan koere /smartspender:receipt learn for at gemme
udtraeksregler for {vendor}, saa fremtidige fakturaer
fra denne leverandoer bliver mere praecise.
```

Only suggest this for PDF invoices (not grocery receipts or simple card slips), and only after the user has made corrections or confirmed the extraction.

## Available Parsers

| Vendor | Type | Parser Path |
|--------|------|-------------|
| TDC | Telecom | `invoice-knowledge/tdc/PARSER.md` |
| HOFOR | Water utility | `invoice-knowledge/hofor/PARSER.md` |
| Oersted | Electricity | `invoice-knowledge/orsted/PARSER.md` |

## Examples

### Example 1: Known Vendor (TDC)

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

### Example 2: Unknown Vendor (Norlys, No Parser Yet)

**Input**: PDF invoice from Norlys

**Vendor detection**:
1. Invoice header shows "Norlys" → vendor candidate: Norlys
2. Normalize to vendor-id: `norlys`
3. Check `invoice-knowledge/norlys/PARSER.md` → does not exist

**Fallback extraction**:
- Use general PDF invoice rules from receipt-parsing skill
- Extract merchant, date, total, line items using generic patterns

**Confidence**: 0.6 (general extraction, no vendor-specific rules)

**Post-processing**: After user verifies, suggest:
"Tip: Du kan koere /smartspender:receipt learn for at gemme udtraeksregler for Norlys..."

### Example 3: Email-Imported Invoice

**Input**: Email from `noreply@orsted.dk` with PDF attachment

**Vendor detection**:
1. Email sender domain `orsted.dk` → vendor candidate: Oersted
2. Normalize to vendor-id: `orsted`
3. Check `invoice-knowledge/orsted/PARSER.md` → exists
4. Load Oersted parser

**Parser-assisted extraction**: Same as direct upload but with `source: email`

## Related Skills

- See `skills/receipt-parsing/SKILL.md` for general extraction rules (fallback)
- See `skills/receipt-schema/SKILL.md` for the CSV file structure
- See `skills/email-receipt-scanning/SKILL.md` for email-specific vendor detection signals
