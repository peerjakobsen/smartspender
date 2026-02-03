# SmartSpender Learnings

This directory stores corrections and preferences learned from user conversations.

## How to Use (for Claude)

1. **Read relevant learning files at the start of workflows** — before applying static rules
2. **Apply learnings BEFORE static rules** — learnings take precedence over defaults
3. **When user corrects something, append to the appropriate file** — use the format specified in each file
4. **Always add timestamp and brief context** — so we can trace why a rule exists

## Files

| File | Purpose |
|------|---------|
| `categorization.md` | Merchant to category mappings learned from user corrections |
| `subscriptions.md` | Subscription detection rules (confirmed subs, false positives) |
| `merchants.md` | Merchant name normalization and aliases |
| `receipts.md` | Receipt/invoice extraction preferences |
| `preferences.md` | User output format and behavior preferences |

## When to Record Learnings

Append a learning when the user:

- **Corrects a category**: "Nej, det er ikke Shopping, det er Hobby"
- **Corrects subscription status**: "Det er ikke et abonnement" or "Jo, det ER et abonnement"
- **Provides merchant info**: "NETTO FO er bare Netto"
- **States a preference**: "Vis altid beløb uden decimaler"
- **Explains context**: "Jeg arbejder hos X, så de betalinger er arbejdsrelateret"

## Learning Entry Format

Each learning should follow this structure:

```markdown
### {YYYY-MM-DD}
**Trigger**: {What user said/did}
**Rule**: {The extracted rule}
**Example**: {Concrete example if applicable}
```

Or use the table format specified in each individual file.
