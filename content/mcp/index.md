---
title: "Thirdwatch MCP — the professional search MCP for Claude, Cursor, and Claude Code"
description: "Search jobs, candidates, businesses, reviews, products, and properties from Claude — 20 tools backed by 54 production scrapers. Pay per result, 100 free credits on signup."
path: "mcp/"
type: "mcp-overview"
keywords: "mcp server, claude mcp, professional search, claude.ai connector, cursor mcp, apify mcp, model context protocol"
---

<section class="mcp-hero">
  <h1>The professional search MCP for Claude, Cursor & Claude Code</h1>
  <p class="tagline">One MCP server, 20 tools, 54 underlying scrapers. Search jobs, candidates, companies, reviews, products, and real estate from natural language. Pay per result. 100 free credits when you sign up.</p>
  <div class="mcp-cta-row">
    <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get an API key</a>
    <a class="mcp-cta-secondary" href="#setup">Setup in 3 steps</a>
  </div>
  <div class="mcp-endpoint">https://mcp.thirdwatch.dev/mcp</div>
</section>

## What is Thirdwatch MCP?

Thirdwatch MCP is a remote Model Context Protocol server that exposes 20 high-leverage tools — `search_jobs`, `search_candidates`, `track_competitor`, `compare_products`, `search_properties`, and more — to any MCP-compatible client.

It is the easiest way to wire **structured web data** into Claude.ai, Claude Code, Cursor, or any other agent. Behind each tool is a battle-tested Thirdwatch Apify actor (54 of them, with combined 100M+ run-events on the Apify Store). You don't manage scrapers, proxies, headless browsers, or rate limits. Ask Claude a question; the model picks the right tool; you get JSON.

It is **professional search**, not general-purpose web crawling. Each tool is opinionated about a workflow — recruiter sourcing, competitive intel, ABM, marketplace pricing — and aggregates 3–14 sources per call so the model gets cross-validated answers without 30 separate `web_search` calls.

<h2 id="setup">Setup in 3 steps</h2>

<ol class="mcp-step-list">
  <li>
    <strong>Register and grab your API key</strong>
    <p>Visit <a href="https://thirdwatch.dev/mcp/register">thirdwatch.dev/mcp/register</a>. You get 100 free credits — enough for ~30 searches across most tools. No credit card.</p>
  </li>
  <li>
    <strong>Add Thirdwatch as a Custom Connector</strong>
    <p>In Claude.ai → Settings → Connectors → Add Custom Connector, paste <code>https://mcp.thirdwatch.dev/mcp</code> as the URL and your API key as the bearer token. (Cursor, Claude Code: drop the same URL + bearer into your <code>mcp.json</code>.)</p>
  </li>
  <li>
    <strong>Try a real search</strong>
    <p>Type into Claude: <code>Use Thirdwatch to find YC startups in San Francisco hiring senior engineers, paying over $200K, posted in the last 14 days.</code> Claude routes that to <code>search_jobs</code> with the right filters and returns ~25 cross-platform listings.</p>
  </li>
</ol>

## What can you do with it?

Five real workflows that work today.

<div class="mcp-grid">
  <div class="mcp-card">
    <h3>Recruiter</h3>
    <p class="mcp-card-sub">Replace Sales Navigator + LinkedIn Recruiter + Apollo for sourcing.</p>
    <ul>
      <li>"Find 25 staff-level Python engineers in Berlin, 8+ yrs at FAANG"</li>
      <li>"List companies in fintech actively hiring data engineers in NYC"</li>
      <li>"Pull every senior PM employee at Stripe with their LinkedIn profiles"</li>
      <li>"Search candidates open to freelance, India, ML/AI"</li>
    </ul>
    <a class="mcp-card-cta" href="/mcp/use-cases/recruiters/">Recruiter playbook →</a>
  </div>

  <div class="mcp-card">
    <h3>Sales / RevOps</h3>
    <p class="mcp-card-sub">ABM, decision-maker mapping, intent signals — at $0.001/contact.</p>
    <ul>
      <li>"Map the buying committee for HubSpot's marketing ops"</li>
      <li>"Find 50 SaaS companies in EU hiring DevRel — pull their VP of Engineering"</li>
      <li>"Verify GST and MCA for these 100 Indian SMBs before outreach"</li>
      <li>"List Trustpilot complaints about Salesforce in the last 30 days"</li>
    </ul>
    <a class="mcp-card-cta" href="/mcp/use-cases/sales-prospecting/">Prospecting playbook →</a>
  </div>

  <div class="mcp-card">
    <h3>B2B SaaS PM</h3>
    <p class="mcp-card-sub">Battle-cards, churn signals, hiring patterns — in one Claude prompt.</p>
    <ul>
      <li>"Compare Notion vs ClickUp on G2 + Capterra reviews"</li>
      <li>"Track Linear's last 90 days: hires, reviews, ProductHunt mentions"</li>
      <li>"Brand-monitor 'Asana' across Trustpilot, Reddit, Yelp, Google News"</li>
      <li>"What features are people complaining about with Airtable?"</li>
    </ul>
    <a class="mcp-card-cta" href="/mcp/use-cases/b2b-saas-competitive-intel/">Competitive playbook →</a>
  </div>

  <div class="mcp-card">
    <h3>E-commerce Operator</h3>
    <p class="mcp-card-sub">Cross-marketplace pricing + arbitrage discovery — replace Helium 10 / Jungle Scout.</p>
    <ul>
      <li>"Compare prices for AirPods Pro across Amazon, Flipkart, Noon, AliExpress"</li>
      <li>"Find arbitrage: AliExpress → Amazon US, electronics, &gt;40% margin"</li>
      <li>"Track pricing for 'silicone baby bibs' across 4 marketplaces in UAE"</li>
      <li>"Find verified Indian suppliers for cotton bedsheets, &gt;100 orders"</li>
    </ul>
    <a class="mcp-card-cta" href="/mcp/use-cases/ecommerce-operators/">E-commerce playbook →</a>
  </div>

  <div class="mcp-card">
    <h3>Real Estate Investor</h3>
    <p class="mcp-card-sub">Market analytics across 4 portals (India) + Rightmove (UK), with rent yield.</p>
    <ul>
      <li>"Median 2BHK rent in Indiranagar Bangalore, with 25/75 percentiles"</li>
      <li>"Compute rental yield for buy-to-let 2BHK in Whitefield"</li>
      <li>"Find 3BHK flats under ₹2.5 Cr in HSR Layout, ready-to-move"</li>
      <li>"Compare ask prices: NoBroker vs MagicBricks vs 99acres"</li>
    </ul>
    <a class="mcp-card-cta" href="/mcp/use-cases/real-estate-investors/">Real estate playbook →</a>
  </div>
</div>

<h2 id="tools">All 20 tools, grouped by cluster</h2>

<table class="mcp-tool-table">
<thead>
<tr>
  <th>Tool</th>
  <th>What it does</th>
  <th>Cost</th>
</tr>
</thead>
<tbody>

<tr><td colspan="3"><span class="mcp-cluster-tag">Free</span> — discovery + accounting, never charged</td></tr>

<tr>
<td><a href="/mcp/tools/professional-search/"><code>professional_search</code></a></td>
<td>Natural-language router. Tells you which tool fits your query, with cost and confidence.</td>
<td>0 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/estimate-cost/"><code>estimate_cost</code></a></td>
<td>Preview the cost of any tool call before running it.</td>
<td>0 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/get-account-info/"><code>get_account_info</code></a></td>
<td>Current credit balance, plan, and usage history.</td>
<td>0 credits</td>
</tr>

<tr><td colspan="3"><span class="mcp-cluster-tag">Talent</span> — jobs, candidates, hiring signals</td></tr>

<tr>
<td><a href="/mcp/tools/search-jobs/"><code>search_jobs</code></a></td>
<td>Cross-platform job search across 14 sources (LinkedIn, Indeed, Wellfound, Glassdoor, Adzuna, Reed, Monster, ZipRecruiter, SimplyHired, Naukri, RemoteOK, Cutshort, Google Jobs, Career Sites).</td>
<td>18–26 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/search-candidates/"><code>search_candidates</code></a></td>
<td>LinkedIn candidate finder by skills, seniority, location, current company.</td>
<td>3 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/get-company-employees/"><code>get_company_employees</code></a></td>
<td>Pull employees of a target company, filtered by seniority.</td>
<td>3 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/find-decision-makers/"><code>find_decision_makers</code></a></td>
<td>Buying-committee mapping: VPs, Directors, Heads-of for any role family.</td>
<td>3 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/find-hiring/"><code>find_hiring</code></a></td>
<td>Companies actively hiring for a role/location across LinkedIn + Indeed + Naukri + Wellfound.</td>
<td>6–10 credits</td>
</tr>

<tr><td colspan="3"><span class="mcp-cluster-tag">Competitive</span> — intel, comparisons, brand</td></tr>

<tr>
<td><a href="/mcp/tools/track-competitor/"><code>track_competitor</code></a></td>
<td>8-source company brief: G2 + Capterra + Trustpilot + AmbitionBox + LinkedIn jobs + employees + ProductHunt + Google News.</td>
<td>15 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/compare-products/"><code>compare_products</code></a></td>
<td>Side-by-side comparison from G2 + Capterra reviews and ratings.</td>
<td>8 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/monitor-brand/"><code>monitor_brand</code></a></td>
<td>Brand sentiment across Trustpilot + Reddit + Yelp + Google News with lookback window.</td>
<td>6 credits</td>
</tr>

<tr><td colspan="3"><span class="mcp-cluster-tag">Business</span> — local, B2B, India compliance</td></tr>

<tr>
<td><a href="/mcp/tools/search-businesses/"><code>search_businesses</code></a></td>
<td>Local business search: Google Maps + JustDial + IndiaMart, with phone, address, ratings.</td>
<td>1–3 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/verify-business/"><code>verify_business</code></a></td>
<td>India compliance check: GST, MCA, IBBI registration status.</td>
<td>1–2 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/enrich-company/"><code>enrich_company</code></a></td>
<td>Reviews + employer ratings (Trustpilot, AmbitionBox, Glassdoor) for one company.</td>
<td>4–6 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/find-suppliers-india/"><code>find_suppliers_india</code></a></td>
<td>India suppliers from IndiaMart + JustDial cross-validated against GST registry.</td>
<td>4–6 credits</td>
</tr>

<tr><td colspan="3"><span class="mcp-cluster-tag">Ecommerce</span> — products, pricing, arbitrage</td></tr>

<tr>
<td><a href="/mcp/tools/search-products/"><code>search_products</code></a></td>
<td>Cross-marketplace product search: Amazon + AliExpress + Flipkart + Noon + Shopify.</td>
<td>4–10 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/track-pricing/"><code>track_pricing</code></a></td>
<td>One product, multiple marketplaces — instant pricing snapshot.</td>
<td>4–8 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/find-arbitrage/"><code>find_arbitrage</code></a></td>
<td>AliExpress → Amazon/Noon margin opportunities, sortable by spread.</td>
<td>4–8 credits</td>
</tr>

<tr><td colspan="3"><span class="mcp-cluster-tag">Real estate</span> — listings + market analytics</td></tr>

<tr>
<td><a href="/mcp/tools/search-properties/"><code>search_properties</code></a></td>
<td>Property listings across NoBroker + MagicBricks + 99acres + CommonFloor (India).</td>
<td>8 credits</td>
</tr>
<tr>
<td><a href="/mcp/tools/analyze-property-market/"><code>analyze_property_market</code></a></td>
<td>Market summary: median, p25, p75, listing counts, optional rent-yield calc.</td>
<td>6–12 credits</td>
</tr>

</tbody>
</table>

## Pricing

Pay-per-result, no subscription required.

- **100 free credits on signup.** No credit card. Usually enough for ~30 tool calls.
- **$0.01 per credit** beyond the free tier. Top up in $10 / $50 / $200 packs at <a href="https://thirdwatch.dev/mcp/credits">thirdwatch.dev/mcp/credits</a>.
- **No per-tool subscription.** A `search_candidates` call (3 credits) costs $0.03. A `search_jobs` call across 14 sources (~22 credits) costs ~$0.22.
- **`estimate_cost` is free** — preview before you spend.
- **Ranged pricing** is exact: a 14-source `search_jobs` returning 30 results costs less than the same query asking for 100 results.

For predictable, line-item pricing, this beats Apollo ($30K/yr seats), Sales Navigator ($1.6K/yr/seat), Helium 10 ($1.2K/yr) on flexibility, and is cheaper for any usage under ~50 searches/day.

## FAQ

<div class="mcp-faq">

<details open>
<summary>Which clients does this work with?</summary>
<p>Any MCP-compatible client. Verified: <strong>Claude.ai (web + desktop)</strong> as a Custom Connector, <strong>Claude Code</strong> via <code>~/.claude.json</code>, and <strong>Cursor</strong> via <code>~/.cursor/mcp.json</code>. The transport is HTTPS streamable; bearer auth via <code>Authorization: Bearer &lt;your-key&gt;</code>.</p>
</details>

<details>
<summary>How fresh is the data?</summary>
<p>Every tool runs the underlying Apify actor on demand — there is no stale cache. A <code>search_jobs</code> call right now hits LinkedIn, Indeed, Naukri, etc. live. End-to-end latency is typically 8–25s for talent tools, 5–12s for ecommerce, 3–8s for businesses.</p>
</details>

<details>
<summary>What countries are covered?</summary>
<p>Most tools are global. Real estate is currently India + UK. India compliance (<code>verify_business</code>) is India-only. Naukri, JustDial, IndiaMart, AmbitionBox, Cutshort are India-focused. Reed is UK. Adzuna covers 13 countries. LinkedIn, Indeed, Amazon, AliExpress, Google Maps work in 100+ countries.</p>
</details>

<details>
<summary>Is the data legal to use?</summary>
<p>All tools query publicly accessible data. Thirdwatch does not bypass logins, scrape paywalled content, or store personal data beyond the result of your query. You are responsible for downstream compliance (GDPR for EU contact data, CCPA for CA, etc.). For high-volume contact enrichment workflows, talk to us about a data-processing addendum.</p>
</details>

<details>
<summary>What if a search returns 0 results?</summary>
<p>You don't pay. We charge per <em>useful</em> result, not per call. Failed runs (CAPTCHA, source down) are also free.</p>
</details>

<details>
<summary>Can I self-host?</summary>
<p>Not yet — the MCP server orchestrates 54 actor deployments + a credits ledger + a router model. Self-host is on the roadmap for enterprise customers; ping support if you need it.</p>
</details>

<details>
<summary>What are the rate limits?</summary>
<p>5 concurrent requests per API key, 1000 requests/hour. Higher limits on annual plans. Each tool run is itself a 5–25s job, so concurrency rarely binds in practice.</p>
</details>

<details>
<summary>How does this compare to Apify's MCP server?</summary>
<p>Apify's MCP exposes one actor per tool — you have to know which actor, fill its input schema, and stitch results yourself. Thirdwatch MCP exposes <em>workflows</em>: <code>search_jobs</code> hits 14 actors and merges. <code>track_competitor</code> hits 8. The model picks tools and arguments; you ask for outcomes.</p>
</details>

<details>
<summary>What does it cost vs. Apollo / Sales Navigator?</summary>
<p>Apollo Pro = $99/user/month. Sales Navigator Core = $99/user/month. ZoomInfo = $14K+/yr. Thirdwatch MCP at moderate use (~200 searches/month, 4 credits avg) = $8/month. At heavy use (50 searches/day, 8 credits avg) = $120/month for one user, with no seat caps and no contact-export limits.</p>
</details>

</div>

## Ready to ship?

<div class="mcp-cta-row">
  <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get an API key — 100 free credits</a>
  <a class="mcp-cta-secondary" href="mailto:support@thirdwatch.dev">Talk to us</a>
</div>
