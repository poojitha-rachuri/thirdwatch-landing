---
title: "Scrape CutShort Tech Jobs in India for Startup Hiring (2026)"
slug: "scrape-cutshort-tech-jobs-india"
description: "Pull curated India tech jobs at $0.005 per record with Thirdwatch's CutShort Scraper. Salary, skills, funding stage. Python and aggregator recipes."
actor: "cutshort-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/cutshort-jobs-scraper"
actorTitle: "CutShort.io Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-startup-hiring-india-via-cutshort"
  - "benchmark-startup-tech-salaries-india"
  - "build-india-tech-talent-pipeline-from-cutshort"
keywords:
  - "cutshort jobs scraper"
  - "india startup tech jobs"
  - "cutshort api alternative"
  - "scrape cutshort.io"
faqs:
  - q: "How much does it cost to scrape CutShort?"
    a: "Thirdwatch's CutShort Scraper charges $0.005 per job on the FREE tier and drops to $0.0027 at GOLD volume. A 6-skill watchlist at 100 jobs each — typical for an India tech-jobs aggregator daily refresh — costs $3 per pull, with hourly cadence affordable at under $75 a month."
  - q: "How is CutShort different from Naukri or LinkedIn for India tech jobs?"
    a: "CutShort is a curated tech/startup-only platform — companies and listings are vetted, so job quality is materially higher than mass boards. Naukri has 100x the volume but mixes IT-services and product-tech roles indiscriminately. LinkedIn covers everything globally. For India product-tech and startup-job feeds specifically, CutShort wins on signal-to-noise."
  - q: "What does the funding_stage field contain?"
    a: "CutShort's company funding label — typical values are Bootstrapped, Pre-Seed, Seed, Series A through Series F, and Public. The actor returns this on every record where CutShort publishes it. Combined with company_size, funding_stage gives a clean partition for filtering jobs by company maturity."
  - q: "Why are some CutShort listings missing salary?"
    a: "CutShort encourages but does not require salary disclosure. About 60-70% of listings publish a salary range; the rest leave salary_min and salary_max null. The actor returns whatever CutShort publishes. For salary-band analysis, filter to non-null rows before aggregating; the bias toward published salaries is small enough not to skew most aggregations."
  - q: "Can I filter to remote-only or by location?"
    a: "Filtering happens downstream. The actor returns location and a boolean remote field on every record; pandas filtering with df[df.remote] for remote-only or df[df.location.str.contains(Bangalore)] for city-specific takes one line. CutShort itself does not expose a remote-only search filter at scrape time."
  - q: "How fresh is CutShort data?"
    a: "Each run pulls live from CutShort.io at request time — there is no cache. CutShort updates listings as recruiters post and close roles, with most posting velocity concentrated in the first 7 days after a listing opens. For aggregator use cases, daily refresh catches 95%+ of new postings; hourly catches the rest."
---

> Thirdwatch's [CutShort Scraper](https://apify.com/thirdwatch/cutshort-jobs-scraper) returns curated Indian tech and startup job listings from CutShort.io at $0.005 per job. Returns title, company, salary_min, salary_max, skills, experience_range, remote, company_size, funding_stage, and full descriptions per record. Built for Indian-tech aggregator developers, recruiters, and growth analysts who need higher-signal startup-job data than what mass boards like Naukri provide.

## Why scrape CutShort for India tech jobs

CutShort is the most curated tech-hiring platform in India. According to [CutShort's own platform page](https://cutshort.io/), the platform serves more than 4 million developers across India and exclusively lists product-tech and startup roles after a vetting step — which means the dataset is materially smaller than Naukri's but materially higher quality. For an aggregator developer, recruiter, or growth analyst building anything India-tech-startup-specific, that signal-to-noise advantage matters.

The job-to-be-done is structured. An aggregator builder needs CutShort as one of three or four sources in a curated India tech-jobs feed. A recruiter wants to know which Indian startups at Series B and beyond are hiring senior engineers right now. A salary-benchmarking analyst wants pay distributions by skill and funding stage — a question Naukri data does not cleanly answer because Naukri does not surface funding stage. CutShort surfaces all of this in its listings, and the Thirdwatch actor returns it as structured JSON ready for pandas, Postgres, or a CRM.

## How does this compare to the alternatives?

Three options for getting curated India tech-job data:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual CutShort browsing | Effectively unbounded analyst time | Low | Continuous | Doesn't scale |
| Indian recruiter database (Apna, Hirect APIs) | $5K–$30K/year flat | Variable | Days to weeks | Vendor lock-in |
| Thirdwatch CutShort Scraper | $5 ($0.005 × 1,000) | Production-tested, monopoly position on Apify | 5 minutes | Thirdwatch tracks CutShort changes |

CutShort does not publish a public data API, so the alternative for systematic access is either manual scraping or the actor. The [CutShort Scraper actor page](/scrapers/cutshort-jobs-scraper) gives you the live structured feed; the analytics layer is downstream pandas. There is no other maintained CutShort scraper on the Apify Store.

## How to scrape CutShort tech jobs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs by skill?

Pass skill slugs in `skills` and crank `maxResults` to your daily refresh size. Skill slugs follow CutShort's URL pattern — lowercase with hyphens.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~cutshort-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "skills": ["python", "java", "nodejs", "react", "devops", "machine-learning"],
        "maxResults": 300,
    },
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.company_name.nunique()} companies")
```

Six skills × ~50 jobs per skill = up to 300 unique listings. A typical daily refresh costs $1.50 and completes in under three minutes.

### Step 3: How do I filter by funding stage and salary band?

Filter on `funding_stage` to focus on a startup maturity, and on `salary_min` to filter out unsalaried internships or unannounced bands.

```python
SERIES_B_PLUS = df[
    df.funding_stage.isin(["Series B", "Series C", "Series D", "Series E", "Series F", "Public"])
    & df.salary_min.notna()
    & (df.salary_min >= 2_500_000)  # >= 25 lakh INR
].copy()

SERIES_B_PLUS["lakhs_min"] = SERIES_B_PLUS.salary_min / 1e5
SERIES_B_PLUS["lakhs_max"] = SERIES_B_PLUS.salary_max / 1e5

print(SERIES_B_PLUS[["title", "company_name", "location", "remote",
                      "lakhs_min", "lakhs_max", "experience_range",
                      "funding_stage"]].head(20))
```

Lakhs (one lakh = 100,000 INR) is the unit Indian recruiters and candidates actually use, so converting at this stage saves repeated mental math.

### Step 4: How do I export to a Postgres-backed Indian tech-jobs aggregator?

Upsert on `apply_url` (CutShort's stable per-job natural key) so re-runs don't duplicate.

```sql
CREATE TABLE jobs_cutshort (
  apply_url        text PRIMARY KEY,
  title            text NOT NULL,
  company_name     text NOT NULL,
  location         text,
  remote           boolean,
  salary_min       bigint,
  salary_max       bigint,
  experience_range text,
  skills           text[],
  funding_stage    text,
  company_size     text,
  description      text,
  posted_at        date,
  first_seen_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at     timestamptz NOT NULL DEFAULT now()
);
```

```python
import psycopg2.extras

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO jobs_cutshort
           (apply_url, title, company_name, location, remote,
            salary_min, salary_max, experience_range, skills,
            funding_stage, company_size, description, posted_at)
           VALUES %s
           ON CONFLICT (apply_url) DO UPDATE SET
             title = EXCLUDED.title,
             salary_min = EXCLUDED.salary_min,
             salary_max = EXCLUDED.salary_max,
             last_seen_at = now()""",
        [(j["apply_url"], j["title"], j["company_name"], j.get("location"),
          j.get("remote"), j.get("salary_min"), j.get("salary_max"),
          j.get("experience_range"), j.get("skills"), j.get("funding_stage"),
          j.get("company_size"), j.get("description"), j.get("posted_at"))
         for j in resp.json()],
    )
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at `0 * * * *` (hourly) and the loop is fully self-maintaining.

## Sample output

A single record from the dataset for one Mumbai-based engineering manager role looks like this. Five rows of this shape weigh ~12 KB.

```json
{
  "title": "Sr. Engineering Manager",
  "company_name": "Myntra",
  "location": "Mumbai",
  "remote": false,
  "salary_min": 4000000,
  "salary_max": 9000000,
  "experience_range": "10+ years",
  "skills": ["Java", "Distributed Systems", "Team Management"],
  "job_type": "FULL_TIME",
  "description": "We are looking for a Sr. Engineering Manager...",
  "company_size": "1001-5000",
  "funding_stage": "Public",
  "apply_url": "https://cutshort.io/job/Sr-Engineering-Manager-Mumbai-Myntra-hwgJEJjM",
  "posted_at": "2026-03-15"
}
```

`salary_min` and `salary_max` are in INR annual CTC. The 40-90 lakh band on this Myntra role is a useful single-row example: senior India product-tech compensation typically lives in the 30-100 lakh range with director-level reaching higher. `funding_stage: Public` partitions Myntra (Flipkart-owned) from the seed/series-A startup cohort. `skills` is a clean array of strings — no comma-string parsing needed.

## Common pitfalls

Three things go wrong in CutShort-based pipelines. **Salary nulls** — about 30-40% of listings have no published salary. Pipelines that compute averages without filtering null rows produce wildly low estimates; always require `salary_min` and `salary_max` non-null before aggregating. **Skill-token inconsistency** — CutShort's skill tags can vary slightly across recruiters (`React.js`, `ReactJS`, `React`); for skill-frequency analysis, normalise tokens to lowercase and strip punctuation before counting. **Funding stage staleness** — funding_stage is set at company-record creation time on CutShort and not always refreshed when a company raises a new round; cross-check against [Crunchbase](https://www.crunchbase.com/) or [Tracxn](https://tracxn.com/) when stage matters for a strategic decision.

Thirdwatch's actor returns `funding_stage` and `company_size` on every record where CutShort publishes them, with `salary_min`/`salary_max` as integer INR when the band is published. The pure-HTTP architecture (impit + JSON-LD) means a 300-job pull completes in under three minutes and costs $1.50 — small enough to run hourly without budget pain. A fourth subtle issue: experience_range is published as a free-text band (`5-8 years`, `10+ years`, `Fresher`); for any quantitative analysis, parse the lower bound out via regex and treat `Fresher` as 0 — the actor preserves the raw string so the parsing logic stays in your code where it belongs. A fifth note for aggregator builders: CutShort closes listings asynchronously after a role is filled, so an `apply_url` last seen 21+ days ago is reasonable to mark inactive.

## Related use cases

- [Track startup hiring in India via CutShort](/blog/track-startup-hiring-india-via-cutshort)
- [Benchmark startup tech salaries in India](/blog/benchmark-startup-tech-salaries-india)
- [Build an India tech talent pipeline from CutShort](/blog/build-india-tech-talent-pipeline-from-cutshort)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape CutShort?

Thirdwatch's CutShort Scraper charges $0.005 per job on the FREE tier and drops to $0.0027 at GOLD volume. A 6-skill watchlist at 100 jobs each — typical for an India tech-jobs aggregator daily refresh — costs $3 per pull, with hourly cadence affordable at under $75 a month.

### How is CutShort different from Naukri or LinkedIn for India tech jobs?

CutShort is a curated tech/startup-only platform — companies and listings are vetted, so job quality is materially higher than mass boards. Naukri has 100x the volume but mixes IT-services and product-tech roles indiscriminately. LinkedIn covers everything globally. For India product-tech and startup-job feeds specifically, CutShort wins on signal-to-noise.

### What does the funding_stage field contain?

CutShort's company funding label — typical values are `Bootstrapped`, `Pre-Seed`, `Seed`, `Series A` through `Series F`, and `Public`. The actor returns this on every record where CutShort publishes it. Combined with `company_size`, `funding_stage` gives a clean partition for filtering jobs by company maturity.

### Why are some CutShort listings missing salary?

CutShort encourages but does not require salary disclosure. About 60-70% of listings publish a salary range; the rest leave `salary_min` and `salary_max` null. The actor returns whatever CutShort publishes. For salary-band analysis, filter to non-null rows before aggregating; the bias toward published salaries is small enough not to skew most aggregations.

### Can I filter to remote-only or by location?

Filtering happens downstream. The actor returns `location` and a boolean `remote` field on every record; pandas filtering with `df[df.remote]` for remote-only or `df[df.location.str.contains("Bangalore")]` for city-specific takes one line. CutShort itself does not expose a remote-only search filter at scrape time.

### How fresh is CutShort data?

Each run pulls live from CutShort.io at request time — there is no cache. CutShort updates listings as recruiters post and close roles, with most posting velocity concentrated in the first 7 days after a listing opens. For aggregator use cases, daily refresh catches 95%+ of new postings; hourly catches the rest.

Run the [CutShort Scraper on Apify Store](https://apify.com/thirdwatch/cutshort-jobs-scraper) — pay-per-job, free to try, no credit card to test.
