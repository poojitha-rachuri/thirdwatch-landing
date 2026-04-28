---
title: "The recruiter's MCP — replace Sales Nav + Apollo with AI-native search"
description: "Source candidates, decision-makers, and hiring signals from Claude. 14-source job search, LinkedIn-grade candidate finder, employee maps. Pay $0.03 a search."
path: "mcp/use-cases/recruiters/"
type: "mcp-use-case"
icp: "recruiter"
keywords: "ai recruiter tools, claude mcp recruiter, sales navigator alternative, linkedin recruiter alternative, candidate sourcing mcp, ai sourcing"
---

<section class="mcp-hero">
  <h1>The recruiter's MCP</h1>
  <p class="tagline">Replace LinkedIn Recruiter, Sales Navigator, and Apollo with one Claude prompt. 14-source cross-platform job search, candidate finder, employee maps, decision-maker mapping. Pay-per-search.</p>
  <div class="mcp-cta-row">
    <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get an API key</a>
    <a class="mcp-cta-secondary" href="/mcp/">All 20 tools</a>
  </div>
</section>

## The problem with current recruiting tools

LinkedIn Recruiter is **$13.5K/yr per seat**. Sales Navigator is **$1.6K/yr per seat**. Apollo is **$1.2K/yr per seat**. Each one is single-source, has hard contact-export caps, and forces you into a UI rather than a workflow. None of them speak to your AI agents — and none of them aggregate Indeed, Naukri, Wellfound, Glassdoor, or Cutshort, where most non-LinkedIn-native talent actually lives.

The deeper issue: **sourcing is a workflow, not a search box**. You don't just want "candidates matching X." You want: companies hiring this role → their decision makers → the candidates they target → adjacent talent at competitors → who's posting from where. Five tools, twelve tabs, an afternoon.

## How the Thirdwatch MCP fixes it

Six tools, one Claude session.

- `search_jobs` — 14-source aggregation. The same query hits LinkedIn, Indeed, Wellfound, Glassdoor, Adzuna, Reed, Monster, ZipRecruiter, SimplyHired, Naukri, RemoteOK, Cutshort, Google Jobs, and Career Sites in parallel. Filter by salary, seniority, posted-within, remote-only.
- `search_candidates` — LinkedIn candidate finder. Skills + seniority + location + current company. 3 credits = $0.03.
- `get_company_employees` — pull every employee at a target company, optionally filtered by seniority. 3 credits.
- `find_decision_makers` — who decides? VPs/Directors/Heads-of for a role family at a target company. 3 credits.
- `find_hiring` — companies actively hiring for X in Y, cross-platform. Use this to source ABM lists.
- `enrich_company` — Glassdoor + AmbitionBox + Trustpilot for one company, so you know the employer brand before you pitch a candidate.

## 5 example prompts

Drop these straight into Claude.

> **"Find me 20 staff-level Python engineers in Berlin who worked at FAANG for at least 3 years, currently at a Series B startup, open to remote."**
>
> Claude routes to `search_candidates(query="staff Python engineer FAANG", location="Berlin", years_min=3)` then filters by current_company. ~30s, ~$0.03.

> **"List 50 Series A–B SaaS companies in NYC actively hiring DevRel engineers, then pull their VP of Engineering."**
>
> Claude calls `find_hiring("devrel", "NYC")` then loops `find_decision_makers(company_url, target_roles=["VP Engineering"])`. Returns a CSV-shaped lead list. ~$1.50 for 50 companies × 1 contact each.

> **"Show me senior backend engineers who left Stripe in the last 90 days based on LinkedIn job-change signals."**
>
> Claude uses `get_company_employees(stripe.com, seniority=senior)` and cross-references with Stripe's current employee list to find delta. ~$0.06.

> **"Search jobs: senior data engineer, Bay Area, base &gt;= $200K, posted in last 7 days, exclude crypto. Aggregate from all 14 sources, deduplicate by company+title."**
>
> One `search_jobs` call. ~$0.22 for 22 credits, returns 60–120 deduplicated postings.

> **"Pre-call brief: I'm sourcing for Linear. Pull their Glassdoor + AmbitionBox + Trustpilot scores so I can pitch the role honestly."**
>
> `enrich_company("linear.app")`. ~$0.05.

## Output shape (search_candidates)

```json
{
  "query": "staff Python engineer FAANG",
  "location": "Berlin",
  "results": [
    {
      "name": "Anika R.",
      "headline": "Staff Engineer @ Pitch · ex-Google, Stripe",
      "current_company": "Pitch",
      "current_title": "Staff Software Engineer",
      "linkedin_url": "https://linkedin.com/in/...",
      "location": "Berlin, Germany",
      "skills": ["Python", "Distributed systems", "Kubernetes"],
      "experience_years": 11,
      "previous_companies": ["Google", "Stripe"]
    }
  ],
  "total": 23,
  "credits_charged": 3
}
```

## Thirdwatch MCP vs. recruiting incumbents

<table class="mcp-comparison">
<thead>
<tr>
  <th>Capability</th>
  <th>LinkedIn Recruiter</th>
  <th>Sales Nav</th>
  <th>Apollo</th>
  <th>Thirdwatch MCP</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Annual cost (1 seat, moderate use)</td>
  <td>$13,500</td>
  <td>$1,576</td>
  <td>$1,188</td>
  <td class="yes">~$240</td>
</tr>
<tr>
  <td>Candidate sourcing (LinkedIn)</td>
  <td class="yes">Yes</td>
  <td class="yes">Yes</td>
  <td class="partial">Limited</td>
  <td class="yes">Yes</td>
</tr>
<tr>
  <td>Cross-platform job aggregation (14 sources)</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">Yes</td>
</tr>
<tr>
  <td>India coverage (Naukri, Cutshort, AmbitionBox)</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="partial">Partial</td>
  <td class="yes">Native</td>
</tr>
<tr>
  <td>AI-agent native (works in Claude/Cursor)</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="partial">REST only</td>
  <td class="yes">MCP</td>
</tr>
<tr>
  <td>Contact export caps</td>
  <td class="no">Yes (~150/mo)</td>
  <td class="no">Yes (~1.5K/mo)</td>
  <td class="no">Tier-gated</td>
  <td class="yes">None</td>
</tr>
<tr>
  <td>Pay only for results</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="no">No</td>
  <td class="yes">Yes</td>
</tr>
</tbody>
</table>

## Why it works for recruiters specifically

1. **It's a workflow, not a search box.** Most sourcing failures aren't "couldn't find candidate" — they're "found 200 candidates, can't qualify them, no employer-brand context, no hiring-context for outreach." Thirdwatch MCP gives you the surrounding context in the same prompt.
2. **No seat economics.** One API key powers a recruiter pod, an outsourced sourcing team, and your boss who wants to spot-check.
3. **It plays well with your ATS.** Output is JSON. Drop into Greenhouse, Ashby, Recruitee — or feed back into Claude to draft personalized outreach.
4. **India-native.** If you hire in India, you cannot ignore Naukri (50M+ resumes), AmbitionBox (employer reviews), and Cutshort (startup talent). All three are first-class here.

## Get started

<div class="mcp-cta-row">
  <a class="mcp-cta-primary" href="https://thirdwatch.dev/mcp/register">Get 100 free credits</a>
  <a class="mcp-cta-secondary" href="/mcp/tools/search-candidates/">Read search_candidates docs</a>
</div>
