---
title: "Track Startup Hiring Velocity on Wellfound (2026)"
slug: "track-startup-hiring-velocity-on-wellfound"
description: "Detect startup-scaling signals via Wellfound at $0.008 per record using Thirdwatch. Daily snapshots + funding-cohort velocity tracking + alerts."
actor: "wellfound-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/wellfound-scraper"
actorTitle: "Wellfound Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-startup-jobs-with-wellfound"
  - "find-yc-and-tier-1-startup-roles-on-wellfound"
  - "track-headcount-changes-at-target-accounts"
keywords:
  - "startup hiring velocity"
  - "wellfound hiring tracker"
  - "venture-research hiring data"
  - "yc startup hiring signals"
faqs:
  - q: "Why track startup hiring velocity specifically?"
    a: "Startup hiring velocity is the strongest leading indicator of company-stage progression. According to YC's 2024 alumni research, startups posting 3x+ roles within 30 days post-raise correlate with 50%+ higher Series-A-progression rates. For VC analysts, founder-network builders, and startup-recruiter agencies, hiring velocity is the canonical signal of strategic momentum."
  - q: "What velocity threshold matters?"
    a: "A 3x increase in open roles within 30 days post-funding-event is the canonical 'scaling signal' threshold. Below 1.5x is normal cadence; above 5x is hyper-scaling (often follows large Series B/C rounds). Combine with company_funding_stage filter — Series A+ startups posting 5+ roles within 30 days of raise are deploying capital aggressively."
  - q: "How fresh do velocity signals need to be?"
    a: "For VC daily-screening of portfolio companies, daily cadence catches velocity onset within 24h. For founder-network builders, weekly cadence is sufficient. For startup-recruiter platforms timing candidate-outreach to scaling cohorts, daily during active fundraise windows. Most startup hiring velocity events sustain for 60-90 days post-raise before normalizing."
  - q: "Can I cross-reference with funding announcements?"
    a: "Yes. Wellfound's `company_last_raise_date` enables direct cross-reference with hiring velocity. Filter to companies with `(days_since_raise <= 90) AND (open_roles >= 5)` for active-deployment signal. For richer correlation, supplement with Crunchbase or PitchBook funding data."
  - q: "What's the best alerting threshold?"
    a: "Tier 1 alerts (immediate): Series A+ company posting 10+ roles within 30 days post-raise. Tier 2 alerts (weekly): Series A+ posting 5-9 roles within 30 days. Tier 3 alerts (monthly): pre-Series-A posting 3+ roles within 30 days. Tier 1 + 2 combined typically generate 5-15 high-signal alerts per week across a 200-startup watchlist."
  - q: "How does this compare to AngelList Talent + LinkedIn?"
    a: "Wellfound (formerly AngelList Talent) is startup-only with structured funding fields; LinkedIn covers all employer tiers but lacks Wellfound's funding-stage + last-raise structured data. For startup-velocity research specifically, Wellfound is materially better-curated. For broader hiring-velocity coverage at non-startup employers, LinkedIn is essential."
---

> Thirdwatch's [Wellfound Scraper](https://apify.com/thirdwatch/wellfound-scraper) makes startup hiring-velocity tracking a structured workflow at $0.008 per record — daily snapshots, funding-cohort velocity computation, scaling-signal alerts, post-raise hiring detection. Built for VC analysts, founder-network builders, startup-recruiter platforms, and venture-research analysts tracking startup-momentum signals.

## Why track startup hiring velocity

Startup hiring velocity is the strongest publicly-observable scaling signal. According to [Wellfound's 2024 Talent report](https://wellfound.com/), startups in active hiring-velocity phase (3x+ roles posted within 30 days) progress to next-stage funding at materially higher rates than peer companies. For VC analysts tracking portfolio-company momentum, startup-recruiter platforms timing candidate outreach, and founder-network builders mapping high-momentum companies, hiring velocity is the canonical signal.

The job-to-be-done is structured. A VC analyst tracks 200 portfolio companies daily for hiring-velocity signals. A startup-recruiter platform flags scaling-cohort companies for active candidate outreach. A founder-network builder maps high-velocity startups for community curation. A venture-research analyst studies post-raise capital-deployment patterns across funding stages. All reduce to startup-handle list + daily snapshot + cross-snapshot velocity computation.

## How does this compare to the alternatives?

Three options for startup hiring-velocity data:

| Approach | Cost per 100 startups daily | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Crunchbase Pro | $1,000/seat/year | Limited hiring depth | Hours | Per-seat license |
| PitchBook Enterprise | $20K-$50K/year | Authoritative | Weeks | Annual contract |
| Thirdwatch Wellfound Scraper | ~$24/day ($0.008 × 3K) | Camoufox + residential | 5 minutes | Thirdwatch tracks Wellfound changes |

PitchBook offers comprehensive startup data at the high end. The [Wellfound Scraper actor page](/scrapers/wellfound-scraper) gives you raw hiring data at the lowest unit cost.

## How to track velocity in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com), copy your API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a portfolio watchlist daily?

Pass startup-handle queries.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~wellfound-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PORTFOLIO = ["openai", "anthropic", "scale-ai", "modal", "ramp",
             "mercury", "rippling", "deel", "linear", "vercel",
             "notion", "figma", "airtable", "retool", "stripe"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": PORTFOLIO, "maxResults": 500},
    timeout=3600,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/wellfound-portfolio-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} roles across {len(PORTFOLIO)} portfolio companies")
```

15 startups × ~30 active roles each = ~450 daily records, costing $3.60.

### Step 3: How do I compute hiring velocity?

Per-startup velocity vs prior 30-day baseline.

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/wellfound-portfolio-*.json"))
dfs = []
for s in snapshots:
    df = pd.DataFrame(json.loads(open(s).read()))
    df["snapshot_date"] = pd.to_datetime(s.split("-")[-1].split(".")[0])
    dfs.append(df)

all_df = pd.concat(dfs, ignore_index=True).drop_duplicates(subset=["apply_url", "snapshot_date"])
daily = all_df.groupby(["company_name", "snapshot_date"]).size().unstack(fill_value=0)

# Last 7d vs prior 30d baseline
last_7d = daily.iloc[:, -7:].mean(axis=1)
prior_30d = daily.iloc[:, -37:-7].mean(axis=1)
velocity = last_7d / prior_30d.replace(0, 1)

scaling = velocity[(velocity >= 3.0) & (last_7d >= 5)]
print(f"{len(scaling)} startups in active scaling phase (3x velocity, 5+ daily roles)")
```

3x velocity + 5+ daily roles = canonical "active scaling phase" — high-signal for VC follow-on + recruiter outreach timing.

### Step 4: How do I correlate with recent funding?

Cross-reference velocity with last-raise dates.

```python
import requests as r

latest = all_df[all_df.snapshot_date == all_df.snapshot_date.max()]
post_raise = latest.copy()
post_raise["last_raise_date"] = pd.to_datetime(post_raise.company_last_raise_date)
post_raise["days_since_raise"] = (pd.Timestamp.utcnow() - post_raise.last_raise_date).dt.days

post_raise_scaling = (
    post_raise[post_raise.days_since_raise <= 90]
    .groupby("company_name")
    .agg(
        days_since_raise=("days_since_raise", "first"),
        last_raise=("company_last_raise", "first"),
        funding_stage=("company_funding_stage", "first"),
        open_roles=("title", "count"),
    )
    .query("open_roles >= 10")
)

for company, row in post_raise_scaling.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":rocket: *{company}* ({row.funding_stage}, {row.last_raise}) "
                          f"posting {row.open_roles} roles {row.days_since_raise}d post-raise.")})
print(f"{len(post_raise_scaling)} post-raise scaling alerts")
```

Companies posting 10+ roles within 90 days post-raise = active capital-deployment phase, the highest-leverage VC + recruiter signal.

## Sample output

A single Wellfound role record looks like this. Five rows weigh ~6 KB.

```json
{
  "title": "Senior Software Engineer",
  "company_name": "Anthropic",
  "company_funding_stage": "Series E",
  "company_last_raise": "$3.5B",
  "company_last_raise_date": "2024-12-15",
  "company_team_size": "500-1000",
  "company_investors": ["Google", "Spark Capital"],
  "location": "San Francisco / Remote",
  "salary": "$220,000 - $320,000",
  "equity": "0.05% - 0.15%",
  "experience_level": "Senior",
  "remote": true,
  "apply_url": "https://wellfound.com/jobs/..."
}
```

`company_funding_stage` + `company_last_raise_date` enable direct correlation between hiring velocity and recent funding events — the canonical scaling-signal cross-reference.

## Common pitfalls

Three things go wrong in startup-velocity pipelines. **Funding-stage staleness** — Wellfound updates funding-stage data 30-60 days post-raise; cross-reference with Crunchbase for recency-sensitive use cases. **Re-listing inflation** — startups occasionally close + re-open roles for renewed visibility; smooth with 7-day rolling averages before alerting. **Cross-source dedup** — same role often appears on Wellfound + LinkedIn + company career page; for accurate velocity, dedupe on `(title, company, posted_at)` after merging sources.

Thirdwatch's actor uses Camoufox + residential proxy at $5/1K, ~36% margin. Pair Wellfound with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for cross-source startup-hiring coverage. A fourth subtle issue worth flagging: stealth-mode startups (often pre-launch) intentionally hide funding-stage data even when posting roles; for accurate stealth-startup detection, supplement with founder LinkedIn-profile cross-reference. A fifth pattern unique to startup velocity: layoff events trigger sharp negative-velocity (5+ roles closed within 30 days) followed by 60-90 days of hiring freeze — for accurate momentum-tracking, distinguish hiring-freeze (no postings) from hiring-decline (active reduction). A sixth and final pitfall: stagewise scaling differs — Series A startups scale 3-5x in 6-12 months while Series C+ scale more linearly. Calibrate velocity-thresholds per stage rather than applying uniform thresholds.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. Startup hiring data changes faster than enterprise — daily polling on Tier 1 (active portfolio targets) + weekly on Tier 2 (broader founder network) covers most use cases. 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive velocity metrics — particularly useful as your funding-stage classifier evolves. Compress with gzip at write-time.

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Wellfound schema occasionally changes during platform UI revisions — catch drift early. Cross-snapshot diff alerts on funding-stage changes (Series A → Series B) catch capital-event signals that pure aggregate-trend monitoring misses.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression for end-to-end pipeline-cost reductions of 70%+ at scale. This pattern is particularly important when scaling beyond 100K records per snapshot.

## Related use cases

- [Scrape startup jobs with Wellfound](/blog/scrape-startup-jobs-with-wellfound)
- [Find YC and Tier-1 startup roles on Wellfound](/blog/find-yc-and-tier-1-startup-roles-on-wellfound)
- [Track headcount changes at target accounts](/blog/track-headcount-changes-at-target-accounts)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track startup hiring velocity specifically?

Startup hiring velocity is the strongest leading indicator of company-stage progression. According to YC's 2024 alumni research, startups posting 3x+ roles within 30 days post-raise correlate with 50%+ higher Series-A-progression rates. For VC analysts, founder-network builders, and startup-recruiter agencies, hiring velocity is the canonical signal of strategic momentum.

### What velocity threshold matters?

A 3x increase in open roles within 30 days post-funding-event is the canonical "scaling signal" threshold. Below 1.5x is normal cadence; above 5x is hyper-scaling (often follows large Series B/C rounds). Combine with `company_funding_stage` filter — Series A+ startups posting 5+ roles within 30 days of raise are deploying capital aggressively.

### How fresh do velocity signals need to be?

For VC daily-screening of portfolio companies, daily cadence catches velocity onset within 24h. For founder-network builders, weekly cadence is sufficient. For startup-recruiter platforms timing candidate-outreach to scaling cohorts, daily during active fundraise windows. Most startup hiring velocity events sustain for 60-90 days post-raise before normalizing.

### Can I cross-reference with funding announcements?

Yes. Wellfound's `company_last_raise_date` enables direct cross-reference with hiring velocity. Filter to companies with `(days_since_raise <= 90) AND (open_roles >= 5)` for active-deployment signal. For richer correlation, supplement with Crunchbase or PitchBook funding data.

### What's the best alerting threshold?

Tier 1 alerts (immediate): Series A+ company posting 10+ roles within 30 days post-raise. Tier 2 alerts (weekly): Series A+ posting 5-9 roles within 30 days. Tier 3 alerts (monthly): pre-Series-A posting 3+ roles within 30 days. Tier 1 + 2 combined typically generate 5-15 high-signal alerts per week across a 200-startup watchlist.

### How does this compare to AngelList Talent + LinkedIn?

Wellfound (formerly AngelList Talent) is startup-only with structured funding fields; LinkedIn covers all employer tiers but lacks Wellfound's funding-stage + last-raise structured data. For startup-velocity research specifically, Wellfound is materially better-curated. For broader hiring-velocity coverage at non-startup employers, LinkedIn is essential.

Run the [Wellfound Scraper on Apify Store](https://apify.com/thirdwatch/wellfound-scraper) — pay-per-record, free to try, no credit card to test.
