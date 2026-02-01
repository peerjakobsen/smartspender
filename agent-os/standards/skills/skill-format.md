# Skill File Format

## Context

All skill files follow a consistent markdown structure so Claude can reliably parse and apply them. This standard defines the required and optional sections.

## Required Structure

```markdown
# [Skill Name]

## Purpose
One-sentence description of what knowledge this skill provides.

## [Domain-Specific Sections]
The core content of the skill, organized by topic.

## Examples
Concrete examples showing how the knowledge applies.
```

## Section Guidelines

### Title (`# [Skill Name]`)
- Use the same name as the filename (capitalized): `transaction-schema.md` -> `# Transaction Schema`
- Keep it short and descriptive

### Purpose
- One or two sentences maximum
- Explain what Claude should use this knowledge for
- Example: "Defines the common transaction data format used across all bank adapters and Google Sheets storage."

### Domain Sections
- Use `##` headings for major topics
- Use `###` for subtopics
- Use tables for structured data (column mappings, category lists, etc.)
- Use code blocks for data formats, patterns, and examples

### Examples
- At least one concrete example showing the skill in action
- Use real-world SmartSpender data formats
- Show both input and expected output where applicable

## Optional Sections

### Edge Cases
Document situations where the normal rules don't apply.

### Related Skills
Reference other skill files when topics overlap: "See also: `categorization.md` for how categories are assigned"

### Known Limitations
Things Claude should be aware of that might cause issues.

## Example Skill File

```markdown
# Transaction Schema

## Purpose
Defines the common data format for all transactions in SmartSpender, used for storage in Google Sheets and communication between skills.

## Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| tx_id | string | yes | Unique ID (auto-generated) |
| tx_hash | string | yes | Dedup hash: date + amount + raw_text |
| date | date | yes | Transaction date (YYYY-MM-DD) |
| amount | number | yes | Amount (negative = expense) |
| currency | string | yes | Currency code (DKK default) |
| description | string | yes | Cleaned description |
| raw_text | string | yes | Original bank text |
| bank | string | yes | Bank identifier |
| account | string | yes | Account identifier |
| synced_at | datetime | yes | Import timestamp |

## Deduplication
The tx_hash field prevents duplicate imports. Hash is computed from:
- date (YYYY-MM-DD format)
- amount (to 2 decimal places)
- raw_text (trimmed, lowercased)

## Examples
A Nykredit transaction:
- tx_hash: "2026-01-15|-149.00|netflix"
- date: 2026-01-15
- amount: -149.00
- currency: DKK
- description: Netflix
- raw_text: "NETFLIX.COM"
- bank: nykredit
- account: lønkonto
```
