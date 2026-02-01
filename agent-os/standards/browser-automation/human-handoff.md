# Human-in-the-Loop Authentication Patterns

## Context

SmartSpender never handles bank credentials or authentication directly. The user always performs authentication (MitID, service logins) while Claude handles everything before and after. This standard defines how to design clean handoff points.

## Core Principle

**Claude navigates. The user authenticates. Claude continues.**

The agent should do as much as possible on both sides of the authentication boundary, minimizing the manual steps the user needs to take.

## Handoff Pattern

### 1. Pre-Authentication (Claude)
- Navigate to the login page
- Announce clearly what the user needs to do
- Specify what to say when done

### 2. Authentication (User)
- User performs MitID / bank login / service login
- User confirms completion with a natural language response

### 3. Post-Authentication (Claude)
- Verify login succeeded (check for expected post-login elements)
- Continue the automated workflow

## Message Templates

### Bank Login (MitID)
```
Please log in to {bank} with MitID. I've opened the login page for you.
Let me know when you're logged in.
```

### Service Login (Subscription Cancellation)
```
Please log in to {service}. I've opened {url} for you.
Let me know when you're on the account page.
```

### Final Confirmation (Irreversible Action)
```
I've navigated to the cancellation page for {service}.
Please review the details on screen and confirm you want to proceed.
```

## Handoff Points in SmartSpender

| Workflow | Handoff Point | User Action | Resume Signal |
|----------|--------------|-------------|---------------|
| Sync | Bank login page | MitID authentication | "I'm logged in" |
| Cancel | Service login page | Username/password login | "I'm logged in" |
| Cancel | Final cancellation screen | Review and confirm | "Go ahead" / "Cancel" |
| Add Account | Bank login page | MitID authentication | "I'm logged in" |

## Design Rules

### Keep Handoff Points Minimal
Every handoff interrupts the workflow. Design automations to minimize the number of times the user needs to act.

**Good**: One handoff for MitID, then Claude handles everything else
**Bad**: Multiple handoffs for different pages within the same bank session

### Be Explicit About What's Next
After the user completes their action, tell them what Claude will do next:

```
Thanks! I'll now navigate to the export page and download your transactions.
This should take about 30 seconds.
```

### Handle Timeout Gracefully
If the user doesn't respond after authentication prompt:
- Don't assume login succeeded
- Don't repeatedly prompt
- Wait for user signal before proceeding

### Never Rush Irreversible Actions
For cancellations or any action with permanent consequences:
- Always pause for user confirmation
- Show exactly what will happen
- Accept "cancel" / "stop" / "never mind" as abort signals
