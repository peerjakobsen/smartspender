# Bank Adapter Template

## Purpose

Copy this template when adding a new bank to SmartSpender. Create a new directory under `banks/` with the bank's lowercase identifier, then create the three required files.

## Directory Structure

```
banks/{bank-id}/
├── BANK.md              # Navigation and authentication flow
├── export-format.md     # CSV/export parsing rules
└── quirks.md            # Known issues and workarounds
```

## BANK.md Template

```markdown
# {Bank Name} Adapter

## Basic Info
- **Bank ID**: `{bank-id}`
- **Website**: {website}
- **Netbank URL**: {netbank login URL}
- **Export URL**: {direct URL to export page, if available}
- **Authentication**: MitID

## Navigation Flow

1. Navigate to: `{netbank URL}`
2. Announce: "Please log in with MitID. Let me know when you're logged in."
3. **[USER ACTION]**: User completes MitID login
4. **[USER ACTION]**: User confirms login complete
5. Navigate to: `{export/transactions page URL}`
6. Wait for: {what indicates the page is ready}
7. {Steps to configure and trigger export}

## Export Options
- **CSV Download**: Yes/No
- **Screen Scrape**: {describe table structure if no CSV}
- **Format Selection**: {how to choose the right format}

## Session Notes
- **Session timeout**: {duration, e.g., 15 minutes}
- **Re-auth triggers**: {actions that require re-authentication}
```

## export-format.md Template

```markdown
# {Bank Name} Export Format

## File Format
- **Type**: CSV
- **Delimiter**: {comma, semicolon, tab}
- **Decimal separator**: {period or comma}
- **Encoding**: {UTF-8, ISO-8859-1}
- **Date format**: {DD/MM/YYYY, DD-MM-YYYY}
- **Has header row**: Yes/No

## Columns

| # | Column Name | Description |
|---|-------------|-------------|
| 1 | {name} | {description} |
| 2 | {name} | {description} |
| ... | ... | ... |

## Column Mapping to Common Schema

| Bank Column | Common Field | Transform |
|-------------|--------------|-----------|
| {column} | date | Parse {format} to YYYY-MM-DD |
| {column} | amount | {conversion rules} |
| {column} | raw_text | Direct |
| {column} | account | Direct |
| {balance column} | (dedup) | Running balance -- used for tx_hash computation |
| {column} | (ignore) | - |

## Sample Row

{Include a realistic sample CSV row with all columns}
```

## quirks.md Template

```markdown
# {Bank Name} Quirks

## Known Issues

### {Issue 1 title}
{Description of the issue and how to handle it}

### {Issue 2 title}
{Description and workaround}

## Transaction Description Patterns

Common patterns in this bank's transaction descriptions:

- **Card payments**: "{pattern}"
- **Transfers**: "{pattern}"
- **Direct debit (PBS)**: "{pattern}"
- **ATM withdrawals**: "{pattern}"

## Tips

- {Helpful notes for working with this bank}
```
