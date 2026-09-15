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

Setup has two steps: organization details, then a linked organization tree and member list. Select a node to filter members, add child units from the node, and add members from the right panel with an explicit unit assignment. Home summary cards open the same workspace; Managers applies a Manager filter.

Data persists only in this browser. **Reset organization** clears Team data after confirmation. Email matching and Pending invitations use a local directory; no emails, backend or MCP calls are made. Try `ali@pislaka.example` or `sara@pislaka.example` for existing accounts, and `new.member@example.com` for invitations.

See [the Team V1 handoff](TEAM-V1-HANDOFF.zh-CN.md) for the current walkthrough, data objects, authorization model and proposed MCP tools.
