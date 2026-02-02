---
name: negotiation
description: Danish consumer rights, negotiation tactics, email templates, and pricing benchmarks for subscription price negotiation. Reference this when drafting negotiation emails or advising on subscription costs.
---

# Subscription Negotiation

## Purpose

Provides domain knowledge for negotiating better prices on recurring subscriptions. Covers Danish consumer protection law, proven negotiation tactics, email template structure, and typical Danish market pricing benchmarks.

## Danish Consumer Rights

Danish consumer protection law provides specific leverage points for subscription negotiation. These rights apply to all Danish consumers and override individual contract terms where applicable.

| Right | Danish Term | Rule | Negotiation Use |
|-------|-------------|------|-----------------|
| Right of withdrawal | Fortrydelsesret | 14 days to cancel any distance/online purchase without reason | Leverage if subscription was recently started or renewed online |
| Notice period | Opsigelsesvarsel | Provider must give reasonable notice before changes take effect | Use to challenge sudden price increases |
| Binding period cap | Bindingsperiode | Max 6 months for consumer contracts (Forbrugeraftalelov §28) | Challenge any binding period longer than 6 months |
| Price increase right | Prisforhojelse | Provider must give 30 days written notice before a price increase; consumer can cancel without penalty within that notice period | Strong leverage: "I received your price increase notice and am considering cancellation" |
| Consumer Ombudsman | Forbrugerombudsmanden | Government body that enforces consumer protection law | Mention as escalation path if provider is uncooperative |
| Consumer Complaints Board | Forbrugerklagenaevnet | Independent body that resolves consumer disputes | Mention for disputes over binding periods or unfair terms |

### When to Reference Rights in Email

- **Price increase notice received**: Always reference prisforhojelse cancellation right — the provider knows you can leave penalty-free
- **Binding period claimed**: If provider claims a binding period > 6 months, reference Forbrugeraftalelov §28
- **Service quality issues**: Reference Forbrugerombudsmanden as potential escalation
- **Recent sign-up (< 14 days)**: Reference fortrydelsesret if relevant

## Negotiation Tactics

Select tactics based on the user's situation. Multiple tactics can be combined in a single email.

| Tactic | When to Use | Typical Discount | Example Ask |
|--------|-------------|------------------|-------------|
| Loyalty discount | Customer > 12 months | 10-20% | "Jeg har vaeret kunde i {months} maaneder og vil gerne hoere om I har et loyalitetstilbud" |
| Price match | Competitor is cheaper | Match price or 5-15% off | "Hos {competitor} koster tilsvarende abonnement {price} kr/md" |
| Downgrade threat | User has premium tier | 15-30% via plan change | "Jeg overvejer at nedgradere til {lower_plan} medmindre prisen kan justeres" |
| Competitor switch | Multiple viable alternatives | 10-25% | "Jeg har faaet et tilbud fra {competitor} paa {price} kr/md og overvejer at skifte" |
| Bundle renegotiation | Multiple products with same provider | 10-20% on bundle | "Jeg betaler for {product_count} produkter hos jer — er der en samlet rabat?" |
| Retention offer | Ready to cancel | 20-50% for 3-6 months | "Jeg er klar til at opsige medmindre vi kan finde en bedre pris" |

### Tactic Selection Rules

Apply these rules in order to select the primary tactic:

1. **Price increase received** → Lead with prisforhojelse cancellation right + competitor switch
2. **Customer > 12 months** → Lead with loyalty discount, combine with price match if competitor data available
3. **Competitor clearly cheaper** → Lead with price match, include specific competitor offer
4. **Premium tier with low usage** → Lead with downgrade threat
5. **Multiple products same provider** → Lead with bundle renegotiation
6. **None of the above apply** → Lead with retention offer (most direct approach)

## Email Template Structure

All negotiation emails follow this Danish template. Slots are filled with real data from the user's transaction history and competitor research.

```
Emne: Vedrørende mit abonnement — kundenummer {customer_number_if_known}

Kære {service} kundeservice,

{opening_paragraph}

{cost_summary_paragraph}

{competitor_comparison_paragraph}

{specific_ask_paragraph}

{closing_paragraph}

Med venlig hilsen
{user_name}
```

### Paragraph Rules

**Opening paragraph**: State who you are and how long you've been a customer. Set a professional, firm tone.
- Include: customer duration (from first_seen in subscriptions.csv), product name
- Tone: polite but direct — "Jeg har vaeret kunde hos {service} siden {date}"

**Cost summary paragraph**: Present the facts about what the user pays. Use real transaction data.
- Include: current monthly cost, annual cost, any recent price changes
- Format amounts with Danish currency: `1.847 kr`
- If receipt-level data exists, mention specific line items or unused services

**Competitor comparison paragraph**: Present competitor alternatives with prices. Skip if no competitor data available.
- Include: 2-3 competitor names with specific prices
- Source: WebSearch results or skill pricing benchmarks
- Frame as: "Jeg har undersoeøgt markedet og kan se at..."

**Specific ask paragraph**: State what discount or change you want. Be concrete.
- Include: exact amount or percentage requested, based on selected tactic
- Reference consumer rights if applicable (price increase, binding period)
- One clear ask, not multiple options

**Closing paragraph**: Set a deadline and state the alternative.
- Include: response deadline (14 days is standard), what happens if no response
- Standard close: "Hvis jeg ikke hoerer fra jer inden {date}, vil jeg gaøa videre med at opsige/skifte"

## Pricing Benchmarks

Typical Danish price ranges by category. Used as fallback when WebSearch competitor data is unavailable, and for validating whether the user is overpaying.

### Streaming

| Service | Low | Typical | High | Notes |
|---------|-----|---------|------|-------|
| Netflix | 79 kr | 119 kr | 189 kr | Standard with ads (79), Standard (119), Premium (189) |
| HBO Max | 69 kr | 99 kr | 149 kr | Standard with ads (69), Standard (99), Premium (149) |
| Disney+ | 69 kr | 89 kr | 129 kr | Standard with ads (69), Standard (89), Premium (129) |
| Viaplay | 79 kr | 129 kr | 219 kr | Basis (79), Standard (129), Total (219) |
| TV 2 Play | 59 kr | 109 kr | 179 kr | Lite (59), Standard (109), Sport (179) |
| Spotify | 69 kr | 99 kr | 179 kr | Individual (69/99), Duo (139), Family (179) |
| YouTube Premium | 79 kr | 79 kr | 149 kr | Individual (79), Family (149) |

### Telecom

| Service | Low | Typical | High | Notes |
|---------|-----|---------|------|-------|
| TDC | 149 kr | 249 kr | 399 kr | Small (149), Medium (249), Large (299), X-Large (399) |
| Telenor | 99 kr | 199 kr | 349 kr | Often promotional pricing for first 6 months |
| Telia | 99 kr | 179 kr | 329 kr | Competitive on data-heavy plans |
| 3 (Tre) | 99 kr | 149 kr | 299 kr | Budget-friendly, good data packages |
| CBB Mobil | 49 kr | 99 kr | 149 kr | Budget brand (owned by Telenor) |
| Lebara | 49 kr | 79 kr | 129 kr | Budget brand, no binding |

### Fitness

| Service | Low | Typical | High | Notes |
|---------|-----|---------|------|-------|
| Fitness World | 149 kr | 249 kr | 399 kr | Basic (149), Flex (249), Premium (399) |
| Fitness dk | 199 kr | 299 kr | 449 kr | Generally more expensive than Fitness World |
| SATS | 199 kr | 329 kr | 499 kr | Premium positioning |
| PureGym | 99 kr | 149 kr | 199 kr | Budget option, fewer amenities |

### Insurance (monthly)

| Type | Low | Typical | High | Notes |
|------|-----|---------|------|-------|
| Indboforsikring | 50 kr | 100 kr | 200 kr | Home contents insurance |
| Rejseforsikring | 30 kr | 60 kr | 120 kr | Travel insurance |
| Ulykkesforsikring | 40 kr | 80 kr | 150 kr | Accident insurance |
| Bilforsikring | 300 kr | 600 kr | 1.200 kr | Car insurance — highly variable |

### News / Media

| Service | Low | Typical | High | Notes |
|---------|-----|---------|------|-------|
| Politiken | 99 kr | 149 kr | 199 kr | Digital subscription |
| Berlingske | 99 kr | 149 kr | 199 kr | Digital subscription |
| Zetland | 99 kr | 129 kr | 129 kr | Single tier |
| Jyllands-Posten | 99 kr | 149 kr | 199 kr | Digital subscription |

## Contact Info Extraction

To draft a negotiation email, you need the provider's customer service email. Use this priority order:

1. **Invoice knowledge parser** — Check `invoice-knowledge/{vendor}/PARSER.md` for vendor contact patterns and customer service details
2. **Subscription file** — Check `subscriptions/{service}.md` for website and contact information
3. **WebSearch fallback** — Search `"{service} kundeservice email"` or `"{service} kontakt email"` to find the customer service email address

If no email address can be found through any source, inform the user and suggest they find the contact email on the provider's website. Include the website URL from the subscription file if available.

## Examples

### Example 1: TDC Telecom Negotiation

**Situation**: User has been a TDC customer for 18 months, pays 299 kr/month for Medium plan. Telenor offers a comparable plan for 199 kr/month.

**Tactic selected**: Price match (competitor clearly cheaper) + Loyalty (>12 months)

**Draft email**:

```
Emne: Vedrørende mit mobilabonnement

Kære TDC kundeservice,

Jeg har været kunde hos TDC i 18 måneder og har været tilfreds med jeres
service. Jeg skriver, fordi jeg gerne vil drøfte prisen på mit nuværende
abonnement.

Jeg betaler i dag 299 kr/md (3.588 kr/år) for TDC Mobilpakke Medium. Over
de seneste 18 måneder har jeg betalt i alt 5.382 kr til TDC.

Jeg har undersøgt markedet og kan se, at Telenor tilbyder et tilsvarende
abonnement med samme datamængde for 199 kr/md. Telia har et lignende
tilbud til 179 kr/md.

Som loyal kunde i over et år vil jeg gerne høre, om I kan matche
markedsprisen eller tilbyde mig en loyalitetsrabat. Konkret håber jeg på en
pris omkring 199 kr/md, svarende til en besparelse på 1.200 kr/år.

Hvis jeg ikke hører fra jer inden den 16. februar, vil jeg gå videre med
at skifte til en af de nævnte alternativer.

Med venlig hilsen
{user_name}
```

**Estimated savings**: 1.200 kr/year (100 kr/month discount requested)

### Example 2: Fitness World Loyalty Negotiation

**Situation**: User has been a Fitness World member for 24 months, pays 249 kr/month for Flex. PureGym offers memberships from 149 kr/month.

**Tactic selected**: Loyalty (>12 months) + Retention offer

**Draft email**:

```
Emne: Vedrørende mit medlemskab — Fitness World Flex

Kære Fitness World kundeservice,

Jeg har været medlem hos Fitness World i 2 år og bruger jeres faciliteter
regelmæssigt. Jeg skriver, fordi jeg gerne vil tale om prisen på mit
Flex-medlemskab.

Mit nuværende medlemskab koster 249 kr/md, svarende til 2.988 kr/år.
Over mine 2 år som medlem har jeg betalt i alt 5.976 kr.

Jeg kan se, at PureGym tilbyder medlemskab fra 149 kr/md, og flere andre
kæder har konkurrencedygtige priser. Jeg vil dog foretrække at blive hos
Fitness World, hvis prisen kan justeres.

Som trofast medlem i over 2 år håber jeg, at I kan tilbyde mig en
loyalitetsrabat — f.eks. en pris på 199 kr/md eller en tilsvarende
reduktion.

Jeg ser frem til at høre fra jer inden den 16. februar.

Med venlig hilsen
{user_name}
```

**Estimated savings**: 600 kr/year (50 kr/month discount requested)

## Edge Cases

### Service Not Suitable for Email Negotiation
Some services have fixed pricing with no negotiation (e.g., Netflix, Spotify). For these, suggest downgrading to a cheaper tier or cancelling instead. Check the subscription file for tier information.

### Recently Accepted a Retention Offer
If the subscription file or user indicates they recently accepted a retention offer (within the last 6 months), note that renegotiating immediately may be less effective. The binding period from retention offers is typically 6 months.

### Annual vs Monthly Billing
If the subscription is billed annually, negotiation timing matters. Draft the email 30-60 days before the renewal date so the provider has time to respond before the next charge.

## Related Skills

- See `skills/subscription-detection/SKILL.md` for how subscriptions are detected and subscription status definitions
- See `skills/spending-analysis/SKILL.md` for Danish currency formatting rules and savings recommendation patterns
- See `skills/categorization/SKILL.md` for merchant normalization rules
