---
description: Get personalized financial advice based on your spending data and the Danish personal finance framework
---

# /smartspender:advice

## Trigger
- `/smartspender:advice`
- "Hvad bør jeg fokusere på?"
- "Giv mig finansiel rådgivning"
- "Hvor er jeg i min privatøkonomi?"
- "What should I prioritize?"

## Arguments

None.

## Prerequisites
- Transactions synced and analyzed (categorized.csv has data)
- At least 1 month of transaction history for meaningful advice

## Workflow

0. Load user memory skill and read stored learnings:
   - Load `skills/user-memory/SKILL.md` for learning detection
   - Read `learnings/preferences.md` for previously stored user information
   - Note which questions can be skipped (emergency_fund, pension, debt, employer, etc.)

1. Read data from CSV files:
   - **categorized.csv**: Spending by category
   - **subscriptions.csv**: Active subscriptions
   - **monthly-summary.csv**: Monthly totals and trends
   - **action-log.csv**: Previous actions taken
   - **payslips.csv**: Payslip data (if exists) for accurate income and pension info

1b. If payslips.csv exists and has data:
   - Load most recent payslip for the current/previous month
   - Extract: gross_salary, net_salary, pension_total, pension_pct
   - Set `has_payslip_data = true`
   - Use gross_salary for income-based calculations instead of transaction-derived income

2. Calculate key metrics:
   - **Monthly income**:
     - If has_payslip_data: Use gross_salary from payslip
     - Otherwise: Sum of Indkomst category (net deposits)
   - **Monthly expenses**: Sum of all spending categories
   - **Net cash flow**: Income minus expenses
   - **Savings rate**:
     - If has_payslip_data: (gross_salary - expenses) / gross_salary (true savings rate)
     - Otherwise: Net cash flow / Income (approximate)
   - **Subscription burden**: Total subscriptions / Income (as percentage)
   - **Essential vs discretionary split**: (Bolig + Dagligvarer + Transport) vs rest

3. Assess position in the 5-step framework using `skills/danish-finance-guide/SKILL.md`:

   **Step 0: Budget** — Always ✅ (user is tracking spending via SmartSpender)

   **Step 1: Nødopsparing** — Cannot determine from transaction data alone.
   - First check `learnings/preferences.md` for existing emergency_fund entry
   - If found: Use stored value, skip question
   - If not found: Ask user: "Har du en nødopsparing på mindst 10.000 kr eller 1 måneds udgifter?"

   **Step 2: Gæld** — Look for indicators:
   - First check `learnings/preferences.md` for existing debt entry
   - If found: Use stored debt information
   - If not found: Look for indicators in transactions:
     - PBS payments to known lenders (check categorization)
     - High interest payments visible in transactions
   - Cannot fully determine without user input

   **Step 3: Pension** — Assess pension status:
   - If has_payslip_data: Use pension_pct from payslip (accurate)
     - If pension_pct >= 15%: ✅ "Du indbetaler {pension_pct}% til pension"
     - If pension_pct < 15%: ⚠️ Flag pension gap
   - If no payslip data:
     - First check `learnings/preferences.md` for existing pension entry
     - If found: Use stored pension percentage
     - If not found: Look for indicators in transactions:
       - Pension contributions in transactions (PBS to pension companies)
       - Calculate if visible contributions approach 15% of income
       - Ask: "Indbetaler du minimum 15% af din bruttoløn til pension? Upload en lønseddel med `/smartspender:payslip upload` for at få et præcist tal."

   **Step 4: Formue** — Reached if steps 0-3 are complete

4. Generate spending health assessment:

   | Metric | Status | Threshold |
   |--------|--------|-----------|
   | Savings rate | 🟢 Good / 🟡 OK / 🔴 Low | >20% / 10-20% / <10% |
   | Subscription burden | 🟢 / 🟡 / 🔴 | <5% / 5-10% / >10% of income |
   | Discretionary spending | 🟢 / 🟡 / 🔴 | <30% / 30-50% / >50% of expenses |
   | Month-over-month trend | 🟢 / 🟡 / 🔴 | Decreasing / Stable / Increasing |

5. Generate prioritized recommendations based on:
   - Current step in framework
   - Spending patterns and anomalies
   - Subscription optimization opportunities
   - Category-specific insights
   - Pension gap (if has_payslip_data and pension_pct < 15%):
     - Calculate cost to increase: extra_pension = gross_salary * (0.15 - pension_pct/100)
     - After-tax cost: extra_pension * (1 - marginal_tax_rate) where marginal_tax_rate ≈ 0.42
     - Add recommendation: "Øg pensionen til 15%"
   - Salary stagnation (if multiple payslips and < 2% growth over 12+ months):
     - Add recommendation: "Overvej lønforhandling"

6. Reference `skills/danish-finance-guide/SKILL.md` for:
   - Specific advice text
   - Thresholds and targets
   - Investment guidance (if user is at Step 4)

7. Append to action-log.csv:
   - `action_type`: advice
   - `target`: all
   - `status`: completed

## Output

```
## Din økonomiske status

### Nøgletal for {current_month}
| Metric | Værdi | Status |
|--------|-------|--------|
| Indkomst | {income} kr | — |
| Udgifter | {expenses} kr | — |
| Netto cashflow | {net} kr | {status_emoji} |
| Opsparingsrate | {rate}% | {status_emoji} |
| Abonnementsbyrde | {sub_pct}% | {status_emoji} |

### Hvor du er i rutediagrammet

{step_0_emoji} **Step 0: Budget** — Du tracker dit forbrug ✓
{step_1_emoji} **Step 1: Nødopsparing** — {step_1_status}
{step_2_emoji} **Step 2: Gældsafbetaling** — {step_2_status}
{step_3_emoji} **Step 3: Pension** — {step_3_status}
{step_4_emoji} **Step 4: Formue** — {step_4_status}

### Anbefalede næste skridt

**Prioritet 1: {priority_1_title}**
{priority_1_description}

**Prioritet 2: {priority_2_title}**
{priority_2_description}

**Prioritet 3: {priority_3_title}**
{priority_3_description}

### Baseret på dit forbrug

{category_insights}

{IF has_payslip_data}
### Indkomstfordeling (fra lønseddel)

| Post | Beløb | % af bruttoløn |
|------|-------|----------------|
| Bruttoløn | {gross_salary} kr | 100% |
| AM-bidrag | {am_bidrag} kr | {am_pct}% |
| A-skat | {a_skat} kr | {skat_pct}% |
| Pension (samlet) | {pension_total} kr | {pension_pct}% |
| Til rådighed | {net_salary} kr | {net_pct}% |

{IF pension_pct < 15}
⚠️ **Pensionsgab**: Du indbetaler {pension_pct}% — anbefalet er minimum 15%.
En øgning til 15% vil koste dig ca. {extra_cost_after_tax} kr/måned efter skat.
{/IF}
{/IF}

{IF multiple_payslips}
### Lønudvikling

Baseret på {payslip_count} lønsedler fra {first_period} til {last_period}:
- Bruttoløn ændring: {salary_change_pct}%
- Gennemsnitlig pension: {avg_pension_pct}%

{IF salary_stagnation}
📉 Din løn har ikke ændret sig væsentligt i {months} måneder. Overvej om det er tid til lønforhandling.
{/IF}
{/IF}

---
*Baseret på privatøkonomisk rutediagram for Danmark. Dette er generel vejledning — overvej at søge professionel rådgivning for din specifikke situation.*
```

## Example Output

```
## Din økonomiske status

### Nøgletal for januar 2026
| Metric | Værdi | Status |
|--------|-------|--------|
| Indkomst | 35.000 kr | — |
| Udgifter | 28.500 kr | — |
| Netto cashflow | 6.500 kr | 🟢 |
| Opsparingsrate | 18,6% | 🟡 |
| Abonnementsbyrde | 8,1% | 🟡 |

### Hvor du er i rutediagrammet

✅ **Step 0: Budget** — Du tracker dit forbrug
❓ **Step 1: Nødopsparing** — Har du 10.000 kr eller 1 måneds udgifter på en opsparingskonto?
⏳ **Step 2: Gældsafbetaling** — Ingen synlige høj-rente lån
❓ **Step 3: Pension** — Indbetaler du 15% til pension? (kan ikke ses i data)
⬜ **Step 4: Formue** — Afventer step 1-3

### Anbefalede næste skridt

**Prioritet 1: Bekræft din nødopsparing**
Sørg for at have mindst 10.000 kr (eller 28.500 kr = 1 måneds udgifter) på en opsparingskonto dækket af Indskydergarantifonden. Dette beskytter dig mod uventede udgifter.

**Prioritet 2: Reducer abonnementer**
Du bruger 2.847 kr/måned på abonnementer (8,1% af indkomst). Overvej:
- Streaming: 4 tjenester (Netflix, Viaplay, Disney+, HBO) — behøver du alle?
- Fitness: 349 kr/måned — bruger du det aktivt?
Potentiel besparelse: 1.000-1.500 kr/måned

**Prioritet 3: Øg opsparingsraten til 20%+**
Med 18,6% er du tæt på målet. Find 500 kr/måned ekstra ved at:
- Reducere restaurantbesøg (2.100 kr denne måned)
- Vælge billigere dagligvarer (tilbudsaviser, madplan)

### Baseret på dit forbrug

- **Bolig** (12.000 kr / 42%): Normal for Danmark
- **Dagligvarer** (4.230 kr / 15%): Inden for gennemsnit
- **Restauranter** (2.100 kr / 7%): Over gennemsnit — potentiale for besparelse
- **Abonnementer** (2.847 kr / 10%): Højt — se `/smartspender:subscriptions`
- **Transport** (1.650 kr / 6%): Lavt — godt!

---
*Baseret på privatøkonomisk rutediagram for Danmark. Dette er generel vejledning — overvej at søge professionel rådgivning for din specifikke situation.*
```

## User Memory Integration

After each user response during the advice session:

1. Check if response matches any trigger pattern in `skills/user-memory/SKILL.md`
2. If learnable information detected:
   - Extract the structured data
   - Write to the appropriate learnings file
   - Confirm briefly: "Noteret: {summary}. Jeg husker det."
3. Continue with the advice flow

## Interactive Follow-up

After presenting the advice, be ready for follow-up questions:

| User says | Response using |
|-----------|----------------|
| "Fortæl mig mere om nødopsparing" | `skills/danish-finance-guide/SKILL.md` → Step 1 section |
| "Hvordan prioriterer jeg gæld?" | `skills/danish-finance-guide/SKILL.md` → Debt Avalanche vs Snowball |
| "Hvad med pension?" | `skills/danish-finance-guide/SKILL.md` → Step 3 + Investment Guide |
| "Jeg har 10.000 kr i nødopsparing" | Update assessment, move to Step 2 focus |
| "Jeg vil gerne FIRE" | `skills/danish-finance-guide/SKILL.md` → Investment Guide → FIRE section |
| "Hvad koster det at øge pensionen?" | Calculate from payslip data: extra_pension * (1 - 0.42) |
| "Upload en lønseddel" | Redirect to `/smartspender:payslip upload` |
| "Vis min lønhistorik" | Redirect to `/smartspender:payslip history` |

## Learning Integration

When user provides information about their situation, use `skills/user-memory/SKILL.md` to persist it.

**Entry format for learnings/preferences.md:**

```markdown
### 2026-01-15
**Category**: financial_situation
**Trigger**: "Jeg har 15.000 kr i nødopsparing"
**Rule**: emergency_fund = 15000 kr
**Source**: /smartspender:advice
```

This allows future advice sessions to skip questions already answered.

## Error Cases

| Error | Message |
|-------|---------|
| No transaction data | "Ingen transaktioner fundet. Kør `/smartspender:sync` og `/smartspender:analyze` først." |
| Less than 1 month of data | "For at give god rådgivning har jeg brug for mindst 1 måneds data. Fortsæt med at synkronisere, så vender vi tilbage til dette." |
| No income detected | "Jeg kan ikke se nogen indkomst i dine transaktioner. Er din løn på en anden konto? Fortæl mig din månedlige indkomst for bedre rådgivning." |

## Side Effects
- Writes to action-log.csv (advice session logged)
- May write to learnings/preferences.md (user-provided information)

## Related Commands
- `/smartspender:analyze` — Run before advice for fresh data
- `/smartspender:report` — Detailed monthly breakdown
- `/smartspender:subscriptions` — Deep dive on subscriptions
- `/smartspender:overview` — Quick spending summary
- `/smartspender:payslip upload` — Add payslip for accurate pension tracking
- `/smartspender:payslip history` — View salary and pension trends
