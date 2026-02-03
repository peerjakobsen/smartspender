---
name: user-memory
description: Detects and persists user-provided personal information across Cowork sessions. Auto-activated when user states preferences, financial situation, or corrections.
---

# User Memory

## Purpose

Automatically detect when users provide information about their financial situation, preferences, or corrections, and persist this to the appropriate learnings file so future sessions can use it.

## When to Activate

This skill activates automatically when:
1. User answers a question about their financial situation
2. User volunteers personal context information
3. User corrects a categorization, subscription status, or merchant name
4. User states an output preference

## Trigger Patterns

### Financial Situation (Danish)

| Pattern | Category | Extraction |
|---------|----------|------------|
| `Jeg har [X] kr i nødopsparing/opsparing` | emergency_fund | amount |
| `Min nødopsparing er [X] kr` | emergency_fund | amount |
| `Jeg har [X] måneder i opsparing` | emergency_fund | months_coverage |
| `Jeg har gæld i/til [X]` | debt | creditor |
| `Min gæld er [X] kr` | debt | amount |
| `Jeg skylder [X] kr til [Y]` | debt | amount, creditor |
| `Min pension er [X]%` | pension | percentage |
| `Jeg indbetaler [X]% til pension` | pension | percentage |
| `Jeg har pension hos [X]` | pension | provider |
| `Min løn er [X] kr` | income | amount |
| `Jeg tjener [X] kr om måneden` | income | amount |
| `Min bruttoløn er [X] kr` | income | gross_amount |

### Financial Situation (English)

| Pattern | Category | Extraction |
|---------|----------|------------|
| `I have [X] in emergency fund/savings` | emergency_fund | amount |
| `My emergency fund is [X]` | emergency_fund | amount |
| `I have [X] months of expenses saved` | emergency_fund | months_coverage |
| `I have debt with/to [X]` | debt | creditor |
| `I owe [X] to [Y]` | debt | amount, creditor |
| `My pension is [X]%` | pension | percentage |
| `I contribute [X]% to pension` | pension | percentage |
| `My salary is [X]` | income | amount |
| `I earn [X] per month` | income | amount |

### Personal Context (Danish)

| Pattern | Category | Extraction |
|---------|----------|------------|
| `Jeg arbejder hos [X]` | employer | company_name |
| `Min arbejdsgiver er [X]` | employer | company_name |
| `Jeg er ansat hos [X]` | employer | company_name |
| `Jeg vil gerne [X]` | goal | goal_description |
| `Mit mål er at [X]` | goal | goal_description |
| `Jeg sparer op til [X]` | goal | savings_goal |
| `Jeg planlægger at [X]` | goal | plan_description |
| `Jeg er [X]` (single/married/etc.) | life_situation | status |
| `Jeg har [X] børn` | life_situation | children_count |
| `Jeg bor i [X]` | life_situation | location |
| `Jeg er [X] år` | life_situation | age |

### Personal Context (English)

| Pattern | Category | Extraction |
|---------|----------|------------|
| `I work at [X]` | employer | company_name |
| `My employer is [X]` | employer | company_name |
| `I want to [X]` | goal | goal_description |
| `My goal is to [X]` | goal | goal_description |
| `I'm saving for [X]` | goal | savings_goal |
| `I plan to [X]` | goal | plan_description |
| `I am [X]` (single/married/etc.) | life_situation | status |
| `I have [X] children` | life_situation | children_count |

### Corrections (Danish)

| Pattern | Category | Target File |
|---------|----------|-------------|
| `[X] er ikke [Y], det er [Z]` | category_correction | learnings/categorization.md |
| `Nej, det er [X], ikke [Y]` | category_correction | learnings/categorization.md |
| `Det er (ikke) et abonnement` | subscription_correction | learnings/subscriptions.md |
| `[X] er et abonnement` | subscription_confirmation | learnings/subscriptions.md |
| `[X] er det samme som [Y]` | merchant_alias | learnings/merchants.md |
| `[X] hedder egentlig [Y]` | merchant_alias | learnings/merchants.md |

### Output Preferences (Danish)

| Pattern | Category | Extraction |
|---------|----------|------------|
| `Vis altid [X]` | display_preference | format |
| `Jeg foretrækker [X]` | display_preference | preference |
| `Brug [X] format` | display_preference | format |
| `Tal dansk/engelsk` | language_preference | language |
| `Mere/mindre detaljer` | detail_preference | level |

### Output Preferences (English)

| Pattern | Category | Extraction |
|---------|----------|------------|
| `Always show [X]` | display_preference | format |
| `I prefer [X]` | display_preference | preference |
| `Use [X] format` | display_preference | format |
| `More/less detail` | detail_preference | level |

## Target Files

| Learning Type | Target File | Section |
|---------------|-------------|---------|
| Emergency fund | learnings/preferences.md | Financial Situation |
| Debt status | learnings/preferences.md | Financial Situation |
| Pension status | learnings/preferences.md | Financial Situation |
| Income | learnings/preferences.md | Financial Situation |
| Employer | learnings/preferences.md | Personal Context |
| Goals | learnings/preferences.md | Personal Context |
| Life situation | learnings/preferences.md | Personal Context |
| Category corrections | learnings/categorization.md | Learnings table |
| Subscription status | learnings/subscriptions.md | Confirmed/Not sections |
| Merchant aliases | learnings/merchants.md | Aliases table |
| Output preferences | learnings/preferences.md | Output Preferences |

## Learning Entry Format

### For preferences.md

```markdown
### {YYYY-MM-DD}
**Category**: {financial_situation|personal_context|output_preference}
**Trigger**: "{exact user statement}"
**Rule**: {extracted structured information}
**Source**: {command that captured this}
```

### For categorization.md

Append to the Learnings table:

```markdown
| {YYYY-MM-DD} | {pattern} | {merchant} | {category} | {subcategory} | {user statement} |
```

### For subscriptions.md

Append to Confirmed Subscriptions:
```markdown
| {YYYY-MM-DD} | {pattern} | {merchant} | {frequency} | User confirmed |
```

Or append to Not Subscriptions:
```markdown
| {YYYY-MM-DD} | {pattern} | {merchant} | User: "{reason}" |
```

### For merchants.md

Append to Aliases table:
```markdown
| {YYYY-MM-DD} | {raw_pattern} | {normalized_name} | User alias |
```

## Workflow

When user provides information that matches a trigger pattern:

1. **Detect**: Identify which pattern matched
2. **Extract**: Pull out the relevant values (amounts, names, etc.)
3. **Validate**: Ensure the extracted information makes sense
4. **Target**: Determine which file and section to write to
5. **Check duplicates**: Read target file, check if similar rule exists
6. **Write**: Append the learning entry in the correct format
7. **Confirm**: Acknowledge briefly without interrupting flow

## Confirmation Behavior

After saving a learning, acknowledge briefly in Danish:

| Learning Type | Confirmation |
|---------------|--------------|
| Financial status | "Noteret: {summary}. Jeg husker det." |
| Personal context | "Noteret: {summary}." |
| Correction | "Forstået. Jeg retter det fremover." |
| Preference | "Noteret. Jeg bruger det fremover." |

**Rules:**
- Keep confirmations short (one sentence)
- Don't interrupt the conversation flow
- Integrate naturally into the response
- Don't ask for confirmation before saving

## Reading Learnings

At the start of relevant workflows, read learnings to apply prior knowledge:

1. **Before asking about emergency fund**: Check preferences.md for existing emergency_fund entry
2. **Before asking about pension**: Check preferences.md for existing pension entry
3. **Before asking about employer**: Check preferences.md for existing employer entry
4. **Before categorizing**: Check categorization.md for learned rules
5. **Before detecting subscriptions**: Check subscriptions.md for confirmed/denied

If a learning exists, skip the question and use the stored value.

## Update Behavior

When user provides updated information:

1. **Detect update**: User provides new value for existing learning
2. **Mark old entry**: Add `[Superseded by {date}]` to old entry
3. **Write new entry**: Append new learning with current date
4. **Confirm**: "Opdateret: {old_value} → {new_value}"

## Example: Advice Session

```
User: /smartspender:advice

Claude: [Reads learnings/preferences.md - no emergency_fund entry]
Claude: "Har du en nødopsparing?"

User: "Ja, jeg har 20.000 kr i opsparing"

Claude: [Detects pattern: "har X kr i opsparing"]
Claude: [Extracts: amount=20000, category=emergency_fund]
Claude: [Writes to learnings/preferences.md]
Claude: "Noteret: 20.000 kr i nødopsparing. [continues with advice]"

---
Next session:

User: /smartspender:advice

Claude: [Reads learnings/preferences.md - finds emergency_fund=20000]
Claude: [Skips emergency fund question, uses stored value]
Claude: "Baseret på din nødopsparing på 20.000 kr..."
```

## Example: Category Correction

```
User: "Netflix er underholdning, ikke abonnement"

Claude: [Detects pattern: "X er Y, ikke Z"]
Claude: [Extracts: merchant=Netflix, correct=Underholdning, incorrect=Abonnementer]
Claude: [Writes to learnings/categorization.md]
Claude: "Forstået. Netflix kategoriseres som Underholdning fremover."
```

## Integration Points

Commands that should trigger user-memory:

- `/smartspender:advice` - Financial questions
- `/smartspender:analyze` - Category corrections
- `/smartspender:subscriptions` - Subscription confirmations
- `/smartspender:overview` - Preference statements
- Any conversation where user volunteers information

## Conflict Resolution

If stored learning conflicts with new information:

1. **Prefer recent**: Newer information supersedes older
2. **Ask if ambiguous**: "Tidligere sagde du X, nu siger du Y. Hvad er korrekt?"
3. **Update on confirmation**: Write new entry, mark old as superseded
