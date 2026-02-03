---
name: transaction-matching
description: Rules for linking uploaded receipts to bank transactions. Reference this when matching a receipt to an existing transaction.
---

# Transaction Matching

## Purpose

Provides rules for linking an uploaded receipt to an existing bank transaction in transactions.csv. Uses amount, date, and merchant name as matching signals with confidence scoring.

## Matching Signals

Three signals determine whether a receipt matches a transaction:

| Signal | Weight | Rule |
|--------|--------|------|
| Amount | Primary | Receipt total (positive) must match transaction amount (negative) within +-1% |
| Date | Primary | Receipt date must be within +-1 day of transaction date |
| Merchant | Secondary | Normalized merchant name should match (boosts confidence but not required) |

Both amount and date must match for a candidate. Merchant match increases confidence but a missing merchant match does not disqualify.

## Amount Comparison

Receipts store totals as positive numbers. Transactions store expenses as negative numbers. When comparing:

1. Take the absolute value of the transaction amount
2. Compare with the receipt total
3. Allow +-1% tolerance

**Formula**: `|receipt_total - |transaction_amount|| / receipt_total <= 0.01`

**Why +-1%**: Small rounding differences between what the store charges and what the bank posts (e.g., currency conversion micro-adjustments, tip rounding).

### Examples

| Receipt Total | Transaction Amount | Difference | Match? |
|---------------|-------------------|------------|--------|
| 347.50 | -347.50 | 0.00% | Yes |
| 347.50 | -348.00 | 0.14% | Yes |
| 347.50 | -344.00 | 1.01% | No |
| 299.00 | -299.00 | 0.00% | Yes |

## Date Window

Card transactions often post 1 business day after the purchase. Allow a +-1 day window:

- Receipt date: 2026-01-28
- Valid transaction dates: 2026-01-27, 2026-01-28, 2026-01-29

**Why +-1 day**: Dankort and Visa purchases at end of day may post the next morning. Some merchants batch transactions overnight.

## Merchant Name Matching

Compare the receipt's normalized merchant name against the transaction's description using the same normalization rules from `skills/categorization/SKILL.md`:

1. Uppercase both strings
2. Check if the receipt merchant appears anywhere in the transaction description
3. Account for common abbreviations (Foetex = FOETEX, Netto = NETTO)

Merchant match is a confidence booster, not a hard requirement. Some transactions have generic descriptions that don't include the merchant name (e.g., "Dankort-koeb" without store name).

## Confidence Scoring

| Scenario | Confidence | Action |
|----------|------------|--------|
| 1 match: amount + date + merchant | 1.0 | Auto-link |
| 1 match: amount + date (no merchant) | 0.9 | Auto-link |
| 2-3 matches: amount + date | 0.7 | Present candidates to user |
| 4+ matches: amount + date | 0.5 | Present candidates to user |
| Amount matches but date outside window | 0.3 | Present as weak candidate |
| No amount match | 0.0 | Unmatched |

## Matching Workflow

Execute these steps in order:

### Step 1: Search Candidates

Read transactions.csv and filter for transactions where:
- `|transaction_amount|` is within +-1% of receipt total
- `date` is within +-1 day of receipt date
- Transaction is an expense (amount < 0)

### Step 2: Score Candidates

For each candidate, calculate confidence:
1. Start with 0.8 (amount + date match)
2. Add 0.1 if merchant name matches
3. Add 0.1 if date is exact (same day, not +-1)

Cap at 1.0.

### Step 3: Decide

| Candidates | Best Confidence | Action |
|------------|-----------------|--------|
| 0 | — | Store as `unmatched` |
| 1 | >= 0.8 | Auto-link, set `match_status: matched` |
| 1 | < 0.8 | Present to user for confirmation |
| 2+ | any | Present all candidates to user |

### Step 4: Present Candidates (if needed)

Show the user a numbered list:

```
Jeg fandt {n} mulige transaktioner til denne kvittering:

1. {date} — {description} — {amount} kr (match: {confidence_pct}%)
2. {date} — {description} — {amount} kr (match: {confidence_pct}%)

Hvilken transaktion hoerer kvitteringen til? (Eller "ingen" hvis ingen passer)
```

### Step 5: Link or Store Unmatched

- **User picks a candidate**: Set `transaction_id` to the selected tx_id, `match_status: matched`, `match_confidence` to the calculated confidence
- **User says "ingen"**: Set `transaction_id` to empty, `match_status: unmatched`, `match_confidence: 0.0`
- **Auto-linked**: Set `transaction_id`, `match_status: matched`, `match_confidence` from step 2

## Already-Matched Transactions

Before matching, check if the candidate transaction already has a receipt linked:
1. Read receipts.csv
2. Check if any row has the candidate's tx_id as `transaction_id`
3. If yes, warn: "Denne transaktion ({date}, {amount} kr) har allerede en kvittering ({receipt_id}). Vil du tilfoeje endnu en?"

A transaction can have multiple receipts (e.g., split payments across stores for the same total), but this should be a deliberate user choice.

## Examples

### Example 1: Auto-Match (Single Clear Match)

**Receipt**: Foetex, 2026-01-28, 347.50 kr

**Transactions search** (date 2026-01-27 to 2026-01-29, amount 344.03 to 351.00):
```
tx-uuid-001  2026-01-28  -347.50  "Dankort-køb FØTEX ØSTERBRO"
```

**Result**: 1 candidate, confidence 1.0 (amount exact + date exact + merchant match "FOETEX")
**Action**: Auto-link. `match_status: matched`, `match_confidence: 1.0`

### Example 2: Ambiguous (Multiple Candidates)

**Receipt**: Netto, 2026-01-20, 189.50 kr

**Transactions search**:
```
tx-uuid-010  2026-01-20  -189.50  "Dankort-køb NETTO 1234"
tx-uuid-011  2026-01-19  -190.00  "Dankort-køb NETTO 5678"
```

**Candidate 1**: confidence 1.0 (exact amount + exact date + merchant)
**Candidate 2**: confidence 0.8 (amount within 0.26% + date -1 day + merchant)

**Action**: Present both to user:
```
Jeg fandt 2 mulige transaktioner til denne kvittering:

1. 20. jan — Dankort-køb NETTO 1234 — 189,50 kr (match: 100%)
2. 19. jan — Dankort-køb NETTO 5678 — 190,00 kr (match: 80%)

Hvilken transaktion hører kvitteringen til? (Eller "ingen" hvis ingen passer)
```

### Example 3: No Match

**Receipt**: Restaurant Cofoco, 2026-01-25, 1.250.00 kr

**Transactions search** (date 2026-01-24 to 2026-01-26, amount 1237.50 to 1262.50):
No transactions found.

**Action**: Store as unmatched. `match_status: unmatched`, `match_confidence: 0.0`

Output: "Ingen matchende transaktion fundet. Kvitteringen er gemt som ikke-matchet. Du kan matche den manuelt senere."

## Edge Cases

### Weekend/Holiday Posting Delays
Some transactions post with a 2-3 day delay over weekends. The +-1 day window handles most cases. If a user reports a missing match, suggest they check if the transaction has posted yet.

### Split Payments
If a user paid with two methods (e.g., partly MobilePay, partly Dankort), the receipt total won't match either transaction. The receipt will be stored as unmatched. The user can manually link it later.

### Foreign Currency
If the receipt is in a foreign currency, the amount comparison should use the DKK amount from the bank transaction, not the foreign currency amount on the receipt. This means auto-matching is less reliable for foreign receipts — flag with lower confidence (0.5-0.7 even for good matches).

---

## Payslip-to-Transaction Matching

### Purpose

Links uploaded payslips to salary deposit transactions in transactions.csv. Uses net_salary amount, deposit timing, and description patterns.

### Matching Signals

| Signal | Weight | Rule |
|--------|--------|------|
| Amount | Primary | Net salary must match transaction amount within ±1% |
| Date | Primary | Transaction date must be within 5 days after pay_period end |
| Type | Required | Transaction must be CRDT (credit/income) |
| Description | Secondary | Should contain "Løn", "Salary", or employer name |

### Date Window

Salary is typically deposited at the end of the pay period or within the first few days of the next month:

- Pay period: 2026-01 (January)
- Valid transaction dates: 2026-01-25 to 2026-02-05

**Why this window**: Most Danish employers pay on the last working day of the month, but some pay on a fixed date (e.g., 25th) or in the first days of the following month.

### Amount Comparison

Payslips store net_salary as a positive number. Salary transactions are positive (CRDT).

**Formula**: `|payslip_net - transaction_amount| / payslip_net <= 0.01`

**Why ±1%**: Minor differences can occur from rounding or small adjustments not shown on the payslip.

### Description Patterns

Look for these patterns in transaction descriptions:

| Pattern | Example | Confidence Boost |
|---------|---------|------------------|
| "Løn" | "Løn januar", "LOEN FRA..." | +0.1 |
| "Salary" | "Salary payment" | +0.1 |
| Employer name | "Teknologi A/S", "TEKNOLOGI" | +0.15 |
| Period reference | "Jan 2026", "202601" | +0.05 |

### Confidence Scoring

| Scenario | Confidence | Action |
|----------|------------|--------|
| 1 match: amount + date + description patterns | 1.0 | Auto-link |
| 1 match: amount + date (no description match) | 0.85 | Auto-link |
| 2-3 matches: amount + date | 0.7 | Present candidates to user |
| Amount matches but date outside window | 0.4 | Present as weak candidate |
| No amount match | 0.0 | Unmatched |

### Matching Workflow

#### Step 1: Determine Search Window

Calculate the expected transaction date range:
- Start: 5 days before pay_period end (e.g., Jan 25 for January payslip)
- End: 5 days after pay_period end (e.g., Feb 5 for January payslip)

#### Step 2: Search Candidates

Read transactions.csv and filter for transactions where:
- `amount` is positive (income)
- `|amount - net_salary| / net_salary <= 0.01`
- `date` is within the calculated window

#### Step 3: Score Candidates

For each candidate, calculate confidence:
1. Start with 0.8 (amount + date match)
2. Add 0.1 if "Løn" or "Salary" in description
3. Add 0.05 if employer name appears in description
4. Add 0.05 if date is last working day of month

Cap at 1.0.

#### Step 4: Decide

| Candidates | Best Confidence | Action |
|------------|-----------------|--------|
| 0 | — | Store as `unmatched` |
| 1 | >= 0.8 | Auto-link |
| 1 | < 0.8 | Present to user for confirmation |
| 2+ | any | Present all candidates to user |

### Already-Matched Transactions

Before matching, check if the candidate transaction already has a payslip linked:
1. Read payslips.csv
2. Check if any row has the candidate's tx_id as `transaction_id`
3. If yes, warn: "Denne transaktion ({date}, {amount} kr) har allerede en lønseddel ({payslip_id}). Vil du tilføje endnu en?"

A transaction should typically have only one payslip, but users may have corrections or supplementary payments.

### Examples

#### Example 1: Clear Salary Match

**Payslip**: Teknologi A/S, January 2026, net_salary: 25,245.35 kr

**Transactions search** (Jan 25 - Feb 5, amount 24,993 - 25,498):
```
tx-uuid-045  2026-01-31  25245.35  "Løn Teknologi A/S januar"
```

**Result**: 1 candidate, confidence 1.0 (amount exact + date in window + "Løn" + employer name)
**Action**: Auto-link

#### Example 2: Multiple Salary Candidates

**Payslip**: Startup ApS, January 2026, net_salary: 28,500.00 kr

**Transactions search**:
```
tx-uuid-050  2026-01-31  28500.00  "LOEN"
tx-uuid-051  2026-02-01  28500.00  "Overførsel"
```

**Candidate 1**: confidence 0.9 (amount exact + last day of month + "LOEN")
**Candidate 2**: confidence 0.8 (amount exact + date in window, no description match)

**Action**: Present both to user

---

## Related Skills

- See `skills/data-schemas/SKILL.md` for the receipts.csv, payslips.csv, and complete data file structure
- See `skills/document-parsing/SKILL.md` for how receipt data is extracted
- See `skills/payslip-parsing/SKILL.md` for how payslip data is extracted
- See `skills/categorization/SKILL.md` for merchant name normalization rules
