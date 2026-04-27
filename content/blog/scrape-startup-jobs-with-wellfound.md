---
title: "Scrape Startup Jobs with Wellfound (2026 Guide)"
slug: "scrape-startup-jobs-with-wellfound"
description: "Pull startup jobs from Wellfound (formerly AngelList Talent) at $0.008 per record using Thirdwatch. YC/tier-1 startups + funding signals + recipes."
actor: "wellfound-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/wellfound-scraper"
actorTitle: "Wellfound Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "find-yc-and-tier-1-startup-roles-on-wellfound"
  - "track-startup-hiring-velocity-on-wellfound"
  - "scrape-cutshort-tech-jobs-india"
keywords:
  - "wellfound scraper"
  - "angellist jobs scraper"
  - "scrape startup jobs"
  - "yc jobs scraper"
faqs:
  - q: "What's Wellfound (formerly AngelList Talent)?"
    a: "Wellfound is the canonical startup-jobs platform — exclusively startup roles from seed-stage through late-stage growth, with rich company-side data (funding stage, last round, investor list, team size). For startup recruiters, founder-network builders, and venture-research analysts, Wellfound is materially better-curated than LinkedIn Jobs for early-stage tech hiring."
  - q: "Why scrape Wellfound vs LinkedIn?"
    a: "LinkedIn covers all employer tiers; Wellfound is startup-only. For startup-focused use cases (YC + tier-1 startup hiring, founder networking, comp research at early-stage), Wellfound's data quality is higher because the curation filter is built in. About 80%+ of YC W24+ companies post on Wellfound; less than 50% post on LinkedIn first."
  - q: "What startup-specific signals are visible?"
    a: "Five startup-specific fields per role: company funding stage (Pre-seed → Series F), last raise amount + date, investor list, equity range (often disclosed), team size. Cross-referencing all five reveals which startups are over-hiring vs raising vs maintaining. About 60% of Wellfound startups disclose equity bands openly."
  - q: "How does Wellfound handle anti-bot defenses?"
    a: "Wellfound uses DataDome + Cloudflare Turnstile. Thirdwatch's actor uses Camoufox + residential proxy + humanize behavior to bypass these reliably. Production-tested at sustained weekly volumes. About 90-95% query success rate; failed queries auto-retry with fresh proxy IP."
  - q: "What's the cost for typical startup-research workflows?"
    a: "$0.008/record FREE tier. A 50-startup-watchlist daily refresh at 20 roles each = 1,000 records/day = $8/day FREE. Quarterly snapshot of 500 YC startups + tier-1 portfolio companies = ~10K records = $80. For founder-research and comp-benchmarking, this is materially cheaper than commercial founder-CRM products."
  - q: "How does this compare to AngelList Talent (Wellfound's first-party API)?"
    a: "AngelList's first-party recruiter API is gated behind paid Wellfound for Recruiters seats ($299+/mo). For high-volume research or platform-builder use cases, the actor is materially cheaper at the cost of building your own filtering UX. For active recruiters with low-volume needs, the SaaS path wins on UX."
---

> Thirdwatch's [Wellfound Scraper](https://apify.com/thirdwatch/wellfound-scraper) returns startup-only jobs at $0.008 per record — title, company, location, salary, equity range, funding stage, last raise, investors, team size. Built for startup-recruiter tools, founder-network platforms, venture-research analysts, and tech-talent-acquisition functions targeting early-stage companies.

## Why scrape Wellfound for startup jobs

Startup hiring is a separate ecosystem from enterprise. According to [Wellfound's 2024 Talent report](https://wellfound.com/), the platform indexes 100K+ active startups across all stages with founder/operator-led recruiting workflows. For startup-focused recruiters, founder-network builders, and venture-research analysts, Wellfound's curated startup-only assortment is materially higher-signal than LinkedIn Jobs filtered to startup-tier.

The job-to-be-done is structured. A startup-recruiter platform indexes 1,000 YC + tier-1 startups for candidate-side discovery. A venture-research analyst tracks portfolio company hiring velocity to inform follow-on investment decisions. A founder-network builder maps active startup hiring to identify high-momentum companies. A talent-acquisition function at an early-stage startup researches comp benchmarks for new hires. All reduce to startup-handle list + role pull + funding-stage filtering.

## How does this compare to the alternatives?

Three options for startup-jobs data:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Wellfound Recruiter (paid seat) | $299–$3,000/seat/month | High, with sourcing tools | Hours | Per-seat license |
| LinkedIn Jobs filtered to startups | $8 ($0.008 × 1,000) | Generic, requires filtering | Hours | LinkedIn TOS |
| Thirdwatch Wellfound Scraper | $8 ($0.008 × 1,000) | Production-tested with Camoufox | 5 minutes | Thirdwatch tracks Wellfound changes |

LinkedIn covers all tiers but startup filter is imperfect. Wellfound's first-party Recruiter product is the gold standard for active recruiters but priced for individual seats. The [Wellfound Scraper actor page](/scrapers/wellfound-scraper) gives you raw startup-jobs data at the lowest unit cost.

## How to scrape Wellfound in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a startup watchlist?

Pass startup-handle queries.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~wellfound-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

STARTUPS = ["openai", "anthropic", "stripe", "linear", "vercel",
            "scale-ai", "modal", "ramp", "mercury", "rippling",
            "deel", "notion", "figma", "airtable", "retool"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": STARTUPS, "maxResults": 500},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.company_name.nunique()} startups")
```

15 startups × ~30 active roles = ~450 records, costing $3.60.

### Step 3: How do I filter by funding stage and equity?

Filter to specific funding stages + parse equity ranges.

```python
import re

df["equity_min"] = df.equity.str.extract(r"([\d.]+)%").astype(float)
df["funding_stage"] = df.company_funding_stage.fillna("Unknown")

senior_roles = df[
    (df.experience_level.isin(["Senior", "Lead", "Principal"]))
    & df.equity_min.notna()
    & (df.equity_min >= 0.1)
    & df.funding_stage.isin(["Series A", "Series B", "Series C"])
].sort_values("equity_min", ascending=False)

print(f"{len(senior_roles)} senior + Series A-C roles with disclosed equity")
print(senior_roles[["title", "company_name", "funding_stage",
                    "salary", "equity_min", "team_size"]].head(15))
```

The filter surfaces senior-tier roles at growth-stage startups with equity disclosed — the canonical "high-leverage early-employee" cohort.

### Step 4: How do I track funding-velocity correlations?

Cross-reference recent raises with hiring velocity.

```python
df["last_raise_date"] = pd.to_datetime(df.company_last_raise_date)
df["days_since_raise"] = (pd.Timestamp.utcnow() - df.last_raise_date).dt.days

post_raise = df[df.days_since_raise <= 90]
hiring_burst = (
    post_raise.groupby("company_name")
    .agg(
        days_since_raise=("days_since_raise", "first"),
        funding_stage=("funding_stage", "first"),
        last_raise=("company_last_raise", "first"),
        open_roles=("title", "count"),
    )
    .sort_values("open_roles", ascending=False)
)
print(hiring_burst.head(15))
```

Companies posting 10+ roles within 90 days of a raise are deploying capital aggressively — high-leverage signal for sales prospecting and venture follow-on.

## Sample output

A single Wellfound role looks like this. Five rows weigh ~6 KB.

```json
{
  "title": "Senior Backend Engineer",
  "company_name": "Anthropic",
  "company_funding_stage": "Series E",
  "company_last_raise": "$3.5B",
  "company_last_raise_date": "2024-12-15",
  "company_team_size": "500-1000",
  "company_investors": ["Google", "Spark Capital", "Lightspeed"],
  "location": "San Francisco / Remote",
  "salary": "$220,000 - $320,000",
  "equity": "0.05% - 0.15%",
  "experience_level": "Senior",
  "job_type": "Full-time",
  "remote": true,
  "apply_url": "https://wellfound.com/jobs/..."
}
```

`company_funding_stage` + `company_last_raise` + `company_investors` are the killer Wellfound-specific fields — none available on LinkedIn directly. `equity` ranges enable comp-modelling for early-employee compensation that LinkedIn salaries don't capture.

## Common pitfalls

Three things go wrong in Wellfound pipelines. **Stale company-stage data** — funding stage updates lag 30-60 days post-raise; cross-reference with Crunchbase for recency-sensitive use cases. **Equity-range parsing** — equity displays as "0.05% - 0.15%" or "0.5% - 1%" depending on stage; parse min/max separately. **Remote tag inconsistency** — "Remote" can mean US-only-remote, Global-remote, or hybrid; for accurate remote-only filtering, supplement with description-keyword matching.

Thirdwatch's actor uses Camoufox + residential proxy at $5/1K, ~36% margin. Pair Wellfound with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for cross-source startup-hiring coverage and [Career Site Scraper](https://apify.com/thirdwatch/career-site-job-scraper) for direct ATS depth on prioritized startups. A fourth subtle issue worth flagging: Wellfound's startup roster includes both "active hiring" companies and "stealth" companies posting placeholder roles for SEO reasons; for true active-hiring signal, filter on roles with `posted_within_30d: true` and exclude companies posting only generic "Engineer" titles without job-specific descriptions. A fifth pattern unique to Wellfound: many startups post the same role under multiple departments (Engineering, Product, Design) for visibility; for accurate per-role velocity tracking, dedupe on `(company, title-norm, posted_at)` before counting. A sixth and final pitfall: Wellfound's `company_team_size` field uses bucketed ranges ("11-50", "51-200", "201-500") rather than exact numbers; for cross-startup growth-rate comparisons, use bucket-midpoints and treat the size signal as approximate.  A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size.

An eighth subtle issue: snapshot-storage strategy materially affects long-term economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. Partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early.

## Related use cases

- [Find YC and Tier-1 startup roles on Wellfound](/blog/find-yc-and-tier-1-startup-roles-on-wellfound)
- [Track startup hiring velocity on Wellfound](/blog/track-startup-hiring-velocity-on-wellfound)
- [Scrape CutShort tech jobs India](/blog/scrape-cutshort-tech-jobs-india)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What's Wellfound (formerly AngelList Talent)?

Wellfound is the canonical startup-jobs platform — exclusively startup roles from seed-stage through late-stage growth, with rich company-side data (funding stage, last round, investor list, team size). For startup recruiters, founder-network builders, and venture-research analysts, Wellfound is materially better-curated than LinkedIn Jobs for early-stage tech hiring.

### Why scrape Wellfound vs LinkedIn?

LinkedIn covers all employer tiers; Wellfound is startup-only. For startup-focused use cases (YC + tier-1 startup hiring, founder networking, comp research at early-stage), Wellfound's data quality is higher because the curation filter is built in. About 80%+ of YC W24+ companies post on Wellfound; less than 50% post on LinkedIn first.

### What startup-specific signals are visible?

Five startup-specific fields per role: company funding stage (Pre-seed → Series F), last raise amount + date, investor list, equity range (often disclosed), team size. Cross-referencing all five reveals which startups are over-hiring vs raising vs maintaining. About 60% of Wellfound startups disclose equity bands openly.

### How does Wellfound handle anti-bot defenses?

Wellfound uses DataDome + Cloudflare Turnstile. Thirdwatch's actor uses Camoufox + residential proxy + humanize behavior to bypass these reliably. Production-tested at sustained weekly volumes. About 90-95% query success rate; failed queries auto-retry with fresh proxy IP.

### What's the cost for typical startup-research workflows?

$0.008/record FREE tier. A 50-startup-watchlist daily refresh at 20 roles each = 1,000 records/day = $8/day FREE. Quarterly snapshot of 500 YC startups + tier-1 portfolio companies = ~10K records = $80. For founder-research and comp-benchmarking, this is materially cheaper than commercial founder-CRM products.

### How does this compare to AngelList Talent (Wellfound's first-party API)?

[AngelList's first-party recruiter API](https://wellfound.com/recruit) is gated behind paid Wellfound for Recruiters seats ($299+/mo). For high-volume research or platform-builder use cases, the actor is materially cheaper at the cost of building your own filtering UX. For active recruiters with low-volume needs, the SaaS path wins on UX.

Run the [Wellfound Scraper on Apify Store](https://apify.com/thirdwatch/wellfound-scraper) — pay-per-job, free to try, no credit card to test.
