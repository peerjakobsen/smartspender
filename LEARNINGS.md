# Learnings from Building a Claude Cowork Plugin

What I learned building SmartSpender -- a personal finance plugin for Danish bank customers -- as one of the first third-party Cowork plugins.

## The Big Picture

Cowork plugins launched on January 30, 2026. I started building SmartSpender the same day. The plugin architecture is file-based: markdown files for skills and commands, JSON for the manifest. No code, no servers, no infrastructure. You're writing instructions for an AI, not programming a computer.

That sounds simple. It is not.

---

## 1. Google Sheets MCP Doesn't Exist (Yet)

**The plan**: Store all transaction data in Google Sheets via an MCP server. The user's data lives in their own Google account. Clean separation of concerns.

**The reality**: There is no official Google Sheets MCP server. There is no official Google Drive MCP server. The community `mcp-google-sheets` package exists but is unreliable in Cowork's sandboxed environment. Setting up service accounts, OAuth tokens, and environment variables for a non-technical user is a non-starter.

**The pivot**: Local CSV files in the working directory. `transactions.csv`, `categorized.csv`, `subscriptions.csv`, etc. It works. It's simple. But it means the data is tied to the machine and can't be shared across devices. Not ideal for a personal finance tool.

**Takeaway**: Don't assume MCP servers exist just because the protocol supports a use case. Check what's actually available and working before designing your data architecture around it.

## 2. Browser Automation via Claude in Chrome is Painfully Slow

Claude in Chrome can navigate websites, fill forms, click buttons, and read page content. It works. But every single interaction takes seconds -- sometimes 5-10 seconds per step. A multi-step bank export flow that a human could click through in 30 seconds takes Claude 3-5 minutes.

This is compounded by:
- **Iframes**: Nykredit renders its export form inside an iframe. Claude needs to discover this, access the iframe document, and interact with elements through it. Each discovery step adds latency.
- **Page state detection**: Claude has to visually confirm what state the page is in before acting. "Is the form loaded?" "Did the dropdown update?" "Am I on step 2 or step 3?" Each confirmation is a round trip.
- **JavaScript execution**: Running JavaScript in the page context works but has its own latency on top of the visual confirmation.

**Takeaway**: Design workflows to minimize browser interactions. We created a pre-configured "smartspender" export preset in the bank, reducing ~20 manual interactions to ~5. Every eliminated step saves real time. If you can get the user to download a CSV manually and drop it in a folder, that might honestly be faster than browser automation.

## 3. You're Debugging Instructions, Not Code

This was the biggest mental shift. When Claude does the wrong thing, the fix isn't a code change -- it's clearer markdown. If the categorization is wrong, you don't fix a function. You rewrite the skill instructions to be more precise.

This means:
- **Ambiguity is your enemy.** Claude interprets instructions literally, but not always the way you intended. "Check the pattern database" could mean check the file, check the in-memory data, or check by doing a string comparison. You have to be explicit.
- **Test feedback loops are long.** You write a markdown change, commit, load the plugin in Cowork, run the command, and see what happens. There's no unit test. No linter. No type checker. Just "did Claude do the right thing?"
- **The development workflow is: Author, Commit, Test in Cowork, Log what broke, Fix the instructions, Repeat.**

**Takeaway**: Treat your skill and command files like API documentation that an unpredictable junior developer will follow literally. Be precise about order of operations, edge cases, and what "done" looks like.

## 4. Claude Doesn't Learn Between Sessions

Each Cowork session starts fresh. If a user corrects a transaction category in January ("No, NORMAL FREDERIK is Shopping, not Andet"), that correction lives only as a `manual_override: TRUE` flag in the CSV. When February's transactions come in, Claude sees a new "NORMAL FREDERIK" and categorizes it wrong again.

We had to build an explicit learning mechanism: `merchant-overrides.csv`. The analyze command now scans for manual corrections, extracts them as reusable rules, and checks that file before the static pattern database on future runs.

**Takeaway**: Any "learning" you want Claude to retain across sessions must be persisted in files. The plugin doesn't remember anything. You have to design the feedback loop explicitly -- and write instructions for Claude to follow it.

## 5. MitID (National ID) Creates an Unautomatable Gap

Danish bank authentication requires MitID -- a national digital identity system with biometric verification on a separate device. This can never be automated. Period. Every sync requires a human sitting there, approving on their phone, and telling Claude "I'm logged in."

This isn't just a Danish problem. Any plugin that interacts with services requiring 2FA, SSO, or biometric auth will hit this wall. The human-in-the-loop pattern works but makes the plugin less "set it and forget it" than you'd want.

**Takeaway**: Design your plugin commands to do maximum work before and after the authentication boundary. One human handoff per workflow, not two or three. And clearly communicate what the user needs to do -- vague prompts lead to confused users and failed workflows.

## 6. The Plugin Ecosystem is Empty (and That's an Opportunity)

Anthropic published 11 reference plugins (productivity, sales, customer-support, etc.) but the third-party ecosystem barely exists. Documentation is sparse. There are no forums, no Stack Overflow answers, no "how I built my first plugin" blog posts. You're figuring it out by reading the reference plugins and experimenting.

What this means practically:
- **No shared conventions** for how to structure complex plugins. I built my own standards (via Agent OS) but every plugin builder is making different choices.
- **No marketplace** yet. You share plugins as zip files. Organization-wide sharing is "coming soon."
- **Edge cases are undocumented.** How does Cowork handle a skill file that's 500 lines long? What happens when two skills have conflicting instructions? How are commands prioritized when multiple plugins are installed? You learn by hitting the walls.

**Takeaway**: If you're building a plugin now, you're among the first. Document everything. Share what you learn. The patterns established in these early days will shape the ecosystem.

## 7. Skills vs Commands: The Line is Blurrier Than You Think

Commands are user-invoked (`/smartspender:analyze`). Skills are auto-activated when relevant. In theory, clean separation. In practice:

- Skills need to reference each other. The categorization skill needs to reference the sheets-schema skill. But there's no import/require mechanism -- you just mention the file path and hope Claude reads it.
- Commands need to orchestrate multiple skills. The analyze command uses categorization, subscription-detection, and sheets-schema. The instruction "apply categorization using `skills/categorization/SKILL.md`" works, but it's a reference, not a guarantee.
- Skill files can get large fast. The categorization skill has a merchant pattern database with 60+ entries. As it grows, it might hit context limits or become too diluted for Claude to follow precisely.

**Takeaway**: Keep skills focused on one concept. Use explicit file path references. And test that Claude actually reads the referenced file when you expect it to.

## 8. Danish Language Adds a Layer of Complexity

Building for a Danish market means:
- **Categories in Danish** (Dagligvarer, Abonnementer, Bolig) with English internal documentation
- **Merchant patterns with special characters** (Ø, Æ, Å) that need normalization for matching but preservation in raw data
- **Bank interfaces in Danish** where button labels, form fields, and error messages are all in Danish
- **Claude's Danish is good but not perfect.** It occasionally mixes Danish and English in output, or uses slightly unnatural phrasing. The fix: explicit output templates in the command files.

**Takeaway**: If building a non-English plugin, include explicit output templates with the exact wording you want. Don't let Claude freestyle in a second language.

## 9. CSV as a Database Has Limits You'll Hit Fast

Local CSV works for a single user with a few hundred transactions. But:
- **No UPDATE operation.** You can append rows and overwrite the file. "Update row where tx_id = X" means reading the entire file, finding the row, modifying it, and writing everything back. The instructions for this are awkward.
- **No concurrent access.** If two commands somehow run simultaneously (they don't today, but might in the future), you'll get data corruption.
- **No querying.** "Show me all transactions from Netto in the last 3 months" means Claude reads the entire CSV and filters in-context. For 1,000 transactions, fine. For 10,000, you're burning context window.

**Takeaway**: CSV is a pragmatic MVP choice. If the plugin grows, you'll want SQLite (via an MCP server) or a real database. But for a first plugin, the simplicity is worth the tradeoffs.

## 10. The Zip File Distribution Model is Primitive but Works

Plugins are distributed as zip files. Unzip into the right directory and they load. No versioning, no dependency management, no update mechanism. If you push a fix, users have to manually download the new zip.

But honestly? For an ecosystem this young, it's fine. Complex distribution would slow down iteration. Just make sure your plugin is self-contained and doesn't leave orphaned files when replaced.

**Takeaway**: Keep your plugin structure clean. One zip, flat structure, no external dependencies. Updates are full replacements.

---

## Summary: What I Wish I'd Known on Day One

1. **Check MCP server availability before designing your data layer.** Google Sheets MCP doesn't exist. That one assumption cost a full architecture pivot.
2. **Browser automation is a last resort, not a first choice.** It's slow and brittle. Minimize interactions.
3. **Everything is instructions.** Your debugging tool is clearer writing, not better code.
4. **Claude has no memory.** Build explicit persistence for anything you want retained across sessions.
5. **The ecosystem is nascent.** You will be the documentation. Write it down.
6. **Start with one vertical slice.** Get sync working end-to-end before building analyze. Get analyze working before overview. Each command reveals assumptions the next one depends on.

---

*Built with Claude Code + Agent OS. Tested in Claude Cowork. Shared because someone has to go first.*
