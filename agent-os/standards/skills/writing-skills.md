# Writing Effective Skill Files

## Context

Skills are markdown files that provide Claude with domain knowledge. Unlike commands, skills are not directly invoked by users -- Cowork loads them automatically when their content is relevant to the current conversation. A well-written skill helps Claude make better decisions without requiring user intervention.

## What Makes a Good Skill

### Be Specific, Not General
A skill should contain knowledge that Claude doesn't have by default. Don't restate general knowledge.

**Bad**: "Transactions have dates and amounts"
**Good**: "Nykredit CSV exports use DD/MM/YYYY date format and Danish number formatting (1.234,56) unless the smartspender preset is active, which converts decimals to periods"

### Be Declarative, Not Procedural
Skills describe knowledge and rules. Commands describe procedures. Don't mix them.

**Bad**: "Step 1: Open Google Sheets. Step 2: Read transactions..."
**Good**: "Transactions are stored in the 'Transactions' sheet with columns: tx_id, tx_hash, date, amount, currency, description, raw_text, bank, account, synced_at"

### Include Decision Rules
Tell Claude how to handle ambiguous situations.

**Example from categorization skill**:
```markdown
## Ambiguous Merchants
- "Netto" always maps to Dagligvarer, even though they sell non-grocery items
- "7-Eleven" maps to Dagligvarer (most purchases are food/drink)
- "Amazon" defaults to Shopping unless description contains "Prime" (then Abonnementer)
```

### Provide Concrete Examples
Abstract rules are hard to apply. Include real examples from the SmartSpender context.

**Example from subscription detection skill**:
```markdown
## Detection Example
Given these transactions:
- 2025-11-01: Netflix -149.00
- 2025-12-01: Netflix -149.00
- 2026-01-01: Netflix -149.00

Result: Recurring subscription detected
- Merchant: Netflix
- Amount: 149.00 kr
- Frequency: monthly
- Confidence: high (3 occurrences, exact amount match, regular interval)
```

## Common Mistakes

- Writing skills that just repeat what's in PRODUCT_SPEC.md -- skills should add operational detail
- Making skills too long -- split into focused topics (categorization vs. subscription detection)
- Forgetting to include edge cases and exceptions
- Writing for humans instead of for Claude -- be explicit about what to do
