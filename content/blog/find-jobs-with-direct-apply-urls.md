---
title: "Find Jobs with Direct Apply URLs (2026 Google Jobs Guide)"
slug: "find-jobs-with-direct-apply-urls"
description: "Surface direct-apply URLs from Google Jobs at $0.008 per record using Thirdwatch. Skip Google redirects, route candidates straight to ATS apply flows."
actor: "google-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/google-jobs-scraper"
actorTitle: "Google Jobs Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-google-jobs-aggregated-listings"
  - "build-multi-source-jobs-feed-with-google-jobs"
  - "track-job-posting-velocity-on-google-jobs"
keywords:
  - "google jobs apply url"
  - "direct ats apply url"
  - "skip google jobs redirect"
  - "linkedin indeed apply url scraper"
faqs:
  - q: "Why direct-apply URLs matter"
    a: "Direct-apply URLs route candidates straight to the source ATS or job-board apply flow (LinkedIn, Indeed, Greenhouse, Lever) rather than through a Google redirect. This preserves source-board UTM parameters, employer-tracking pixels, and the candidate's UX continuity. For aggregator builders and recruiter-pipeline integrations, direct-apply URLs are essential — Google redirects add 1-2 second latency and break referral attribution."
  - q: "How many apply URLs does Google Jobs return per posting?"
    a: "Google Jobs aggregates listings from multiple boards and returns up to 8 apply URLs per posting (one per source — LinkedIn, Indeed, Glassdoor, ZipRecruiter, employer ATS, etc.). The actor surfaces all of them. For aggregator builders, you can route candidates to whichever source provides the best UX or referral economics. About 60% of postings return 3+ apply URLs; 25% return 5+."
  - q: "Which apply URL should I prefer for routing?"
    a: "Three-tier preference: (1) direct ATS (Greenhouse, Lever, Workday, SmartRecruiters) — preserves employer's intended candidate flow; (2) LinkedIn — has the lowest drop-off because users are already logged in; (3) Indeed — fallback when ATS-direct unavailable. Avoid Glassdoor and ZipRecruiter for routing — both have higher friction at the apply step than LinkedIn or direct-ATS."
  - q: "Can I detect employer ATS from the URL?"
    a: "Yes. Direct-ATS URLs follow predictable patterns: `boards.greenhouse.io/{company}/jobs/{id}`, `jobs.lever.co/{company}/{id}`, `{company}.wd1.myworkdayjobs.com/`, `careers.{company}.com/`. Filter the apply_urls array for these patterns to extract direct-ATS routes preferentially. About 35-45% of Google Jobs listings include a direct-ATS URL alongside aggregator URLs."
  - q: "What's the cost for an aggregator with direct-apply URLs?"
    a: "$0.008 per record FREE tier. A 200-keyword daily aggregator pull at 100 results each: 20K records/day × $0.008 = $160/day FREE. Each record carries up to 8 apply URLs at no extra cost — you're paying once per Google Jobs listing, not per apply URL. Monthly cost ranges $1,500-$5,000 depending on cadence and coverage."
  - q: "How fresh are apply URLs?"
    a: "Each scrape pulls live — apply URLs reflect Google's current index. URLs occasionally go stale when employers close roles or migrate ATS providers (typical 5-10% staleness rate at any given time). For aggregators, validate apply URLs at click-time (HEAD request) before redirecting candidates; for batch exports, refresh weekly to keep at least 95% of URLs live."
---

> Thirdwatch's [Google Jobs Scraper](https://apify.com/thirdwatch/google-jobs-scraper) returns multi-source apply URLs per listing at $0.008 per record — direct ATS, LinkedIn, Indeed, Glassdoor, ZipRecruiter, employer career sites all surfaced in one call. Built for jobs-aggregator developers, ATS-integration platforms, recruiter-pipeline tools, and meta-search operators that need attribution-clean candidate routing.

## Why surface direct-apply URLs

Google Jobs aggregates listings from 20+ boards but its UI redirects users through a Google-controlled link before sending them to the source apply flow. According to [Google's 2024 Jobs Search statistics](https://blog.google/products/google-jobs/), the redirect step adds 1-2 seconds of latency and strips 15-25% of candidate referral attribution. For aggregator builders, ATS-integration platforms, and recruiter-pipeline tools, surfacing the underlying direct-apply URLs is the difference between attribution-clean and attribution-broken pipelines.

The job-to-be-done is structured. A jobs-aggregator builder wants direct-apply URLs to route candidates without Google redirects (preserves UTM parameters, source attribution, and candidate UX). An ATS-integration platform wants ATS-direct URLs preferentially to support employer-side tracking. A recruiter-pipeline tool wants source-prioritized URLs for clean conversion attribution. A meta-search SaaS wants per-listing apply-URL fan-out for users to choose their preferred source. All reduce to Google Jobs query + apply_urls array extraction + source-priority routing logic.

## How does this compare to the alternatives?

Three options for direct-apply URL surfacing:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Direct-source scrapers (LinkedIn + Indeed + per-ATS) | $24–$32 (4 sources combined) | Per-source | Half day per source | Per-source |
| Google Jobs UI redirect path | Free (no scraping) | Loses attribution | N/A | Google-controlled |
| Thirdwatch Google Jobs Scraper | $8 ($0.008 × 1,000) | Multi-source apply URLs | 5 minutes | Thirdwatch tracks Google changes |

Direct-source scraping gives the deepest per-board coverage but at 3-4x the unit cost. Google Jobs UI is free but breaks attribution. The [Google Jobs Scraper actor page](/scrapers/google-jobs-scraper) collapses 4-8 source URLs per listing into one structured field at the lowest unit cost.

## How to find direct-apply URLs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull listings with all apply URLs?

Pass keyword + location queries; the actor returns the full apply_urls array per listing.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~google-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": ["software engineer New York",
                      "data scientist San Francisco",
                      "product manager Austin"],
          "country": "us", "maxResults": 100},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
df["url_count"] = df.apply_urls.apply(len)
print(f"{len(df)} jobs, median {df.url_count.median():.0f} apply URLs per listing")
```

3 queries × 100 results = up to 300 records, costing $2.40. Each record carries 1-8 apply URLs.

### Step 3: How do I detect ATS-direct URLs preferentially?

Filter the apply_urls array for known ATS patterns.

```python
import re

ATS_PATTERNS = {
    "greenhouse": re.compile(r"boards\.greenhouse\.io/[\w-]+/jobs/\d+"),
    "lever": re.compile(r"jobs\.lever\.co/[\w-]+/[\w-]+"),
    "workday": re.compile(r"\.wd\d+\.myworkdayjobs\.com/"),
    "smartrecruiters": re.compile(r"jobs\.smartrecruiters\.com/[\w-]+"),
    "ashby": re.compile(r"jobs\.ashbyhq\.com/[\w-]+"),
    "rippling": re.compile(r"ats\.rippling\.com/[\w-]+"),
}

def find_ats(urls):
    for url in urls:
        for ats, pattern in ATS_PATTERNS.items():
            if pattern.search(url):
                return {"ats": ats, "url": url}
    return None

df["ats_direct"] = df.apply_urls.apply(find_ats)
ats_count = df.ats_direct.notna().sum()
print(f"{ats_count}/{len(df)} listings have direct-ATS URLs ({100*ats_count/len(df):.0f}%)")
print(df[df.ats_direct.notna()][["title", "company_name", "ats_direct"]].head(10))
```

ATS-direct URLs are the gold standard for routing — they preserve full employer-side tracking and candidate UX. Greenhouse, Lever, Workday, and Ashby are the most-common ATS providers in tech.

### Step 4: How do I implement priority-based routing?

Three-tier fallback: ATS-direct → LinkedIn → Indeed → Google fallback.

```python
def route_url(row):
    if row.ats_direct:
        return {"source": row.ats_direct["ats"], "url": row.ats_direct["url"]}
    for url in row.apply_urls:
        if "linkedin.com" in url:
            return {"source": "linkedin", "url": url}
    for url in row.apply_urls:
        if "indeed.com" in url:
            return {"source": "indeed", "url": url}
    return {"source": "other", "url": row.apply_urls[0] if row.apply_urls else None}

df["route"] = df.apply(route_url, axis=1)
print(df.route.apply(lambda r: r["source"]).value_counts())

# Persist routing table for downstream services
df[["title", "company_name", "location", "route"]].to_json(
    "apply_routes.jsonl", orient="records", lines=True
)
```

The routing table is ready for an aggregator's apply-link service to consume — one canonical URL per listing with source attribution preserved.

## Sample output

A single Google Jobs record with multi-source apply URLs looks like this. Five rows weigh ~10 KB.

```json
{
  "title": "Senior Software Engineer",
  "company_name": "Stripe",
  "location": "San Francisco, CA",
  "salary": "$180,000 - $250,000",
  "description": "We are looking for a Senior Software Engineer...",
  "job_type": "Full-time",
  "source": "LinkedIn",
  "apply_url": "https://www.linkedin.com/jobs/view/123456",
  "apply_urls": [
    "https://www.linkedin.com/jobs/view/123456",
    "https://www.indeed.com/viewjob?jk=abc123",
    "https://www.glassdoor.com/job-listing/...",
    "https://boards.greenhouse.io/stripe/jobs/4567890",
    "https://stripe.com/jobs/listing/senior-software-engineer/4567890"
  ],
  "posted_date": "2 days ago"
}
```

`apply_urls` is the killer field — surfaces all available apply paths, including the direct ATS URL (`boards.greenhouse.io/stripe/...`) and direct employer career page (`stripe.com/jobs/...`) alongside aggregator URLs. `apply_url` (singular) is Google's chosen primary; `apply_urls` (plural) lets you build your own routing logic with full source visibility.

## Common pitfalls

Three things go wrong in apply-URL routing pipelines. **URL staleness** — about 5-10% of apply URLs go stale within 30 days as employers close roles or migrate ATS; for aggregators, validate URLs at click-time (HEAD request) before redirecting candidates. **Tracking-parameter loss** — some ATS systems require employer-specific UTM parameters that Google strips; for full attribution, supplement Google's URLs with employer-direct careers-page resolution. **Multi-listing dedup** — the same role often appears under multiple Google Jobs entries with overlapping but non-identical apply_urls arrays; dedupe on `(company_name, title, location)` before treating as unique listings.

Thirdwatch's actor uses Camoufox stealth-browser at $2.20/1K, ~72% margin. The 4096 MB memory and 3,600-second timeout headroom mean even multi-keyword batch runs complete cleanly. Pair Google Jobs with [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) and [Career Site Scraper](https://apify.com/thirdwatch/career-site-job-scraper) for ATS-direct enrichment when the apply_urls array doesn't include a direct-ATS URL. A fourth subtle issue worth flagging: Google Jobs occasionally returns apply URLs that point to expired Greenhouse/Lever postings — the role is closed but the public listing page still exists with a "no longer accepting applications" notice; for clean routing, validate the apply page returns a 200 with valid apply form before treating the URL as live. A fifth pattern unique to direct-apply pipelines: certain enterprise ATS (Workday, Oracle Taleo) require session-cookie initialization before accepting applications, so direct-ATS URLs sometimes fail when candidates click them from external aggregators; for these ATS, prefer LinkedIn or employer-career-page URLs as the routing target. A sixth and final pitfall: the apply_urls array order is not guaranteed across scrapes — Google reshuffles based on its own ranking signals; for stable routing, always apply your priority logic on every scrape rather than caching the first-position URL.

## Related use cases

- [Scrape Google Jobs aggregated listings](/blog/scrape-google-jobs-aggregated-listings)
- [Build multi-source jobs feed with Google Jobs](/blog/build-multi-source-jobs-feed-with-google-jobs)
- [Track job posting velocity on Google Jobs](/blog/track-job-posting-velocity-on-google-jobs)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why direct-apply URLs matter

Direct-apply URLs route candidates straight to the source ATS or job-board apply flow (LinkedIn, Indeed, Greenhouse, Lever) rather than through a Google redirect. This preserves source-board UTM parameters, employer-tracking pixels, and the candidate's UX continuity. For aggregator builders and recruiter-pipeline integrations, direct-apply URLs are essential — Google redirects add 1-2 second latency and break referral attribution.

### How many apply URLs does Google Jobs return per posting?

Google Jobs aggregates listings from multiple boards and returns up to 8 apply URLs per posting (one per source — LinkedIn, Indeed, Glassdoor, ZipRecruiter, employer ATS, etc.). The actor surfaces all of them. For aggregator builders, you can route candidates to whichever source provides the best UX or referral economics. About 60% of postings return 3+ apply URLs; 25% return 5+.

### Which apply URL should I prefer for routing?

Three-tier preference: (1) direct ATS (Greenhouse, Lever, Workday, SmartRecruiters) — preserves employer's intended candidate flow; (2) LinkedIn — has the lowest drop-off because users are already logged in; (3) Indeed — fallback when ATS-direct unavailable. Avoid Glassdoor and ZipRecruiter for routing — both have higher friction at the apply step than LinkedIn or direct-ATS.

### Can I detect employer ATS from the URL?

Yes. Direct-ATS URLs follow predictable patterns: `boards.greenhouse.io/{company}/jobs/{id}`, `jobs.lever.co/{company}/{id}`, `{company}.wd1.myworkdayjobs.com/`, `careers.{company}.com/`. Filter the `apply_urls` array for these patterns to extract direct-ATS routes preferentially. About 35-45% of Google Jobs listings include a direct-ATS URL alongside aggregator URLs.

### What's the cost for an aggregator with direct-apply URLs?

$0.008 per record FREE tier. A 200-keyword daily aggregator pull at 100 results each: 20K records/day × $0.008 = $160/day FREE. Each record carries up to 8 apply URLs at no extra cost — you're paying once per Google Jobs listing, not per apply URL. Monthly cost ranges $1,500-$5,000 depending on cadence and coverage.

### How fresh are apply URLs?

Each scrape pulls live — apply URLs reflect Google's current index. URLs occasionally go stale when employers close roles or migrate ATS providers (typical 5-10% staleness rate at any given time). For aggregators, validate apply URLs at click-time (HEAD request) before redirecting candidates; for batch exports, refresh weekly to keep at least 95% of URLs live.

Run the [Google Jobs Scraper on Apify Store](https://apify.com/thirdwatch/google-jobs-scraper) — pay-per-job, free to try, no credit card to test.
