---
title: "Find Decision-Makers by Title and Company on LinkedIn (2026)"
slug: "find-decision-makers-by-title-and-company"
description: "Resolve B2B decision-makers by title + company at $0.01 per profile using Thirdwatch's LinkedIn Profile Scraper. Sales-prospecting recipes inside."
actor: "linkedin-profile-scraper"
actor_url: "https://apify.com/thirdwatch/linkedin-profile-scraper"
actorTitle: "LinkedIn Profile Scraper"
category: "jobs"
audience: "operators"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-linkedin-profiles-without-login"
  - "build-candidate-shortlist-from-linkedin-profiles"
  - "enrich-crm-with-linkedin-profile-data"
keywords:
  - "find decision makers linkedin"
  - "b2b prospecting linkedin"
  - "linkedin title company search"
  - "linkedin sales navigator alternative"
faqs:
  - q: "What titles count as decision-makers in B2B sales?"
    a: "Three tiers: economic buyers (CEO, CFO, COO, VP-level functional heads), technical buyers (Director and above in the relevant function — Engineering, Marketing, Sales, Ops), and influencers (Manager-level domain owners). For most mid-market B2B sales, target economic + technical at the company level. For enterprise, layer in influencers because the buying committee typically includes 6-10 people."
  - q: "How does title-and-company resolution actually work?"
    a: "Pass a list of candidate LinkedIn URLs that match (title, company) tuples. The actor returns full profile data per URL — including title, company, skills, summary. To build the candidate URL list, layer Google search with site:linkedin.com/in qualifiers, or use a vendor like Apollo for URL lookups. The actor itself handles the data fetch, not URL discovery."
  - q: "What's the best workflow for an outbound team?"
    a: "Three-stage pipeline: (1) ICP definition — list 200-500 target accounts; (2) URL resolution — for each account, find LinkedIn URLs of 3-5 decision-maker titles via Google search; (3) profile enrichment — pass URLs through the actor for full data. Stage 3 is where the actor lives. Total cost for 1000-account ICP × 4 personas: ~4K profile fetches at $40 (FREE tier)."
  - q: "How fresh does decision-maker data need to be?"
    a: "For active sales pipelines, refresh every 60-90 days — that's the typical cadence at which a meaningful share of decision-makers change roles. Buyers in transition (just-promoted, just-changed-companies) are particularly receptive in their first 90 days at a new role, so re-enriching shortlists for job changes surfaces high-intent prospects."
  - q: "What signals identify high-priority targets?"
    a: "Three: (1) recent role change (90 days or less in current role) — suggests open to vendor evaluation; (2) skills overlap with your buyer ICP — confirms domain authority; (3) company hiring velocity (cross-reference with LinkedIn Jobs scraper) — companies expanding their function are more receptive to new vendors. Combine these signals to rank within ICP."
  - q: "How does this compare to ZoomInfo or Apollo?"
    a: "ZoomInfo and Apollo bundle email + phone enrichment with title-and-company filtering at $5K-$15K/year per seat. The actor gives you raw LinkedIn data at $10/1K profiles — useful when you have an alternative email-resolution layer (Hunter, Clearbit) or rely on LinkedIn InMail for outreach. For full-stack outbound, ZoomInfo/Apollo win on integration; for cost-optimized stacks, scrape + email-finder produces the same outcome at 50-100x lower cost."
---

> Thirdwatch's [LinkedIn Profile Scraper](https://apify.com/thirdwatch/linkedin-profile-scraper) gives B2B sales teams, ABM marketers, and account-research functions structured profile data at $0.01 per profile — title, company, skills, summary, certifications, location. Built for outbound-prospecting pipelines, ABM target-account workflows, and recruiter-to-buyer conversion intelligence.

## Why find decision-makers by title and company

B2B outbound conversion depends on reaching the right person. According to [LinkedIn's 2024 State of B2B Sales report](https://business.linkedin.com/), the average enterprise buying committee has 6-10 stakeholders, and outreach to the wrong title produces less than 1% of the conversion of outreach to the correct decision-maker. For sales teams running ABM pipelines, getting the title-and-company resolution layer right is the difference between a 5% reply rate and a 25% reply rate.

The job-to-be-done is structured. An outbound SDR team prospects 500 target accounts × 4 decision-maker titles = 2,000 contacts to enrich with LinkedIn data weekly. An ABM marketing team builds account-engagement dashboards combining LinkedIn profile data with intent signals. A revenue-ops team enriches Salesforce on a 10K-account list quarterly. A recruiter team identifies hiring-manager contacts at target candidate-employers. All reduce to (title, company) tuple list + LinkedIn URL resolution + profile-data enrichment.

## How does this compare to the alternatives?

Three options for B2B decision-maker enrichment:

| Approach | Cost per 1,000 contacts | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| ZoomInfo / Apollo | $5K–$15K/year (fixed) | High, with email + phone | Hours | Per-seat license |
| LinkedIn Sales Navigator | $1,000/seat/year | Manual lookups | Hours | Per-seat per-month |
| Thirdwatch LinkedIn Profile Scraper | $10 ($0.01 × 1,000) | Production-tested | 5 minutes | Thirdwatch tracks LinkedIn changes |

ZoomInfo bundles email and phone enrichment but at a price gate. The [LinkedIn Profile Scraper actor page](/scrapers/linkedin-profile-scraper) gives you the raw LinkedIn data layer cheaply — pair with Hunter or Clearbit for email resolution.

## How to find decision-makers in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I resolve title × company to LinkedIn URLs?

Use Google search with `site:linkedin.com/in` qualifiers.

```python
import os, requests, re
from urllib.parse import quote_plus

GOOGLE_ACTOR = "thirdwatch~google-search-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

ACCOUNTS = ["Stripe", "Notion", "Linear", "Vercel", "Anthropic"]
TITLES = ["VP Engineering", "Director of Engineering",
          "Head of Marketing", "VP of Sales"]

def google_query(title, company):
    return f'site:linkedin.com/in "{title}" "{company}"'

queries = [google_query(t, c) for t in TITLES for c in ACCOUNTS]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{GOOGLE_ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=600,
)

URL_RE = re.compile(r"https://www\.linkedin\.com/in/[\w-]+")
candidate_urls = set()
for r in resp.json():
    for url in URL_RE.findall(r.get("snippet", "") + r.get("url", "")):
        candidate_urls.add(url)

print(f"{len(candidate_urls)} candidate LinkedIn URLs")
```

20 (title, account) tuples × 50 results = up to 1,000 raw search results, costing $0.40.

### Step 3: How do I enrich the URLs with profile data?

Pass URLs to the LinkedIn Profile Scraper.

```python
import pandas as pd

PROFILE_ACTOR = "thirdwatch~linkedin-profile-scraper"

resp = requests.post(
    f"https://api.apify.com/v2/acts/{PROFILE_ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"profileUrls": list(candidate_urls)},
    timeout=3600,
)
profiles = pd.DataFrame(resp.json())

# Filter to verified title × company matches
def matches_target(row, accounts, titles):
    if row.currentCompany not in accounts:
        return False
    return any(t.lower() in (row.headline or "").lower() for t in titles)

profiles["is_target"] = profiles.apply(matches_target, axis=1,
                                       accounts=set(ACCOUNTS),
                                       titles=set(TITLES))
verified = profiles[profiles.is_target]
print(f"{len(verified)} verified decision-makers")
```

About 60-75% of Google-discovered URLs verify against (title, company) on the actual LinkedIn profile; the rest are stale or off-target.

### Step 4: How do I score and route to outbound CRM?

Layer scoring signals: tenure, skills overlap, hiring velocity at company.

```python
import datetime as dt
from simple_salesforce import Salesforce

verified["tenure_days"] = verified.experience.apply(
    lambda exp: (dt.datetime.utcnow() - dt.datetime.fromisoformat(exp[0]["startDate"])).days
    if isinstance(exp, list) and exp else None
)
verified["recently_promoted"] = verified.tenure_days < 90

sf = Salesforce(...)
for _, p in verified.iterrows():
    sf.Lead.create({
        "FirstName": p.fullName.split()[0],
        "LastName": p.fullName.split()[-1],
        "Company": p.currentCompany,
        "Title": p.currentTitle,
        "LinkedIn_URL__c": p.profileUrl,
        "Recently_Promoted__c": bool(p.recently_promoted),
        "LeadSource": "LinkedIn-DecisionMaker",
    })
print(f"Created {len(verified)} Salesforce leads")
```

Recently-promoted decision-makers convert at 2-3x baseline rates because they're actively scoping vendor relationships in their new scope.

## Sample output

A single decision-maker profile looks like this. Five rows weigh ~10 KB.

```json
{
  "profileUrl": "https://www.linkedin.com/in/janedoe",
  "fullName": "Jane Doe",
  "headline": "VP of Engineering at Stripe",
  "currentCompany": "Stripe",
  "currentTitle": "VP of Engineering",
  "location": "San Francisco Bay Area",
  "summary": "Leading engineering teams in payments infrastructure...",
  "skills": ["Engineering Management", "Payments", "API Design",
             "Distributed Systems", "Team Building"],
  "experience": [{"company": "Stripe", "title": "VP Engineering",
                  "startDate": "2025-09-01"}, ...],
  "education": [...]
}
```

`profileUrl` is the canonical natural key. `currentTitle` + `currentCompany` are the verification target. `experience[0].startDate` enables tenure-in-role calculation — a key intent signal. `skills` array supports ICP-fit scoring.

## Common pitfalls

Three things go wrong in decision-maker pipelines. **Title-string variance** — "VP of Engineering", "VP, Engineering", "Vice President of Engineering" all describe the same role; normalize via controlled vocabulary. **Stale Google results** — Google's index lags LinkedIn by weeks; always verify on the live profile before treating as actionable. **Off-account false positives** — `site:linkedin.com/in` queries sometimes return profiles from companies with similar names (Stripe vs Stripe Studios); always validate `currentCompany` exact-match.

Thirdwatch's actor uses pure HTTP with Sec-Fetch headers at $3/1K, ~73% margin. Pair with [Google Search Scraper](https://apify.com/thirdwatch/google-search-scraper) for URL resolution and [LinkedIn Jobs Scraper](https://apify.com/thirdwatch/linkedin-jobs-scraper) for hiring-velocity scoring. A fourth subtle issue worth flagging: certain decision-makers maintain stealth-mode LinkedIn profiles (no current title, generic headline like "Builder" or "Investor") to avoid recruiter spam — these are high-value targets but require deeper signal-fingerprinting (recent posts, comments, network) to identify; for stealth-DM detection, supplement profile fetches with company-page employee-list scraping. A fifth pattern unique to title-resolution work: certain enterprise companies use idiosyncratic title taxonomies (Microsoft "Principal", Google "Staff", Amazon "PE/SDE-III") that don't map cleanly to canonical VP/Director titles; for cross-company comparable rankings, build a per-company title-leveling table that normalizes idiosyncratic titles into canonical seniority bands. A sixth and final pitfall: LinkedIn's `headline` field is creator-controlled and often more aspirational than accurate (a Director sometimes lists themselves as "VP" in headline); for verified DM resolution, anchor on `experience[0].title` (the structured experience entry) rather than the freeform headline. A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size. This is the difference between a $200/month research pipeline and a $2,000/month one for the same actionable output. An eighth subtle issue worth flagging: snapshot-storage strategy materially affects long-term pipeline economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. For high-frequency snapshots, partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

## Related use cases

- [Scrape LinkedIn profiles without login](/blog/scrape-linkedin-profiles-without-login)
- [Build candidate shortlist from LinkedIn profiles](/blog/build-candidate-shortlist-from-linkedin-profiles)
- [Enrich your CRM with LinkedIn profile data](/blog/enrich-crm-with-linkedin-profile-data)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What titles count as decision-makers in B2B sales?

Three tiers: economic buyers (CEO, CFO, COO, VP-level functional heads), technical buyers (Director and above in the relevant function — Engineering, Marketing, Sales, Ops), and influencers (Manager-level domain owners). For most mid-market B2B sales, target economic + technical at the company level. For enterprise, layer in influencers because the buying committee typically includes 6-10 people.

### How does title-and-company resolution actually work?

Pass a list of candidate LinkedIn URLs that match (title, company) tuples. The actor returns full profile data per URL — including title, company, skills, summary. To build the candidate URL list, layer Google search with `site:linkedin.com/in` qualifiers, or use a vendor like Apollo for URL lookups. The actor itself handles the data fetch, not URL discovery.

### What's the best workflow for an outbound team?

Three-stage pipeline: (1) ICP definition — list 200-500 target accounts; (2) URL resolution — for each account, find LinkedIn URLs of 3-5 decision-maker titles via Google search; (3) profile enrichment — pass URLs through the actor for full data. Stage 3 is where the actor lives. Total cost for 1000-account ICP × 4 personas: ~4K profile fetches at $40 (FREE tier).

### How fresh does decision-maker data need to be?

For active sales pipelines, refresh every 60-90 days — that's the typical cadence at which a meaningful share of decision-makers change roles. Buyers in transition (just-promoted, just-changed-companies) are particularly receptive in their first 90 days at a new role, so re-enriching shortlists for job changes surfaces high-intent prospects.

### What signals identify high-priority targets?

Three: (1) recent role change (90 days or less in current role) — suggests open to vendor evaluation; (2) skills overlap with your buyer ICP — confirms domain authority; (3) company hiring velocity (cross-reference with LinkedIn Jobs scraper) — companies expanding their function are more receptive to new vendors. Combine these signals to rank within ICP.

### How does this compare to ZoomInfo or Apollo?

[ZoomInfo](https://www.zoominfo.com/) and [Apollo](https://www.apollo.io/) bundle email + phone enrichment with title-and-company filtering at $5K-$15K/year per seat. The actor gives you raw LinkedIn data at $10/1K profiles — useful when you have an alternative email-resolution layer (Hunter, Clearbit) or rely on LinkedIn InMail for outreach. For full-stack outbound, ZoomInfo/Apollo win on integration; for cost-optimized stacks, scrape + email-finder produces the same outcome at 50-100x lower cost.

Run the [LinkedIn Profile Scraper on Apify Store](https://apify.com/thirdwatch/linkedin-profile-scraper) — pay-per-profile, free to try, no credit card to test.
