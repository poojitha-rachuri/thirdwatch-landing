---
title: "Scrape LinkedIn Profiles Without Login at Scale (2026)"
slug: "scrape-linkedin-profiles-without-login"
description: "Pull public LinkedIn profile data at $0.01 per profile using Thirdwatch — no login, no cookies. Names, titles, education, articles. Python and CRM recipes."
actor: "linkedin-profile-scraper"
actor_url: "https://apify.com/thirdwatch/linkedin-profile-scraper"
actorTitle: "LinkedIn Profile Scraper"
category: "jobs"
audience: "recruiters"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "build-candidate-shortlist-from-linkedin-profiles"
  - "enrich-crm-with-linkedin-profile-data"
  - "find-decision-makers-by-title-and-company"
keywords:
  - "linkedin profile scraper"
  - "scrape linkedin profiles no login"
  - "linkedin profile api alternative"
  - "linkedin profile data python"
faqs:
  - q: "Do I need a LinkedIn account or cookies?"
    a: "No. Thirdwatch's LinkedIn Profile Scraper accesses only publicly visible profile pages — the same URLs anyone can view as a guest without signing in. The actor never logs in, never injects cookies, and never touches private data. This sidesteps the account-suspension risk that breaks most logged-in scraping approaches."
  - q: "How much does it cost to scrape LinkedIn profiles?"
    a: "Thirdwatch charges $0.01 per profile on the FREE tier and drops to $0.005 at GOLD volume. A 1,000-profile candidate-research batch costs $10 at FREE pricing or $5 at GOLD — competitive with Apollo, Lusha, and other contact-data tools that charge similar rates per record while bundling in features you may not need."
  - q: "What fields are returned per profile?"
    a: "Up to 12 fields per profile: name, headline, current_titles, current_companies (with start dates), past_positions (with company, title, date range), education (school, degree, field), about, location, profile_photo_url, followers_count, profile_url, and articles (with title, date, like count). Skills, endorsements, recommendations, and certifications are not returned because they require login on LinkedIn."
  - q: "Can I pass usernames instead of full URLs?"
    a: "Yes. The actor accepts three input formats: bare username (satyanadella), profile path (/in/satyanadella), or full URL (https://www.linkedin.com/in/satyanadella/). Mixing formats in the same profileUrls array works fine. For watchlists curated from external sources (Crunchbase, Hunter, internal CRM), pass whatever format you have without preprocessing."
  - q: "How does this compare to Apollo or Lusha for sales prospecting?"
    a: "Apollo and Lusha enrich profiles with email and direct-dial phone — fields LinkedIn does not publicly expose. They charge $50-$200/month per seat plus credit-based usage. Thirdwatch's actor returns the public LinkedIn data only (no email/phone) at pure pay-per-result pricing — typically 2-5x cheaper for the LinkedIn-data layer of a prospecting workflow. For email and phone, pair this with a contact-enrichment service downstream."
  - q: "What if a profile is private or restricted?"
    a: "Profiles with restricted visibility return a subset of the standard fields — typically only name, headline, and profile photo. The actor returns whatever LinkedIn shows publicly. Surface restricted-profile rows as a quality flag in your downstream pipeline rather than dropping them; they're often legitimate prospects who simply restricted their public profile."
---

> Thirdwatch's [LinkedIn Profile Scraper](https://apify.com/thirdwatch/linkedin-profile-scraper) returns public LinkedIn profile data at $0.01 per profile — name, headline, current and past positions, education, location, follower count, and articles — without requiring a LinkedIn account, cookies, or session tokens. Built for recruiters researching candidates, sales teams enriching prospect records, founders building their own outbound, and researchers studying career trajectories at scale.

## Why scrape LinkedIn profiles without login

LinkedIn is the largest professional-profile dataset in the world. According to [LinkedIn's own end-of-2024 disclosures](https://news.linkedin.com/), the platform hosts more than 1 billion member profiles. For a recruiter agency screening candidates, a sales team enriching prospect records, or a researcher studying executive career trajectories, that profile dataset is the canonical source. The blocker for most teams: LinkedIn does not offer a public profile API, and logged-in scraping approaches risk account suspension and break with every UI change LinkedIn ships.

A guest-mode scraper sidesteps both problems. LinkedIn's public profile pages render core profile data to anonymous visitors — that's the page Thirdwatch's actor reads. The job-to-be-done is structured. A recruiter wants every senior engineer at a target company enriched from a list of profile URLs. A sales team wants prospect records auto-filled from LinkedIn after a Crunchbase search. A founder wants every YC-founder profile pulled for an investor-research project. A market researcher wants 5,000 product manager profiles across FAANG to study career trajectories. All of these reduce to the same call: pass profile URLs in, get structured rows out.

## How does this compare to the alternatives?

Three options for getting LinkedIn profile data into a pipeline:

| Approach | Cost per 1,000 profiles | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Logged-in scraping (own account) | Free + risk of suspension | Brittle | Days–weeks | Account churn |
| Apollo / Lusha (enrichment SaaS) | $20K–$60K/year + credits | High coverage, includes email/phone | Hours | Vendor lock-in |
| Thirdwatch LinkedIn Profile Scraper | $10 ($0.01 × 1,000) | Production-tested, no login | 5 minutes | Thirdwatch tracks LinkedIn changes |

Apollo and Lusha bundle email/phone enrichment LinkedIn doesn't publicly expose, but they're priced for go-to-market teams with full sales motions. The [LinkedIn Profile Scraper actor page](/scrapers/linkedin-profile-scraper) gives you the public profile fields — names, titles, education, articles — at pay-per-result pricing for teams that only need the LinkedIn layer.

## How to scrape LinkedIn profiles in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull profiles from a list of URLs or usernames?

Pass any mix of usernames, paths, or full URLs. The actor normalises all three.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~linkedin-profile-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PROFILES = [
    "satyanadella",
    "/in/sundarpichai",
    "https://www.linkedin.com/in/jeffweiner08/",
    "lisasu",
    "patgelsinger",
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"profileUrls": PROFILES, "maxProfiles": 100},
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} profiles enriched")
```

Five profiles cost $0.05; a 100-profile batch costs $1.

### Step 3: How do I extract current employment and education in clean rows?

Flatten the nested arrays for downstream BigQuery / pandas analysis.

```python
flat = []
for _, row in df.iterrows():
    primary_title = (row.get("current_titles") or [None])[0]
    primary_company = (row.get("current_companies") or [{}])[0]
    primary_edu = (row.get("education") or [{}])[0]
    flat.append({
        "name": row.get("name"),
        "headline": row.get("headline"),
        "title": primary_title,
        "company": primary_company.get("name"),
        "company_start": primary_company.get("start_date"),
        "school": primary_edu.get("school"),
        "degree": primary_edu.get("degree"),
        "location": row.get("location"),
        "followers": row.get("followers_count"),
        "profile_url": row.get("profile_url"),
    })
flat_df = pd.DataFrame(flat)
print(flat_df.head())
```

The `flat_df` is the canonical "one row per person" view recruiter and sales pipelines actually consume.

### Step 4: How do I push to a CRM and dedupe by profile_url?

LinkedIn `profile_url` is stable per member; dedupe on it before upserting to HubSpot, Salesforce, or your sourcing tool.

```python
import requests as r

HUBSPOT_TOKEN = os.environ["HUBSPOT_TOKEN"]
flat_df = flat_df.drop_duplicates(subset=["profile_url"])

for _, row in flat_df.iterrows():
    r.post(
        "https://api.hubspot.com/crm/v3/objects/contacts",
        headers={"Authorization": f"Bearer {HUBSPOT_TOKEN}"},
        json={"properties": {
            "firstname": (row["name"] or "").split(" ")[0],
            "lastname": " ".join((row["name"] or "").split(" ")[1:]),
            "jobtitle": row["title"],
            "company": row["company"],
            "city": row["location"],
            "linkedin_url": row["profile_url"],
            "linkedin_followers": row["followers"],
            "linkedin_headline": row["headline"],
        }},
        timeout=10,
    )
print(f"{len(flat_df)} contacts upserted to HubSpot")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at daily cadence keyed off a "freshly added profiles" list and the loop maintains itself.

## Sample output

A single record for one profile looks like this. Five rows of this shape weigh ~5 KB.

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

`current_companies` and `past_positions` are arrays because LinkedIn supports multiple concurrent roles per person — common for executives, board members, and advisors. `followers_count` is a useful proxy for influence/reach in the network. `articles` (when populated) gives recent publication titles and dates, useful for sales teams trying to find a recent talking-point for outreach.

## Common pitfalls

Three things go wrong in production LinkedIn-profile pipelines. **Username normalisation drift** — LinkedIn occasionally changes profile URL formats (custom URLs vs auto-generated `/pub/`-style URLs). The actor handles all three input formats, but your CRM keying should standardise to the resolved `profile_url` returned in the output, not the input you sent. **Restricted-profile rows** — about 5-10% of profiles return only name + headline + photo because the user has restricted public visibility; treat these as flagged-but-kept rather than dropping them. **Job-history truncation** — LinkedIn shows full position history for some profiles and only the latest 5-7 positions for others; for a complete career-history analysis, the actor returns whatever LinkedIn renders publicly, and any gaps should be expected rather than treated as a scraper failure.

Thirdwatch's actor uses an Apify residential-proxy rotation by default and conservative concurrency to stay well within polite-crawling norms. The pure-HTTP architecture means a 100-profile pull completes in 5-10 minutes wall-clock and costs $1 — small enough to run continuously as part of a sourcing pipeline. A fourth subtle issue worth flagging is that LinkedIn occasionally surfaces "Locked" profile pages where the headline and current title are visible but everything else (about, education, past_positions) is gated behind login; the actor returns whatever LinkedIn renders publicly, so locked rows show partial data and are best treated as quality-flagged rather than retried — retrying without a login won't unlock them. A fifth note: company-name normalisation is your responsibility downstream — LinkedIn shows "Microsoft" for some employees and "Microsoft Corporation" for others on the same company page; build a synonyms map if cross-employee company-grouping matters in your CRM.

## Related use cases

- [Build a candidate shortlist from LinkedIn profiles](/blog/build-candidate-shortlist-from-linkedin-profiles)
- [Enrich your CRM with LinkedIn profile data](/blog/enrich-crm-with-linkedin-profile-data)
- [Find decision-makers by title and company](/blog/find-decision-makers-by-title-and-company)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Do I need a LinkedIn account or cookies?

No. Thirdwatch's LinkedIn Profile Scraper accesses only publicly visible profile pages — the same URLs anyone can view as a guest without signing in. The actor never logs in, never injects cookies, and never touches private data. This sidesteps the account-suspension risk that breaks most logged-in scraping approaches.

### How much does it cost to scrape LinkedIn profiles?

Thirdwatch charges $0.01 per profile on the FREE tier and drops to $0.005 at GOLD volume. A 1,000-profile candidate-research batch costs $10 at FREE pricing or $5 at GOLD — competitive with Apollo, Lusha, and other contact-data tools that charge similar rates per record while bundling in features you may not need.

### What fields are returned per profile?

Up to 12 fields per profile: `name`, `headline`, `current_titles`, `current_companies` (with start dates), `past_positions` (with company, title, date range), `education` (school, degree, field), `about`, `location`, `profile_photo_url`, `followers_count`, `profile_url`, and `articles` (with title, date, like count). Skills, endorsements, recommendations, and certifications are not returned because they require login on LinkedIn.

### Can I pass usernames instead of full URLs?

Yes. The actor accepts three input formats: bare username (`satyanadella`), profile path (`/in/satyanadella`), or full URL (`https://www.linkedin.com/in/satyanadella/`). Mixing formats in the same `profileUrls` array works fine. For watchlists curated from external sources (Crunchbase, Hunter, internal CRM), pass whatever format you have without preprocessing.

### How does this compare to Apollo or Lusha for sales prospecting?

[Apollo](https://www.apollo.io/) and [Lusha](https://www.lusha.com/) enrich profiles with email and direct-dial phone — fields LinkedIn does not publicly expose. They charge $50-$200/month per seat plus credit-based usage. Thirdwatch's actor returns the public LinkedIn data only (no email/phone) at pure pay-per-result pricing — typically 2-5x cheaper for the LinkedIn-data layer of a prospecting workflow. For email and phone, pair this with a contact-enrichment service downstream.

### What if a profile is private or restricted?

Profiles with restricted visibility return a subset of the standard fields — typically only name, headline, and profile photo. The actor returns whatever LinkedIn shows publicly. Surface restricted-profile rows as a quality flag in your downstream pipeline rather than dropping them; they're often legitimate prospects who simply restricted their public profile.

Run the [LinkedIn Profile Scraper on Apify Store](https://apify.com/thirdwatch/linkedin-profile-scraper) — pay-per-profile, free to try, no credit card to test.
