# SmartSpender Simplification Spec

**Date:** 2026-02-03  
**Goal:** Reduce complexity for users by consolidating commands, removing redundant bank adapters, and streamlining the feature set.

---

## Summary of Changes

| Area | Before | After | Change |
|------|--------|-------|--------|
| Commands | 13 | 9 | -4 |
| Bank adapters | 2 | 1 | -1 |
| Skills | 13 | 9 | -4 |
| Sync methods | 2 (browser + API) | 1 (API only) | -1 |

---

## 1. Remove Nykredit Browser Automation

### Rationale
- Enable Banking API covers Nykredit (and 50+ other Danish banks)
- Browser automation is slow (30-60s vs <5s), brittle (breaks when UI changes), and requires MitID every sync
- API sessions last 90-180 days
- Maintaining two sync paths doubles complexity for zero user benefit

### Files to Delete
```
banks/nykredit/           # Entire folder
  ├── ADAPTER.md
  ├── BANK.md
  ├── export-format.md
  └── [any other files]
```

### Files to Update

#### `commands/sync.md`
- Remove "Branch A: Browser Sync" section entirely
- Remove `sync_method` branching logic — all syncs use Enable Banking API
- Remove browser-specific error cases (CSV download failed, preset not found, etc.)
- Simplify the workflow to only handle API sync
- Update the bank argument: remove `nykredit` as a standalone option, keep `enable-banking` and `all`

#### `commands/add-account.md`
- Remove "Branch A: Browser-Based Banks" section entirely
- Remove `sync_method` field from accounts.csv (always `enable-banking`)
- Simplify: all accounts are added via Enable Banking
- The `bank` argument now specifies which bank to connect via Enable Banking (nykredit, danske-bank, nordea, etc.)

#### `banks/_template.md`
- Update to reflect API-only architecture
- Remove browser automation sections

---

## 2. Merge Setup Enable Banking into Add Account

### Rationale
- Users shouldn't need a separate setup command
- First-time add-account should detect missing config and guide through setup
- Reduces command count and cognitive load

### Files to Delete
```
commands/setup-enable-banking.md
```

### Files to Update

#### `commands/add-account.md`
Restructure workflow:

```
1. Check if Enable Banking is configured (~/.config/smartspender/eb-config.json exists)
2. If NOT configured:
   a. Announce: "Enable Banking er ikke konfigureret endnu. Vi sætter det op først."
   b. Run the setup flow (currently in setup-enable-banking.md):
      - Create Enable Banking account
      - Create application
      - Download RSA key
      - Install Python dependencies
      - Save config
      - Test connection
3. If configured (or after setup):
   a. Ask which bank to connect
   b. Run auth flow if needed
   c. List accounts
   d. User selects accounts
   e. Save to accounts.csv
   f. Run initial sync
```

---

## 3. Merge Report into Overview

### Rationale
- Users don't know the difference between "overview" and "report"
- Both show spending by category with comparisons
- Single command with smart defaults is simpler

### Files to Delete
```
commands/report.md
```

### Files to Update

#### `commands/overview.md`
Add detailed mode:

**New behavior:**
- Default: Concise overview (current overview output)
- With `--detailed` flag or explicit request: Full report (current report output)
- Smart default: End of month (last 5 days) → show detailed automatically

**New triggers:**
```
- `/smartspender:overview [month]` — Concise
- `/smartspender:overview [month] --detailed` — Full report
- `/smartspender:report [month]` — Alias for overview --detailed (for backward compat)
- "Lav en rapport" → detailed mode
- "Vis overblik" → concise mode
```

**Merge these sections from report.md into overview.md:**
- Month-Over-Month Comparison (detailed mode only)
- Unusual Transactions section (detailed mode only)
- Subscription Changes section (detailed mode only)
- Actions Taken section (detailed mode only)
- Recommendations section (detailed mode only)

---

## 4. Consolidate Schema Skills

### Rationale
- Three separate schema files create fragmentation
- They're all just data structure definitions
- Single file is easier to maintain and reference

### Files to Delete
```
skills/transaction-schema/
skills/receipt-schema/
skills/sheets-schema/
```

### Files to Create
```
skills/data-schemas/SKILL.md
```

**Content:** Merge all three schema files into one:
- Section 1: Transaction Schema (from transaction-schema)
- Section 2: Receipt Schema (from receipt-schema)  
- Section 3: CSV File Schemas (from sheets-schema)

### Files to Update
Update all commands that reference the old skill paths:
- `commands/sync.md` — change `skills/transaction-schema/SKILL.md` → `skills/data-schemas/SKILL.md`
- `commands/receipt.md` — change `skills/receipt-schema/SKILL.md` → `skills/data-schemas/SKILL.md`
- `commands/analyze.md` — update any schema references

---

## 5. Consolidate Parsing Skills

### Rationale
- `receipt-parsing` and `invoice-parsing` have overlapping concerns
- Both deal with extracting structured data from documents
- Single skill with sections for different document types

### Files to Delete
```
skills/receipt-parsing/
skills/invoice-parsing/
```

### Files to Create
```
skills/document-parsing/SKILL.md
```

**Content:** Merge both skills:
- Section 1: General Extraction Rules
- Section 2: Grocery Receipts (from receipt-parsing)
- Section 3: PDF Invoices (from invoice-parsing)
- Section 4: Product Taxonomy (from receipt-parsing)
- Section 5: Vendor Detection (from invoice-parsing)

### Files to Update
- `commands/receipt.md` — update skill references
- `commands/receipt-email.md` — update skill references
- `commands/receipt-learn.md` — update skill references

---

## 6. Update Roadmap

### File to Update
`agent-os/product/roadmap.md`

**Changes:**

#### Phase 1: MVP
- Remove "Transaction Sync (Nykredit)" — replace with "Transaction Sync (Enable Banking)"
- Update description to reflect API-only sync
- Remove `/smartspender:sync [bank]` argument note — simplify to just `/smartspender:sync`

#### Phase 2: Post-Launch — Additional Banks
- Remove this section entirely (Enable Banking already covers all these banks)
- Or rename to "Additional Bank Features" with bank-specific enhancements

#### Phase 3e: Enable Banking Integration
- Move from Phase 3 to Phase 1 (it's now the foundation, not an addition)
- Or remove entirely since it's now the default

---

## 7. Update CLAUDE.md

### File to Update
`CLAUDE.md`

**Changes:**

Update Project Structure section:
```markdown
## Project Structure

- `agent-os/` -- Product spec, standards, and planning
- `.claude-plugin/` -- Plugin manifest (Cowork runtime)
- `commands/` -- Slash commands (user-invoked workflows)
- `skills/` -- Domain knowledge (auto-activated by Claude)
- `banks/` -- Bank adapter (Enable Banking API)
- `subscriptions/` -- Subscription service cancellation guides
- `invoice-knowledge/` -- Learned vendor-specific invoice parsers
- `tools/` -- Helper scripts (eb-api.py for Enable Banking API)
```

Remove mention of multiple bank adapters.

---

## 8. Update accounts.csv Schema

### File to Update
`skills/data-schemas/SKILL.md` (after consolidation)

**Remove columns:**
- `sync_method` — no longer needed (always enable-banking)

**Keep columns:**
- `account_id`
- `bank` — the specific bank (nykredit, danske-bank, etc.)
- `account_name`
- `account_type`
- `last_synced`
- `is_active`
- `eb_account_uid`
- `eb_session_id`

---

## Migration Checklist

### Phase 1: Delete Redundant Files
- [ ] Delete `banks/nykredit/` folder
- [ ] Delete `commands/setup-enable-banking.md`
- [ ] Delete `commands/report.md`
- [ ] Delete `skills/transaction-schema/` folder
- [ ] Delete `skills/receipt-schema/` folder
- [ ] Delete `skills/sheets-schema/` folder
- [ ] Delete `skills/receipt-parsing/` folder
- [ ] Delete `skills/invoice-parsing/` folder

### Phase 2: Create Consolidated Files
- [ ] Create `skills/data-schemas/SKILL.md` (merge 3 schema skills)
- [ ] Create `skills/document-parsing/SKILL.md` (merge 2 parsing skills)

### Phase 3: Update Existing Files
- [ ] Update `commands/add-account.md` (merge setup-enable-banking, remove browser path)
- [ ] Update `commands/sync.md` (remove browser path, simplify to API only)
- [ ] Update `commands/overview.md` (merge report functionality)
- [ ] Update `commands/receipt.md` (update skill references)
- [ ] Update `commands/receipt-email.md` (update skill references)
- [ ] Update `commands/receipt-learn.md` (update skill references)
- [ ] Update `commands/analyze.md` (update skill references)
- [ ] Update `agent-os/product/roadmap.md`
- [ ] Update `CLAUDE.md`
- [ ] Update `banks/_template.md`

### Phase 4: Verify
- [ ] Grep for old skill paths — ensure no broken references
- [ ] Grep for "nykredit" — ensure no orphaned references to browser sync
- [ ] Grep for "setup-enable-banking" — ensure no broken command references
- [ ] Test plugin packaging: `zip -r smartspender.zip .claude-plugin/ commands/ skills/ banks/ subscriptions/ invoice-knowledge/`

---

## Final Command Structure

After simplification:

| Command | Description |
|---------|-------------|
| `/smartspender:add-account [bank]` | Add bank account (includes first-time EB setup) |
| `/smartspender:sync` | Sync transactions via Enable Banking API |
| `/smartspender:analyze` | Categorize transactions, detect subscriptions |
| `/smartspender:overview [month]` | Spending summary (add --detailed for full report) |
| `/smartspender:subscriptions` | List all subscriptions |
| `/smartspender:cancel [service]` | Cancel a subscription |
| `/smartspender:negotiate [service]` | Draft negotiation email |
| `/smartspender:advice` | Personalized financial advice |
| `/smartspender:receipt upload` | Upload single receipt |
| `/smartspender:receipt email` | Scan Gmail for receipts |
| `/smartspender:receipt learn` | Save vendor extraction rules |

**Total: 9 commands** (down from 13)

---

## Final Skill Structure

After simplification:

| Skill | Description |
|-------|-------------|
| `categorization/` | Merchant patterns, category taxonomy |
| `danish-finance-guide/` | 5-step framework, thresholds |
| `data-schemas/` | Transaction, receipt, CSV schemas (consolidated) |
| `document-parsing/` | Receipt + invoice extraction (consolidated) |
| `email-receipt-scanning/` | Gmail search patterns |
| `enable-banking-api/` | API reference, field mappings |
| `negotiation/` | Tactics, email templates |
| `spending-analysis/` | Overview formatting, recommendations |
| `subscription-detection/` | Recurring payment detection rules |
| `transaction-matching/` | Receipt-to-transaction matching |

**Total: 10 skills** (down from 13)

---

## Notes for Implementation

1. **Preserve git history** — Commit before starting, so changes can be rolled back
2. **Test incrementally** — After each phase, verify the plugin still packages correctly
3. **Update in order** — Delete first, then create consolidated files, then update references
4. **Danish language** — All user-facing text should remain in Danish
5. **Backward compatibility** — Keep `/smartspender:report` as an alias for `overview --detailed`
