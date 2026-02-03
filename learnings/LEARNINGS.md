# SmartSpender Learnings

This directory stores corrections and preferences learned from user conversations.

## Automatic Learning

The `skills/user-memory/SKILL.md` automatically detects and persists user information:
- Triggers on patterns like "Jeg har X kr i opsparing", "Det er ikke Y, det er Z"
- Writes to the appropriate file based on learning type
- Confirms briefly without interrupting flow

## How to Use (for Claude)

1. **Load user-memory skill at workflow start** — enables automatic learning detection
2. **Read relevant learning files at the start of workflows** — before applying static rules
3. **Apply learnings BEFORE static rules** — learnings take precedence over defaults
4. **When user corrects something, use user-memory skill** — it handles formatting and file selection
5. **Always add timestamp and brief context** — so we can trace why a rule exists

## Files

| File | Purpose |
|------|---------|
| `categorization.md` | Merchant to category mappings learned from user corrections |
| `subscriptions.md` | Subscription detection rules (confirmed subs, false positives) |
| `merchants.md` | Merchant name normalization and aliases |
| `receipts.md` | Receipt/invoice extraction preferences |
| `preferences.md` | User financial situation, personal context, and output preferences |

## Related Skill

| Skill | Purpose |
|-------|---------|
| `skills/user-memory/SKILL.md` | Auto-detects and persists user-provided information |

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
