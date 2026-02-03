# Subscription Learnings

Corrections for subscription detection. Check this file before applying frequency-based detection.

## How to Use

1. Check "Confirmed Subscriptions" first — always flag these as subscriptions
2. Check "Not Subscriptions" second — never flag these, even if they appear recurring
3. Only then apply automatic frequency-based detection

## Confirmed Subscriptions

Merchants the user has confirmed ARE subscriptions.

| Date | Pattern | Merchant | Frequency | Note |
|------|---------|----------|-----------|------|
<!-- Claude appends confirmed subscriptions below this line -->

## Not Subscriptions

Merchants the user has confirmed are NOT subscriptions (false positives).

| Date | Pattern | Merchant | Reason |
|------|---------|----------|--------|
<!-- Claude appends non-subscriptions below this line -->
