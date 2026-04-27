---
title: "Scrape Lever Jobs for a Recruiter Sourcing Pipeline (2026)"
slug: "scrape-lever-jobs-for-recruiter-pipeline"
description: "Stream live Lever job postings into your sourcing tools at $0.003 per job with Thirdwatch's Career Site Scraper. Python recipes, dedupe, and webhook setup."
actor: "career-site-job-scraper"
actor_url: "https://apify.com/thirdwatch/career-site-job-scraper"
actorTitle: "Career Site Job Listing Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-greenhouse-jobs-for-ats-enrichment"
  - "build-jobs-aggregator-from-company-career-pages"
  - "track-startup-hiring-velocity-with-career-sites"
keywords:
  - "lever jobs scraper"
  - "scrape jobs.lever.co"
  - "recruiter sourcing pipeline lever"
  - "lever ATS api scraper"
faqs:
  - q: "How much does it cost to scrape Lever job postings?"
    a: "Thirdwatch's Career Site Scraper charges $0.003 per job on the FREE tier, dropping to $0.0016 at GOLD volume. A 75-company Lever watchlist averaging 20 open roles each — typical for a venture-backed sourcing pipeline — costs about $4.50 per refresh, cheap enough to run every two hours."
  - q: "Why scrape Lever directly instead of using LinkedIn?"
    a: "Lever pages publish jobs the moment a recruiter posts them, while LinkedIn's scrape-and-republish pipeline lags by hours and frequently skips senior or stealth roles. Going to jobs.lever.co directly gives you the apply URL in the format the company actually uses, which matters when integrating with a candidate-tracking workflow."
  - q: "Can I scrape Lever and Greenhouse companies in one run?"
    a: "Yes. Pass a heterogeneous careerPageUrls list — jobs.lever.co/stripe and boards.greenhouse.io/discord can sit in the same array. The actor auto-detects each platform from the URL and the merged dataset tags every row with ats_platform so downstream pipelines can branch."
  - q: "Does Lever's robots.txt or rate limiting block scraping?"
    a: "Lever's public job board pages are designed to be indexed and linked-to. Thirdwatch uses a residential-proxy rotation at conservative concurrency to stay well within polite-crawling norms. In production we've never hit a Lever rate limit on watchlists under 200 companies refreshing hourly."
  - q: "Can I get Lever job tags and team names?"
    a: "Yes. Lever exposes department, team, location, and commitment (full-time, contract, etc.) on every listing, and the actor's department, location, and job_type fields map directly to those. For richer fields like team-level tags, enable scrapeDescriptions and parse the description HTML in your own pipeline."
  - q: "How do I keep my CRM from re-importing the same job every run?"
    a: "Use apply_url as the natural key. Lever's apply URLs are stable for the lifetime of a posting (they encode the Lever job UUID), so an upsert on apply_url plus a last_seen_at timestamp gives you a clean dedupe with zero false positives across runs."
---

> Thirdwatch's [Career Site Job Listing Scraper](https://apify.com/thirdwatch/career-site-job-scraper) pulls live Lever-hosted job postings from `jobs.lever.co/{company}` at $0.003 per job, returning title, department, location, apply URL, and full descriptions. The same actor handles Greenhouse, Workday, BambooHR, Keka, Ashby, and Recruitee in one call — purpose-built to feed a recruiter's sourcing pipeline without juggling per-platform scrapers.

## Why scrape Lever for a sourcing pipeline

Lever powers the careers pages of a meaningful slice of venture-backed companies — the kind of high-velocity hiring teams sourcers actually compete for. According to [Lever's 2025 customer signals](https://www.lever.co/customers/), its customer base spans thousands of companies including Netflix, Shopify, KPMG, and Cisco. For a sourcing team, Lever pages are the freshest possible source of "this company is hiring this role right now": the moment a recruiter posts a requisition internally, the Lever page reflects it, before LinkedIn and aggregators index it hours later.

The job-to-be-done for a sourcing pipeline is structured: pull every open role across a watchlist of Lever-hosted companies on a tight cadence, dedupe against what's already in your CRM, push only new postings to your sourcers' inbox or your candidate-matching model. The cleanest way to do this without writing per-Lever HTML parsing is one normalised actor that already understands every Lever page in the wild — that is what this actor does, and the same code works the day a target company switches from Lever to Ashby.

## How does this compare to the alternatives?

Three options for getting Lever jobs into a recruiter pipeline:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Lever Postings API (per-company) | Free, public per-company | High when stable | Documented but rate-limited | You manage every company's endpoint |
| LinkedIn-based aggregator scraper | $1–$8 (provider-dependent) | Lags hours, misses stealth | 1 hour | Provider absorbs LinkedIn changes |
| Thirdwatch Career Site Scraper | $3 ($0.003 × 1,000) | Production-tested across 7+ ATS | 5 minutes | Thirdwatch monitors upstream changes |

Lever's public Postings API exists at `api.lever.co/v0/postings/{company}` and is genuinely good — the catch is you have to call it per company, handle Lever's per-company rate caps, and parse the response yourself for every employer. The [Career Site Scraper actor page](/scrapers/career-site-job-scraper) bundles that work for Lever and six other platforms behind a single actor invocation.

## How to scrape Lever jobs for a sourcing pipeline in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below uses an environment variable:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs from a list of Lever companies?

Pass the public Lever URLs in `careerPageUrls`. For a sourcing pipeline you almost always want full descriptions so candidate-matching has enough context — set `scrapeDescriptions: true`.

```python
import os, requests

ACTOR = "thirdwatch~career-site-job-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "careerPageUrls": [
            "https://jobs.lever.co/netflix",
            "https://jobs.lever.co/shopify",
            "https://jobs.lever.co/figma",
        ],
        "scrapeDescriptions": True,
        "maxJobsPerSite": 500,
    },
    timeout=900,
)
jobs = resp.json()
print(f"{len(jobs)} jobs across {len({j['company_name'] for j in jobs})} companies")
```

The dataset returns one row per job with `title`, `company_name`, `department`, `location`, `job_type`, `apply_url`, `description`, and `ats_platform: "lever"`. A 75-company Lever pull at 20 jobs each runs in under five minutes wall-clock.

### Step 3: How do I filter to only the roles my sourcers care about?

Filter the returned dataset client-side by department, location, and keyword. A staff-engineering sourcer's daily filter looks like this:

```python
import re

def is_target(job):
    title = job["title"].lower()
    if not re.search(r"(staff|principal|distinguished)\s+(software\s+)?engineer", title):
        return False
    if job["location"] and "us" not in job["location"].lower() and "remote" not in job["location"].lower():
        return False
    return True

shortlist = [j for j in jobs if is_target(j)]
for j in shortlist:
    print(f"{j['company_name']:>15}  {j['title']:<45}  {j['location']}")
    print(f"                  {j['apply_url']}")
```

Filtering downstream rather than upstream gives you full control — Lever has no canonical "level" field, so titles plus optional description matching is the only reliable source.

### Step 4: How do I dedupe against my CRM and push only new roles?

Maintain a running snapshot keyed on `apply_url`. Every run, diff against the previous snapshot and forward only the delta to whatever endpoint your sourcers use (Slack, Notion, internal CRM webhook).

```python
import json, pathlib, requests

snapshot = pathlib.Path("lever-watchlist.json")
prev = set(json.loads(snapshot.read_text())) if snapshot.exists() else set()

current = {j["apply_url"]: j for j in shortlist}
new_urls = set(current) - prev

for url in new_urls:
    job = current[url]
    requests.post(
        "https://hooks.slack.com/services/.../...",
        json={"text": f"*New role at {job['company_name']}*: {job['title']} ({job['location']})\n{url}"},
        timeout=10,
    )

snapshot.write_text(json.dumps(list(current)))
print(f"{len(new_urls)} new roles forwarded")
```

Drop this into a 30-minute cron via Apify's [scheduler](https://docs.apify.com/platform/schedules) and your sourcers see fresh Lever roles before they ever appear on LinkedIn.

## Sample output

A single row from the dataset with descriptions enabled looks like this. Five rows weigh ~30 KB on the wire.

```json
{
  "title": "Staff Software Engineer, Distributed Systems",
  "company_name": "Figma",
  "department": "Engineering",
  "location": "San Francisco, CA / Remote",
  "job_type": "Full-time",
  "apply_url": "https://jobs.lever.co/figma/abc123-7541-4f9e",
  "description": "Figma is on a mission to make design accessible... You'll own the multiplayer collaboration layer that powers 4M+ concurrent users. 8+ years backend; experience with CRDTs, OT, or low-latency event systems...",
  "ats_platform": "lever"
}
```

`apply_url` is the canonical key you should treat as primary throughout your pipeline — it is stable for the lifetime of the posting and unique per Lever job UUID. `location` mirrors what the employer typed, so you'll see "San Francisco, CA / Remote", "Remote – Americas", and "London, UK" all coexist; do not assume a clean parse without normalisation. `description` is HTML when scraped from Lever's job detail page; strip tags before counting tokens for an LLM matcher.

## Common pitfalls

Three issues recur in Lever sourcing pipelines. **Title-level mismatch** — Lever doesn't standardise levels (some teams use "Staff Engineer", others "Senior Staff Engineer", others "Principal Engineer III") so any title-based filter needs a regex with explicit alternation, not a simple equality check. **Department drift** — companies frequently rename departments (e.g. "Engineering" → "Product Engineering" → "Platform Engineering" over 18 months) which breaks any hard-coded department filter; cluster by keywords instead. **Closed roles linger** — Lever doesn't remove every closed posting immediately; jobs sometimes stay live for a few hours after the requisition closes, so an apply attempt that bounces is not a bug in the actor but a function of Lever's caching.

Thirdwatch's actor surfaces `ats_platform` on every record so downstream code can branch by platform, and the residential-proxy rotation keeps you well clear of any per-employer rate caps. The dataset's de-duplication on `apply_url` happens at the Apify dataset level so even repeated requests within a run won't double-count a job. A fourth subtle issue is that some Lever-hosted companies operate a separate Lever instance per business unit (for example a single parent might have `jobs.lever.co/parentco` and `jobs.lever.co/parentco-engineering`); your watchlist needs both URLs explicitly because the parser treats each Lever subdomain as an independent surface.

## Related use cases

- [Scrape Greenhouse jobs for ATS enrichment](/blog/scrape-greenhouse-jobs-for-ats-enrichment)
- [Build a multi-company jobs aggregator from career pages](/blog/build-jobs-aggregator-from-company-career-pages)
- [Track startup hiring velocity with career site data](/blog/track-startup-hiring-velocity-with-career-sites)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Lever job postings?

Thirdwatch's Career Site Scraper charges $0.003 per job on the FREE tier, dropping to $0.0016 at GOLD volume. A 75-company Lever watchlist averaging 20 open roles each — typical for a venture-backed sourcing pipeline — costs about $4.50 per refresh, cheap enough to run every two hours.

### Why scrape Lever directly instead of using LinkedIn?

Lever pages publish jobs the moment a recruiter posts them, while LinkedIn's scrape-and-republish pipeline lags by hours and frequently skips senior or stealth roles. Going to `jobs.lever.co` directly gives you the apply URL in the format the company actually uses, which matters when integrating with a candidate-tracking workflow.

### Can I scrape Lever and Greenhouse companies in one run?

Yes. Pass a heterogeneous `careerPageUrls` list — `jobs.lever.co/stripe` and `boards.greenhouse.io/discord` can sit in the same array. The actor auto-detects each platform from the URL and the merged dataset tags every row with `ats_platform` so downstream pipelines can branch.

### Does Lever's robots.txt or rate limiting block scraping?

Lever's public job board pages are designed to be indexed and linked-to. Thirdwatch uses a residential-proxy rotation at conservative concurrency to stay well within polite-crawling norms. In production we've never hit a Lever rate limit on watchlists under 200 companies refreshing hourly.

### Can I get Lever job tags and team names?

Yes. Lever exposes department, team, location, and commitment (full-time, contract, etc.) on every listing, and the actor's `department`, `location`, and `job_type` fields map directly to those. For richer fields like team-level tags, enable `scrapeDescriptions` and parse the description HTML in your own pipeline.

### How do I keep my CRM from re-importing the same job every run?

Use `apply_url` as the natural key. Lever's apply URLs are stable for the lifetime of a posting (they encode the Lever job UUID), so an upsert on `apply_url` plus a `last_seen_at` timestamp gives you a clean dedupe with zero false positives across runs.

Run the [Career Site Job Listing Scraper on Apify Store](https://apify.com/thirdwatch/career-site-job-scraper) — pay-per-job, free to try, no credit card to test.
