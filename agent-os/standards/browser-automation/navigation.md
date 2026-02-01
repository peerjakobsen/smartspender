# Browser Navigation Standards

## Context

SmartSpender uses Claude in Chrome to navigate bank websites and subscription services. This standard defines how to write reliable navigation instructions in adapter and command files.

## Navigation Instruction Format

### Always Use Full URLs
Never use relative paths. Always provide the complete URL.

**Good**: "Navigate to `https://netbank.nykredit.dk/privat/accounts/save-postings`"
**Bad**: "Navigate to the export page"

### Wait for Page Load
Bank pages load asynchronously. Always specify what to wait for after navigation.

**Good**: "Navigate to URL. Wait for the iframe containing the export form to load."
**Bad**: "Navigate to URL. Click the button."

### Describe Elements Precisely
When Claude needs to interact with a page element, provide multiple ways to identify it:

1. **Element ID** (most reliable): `document.getElementById('standardExport')`
2. **Text content** (good fallback): "Click the button labeled 'Naeste'"
3. **CSS selector** (when needed): `document.querySelector('.export-form button.primary')`
4. **Position** (last resort): "The second button in the form footer"

### Document Page States

Bank websites often have multi-step flows. Document each state:

```markdown
## Export Flow States

| Step | Page Indicator | Action |
|------|---------------|--------|
| 1. Configure | Tab "Udvaelg posteringer" is active | Select preset, set period, click Naeste |
| 2. Review | Tab "Hent posteringsfil" is active | Verify count, click Naeste |
| 3. Confirm | Tab "Marker som eksporteret" is active | Click OK |
```

## Handling Redirects and Popups

- Document any expected redirects after login
- Note if the bank shows cookie consent or notification popups that need dismissal
- Specify if new tabs or windows open during the flow

## Timing

- Always include wait times between steps: "Wait 500ms for form to populate"
- Bank sites vary in speed -- err on the side of longer waits
- Use explicit waits (setTimeout) rather than assuming instant response
- Document expected timeouts: "If page doesn't load within 10 seconds, report error"

## Error Recovery

Document what to do when navigation fails:
- Page not found (404): "Bank may have changed their URL. Check for redirects."
- Session expired: "Prompt user to re-authenticate with MitID."
- Unexpected page: "If the expected form is not found, describe what's on screen and ask user for guidance."
