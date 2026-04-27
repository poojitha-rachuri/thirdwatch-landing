---
title: "Scrape Glassdoor Salaries for Compensation Benchmarking (2026)"
slug: "scrape-glassdoor-salaries-for-comp-benchmarking"
description: "Pull Glassdoor salary data + company ratings at $0.008 per record using Thirdwatch's Glassdoor Scraper. Pay-band research and offer-calibration recipes inside."
actor: "glassdoor-scraper"
actor_url: "https://apify.com/thirdwatch/glassdoor-scraper"
actorTitle: "Glassdoor Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "research-company-reviews-on-glassdoor"
  - "find-glassdoor-interview-questions-by-role"
  - "track-glassdoor-rating-changes-over-time"
keywords:
  - "glassdoor salary scraper"
  - "compensation benchmarking glassdoor"
  - "scrape glassdoor without login"
  - "offer calibration glassdoor"
faqs:
  - q: "How much does it cost to scrape Glassdoor salaries?"
    a: "Thirdwatch's Glassdoor Scraper charges $0.008 per record on the FREE tier and drops to $0.004 at GOLD volume — up to 19x cheaper than the leading orgupdate alternative. A 50-query compensation-research batch at 100 results each costs $40 at FREE pricing — a one-time cost meaningfully below any paid comp-survey subscription."
  - q: "What scrape types does the actor support?"
    a: "Three: jobs (job listings with salary estimates), salaries (Glassdoor's crowd-sourced salary data per role), and reviews (company-level reviews with pros/cons). Pass scrapeType: jobs/salaries/reviews to choose. For compensation benchmarking specifically, the salaries mode returns Glassdoor's role-level pay distributions, which is the canonical input for offer calibration."
  - q: "How accurate are Glassdoor salary estimates?"
    a: "Glassdoor publishes two flavours: Glassdoor Estimate (their algorithmic projection based on user reports) and Employer Provided (direct from the employer). The actor returns whichever Glassdoor shows. Estimates for roles with 50+ user reports are reliable within ±10%; below 50 reports, expect wider variance. Always cross-reference against AmbitionBox (India) or Levels.fyi (US tech) for senior roles where stakes are high."
  - q: "Which countries does the actor cover?"
    a: "Seven Glassdoor country domains: US, UK, India, Canada, Australia, Germany, France. Pass the country code as the country input. Glassdoor's coverage outside these markets is materially thinner, which is why the actor doesn't expose them — for non-listed countries, salary data is sparse enough that other sources (LinkedIn Jobs salary fields, AmbitionBox for India) often beat Glassdoor."
  - q: "Can I get pros/cons reviews per company?"
    a: "Yes. Set scrapeType to reviews and pass the company name as the query. The actor returns pros (employee-reported positive themes) and cons (negative themes) as arrays per record, plus the company_rating. For deeper review research, pair this with our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) for India coverage where AmbitionBox has materially higher review volume."
  - q: "How fresh is Glassdoor data?"
    a: "Each run pulls live from Glassdoor at request time. Salary estimates update as new user reports come in — typically weekly to monthly per role. Company ratings refresh with new reviews, which can move 0.1-0.2 points within a quarter for active companies. For comp-benchmarking, monthly snapshots are sufficient; for active reputation monitoring, weekly is the right cadence."
---

> Thirdwatch's [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) returns Glassdoor job listings, salary data, and company reviews at $0.008 per record — up to 19x cheaper than the leading Apify alternative. Three modes (jobs, salaries, reviews) cover the full Glassdoor data surface for compensation-benchmarking, employer-brand, and recruiter-research workflows. Built on Camoufox stealth-browser bypass for consistent production-volume scraping without LinkedIn-style account suspension risk.

## Why scrape Glassdoor for compensation benchmarking

Glassdoor is the largest crowd-sourced compensation database in the US and Europe. According to [Glassdoor's 2024 transparency report](https://www.glassdoor.com/research/), the platform aggregates more than 100 million salary reports across 1.4 million companies — a dataset that no comp-survey provider can match for breadth. For an HR total-rewards team or a recruiter calibrating offers, Glassdoor data is the table-stakes input. The blocker for systematic access: Glassdoor retired its public partner API years ago, leaving structured-data scrapers as the only path.

The job-to-be-done is structured. A total-rewards team building offer bands for 30 engineering roles wants Glassdoor salary distributions per role and metro. A recruiter agency calibrating senior-PM offers across FAANG wants company-by-company medians. An employer-brand team monitoring competitor ratings wants weekly snapshots. A market researcher studying US tech compensation distributions wants 5,000 role-level salary records pulled monthly. All reduce to the same shape — query + scrape type + country — returning structured rows.

## How does this compare to the alternatives?

Three options for getting Glassdoor data into a pipeline:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Glassdoor research + Excel | Effectively unbounded analyst time | Low (selection bias) | Continuous | Doesn't scale |
| orgupdate/glassdoor-scraper (Apify) | ~$150 ($0.15 × 1,000) | Production-tested | 5 minutes | Vendor maintains |
| Thirdwatch Glassdoor Scraper | $8 ($0.008 × 1,000) | Camoufox stealth, 19x cheaper | 5 minutes | Thirdwatch tracks Glassdoor changes |

The orgupdate Apify alternative is the established Glassdoor scraper but carries enterprise pricing for the same data. The [Glassdoor Scraper actor page](/scrapers/glassdoor-scraper) returns the same canonical fields — title, company, location, salary_estimate, company_rating, description, pros, cons, url — at meaningfully lower unit cost.

## How to scrape Glassdoor for compensation benchmarking in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull salary data for a role?

Set `scrapeType: "salaries"` and pass the role title as the query.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~glassdoor-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["software engineer", "senior software engineer",
                    "staff software engineer"],
        "scrapeType": "salaries",
        "country": "us",
        "maxResults": 100,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} salary records across {df.company_name.nunique()} companies")
```

Three queries × ~33 unique results = ~100 records, costing $0.80.

### Step 3: How do I parse salary estimates and rank by company?

Glassdoor's `salary_estimate` arrives as a display string like `$120,000 - $160,000`. Regex-parse to numerics for analysis.

```python
import re

def parse_band(s):
    if not s or not isinstance(s, str):
        return (None, None)
    nums = re.findall(r"\$?([\d,]+)(?:K)?", s)
    if len(nums) < 2:
        return (None, None)
    lo = int(nums[0].replace(",", ""))
    hi = int(nums[1].replace(",", ""))
    if "K" in s.upper():
        lo *= 1000; hi *= 1000
    return (lo, hi)

df[["salary_min", "salary_max"]] = df.salary_estimate.apply(
    lambda s: pd.Series(parse_band(s))
)
df["midpoint"] = (df.salary_min + df.salary_max) / 2

ranked = (
    df.dropna(subset=["midpoint"])
    .groupby("company_name")
    .agg(median_mid=("midpoint", "median"),
         median_rating=("company_rating", "median"),
         n=("title", "count"))
    .query("n >= 3")
    .sort_values("median_mid", ascending=False)
)
print(ranked.head(15))
```

The output is the company-by-company compensation leaderboard for the role, filtered to companies with at least 3 reports for confidence.

### Step 4: How do I pull company reviews and pair with salary data?

Switch `scrapeType` to `reviews` for the same companies; join on company name for a unified salary-and-culture view.

```python
top_companies = ranked.head(20).index.tolist()

reviews_resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": top_companies,
        "scrapeType": "reviews",
        "country": "us",
        "maxResults": 200,
    },
    timeout=3600,
)
reviews_df = pd.DataFrame(reviews_resp.json())

unified = ranked.reset_index().merge(
    reviews_df.groupby("company_name").agg(
        review_rating=("company_rating", "median"),
        sample_pros=("pros", lambda s: list(s.dropna())[:3]),
        sample_cons=("cons", lambda s: list(s.dropna())[:3]),
    ).reset_index(),
    on="company_name",
    how="left",
)
print(unified[["company_name", "median_mid", "review_rating", "n"]].head(15))
```

Companies paying high but with low review_rating are the canonical "compensating differential" pattern — high pay offsets weaker culture. Companies paying high AND highly rated are the genuine top employers worth deeper recruiter attention.

## Sample output

A single salary record from Glassdoor looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "title": "Software Engineer",
  "company_name": "Microsoft",
  "location": "Redmond, WA",
  "salary_estimate": "$120,000 - $160,000",
  "company_rating": 4.2,
  "description": "Join our team to build innovative software...",
  "url": "https://www.glassdoor.com/job-listing/..."
}
```

A reviews-mode record looks similar but with `pros` and `cons` arrays populated:

```json
{
  "company_name": "Microsoft",
  "company_rating": 4.2,
  "pros": ["Great work-life balance", "Strong benefits", "Excellent training programs"],
  "cons": ["Slow promotion cycles", "Bureaucratic at scale"]
}
```

`salary_estimate` is whatever Glassdoor displays as the headline number — "Glassdoor Estimate" (algorithmic) or "Employer Provided" (direct from employer). Both are useful as the comp-band anchor; the actor doesn't distinguish them in the output schema, so for high-stakes decisions visit the URL once to verify the estimate flavour.

## Common pitfalls

Three issues bite Glassdoor-based compensation pipelines. **Salary-string format drift** — Glassdoor occasionally formats bands as `$120K-$160K`, `$120,000 - $160,000`, or with `/yr` or `/hr` suffixes. The regex parser in Step 3 handles the common cases; for edge cases (compressed annual ranges with no separator, hourly bands), surface unparseable rows as data-quality warnings rather than dropping them. **Sample-size confusion** — companies with only 3-5 salary reports show estimates but those estimates are noisy. Filter on `n >= 10` (or `>= 50` for high-stakes offer calibration) before treating them as authoritative. **Country-domain ambiguity** — Glassdoor runs separate domains per country (`glassdoor.com`, `glassdoor.co.uk`, `glassdoor.co.in`). The `country` input switches domains, but if you mix US and UK queries in one run, the results all return from one country domain. Run separate batches per country.

Thirdwatch's actor uses Camoufox + humanize for Cloudflare bypass — production-tested at 100% reliability. The 4096 MB max memory and 3,600-second timeout headroom mean even multi-hundred-record runs complete cleanly. Pair Glassdoor with our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) for India compensation and [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for global salary fields. A fourth subtle issue worth flagging is that Glassdoor's `salary_estimate` for fresh job listings (posted within the last 24-48 hours) sometimes lags by a day before the algorithmic estimate populates; if you see null `salary_estimate` on a brand-new listing, retry the same query 48 hours later rather than treating it as a permanent data gap. A fifth pattern worth knowing: Glassdoor's review pros/cons arrays are summarised themes (Glassdoor's own clustering of common phrases), not raw individual review excerpts — useful for high-level employer-brand monitoring but less precise than reading individual reviews directly.

## Related use cases

- [Research company reviews on Glassdoor](/blog/research-company-reviews-on-glassdoor)
- [Find Glassdoor interview questions by role](/blog/find-glassdoor-interview-questions-by-role)
- [Track Glassdoor rating changes over time](/blog/track-glassdoor-rating-changes-over-time)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Glassdoor salaries?

Thirdwatch's Glassdoor Scraper charges $0.008 per record on the FREE tier and drops to $0.004 at GOLD volume — up to 19x cheaper than the leading orgupdate alternative. A 50-query compensation-research batch at 100 results each costs $40 at FREE pricing — a one-time cost meaningfully below any paid comp-survey subscription.

### What scrape types does the actor support?

Three: `jobs` (job listings with salary estimates), `salaries` (Glassdoor's crowd-sourced salary data per role), and `reviews` (company-level reviews with pros/cons). Pass `scrapeType: "jobs"`/`"salaries"`/`"reviews"` to choose. For compensation benchmarking specifically, the `salaries` mode returns Glassdoor's role-level pay distributions, which is the canonical input for offer calibration.

### How accurate are Glassdoor salary estimates?

Glassdoor publishes two flavours: Glassdoor Estimate (their algorithmic projection based on user reports) and Employer Provided (direct from the employer). The actor returns whichever Glassdoor shows. Estimates for roles with 50+ user reports are reliable within ±10%; below 50 reports, expect wider variance. Always cross-reference against AmbitionBox (India) or [Levels.fyi](https://www.levels.fyi/) (US tech) for senior roles where stakes are high.

### Which countries does the actor cover?

Seven Glassdoor country domains: US, UK, India, Canada, Australia, Germany, France. Pass the country code as the `country` input. Glassdoor's coverage outside these markets is materially thinner, which is why the actor doesn't expose them — for non-listed countries, salary data is sparse enough that other sources (LinkedIn Jobs salary fields, AmbitionBox for India) often beat Glassdoor.

### Can I get pros/cons reviews per company?

Yes. Set `scrapeType` to `"reviews"` and pass the company name as the query. The actor returns `pros` (employee-reported positive themes) and `cons` (negative themes) as arrays per record, plus the `company_rating`. For deeper review research, pair this with our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) for India coverage where AmbitionBox has materially higher review volume.

### How fresh is Glassdoor data?

Each run pulls live from Glassdoor at request time. Salary estimates update as new user reports come in — typically weekly to monthly per role. Company ratings refresh with new reviews, which can move 0.1-0.2 points within a quarter for active companies. For comp-benchmarking, monthly snapshots are sufficient; for active reputation monitoring, weekly is the right cadence.

Run the [Glassdoor Scraper on Apify Store](https://apify.com/thirdwatch/glassdoor-scraper) — pay-per-record, free to try, no credit card to test.
