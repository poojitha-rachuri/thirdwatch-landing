---
title: "Build Naukri Salary Benchmarks by Experience (2026 Guide)"
slug: "build-naukri-salary-benchmarks-by-experience"
description: "Build India tech salary benchmarks by experience years at $0.002 per job using Thirdwatch's Naukri Scraper. 0-2 / 3-5 / 6-10 / 10+ year bands."
actor: "naukri-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/naukri-jobs-scraper"
actorTitle: "Naukri Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-naukri-jobs-for-india-recruiting"
  - "track-india-it-services-hiring-on-naukri"
  - "find-india-tech-jobs-by-skill-on-naukri"
keywords:
  - "naukri salary benchmarks"
  - "india tech salaries by experience"
  - "scrape naukri for compensation data"
  - "india salary database"
faqs:
  - q: "Why Naukri specifically for India salary benchmarks?"
    a: "Naukri.com is India's dominant jobs platform with 70%+ market share among employers. Postings reflect mid-market and enterprise hiring more accurately than LinkedIn India (which skews toward MNC/startup) and AmbitionBox (which is review-driven, not posting-driven). For India tech salary benchmarks at scale, Naukri is the canonical source — and the structured experience-band field on every listing makes longitudinal benchmarking straightforward."
  - q: "How are experience bands structured on Naukri?"
    a: "Naukri uses 4 canonical experience bands: 0-2 years (entry/junior), 3-5 years (mid), 6-10 years (senior), 10+ years (lead/principal). Each posting publishes a min-max experience range (e.g., '3-5 Yrs') in a structured field that the actor returns directly. For benchmark cells, group on the band string for clean aggregation rather than parsing the range bounds."
  - q: "How much of Naukri publishes salary?"
    a: "About 25-30% of Naukri postings publish salary, with materially higher rates in IT services and product engineering (40-50%) than in BPO and manufacturing (10-15%). Salary publication has improved substantially since 2023 when SEBI-listed companies started disclosing comp ranges in postings. For India tech benchmarks, coverage at 40%+ is sufficient for stable percentile bands at 100+ rows per cell."
  - q: "What salary formats does Naukri use?"
    a: "Two primary formats: 'Lacs per annum' (e.g., '12-18 Lacs P.A.') and 'Not Disclosed'. Lacs is India's standard unit (1 Lac = 100,000 INR). For numeric conversion: extract min-max in Lacs, multiply by 100,000 for INR. About 90% of disclosed-salary rows follow the Lacs format; 10% use 'Crores' for very-senior roles (1 Crore = 100 Lacs)."
  - q: "What sample size produces stable benchmarks?"
    a: "For (skill, city, experience-band) cells, 50+ rows produces stable median estimates; 200+ produces stable 25th/75th percentile bands. For nationwide skill + experience benchmarks, 300+ rows is the floor. The four experience bands produce 4x more cells than single-experience benchmarks, so each cell needs proportionally more data — plan to scrape 5,000+ jobs per skill for full-band coverage."
  - q: "How does this compare to AmbitionBox or Glassdoor India?"
    a: "AmbitionBox is review-and-survey-based (employee-reported salaries), making it good for actual paid comp data. Glassdoor India has thinner coverage than Naukri for posting-based research. Naukri reflects what employers offer (offered comp); AmbitionBox reflects what employees report (paid comp). The two often diverge by 10-20% — offered comp is higher than paid comp because of negotiation losses. For comprehensive India benchmarks, run both and triangulate."
---

> Thirdwatch's [Naukri Scraper](https://apify.com/thirdwatch/naukri-jobs-scraper) lets HR analytics teams, comp consultants, and India-focused recruiter platforms build experience-band salary benchmarks at $0.002 per job — title, company, location, experience range, salary, skills, posted date. Built for India compensation-research, talent-acquisition strategy, and HR-tech platforms serving the Indian market.

## Why build Naukri salary benchmarks by experience

India tech compensation moves rapidly across experience bands. According to [Naukri's 2024 Salary Trends report](https://www.naukri.com/), tech salaries between 3-5 and 6-10 year experience bands diverge by 60-90% in major metros (Bangalore, Hyderabad, Pune), and the divergence has widened since 2022. For HR teams, comp consultants, and India-focused HR-tech platforms, experience-band benchmarking is essential — single-point salary medians without experience context produce misleading recommendations.

The job-to-be-done is structured. A comp-research firm building India IT-services benchmarks for 30 skills × 8 metros × 4 experience bands = 960 cells × 100+ rows each = 100K+ jobs per quarterly refresh. An HR-tech platform powering offer-letter calculators wants live experience-band percentile bands. A talent-acquisition strategy team monitoring competitor pay-bands by seniority. An HR consultancy serving SaaS startups with founder-friendly benchmarks. All reduce to skill + city queries + experience-band aggregation + percentile computation per cell.

## How does this compare to the alternatives?

Three options for India experience-band salary data:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| AON / Mercer India compensation surveys | $5K–$30K/year | Survey-based, authoritative | Weeks | Annual cycles |
| AmbitionBox API (where available) | Limited tier-paid | Employee-reported | Hours | Coverage gaps |
| Thirdwatch Naukri Scraper | $2 ($0.002 × 1,000) | Production-tested with browser fetch | 5 minutes | Thirdwatch tracks Naukri changes |

AON, Mercer, and Aon Hewitt offer authoritative survey-based benchmarks but the price gates out small/mid-market consumers. AmbitionBox's data is employee-reported and richer in some dimensions but harder to access programmatically. The [Naukri Scraper actor page](/scrapers/naukri-jobs-scraper) gives you employer-published posting-level data at the lowest unit cost.

## How to build experience-band benchmarks in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a skill × city batch?

Pass skill + city queries optimized for Naukri's search syntax.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~naukri-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

SKILLS = ["python developer", "java developer", "react developer",
          "data scientist", "devops engineer", "kubernetes",
          "data engineer", "machine learning engineer"]
CITIES = ["Bangalore", "Hyderabad", "Pune", "Mumbai", "Chennai",
          "Gurgaon", "Noida", "Delhi"]

queries = [f"{s} {c}" for s, c in product(SKILLS, CITIES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 100},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.location.nunique()} locations")
```

8 skills × 8 cities = 64 queries × 100 results = up to 6,400 records, costing $13.

### Step 3: How do I parse Lacs salary and bin into experience bands?

Regex-extract Lacs min-max + bin experience years.

```python
import re

LACS_RE = re.compile(r"([\d.]+)\s*-\s*([\d.]+)\s*Lacs", re.I)
EXP_RE = re.compile(r"(\d+)\s*-\s*(\d+)", re.I)

def parse_lacs(s):
    if not isinstance(s, str):
        return None, None
    m = LACS_RE.search(s)
    if not m:
        return None, None
    return float(m.group(1)) * 100000, float(m.group(2)) * 100000

def parse_experience(s):
    if not isinstance(s, str):
        return None
    m = EXP_RE.search(s)
    if not m:
        return None
    avg = (int(m.group(1)) + int(m.group(2))) / 2
    if avg <= 2:
        return "0-2"
    if avg <= 5:
        return "3-5"
    if avg <= 10:
        return "6-10"
    return "10+"

df[["sal_min", "sal_max"]] = df.salary.apply(parse_lacs).apply(pd.Series)
df["sal_mid"] = (df.sal_min + df.sal_max) / 2
df["exp_band"] = df.experience.apply(parse_experience)

print(f"{df.sal_min.notna().sum()} jobs with parsed salary")
print(df.exp_band.value_counts())
```

The four experience bands map directly to India's canonical seniority levels.

### Step 4: How do I compute per-band percentiles and upsert?

Group by skill + city + band, compute percentile bands, persist.

```python
import psycopg2

bands = (
    df.dropna(subset=["sal_mid", "exp_band"])
    .groupby(["searchString", "location", "exp_band"])
    .agg(
        p25=("sal_mid", lambda x: x.quantile(0.25)),
        p50=("sal_mid", "median"),
        p75=("sal_mid", lambda x: x.quantile(0.75)),
        n=("sal_mid", "count"),
    )
    .query("n >= 30")
    .reset_index()
)

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    for _, b in bands.iterrows():
        cur.execute(
            """INSERT INTO naukri_benchmarks
                  (skill, city, exp_band, p25, p50, p75, sample_size, snapshot_date)
               VALUES (%s,%s,%s,%s,%s,%s,%s,current_date)
               ON CONFLICT (skill, city, exp_band, snapshot_date)
               DO UPDATE SET p25=%s, p50=%s, p75=%s, sample_size=%s""",
            (b.searchString, b.location, b.exp_band, b.p25, b.p50, b.p75, b.n,
             b.p25, b.p50, b.p75, b.n)
        )

print(f"Upserted {len(bands)} experience-banded benchmarks")
```

The (skill, city, exp_band, snapshot_date) primary key preserves historical bands and enables comp-inflation tracking quarter-over-quarter.

## Sample output

A single Naukri salary-bearing record looks like this. Five rows weigh ~7 KB.

```json
{
  "title": "Senior Python Developer",
  "company_name": "Razorpay",
  "location": "Bangalore",
  "experience": "5-8 Yrs",
  "salary": "18-28 Lacs P.A.",
  "job_type": "Full Time, Permanent",
  "skills": ["Python", "Django", "PostgreSQL", "AWS", "Microservices"],
  "posted_date": "3 days ago",
  "apply_url": "https://www.naukri.com/job-listings/...",
  "department": "Engineering"
}
```

`experience` is the canonical field for band assignment. `salary` follows the Lacs format ready for the regex parser. `skills` array is structured (not free-text) so skill-cross-tab benchmarks are straightforward. `department` provides functional context — Engineering, Sales, Operations bands diverge by 30-50% within the same experience level. `posted_date` lets you isolate truly-fresh postings vs re-listings for trend analysis.

## Common pitfalls

Three things go wrong in India salary-benchmark pipelines. **"Not Disclosed" filtering** — the 75% of postings without salary skew toward small employers and lower-comp roles; benchmarks built only on disclosed-salary rows over-index toward larger employers and tech roles. **Crores vs Lacs unit drift** — very senior roles (10+ year band, lead/principal) sometimes use Crores; for clean aggregation, always normalize to INR before percentile computation. **Title-string variance** — "Senior Python Developer", "Sr. Python Engineer", "Python Developer III" describe the same role; for clean benchmarks, normalize titles via a controlled vocabulary or NLP-based clustering.

Thirdwatch's actor uses Playwright + browser fetch() at $1.10/1K, ~45% margin. The 1024 MB memory and 600-second timeout headroom mean even 5,000-job batches complete cleanly. Pair Naukri with [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) and [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) for cross-source compensation triangulation specific to India. A fourth subtle issue worth flagging: Naukri's experience-range parsing breaks for "0 Yrs" (fresher) and "Above 15 Yrs" (executive) — these don't fit the standard min-max format; handle as separate sentinel bands ("Fresher" and "Executive") rather than forcing into the 4-band schema. A fifth pattern unique to India tech comp: certain skill premiums (Kubernetes, Snowflake, Databricks) command 20-40% premium over base-skill bands across all experience levels; for accurate benchmarks, compute skill-premium multipliers separately rather than embedding them in the headline percentile bands. A sixth and final pitfall: Indian fiscal-year cycles (April-March) drive most comp adjustments, so March-April postings show 8-15% higher offered comp than September-October postings for the same skill × city × experience cell; for trend analysis, normalize by fiscal-quarter rather than calendar-quarter.

## Related use cases

- [Scrape Naukri jobs for India recruiting](/blog/scrape-naukri-jobs-for-india-recruiting)
- [Track India IT services hiring on Naukri](/blog/track-india-it-services-hiring-on-naukri)
- [Find India tech jobs by skill on Naukri](/blog/find-india-tech-jobs-by-skill-on-naukri)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why Naukri specifically for India salary benchmarks?

Naukri.com is India's dominant jobs platform with 70%+ market share among employers. Postings reflect mid-market and enterprise hiring more accurately than LinkedIn India (which skews toward MNC/startup) and AmbitionBox (which is review-driven, not posting-driven). For India tech salary benchmarks at scale, Naukri is the canonical source — and the structured experience-band field on every listing makes longitudinal benchmarking straightforward.

### How are experience bands structured on Naukri?

Naukri uses 4 canonical experience bands: 0-2 years (entry/junior), 3-5 years (mid), 6-10 years (senior), 10+ years (lead/principal). Each posting publishes a min-max experience range (e.g., "3-5 Yrs") in a structured field that the actor returns directly. For benchmark cells, group on the band string for clean aggregation rather than parsing the range bounds.

### How much of Naukri publishes salary?

About 25-30% of Naukri postings publish salary, with materially higher rates in IT services and product engineering (40-50%) than in BPO and manufacturing (10-15%). Salary publication has improved substantially since 2023 when SEBI-listed companies started disclosing comp ranges in postings. For India tech benchmarks, coverage at 40%+ is sufficient for stable percentile bands at 100+ rows per cell.

### What salary formats does Naukri use?

Two primary formats: "Lacs per annum" (e.g., "12-18 Lacs P.A.") and "Not Disclosed". Lacs is India's standard unit (1 Lac = 100,000 INR). For numeric conversion: extract min-max in Lacs, multiply by 100,000 for INR. About 90% of disclosed-salary rows follow the Lacs format; 10% use "Crores" for very-senior roles (1 Crore = 100 Lacs).

### What sample size produces stable benchmarks?

For (skill, city, experience-band) cells, 50+ rows produces stable median estimates; 200+ produces stable 25th/75th percentile bands. For nationwide skill + experience benchmarks, 300+ rows is the floor. The four experience bands produce 4x more cells than single-experience benchmarks, so each cell needs proportionally more data — plan to scrape 5,000+ jobs per skill for full-band coverage.

### How does this compare to AmbitionBox or Glassdoor India?

[AmbitionBox](https://www.ambitionbox.com/) is review-and-survey-based (employee-reported salaries), making it good for actual paid comp data. Glassdoor India has thinner coverage than Naukri for posting-based research. Naukri reflects what employers offer (offered comp); AmbitionBox reflects what employees report (paid comp). The two often diverge by 10-20% — offered comp is higher than paid comp because of negotiation losses. For comprehensive India benchmarks, run both and triangulate.

Run the [Naukri Scraper on Apify Store](https://apify.com/thirdwatch/naukri-jobs-scraper) — pay-per-job, free to try, no credit card to test.
