---
title: "ABM + decision-maker mapping at $0.001 a contact — sales prospecting MCP"
description: "Find target accounts, map buying committees, verify Indian businesses. Pay-per-contact, no seat caps. Apollo + Sales Nav alternative for AI-native teams."
path: "mcp/use-cases/sales-prospecting/"
type: "mcp-use-case"
icp: "sales"
keywords: "ai sales prospecting, apollo alternative, abm tool, decision maker mapping, gst verification, indian smb prospecting, claude sales mcp"
---

<section class="mcp-hero">
  <h1>ABM + decision-maker mapping at $0.001/contact</h1>
  <p class="tagline">Build target-account lists from hiring signals. Map buying committees in seconds. Verify Indian SMBs against GST/MCA. Pay-per-result, no Apollo-style seat fees.</p>
  <div class="mcp-cta-row">
    <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get an API key</a>
    <a class="mcp-cta-secondary" href="/mcp/">All 20 tools</a>
  </div>
</section>

## The sales-prospecting tax

Apollo's "Pro" plan is **$99/user/month**, and the moment your SDR pod gets serious — you need 5K credits/month, you blow past it. ZoomInfo starts at **$14K/yr**. LinkedIn Sales Navigator is **$99/user/month** with hard 25/day messaging caps and 1500/mo profile-export caps. Lusha and Clearbit aren't cheap either.

You pay all of this whether your reps actually search or not. And none of it works *inside* the agent your team is already using to draft emails.

There's also a hidden tax for India outreach: contact-data tools have terrible India coverage (most don't reach beyond LinkedIn), and **none verify the company against the GST or MCA registry** before your SDR sends a sequence. You end up emailing struck-off shell companies or non-VAT-compliant SMBs that won't sign.

## Six MCP tools that do the SDR's real job

- **`find_hiring(query, location, country)`** — companies hiring for a role you sell into. ICP-fit signal #1. 6–10 credits.
- **`find_decision_makers(company_url, target_roles)`** — for a target company, pull the VPs/Directors/Heads-of for any role family. The "buying committee" in 1 call. 3 credits.
- **`get_company_employees(company_url, seniority)`** — full org map. Use for cold intros via mutual connections. 3 credits.
- **`search_businesses(query, location, country)`** — local SMB prospecting via Google Maps + JustDial + IndiaMart. Phone, address, ratings included. 1–3 credits.
- **`verify_business(country, identifier)`** — GST + MCA + IBBI check. Confirms the company is real, registered, and active before you spend on a sequence. 1–2 credits.
- **`enrich_company(company)`** — Glassdoor + AmbitionBox + Trustpilot for context: are they happy customers? Good employer? Prepared talking points.

## 5 example prompts

> **"Build a target-account list: 50 SaaS companies in EU hiring DevRel. For each, give me their VP of Engineering with LinkedIn URL."**
>
> Claude pipes `find_hiring("devrel", "EU", country="DE,FR,UK,NL")` → loops `find_decision_makers(url, ["VP Engineering"])`. CSV-ready. ~$1.50 for the full list.

> **"Map the buying committee at Stripe for our payment-orchestration product. Target: VP/Director of Payments, VP of Product, CFO."**
>
> One `find_decision_makers("stripe.com", target_roles=["VP Payments", "Director Payments", "VP Product", "CFO"])`. ~$0.03.

> **"I'm pitching to 100 Indian D2C brands. Verify each one is GST-active and pull a director from MCA for the cold-call script."**
>
> Loop `verify_business(country="IN", identifier=GST)`. ~$0.10–0.20 for 100 lookups.

> **"Search for cotton-bedsheet manufacturers in Karur, Tamil Nadu. Filter to verified GST + 100+ orders on IndiaMart."**
>
> `find_suppliers_india("cotton bedsheets", location="Karur", verified_gst=true, min_orders=100)`. ~$0.05.

> **"I'm cold-calling 30 plumbing businesses in Austin, TX. Pull their Google Maps phone, address, and rating."**
>
> `search_businesses("plumbers", "Austin TX", country="US", max_results=30)`. ~$0.06.

## Output shape (find_decision_makers)

```json
{
  "company": "stripe.com",
  "target_roles": ["VP Payments", "Director Payments", "VP Product", "CFO"],
  "results": [
    {
      "name": "Will G.",
      "title": "VP, Payment Orchestration",
      "department": "Payments",
      "linkedin_url": "https://linkedin.com/in/...",
      "tenure_years": 4,
      "previous_companies": ["Square", "PayPal"]
    }
  ],
  "credits_charged": 3
}
```

## Thirdwatch MCP vs. sales-prospecting incumbents

<table class="mcp-comparison">
<thead>
<tr>
  <th>Capability</th>
  <th>Apollo</th>
  <th>Sales Nav</th>
  <th>ZoomInfo</th>
  <th>Thirdwatch MCP</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Annual cost (1 SDR seat, moderate use)</td>
  <td>$1,188+</td>
  <td>$1,576</td>
  <td>$14,000+</td>
  <td class="yes">~$300</td>
</tr>
<tr>
  <td>Hiring-signal ICP discovery</td>
  <td class="partial">Limited</td>
  <td class="partial">Limited</td>
  <td class="partial">Add-on</td>
  <td class="yes">Yes (14-source)</td>
</tr>
<tr>
  <td>Buying-committee mapping (1 call)</td>
  <td class="no">Manual</td>
  <td class="no">Manual</td>
  <td class="partial">Yes (premium)</td>
  <td class="yes">Yes</td>
</tr>
<tr>
  <td>India SMB coverage (JustDial + IndiaMart)</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">Native</td>
</tr>
<tr>
  <td>India compliance check (GST/MCA)</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">Yes</td>
</tr>
<tr>
  <td>Email export caps</td>
  <td class="partial">Tier-gated</td>
  <td class="no">~25/day messages</td>
  <td class="partial">Tier-gated</td>
  <td class="yes">None</td>
</tr>
<tr>
  <td>AI-agent native (Claude)</td>
  <td class="partial">REST API</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">MCP</td>
</tr>
</tbody>
</table>

## How the SDR pod actually uses it

1. **Monday morning ICP refresh.** SDR lead opens Claude, asks `find_hiring(...)` for the week's freshest targets. Claude drops 30 new companies into HubSpot.
2. **Per-account research, 90 seconds.** Before the cold call, the SDR asks Claude: "tell me about [company]" — Claude pulls hiring, employees, recent news, employer reviews. Cost: $0.20.
3. **India outbound, with compliance.** Every Indian lead gets a GST + MCA check baked into the enrichment step. Strikes off shell companies before they enter the sequence.
4. **Drafting outreach.** Once the data lands, Claude has full context to write a personalized first-touch — without a second tool.

## Get started

<div class="mcp-cta-row">
  <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get 100 free credits</a>
  <a class="mcp-cta-secondary" href="/mcp/tools/find-decision-makers/">Read find_decision_makers docs</a>
</div>
