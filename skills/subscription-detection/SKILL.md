---
name: subscription-detection
description: Rules for detecting recurring charges and subscriptions from transaction history. Reference this when identifying services the user pays for regularly.
---

# Subscription Detection

## Purpose

Provides rules for detecting recurring charges (subscriptions) from categorized transaction data. Identifies services the user pays for on a regular basis.

## Detection Criteria

A series of transactions qualifies as a subscription when **all five** criteria are met:

| # | Criterion | Rule |
|---|-----------|------|
| 1 | Same merchant | Normalized merchant name matches across transactions |
| 2 | Regular frequency | Consistent interval between charges (monthly, yearly, weekly) |
| 3 | Amount tolerance | Amounts within ±5% of each other |
| 4 | Minimum occurrences | At least 3 transactions matching the pattern |
| 5 | Recency | Most recent occurrence within the expected interval + 7 days |

## Frequency Detection

Determine the frequency by measuring the average interval between transactions:

| Frequency | Expected Interval | Tolerance |
|-----------|-------------------|-----------|
| weekly | 7 days | ±2 days |
| monthly | 28–31 days | ±5 days |
| quarterly | 85–95 days | ±10 days |
| yearly | 355–375 days | ±15 days |

If the interval doesn't match any frequency, the charges may be irregular purchases rather than a subscription.

## Amount Tolerance

Allow ±5% variation in the recurring amount to account for:
- Price adjustments
- Currency conversion fluctuations
- Tax changes
- Service tier changes

Calculate: `|amount_new - amount_avg| / amount_avg <= 0.05`

If the amount changes by more than 5%, flag it as a potential price increase rather than disqualifying it as a subscription.

## Annual Cost Calculation

Once a subscription is detected:
- **Monthly**: `amount × 12`
- **Quarterly**: `amount × 4`
- **Yearly**: `amount × 1`
- **Weekly**: `amount × 52`

Store in the `annual_cost` field of subscriptions.csv.

## Subscription Status

| Status | Meaning |
|--------|---------|
| active | Recurring charges detected within expected interval |
| paused | No charge in the last expected interval, but not confirmed cancelled |
| cancelled | User explicitly cancelled via `/smartspender:cancel` |

## Examples

### Netflix Detection

Given these transactions in categorized.csv:

```
2025-11-01  Netflix  -149.00  Abonnementer
2025-12-01  Netflix  -149.00  Abonnementer
2026-01-01  Netflix  -149.00  Abonnementer
```

**Step 1: Group by merchant**
- Merchant "Netflix" has 3 transactions

**Step 2: Check minimum occurrences**
- 3 occurrences ≥ 3 minimum — passes

**Step 3: Measure intervals**
- Nov 1 → Dec 1 = 30 days
- Dec 1 → Jan 1 = 31 days
- Average = 30.5 days — matches monthly (28–31 days ±5 days)

**Step 4: Check amount tolerance**
- All amounts are -149.00 — 0% variance — passes

**Step 5: Check recency** (assuming today is Feb 1, 2026)
- Last charge: Jan 1, 2026
- Expected next: ~Feb 1, 2026
- Within expected interval + 7 days — passes

**Result**:
```
subscription_id: "sub-netflix-001"
merchant: Netflix
category: Streaming
amount: 149.00
frequency: monthly
annual_cost: 1788.00
first_seen: 2025-11-01
last_seen: 2026-01-01
status: active
```

## Edge Cases

### Variable Subscription Amounts
Some services (e.g., electricity, phone bills) have variable amounts:
- If the merchant is a known subscription (from the categorization skill) AND has regular frequency, detect it even if amounts vary more than 5%
- Store the most recent amount, not the average

### Free Trial Conversions
A single charge from a service with no prior history is not a subscription yet. Wait for the minimum 3 occurrences before detecting.

### Annual Subscriptions
Annual subscriptions may only have 1 occurrence within the data window. If the merchant is a known subscription service (e.g., Adobe CC annual plan), flag it as a potential subscription with `frequency: yearly` even with fewer than 3 occurrences.

### Merged Households
If a service appears from multiple accounts (e.g., both lønkonto and budgetkonto), treat each account's charges separately. Don't merge cross-account charges into one subscription.

### Stopped Subscriptions
If a previously detected subscription has no charge in the last expected interval + 7 days:
- Change status to `paused`
- Do not delete the row — the user may want to see it was detected

## Related Skills

- See `skills/categorization/SKILL.md` for how merchants are identified
- See `skills/sheets-schema/SKILL.md` for the subscriptions.csv structure
