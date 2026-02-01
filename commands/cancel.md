---
description: Cancel a subscription service with guided browser automation
---

# /smartspender:cancel

## Trigger
- `/smartspender:cancel [service]`
- "Opsig Netflix"
- "Afmeld Viaplay"
- "Cancel my Fitness World subscription"

## Arguments

| Argument | Required | Values | Default |
|----------|----------|--------|---------|
| service | yes | Service name matching a file in `subscriptions/` | - |

The service argument is case-insensitive and matched against known subscription file names (e.g., `netflix`, `viaplay`, `fitness-world`).

## Prerequisites
- Subscription detected in subscriptions.csv
- Cancellation guide exists in `subscriptions/{service}.md`
- Claude in Chrome extension active

## Workflow

1. Normalize the service argument to lowercase, replace spaces with hyphens
2. Look up the service in subscriptions.csv by matching `merchant` name
3. If not found: "Abonnementet '{service}' blev ikke fundet i dine abonnementer."
4. If already cancelled: "Abonnementet '{service}' er allerede opsagt ({cancelled_date})."
5. Load the cancellation guide: `subscriptions/{service}.md`
6. If no guide file exists: "Ingen opsigelsesguide fundet for '{service}'. Du kan opsige manuelt på {merchant}'s hjemmeside."
7. Open the service's website in the browser (per the cancellation guide)
8. Announce: "Jeg har åbnet {service}. Log venligst ind. Sig til, når du er logget ind."
9. **[USER ACTION]**: User logs in to the service
10. **[USER ACTION]**: User confirms login complete
11. Navigate to the account/subscription settings page (per guide)
12. Follow the cancellation steps from the guide:
    - Navigate through the cancellation flow
    - Handle retention offers by declining them (inform user about offers but proceed with cancellation)
    - If the guide mentions retention tactics, warn the user: "De vil sandsynligvis tilbyde en rabat. Skal jeg fortsætte med opsigelsen?"
13. When reaching the final confirmation step:
    - Announce: "Opsigelsen er klar til bekræftelse. Gennemse venligst detaljerne på skærmen og bekræft, at du vil fortsætte."
    - **[USER ACTION]**: User confirms ("Ja, fortsæt" / "Nej, annuller")
    - If user declines, abort: "Opsigelse afbrudt. Abonnementet er stadig aktivt."
14. After confirmation, verify cancellation succeeded:
    - Check for confirmation message or email notification on screen
    - Look for updated subscription status on the account page
15. Update subscriptions.csv:
    - Set `status` to `cancelled`
    - Set `cancelled_date` to today's date (YYYY-MM-DD)
16. Append the action to action-log.csv:
    - `action_type`: cancel
    - `target`: {service}
    - `status`: completed
    - `details`: "Subscription cancelled"
    - `savings_amount`: value from `annual_cost` in subscriptions.csv

## Output

"Abonnementet {service} er opsagt. Du sparer {annual_cost} kr/år."

**Example**: "Abonnementet Viaplay er opsagt. Du sparer 1.188 kr/år."

## Error Cases

| Error | Message |
|-------|---------|
| Service not in subscriptions | "Abonnementet '{service}' blev ikke fundet i dine abonnementer." |
| Already cancelled | "Abonnementet '{service}' er allerede opsagt ({date})." |
| No cancellation guide | "Ingen opsigelsesguide fundet for '{service}'." |
| Login timeout | "Log venligst ind for at fortsætte." |
| User aborts | "Opsigelse afbrudt. Abonnementet er stadig aktivt." |
| Cancellation failed | "Opsigelsen kunne ikke gennemføres. Prøv manuelt på {url}." |
| Service has binding period | "Bemærk: {service} har en bindingsperiode til {date}. Opsigelsen træder i kraft efter denne dato." |

## Side Effects
- Updates subscriptions.csv (`status`, `cancelled_date`)
- Writes to action-log.csv

## Related Commands
- `/smartspender:subscriptions` — View all subscriptions before deciding what to cancel
- `/smartspender:overview` — See subscription cost in context of total spending
