# Markdown Formatting Conventions

## Context

Every component of SmartSpender is a markdown file. Consistent formatting makes files easier to read, maintain, and parse by both humans and Claude.

## Headings

- Use `#` for the file title (one per file)
- Use `##` for major sections
- Use `###` for subsections
- Don't skip levels (e.g., don't go from `#` to `###`)
- Keep headings concise -- max 5-6 words

## Lists

- Use `-` for unordered lists (not `*` or `+`)
- Use `1.` for ordered lists (numbered steps in workflows)
- Indent nested lists with 2 spaces
- Keep list items concise -- one line per item when possible

## Tables

Use tables for structured data (column mappings, category lists, form elements):

```markdown
| Column | Type | Description |
|--------|------|-------------|
| tx_id | string | Unique ID |
| date | date | Transaction date |
```

- Always include the header separator row (`|---|---|---|`)
- Align columns for readability in source
- Keep cell content short -- use a description section below the table for details

## Code Blocks

- Use fenced code blocks with language identifiers:
  - ` ```javascript ` for browser automation scripts
  - ` ```json ` for configuration files
  - ` ```markdown ` for template examples
  - ` ```csv ` for export format examples
- Keep code blocks focused -- one concept per block
- Add a brief description above each code block explaining what it shows

## Emphasis

- Use `**bold**` for important terms, field names, and warnings
- Use `*italic*` for references and quotes
- Use `` `backticks` `` for filenames, paths, field names, values, and inline code
- Don't overuse emphasis -- if everything is bold, nothing stands out

## File Structure

Every markdown file in the plugin should follow this pattern:

```markdown
# Title

## Context or Purpose
Brief description of what this file contains and when it's used.

## [Main Content Sections]
The actual content, organized with clear headings.

## Examples (if applicable)
Concrete examples showing the content in use.
```

## Line Length

- No hard line length limit -- let editors wrap naturally
- Break long paragraphs into shorter ones for readability
- Use line breaks between sections for visual separation

## Links and References

- Reference other plugin files by path: "See `banks/nykredit/quirks.md`"
- Reference PRODUCT_SPEC.md for architectural decisions: "See PRODUCT_SPEC.md for the full categorization system"
- Don't use external links unless they point to stable documentation
