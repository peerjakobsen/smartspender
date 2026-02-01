# Export Format Documentation

## Context

Each bank exports transaction data differently. This standard defines how to document a bank's export format so Claude can parse it correctly every time.

## Required Documentation

### File Properties

Always document these properties for each bank's export:

| Property | Example (Nykredit) | Notes |
|----------|-------------------|-------|
| File type | CSV | CSV, Excel, or screen scrape |
| Delimiter | Comma | Comma, semicolon, or tab |
| Encoding | UTF-8 | UTF-8, ISO-8859-1 (Latin-1), Windows-1252 |
| Has header row | Yes | Whether first row contains column names |
| Date format | DD/MM/YYYY | The exact format string |
| Number format | Period decimal | Danish (1.234,56) or Period decimal (1234.56) |
| Negative amounts | Prefix minus | Prefix minus, parentheses, or separate column |

### Column Mapping Table

Map every column from the bank's export to the common transaction schema:

```markdown
| Bank Column | Common Field | Transform |
|-------------|-------------|-----------|
| Dato | date | Parse DD/MM/YYYY to YYYY-MM-DD |
| Beloeb | amount | Direct (already period decimal) |
| Tekst | raw_text | Direct |
| Exportkonto | account | Direct |
| Saldo | (ignore) | Not needed |
```

Use these values in the "Common Field" column:
- `date`, `amount`, `currency`, `description`, `raw_text`, `bank`, `account` -- mapped fields
- `(metadata)` -- useful context but not in the core schema
- `(ignore)` -- not needed

### Transform Rules

Document any transformations needed:

- **Date parsing**: "DD/MM/YYYY -> YYYY-MM-DD"
- **Number conversion**: "Danish format 1.234,56 -> 1234.56" (or note if preset handles this)
- **Text cleaning**: "Remove leading/trailing whitespace, normalize multiple spaces"
- **Amount sign**: "Negative = expense, Positive = income"

## Danish Number Format

Danish banks commonly use the Danish number format where:
- Period is the thousands separator: `1.234`
- Comma is the decimal separator: `1.234,56`

Always document whether the export uses Danish format or has been converted (e.g., Nykredit's smartspender preset converts decimals to periods).

## Encoding

Danish characters (æ, ø, å, Æ, Ø, Å) require correct encoding. If the encoding is wrong, these characters appear as garbage. Common encodings for Danish banks:
- **UTF-8**: Modern standard, handles Danish characters natively
- **ISO-8859-1 (Latin-1)**: Older standard, still used by some banks
- **Windows-1252**: Similar to Latin-1, sometimes used in Windows-exported files

Always verify encoding by checking that Danish characters render correctly after parsing.

## Example: Nykredit with SmartSpender Preset

```
Exportkonto,Afsenderkonto,Modtagerkonto,Dato,Tekst,Beloeb,Saldo,Indbetaler,Supp. tekst til modtager,Tekst til modtager
1234-1234567,,,15/01/2026,NETFLIX.COM,-149.00,12345.67,,,
```

- Delimiter: comma (preset selects "Kommasepareret")
- Decimal: period (preset enables "Konverter decimaltegn til punktum")
- Encoding: UTF-8
- Header: yes (preset enables "Medtag kolonneoverskrifter")
