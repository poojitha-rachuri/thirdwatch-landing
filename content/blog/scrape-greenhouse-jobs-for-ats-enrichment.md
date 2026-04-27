---
title: "Scrape Greenhouse Jobs for ATS Enrichment (2026 Guide)"
slug: "scrape-greenhouse-jobs-for-ats-enrichment"
description: "Pull live Greenhouse job listings into your ATS or CRM with Thirdwatch's Career Site Scraper at $0.003 per job. Python, no-code, and webhook recipes."
actor: "career-site-job-scraper"
actor_url: "https://apify.com/thirdwatch/career-site-job-scraper"
actorTitle: "Career Site Job Listing Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-lever-jobs-for-recruiter-pipeline"
  - "build-jobs-aggregator-from-company-career-pages"
  - "track-startup-hiring-velocity-with-career-sites"
keywords:
  - "greenhouse jobs scraper"
  - "ATS enrichment greenhouse"
  - "scrape boards.greenhouse.io"
  - "career site jobs API"
faqs:
  - q: "How much does it cost to scrape Greenhouse jobs?"
    a: "Thirdwatch's Career Site Scraper charges $0.003 per job listing on the FREE tier and drops to $0.0016 at GOLD volume. A 50-company watchlist with 30 open roles each costs roughly $4.50 per refresh — small enough to run hourly without budget pain."
  - q: "Do I need to know which ATS each company uses?"
    a: "No. The scraper auto-detects Greenhouse, Lever, Workday, BambooHR, Keka, Ashby, and Recruitee from the URL. Pass any mix of career page URLs in a single run and the actor routes each to the right parser before merging output into one dataset."
  - q: "Can I get full job descriptions, not just titles?"
    a: "Yes. Set scrapeDescriptions to true and the actor visits each job detail page to extract the full HTML description. Runs take longer because each job is a separate fetch, so leave it off when you only need a hiring-signal feed and turn it on for ATS enrichment or candidate matching."
  - q: "How fresh is the data?"
    a: "Each run pulls live from boards.greenhouse.io at request time — there is no cache. Pair the actor with Apify's built-in scheduler to refresh hourly, daily, or on a webhook trigger. Most ATS enrichment pipelines run every six hours and ingest only new apply_url values."
  - q: "Can I run this against companies on a non-Greenhouse ATS in the same job?"
    a: "Yes. careerPageUrls accepts a heterogeneous list. A single run can pull jobs from boards.greenhouse.io/discord, jobs.lever.co/stripe, and tesla.wd1.myworkdayjobs.com simultaneously. The output dataset normalises field names across platforms and tags each row with ats_platform."
  - q: "What's the difference between this actor and LinkedIn Jobs Scraper?"
    a: "LinkedIn Jobs aggregates from LinkedIn's index, which lags employer career pages by hours to days and sometimes misses senior or stealth roles. The Career Site Scraper goes straight to the source, so it's faster, more complete, and the apply_url points directly to the company's ATS instead of a LinkedIn redirect."
---

> Thirdwatch's [Career Site Job Listing Scraper](https://apify.com/thirdwatch/career-site-job-scraper) pulls live job listings from Greenhouse-hosted career pages at $0.003 per job, returning title, department, location, apply URL, and full descriptions ready to merge into an ATS or recruiter CRM. It auto-detects Greenhouse alongside Lever, Workday, BambooHR, Keka, Ashby, and Recruitee — one actor for every common career page, no per-platform scraper to maintain.

## Why scrape Greenhouse jobs for ATS enrichment

Recruiting teams using Greenhouse as their own ATS still need data on roles open at *other* companies — to source passive candidates, benchmark compensation, time outreach to hiring spikes, and feed candidate-matching models. The cleanest source is the same place candidates apply: each company's `boards.greenhouse.io/{slug}` page. According to [Greenhouse's 2025 hiring report](https://www.greenhouse.com/blog/the-state-of-hiring-2025), more than 7,500 companies use Greenhouse to publish jobs, including most of the YC and venture-backed cohort that recruiters care about most.

Pulling that data manually scales nowhere. A 100-company watchlist refreshed daily means 100 page loads, 100 manual exports, and a half-day of cleanup. Doing it on a six-hour cadence so your sourcers see fresh roles before competitors do is impossible without automation. The job-to-be-done is structured: pull every open role from a list of Greenhouse-hosted careers pages, normalise the schema, dedupe by `apply_url`, push into the CRM. That is what this actor exists to do, and it works the same way against the other major ATS platforms when a target company switches.

## How does this compare to the alternatives?

Three honest options for getting Greenhouse job data into an ATS or CRM:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Greenhouse Job Board API (per-company) | Free, but per-company auth | High when configured | 30 min × N companies | You manage tokens for every employer |
| LinkedIn Jobs aggregator scraper | $1–$8 (varies) | Lags hours to days, misses stealth roles | 1 hour | Provider absorbs LinkedIn changes |
| Thirdwatch Career Site Scraper | $3 ($0.003 × 1,000) | Production-tested across 7+ ATS platforms | 5 minutes | Thirdwatch monitors and patches upstream |

The Greenhouse Job Board API is technically free per company but requires the target employer to share a token — fine when you want only your own jobs, useless when you're tracking 50 competitors. LinkedIn aggregator data is cheap but stale and incomplete. The [Career Site Scraper actor page](/scrapers/career-site-job-scraper) documents the exact field mapping, but for ATS enrichment workflows the value is going straight to the source for every company in one call.

## How to scrape Greenhouse jobs for ATS enrichment in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), go to Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs from a list of Greenhouse companies?

Pass each company's full `boards.greenhouse.io/{slug}` URL in `careerPageUrls`. Set `scrapeDescriptions: true` if you want the full job description text in the dataset (you almost always do for ATS enrichment).

```python
import os, requests

ACTOR = "thirdwatch~career-site-job-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "careerPageUrls": [
            "https://boards.greenhouse.io/discord",
            "https://boards.greenhouse.io/airbnb",
            "https://boards.greenhouse.io/figma",
        ],
        "scrapeDescriptions": True,
        "maxJobsPerSite": 500,
    },
    timeout=900,
)
jobs = resp.json()
print(f"{len(jobs)} jobs across {len({j['company_name'] for j in jobs})} companies")
```

The dataset returns one row per job with `title`, `company_name`, `department`, `location`, `job_type`, `apply_url`, `description`, and `ats_platform: "greenhouse"`. The same call works unchanged if you swap a Lever or Workday URL into the list.

### Step 3: How do I dedupe against my existing ATS?

Greenhouse exposes a stable `apply_url` per job, so it makes the perfect natural key. Diff against your last snapshot and ingest only new rows.

```python
import pandas as pd

df = pd.DataFrame(jobs)
df = df.drop_duplicates(subset=["apply_url"])

# Compare against yesterday's snapshot (saved as Parquet)
yest = pd.read_parquet("greenhouse-2026-04-26.parquet")
new_rows = df[~df.apply_url.isin(yest.apply_url)]
print(f"{len(new_rows)} new jobs to push into the ATS")

df.to_parquet(f"greenhouse-{pd.Timestamp.utcnow().date()}.parquet")
```

`new_rows` is the delta you push into Greenhouse, Lever, Ashby, or whatever your team uses, attaching the job to a company record by name. Most ATS systems accept a CSV import or have a REST endpoint for creating jobs.

### Step 4: How do I run this on a schedule and pipe to a webhook?

Apify's built-in scheduler runs the actor on cron. Add a webhook in the actor's settings to POST the finished dataset URL to your ingestion service whenever a run finishes:

```bash
curl -X POST "https://api.apify.com/v2/schedules?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "greenhouse-watchlist-6h",
    "cronExpression": "0 */6 * * *",
    "timezone": "UTC",
    "isEnabled": true,
    "actions": [{
      "type": "RUN_ACTOR",
      "actorId": "thirdwatch~career-site-job-scraper",
      "runInput": {
        "careerPageUrls": ["https://boards.greenhouse.io/discord", "https://boards.greenhouse.io/airbnb"],
        "scrapeDescriptions": true,
        "maxJobsPerSite": 500
      }
    }]
  }'
```

Add a webhook of type `ACTOR.RUN.SUCCEEDED` pointing at your ingestion endpoint and you have a closed-loop pipeline: every six hours, fresh Greenhouse jobs land in your ATS without anyone touching a button.

## Sample output

A single row from the dataset with descriptions enabled looks like this. Five rows of this shape weigh ~25 KB.

```json
{
  "title": "Senior Backend Engineer",
  "company_name": "Discord",
  "department": "Engineering",
  "location": "San Francisco, CA",
  "job_type": "Full-time",
  "apply_url": "https://boards.greenhouse.io/discord/jobs/7341234",
  "description": "Discord is the place where people hang out... You'll own services that route 4B+ messages per day. Requirements: 5+ years backend, distributed systems, Go or Rust experience preferred...",
  "ats_platform": "greenhouse"
}
```

`ats_platform` is the field that lets a downstream pipeline branch — for example, only call the Greenhouse-specific deep enrichment for Greenhouse rows. `apply_url` is canonical and stable: it's what Greenhouse itself uses internally as the job ID, so you can rely on it as a primary key for ATS upserts. Salary fields are not in the schema because Greenhouse does not standardise them across employers; for compensation data, pair this actor with [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) or [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper).

## Common pitfalls

Three issues bite teams that wire this into production. **Boards-vs-job-app URLs** — Greenhouse exposes both `boards.greenhouse.io/{company}` (the listing page, what the actor expects) and `job-boards.greenhouse.io/embed/...` (an embed widget some employers use); always pass the boards URL, not the embed. **Description HTML drift** — Greenhouse lets employers customise rich-text formatting, so descriptions arrive with mixed HTML; strip tags downstream before token-counting for an LLM. **Custom subdomains for big employers** — Discord publishes under `boards.greenhouse.io/discord` but Robinhood uses `careers.robinhood.com` (a Greenhouse white-label); the actor handles both, but only the public `boards.greenhouse.io` URLs are stable enough to hard-code in a watchlist.

Thirdwatch's actor surfaces `ats_platform` on every record so a downstream pipeline can branch logic per platform without re-detecting from the URL. White-labelled domains are auto-routed to the Greenhouse parser when the underlying widget is detected, so a Robinhood pull and a Discord pull come back with identical schema.

## Related use cases

- [Scrape Lever jobs for a recruiter sourcing pipeline](/blog/scrape-lever-jobs-for-recruiter-pipeline)
- [Build a multi-company jobs aggregator from career pages](/blog/build-jobs-aggregator-from-company-career-pages)
- [Track startup hiring velocity with career site data](/blog/track-startup-hiring-velocity-with-career-sites)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Greenhouse jobs?

Thirdwatch's Career Site Scraper charges $0.003 per job listing on the FREE tier and drops to $0.0016 at GOLD volume. A 50-company watchlist with 30 open roles each costs roughly $4.50 per refresh — small enough to run hourly without budget pain.

### Do I need to know which ATS each company uses?

No. The scraper auto-detects Greenhouse, Lever, Workday, BambooHR, Keka, Ashby, and Recruitee from the URL. Pass any mix of career page URLs in a single run and the actor routes each to the right parser before merging output into one dataset.

### Can I get full job descriptions, not just titles?

Yes. Set `scrapeDescriptions: true` and the actor visits each job detail page to extract the full HTML description. Runs take longer because each job is a separate fetch, so leave it off when you only need a hiring-signal feed and turn it on for ATS enrichment or candidate matching.

### How fresh is the data?

Each run pulls live from `boards.greenhouse.io` at request time — there is no cache. Pair the actor with Apify's [built-in scheduler](https://docs.apify.com/platform/schedules) to refresh hourly, daily, or on a webhook trigger. Most ATS enrichment pipelines run every six hours and ingest only new `apply_url` values.

### Can I run this against companies on a non-Greenhouse ATS in the same job?

Yes. `careerPageUrls` accepts a heterogeneous list. A single run can pull jobs from `boards.greenhouse.io/discord`, `jobs.lever.co/stripe`, and `tesla.wd1.myworkdayjobs.com` simultaneously. The output dataset normalises field names across platforms and tags each row with `ats_platform`.

### What's the difference between this actor and LinkedIn Jobs Scraper?

LinkedIn Jobs aggregates from LinkedIn's index, which lags employer career pages by hours to days and sometimes misses senior or stealth roles. The Career Site Scraper goes straight to the source, so it's faster, more complete, and the `apply_url` points directly to the company's ATS instead of a LinkedIn redirect.

Run the [Career Site Job Listing Scraper on Apify Store](https://apify.com/thirdwatch/career-site-job-scraper) — pay-per-job, free to try, no credit card to test.
