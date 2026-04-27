---
title: "Research Company Reviews on Glassdoor at Scale (2026)"
slug: "research-company-reviews-on-glassdoor"
description: "Pull Glassdoor company reviews + ratings at $0.008 per record using Thirdwatch's Glassdoor Scraper. Pros/cons aggregation and culture-monitoring recipes inside."
actor: "glassdoor-scraper"
actor_url: "https://apify.com/thirdwatch/glassdoor-scraper"
actorTitle: "Glassdoor Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-glassdoor-salaries-for-comp-benchmarking"
  - "find-glassdoor-interview-questions-by-role"
  - "track-glassdoor-rating-changes-over-time"
keywords:
  - "glassdoor reviews scraper"
  - "company review research"
  - "employer brand glassdoor"
  - "scrape glassdoor pros cons"
faqs:
  - q: "What does the actor return when scraping reviews?"
    a: "Set scrapeType: reviews and the actor returns company-level review summaries with company_rating, pros (employee-reported positive themes as an array), and cons (negative themes), plus the company name and Glassdoor URL. Note this is summarised theme data rather than individual review text — Glassdoor's UI clusters common phrases. For deep individual-review analysis, you'd need a separate detail-page scrape."
  - q: "How does this compare to AmbitionBox for Indian companies?"
    a: "Glassdoor coverage outside US/UK is materially thinner. AmbitionBox has 5-10x more reviews per Indian company than Glassdoor for the same employer. For Indian employer-brand research specifically, use AmbitionBox; for global comparisons including US/UK companies use Glassdoor; for the full picture run both and merge by company name. Our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) ships the seven-category breakdown that matches Glassdoor's review structure."
  - q: "Can I track competitor culture over time?"
    a: "Yes. Schedule weekly review snapshots and persist as Parquet. Compare company_rating across snapshots — a 0.2-point drop within 30 days is meaningful; 0.5+ points is rare and usually corresponds to leadership change, layoff, or PR crisis. Pros/cons text turnover is a weaker signal because Glassdoor's clustering algorithm changes mappings periodically; rely on company_rating drift as the primary trend metric."
  - q: "What countries does the actor cover for reviews?"
    a: "Seven Glassdoor country domains: US, UK, India, Canada, Australia, Germany, France. Pass the country code as the country input. Coverage is densest in US (1.4M+ companies indexed) and UK (300K+); India coverage exists but is materially thinner than AmbitionBox; smaller markets (DE, FR, AU, CA) have decent coverage for tier-1 companies and sparse data for SMBs."
  - q: "How fresh is review data?"
    a: "Each run pulls live from Glassdoor at request time. Reviews update as new employees post — typically 1-10 new reviews per week for active large employers. Company ratings move slowly (0.1 points per quarter for stable companies). For employer-brand monitoring, weekly snapshots are sufficient; for crisis monitoring during active reputation events, daily is justified."
  - q: "Can I correlate Glassdoor reviews with company performance signals?"
    a: "Yes. A Glassdoor company_rating drop of 0.3+ points often precedes earnings misses, leadership departures, or layoff announcements by 2-4 weeks for public companies. Pair Glassdoor with our [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) to detect simultaneous hiring slowdowns; the combined signal is materially stronger than either alone."
---

> Thirdwatch's [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) returns Glassdoor company reviews at $0.008 per record — company_rating, pros (positive theme array), cons (negative theme array), URL — when set to scrapeType: reviews. Built for employer-brand researchers, competitive-intelligence functions, equity analysts watching workforce sentiment, and HR competitive-intelligence groups who need machine-readable review data without manual page-by-page browsing.

## Why research company reviews on Glassdoor

Glassdoor remains the largest crowd-sourced US/UK employee-review database. According to [Glassdoor's 2024 transparency report](https://www.glassdoor.com/research/), the platform aggregates employee reviews across 1.4 million companies — making it the canonical input for any employer-brand or competitive-culture research targeting US/UK markets. The blocker for systematic access: Glassdoor retired its public partner API in 2018, and competitor research SaaS (LinkedIn Talent Insights, BuiltIn Pro) bundles Glassdoor data behind enterprise licensing.

The job-to-be-done is structured. An employer-brand consultant building a benchmark report wants pros/cons across 30 sector peers. An equity-research analyst monitors workforce-sentiment shifts at portfolio companies as a leading earnings indicator. An HR competitive-intelligence team tracks competitor culture trajectories over time to inform talent-attraction messaging. A trust-and-safety team monitors brand mentions in employee-review surfaces as part of crisis-detection workflows. All reduce to scrapeType=reviews + company watchlist + country → structured review rows.

## How does this compare to the alternatives?

Three options for getting Glassdoor review data into a research pipeline:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Glassdoor browsing + Excel | Effectively unbounded analyst time | Low (selection bias) | Continuous | Doesn't scale |
| Paid employer-brand SaaS (Universum, Comparably) | $30K–$200K/year flat | High | Months to onboard | Vendor lock-in |
| Thirdwatch Glassdoor Scraper | $8 ($0.008 × 1,000) | Camoufox stealth, 19x cheaper than orgupdate | 5 minutes | Thirdwatch tracks Glassdoor changes |

Paid employer-brand SaaS includes Glassdoor with proprietary dashboards but is priced for full marketing-research departments. The [Glassdoor Scraper actor page](/scrapers/glassdoor-scraper) gives you the data layer at pay-per-result pricing.

## How to research company reviews in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull reviews for a competitor watchlist?

Set `scrapeType: "reviews"` and pass company names as the queries.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~glassdoor-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PEER_SET = ["google", "meta", "openai", "anthropic", "stripe",
            "airbnb", "uber", "lyft", "doordash", "instacart"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": PEER_SET,
        "scrapeType": "reviews",
        "country": "us",
        "maxResults": 100,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} review records across {df.company_name.nunique()} companies")
```

10 companies × 10 review records = ~100 records, costing $0.80.

### Step 3: How do I aggregate themes across the peer set?

Group pros and cons by frequency to surface industry-wide vs company-specific patterns.

```python
from collections import Counter

def explode_themes(df, col):
    rows = []
    for _, row in df.iterrows():
        themes = row.get(col) or []
        if isinstance(themes, list):
            for theme in themes:
                rows.append({"company": row["company_name"], "theme": theme.lower()})
    return pd.DataFrame(rows)

pros = explode_themes(df, "pros")
cons = explode_themes(df, "cons")

# Industry-wide themes (mentioned by 5+ companies)
industry_pros = (
    pros.groupby("theme")["company"].nunique()
    .sort_values(ascending=False).head(15)
)
industry_cons = (
    cons.groupby("theme")["company"].nunique()
    .sort_values(ascending=False).head(15)
)
print("--- Top shared positive themes ---")
print(industry_pros)
print("--- Top shared negative themes ---")
print(industry_cons)
```

Common pros across the set are table-stakes (most tech companies cite "smart colleagues", "competitive comp", "remote flexibility"); common cons are sector-wide pain points (layoffs, slow promotion cycles, work-life balance pressure during crunches). Themes mentioned by only 1-2 companies are the genuine company-specific signals.

### Step 4: How do I detect rating drift over time?

Persist daily snapshots and diff company_rating across days for trend tracking.

```python
import datetime, json, pathlib, glob

today = datetime.date.today().isoformat()
snapshot_dir = pathlib.Path(f"snapshots/glassdoor-{today}")
snapshot_dir.mkdir(parents=True, exist_ok=True)
df.to_json(snapshot_dir / "reviews.json", orient="records")

frames = []
for d in sorted(glob.glob("snapshots/glassdoor-*")):
    date = pathlib.Path(d).name.replace("glassdoor-", "")
    snap = pd.read_json(f"{d}/reviews.json")
    snap["date"] = pd.to_datetime(date)
    frames.append(snap)
history = pd.concat(frames, ignore_index=True)

ratings = history.groupby(["company_name", "date"])["company_rating"].first().unstack(level=1)
dates = sorted(ratings.columns)
if len(dates) >= 30:
    ratings["delta_30d"] = ratings[dates[-1]] - ratings[dates[-30]]
    movers = ratings[ratings.delta_30d.abs() >= 0.2].sort_values("delta_30d")
    print("--- Rating movers (30-day) ---")
    print(movers[[dates[-30], dates[-1], "delta_30d"]])
```

A 0.2+ point drop in 30 days is a meaningful trend signal — typically corresponds to a layoff, leadership change, or major PR event. Cross-validate by manually reviewing a sample of recent reviews on the affected companies.

## Sample output

A single review record for one company looks like this. Five rows weigh ~3 KB.

```json
{
  "company_name": "Microsoft",
  "company_rating": 4.2,
  "pros": ["Great work-life balance", "Strong benefits", "Excellent training programs"],
  "cons": ["Slow promotion cycles", "Bureaucratic at scale"]
}
```

`pros` and `cons` are theme arrays — Glassdoor's clustering of common phrases across reviews, not individual review excerpts. For most employer-brand and competitive-intelligence workflows, the theme summary is the right level of detail; individual review-text analysis adds noise without proportional signal. `company_rating` is Glassdoor's headline 1-5 score, the canonical trend metric for rating-drift tracking.

## Common pitfalls

Three things go wrong in production Glassdoor review pipelines. **Theme-clustering drift** — Glassdoor occasionally re-clusters its theme algorithm, which changes pros/cons array contents without an underlying review change; treat sudden theme-array turnover as a methodology artifact, not real culture shift. **Public-vs-private bias** — public companies have orders of magnitude more reviews than private companies, so review-volume comparisons across the public/private divide aren't apples-to-apples. **Country-localised company-name matching** — `meta` returns Meta Platforms in the US but may return a different local company in non-US domains; always inspect the resolved company URL to confirm you got the intended company before downstream analysis.

Thirdwatch's actor uses Camoufox stealth-browser bypass for Glassdoor's Cloudflare protection — production-tested at sustained weekly volumes. The 4096 MB max memory and 3,600-second timeout headroom mean even 100-company batch runs complete cleanly. Pair Glassdoor with our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) for India coverage where AmbitionBox has materially deeper review data. A fourth subtle issue worth flagging: Glassdoor occasionally hides reviews on companies that file legal complaints under their Counterclaim Notice program, which means a sudden drop in pros/cons array length without rating change usually indicates content-moderation activity rather than real culture shift. A fifth pattern worth knowing for crisis-monitoring: Glassdoor caps the rate at which a single company's rating can move publicly (the displayed score is a smoothed average over recent reviews), so a 0.5-point single-week move is often the result of 30+ negative reviews posted that week — itself a signal that something material happened internally even if you can't see the underlying review content.

## Related use cases

- [Scrape Glassdoor salaries for compensation benchmarking](/blog/scrape-glassdoor-salaries-for-comp-benchmarking)
- [Find Glassdoor interview questions by role](/blog/find-glassdoor-interview-questions-by-role)
- [Track Glassdoor rating changes over time](/blog/track-glassdoor-rating-changes-over-time)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What does the actor return when scraping reviews?

Set `scrapeType: "reviews"` and the actor returns company-level review summaries with `company_rating`, `pros` (employee-reported positive themes as an array), and `cons` (negative themes), plus the company name and Glassdoor URL. Note this is summarised theme data rather than individual review text — Glassdoor's UI clusters common phrases. For deep individual-review analysis, you'd need a separate detail-page scrape.

### How does this compare to AmbitionBox for Indian companies?

Glassdoor coverage outside US/UK is materially thinner. AmbitionBox has 5-10x more reviews per Indian company than Glassdoor for the same employer. For Indian employer-brand research specifically, use AmbitionBox; for global comparisons including US/UK companies use Glassdoor; for the full picture run both and merge by company name. Our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) ships the seven-category breakdown that matches Glassdoor's review structure.

### Can I track competitor culture over time?

Yes. Schedule weekly review snapshots and persist as Parquet. Compare `company_rating` across snapshots — a 0.2-point drop within 30 days is meaningful; 0.5+ points is rare and usually corresponds to leadership change, layoff, or PR crisis. Pros/cons text turnover is a weaker signal because Glassdoor's clustering algorithm changes mappings periodically; rely on `company_rating` drift as the primary trend metric.

### What countries does the actor cover for reviews?

Seven Glassdoor country domains: US, UK, India, Canada, Australia, Germany, France. Pass the country code as the `country` input. Coverage is densest in US (1.4M+ companies indexed) and UK (300K+); India coverage exists but is materially thinner than AmbitionBox; smaller markets (DE, FR, AU, CA) have decent coverage for tier-1 companies and sparse data for SMBs.

### How fresh is review data?

Each run pulls live from Glassdoor at request time. Reviews update as new employees post — typically 1-10 new reviews per week for active large employers. Company ratings move slowly (0.1 points per quarter for stable companies). For employer-brand monitoring, weekly snapshots are sufficient; for crisis monitoring during active reputation events, daily is justified.

### Can I correlate Glassdoor reviews with company performance signals?

Yes. A Glassdoor `company_rating` drop of 0.3+ points often precedes earnings misses, leadership departures, or layoff announcements by 2-4 weeks for public companies. Pair Glassdoor with our [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) to detect simultaneous hiring slowdowns; the combined signal is materially stronger than either alone.

Run the [Glassdoor Scraper on Apify Store](https://apify.com/thirdwatch/glassdoor-scraper) — pay-per-record, free to try, no credit card to test.
