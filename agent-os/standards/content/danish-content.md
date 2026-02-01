# Danish Content Standards

## Context

SmartSpender is built for Danish bank customers. All user-facing content, merchant names, categories, and bank terminology are in Danish. This standard defines how to handle Danish language content consistently.

## Character Encoding

- Always use UTF-8 encoding for all files
- Danish special characters that must render correctly: ae (ae), oe (oe), aa (aa), AE, OE, AA
- When parsing bank exports, verify encoding handles these characters (see `bank-adapters/export-format.md`)

## Category Names

Use Danish category names as defined in PRODUCT_SPEC.md:

| Danish | English (reference only) |
|--------|------------------------|
| Bolig | Housing |
| Dagligvarer | Groceries |
| Transport | Transport |
| Abonnementer | Subscriptions |
| Restauranter | Dining |
| Shopping | Shopping |
| Sundhed | Health |
| Underholdning | Entertainment |
| Rejser | Travel |
| Boern | Children |
| Personlig pleje | Personal care |
| Uddannelse | Education |
| Opsparing | Savings |
| Indkomst | Income |
| Andet | Other |

## Merchant Name Normalization

Transaction descriptions from Danish banks are often abbreviated or formatted inconsistently. Normalize to the commonly recognized name:

- `NETTO FO 1234` -> `Netto`
- `REMA1000 KBH` -> `Rema 1000`
- `FOETEX OESTERBRO` -> `Foetex`
- `DSB MOBILBILLET` -> `DSB`
- `NETFLIX.COM` -> `Netflix`
- `SPOTIFY AB` -> `Spotify`

Rules:
- Use the brand's official capitalization: `Netto`, not `NETTO` or `netto`
- Remove store numbers, location suffixes, and transaction codes
- Keep the name recognizable to a Danish user

## Banking Terminology

Danish banking terms used throughout the plugin:

| Danish | English | Used In |
|--------|---------|---------|
| Kontooversigt | Account overview | Navigation |
| Bevaegelser | Transactions | Navigation |
| Overfoersel | Transfer | Transaction types |
| Beloeb | Amount | Export columns |
| Saldo | Balance | Export columns |
| Dankort | Danish debit card | Transaction descriptions |
| PBS/Betalingsservice | Direct debit | Transaction descriptions |
| MitID | National digital ID | Authentication |
| Netbank | Online banking | Navigation |
| Loenkonto | Salary account | Account types |
| Budgetkonto | Budget account | Account types |

## User-Facing Messages

- Report summaries use Danish currency format: `1.847 kr` (period as thousands separator)
- Dates in user-facing output: `15. januar 2026` (Danish date format)
- Dates in data storage: `2026-01-15` (ISO format, see `data/transaction-format.md`)
- Use `kr` suffix (not `DKK`) in casual output: "Du brugte 4.200 kr paa dagligvarer"
- Use `DKK` in data fields and formal contexts

## File Content Language

- Plugin internal files (skills, adapters, standards): English
- User-facing output (reports, summaries, messages): Danish
- Category names: Danish (as listed above)
- Command names and arguments: English (e.g., `/smartspender:sync`, not `/smartspender:synk`)
