---
title: "Filter LinkedIn Jobs by Skill and Location (2026 Guide)"
slug: "filter-linkedin-jobs-by-skill-and-location"
description: "Run skill-and-location-targeted LinkedIn Jobs queries at $0.008 per job using Thirdwatch. Boolean keyword logic + remote-vs-onsite splits + Postgres recipes."
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
  - "build-linkedin-jobs-aggregator-with-apify"
  - "track-linkedin-hiring-velocity-by-company"
keywords:
  - "linkedin jobs by skill"
  - "linkedin jobs by location"
  - "filter linkedin job postings"
  - "linkedin jobs boolean search"
faqs:
  - q: "How do skill-keyword filters actually work on LinkedIn?"
    a: "LinkedIn's job search ranks postings by relevance to the keyword string, not by exact-match. A query like 'senior python engineer kubernetes' returns roles where Python and Kubernetes appear in title/skills/description, ordered by LinkedIn's relevance scoring. Boolean operators (AND, OR, quoted phrases) work in the actor's queries field — pass them through verbatim."
  - q: "How do location filters interact with remote tags?"
    a: "Pass location as a keyword (`backend engineer Berlin` or `data scientist remote`). LinkedIn applies location matching loosely — a 'Berlin' query also surfaces some 'remote, Germany' postings. For strict remote-only, use the literal token 'remote' in the query and filter post-hoc on the `location` field for entries containing 'Remote' (LinkedIn's canonical token). For hybrid filtering, the description field carries the strongest signal."
  - q: "How precise is per-skill filtering at scale?"
    a: "For a single highly-specific skill (Rust, Tableau, Snowflake), per-skill filtering returns 80-90% relevant rows on the first page. For broad terms (Python, JavaScript, SQL) the noise is higher because many roles list these as nice-to-haves. For accuracy, layer Boolean AND with a senior-level qualifier ('senior python kubernetes engineer') and post-process by matching skill keywords against the description field."
  - q: "Can I run multi-location, multi-skill batches efficiently?"
    a: "Yes. Pass an array of pre-composed query strings ('senior react engineer London', 'senior react engineer Berlin', 'senior react engineer Amsterdam'). The actor parallelises across queries internally so a 30-query watchlist runs in roughly the same wall time as 5 queries. Each query returns up to 1000 listings; cost scales linearly with results returned."
  - q: "How do I dedupe across overlapping queries?"
    a: "Postings appearing across multiple skill or location queries return the same `apply_url` — that field is the canonical natural key for cross-query dedup. About 15-30% of rows duplicate across overlapping skill queries; dedupe by keeping the first occurrence (typically the most relevant query) before downstream analysis."
  - q: "What's the lowest-cost setup for a recruiter watchlist?"
    a: "Pure-HTTP mode (default since Apr 2026) at $0.95/1K runs gives the cheapest fetch. For a recruiter monitoring 25 skill-location combinations daily at 50 listings each: 25 × 50 = 1,250 jobs/day at $10/day FREE tier or $5/day GOLD. Monthly cost ranges $150-$300. Cheaper than any per-seat ATS integration."
---

> Thirdwatch's [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) lets recruiter teams and aggregator builders run skill-and-location-targeted queries at $0.008 per job — pure HTTP, no login, no browser, full structured output. Built for tech recruiters scoping multi-region searches, sourcing-tool builders surfacing candidate-fit listings, and aggregator pipelines that fork by skill cluster and metro.

## Why filter LinkedIn Jobs by skill and location

Skill-and-location targeting is the canonical recruiter-research workflow. According to [LinkedIn's 2024 Workforce Report](https://economicgraph.linkedin.com/), the platform indexes 14M+ active job listings globally, and over 60% of recruiter searches combine at least one skill keyword with a city or region. For sourcing tools, ATS-enrichment pipelines, and recruiter dashboards, skill-and-location-targeted feeds are the foundation.

The job-to-be-done is structured. A tech recruiter wants 5 skills (Python, React, Kubernetes, Postgres, AWS) × 6 metros (NY, SF, London, Berlin, Bangalore, Singapore) = 30 watchlist combinations refreshed daily. A sourcing-platform team wants to fork their candidate-fit pipeline by skill cluster (frontend vs backend vs ML). An aggregator wants per-region filtered feeds for their job-board partner integrations. All reduce to a query batch + per-query result cap returning structured rows ready for downstream filtering.

## How does this compare to the alternatives?

Three options for skill-and-location-targeted LinkedIn jobs data:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| LinkedIn Recruiter (paid seat) | $1,000–$1,500/seat/month | High, with sourcing tools | Hours | Per-seat per-month |
| Aggregator scrapers (Indeed, Google Jobs) | $1–$8 per 1K | Multi-source | Hours | Cross-source dedup needed |
| Thirdwatch LinkedIn Jobs Scraper | $0.95 ($0.008 × 119) | Pure HTTP, no login | 5 minutes | Thirdwatch tracks LinkedIn changes |

LinkedIn Recruiter is the official path but the per-seat cost makes it impractical for automated aggregator pipelines. The [LinkedIn Jobs Scraper actor page](/scrapers/linkedin-jobs-scraper) gives you the same underlying data for daily-monitoring volumes at a fraction of the cost.

## How to filter LinkedIn Jobs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I compose a skill × location batch?

Pass an array of pre-composed query strings combining skill and location tokens.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~linkedin-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

SKILLS = ["senior python engineer", "senior react engineer",
          "senior kubernetes engineer", "senior data scientist",
          "senior machine learning engineer"]
METROS = ["New York", "San Francisco", "London", "Berlin",
          "Bangalore", "Singapore", "remote"]

queries = [f"{s} {m}" for s, m in product(SKILLS, METROS)]
print(f"{len(queries)} skill × location queries")

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.location.nunique()} locations")
```

5 skills × 7 metros = 35 queries × 50 = up to 1,750 jobs, costing ~$14.

### Step 3: How do I post-filter for skill precision?

LinkedIn's relevance ranking is loose — match skill keywords against `description` for higher precision.

```python
SKILL_KEYWORDS = {
    "python": ["python", "django", "flask", "fastapi"],
    "react": ["react", "next.js", "redux"],
    "kubernetes": ["kubernetes", "k8s", "helm", "kustomize"],
    "ml": ["machine learning", "pytorch", "tensorflow", "sklearn"],
}

def has_skill(description, skill):
    if not isinstance(description, str):
        return False
    return any(kw in description.lower() for kw in SKILL_KEYWORDS[skill])

for skill in SKILL_KEYWORDS:
    df[f"is_{skill}"] = df.description.apply(lambda d: has_skill(d, skill))

precision = df[df.is_python].copy()
print(f"{len(precision)} python-confirmed jobs (vs {(df.title.str.lower().str.contains('python')).sum()} title-matched)")
```

Description-keyword matching catches 90%+ relevant roles vs ~70% from title-only matching. The 20-point gain compounds at scale.

### Step 4: How do I split remote vs onsite?

LinkedIn's `location` field carries the canonical remote signal — postings tagged remote include "Remote" in the location string.

```python
df["is_remote"] = df.location.str.contains("Remote", case=False, na=False)
df["is_hybrid"] = df.description.str.contains(
    r"hybrid|in[- ]office \d+ days|days? per week", case=False, na=False, regex=True
)
df["is_onsite"] = ~df.is_remote & ~df.is_hybrid

split = df.groupby(["is_remote", "is_hybrid", "is_onsite"]).size()
print(split)
```

Splitting by work-mode lets recruiters route remote-eligible postings to remote-first sourcing pipelines and onsite postings to local recruiters. Hybrid-mode detection requires description-keyword matching since LinkedIn doesn't expose a structured hybrid flag.

## Sample output

A single LinkedIn job record with skill-relevant fields populated looks like this. Five rows weigh ~6 KB.

```json
{
  "title": "Senior Python Engineer",
  "company_name": "Stripe",
  "location": "San Francisco, CA (Remote)",
  "experience_level": "Mid-Senior level",
  "job_type": "Full-time",
  "skills": ["Python", "Django", "PostgreSQL", "Kubernetes"],
  "description": "We are looking for a Senior Python Engineer to join our team...",
  "applicant_count": "200+ applicants",
  "is_easy_apply": true,
  "posted_at": "2026-04-25",
  "apply_url": "https://www.linkedin.com/jobs/view/123456/"
}
```

`skills` is the killer field for skill-filter pipelines — it's LinkedIn's parsed skill-tag array, separate from description text. For cross-query dedup, `apply_url` is canonical. `posted_at` lets you isolate truly-new postings vs re-listings. `is_easy_apply: true` indicates LinkedIn-hosted apply flow vs employer ATS redirect.

## Common pitfalls

Three things go wrong in skill-and-location filtering pipelines. **Skill-tag sparseness** — only ~50% of postings populate the `skills` array; for the rest, fall back to description-keyword matching. **Location-string drift** — LinkedIn's `location` formats vary ("San Francisco, CA", "San Francisco Bay Area", "Greater San Francisco"); for clean grouping, normalise via a metro-mapping table rather than exact-string matching. **Boolean operator handling** — LinkedIn's web search supports basic boolean (AND, OR, quoted phrases) but the actor's keyword passthrough varies; for highest precision, compose multiple separate queries rather than relying on complex Boolean strings.

Thirdwatch's actor uses pure-HTTP guest API mode (default since April 2026) at $0.95/1K, 96% cheaper than Playwright. The 1024 MB memory and 600-second timeout headroom mean even 50-query watchlist runs complete cleanly. Pair LinkedIn Jobs with [LinkedIn Profile Scraper](https://apify.com/thirdwatch/linkedin-profile-scraper) to enrich shortlisted candidates with profile data once a target listing is identified. A fourth subtle issue worth flagging: LinkedIn occasionally surfaces postings with stale `posted_at` values (the field reflects original-posting date, not relisting date) — for recency-sensitive sourcing, supplement `posted_at` with the scrape timestamp and treat the larger of the two as your "actively-listed since" anchor. A fifth pattern unique to skill-and-location pipelines: certain mega-employers (Google, Amazon, Meta) post the same role across multiple metros simultaneously to scope geographic flexibility, which inflates per-metro role counts; dedupe on `(company_name, title, posted_at)` before counting per-metro to avoid this distortion. A sixth pitfall: some emerging skill keywords (e.g., very new framework names) return sparse LinkedIn results despite real demand — for cutting-edge skills, supplement LinkedIn searches with [GitHub Jobs](https://apify.com/thirdwatch/career-site-job-scraper) and Wellfound queries to capture the early-adopter segment that LinkedIn under-indexes. A seventh and final pattern worth noting for international recruiter pipelines: LinkedIn's location matching is materially weaker for non-English city names — queries like `senior python engineer München` return fewer results than `senior python engineer Munich`, even though both refer to the same metro. For European, LATAM, and APAC pipelines, always use the canonical English city name in queries and post-process the `location` field for native-language address strings rather than relying on LinkedIn to match across language variants.

## Related use cases

- [Scrape LinkedIn Jobs without login](/blog/scrape-linkedin-jobs-without-login)
- [Build a LinkedIn Jobs aggregator with Apify](/blog/build-linkedin-jobs-aggregator-with-apify)
- [Track LinkedIn hiring velocity by company](/blog/track-linkedin-hiring-velocity-by-company)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How do skill-keyword filters actually work on LinkedIn?

LinkedIn's job search ranks postings by relevance to the keyword string, not by exact-match. A query like `senior python engineer kubernetes` returns roles where Python and Kubernetes appear in title/skills/description, ordered by LinkedIn's relevance scoring. Boolean operators (AND, OR, quoted phrases) work in the actor's `queries` field — pass them through verbatim.

### How do location filters interact with remote tags?

Pass location as a keyword (`backend engineer Berlin` or `data scientist remote`). LinkedIn applies location matching loosely — a "Berlin" query also surfaces some "remote, Germany" postings. For strict remote-only, use the literal token "remote" in the query and filter post-hoc on the `location` field for entries containing "Remote" (LinkedIn's canonical token). For hybrid filtering, the description field carries the strongest signal.

### How precise is per-skill filtering at scale?

For a single highly-specific skill (Rust, Tableau, Snowflake), per-skill filtering returns 80-90% relevant rows on the first page. For broad terms (Python, JavaScript, SQL) the noise is higher because many roles list these as nice-to-haves. For accuracy, layer Boolean AND with a senior-level qualifier (`senior python kubernetes engineer`) and post-process by matching skill keywords against the description field.

### Can I run multi-location, multi-skill batches efficiently?

Yes. Pass an array of pre-composed query strings (`senior react engineer London`, `senior react engineer Berlin`, `senior react engineer Amsterdam`). The actor parallelises across queries internally so a 30-query watchlist runs in roughly the same wall time as 5 queries. Each query returns up to 1000 listings; cost scales linearly with results returned.

### How do I dedupe across overlapping queries?

Postings appearing across multiple skill or location queries return the same `apply_url` — that field is the canonical natural key for cross-query dedup. About 15-30% of rows duplicate across overlapping skill queries; dedupe by keeping the first occurrence (typically the most relevant query) before downstream analysis.

### What's the lowest-cost setup for a recruiter watchlist?

Pure-HTTP mode (default since Apr 2026) at $0.95/1K runs gives the cheapest fetch. For a recruiter monitoring 25 skill-location combinations daily at 50 listings each: 25 × 50 = 1,250 jobs/day at $10/day FREE tier or $5/day GOLD. Monthly cost ranges $150-$300. Cheaper than any per-seat ATS integration.

Run the [LinkedIn Jobs Scraper on Apify Store](https://apify.com/thirdwatch/linkedin-jobs-scraper) — pay-per-job, free to try, no credit card to test.
