# Google Sheets Schema Standards

## Context

SmartSpender uses Google Sheets as its database, accessed via the MCP Google Sheets server. This standard defines how sheets should be structured and maintained. See PRODUCT_SPEC.md for the complete schema definitions.

## Spreadsheet Naming

- Format: `SmartSpender - {Year}` (e.g., "SmartSpender - 2026")
- One spreadsheet per year
- Create a new spreadsheet when the year changes

## Sheet Naming

Use title case, human-readable names:
- `Transactions` -- raw imported data
- `Categorized` -- enriched transactions with categories
- `Subscriptions` -- detected recurring charges
- `Monthly Summary` -- aggregated spending by month and category
- `Action Log` -- audit trail of all agent actions
- `Accounts` -- configured bank accounts
- `Settings` -- plugin configuration

## Column Conventions

### Naming
- Use snake_case for column identifiers in documentation and code references
- Use human-readable headers in the actual sheets: `tx_id` in docs, but the sheet column header can be `TX ID` or match the snake_case form
- Be consistent within each sheet

### Data Types
- **Dates**: YYYY-MM-DD format in the sheet (sortable, unambiguous)
- **Datetimes**: YYYY-MM-DD HH:MM:SS format
- **Numbers**: Standard decimal format with period separator (1234.56)
- **Booleans**: TRUE / FALSE (Google Sheets native boolean)
- **Strings**: Plain text, no surrounding quotes

### Required Columns
Every data sheet (Transactions, Categorized, Subscriptions) must have:
- A unique ID column as the first column
- A timestamp column showing when the row was created or last modified

## Deduplication

- The `tx_hash` column in Transactions prevents duplicate imports
- Before appending new rows, always check for existing tx_hash values
- Hash is computed from: account + date (YYYY-MM-DD) + amount (2 decimal places) + saldo (2 decimal places)
- Fallback (if bank has no running balance): account + date + amount + raw_text (trimmed, lowercased)
- See `agent-os/standards/data/transaction-format.md` for the full formula

## Sheet Relationships

```
Transactions (raw) --[tx_id]--> Categorized (enriched)
Categorized --[merchant + is_recurring]--> Subscriptions
Categorized --[month + category]--> Monthly Summary
All actions --> Action Log
```

## Access via MCP

- All sheet operations go through the MCP Google Sheets server
- Never access sheets through browser automation -- always use MCP
- The MCP server is configured in `.mcp.json` at the plugin root
- Operations: read rows, append rows, update cells, create sheets
