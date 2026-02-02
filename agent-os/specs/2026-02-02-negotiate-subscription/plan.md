# Phase 4a: Subscription Negotiation — Implementation Plan

## Summary

Add `/smartspender:negotiate [service]` command + `skills/negotiation/SKILL.md` knowledge file. Helps users draft negotiation emails (in Danish) to get better prices on recurring subscriptions. Starts a new Phase 4: Cost Optimization in the roadmap. Plugin version bump to 1.5.0.

**New files**: 1 command, 1 skill, spec docs
**Updated files**: roadmap, plugin manifest, .gitignore

## Tasks

### Task 1: Save spec documentation
Create `agent-os/specs/2026-02-02-negotiate-subscription/` with shape.md, plan.md, standards.md, references.md.

### Task 2: Create negotiation skill
`skills/negotiation/SKILL.md` — Danish consumer rights, negotiation tactics, email template structure, pricing benchmarks, contact info extraction, examples.

### Task 3: Create negotiate command (depends on Task 2)
`commands/negotiate.md` — Full workflow: subscription lookup, cost analysis, contact info, competitor research, tactic selection, draft email, save, log.

### Task 4: Update roadmap (parallel with Tasks 2-3)
`agent-os/product/roadmap.md` — Append Phase 4: Cost Optimization section.

### Task 5: Update plugin manifest and gitignore (after Tasks 2-4)
`.claude-plugin/plugin.json` — Bump version from 1.4.0 to 1.5.0.
`.gitignore` — Add `drafts/` entry.

## Dependency Order

```
Task 1 (spec docs)       ─┐
Task 2 (skill)           ─┼─ parallel
Task 4 (roadmap)         ─┘
Task 3 (command)         ─── after Task 2
Task 5 (manifest + git)  ─── after Tasks 2, 3, 4
```

## Verification

1. Command follows section order from command-format.md
2. Skill follows section order from skill-format.md
3. Email template produces valid Danish with correct currency formatting (1.847 kr)
4. All file paths referenced in command resolve to real files or are handled by error cases
5. Pricing benchmarks align with existing subscription files (TDC, Netflix, etc.)
6. `action_type: negotiate` is a new type — document in action-log entry
7. Package: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/ invoice-knowledge/`
8. Test in Cowork: `/smartspender:negotiate tdc` should produce Danish email with TDC cost data and Telenor/Telia as competitors
