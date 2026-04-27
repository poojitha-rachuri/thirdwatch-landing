---
title: "Benchmark India Tech Salaries with AmbitionBox Data (2026)"
slug: "benchmark-india-tech-salaries-with-ambitionbox"
description: "Pull structured India salary data from AmbitionBox at $0.006 per record with Thirdwatch. Compare TCS, Infosys, Wipro and 100K+ companies. Python recipes inside."
actor: "ambitionbox-scraper"
actor_url: "https://apify.com/thirdwatch/ambitionbox-scraper"
actorTitle: "AmbitionBox Salaries & Ratings Scraper India"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "research-company-culture-india-with-ambitionbox-reviews"
  - "track-it-services-attrition-from-employee-reviews"
  - "scrape-ambitionbox-for-recruitment-intelligence"
keywords:
  - "india salary benchmarking"
  - "ambitionbox salary scraper"
  - "tcs infosys wipro salary data"
  - "india tech compensation API"
faqs:
  - q: "How accurate are AmbitionBox salaries as a benchmark?"
    a: "Accurate enough for compensation benchmarking when you filter on reports_count. AmbitionBox aggregates self-reported employee data, so a role with 1,000+ reports at TCS is highly reliable while a role with 5 reports at a 50-person startup is not. The actor returns reports_count on every row so you can apply a sample-size filter downstream — a useful default is reports_count >= 50."
  - q: "What companies does AmbitionBox cover?"
    a: "100K+ Indian companies including every major IT services firm (TCS, Infosys, Wipro, HCL, Tech Mahindra, LTIMindtree), every product major (Flipkart, Swiggy, Zomato, PhonePe), and most series A+ startups. Coverage is strongest for companies with 500+ employees; long-tail startups have data but smaller sample sizes."
  - q: "How do I get all roles at a company versus filtering by role?"
    a: "Leave roles empty to get every role AmbitionBox has data for at the company, capped at maxResults. Pass specific role slugs like software-engineer or data-analyst in the roles array to scope. The slug format mirrors AmbitionBox's URL pattern, lowercase with hyphens."
  - q: "Are salaries in INR or USD?"
    a: "Always INR, annualised CTC. Convert to USD or any other currency downstream using a daily FX rate — INR/USD rate against your reference date. The actor explicitly returns salary_currency: INR and salary_period: yearly so the schema is unambiguous."
  - q: "Why are some roles at smaller companies missing salary fields?"
    a: "When AmbitionBox has fewer than ~5 reports for a role, it stops publishing the typical salary band even though the average still appears. The actor returns whatever AmbitionBox publishes; downstream code should expect typical_salary_min and typical_salary_max to be null for low-coverage roles. Use avg_salary in those cases or filter the row out."
  - q: "How do I compare same-role pay across companies for negotiation prep?"
    a: "Run the actor with the same roles array against a list of companies, then pivot the dataset on (role, company_name). The typical_salary_min and typical_salary_max columns give the band for each company; sort descending by avg_salary or median over typical_salary_max for a quick benchmark. This is the canonical use case for negotiation, hiring offer calibration, and pay-equity analysis."
---

> Thirdwatch's [AmbitionBox Salaries & Ratings Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) pulls structured salary data and company ratings from AmbitionBox.com — India's largest company review platform covering 100K+ companies — at $0.006 per record. Returns salary ranges (min/max/typical), average CTC, experience levels, and seven category ratings per company. Built for recruiters, comp analysts, and HR teams who need to benchmark Indian tech compensation without manual web research.

## Why benchmark India tech salaries with AmbitionBox

Compensation benchmarking is the highest-stakes recurring task in Indian tech recruiting. According to [Naukri's 2025 hiring outlook report](https://www.naukri.com/jobspeak), more than 65% of mid-senior Indian tech offers in the last 12 months involved a counter-offer dynamic, and the difference between the chosen candidate and the runner-up is increasingly compensation rather than fit. Benchmarking quickly and accurately matters — and AmbitionBox is the most consistent salary dataset in the country, owned by Naukri/InfoEdge with a decade of self-reported data from Indian employees.

The job-to-be-done is concrete: pull a list of comparable companies, get the salary band for the role you're hiring, sort by typical band, decide where to position the offer. Manual benchmarking on the AmbitionBox web UI takes 5-10 minutes per company; a sourcer working a 30-company shortlist burns half a day. The Thirdwatch actor flattens that to a single API call returning structured records ready for pandas. The same data feeds pay-equity audits, compensation-survey triangulation, and HR dashboards.

## How does this compare to the alternatives?

Three options for India tech salary benchmarking:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual AmbitionBox web research | Effectively unbounded analyst time | Low (transcription error) | Continuous | Doesn't scale |
| Paid comp survey (Mercer, Aon Radford) | $20K–$150K/year per band | High but lagging | Months to onboard | Annual cycles |
| Thirdwatch AmbitionBox Scraper | $6 ($0.006 × 1,000) | Production-tested, monopoly position on Apify | 5 minutes | Thirdwatch tracks AmbitionBox changes |

Paid surveys remain the gold standard for executive comp at large companies, but they lag the market by 6-12 months and don't cover the long tail of startups where Indian tech hiring actually happens. The [AmbitionBox Scraper actor page](/scrapers/ambitionbox-scraper) gives you the live employee-reported data; the analytics layer is downstream pandas. There is no other maintained AmbitionBox scraper on the Apify Store — this is the only production-grade option.

## How to benchmark India tech salaries in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull salary bands for a list of comparable companies?

Pass company slugs in `companies` and a role filter in `roles`. The slug is what appears in the AmbitionBox URL — `ambitionbox.com/salaries/tcs-salaries` → `tcs`.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~ambitionbox-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "companies": ["tcs", "infosys", "wipro", "hcl", "tech-mahindra", "ltimindtree"],
        "roles": ["software-engineer"],
        "maxResults": 8,
        "includeCompanyReviews": True,
    },
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(df[["company_name", "role", "avg_salary", "typical_salary_min", "typical_salary_max", "reports_count"]])
```

Six IT-services majors × one role pulls in under 30 seconds and costs about 5 cents.

### Step 3: How do I filter to high-confidence rows and rank?

Reports count is the trust signal. A typical floor of 50 reports per role gives meaningful sample sizes; below that the salary band has high variance.

```python
RELIABLE = df[df.reports_count >= 50].copy()
RELIABLE["typical_lakhs_min"] = RELIABLE["typical_salary_min"] / 1e5
RELIABLE["typical_lakhs_max"] = RELIABLE["typical_salary_max"] / 1e5
RELIABLE["avg_lakhs"] = RELIABLE["avg_salary"] / 1e5

ranked = RELIABLE.sort_values("avg_lakhs", ascending=False)
print(ranked[["company_name", "role", "experience_range",
              "typical_lakhs_min", "typical_lakhs_max", "avg_lakhs",
              "reports_count", "company_rating"]].to_string(index=False))
```

Lakhs (one lakh = 100,000 INR) is the unit recruiters in India actually use, so converting at this stage saves repeated mental math.

### Step 4: How do I cross-reference the band with employee-rated culture?

`category_ratings` includes salary_benefits as a 1–5 score derived from employee reviews — a useful sanity check on the salary data. A company paying at the 75th percentile of the comp band but with a 2.8 salary_benefits score usually has problematic compensation structure (high base, low variable, poor on-time payouts) that the average alone hides.

```python
def expand_categories(row):
    cats = row.get("category_ratings") or {}
    for k, v in cats.items():
        row[f"cat_{k}"] = v
    return row

ENRICHED = ranked.apply(expand_categories, axis=1)
print(ENRICHED[["company_name", "avg_lakhs", "company_rating",
                "cat_salary_benefits", "cat_work_life_balance",
                "cat_career_growth"]].to_string(index=False))
```

This is the row a comp manager actually wants on their decision dashboard — pay band + employee-reported quality signals, side by side.

## Sample output

A single record from the dataset for one role at one company looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "role": "Software Engineer",
  "company_name": "Tata Consultancy Services",
  "avg_salary": 574006,
  "salary_min": 300000,
  "salary_max": 1200000,
  "typical_salary_min": 420000,
  "typical_salary_max": 750000,
  "salary_currency": "INR",
  "salary_period": "yearly",
  "reports_count": 1250,
  "experience_range": "2-8 years",
  "company_rating": 3.8,
  "company_reviews_count": 45000,
  "category_ratings": {
    "work_life_balance": 3.9,
    "salary_benefits": 3.2,
    "job_security": 4.1,
    "career_growth": 3.5,
    "work_satisfaction": 3.4,
    "skill_development": 3.6,
    "company_culture": 3.7
  },
  "apply_url": "https://www.ambitionbox.com/salaries/tcs-salaries/software-engineer"
}
```

The salary fields tell a complete band story: `typical_salary_min` and `typical_salary_max` mark the 25th-75th percentile, `avg_salary` is the mean, `salary_min` and `salary_max` are extreme outliers (10th and 90th percentile equivalents). For most benchmarking decisions the typical band is the right anchor — extreme min/max include trainees and out-of-band offers that distort the picture.

## Common pitfalls

Three things go wrong in compensation pipelines on AmbitionBox data. **Sample-size confusion** — a startup with 5 salary reports averaging 50 lakh is not a benchmark; AmbitionBox shows averages even at small N, but downstream code must enforce a minimum. **Experience-range overlap** — most roles have one experience range like "2-8 years"; for fine-grained benchmarking on 0-2 vs 8-12 vs 12+ year bands, AmbitionBox often only segments inside the listing page itself. The actor returns the headline range; deeper segmentation needs the apply_url visited individually. **Stale company data** — companies that haven't had new reviews in 12+ months may show salary data that's a year or more behind market; cross-check `company_reviews_count` velocity by re-running the same query 30 days later — if the count didn't change, treat the data as a lagging snapshot.

Thirdwatch's actor returns `reports_count` and `company_reviews_count` on every record so the right filtering can happen downstream. The residential India proxy and conservative concurrency keep the scraper well within polite-crawling norms — production benchmarking pipelines run weekly without throttling issues. A fourth subtle issue worth flagging: AmbitionBox has begun rolling out role-level benchmarks that bundle multiple titles into a single canonical role (e.g. "Software Engineer" absorbing "SDE I", "SDE II", "Member of Technical Staff"); when a comparison band looks suspiciously wide on AmbitionBox versus your internal data, this title-bundling is usually the cause and you'll want to query the original sub-titles individually.

## Related use cases

- [Research company culture in India with AmbitionBox reviews](/blog/research-company-culture-india-with-ambitionbox-reviews)
- [Track IT services attrition from employee reviews](/blog/track-it-services-attrition-from-employee-reviews)
- [Scrape AmbitionBox for recruitment intelligence](/blog/scrape-ambitionbox-for-recruitment-intelligence)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How accurate are AmbitionBox salaries as a benchmark?

Accurate enough for compensation benchmarking when you filter on `reports_count`. AmbitionBox aggregates self-reported employee data, so a role with 1,000+ reports at TCS is highly reliable while a role with 5 reports at a 50-person startup is not. The actor returns `reports_count` on every row so you can apply a sample-size filter downstream — a useful default is `reports_count >= 50`.

### What companies does AmbitionBox cover?

100K+ Indian companies including every major IT services firm (TCS, Infosys, Wipro, HCL, Tech Mahindra, LTIMindtree), every product major (Flipkart, Swiggy, Zomato, PhonePe), and most Series A+ startups. Coverage is strongest for companies with 500+ employees; long-tail startups have data but smaller sample sizes.

### How do I get all roles at a company versus filtering by role?

Leave `roles` empty to get every role AmbitionBox has data for at the company, capped at `maxResults`. Pass specific role slugs like `software-engineer` or `data-analyst` in the `roles` array to scope. The slug format mirrors AmbitionBox's URL pattern, lowercase with hyphens.

### Are salaries in INR or USD?

Always INR, annualised CTC. Convert to USD or any other currency downstream using a daily FX rate — INR/USD rate against your reference date. The actor explicitly returns `salary_currency: "INR"` and `salary_period: "yearly"` so the schema is unambiguous.

### Why are some roles at smaller companies missing salary fields?

When AmbitionBox has fewer than ~5 reports for a role, it stops publishing the typical salary band even though the average still appears. The actor returns whatever AmbitionBox publishes; downstream code should expect `typical_salary_min` and `typical_salary_max` to be null for low-coverage roles. Use `avg_salary` in those cases or filter the row out.

### How do I compare same-role pay across companies for negotiation prep?

Run the actor with the same `roles` array against a list of companies, then pivot the dataset on `(role, company_name)`. The `typical_salary_min` and `typical_salary_max` columns give the band for each company; sort descending by `avg_salary` or median over `typical_salary_max` for a quick benchmark. This is the canonical use case for negotiation, hiring offer calibration, and pay-equity analysis.

Run the [AmbitionBox Salaries & Ratings Scraper on Apify Store](https://apify.com/thirdwatch/ambitionbox-scraper) — pay-per-record, free to try, no credit card to test.
