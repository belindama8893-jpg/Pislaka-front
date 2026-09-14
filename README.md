# Pislaka Agent V2 Demo

Responsive, clickable front-end prototype for Pislaka Agent, including:

- AI property team home experience
- Listings and leads workflows
- Listing publishing flow and public listing preview
- Pislaka Plus plans, checkout, payment result, and usage status
- Desktop and mobile layouts

## Run locally

Open `index.html` directly, or run a local static server from the repository root:

```bash
python3 -m http.server 4180
```

Then open `http://127.0.0.1:4180/`.

## Current Plus pricing

- 30-day access: PKR 100 (regular price PKR 1,000)
- 1-year access: PKR 10,000
- Payment fees: JazzCash 1.2%, Bank Alfalah card 2.4%

This repository contains a front-end prototype. Third-party payments are simulated for demonstration purposes.

## Team V1 organization prototype

Open `http://127.0.0.1:4180/#team`, or select **Team** in the navigation / home expert tabs.
Create an organization, optionally build a unit tree, add mock members and manager scopes, review, then enter Team Agent. Reopen **Organization Settings** to edit the configuration.

Data persists only in this browser. **Reset demo** clears Team data after confirmation. There are no backend, invitation, or MCP calls.

See [the Team V1 handoff](TEAM-V1-HANDOFF.zh-CN.md) for the walkthrough, data objects, permission semantics and proposed MCP tools.
