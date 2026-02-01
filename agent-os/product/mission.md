# Product Mission

## Problem

Most people don't know what they actually spend money on. Bank statements are fragmented, hard to read, and spread across multiple accounts. Subscriptions accumulate silently, forgotten trials convert to paid plans, and there's no easy way to get a clear picture of where money goes -- or to take action on it.

## Target Users

Danish residents with Danish bank accounts who:
- Use online banking (netbank)
- Have multiple subscriptions (streaming, fitness, apps, etc.)
- Want better control over spending but don't have time for manual tracking
- Are comfortable with AI assistance and human-in-the-loop workflows
- Have Claude Pro/Max/Team/Enterprise subscriptions with Cowork access

## Solution

SmartSpender is a Claude Cowork plugin that transforms fragmented bank data into actionable financial insights. It answers "Where does my money go?" and then helps do something about it.

Key differentiators:
- **Runs inside Claude Desktop** -- no separate app, no infrastructure to maintain
- **Browser automation** handles bank navigation and subscription cancellation via Claude in Chrome
- **Human-in-the-loop model** -- the user handles authentication (MitID/bank login), the agent handles everything else
- **File-based architecture** -- all components are markdown and JSON files, no code or servers
- **Google Sheets as database** -- data lives in the user's own Google account
- **Danish-first** -- built specifically for Danish banks, merchants, and subscription services
