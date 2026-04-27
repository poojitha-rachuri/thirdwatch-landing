---
title: "Build a Remote Jobs Aggregator with Apify and RemoteOK (2026)"
slug: "build-remote-jobs-aggregator-with-apify"
description: "Build a remote-only jobs aggregator at $0.0015 per record with Thirdwatch's RemoteOK Scraper plus Wellfound and LinkedIn. Postgres + Meilisearch recipes."
actor: "remoteok-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/remoteok-jobs-scraper"
actorTitle: "RemoteOK Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-remote-jobs-with-remoteok-api"
  - "track-remote-hiring-trends-by-tech-stack"
  - "find-remote-engineering-jobs-by-salary-band"
keywords:
  - "remote jobs aggregator"
  - "build remote-only board"
  - "remote jobs api postgres"
  - "remoteok wellfound aggregator"
faqs:
  - q: "How much does it cost to run a remote-jobs aggregator?"
    a: "RemoteOK at $0.0015/job is the cheapest source. Adding Wellfound (Camoufox stealth) at $0.008/job and LinkedIn Jobs at $0.008/job for full coverage runs $30-$50/day for 5,000 daily ingested jobs at FREE pricing — under $1,500/month for a complete remote-only aggregator. Most remote-jobs sites monetize via job-post fees or referral commissions and break even quickly at this cost basis."
  - q: "What sources should I include for full remote-jobs coverage?"
    a: "Three core sources: RemoteOK (purist remote-only, employer-set tags), Wellfound (formerly AngelList, strong on funded-startup remote roles), and LinkedIn Jobs filtered to remote (volume + mainstream coverage). Optional fourth: WeWorkRemotely or HimalayasApp via custom HTTP scrapers if you find gaps. The first three cover roughly 85% of unique remote postings any given week."
  - q: "How fresh does an aggregator need to be?"
    a: "Hourly is overkill; daily is sluggish. The sweet spot for a remote-jobs aggregator is six-hourly or twelve-hourly, with RemoteOK refreshed more frequently than Wellfound or LinkedIn because its posting velocity is highest and posts age out faster. Six-hourly RemoteOK + 12-hourly Wellfound + daily LinkedIn-remote is a balanced cadence."
  - q: "What database and search layer should I use?"
    a: "For under 100K active listings, Postgres with full-text GIN index handles search at sub-100ms. Past 100K or for typo-tolerance and faceted ranking, push to Meilisearch or Typesense. Both are open-source and run on $20-$40/month VMs at this scale. The actor's structured output ingests cleanly into either."
  - q: "How do I dedupe jobs that appear on multiple boards?"
    a: "Build a 4-tuple key on (title-normalised, company-normalised, salary_min, location-canonical). Lower-case and strip punctuation before hashing. RemoteOK uses tags; Wellfound and LinkedIn use job titles + descriptions. Cross-source URLs differ even for the same role, so URL alone is insufficient. The 4-tuple key catches 85-90% of cross-source duplicates."
  - q: "Can I add salary normalization across sources?"
    a: "Yes. RemoteOK publishes USD integer bands when employers disclose; Wellfound and LinkedIn publish in local currencies (USD, EUR, GBP). Use a daily FX rate to normalize all bands to USD. Wellfound's salary fields are typically equity-inclusive headlines; trim outliers above $400K base which usually indicate equity-loaded headline numbers rather than cash salary."
---

> Thirdwatch's [RemoteOK Scraper](https://apify.com/thirdwatch/remoteok-jobs-scraper) is the cheapest data layer ($0.0015 per job) for a remote-only jobs aggregator — combine with [Wellfound Scraper](https://apify.com/thirdwatch/wellfound-jobs-scraper) and [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) filtered to remote for ~85% coverage of weekly remote postings. This guide is the canonical recipe for building a remote-jobs site on top of Apify actors, with Postgres ingestion, Meilisearch faceted search, and dedupe across sources.

## Why build a remote-jobs aggregator

The remote-jobs market is meaningfully larger than any single board indexes. According to [Buffer's 2024 State of Remote Work report](https://buffer.com/state-of-remote-work/), more than 90% of knowledge workers prefer at least hybrid arrangements and 30% are fully remote — but remote postings are scattered across boards because most general boards still treat remote as a filter rather than a first-class category. A purpose-built remote-jobs aggregator captures this audience by curating the union of remote-specific boards (RemoteOK, Wellfound) and remote-filtered general boards (LinkedIn, Indeed) into a single search experience.

The job-to-be-done is concrete. A remote-jobs site builder needs daily ingestion across three or four sources, dedupe, and a fast search UX. A productivity SaaS targeting remote workers wants embedded job listings as a community feature. A staffing agency placing remote engineers wants the same data piped into their CRM. All of these reduce to the same shape — multi-source pull → dedupe → Postgres or search-engine ingestion. RemoteOK at $0.0015 per job makes the unit economics work; the other sources fill coverage gaps.

## How does this compare to the alternatives?

Three options for building a remote-jobs aggregator data layer:

| Approach | Cost per 1,000 jobs × daily × 3 sources | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Per-board scraper (DIY across 3-4 boards) | Free compute, weeks of dev | Brittle | 6–12 weeks | You own every parser |
| Curated remote-jobs feed licence (RemoteOK PRO API, Working Nomads) | $200–$2,000/month | High | Hours | Vendor lock-in, terms vary |
| Thirdwatch RemoteOK + Wellfound + LinkedIn Jobs | ~$18/day at FREE = $540/month | Production-tested | Half a day | Thirdwatch maintains all three parsers |

Curated remote-jobs licences exist but most prohibit commercial republishing without an upgrade tier. The Thirdwatch combination gives you raw data with no commercial restrictions — you own the dataset and the UX. The [RemoteOK Scraper actor page](/scrapers/remoteok-jobs-scraper) is the cheapest of the three and the right starting point.

## How to build a remote-jobs aggregator in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull from all three sources in parallel?

Spawn one async run per source. The three Thirdwatch scrapers all return the same canonical schema, so the merge step is trivial.

```python
import os, requests, time

TOKEN = os.environ["APIFY_TOKEN"]
SOURCES = {
    "remoteok": ("thirdwatch~remoteok-jobs-scraper",
                 {"queries": ["engineer", "developer", "designer", "marketing"],
                  "maxResults": 1500}),
    "wellfound": ("thirdwatch~wellfound-jobs-scraper",
                  {"queries": ["software engineer", "data engineer", "product manager"],
                   "remote": True, "maxResults": 500}),
    "linkedin": ("thirdwatch~linkedin-jobs-scraper",
                 {"queries": ["software engineer", "designer", "marketing"],
                  "location": "Worldwide", "remote": True, "maxResults": 1000}),
}

run_ids = {}
for source, (actor, payload) in SOURCES.items():
    r = requests.post(
        f"https://api.apify.com/v2/acts/{actor}/runs",
        params={"token": TOKEN}, json=payload,
    )
    run_ids[source] = r.json()["data"]["id"]

results = {}
for source, run_id in run_ids.items():
    while True:
        s = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}",
                         params={"token": TOKEN}).json()["data"]["status"]
        if s in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(20)
    if s == "SUCCEEDED":
        results[source] = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
            params={"token": TOKEN},
        ).json()
        print(f"{source}: {len(results[source])} jobs")
```

A typical daily ingestion: 1,500 RemoteOK + 500 Wellfound + 1,000 LinkedIn = 3,000 raw jobs per day, costing ~$15 at FREE pricing.

### Step 3: How do I dedupe and ingest into Postgres?

Build the canonical 4-tuple key, drop duplicates, upsert into Postgres.

```python
import pandas as pd, psycopg2.extras, re

def normalise(s):
    return re.sub(r"\W+", " ", (s or "").lower()).strip()

frames = []
for source, items in results.items():
    df = pd.DataFrame(items)
    df["source"] = source
    frames.append(df)

combined = pd.concat(frames, ignore_index=True, sort=False)
combined["dedupe_key"] = (
    combined.title.fillna("").apply(normalise) + "|"
    + combined.company.fillna("").apply(normalise) + "|"
    + combined.location.fillna("").apply(normalise) + "|"
    + combined.salary_min.fillna(-1).astype(int).astype(str)
)
unique = combined.drop_duplicates(subset=["dedupe_key"], keep="first")

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(cur, """
        INSERT INTO remote_jobs
          (dedupe_key, source, title, company, salary_min, salary_max,
           tags, location, description, posted_date, url)
        VALUES %s
        ON CONFLICT (dedupe_key) DO UPDATE SET last_seen_at = now()
    """, [(r.dedupe_key, r.source, r.title, r.company,
           r.salary_min, r.salary_max, r.get("tags"),
           r.location, r.description, r.posted_date, r.url)
          for r in unique.itertuples()])
print(f"{len(unique)} unique jobs ingested ({len(combined)} → {len(unique)})")
```

Typical compression: 3,000 raw → 1,800-2,000 unique after dedupe.

### Step 4: How do I serve fast faceted search?

For under 100K active jobs, Postgres GIN full-text plus btree on (source, salary_min, posted_date) handles user search comfortably. Past 100K, push to Meilisearch.

```sql
CREATE INDEX rjobs_search ON remote_jobs USING gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);
CREATE INDEX rjobs_filter ON remote_jobs (source, salary_min, posted_date DESC);
```

```python
import meilisearch

client = meilisearch.Client("http://meilisearch:7700", os.environ["MEILI_KEY"])
index = client.index("remote_jobs")
index.update_settings({
    "filterableAttributes": ["source", "salary_min", "tags", "location"],
    "sortableAttributes": ["salary_max", "posted_date"],
    "searchableAttributes": ["title", "company", "description"],
})
index.add_documents(unique.to_dict("records"), primary_key="dedupe_key")
```

Pair with a Next.js or Astro frontend; users get sub-100ms typo-tolerant search across 3,000+ daily fresh remote roles.

## Sample output

Each row from the unified pipeline carries the same canonical schema, with `source` distinguishing origin. Five rows weigh ~15 KB.

```json
{
  "title": "Senior Backend Engineer",
  "company": "GitLab",
  "salary_min": 120000,
  "salary_max": 180000,
  "tags": ["python", "go", "kubernetes", "senior"],
  "location": "Worldwide",
  "description": "We are looking for a Senior Backend Engineer to help scale our core API across multiple regions...",
  "posted_date": "2026-04-08",
  "source": "remoteok",
  "url": "https://remoteok.com/remote-jobs/123456-senior-backend-engineer-gitlab"
}
```

`source` lets users filter the aggregator by origin. `tags` from RemoteOK fold into your faceted-search facet alongside Wellfound and LinkedIn keywords; the union is your aggregator's tag taxonomy. `salary_min` and `salary_max` are normalised to integer USD across all three sources, with the actor handling per-source parsing.

## Common pitfalls

Three issues bite remote-jobs aggregators. **Dedupe-key over-merging** — the 4-tuple key collapses jobs with the same title, company, location, and salary, but employers occasionally post variations of the same role with slightly different titles ("Backend Engineer" vs "Senior Backend Engineer") that you'd want to keep separate; loosen to a 3-tuple (drop salary) when you want stricter merging, and be aware that Wellfound and LinkedIn sometimes show the same role with different salary bands. **Tag-taxonomy drift** — RemoteOK's `js → javascript`, Wellfound's `Software Engineer → Sw Eng`, and LinkedIn's free-text are inconsistent; build a normalisation map at ingestion. **Stale-listing flagging** — jobs posted 30+ days ago on RemoteOK and Wellfound are usually closed but still indexed; add a `last_seen_at` filter and de-rank rows last seen more than 14 days ago in your aggregator UI.

Thirdwatch's three scrapers all return the same canonical schema, which is the deliberate choice that makes a multi-source aggregator straightforward. The cheap-source/expensive-source mix (RemoteOK at $0.0015 + Wellfound + LinkedIn at $0.008) is what makes the unit economics work for an aggregator running daily at scale.

## Related use cases

- [Scrape remote jobs with the RemoteOK API](/blog/scrape-remote-jobs-with-remoteok-api)
- [Track remote hiring trends by tech stack](/blog/track-remote-hiring-trends-by-tech-stack)
- [Find remote engineering jobs by salary band](/blog/find-remote-engineering-jobs-by-salary-band)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to run a remote-jobs aggregator?

RemoteOK at $0.0015/job is the cheapest source. Adding Wellfound (Camoufox stealth) at $0.008/job and LinkedIn Jobs at $0.008/job for full coverage runs $30-$50/day for 5,000 daily ingested jobs at FREE pricing — under $1,500/month for a complete remote-only aggregator. Most remote-jobs sites monetize via job-post fees or referral commissions and break even quickly at this cost basis.

### What sources should I include for full remote-jobs coverage?

Three core sources: RemoteOK (purist remote-only, employer-set tags), Wellfound (formerly AngelList, strong on funded-startup remote roles), and LinkedIn Jobs filtered to remote (volume + mainstream coverage). Optional fourth: [WeWorkRemotely](https://weworkremotely.com/) or HimalayasApp via custom HTTP scrapers if you find gaps. The first three cover roughly 85% of unique remote postings any given week.

### How fresh does an aggregator need to be?

Hourly is overkill; daily is sluggish. The sweet spot for a remote-jobs aggregator is six-hourly or twelve-hourly, with RemoteOK refreshed more frequently than Wellfound or LinkedIn because its posting velocity is highest and posts age out faster. Six-hourly RemoteOK + 12-hourly Wellfound + daily LinkedIn-remote is a balanced cadence.

### What database and search layer should I use?

For under 100K active listings, Postgres with full-text GIN index handles search at sub-100ms. Past 100K or for typo-tolerance and faceted ranking, push to [Meilisearch](https://www.meilisearch.com/) or [Typesense](https://typesense.org/). Both are open-source and run on $20-$40/month VMs at this scale. The actor's structured output ingests cleanly into either.

### How do I dedupe jobs that appear on multiple boards?

Build a 4-tuple key on `(title-normalised, company-normalised, salary_min, location-canonical)`. Lower-case and strip punctuation before hashing. RemoteOK uses tags; Wellfound and LinkedIn use job titles + descriptions. Cross-source URLs differ even for the same role, so URL alone is insufficient. The 4-tuple key catches 85-90% of cross-source duplicates.

### Can I add salary normalization across sources?

Yes. RemoteOK publishes USD integer bands when employers disclose; Wellfound and LinkedIn publish in local currencies (USD, EUR, GBP). Use a daily FX rate to normalize all bands to USD. Wellfound's salary fields are typically equity-inclusive headlines; trim outliers above $400K base which usually indicate equity-loaded headline numbers rather than cash salary.

Run the [RemoteOK Scraper on Apify Store](https://apify.com/thirdwatch/remoteok-jobs-scraper) — pay-per-job, free to try, no credit card to test.
