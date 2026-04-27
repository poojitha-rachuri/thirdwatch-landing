---
title: "The Complete Guide to Scraping Job Boards (2026)"
slug: "guide-scraping-job-boards"
description: "Pick the right Thirdwatch scraper for any jobs use case — LinkedIn, Indeed, Glassdoor, Naukri, Monster, Career Sites and 10 more. Decision tree + cross-source recipes."
actor: "linkedin-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/linkedin-jobs-scraper"
actorTitle: "Thirdwatch Jobs Scrapers"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-linkedin-jobs-without-login"
  - "scrape-indeed-jobs-for-recruiter-pipeline"
  - "scrape-naukri-jobs-for-india-recruiting"
keywords:
  - "scrape job boards guide"
  - "compare job board scrapers"
  - "jobs aggregator data sources"
  - "best jobs scraper apify"
faqs:
  - q: "Which job board has the best coverage?"
    a: "Depends on geography and seniority. LinkedIn dominates US/UK/EU senior + product roles. Indeed has the broadest US coverage including mid-market and blue-collar. Naukri is the canonical India source for IT services and mid-market. Google Jobs aggregates 20+ boards into one query — best single discovery surface, but descriptions are sometimes shorter than originals. Most aggregators run Google Jobs for breadth + LinkedIn/Indeed for depth on top results."
  - q: "Where do I start if I'm building a recruiter pipeline?"
    a: "Three actors cover 90%+ of recruiter use cases: LinkedIn Jobs ($0.008) for breadth + structured fields + applicant counts; Indeed ($0.008) for mid-market + salary disclosure; Career Site Job Scraper ($0.003) for direct ATS data from Greenhouse/Lever (skips the aggregator markup). Layer Glassdoor for company-research depth on shortlisted employers."
  - q: "Which job board reveals salary most often?"
    a: "Indeed publishes salary on ~40% of US listings (employer-published, regulated by state pay-transparency laws). Naukri publishes on ~25% (Lacs format). Glassdoor estimates salary on most listings (model-derived, with disclosure). LinkedIn rarely publishes salary on the job page itself but exposes parsed bands via the structured data field. For salary benchmarking, combine Indeed (US/UK/EU) + Naukri (India) + Glassdoor (estimates) + LinkedIn (structured)."
  - q: "What's the right strategy for a multi-source aggregator?"
    a: "Two-tier approach: (1) Google Jobs for primary discovery (one query covers 20+ boards); (2) per-source scrapers for deep enrichment on top-priority listings (Google Jobs descriptions are sometimes truncated). Dedupe across sources on (title-norm, company-norm, location-norm, salary_min) — about 50-60% of Google Jobs rows overlap with direct-source rows; the unique 40-50% is what direct scraping misses."
  - q: "Are remote jobs handled well?"
    a: "RemoteOK is the canonical remote-first source ($0.0015 — uses their public JSON API, near-zero cost). LinkedIn and Indeed both expose remote flags in structured fields. For remote-only aggregators, RemoteOK + LinkedIn (filtered to remote) covers 80%+ of US/UK remote tech jobs. For India-remote, layer in CutShort which has strong remote-startup coverage."
  - q: "How much does a full jobs aggregator cost monthly?"
    a: "Depends on scope. Daily 200-keyword run on LinkedIn + Indeed + Google Jobs ≈ 60K records/day = $480/day FREE tier. Same setup on GOLD tier (high volume) ≈ $240/day. For mid-market aggregators (50K daily records, mixed sources), $5-15K/month. Scale linearly — most are cost-bound by scope, not unit price."
---

> Thirdwatch publishes 14 dedicated jobs scrapers covering LinkedIn, Indeed, Glassdoor, Naukri, Monster, ZipRecruiter, SimplyHired, Wellfound, CutShort, RemoteOK, Adzuna, Reed, Career Sites (Greenhouse/Lever ATS), Google Jobs, and Google Search jobs aggregation. This guide is the decision tree for picking the right one (or combination) for your use case — recruiter pipelines, salary benchmarks, hiring-velocity dashboards, talent-market research.

## The job-scraping landscape

Job board coverage is fragmented by geography, employer tier, and role type. According to [LinkedIn's 2024 Workforce report](https://economicgraph.linkedin.com/), the platform indexes 14M+ active listings globally; [Indeed's Hiring Lab](https://www.hiringlab.org/) reports 7M+ US listings. No single board has more than 30% of total US public job postings — which is why production aggregators run 3-5 sources in parallel.

For a recruiter team, the right answer is usually 2-3 sources. For a meta-search aggregator or labor-economics research function, 5-8. For monopoly-source intelligence (India IT-services, US healthcare, EU mid-market), one or two specialists per geography.

## Compare Thirdwatch jobs scrapers

| Scraper | Coverage | Approach | Cost/1K | Best for |
|---|---|---|---|---|
| [LinkedIn Jobs](/scrapers/linkedin-jobs-scraper) | Global, MNC + product | Pure HTTP guest API | $8 | Senior + product hiring |
| [Indeed](/scrapers/indeed-scraper) | US-broad | Camoufox stealth | $8 | Mid-market + salary |
| [Glassdoor](/scrapers/glassdoor-scraper) | US/UK | Playwright | $8 | Reviews, salary, interviews |
| [Naukri](/scrapers/naukri-scraper) | India dominant | Browser fetch | $2 | India IT services |
| [Google Jobs](/scrapers/google-jobs-scraper) | 20+ boards aggregated | Camoufox + JSON | $8 | Single-query meta-search |
| [Google Search Jobs](/scrapers/google-search-scraper) | SERP-level | GOOGLE_SERP proxy | $8 | SEO competition research |
| [Monster](/scrapers/monster-scraper) | US/UK | Camoufox | $8 | Mid-market non-tech |
| [ZipRecruiter](/scrapers/ziprecruiter-scraper) | US | Camoufox + Turnstile | $8 | Hourly/blue-collar |
| [SimplyHired](/scrapers/simplyhired-scraper) | US | Playwright | $8 | Aggregator coverage |
| [Wellfound](/scrapers/wellfound-scraper) | Startup-focused | Camoufox | $8 | Early-stage tech |
| [CutShort](/scrapers/cutshort-scraper) | India startups | impit + JSON-LD | $5 | India tech startups |
| [RemoteOK](/scrapers/remoteok-scraper) | Remote-only | Public JSON API | $1.50 | Remote-first roles |
| [Adzuna](/scrapers/adzuna-scraper) | UK/EU | HTTP + datacenter | $1.50 | UK/EU mid-market |
| [Reed](/scrapers/reed-scraper) | UK | HTTP + Next.js data | $3 | UK structured data |
| [Career Site Scraper](/scrapers/career-site-scraper) | Direct ATS | HTTP (Lever/Greenhouse APIs) | $3 | Greenhouse, Lever direct |
| [LinkedIn Profiles](/scrapers/linkedin-profile-scraper) | Candidate side | HTTP + Sec-Fetch | $10 | Candidate enrichment |

## Decision tree: which scraper for which use case?

**"I'm building a US-focused jobs aggregator."** Start with Google Jobs (one query covers 20+ boards). Layer LinkedIn Jobs and Indeed for depth on top-priority listings. Add Career Site Scraper for direct-ATS data on high-value employers (Greenhouse, Lever).

**"I'm benchmarking salaries across roles."** Indeed (US, employer-published) + Naukri (India, Lacs format) + Glassdoor (US, with estimates as fallback). For role × experience × metro percentile bands, target 200+ rows per cell.

**"I'm tracking hiring velocity at competitor companies."** Indeed for mid-market employers + LinkedIn for enterprise. Daily snapshot, dedupe on apply_url, alert on 3x+ delta over 30-day baseline.

**"I'm building an India-only recruiter pipeline."** Naukri (primary, IT services + mid-market) + LinkedIn India (MNC + product) + CutShort (startups). For comp data, layer in AmbitionBox.

**"I'm running an ABM pipeline that includes hiring signals."** LinkedIn Jobs (filtered by companyName) + Career Site Scraper (direct ATS for top accounts) + LinkedIn Profile Scraper for decision-maker enrichment. Cross-reference hiring spikes with profile-side intent signals.

**"I want remote jobs only."** RemoteOK (cheapest, JSON API, no proxy needed) + LinkedIn filtered to "Remote". For India remote, add CutShort.

**"I need raw labor-market velocity data for research."** Google Jobs (cross-source aggregation) for breadth + Indeed for depth + BLS for authoritative reference. Compute 7-day rolling deltas vs prior 28-day average.

## Cross-source recipe: build a 3-source aggregator

```python
import os, requests, pandas as pd

TOKEN = os.environ["APIFY_TOKEN"]

def run(actor, payload, timeout=3600):
    r = requests.post(
        f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items",
        params={"token": TOKEN}, json=payload, timeout=timeout
    )
    return r.json()

QUERIES = ["software engineer", "data scientist", "product manager"]
LOCS = ["New York", "San Francisco", "Austin"]

linkedin = run("thirdwatch~linkedin-jobs-scraper",
               {"queries": [f"{q} {loc}" for q in QUERIES for loc in LOCS],
                "maxResults": 100})
indeed = run("thirdwatch~indeed-jobs-scraper",
             {"queries": [f"{q} {loc}" for q in QUERIES for loc in LOCS],
              "country": "us", "maxResults": 100})
google = run("thirdwatch~google-jobs-scraper",
             {"queries": [f"{q} {loc}" for q in QUERIES for loc in LOCS],
              "country": "us", "maxResults": 100})

df = pd.concat([
    pd.DataFrame(linkedin).assign(source="linkedin"),
    pd.DataFrame(indeed).assign(source="indeed"),
    pd.DataFrame(google).assign(source="google_jobs"),
], ignore_index=True)

# Cross-source dedup on canonical 4-tuple
df["title_norm"] = df.title.str.lower().str.replace(r"[^a-z0-9 ]", "", regex=True)
df["company_norm"] = df.company_name.str.lower().str.strip()
df["loc_norm"] = df.location.str.split(",").str[0].str.lower().str.strip()
df["salary_min"] = df.salary.str.extract(r"(\d{4,6})").astype(float)
df = df.drop_duplicates(subset=["title_norm", "company_norm", "loc_norm", "salary_min"])

print(f"{len(df)} unique jobs across {df.source.nunique()} sources")
print(df.source.value_counts())
```

About 50-60% of Google Jobs records overlap with direct LinkedIn or Indeed rows; the unique 40-50% is the lift from running Google Jobs alongside.

## All use-case guides for jobs scrapers

### LinkedIn Jobs
- [Scrape LinkedIn jobs without login](/blog/scrape-linkedin-jobs-without-login)
- [Build a LinkedIn Jobs aggregator with Apify](/blog/build-linkedin-jobs-aggregator-with-apify)
- [Track LinkedIn hiring velocity by company](/blog/track-linkedin-hiring-velocity-by-company)
- [Filter LinkedIn jobs by skill and location](/blog/filter-linkedin-jobs-by-skill-and-location)

### LinkedIn Profiles
- [Scrape LinkedIn profiles without login](/blog/scrape-linkedin-profiles-without-login)
- [Build candidate shortlist from LinkedIn profiles](/blog/build-candidate-shortlist-from-linkedin-profiles)
- [Enrich your CRM with LinkedIn profile data](/blog/enrich-crm-with-linkedin-profile-data)
- [Find decision-makers by title and company](/blog/find-decision-makers-by-title-and-company)

### Indeed
- [Scrape Indeed jobs for recruiter pipeline](/blog/scrape-indeed-jobs-for-recruiter-pipeline)
- [Track US tech hiring with Indeed data](/blog/track-us-tech-hiring-with-indeed-data)
- [Build a salary database from Indeed listings](/blog/build-indeed-salary-database)
- [Monitor competitor hiring on Indeed](/blog/monitor-competitor-hiring-on-indeed)

### Glassdoor
- [Scrape Glassdoor salaries for compensation benchmarking](/blog/scrape-glassdoor-salaries-for-comp-benchmarking)
- [Research company reviews on Glassdoor](/blog/research-company-reviews-on-glassdoor)
- [Find Glassdoor interview questions by role](/blog/find-glassdoor-interview-questions-by-role)
- [Track Glassdoor rating changes over time](/blog/track-glassdoor-rating-changes-over-time)

### Naukri
- [Scrape Naukri jobs for India recruiting](/blog/scrape-naukri-jobs-for-india-recruiting)
- [Track India IT services hiring on Naukri](/blog/track-india-it-services-hiring-on-naukri)
- [Build Naukri salary benchmarks by experience](/blog/build-naukri-salary-benchmarks-by-experience)
- [Find India tech jobs by skill on Naukri](/blog/find-india-tech-jobs-by-skill-on-naukri)

### Google Jobs
- [Scrape Google Jobs aggregated listings](/blog/scrape-google-jobs-aggregated-listings)
- [Build multi-source jobs feed with Google Jobs](/blog/build-multi-source-jobs-feed-with-google-jobs)
- [Find jobs with direct apply URLs](/blog/find-jobs-with-direct-apply-urls)
- [Track job posting velocity on Google Jobs](/blog/track-job-posting-velocity-on-google-jobs)

### Career Site Scraper (Greenhouse / Lever ATS)
- [Scrape Greenhouse jobs for ATS enrichment](/blog/scrape-greenhouse-jobs-for-ats-enrichment)
- [Scrape Lever jobs for recruiter pipeline](/blog/scrape-lever-jobs-for-recruiter-pipeline)
- [Build jobs aggregator from company career pages](/blog/build-jobs-aggregator-from-company-career-pages)
- [Track startup hiring velocity with career sites](/blog/track-startup-hiring-velocity-with-career-sites)

### CutShort, RemoteOK, Monster, SimplyHired
- [Scrape CutShort tech jobs India](/blog/scrape-cutshort-tech-jobs-india)
- [Scrape remote jobs with RemoteOK API](/blog/scrape-remote-jobs-with-remoteok-api)
- [Scrape Monster jobs for recruiter pipeline](/blog/scrape-monster-jobs-for-recruiter-pipeline)
- [Scrape SimplyHired jobs for aggregator](/blog/scrape-simplyhired-jobs-for-aggregator)

(Full Wave 1 + Wave 2 list — 100+ guides — at [/blog](/blog).)

## Common patterns across jobs scrapers

**Canonical natural keys.** Each source has one stable per-posting key:
- LinkedIn / Indeed: `apply_url`
- Naukri: `apply_url` (job-listing URL)
- Google Jobs: `(title, company, location)` since apply_url varies per source
- Career Sites: ATS-job-id within domain

**Re-listing inflation.** Companies close and re-post roles within 30-90 days. Smooth velocity calculations with 7-day rolling averages and cross-source dedup on the 4-tuple `(title-norm, company-norm, location-norm, salary_min)`.

**Salary normalization.** Indeed publishes ranges + units ("$80K-$120K a year", "$25-$35 an hour"). Naukri publishes Lacs ("12-18 Lacs P.A."). LinkedIn shows parsed bands when available. Always extract min/max integers + normalize unit (annual / hourly × 2080 / monthly × 12) before benchmark aggregation.

**Function classification.** Title-keyword matching produces stable cohorts: engineering, sales, marketing, product, ops. About 90% of US tech roles classify cleanly via title keywords; for the long tail, fall back to description-keyword matching.

## Frequently asked questions

### Which job board has the best coverage?

Depends on geography and seniority. LinkedIn dominates US/UK/EU senior + product roles. Indeed has the broadest US coverage including mid-market and blue-collar. Naukri is the canonical India source for IT services and mid-market. Google Jobs aggregates 20+ boards into one query — best single discovery surface, but descriptions are sometimes shorter than originals. Most aggregators run Google Jobs for breadth + LinkedIn/Indeed for depth on top results.

### Where do I start if I'm building a recruiter pipeline?

Three actors cover 90%+ of recruiter use cases: LinkedIn Jobs ($0.008) for breadth + structured fields + applicant counts; Indeed ($0.008) for mid-market + salary disclosure; Career Site Job Scraper ($0.003) for direct ATS data from Greenhouse/Lever (skips the aggregator markup). Layer Glassdoor for company-research depth on shortlisted employers.

### Which job board reveals salary most often?

Indeed publishes salary on ~40% of US listings (employer-published, regulated by state pay-transparency laws). Naukri publishes on ~25% (Lacs format). Glassdoor estimates salary on most listings (model-derived, with disclosure). LinkedIn rarely publishes salary on the job page itself but exposes parsed bands via the structured data field. For salary benchmarking, combine Indeed (US/UK/EU) + Naukri (India) + Glassdoor (estimates) + LinkedIn (structured).

### What's the right strategy for a multi-source aggregator?

Two-tier approach: (1) Google Jobs for primary discovery (one query covers 20+ boards); (2) per-source scrapers for deep enrichment on top-priority listings (Google Jobs descriptions are sometimes truncated). Dedupe across sources on `(title-norm, company-norm, location-norm, salary_min)` — about 50-60% of Google Jobs rows overlap with direct-source rows; the unique 40-50% is what direct scraping misses.

### Are remote jobs handled well?

RemoteOK is the canonical remote-first source ($0.0015 — uses their public JSON API, near-zero cost). LinkedIn and Indeed both expose remote flags in structured fields. For remote-only aggregators, RemoteOK + LinkedIn (filtered to remote) covers 80%+ of US/UK remote tech jobs. For India-remote, layer in CutShort which has strong remote-startup coverage.

### How much does a full jobs aggregator cost monthly?

Depends on scope. Daily 200-keyword run on LinkedIn + Indeed + Google Jobs ≈ 60K records/day = $480/day FREE tier. Same setup on GOLD tier (high volume) ≈ $240/day. For mid-market aggregators (50K daily records, mixed sources), $5-15K/month. Scale linearly — most are cost-bound by scope, not unit price.

Browse all [Thirdwatch scrapers on Apify Store](https://apify.com/thirdwatch) — pay-per-result, free to try, no credit card to test.
