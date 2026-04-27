---
title: "Build a Candidate Shortlist from LinkedIn Profiles (2026)"
slug: "build-candidate-shortlist-from-linkedin-profiles"
description: "Build a ranked candidate shortlist at $0.01 per profile using Thirdwatch's LinkedIn Profile Scraper. Title + experience filtering with Postgres dedup recipes."
actor: "linkedin-profile-scraper"
actor_url: "https://apify.com/thirdwatch/linkedin-profile-scraper"
actorTitle: "LinkedIn Profile Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-linkedin-profiles-without-login"
  - "enrich-crm-with-linkedin-profile-data"
  - "find-decision-makers-by-title-and-company"
keywords:
  - "linkedin candidate shortlist"
  - "build sourcing pipeline linkedin"
  - "linkedin profile enrichment"
  - "candidate research linkedin"
faqs:
  - q: "What's the canonical recruiter sourcing workflow on LinkedIn profile data?"
    a: "Five steps: (1) define the role, target companies, and seniority bands. (2) Source initial candidate URLs from LinkedIn search, conference attendee lists, GitHub, or industry referrals. (3) Pull profiles via the actor in batches of 50-100. (4) Score candidates by company-fit + role-fit + tenure-stability and rank. (5) Forward top 20 to interviewers. End-to-end this is a 30-minute workflow per role once the pipeline is set up."
  - q: "How do I source candidate URLs to feed the actor?"
    a: "The actor enriches a list of profile URLs you provide; sourcing the URLs themselves is upstream. Common sources: LinkedIn People Search (manual, but can dump 100+ URLs per query), GitHub Org members for engineering roles, conference speaker lists for senior roles, our [LinkedIn Company Employees Scraper](https://apify.com/thirdwatch/linkedin-company-employees-scraper) for systematic per-company sourcing. The Profile Scraper then enriches whatever URLs you collected upstream."
  - q: "How do I score candidates beyond exact title match?"
    a: "Three-axis scoring: company-fit (target-company match in past 5 years from past_positions), tenure-stability (median tenure across past_positions, weighted toward longer = more stable), seniority-progression (title progression in current_titles + past_positions matches expected career arc). Most recruiter pipelines weight company-fit highest for cold outreach (40%), seniority-progression for screening (35%), tenure-stability for risk assessment (25%)."
  - q: "What about candidates with restricted profiles?"
    a: "Profiles with restricted public visibility return only name, headline, and profile_photo_url — not enough for systematic ranking. Two approaches: (1) deprioritise restricted profiles in scoring (they're harder to assess from public data), (2) request connection or InMail through LinkedIn Recruiter for the highest-priority restricted candidates. Most pipelines accept that 5-10% of profiles will be restricted and route them to a human-review queue."
  - q: "Is candidate scoring legal?"
    a: "Public-data candidate scoring for sourcing is well within standard recruiter practices and is exactly how LinkedIn Recruiter's own search ranks candidates. Anti-discrimination law (Title VII in the US) prohibits using protected attributes (race, age, gender) in hiring decisions; building scoring models that explicitly use those attributes is illegal. Models scoring on company history, role progression, and skill alignment are standard. When in doubt, document your scoring methodology and audit it for protected-attribute proxies."
  - q: "How fresh is profile data?"
    a: "Each run pulls live from LinkedIn at request time. Members typically update profiles every 6-12 months (when changing roles or after milestones), so profile data is always at most a few months out of date. For active sourcing, fresh enrichment per outreach attempt is ideal; for batch shortlisting, a one-time enrichment per candidate is sufficient."
---

> Thirdwatch's [LinkedIn Profile Scraper](https://apify.com/thirdwatch/linkedin-profile-scraper) feeds a structured candidate-shortlist pipeline at $0.01 per profile — pull a list of profile URLs, score by company-fit + seniority-progression + tenure-stability, forward top candidates to interviewers. Built for recruiter agencies, in-house TA teams, headhunting firms, and founder-led recruiting workflows that need data-driven shortlist building rather than spreadsheet-based candidate tracking.

## Why build a structured candidate shortlist

Recruiter sourcing is increasingly competitive. According to [the LinkedIn 2024 Talent Trends report](https://business.linkedin.com/talent-solutions/resources/talent-acquisition/global-talent-trends-report), the median offer-to-acceptance time has compressed from 28 days (2019) to 14 days (2024) as candidate decision-making accelerates. Recruiters who arrive with the right pre-qualified shortlist win these competitive offers; those running through generic candidate lists with broad-spectrum outreach lose them. Structured shortlist building — scoring candidates against a clear specification before outreach — is the differentiator.

The job-to-be-done is structured. A recruiter agency hiring senior engineers for a Series B fintech client wants 20 highly qualified candidates from a 200-URL initial pool. An in-house TA team backfilling a senior PM role wants a ranked list of 30 candidates by company-fit and seniority match. A headhunting firm building a CXO search wants 10 finalists from a 100-URL initial sweep. All reduce to LinkedIn profile enrichment + multi-axis scoring + ranked output.

## How does this compare to the alternatives?

Three options for building a candidate shortlist from LinkedIn profiles:

| Approach | Cost per 1,000 profiles | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual LinkedIn screening + Excel scoring | Effectively unbounded sourcer time | Low (subjective) | Continuous | Doesn't scale |
| LinkedIn Recruiter ($120-$170/seat/month) | Built-in candidate ranking | Official | Hours | Per-seat licensing |
| Thirdwatch LinkedIn Profile Scraper + custom scoring | $10 ($0.01 × 1,000) | Production-tested, no login | 5 minutes | Thirdwatch tracks LinkedIn changes |

LinkedIn Recruiter has the deepest native search and InMail integration but is priced per seat at recruiter-tool tiers. The [LinkedIn Profile Scraper actor page](/scrapers/linkedin-profile-scraper) gives you the structured profile data; the scoring layer is downstream pandas — meaningfully cheaper for teams with dedicated sourcing pipelines.

## How to build a candidate shortlist in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I enrich a list of candidate URLs?

Pass profile URLs (any format — username, /in/path, or full URL) to the actor and pull structured profile data.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~linkedin-profile-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

# Curated initial pool from upstream sourcing
CANDIDATE_URLS = [
    "satyanadella", "sundarpichai", "lisasu",
    "jeffweiner", "tim_cook", "patgelsinger",
    # ... extend to 100-200 URLs from LinkedIn People Search,
    # GitHub orgs, conference attendee lists, etc.
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"profileUrls": CANDIDATE_URLS, "maxProfiles": 200},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} profiles enriched, "
      f"{df.about.notna().sum()} with full bio data")
```

A 200-profile enrichment costs $2 at FREE pricing.

### Step 3: How do I score candidates on multi-axis fit?

Compute company-fit, seniority-progression, and tenure-stability scores per candidate, then combine.

```python
TARGET_COMPANIES = {"google", "meta", "openai", "anthropic", "stripe", "airbnb"}
TARGET_ROLE_KEYWORDS = ["staff", "principal", "senior", "lead"]

def company_fit(row):
    past = row.get("past_positions") or []
    current = row.get("current_companies") or []
    all_companies = [(c.get("name") or "").lower() for c in current + past[:5]]
    matches = sum(1 for c in all_companies
                  if any(t in c for t in TARGET_COMPANIES))
    return min(matches / 2.0, 1.0)  # cap at 2 matches

def seniority(row):
    titles = (row.get("current_titles") or []) + [
        p.get("name", "") for p in (row.get("past_positions") or [])[:5]
    ]
    senior_hits = sum(1 for t in titles
                      if any(k in (t or "").lower() for k in TARGET_ROLE_KEYWORDS))
    return min(senior_hits / 3.0, 1.0)

def tenure_stability(row):
    past = row.get("past_positions") or []
    if len(past) < 2:
        return 0.5
    durations = []
    for p in past:
        try:
            start = int(p.get("start_date", "0"))
            end = int(p.get("end_date", "0")) if p.get("end_date") else 2026
            if start > 1990 and end >= start:
                durations.append(end - start)
        except (ValueError, TypeError):
            continue
    if not durations:
        return 0.5
    median_yrs = sorted(durations)[len(durations) // 2]
    return min(median_yrs / 3.0, 1.0)  # 3+ years median = full score

df["company_fit"] = df.apply(company_fit, axis=1)
df["seniority"] = df.apply(seniority, axis=1)
df["tenure_stability"] = df.apply(tenure_stability, axis=1)
df["composite"] = (
    df.company_fit * 0.40 +
    df.seniority * 0.35 +
    df.tenure_stability * 0.25
)

shortlist = df.sort_values("composite", ascending=False).head(20)
print(shortlist[["name", "headline", "company_fit",
                 "seniority", "tenure_stability", "composite"]])
```

Top 20 by composite score is the shortlist for recruiter outreach. Adjust weights per role — startup-fit hiring emphasises tenure_stability less; corporate hiring weights it more.

### Step 4: How do I push to a recruiter CRM?

Map shortlist rows to your CRM's Contact schema and POST.

```python
import requests as r

HUBSPOT_TOKEN = os.environ["HUBSPOT_TOKEN"]

for _, row in shortlist.iterrows():
    primary_company = (row.get("current_companies") or [{}])[0].get("name", "")
    primary_title = (row.get("current_titles") or [None])[0] or ""

    r.post(
        "https://api.hubspot.com/crm/v3/objects/contacts",
        headers={"Authorization": f"Bearer {HUBSPOT_TOKEN}"},
        json={"properties": {
            "firstname": (row["name"] or "").split(" ")[0],
            "lastname": " ".join((row["name"] or "").split(" ")[1:]),
            "jobtitle": primary_title,
            "company": primary_company,
            "city": row.get("location"),
            "linkedin_url": row.get("profile_url"),
            "linkedin_followers": row.get("followers_count"),
            "candidate_score": row.get("composite"),
            "lifecyclestage": "lead",
            "source": "LinkedIn Shortlist",
        }},
        timeout=10,
    )
print(f"{len(shortlist)} shortlisted candidates pushed to HubSpot")
```

Schedule weekly batches of new candidate URLs and the loop maintains a continuously fresh shortlist.

## Sample output

A single profile record (for a senior engineering candidate) looks like this. Five rows of this shape weigh ~5 KB.

```json
{
  "name": "Satya Nadella",
  "headline": "Chairman and CEO at Microsoft",
  "current_titles": ["Chairman and CEO"],
  "current_companies": [{"name": "Microsoft", "start_date": "2014"}],
  "past_positions": [
    {"name": "EVP, Cloud and Enterprise", "company": "Microsoft", "start_date": "2011", "end_date": "2014"}
  ],
  "education": [
    {"school": "University of Wisconsin-Milwaukee", "degree": "MS", "field": "Computer Science"}
  ],
  "about": "As Chairman and CEO of Microsoft...",
  "location": "Redmond, Washington",
  "followers_count": 10000000,
  "profile_url": "https://www.linkedin.com/in/satyanadella/"
}
```

`current_titles` and `past_positions` feed the seniority scoring. `current_companies[].start_date` and `past_positions[].start_date`/`end_date` feed tenure stability. `headline` is useful for human-readable shortlist display alongside the score columns. `followers_count` is a soft signal of industry presence — useful for executive-level shortlists where market visibility matters.

## Common pitfalls

Three things go wrong in production candidate-scoring pipelines. **Date-parsing edge cases** — LinkedIn returns dates as years (`"2014"`) for most roles but occasionally as ranges or freeform text; the tenure-stability function in Step 3 handles common cases but flag profiles with unparseable dates for human review. **Scoring weight drift** — weights that work for senior engineering roles don't transfer to GTM, executive, or junior roles; maintain separate scoring profiles per role family rather than one universal model. **Missing data on restricted profiles** — restricted profiles return only name, headline, profile_photo_url; their composite score will artificially be 0 in the formula above. Surface restricted-profile rows separately rather than ranking them against complete profiles, or assign a default 0.5 score and flag for manual review.

Thirdwatch's actor returns 12 fields per profile from the public LinkedIn page — enough for systematic scoring without crossing into private data. The pure-HTTP architecture means a 200-profile enrichment completes in 10-15 minutes wall-clock and costs $2. Pair with our [LinkedIn Company Employees Scraper](https://apify.com/thirdwatch/linkedin-company-employees-scraper) for systematic per-company candidate sourcing upstream.

## Related use cases

- [Scrape LinkedIn profiles without login](/blog/scrape-linkedin-profiles-without-login)
- [Enrich your CRM with LinkedIn profile data](/blog/enrich-crm-with-linkedin-profile-data)
- [Find decision-makers by title and company](/blog/find-decision-makers-by-title-and-company)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What's the canonical recruiter sourcing workflow on LinkedIn profile data?

Five steps: (1) define the role, target companies, and seniority bands. (2) Source initial candidate URLs from LinkedIn search, conference attendee lists, GitHub, or industry referrals. (3) Pull profiles via the actor in batches of 50-100. (4) Score candidates by company-fit + role-fit + tenure-stability and rank. (5) Forward top 20 to interviewers. End-to-end this is a 30-minute workflow per role once the pipeline is set up.

### How do I source candidate URLs to feed the actor?

The actor enriches a list of profile URLs you provide; sourcing the URLs themselves is upstream. Common sources: LinkedIn People Search (manual, but can dump 100+ URLs per query), GitHub Org members for engineering roles, conference speaker lists for senior roles, our [LinkedIn Company Employees Scraper](https://apify.com/thirdwatch/linkedin-company-employees-scraper) for systematic per-company sourcing. The Profile Scraper then enriches whatever URLs you collected upstream.

### How do I score candidates beyond exact title match?

Three-axis scoring: company-fit (target-company match in past 5 years from `past_positions`), tenure-stability (median tenure across `past_positions`, weighted toward longer = more stable), seniority-progression (title progression in `current_titles` + `past_positions` matches expected career arc). Most recruiter pipelines weight company-fit highest for cold outreach (40%), seniority-progression for screening (35%), tenure-stability for risk assessment (25%).

### What about candidates with restricted profiles?

Profiles with restricted public visibility return only `name`, `headline`, and `profile_photo_url` — not enough for systematic ranking. Two approaches: (1) deprioritise restricted profiles in scoring (they're harder to assess from public data), (2) request connection or InMail through LinkedIn Recruiter for the highest-priority restricted candidates. Most pipelines accept that 5-10% of profiles will be restricted and route them to a human-review queue.

### Is candidate scoring legal?

Public-data candidate scoring for sourcing is well within standard recruiter practices and is exactly how LinkedIn Recruiter's own search ranks candidates. Anti-discrimination law (Title VII in the US) prohibits using protected attributes (race, age, gender) in hiring decisions; building scoring models that explicitly use those attributes is illegal. Models scoring on company history, role progression, and skill alignment are standard. When in doubt, document your scoring methodology and audit it for protected-attribute proxies.

### How fresh is profile data?

Each run pulls live from LinkedIn at request time. Members typically update profiles every 6-12 months (when changing roles or after milestones), so profile data is always at most a few months out of date. For active sourcing, fresh enrichment per outreach attempt is ideal; for batch shortlisting, a one-time enrichment per candidate is sufficient.

Run the [LinkedIn Profile Scraper on Apify Store](https://apify.com/thirdwatch/linkedin-profile-scraper) — pay-per-profile, free to try, no credit card to test.
