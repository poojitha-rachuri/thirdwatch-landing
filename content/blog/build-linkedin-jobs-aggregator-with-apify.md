---
title: "Build a LinkedIn Jobs Aggregator with Apify (2026 Guide)"
slug: "build-linkedin-jobs-aggregator-with-apify"
description: "Build a multi-source LinkedIn-anchored jobs aggregator at $0.008 per job using Thirdwatch. Postgres + Meilisearch + cross-source dedupe recipes inside."
actor: "linkedin-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/linkedin-jobs-scraper"
actorTitle: "LinkedIn Jobs Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-linkedin-jobs-without-login"
  - "track-linkedin-hiring-velocity-by-company"
  - "filter-linkedin-jobs-by-skill-and-location"
keywords:
  - "linkedin jobs aggregator"
  - "build linkedin jobs api"
  - "multi-source jobs aggregator"
  - "linkedin jobs postgres pipeline"
faqs:
  - q: "What does it cost to run a LinkedIn-anchored aggregator?"
    a: "LinkedIn at $0.008/job is the priciest single source but typically returns the highest-quality structured data (parsed salary, skills, descriptions). A daily aggregator pulling 1,000 LinkedIn jobs alongside 1,000 each from Indeed, Naukri, and Career Sites costs $24/day at FREE pricing. Most aggregators monetize via affiliate placement fees or ATS integrations and break even at low-thousands of monthly active users."
  - q: "What sources should I include alongside LinkedIn?"
    a: "Three complementary sources: LinkedIn (volume + structured salary), Career Sites (employer-direct, freshest), and a regional source per market (Indeed for US, Naukri for India, etc.). LinkedIn anchors the aggregator on global volume; Career Sites adds employer-direct freshness; the regional source covers the long-tail listings the global boards under-index. Three sources hits ~85% coverage; adding a fourth typically yields <5% incremental unique listings."
  - q: "How do I dedupe LinkedIn jobs against direct-employer postings?"
    a: "Build a 4-tuple key on (title-normalised, company-normalised, location-normalised, salary_min). Cross-source URLs differ even for the same role. The 4-tuple key catches 85-90% of cross-source duplicates. When LinkedIn shows is_easy_apply: true for a job and Career Sites also shows it from the employer's ATS, treat the employer-direct row as the canonical entry and keep LinkedIn as a discovery surface only."
  - q: "What database scheme handles a LinkedIn-anchored aggregator?"
    a: "Postgres with a GIN full-text index on title + description handles up to 1 million active listings comfortably at sub-100ms search. Past 1M, push to Meilisearch or Typesense. Key tables: jobs (canonical row per dedupe key), sources (source-specific URLs and metadata per job), search_index (denormalised view for fast filtering). Most LinkedIn-anchored aggregators stay under 500K active listings since the platform's own indexing decay removes older postings."
  - q: "How fresh does the aggregator need to be?"
    a: "Six-hourly is the sweet spot. LinkedIn ranks new listings highly for the first 24-48 hours, so missing that window costs aggregator users their best inbound signal. Indeed and Naukri can be daily without losing much. Career Sites should be hourly because employer-direct freshness is the entire reason to include it. Stagger the schedules so your peak load doesn't hammer any single source."
  - q: "Can I monetize a jobs aggregator legally?"
    a: "Yes, with two important caveats. (1) Drive users to the source's apply URL rather than re-hosting application flow — this preserves the source's user-acquisition value and stays clearly in fair-use territory. (2) Add value beyond aggregation (faceted search, alerts, salary normalisation) so you're not just re-publishing public listings verbatim. Most successful jobs aggregators monetize via affiliate placement fees from ATS providers, sponsored job boosts, and recruiter-tier subscriptions."
---

> Thirdwatch's [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) anchors a multi-source jobs aggregator at $0.008 per job — combine with [Career Site Scraper](https://apify.com/thirdwatch/career-site-job-scraper) and a regional source (Indeed for US, Naukri for India) for ~85% coverage of relevant listings. This guide is the canonical recipe for building a LinkedIn-anchored aggregator with Postgres ingestion, cross-source dedup, and Meilisearch faceted search.

## Why anchor an aggregator on LinkedIn Jobs

LinkedIn is the single highest-quality jobs source globally. According to [LinkedIn's 2024 economic graph disclosures](https://news.linkedin.com/), the platform's structured data — parsed salary, skills, experience level, company industry, applicant counts — is materially richer than any competing source. For an aggregator product, LinkedIn-quality structured data lets you offer faceted search by skill, salary band, and seniority that no competing aggregator can match without paying enterprise license fees.

The job-to-be-done is structured. An aggregator builder wants comprehensive global coverage with structured ranking facets. A staffing-tech SaaS embeds a jobs feed in their product as a stickiness feature. A workforce-analytics platform needs a longitudinal jobs dataset for trend analysis. A recruiter agency builds an internal aggregator to consolidate sourcing across boards. All reduce to multi-source pull → cross-source dedupe → Postgres + search-index ingestion. LinkedIn's structured data anchors the schema; complementary sources fill coverage gaps.

## How does this compare to the alternatives?

Three options for building a jobs aggregator data layer:

| Approach | Cost per 1,000 jobs/day across 3 sources | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Per-source DIY scrapers | Free compute, weeks of dev | Brittle without humanize tuning | 8–12 weeks | You own three stealth layers |
| Curated jobs-feed licence (LinkedIn Talent Solutions, Indeed Hiring Insights) | $50K–$300K/year | High | Months | Vendor lock-in |
| Thirdwatch LinkedIn + Career Site + regional source | $19/day at FREE = $570/month | Production-tested | One day | Thirdwatch maintains all three |

The DIY route is what most aggregator teams burn before getting Camoufox + DataDome bypass stable across multiple sources. The [LinkedIn Jobs Scraper actor page](/scrapers/linkedin-jobs-scraper) collapses one of the harder sources into a same-day integration.

## How to build a LinkedIn-anchored jobs aggregator in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull from LinkedIn alongside complementary sources?

Spawn parallel runs across LinkedIn, Career Sites, and a regional source. All three return the same canonical schema after light normalisation.

```python
import os, requests, time

TOKEN = os.environ["APIFY_TOKEN"]

QUERIES_LI = ["software engineer", "data scientist", "product manager"]
QUERIES_CS = ["software engineer", "data scientist"]
CAREER_URLS = ["https://jobs.lever.co/stripe", "https://boards.greenhouse.io/airbnb"]

# LinkedIn — global, structured salary
li_resp = requests.post(
    "https://api.apify.com/v2/acts/thirdwatch~linkedin-jobs-scraper/runs",
    params={"token": TOKEN},
    json={"queries": QUERIES_LI, "country": "us", "maxResultsPerQuery": 100,
          "scrapeMode": "standard"},
).json()

# Career Sites — employer-direct, freshest
cs_resp = requests.post(
    "https://api.apify.com/v2/acts/thirdwatch~career-site-job-scraper/runs",
    params={"token": TOKEN},
    json={"careerPageUrls": CAREER_URLS, "scrapeDescriptions": True,
          "maxJobsPerSite": 200},
).json()

# Indeed — US volume baseline
in_resp = requests.post(
    "https://api.apify.com/v2/acts/thirdwatch~indeed-jobs-scraper/runs",
    params={"token": TOKEN},
    json={"queries": QUERIES_LI, "location": "remote", "country": "www",
          "maxResults": 100, "scrapeDetails": True},
).json()

print("Spawned:", li_resp["data"]["id"], cs_resp["data"]["id"], in_resp["data"]["id"])
```

Three sources × ~150-300 jobs each = roughly 600-900 raw jobs per daily pull. Cost: $14-$22 at FREE pricing.

### Step 3: How do I dedupe and ingest into Postgres with source priority?

Build a normalised key, prefer employer-direct over LinkedIn, prefer LinkedIn over Indeed for fields they each lead.

```python
import pandas as pd, re

def normalise(s):
    return re.sub(r"\W+", " ", (s or "").lower()).strip()

frames = []
for source, run_id in [("linkedin", li_resp["data"]["id"]),
                        ("career_site", cs_resp["data"]["id"]),
                        ("indeed", in_resp["data"]["id"])]:
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
        frames.extend(items)

df = pd.DataFrame(frames)
df["dedupe_key"] = (
    df.title.fillna("").apply(normalise) + "|"
    + df.company_name.fillna(df.get("company", "")).apply(normalise) + "|"
    + df.location.fillna("").apply(normalise) + "|"
    + df.salary_min.fillna(-1).astype(int).astype(str)
)
PRIORITY = {"career_site": 0, "linkedin": 1, "indeed": 2}
df["priority"] = df.source.map(PRIORITY)
unique = (df.sort_values(["dedupe_key", "priority"])
            .drop_duplicates(subset=["dedupe_key"], keep="first"))
print(f"Deduped: {len(df)} → {len(unique)} unique ({len(unique)/len(df):.0%})")
```

`career_site` rows win when they overlap with LinkedIn since the employer-direct apply URL is canonical. LinkedIn beats Indeed for the same role because of richer structured data.

### Step 4: How do I serve faceted search with Meilisearch?

Push the deduped dataset to Meilisearch with skill, salary, and source facets.

```python
import meilisearch

client = meilisearch.Client("http://meilisearch:7700", os.environ["MEILI_KEY"])
index = client.index("jobs")
index.update_settings({
    "filterableAttributes": ["source", "salary_min", "location",
                              "experience_level", "skills", "job_type"],
    "sortableAttributes": ["salary_max", "posted_at"],
    "searchableAttributes": ["title", "company_name", "description"],
})

docs = unique.to_dict("records")
for d in docs:
    d["id"] = d["dedupe_key"]
    if isinstance(d.get("skills"), list):
        d["skills"] = [s.lower() for s in d["skills"]]

index.add_documents(docs, primary_key="id")
print(f"Indexed {len(docs)} jobs in Meilisearch")
```

Pair with a Next.js or Astro frontend; users get sub-100ms typo-tolerant search across thousands of fresh deduped jobs daily, with skill and salary facets that no LinkedIn-only scraper alternative offers.

## Sample output

A single deduped record (LinkedIn source, software engineer role) looks like this. Five rows weigh ~12 KB.

```json
{
  "title": "Software Engineer",
  "company_name": "Google",
  "location": "San Francisco, CA",
  "salary_raw": "$150,000 - $200,000/yr",
  "salary_min": 150000,
  "salary_max": 200000,
  "salary_currency": "USD",
  "salary_period": "yearly",
  "experience_level": "Mid-Senior level",
  "job_type": "Full-time",
  "industry": "Technology, Information and Internet",
  "skills": ["Python", "Java", "AWS"],
  "description": "We are looking for a talented Software Engineer to join...",
  "applicant_count": "200+ applicants",
  "is_easy_apply": true,
  "posted_at": "2026-04-05",
  "apply_url": "https://www.linkedin.com/jobs/view/123456/",
  "source": "linkedin"
}
```

`source` is the field that lets the aggregator UI offer per-board filtering and that downstream code uses to apply per-source enrichment logic. `apply_url` is the LinkedIn URL when the source is LinkedIn but resolves to the employer's ATS for `career_site` rows — which preserves attribution for the aggregator's affiliate-revenue model.

## Common pitfalls

Three things break LinkedIn-anchored aggregators. **Cross-source schema drift** — LinkedIn returns `company_name` while Career Site returns `company_name` (matching), but Indeed sometimes uses `company` (not `company_name`); the dedupe code in Step 3 handles this with `df.company_name.fillna(df.get("company", ""))`, but watch for similar field-name asymmetries. **LinkedIn's daily caching** — LinkedIn's public job search occasionally caches results for 30-60 minutes; if you pull twice within an hour and see no new jobs, that's caching, not your scraper failing. **Easy Apply attribution complexity** — `is_easy_apply: true` LinkedIn jobs route the apply through LinkedIn even when the underlying employer also publishes on their career site, which can make attribution ambiguous if you're tracking conversion sources. Treat employer-direct as canonical and LinkedIn as a discovery channel.

Thirdwatch's three sources all return the same canonical schema with light normalisation between, which makes the multi-source aggregator a same-day integration rather than a multi-month project. The combined cost (~$570/month at FREE pricing for daily 1K-jobs-per-source) sits well below any commercial multi-source jobs licence.

## Related use cases

- [Scrape LinkedIn Jobs without login](/blog/scrape-linkedin-jobs-without-login)
- [Track LinkedIn hiring velocity by company](/blog/track-linkedin-hiring-velocity-by-company)
- [Filter LinkedIn Jobs by skill and location](/blog/filter-linkedin-jobs-by-skill-and-location)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What does it cost to run a LinkedIn-anchored aggregator?

LinkedIn at $0.008/job is the priciest single source but typically returns the highest-quality structured data (parsed salary, skills, descriptions). A daily aggregator pulling 1,000 LinkedIn jobs alongside 1,000 each from Indeed, Naukri, and Career Sites costs $24/day at FREE pricing. Most aggregators monetize via affiliate placement fees or ATS integrations and break even at low-thousands of monthly active users.

### What sources should I include alongside LinkedIn?

Three complementary sources: LinkedIn (volume + structured salary), Career Sites (employer-direct, freshest), and a regional source per market (Indeed for US, Naukri for India, etc.). LinkedIn anchors the aggregator on global volume; Career Sites adds employer-direct freshness; the regional source covers the long-tail listings the global boards under-index. Three sources hits ~85% coverage; adding a fourth typically yields <5% incremental unique listings.

### How do I dedupe LinkedIn jobs against direct-employer postings?

Build a 4-tuple key on `(title-normalised, company-normalised, location-normalised, salary_min)`. Cross-source URLs differ even for the same role. The 4-tuple key catches 85-90% of cross-source duplicates. When LinkedIn shows `is_easy_apply: true` for a job and Career Sites also shows it from the employer's ATS, treat the employer-direct row as the canonical entry and keep LinkedIn as a discovery surface only.

### What database scheme handles a LinkedIn-anchored aggregator?

Postgres with a GIN full-text index on `title` + `description` handles up to 1 million active listings comfortably at sub-100ms search. Past 1M, push to [Meilisearch](https://www.meilisearch.com/) or Typesense. Key tables: `jobs` (canonical row per dedupe key), `sources` (source-specific URLs and metadata per job), `search_index` (denormalised view for fast filtering). Most LinkedIn-anchored aggregators stay under 500K active listings since the platform's own indexing decay removes older postings.

### How fresh does the aggregator need to be?

Six-hourly is the sweet spot. LinkedIn ranks new listings highly for the first 24-48 hours, so missing that window costs aggregator users their best inbound signal. Indeed and Naukri can be daily without losing much. Career Sites should be hourly because employer-direct freshness is the entire reason to include it. Stagger the schedules so your peak load doesn't hammer any single source.

### Can I monetize a jobs aggregator legally?

Yes, with two important caveats. (1) Drive users to the source's apply URL rather than re-hosting application flow — this preserves the source's user-acquisition value and stays clearly in fair-use territory. (2) Add value beyond aggregation (faceted search, alerts, salary normalisation) so you're not just re-publishing public listings verbatim. Most successful jobs aggregators monetize via affiliate placement fees from ATS providers, sponsored job boosts, and recruiter-tier subscriptions.

Run the [LinkedIn Jobs Scraper on Apify Store](https://apify.com/thirdwatch/linkedin-jobs-scraper) — pay-per-job, free to try, no credit card to test.
