---
title: "Track India IT Services Hiring on Naukri (2026 Guide)"
slug: "track-india-it-services-hiring-on-naukri"
description: "Detect TCS/Infosys/Wipro hiring shifts at $0.002 per job using Thirdwatch's Naukri Scraper. Weekly velocity + skill-mention trends + Slack alerting recipes."
actor: "naukri-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/naukri-jobs-scraper"
actorTitle: "Naukri.com Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-naukri-jobs-for-india-recruiting"
  - "build-naukri-salary-benchmarks-by-experience"
  - "find-india-tech-jobs-by-skill-on-naukri"
keywords:
  - "india IT services hiring trends"
  - "tcs infosys wipro hiring naukri"
  - "indian IT bench tracking"
  - "tier-1 IT services posting velocity"
faqs:
  - q: "Why track IT services hiring specifically?"
    a: "Indian IT services firms (TCS, Infosys, Wipro, HCL, Tech Mahindra, LTIMindtree, Cognizant) employ over 5 million Indian engineers combined and process roughly 25-30% of Indian tech-job posting volume according to industry tracker estimates. Their hiring shifts move equity prices, signal currency-impact concerns (most revenue is USD-denominated), and lead Indian tech-labour-market trends by 30-60 days."
  - q: "What signals matter for IT services hiring intelligence?"
    a: "Three: (1) net new postings per week per firm — a 30%+ rise indicates ramp-up for new contracts; sustained drops indicate bench-staffing slowdown. (2) skill-mention shifts (from Java/.NET toward GenAI, cloud-native, cybersecurity) signal where the firm is investing. (3) experience-band distribution — heavy 0-3 year bands signals fresher hiring (training-led growth), heavy 5-8 year bands signals lateral hiring (project-led growth). All three are derivable from Naukri postings."
  - q: "What cadence captures meaningful trend signal?"
    a: "Weekly snapshots are the standard cadence. Indian IT services firms typically post 50-300 fresh roles per week per firm during steady-state, climbing to 500-1500 during quarterly hiring sprints. Daily catches noise rather than signal; monthly is too coarse for catching quarterly turning points. Weekly Sunday-night snapshots align with how Indian IT firms structure their internal hiring reviews."
  - q: "How does this compare to AmbitionBox attrition tracking?"
    a: "AmbitionBox tracks attrition (employee departures) via review velocity and category-rating drift; Naukri tracks intent to hire (postings). The two are complementary — rising attrition + rising postings = sustained labour churn, declining postings + rising attrition = company contraction. Run both in parallel and join by company name for the complete labour-market view."
  - q: "Can I detect contract-win signals?"
    a: "Indirectly. A 50%+ spike in new postings for a specific (city + skill) combination at one firm typically corresponds to a major contract win in that domain — for example, sudden Bangalore + Cloud Engineer postings at Infosys often signal a hyperscaler partnership. Naukri postings precede press releases by 2-6 weeks for most contract wins, making this a leading equity-research indicator."
  - q: "How fresh is Naukri data?"
    a: "Each run pulls live from Naukri at request time. Naukri indexes new postings within hours and prominently displays 1 day ago, 3 hours ago badges. For active intelligence workflows, daily cadence catches fresh postings; for quarterly trend analysis, weekly is sufficient."
---

> Thirdwatch's [Naukri.com Scraper](https://apify.com/thirdwatch/naukri-jobs-scraper) feeds an Indian IT services hiring-intelligence pipeline at $0.002 per job — weekly snapshot the seven major IT services firms across major cities, compute posting velocity, surface contract-win signals before press releases. Built for equity analysts covering Indian IT services, HR competitive-intelligence functions at peer firms, and Indian labour-market researchers tracking tier-1 hiring shifts.

## Why track IT services hiring on Naukri

Indian IT services firms collectively employ more than 5 million engineers and contribute meaningfully to the Indian economy. According to [the National Association of Software and Service Companies (NASSCOM) 2024 strategic review](https://nasscom.in/), the Indian IT services sector grew 8% YoY to ~$254B and announced over 200,000 net new hires across the top 7 firms during fiscal 2024. Their hiring shifts move stock prices, signal contract wins before press releases, and lead the broader Indian tech labour market by 30-60 days.

The job-to-be-done is structured. An equity analyst covering Indian IT wants weekly posting velocity per firm with leading-indicator alerts. A competitive-intelligence team at one IT services firm monitors peer hiring to detect contract wins or strategic shifts. A labour-market researcher studies which experience bands (fresher vs lateral hiring) each firm is targeting. A tech-skills training company studies which skills are being adopted by Indian IT services firms to inform curriculum updates. All reduce to weekly Naukri snapshots × tier-1 IT firms × structured analysis.

## How does this compare to the alternatives?

Three options for getting Indian IT services hiring intelligence:

| Approach | Cost per 1,000 jobs × weekly × 7 firms | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Quarterly company disclosures (TCS, Infosys, Wipro investor relations) | Free | Authoritative but lagging 90 days | Hours | Per-firm release schedule |
| Indian equity-research SaaS (Bloomberg, Refinitiv with India coverage) | $20K–$200K/year flat | High | Days–weeks | Vendor lock-in |
| Thirdwatch Naukri Scraper | $14 × weekly = $728/year | Production-tested across 20+ Indian cities | Half a day | Thirdwatch tracks Naukri changes |

Quarterly disclosures give official confirmation but lag the leading-indicator window. The [Naukri Scraper actor page](/scrapers/naukri-jobs-scraper) gives you the structured weekly feed at pay-per-result pricing.

## How to track IT services hiring in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a weekly snapshot of all major IT services firms?

Build city × firm queries. Naukri encodes both in the search query string.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~naukri-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CITIES = ["bangalore", "mumbai", "delhi", "hyderabad",
          "chennai", "pune", "kolkata"]
FIRMS = ["tcs", "infosys", "wipro", "hcl",
         "tech mahindra", "ltimindtree", "cognizant"]

queries = [f"{firm} {city}" for firm in FIRMS for city in CITIES]
print(f"Submitting {len(queries)} queries (7 firms × 7 cities)")

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResultsPerQuery": 20, "scrapeMode": "full"},
    timeout=3600,
)
records = resp.json()
week = datetime.date.today().isocalendar()
ts = f"{week.year}-W{week.week:02d}"
pathlib.Path(f"snapshots/naukri-it-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} listings")
```

49 queries × 20 jobs each = up to 980 listings, costing $1.96.

### Step 3: How do I compute weekly posting velocity per firm?

Aggregate snapshots by week and firm; count unique apply URLs.

```python
import pandas as pd, glob

frames = []
for f in sorted(glob.glob("snapshots/naukri-it-*.json")):
    week = pathlib.Path(f).stem.replace("naukri-it-", "")
    for j in json.loads(pathlib.Path(f).read_text()):
        cn = (j.get("company_name") or "").lower()
        for firm in FIRMS:
            if firm in cn:
                frames.append({"week": week, "firm": firm,
                               "url": j["apply_url"],
                               "experience": j.get("experience"),
                               "skills": j.get("skills", [])})
                break

df = pd.DataFrame(frames).drop_duplicates(subset=["week", "url"])
weekly = df.groupby(["week", "firm"]).size().reset_index(name="postings")
pivot = weekly.pivot(index="firm", columns="week", values="postings").fillna(0)
weeks = sorted(pivot.columns)
if len(weeks) >= 5:
    pivot["wow_pct"] = (pivot[weeks[-1]] / pivot[weeks[-5:-1]].mean(axis=1).clip(lower=1)) - 1
    print(pivot[[weeks[-1], "wow_pct"]].sort_values("wow_pct", ascending=False))
```

A firm showing `wow_pct >= 0.30` for two consecutive weeks is in active ramp-up; a sustained drop of 30%+ over 4 weeks signals bench-staffing slowdown.

### Step 4: How do I detect skill-mention shifts and contract-win signals?

Aggregate skill arrays by firm and week, surface fastest-growing skills.

```python
import re

# Skill arrays exploded
skill_frames = []
for _, row in df.iterrows():
    skills = row.skills if isinstance(row.skills, list) else []
    for s in skills:
        skill_frames.append({"week": row.week, "firm": row.firm,
                             "skill": s.lower().strip()})

skill_df = pd.DataFrame(skill_frames)
weekly_skills = skill_df.groupby(["week", "firm", "skill"]).size().reset_index(name="mentions")

# Fastest-growing skills per firm over the last 8 weeks
for firm in FIRMS:
    firm_skills = weekly_skills[weekly_skills.firm == firm]
    pivot_s = firm_skills.pivot(index="skill", columns="week", values="mentions").fillna(0)
    if len(pivot_s.columns) < 8:
        continue
    weeks_s = sorted(pivot_s.columns)
    pivot_s["growth"] = pivot_s[weeks_s[-1]] - pivot_s[weeks_s[-8]]
    rising = pivot_s[pivot_s.growth >= 5].sort_values("growth", ascending=False).head(5)
    print(f"\n--- {firm.upper()}: rising skills (8-week growth) ---")
    print(rising[[weeks_s[-8], weeks_s[-1], "growth"]])
```

Contract-win signal pattern: a firm shows simultaneous `wow_pct >= 0.40` posting velocity AND a new skill rising rapidly in mentions (e.g. cloud-native + AWS + Kubernetes spiking together at Infosys Bangalore signals a hyperscaler partnership ramp).

## Sample output

A single record from the dataset for one Bangalore TCS posting looks like this. Five rows of this shape weigh ~25 KB.

```json
{
  "title": "Software Engineer",
  "company_name": "Tata Consultancy Services",
  "location": "Bengaluru",
  "salary": "Not disclosed",
  "experience": "2-5 Yrs",
  "skills": ["Java", "Spring Boot", "Microservices", "AWS"],
  "description": "Looking for a Software Engineer with experience in Java...",
  "posted_at": "1 day ago",
  "apply_url": "https://www.naukri.com/job-listings-software-engineer-tcs-..."
}
```

`apply_url` is the canonical natural key for cross-snapshot dedup. `experience` (`2-5 Yrs`) is the experience-band signal — parse the lower bound to bucket into Junior/Mid/Senior tiers. `skills` is a clean string array — much higher-signal than parsing description text. `salary` is `Not disclosed` for the majority of IT services postings (cultural norm in Indian IT services); for compensation analysis layer in [AmbitionBox](https://apify.com/thirdwatch/ambitionbox-scraper) data instead.

## Common pitfalls

Three things go wrong in production IT services tracking pipelines. **Subsidiary attribution** — Tata Consultancy Services posts both as "TCS" and "Tata Consultancy Services" in different listings; build a per-firm name-variation map (TCS / Tata Consultancy Services / TATA / Tata Consultancy) before company aggregation. **Multi-city listings** — IT services firms frequently post the same role across multiple cities ("Bengaluru, Hyderabad, Pune"); dedupe by `apply_url` rather than counting per-city occurrences. **Fresher vs lateral mix shifts** — TCS's 0-1 Yrs band reflects campus-recruitment placements more than open-market hiring intent; for genuine market-hiring intelligence focus on 3-7 Yrs experience-band postings rather than freshers.

Thirdwatch's actor uses Camoufox stealth-browser bypass with Indian residential proxy — production-tested at sustained weekly volumes. The 4096 MB max memory and 3,600-second timeout headroom mean even multi-firm batch runs complete cleanly. Pair Naukri with our [AmbitionBox Scraper](https://apify.com/thirdwatch/ambitionbox-scraper) for IT services attrition tracking — combined posting + attrition signals give the complete labour-market view that no single source provides.

## Related use cases

- [Scrape Naukri jobs for India recruiting](/blog/scrape-naukri-jobs-for-india-recruiting)
- [Build Naukri salary benchmarks by experience](/blog/build-naukri-salary-benchmarks-by-experience)
- [Find India tech jobs by skill on Naukri](/blog/find-india-tech-jobs-by-skill-on-naukri)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track IT services hiring specifically?

Indian IT services firms (TCS, Infosys, Wipro, HCL, Tech Mahindra, LTIMindtree, Cognizant) employ over 5 million Indian engineers combined and process roughly 25-30% of Indian tech-job posting volume according to industry tracker estimates. Their hiring shifts move equity prices, signal currency-impact concerns (most revenue is USD-denominated), and lead Indian tech-labour-market trends by 30-60 days.

### What signals matter for IT services hiring intelligence?

Three: (1) net new postings per week per firm — a 30%+ rise indicates ramp-up for new contracts; sustained drops indicate bench-staffing slowdown. (2) skill-mention shifts (from Java/.NET toward GenAI, cloud-native, cybersecurity) signal where the firm is investing. (3) experience-band distribution — heavy 0-3 year bands signals fresher hiring (training-led growth), heavy 5-8 year bands signals lateral hiring (project-led growth). All three are derivable from Naukri postings.

### What cadence captures meaningful trend signal?

Weekly snapshots are the standard cadence. Indian IT services firms typically post 50-300 fresh roles per week per firm during steady-state, climbing to 500-1500 during quarterly hiring sprints. Daily catches noise rather than signal; monthly is too coarse for catching quarterly turning points. Weekly Sunday-night snapshots align with how Indian IT firms structure their internal hiring reviews.

### How does this compare to AmbitionBox attrition tracking?

AmbitionBox tracks attrition (employee departures) via review velocity and category-rating drift; Naukri tracks intent to hire (postings). The two are complementary — rising attrition + rising postings = sustained labour churn, declining postings + rising attrition = company contraction. Run both in parallel and join by company name for the complete labour-market view.

### Can I detect contract-win signals?

Indirectly. A 50%+ spike in new postings for a specific (city + skill) combination at one firm typically corresponds to a major contract win in that domain — for example, sudden Bangalore + Cloud Engineer postings at Infosys often signal a hyperscaler partnership. Naukri postings precede press releases by 2-6 weeks for most contract wins, making this a leading equity-research indicator.

### How fresh is Naukri data?

Each run pulls live from Naukri at request time. Naukri indexes new postings within hours and prominently displays `1 day ago`, `3 hours ago` badges. For active intelligence workflows, daily cadence catches fresh postings; for quarterly trend analysis, weekly is sufficient.

Run the [Naukri.com Scraper on Apify Store](https://apify.com/thirdwatch/naukri-jobs-scraper) — pay-per-job, free to try, no credit card to test.
