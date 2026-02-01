# Bank Adapter Structure

## Context

Each Danish bank has a different netbank interface, export process, and data format. Bank adapters encode this bank-specific knowledge in markdown files so Claude can navigate any supported bank consistently. See PRODUCT_SPEC.md for the full adapter system design.

## Directory Layout

Each bank gets its own directory under `banks/`:

```
banks/
├── _template.md              # Starting point for new banks
├── nykredit/
│   ├── BANK.md               # Navigation and authentication flow
│   ├── export-format.md      # CSV/export parsing rules
│   └── quirks.md             # Known issues and workarounds
├── danske-bank/
│   ├── BANK.md
│   ├── export-format.md
│   └── quirks.md
└── ...
```

## Required Files

### BANK.md (Primary Adapter)
The main file Claude reads when syncing from this bank. Must contain:

1. **Basic Info**: Bank ID, website, netbank URL, authentication method
2. **Navigation Flow**: Step-by-step instructions from login to export, including exact URLs
3. **Export Options**: Whether CSV download is available, or if screen scraping is needed
4. **Session Notes**: Timeout duration, re-authentication triggers

### export-format.md
How to parse the bank's export file. Must contain:

1. **File Format**: Type (CSV/Excel), delimiter, encoding, header row presence
2. **Column Mapping**: Table mapping bank columns to the common transaction schema
3. **Parsing Rules**: Date format, number format, negative amount handling
4. **Special Handling**: Any bank-specific parsing quirks

### quirks.md
Known issues and workarounds. Must contain:

1. **Known Issues**: Problems encountered and their solutions
2. **Transaction Description Patterns**: How the bank formats different transaction types
3. **Tips**: Helpful notes for working with this bank

## Writing an Adapter

When adding a new bank:

1. Copy `banks/_template.md` content as a starting guide
2. Create the bank directory: `banks/{bank-id}/`
3. Create all three required files
4. Test by running `/smartspender:sync {bank-id}` end-to-end
5. Document every quirk discovered during testing in `quirks.md`

## Key Principles

- **Be explicit about URLs**: Include full URLs, not relative paths
- **Document every click**: If Claude needs to interact with a button, describe how to find it (selector, text, position)
- **Assume iframe complexity**: Danish banks commonly use iframes -- always document whether form elements are in an iframe
- **Include wait times**: Bank pages load asynchronously -- document where to wait and what to wait for
- **Test with real sessions**: Adapter accuracy can only be verified against the live bank site
