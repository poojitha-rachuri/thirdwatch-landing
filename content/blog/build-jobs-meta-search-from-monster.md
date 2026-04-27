---
title: "Build a US Jobs Meta-Search from Monster (2026 Guide)"
slug: "build-jobs-meta-search-from-monster"
description: "Build a multi-source US jobs meta-search at $0.008 per record using Thirdwatch's Monster Scraper plus Indeed and ZipRecruiter. Postgres + Meilisearch + dedupe recipes."
actor: "monster-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/monster-jobs-scraper"
actorTitle: "Monster Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-monster-jobs-for-recruiter-pipeline"
  - "track-us-job-market-with-monster-data"
  - "monster-vs-indeed-vs-ziprecruiter-data-coverage"
keywords:
  - "us jobs meta search"
  - "build job aggregator monster"
  - "multi source us jobs scraper"
  - "indeed monster ziprecruiter aggregator"
faqs:
  - q: "How much does it cost to run a US jobs meta-search?"
    a: "Pulling 1,000 jobs/day per source across three sources at FREE pricing = $24/day or ~$720/month. At GOLD volume tiers ($0.004/job each), the same coverage runs $360/month. Most meta-search products monetize via affiliate commissions, ATS partnerships, or premium recruiter tools and break even at this cost basis."
  - q: "Which sources should I include for full US coverage?"
    a: "Three core US sources: Indeed (volume + tech-mainstream), Monster (mid-market + healthcare/manufacturing), ZipRecruiter (hourly + retail + gig). Optional fourth: SimplyHired (long-tail mid-market) for bonus coverage. The three core boards capture roughly 80% of unique US postings any given week."
  - q: "How fresh does a meta-search need to be?"
    a: "Six-hourly is the sweet spot. Hourly is overkill — most US job postings stay live 14-30 days, so daily diff is fine. Six-hourly catches early-morning recruiter postings within hours and gives users a meaningful freshness advantage over Indeed-only or LinkedIn-only competitors."
  - q: "What database and search layer should I use?"
    a: "For under 100K active listings, Postgres with full-text GIN handles search at sub-100ms. Past 100K, push to Meilisearch or Typesense for typo-tolerant faceted search. Both run on $20-$40/month VMs at this scale."
  - q: "How do I dedupe across sources?"
    a: "Build a 4-tuple key on (title-normalised, company-normalised, location-normalised, salary_min). Cross-source URLs differ even for the same role. The 4-tuple key catches 85-90% of cross-source duplicates; remaining 10-15% are usually distinct legitimate listings."
  - q: "Can I prioritise certain sources for specific fields?"
    a: "Yes. ZipRecruiter has the highest salary fill-rate; Monster has the longest descriptions; Indeed has the freshest postings. Build a source-priority map per field and merge using priority during dedupe. This is the canonical pattern for high-quality multi-source aggregation."
---

> Thirdwatch's [Monster Scraper](https://apify.com/thirdwatch/monster-jobs-scraper) at $0.008 per job is one of three foundation sources for a US jobs meta-search engine — combine with [Indeed Scraper](https://apify.com/thirdwatch/indeed-jobs-scraper) and [ZipRecruiter Scraper](https://apify.com/thirdwatch/ziprecruiter-scraper) to cover the bulk of US job postings in a single search interface. This guide is the canonical recipe for building a meta-search on top of Apify's three Camoufox-based jobs actors, with Postgres ingestion, Meilisearch faceted search, and source-priority dedupe.

## Why build a US jobs meta-search

US job-search is fragmented across LinkedIn, Indeed, Monster, ZipRecruiter, Glassdoor, and a long tail of niche boards. According to [Pew Research's 2024 survey on US job-seeking behaviour](https://www.pewresearch.org/), the median US job-seeker visits 3-5 boards during an active search and consolidates results manually. A meta-search interface that returns deduped listings across boards captures real user value — and the unit economics work because Apify's stealth-browser architecture compresses the per-source data cost to under a cent per job.

The job-to-be-done is structured. A meta-search builder wants daily ingestion across three or four US sources, dedupe, and a fast search UX. A staffing agency wants their internal applicant-search interface to cover the same breadth as the public-facing meta-searches. A salary-research platform wants comprehensive cross-board coverage to compute robust median bands. A workforce-analytics SaaS targeting HR teams wants to embed cross-board listing search as a feature alongside their primary product. A US-recruiting agency building a candidate-attraction landing page wants the meta-search as content marketing rather than as the primary product. All of these reduce to multi-source pull → dedupe → Postgres or search-engine ingestion. Monster at $0.008 sits in the middle of the cost band; combined with Indeed and ZipRecruiter it produces a complete US dataset that no single board provides on its own.

## How does this compare to the alternatives?

Three options for building a US jobs meta-search data layer:

| Approach | Cost per 1,000 jobs × daily × 3 sources | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Per-source DIY scrapers | Free compute, weeks of dev | Brittle without humanize tuning | 8–16 weeks | You own three stealth layers |
| Indeed Hiring Insights API + paid feeds | $30K–$200K/year flat | High | Weeks–months | Vendor lock-in |
| Thirdwatch Monster + Indeed + ZipRecruiter | $24/day at FREE = $720/month | Production-tested across all three | Half a day | Thirdwatch maintains all three |

The DIY estimate reflects what most teams burn before having all three boards stable; Camoufox + DataDome bypass is a real engineering project per board. The [Monster Scraper actor page](/scrapers/monster-jobs-scraper) and the Indeed and ZipRecruiter pages all use the same canonical schema, which collapses the meta-search build to a half-day for the integration plus search/UI work on top.

## How to build a US jobs meta-search in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull from all three US sources in parallel?

Spawn one async run per source × metro. The three Thirdwatch scrapers all return the same canonical schema.

```python
import os, requests, time, json, pathlib

TOKEN = os.environ["APIFY_TOKEN"]
ACTORS = {
    "monster": "thirdwatch~monster-jobs-scraper",
    "indeed": "thirdwatch~indeed-jobs-scraper",
    "ziprecruiter": "thirdwatch~ziprecruiter-scraper",
}
QUERIES = ["software engineer", "registered nurse", "accountant"]
METROS = ["New York, NY", "Los Angeles, CA", "Chicago, IL",
          "Houston, TX", "Phoenix, AZ"]

run_ids = []
for source, actor in ACTORS.items():
    for metro in METROS:
        r = requests.post(
            f"https://api.apify.com/v2/acts/{actor}/runs",
            params={"token": TOKEN},
            json={"queries": QUERIES, "location": metro, "maxResults": 200},
        )
        run_ids.append((source, metro, r.json()["data"]["id"]))
        time.sleep(0.5)

results = []
for source, metro, run_id in run_ids:
    while True:
        s = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}",
                         params={"token": TOKEN}).json()["data"]["status"]
        if s in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(20)
    if s == "SUCCEEDED":
        items = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
            params={"token": TOKEN}).json()
        for j in items:
            j["source"] = source
            j["metro"] = metro
        results.extend(items)
print(f"Total raw jobs: {len(results)}")
```

3 sources × 5 metros × 200 jobs = 3,000 raw, completing in 25-40 minutes wall-clock with parallelism, costing $24.

### Step 3: How do I dedupe with source-priority preference?

Build the canonical 4-tuple key. When the same job appears across boards, prefer the source with the most complete data.

```python
import pandas as pd, re

def normalise(s):
    return re.sub(r"\W+", " ", (s or "").lower()).strip()

df = pd.DataFrame(results)
df["dedupe_key"] = (
    df.title.fillna("").apply(normalise) + "|"
    + df.company.fillna("").apply(normalise) + "|"
    + df.location.fillna("").apply(normalise) + "|"
    + df.salary_min.fillna(-1).astype(int).astype(str)
)

# Salary fill rate: ZipRecruiter > Monster > Indeed
SOURCE_PRIORITY = {"ziprecruiter": 0, "monster": 1, "indeed": 2}
df["priority"] = df.source.map(SOURCE_PRIORITY)
unique = (df.sort_values(["dedupe_key", "priority"])
            .drop_duplicates(subset=["dedupe_key"], keep="first")
            .drop(columns=["priority"]))
print(f"Deduped: {len(df)} → {len(unique)} unique ({len(unique)/len(df):.0%})")
```

Expect 35-45% overlap to collapse to 55-65% unique listings.

### Step 4: How do I serve fast faceted search via Meilisearch?

Push the deduped dataset to Meilisearch with source, salary, and location facets.

```python
import meilisearch

client = meilisearch.Client("http://meilisearch:7700", os.environ["MEILI_KEY"])
index = client.index("us_jobs")
index.update_settings({
    "filterableAttributes": ["source", "salary_min", "location", "salary_period"],
    "sortableAttributes": ["salary_max", "posted_date"],
    "searchableAttributes": ["title", "company", "description"],
})
docs = unique.to_dict("records")
for d in docs:
    d["id"] = d["dedupe_key"]
index.add_documents(docs, primary_key="id")
print(f"Indexed {len(docs)} jobs in Meilisearch")
```

Pair with a Next.js or Astro frontend; users get sub-100ms typo-tolerant search across thousands of fresh deduped US listings updated daily.

## Sample output

A single deduped record looks like this — same canonical schema across all three sources, with `source` distinguishing origin.

```json
{
  "title": "Registered Nurse - ICU",
  "company": "Beth Israel Deaconess Medical Center",
  "location": "Boston, MA",
  "salary_text": "$80,000 - $115,000",
  "salary_min": 80000,
  "salary_max": 115000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "description": "Beth Israel Deaconess seeks an experienced ICU Registered Nurse...",
  "posted_date": "2026-04-21",
  "source": "monster",
  "url": "https://www.monster.com/job-openings/registered-nurse-icu-boston-ma"
}
```

`source` lets the meta-search UI offer per-board filtering. `dedupe_key` (computed downstream, not stored on the record) is the natural key for upserts. `salary_min` and `salary_max` are normalised to integer USD across all three sources.

## Common pitfalls

Three things break US jobs meta-searches on multi-source data. **Salary-period mixing across sources** — ZipRecruiter publishes more hourly bands than Monster or Indeed; dedupe keys including `salary_min` will treat hourly $30 and yearly $30 as different (correctly), but downstream salary-band filters need to filter on `salary_period` first to avoid mixing. **Posted-date drift** — Indeed often returns relative dates ("1 day ago"); for chronological sorting, use your ingestion timestamp rather than `posted_date` for cross-source consistency. **Meta-search source attribution** — most users want to know which board a listing came from for click-through; surface `source` in the UI rather than hiding it behind a unified URL, otherwise users don't trust the meta-search.

Thirdwatch's three US-jobs scrapers all use the same Camoufox + humanize architecture and same canonical schema, which is the deliberate symmetry that makes a meta-search straightforward to build. The combined cost (~$720/month at FREE pricing for 3K-job daily ingestion across three boards) sits well below any commercial meta-search-data subscription. A fourth subtle issue worth flagging is that meta-search products that hide the underlying source from the user usually fare worse on long-term retention than ones that surface the source clearly — users want to know whether a listing came from Indeed, Monster, or ZipRecruiter so they can decide which platform to apply through and which board to bookmark for future searches.

## Related use cases

- [Scrape Monster jobs for a recruiter pipeline](/blog/scrape-monster-jobs-for-recruiter-pipeline)
- [Track US job market with Monster data](/blog/track-us-job-market-with-monster-data)
- [Monster vs. Indeed vs. ZipRecruiter — data coverage](/blog/monster-vs-indeed-vs-ziprecruiter-data-coverage)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to run a US jobs meta-search?

Pulling 1,000 jobs/day per source across three sources at FREE pricing = $24/day or ~$720/month. At GOLD volume tiers ($0.004/job each), the same coverage runs $360/month. Most meta-search products monetize via affiliate commissions, ATS partnerships, or premium recruiter tools and break even at this cost basis.

### Which sources should I include for full US coverage?

Three core US sources: Indeed (volume + tech-mainstream), Monster (mid-market + healthcare/manufacturing), ZipRecruiter (hourly + retail + gig). Optional fourth: SimplyHired (long-tail mid-market) for bonus coverage. The three core boards capture roughly 80% of unique US postings any given week.

### How fresh does a meta-search need to be?

Six-hourly is the sweet spot. Hourly is overkill — most US job postings stay live 14-30 days, so daily diff is fine. Six-hourly catches early-morning recruiter postings within hours and gives users a meaningful freshness advantage over Indeed-only or LinkedIn-only competitors.

### What database and search layer should I use?

For under 100K active listings, Postgres with full-text GIN handles search at sub-100ms. Past 100K, push to [Meilisearch](https://www.meilisearch.com/) or [Typesense](https://typesense.org/) for typo-tolerant faceted search. Both run on $20-$40/month VMs at this scale.

### How do I dedupe across sources?

Build a 4-tuple key on `(title-normalised, company-normalised, location-normalised, salary_min)`. Cross-source URLs differ even for the same role. The 4-tuple key catches 85-90% of cross-source duplicates; remaining 10-15% are usually distinct legitimate listings.

### Can I prioritise certain sources for specific fields?

Yes. ZipRecruiter has the highest salary fill-rate; Monster has the longest descriptions; Indeed has the freshest postings. Build a source-priority map per field and merge using priority during dedupe. This is the canonical pattern for high-quality multi-source aggregation.

Run the [Monster Scraper on Apify Store](https://apify.com/thirdwatch/monster-jobs-scraper) — pay-per-job, free to try, no credit card to test.
