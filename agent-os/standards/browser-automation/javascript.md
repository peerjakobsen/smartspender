# JavaScript Execution Standards

## Context

SmartSpender executes JavaScript in the browser via Claude in Chrome to interact with bank websites. Danish banks commonly use iframes, dynamic forms, and asynchronous loading. This standard defines how to write reliable browser JavaScript.

## Iframe Handling

### Always Check for Iframes First
Danish banks (especially Nykredit) render form elements inside iframes. Direct `document.getElementById()` will not find elements inside an iframe.

**Pattern**:
```javascript
// Step 1: Find the iframe
const iframe = document.querySelector('iframe');

// Step 2: Access the iframe's document
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

// Step 3: Now access elements through iframeDoc
const element = iframeDoc.getElementById('formElement');
```

### Cross-Origin Restrictions
If the iframe is from a different origin, `contentDocument` will be null due to browser security. Document this in the bank's `quirks.md` and fall back to UI-based interaction (clicking visible elements).

### Nested Iframes
Some banks use nested iframes. Document the iframe hierarchy:
```javascript
const outerIframe = document.querySelector('iframe#main');
const outerDoc = outerIframe.contentDocument;
const innerIframe = outerDoc.querySelector('iframe#form');
const formDoc = innerIframe.contentDocument;
```

## Event Dispatching

### Always Dispatch Change Events
Setting a value programmatically does not trigger the form's event handlers. Always dispatch the appropriate event after changing a value.

```javascript
// Set the value
select.value = '0000000001';

// Dispatch change event so the form reacts
select.dispatchEvent(new Event('change', { bubbles: true }));
```

### Common Events to Dispatch
- `change` -- for select dropdowns, checkboxes, radio buttons
- `input` -- for text inputs while typing
- `click` -- for buttons (though `.click()` method usually works)
- `submit` -- for form submission (prefer clicking the submit button instead)

### Bubbling
Always set `{ bubbles: true }` to ensure parent elements receive the event.

## Async Operations

### Use Explicit Waits
Bank pages load content asynchronously. Never assume immediate availability.

```javascript
// Wait for element to appear
async function waitForElement(doc, selector, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = doc.querySelector(selector);
    if (el) return el;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Element ${selector} not found within ${timeoutMs}ms`);
}
```

### Wait Between Steps
Add delays between form interactions to allow the page to update:

```javascript
// After selecting a preset, wait for form to populate
select.value = '0000000001';
select.dispatchEvent(new Event('change', { bubbles: true }));
await new Promise(r => setTimeout(r, 500));

// Now the form fields should be populated
```

## Safety Rules

- Never store or log sensitive data (account numbers, balances) in JavaScript console output
- Never modify bank data -- only read and export
- Never submit forms that transfer money or change account settings
- If unsure about an element's purpose, stop and ask the user
