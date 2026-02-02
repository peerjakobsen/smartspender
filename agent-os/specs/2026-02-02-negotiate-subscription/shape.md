# Phase 4a: Subscription Negotiation — Shaping Notes

## Scope

Add `/smartspender:negotiate [service]` command and a `skills/negotiation/SKILL.md` knowledge file. Users get a drafted Danish negotiation email with competitor research, cost data, and consumer rights context. This is the first feature in Phase 4: Cost Optimization.

**Includes**: One command, one skill, roadmap update, plugin version bump to 1.5.0.
**Excludes**: Phone scripts, automatic sending, outcome tracking, bulk negotiation.

## Key Decisions

### Draft-Only, Never Auto-Send
The command generates a draft email in `drafts/negotiate-{service}-{YYYY-MM-DD}.md`. The user reviews, edits, and sends it themselves. No email integration. This is intentional — negotiation emails are personal and require the user's judgment.

### Danish Consumer Rights as Leverage
The skill encodes actionable Danish consumer law (fortrydelsesret, bindingsperiode limits, prisforhojelse cancellation rights). These aren't just informational — the email template uses them as negotiation leverage when applicable.

### Competitor Research via WebSearch
The command uses WebSearch to find current competitor prices. Falls back to skill-embedded pricing benchmarks if search fails. This keeps drafts relevant even without internet access.

### Contact Info Cascade
Finding the right email address: invoice-knowledge parser files first (they have vendor-specific patterns), then subscription files, then WebSearch as fallback. This leverages existing plugin knowledge before going external.

### Savings Estimation
Estimated savings logged to action-log.csv are based on the discount requested in the email, annualized. These are estimates, not confirmed outcomes. Outcome tracking is a future Phase 4 feature.

## Context

- Builds on existing subscription detection, spending analysis, and invoice parsing infrastructure
- Subscription files in `subscriptions/` already contain retention tactic knowledge for cancellation — negotiation reuses this but with different intent (retain at lower price vs. cancel)
- The `cancel.md` command is the closest existing pattern — similar service lookup, user action points, and action logging
- Danish consumer protection law provides meaningful negotiation leverage that most consumers don't know about
