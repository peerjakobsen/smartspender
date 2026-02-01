# Phase 1 MVP — Shaping Notes

## Scope

Build the complete SmartSpender Cowork plugin with all Phase 1 functionality:
- Transaction sync from Nykredit (primary bank)
- Automatic categorization with Danish merchant knowledge
- Subscription detection and cancellation guidance
- Monthly spending analysis and reporting
- Google Sheets as the data layer via MCP

## Key Decisions

### Browser Automation: Claude in Chrome
Using Claude's native browser automation (Claude in Chrome extension) rather than Playwright MCP. This is the standard Cowork plugin pattern — Claude directly controls the browser through JavaScript execution.

### Skill Format: Subdirectory with SKILL.md
Skills use a subdirectory structure (`skills/categorization/SKILL.md`) rather than flat files (`skills/categorization.md`). This allows skills to grow with supporting files later without restructuring.

### Subscription Scope: All 21 Services
Implementing all 21 subscription services from the product spec in Phase 1:
- Streaming (7): Netflix, HBO Max, Disney+, Viaplay, TV2 Play, Spotify, YouTube Premium
- Fitness (3): Fitness World, Fitness DK, SATS
- Telecom (3): TDC, Telenor, Telia
- News (3): Politiken, Berlingske, Zetland
- Software (3): Adobe CC, Microsoft 365, iCloud
- Delivery (2): Wolt+, Nemlig

### No Visuals
Plugin files are markdown and JSON only. No images, diagrams, or visual assets needed.

## Context

- SmartSpender targets Danish bank customers using Claude Cowork
- All data lives in user's Google Sheets via MCP connector
- Bank sync requires live MitID login — cannot be fully automated
- Human-in-the-loop pattern: Claude navigates, user authenticates, Claude continues
- Plugin files are instructions, not code — debugging means fixing markdown clarity

## What's Out of Scope (Phase 1)

- Additional banks beyond Nykredit (Danske Bank, Nordea, etc.)
- Budget tracking and goal setting
- Multi-currency handling
- Investment/depot account tracking
- Tax preparation features
- Organization-wide plugin sharing
- Receipt matching
