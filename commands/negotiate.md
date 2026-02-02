---
description: Draft a negotiation email to get a better price on a subscription
---

# /smartspender:negotiate

## Trigger
- `/smartspender:negotiate [service]`
- "Forhandl prisen paa Netflix"
- "Negotiate my TDC subscription"
- "Kan jeg faa en bedre pris paa Fitness World?"
- "Skriv en forhandlingsmail til TDC"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| service | yes | Service name matching a merchant in subscriptions.csv | - |

The service argument is case-insensitive and matched against the `merchant` column in subscriptions.csv (e.g., `tdc`, `netflix`, `fitness-world`).

## Prerequisites
- Subscription detected in subscriptions.csv
- Transaction history in categorized.csv (for cost analysis)
- Negotiation skill loaded: `skills/negotiation/SKILL.md`

## Workflow

1. Normalize the service argument to lowercase, replace spaces with hyphens
2. Look up the service in subscriptions.csv by matching `merchant` name (case-insensitive)
3. If not found: "Abonnementet '{service}' blev ikke fundet i dine abonnementer. Koer /smartspender:subscriptions for at se dine aktive abonnementer."
4. If already cancelled: "Abonnementet '{service}' er allerede opsagt ({cancelled_date}). Der er ikke noget at forhandle."
5. Read the subscription record: `merchant`, `amount`, `frequency`, `annual_cost`, `first_seen`, `last_seen`, `status`

### Cost Analysis

6. Read categorized.csv, filter by merchant name (case-insensitive match)
7. Calculate:
   - `monthly_cost`: current subscription amount from subscriptions.csv
   - `annual_cost`: from subscriptions.csv
   - `total_paid`: sum of all matching transactions in categorized.csv
   - `months_as_customer`: number of months between `first_seen` and today
8. If receipts exist for this merchant in receipts.csv, read receipt-items from the relevant `receipt-items-{YYYY-MM}.csv` files. Note any unused services or add-ons visible in line items.
9. If no transaction history found: "Ingen transaktionshistorik fundet for '{service}'. Koer /smartspender:sync foerst."

### Contact Info

10. Check for invoice knowledge: look for `invoice-knowledge/{service}/PARSER.md`
    - If exists, extract any customer service email or contact info
11. Check for subscription guide: look for `subscriptions/{service}.md`
    - If exists, extract website URL and any contact information
12. If no email found from steps 10-11: use WebSearch to find the customer service email
    - Search: `"{service} kundeservice email"` or `"{service} kontakt email"`
13. If still no email found: note that the user will need to find the contact email themselves. Include the website URL from the subscription file if available.

### Competitor Research

14. Use WebSearch to find current competitor prices for the same service category:
    - Telecom: search for "billigste mobilabonnement Danmark {current_year}"
    - Streaming: search for "{service_category} streaming priser Danmark"
    - Fitness: search for "billigste fitnesscenter {city if known} Danmark"
    - Insurance: search for "billig {insurance_type} Danmark sammenligning"
    - Other: search for "{service_category} alternativer Danmark pris"
15. Collect 2-3 competitor offers with specific prices
16. If WebSearch fails or returns no useful results: fall back to pricing benchmarks in `skills/negotiation/SKILL.md` for the relevant category

### Tactic Selection

17. Apply the tactic selection rules from `skills/negotiation/SKILL.md`:
    - Check if a price increase was recently detected (amount increased > 10% in subscriptions.csv)
    - Check customer duration (`months_as_customer` > 12 = loyalty eligible)
    - Check if a competitor is clearly cheaper than current price
    - Check if the user has a premium tier with potential to downgrade
    - Check if the user has multiple products with the same provider
    - Select the primary tactic and any secondary tactics to combine
18. Calculate the specific discount to request:
    - Price match: request the competitor's price
    - Loyalty: request 10-15% discount
    - Retention: request 20-30% discount
    - Downgrade: request the price of a lower tier
19. Calculate estimated annual savings: `(current_monthly - requested_monthly) * 12`

### Draft Email

20. Fill the email template from `skills/negotiation/SKILL.md` with real data:
    - Opening: customer duration, product name
    - Cost summary: monthly cost, annual cost, total paid — use Danish currency formatting (1.847 kr)
    - Competitor comparison: 2-3 alternatives with prices (from step 15-16)
    - Specific ask: discount amount based on selected tactic
    - Closing: 14-day response deadline, consequence if no response
21. Apply consumer rights references where applicable (per skill rules)
22. Ensure the entire email is in Danish with correct formatting

### Save and Present

23. Create the `drafts/` directory if it does not exist
24. Save the draft to `drafts/negotiate-{service}-{YYYY-MM-DD}.md` with this structure:

```markdown
# Forhandlingsudkast: {Service}

## Status
- **Dato**: {today}
- **Tjeneste**: {service}
- **Nuvaerende pris**: {monthly_cost} kr/md ({annual_cost} kr/aar)
- **Oensket pris**: {requested_price} kr/md
- **Estimeret besparelse**: {annual_savings} kr/aar
- **Taktik**: {selected_tactic}
- **Kontakt**: {email_or_website}

## Email

{full_email_text}

## Konkurrenter
{competitor_data_used}
```

25. Present the draft email to the user in Danish
26. Announce: "Udkastet er gemt i drafts/negotiate-{service}-{YYYY-MM-DD}.md. Gennemlaes venligst og lad mig vide, hvis du vil have aendringer."
27. **[USER ACTION]**: User reviews the draft. May request changes to tone, amount, or content.
28. If user requests changes: update the draft, save again, present updated version
29. Append to action-log.csv:
    - `date`: today (YYYY-MM-DD)
    - `action_type`: negotiate
    - `target`: {service}
    - `status`: drafted
    - `details`: "Negotiation email drafted. Tactic: {tactic}. Requested: {requested_price} kr/md"
    - `savings_amount`: estimated annual savings (the amount requested, not confirmed)

## Output

"Forhandlingsmail til {service} er klar. Estimeret besparelse: {annual_savings} kr/aar."

**Example**: "Forhandlingsmail til TDC er klar. Estimeret besparelse: 1.200 kr/aar."

## Error Cases

| Error | Message |
|-------|---------|
| Service not in subscriptions | "Abonnementet '{service}' blev ikke fundet i dine abonnementer. Koer /smartspender:subscriptions for at se dine aktive abonnementer." |
| Already cancelled | "Abonnementet '{service}' er allerede opsagt ({date}). Der er ikke noget at forhandle." |
| No transaction history | "Ingen transaktionshistorik fundet for '{service}'. Koer /smartspender:sync foerst." |
| WebSearch fails | Falls back to pricing benchmarks from negotiation skill. Notes in draft that competitor prices are approximate. |
| No contact info found | "Kunne ikke finde en kontaktemail til {service}. Besog {website} for at finde deres kundeservice-email." |
| Service not suitable for negotiation | "Tjenester som {service} har faste priser uden forhandlingsmulighed. Overvej at nedgradere til en billigere plan eller opsig med /smartspender:cancel {service}." |

## Side Effects
- Creates `drafts/` directory (if not present)
- Writes draft file to `drafts/negotiate-{service}-{YYYY-MM-DD}.md`
- Writes to action-log.csv

## Related Commands
- `/smartspender:cancel [service]` — Cancel instead of negotiating
- `/smartspender:subscriptions` — View all subscriptions before deciding what to negotiate
- `/smartspender:overview` — See subscription cost in context of total spending
