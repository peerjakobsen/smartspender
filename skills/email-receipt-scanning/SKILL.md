---
name: email-receipt-scanning
description: Domain knowledge for scanning Gmail for receipt and invoice emails. Reference this when processing email-based receipts.
---

# Email Receipt Scanning

## Purpose

Provides Gmail search queries, Danish sender patterns, email content type detection, and deduplication rules for scanning a user's inbox for receipts and invoices. Used by the `/smartspender:receipt email` command.

## Prerequisites

This skill requires the Gmail MCP server to be configured in the user's environment. The following MCP tools are needed:
- `gmail_search` or equivalent — search emails by query
- `gmail_get_message` or equivalent — read email content and metadata
- `gmail_get_attachment` or equivalent — download PDF attachments

If Gmail MCP is not available, commands using this skill should fail gracefully with a clear message.

## Gmail Search Queries

### Primary Search Query

Search for receipt and invoice emails using this combined query:

```
subject:(faktura OR kvittering OR receipt OR invoice OR ordre OR order OR betaling) has:attachment after:{YYYY/MM/DD}
```

Where `{YYYY/MM/DD}` is either:
- The `last_email_scan` timestamp from settings.csv (incremental scan)
- A calculated date based on the `days` argument (e.g., 30 days back)
- Default: 90 days back if no previous scan and no argument

### Supplementary Queries

If the primary query returns few results, also try:

```
from:(*faktura* OR *invoice* OR *noreply* OR *no-reply*) has:attachment after:{YYYY/MM/DD}
```

```
subject:(ordrebekraeftelse OR orderbekraeftelse OR betalingsbekraeftelse) after:{YYYY/MM/DD}
```

### Query Notes
- `has:attachment` ensures only emails with files are returned (most invoices are PDF attachments)
- Danish keywords (`faktura`, `kvittering`, `betaling`) catch Danish vendor emails
- English keywords (`receipt`, `invoice`, `order`) catch international vendors
- Date filter prevents re-scanning old emails

## Danish Sender Patterns

Map known email sender domains to vendor IDs for faster vendor detection:

| Sender Pattern | Vendor ID | Vendor Name | Type |
|---------------|-----------|-------------|------|
| `*@tdc.dk` | `tdc` | TDC | Telecom |
| `*@tdcnet.dk` | `tdc` | TDC | Telecom |
| `*@telenor.dk` | `telenor` | Telenor | Telecom |
| `*@telia.dk` | `telia` | Telia | Telecom |
| `*@orsted.dk` | `orsted` | Oersted | Electricity |
| `*@hofor.dk` | `hofor` | HOFOR | Water |
| `*@norlys.dk` | `norlys` | Norlys | Electricity |
| `*@ewii.dk` | `ewii` | EWII | Utility |
| `*@dinenergi.dk` | `dinenergi` | Din Energi | Electricity |
| `*@netflix.com` | `netflix` | Netflix | Streaming |
| `*@spotify.com` | `spotify` | Spotify | Streaming |
| `*@amazon.com` | `amazon` | Amazon | Online order |
| `*@amazon.de` | `amazon` | Amazon | Online order |
| `*@zalando.dk` | `zalando` | Zalando | Online order |
| `*@ikea.com` | `ikea` | IKEA | Online order |
| `*@wolt.com` | `wolt` | Wolt | Delivery |
| `*@nemlig.com` | `nemlig` | Nemlig | Delivery |

For senders not in this table: extract the domain name as a starting point for vendor detection, then fall through to the invoice-parsing skill's vendor detection workflow.

## Email Content Types

Receipt emails come in three forms. Detect and handle each:

| Content Type | Detection | Extraction Method |
|-------------|-----------|-------------------|
| **PDF attachment** | Email has `.pdf` attachment | Download attachment → process as PDF invoice |
| **Inline HTML** | Email body contains structured receipt data, no PDF | Extract from email HTML body |
| **Both** | PDF attachment + summary in body | Prefer PDF attachment (more complete) |

### PDF Attachment Priority
When an email has both a PDF attachment and inline content, always process the PDF. The inline content is typically a summary or notification, while the PDF is the full invoice.

### Inline HTML Extraction
For emails without PDF attachments (e.g., Wolt order confirmations, Nemlig receipts):
1. Parse the email HTML body
2. Look for structured tables with item names, quantities, prices
3. Extract total from summary section
4. Set `file_reference` to `email:{message_id}` (no file to archive)

## Deduplication

### Timestamp-Based Scan Window
- Read `last_email_scan` from settings.csv
- Only search emails received after this timestamp
- After successful scan, update `last_email_scan` to current datetime

### Cross-Check with receipts.csv
Before processing each email:
1. Detect vendor and date from email metadata
2. Extract total (from subject line or quick body scan)
3. Check receipts.csv for existing receipt with same date + merchant + total_amount
4. If match found: skip and note in scan summary as "allerede registreret"

### Deduplication Fields

| Field | Source | Match Rule |
|-------|--------|------------|
| date | Email date or invoice date | Same day |
| merchant | Sender domain mapping or vendor detection | Same normalized merchant |
| total_amount | PDF extraction or email body | Exact match |

## Date Range Calculation

| Scenario | Date Range |
|----------|------------|
| `last_email_scan` exists in settings.csv | From `last_email_scan` to now |
| User provides `days` argument | From (today - days) to now |
| Neither (first scan) | From (today - 90 days) to now |

If the user provides a `days` argument, it overrides `last_email_scan`. This allows rescanning a specific period.

## Email Filtering Heuristics

Not every email matching the search query is a receipt. Apply these filters:

### Include
- Emails with PDF attachments from known vendor domains
- Emails with "faktura" or "kvittering" in subject
- Order confirmation emails with itemized totals

### Exclude
- Marketing emails (subject contains "tilbud", "kampagne", "nyhedsbrev" without "faktura"/"kvittering")
- Password reset or account notification emails
- Shipping notifications without invoice content
- Emails already processed (deduplication check)

## Examples

### Example 1: Incremental Scan

**Context**: `last_email_scan` = 2026-01-15 in settings.csv

**Search query**: `subject:(faktura OR kvittering OR receipt OR invoice OR ordre OR order OR betaling) has:attachment after:2026/01/15`

**Results**: 4 emails found
1. TDC faktura (2026-01-20) — PDF attachment — known vendor
2. Oersted aarsopgoerelse (2026-01-25) — PDF attachment — known vendor
3. Wolt ordrebekraeftelse (2026-01-28) — inline HTML — no parser
4. Spam email about "tilbud" — filtered out

**After processing**: Update `last_email_scan` to 2026-02-01

### Example 2: First-Time Scan with Days Argument

**Context**: No `last_email_scan` in settings.csv. User runs `/smartspender:receipt email 30`

**Search query**: `subject:(faktura OR kvittering OR receipt OR invoice OR ordre OR order OR betaling) has:attachment after:2026/01/02`

**Results**: Emails from the last 30 days

## Related Skills

- See `skills/document-parsing/SKILL.md` for vendor detection, parser lookup workflow, and general extraction rules
- See `skills/data-schemas/SKILL.md` for the CSV file structure (email receipts use `source: email`)
