---
title: "Scrape JustDial for Local Business Leads in India (2026)"
slug: "scrape-justdial-for-local-business-leads"
description: "Pull verified Indian SMB leads at $0.002 per record with Thirdwatch's JustDial Scraper. Phone, address, rating across 1000+ cities. Python + CRM recipes."
actor: "justdial-business-scraper"
actor_url: "https://apify.com/thirdwatch/justdial-business-scraper"
actorTitle: "JustDial Scraper"
category: "business"
audience: "growth"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "build-india-local-services-directory-from-justdial"
  - "monitor-justdial-reviews-for-reputation"
  - "find-clinics-and-doctors-india-with-justdial"
keywords:
  - "justdial scraper"
  - "india smb lead generation"
  - "local business leads india"
  - "justdial b2b prospecting"
faqs:
  - q: "How much does it cost to scrape JustDial business leads?"
    a: "Thirdwatch's JustDial Scraper charges $0.002 per business listing on the FREE tier and drops to $0.001 at GOLD volume. A 10-category lead-generation sweep across Mumbai at 100 results each — typical for B2B prospecting in a single city — costs $2 per refresh, small enough to run weekly without budget overhead."
  - q: "Which Indian cities does JustDial cover?"
    a: "JustDial publishes business listings across 1,000+ Indian cities including all major metros (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata, Ahmedabad), tier-2 cities (Indore, Surat, Coimbatore, Lucknow, Jaipur), and a long tail of smaller cities. The actor accepts any city name JustDial recognises in the city input."
  - q: "Are phone numbers reliable for outbound sales?"
    a: "Yes — JustDial publishes verified business phone numbers. Most listings expose a direct phone in the publicly visible data, although some businesses choose to hide it. The actor returns whatever JustDial publishes; expect 70-90% phone fill-rate per category. For categories where contact rate is critical (plumbers, lawyers), expect higher fill."
  - q: "How does JustDial differ from Google Maps for India SMB data?"
    a: "JustDial has materially deeper coverage of Indian small businesses — plumbers, electricians, tutors, local restaurants, chartered accountants — because Indian SMBs actively register on JustDial for visibility. Google Maps coverage is broader but shallower for Indian SMBs. For India-specific local services prospecting, JustDial wins; for global location data with GPS coordinates, Google Maps wins."
  - q: "Can I prospect multiple categories in one run?"
    a: "Yes. Pass an array of categories in queries — for example ['Restaurants', 'Hotels', 'Caterers'] — and the actor scrapes each independently in the specified city. Each category contributes up to maxResultsPerQuery records to the merged dataset, which makes a single run sufficient for full-funnel hospitality prospecting in one city."
  - q: "How do I push leads directly to my CRM?"
    a: "The dataset returns CRM-ready fields: business_name, address, phone, category, rating, listing_url. Map each row to your CRM's Company schema and POST. HubSpot, Salesforce, Pipedrive, and Zoho all accept this shape with minimal field mapping. Most teams use Apify's webhook integration to forward each completed run's dataset directly to a CRM ingestion endpoint."
---

> Thirdwatch's [JustDial Scraper](https://apify.com/thirdwatch/justdial-business-scraper) returns structured Indian SMB lead data from JustDial.com — India's largest local business directory with 30M+ listings across 1,000+ cities — at $0.002 per business. Returns business_name, address, phone, rating, review_count, timing, and website per record. Built for B2B sales teams, lead-generation agencies, and growth marketers who need machine-readable Indian SMB contact data without manual directory browsing.

## Why scrape JustDial for India SMB lead generation

JustDial is the dominant local-business directory in India. According to [JustDial's FY24 annual report](https://corporate.justdial.com/), the platform serves over 175 million unique users a year and lists more than 30 million Indian businesses across 1,000+ cities. For a B2B sales team selling into Indian SMBs — whether the product is accounting software, payroll services, fintech, or business loans — JustDial is where the long tail of Indian business contact data actually lives, indexed by category and city.

The job-to-be-done is concrete. A SaaS sales team needs 5,000 verified Indian restaurants in Mumbai with public phone numbers, sorted by rating. A direct-mail vendor needs every chartered accountant in Bangalore with an address. A fintech distributor needs jewellery shops in Delhi with high review counts as a proxy for transaction volume. All of these reduce to the same shape: search a category in a city, return business records, push into a CRM. Manual JustDial browsing scales to maybe 30 leads per analyst-hour; the actor returns 1,000 in two minutes.

## How does this compare to the alternatives?

Three options for getting Indian SMB lead data:

| Approach | Cost per 1,000 leads | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual JustDial browsing | Effectively unbounded analyst time | Low (transcription error) | Continuous | Doesn't scale |
| Indian B2B lead provider (Lead Generation India, Easyleads) | $200–$2,000 per 1K leads | Variable, often stale | Days to receive | Vendor lock-in, license restrictions |
| Thirdwatch JustDial Scraper | $2 ($0.002 × 1,000) | Production-tested, monopoly position on Apify | 5 minutes | Thirdwatch tracks JustDial changes |

Indian B2B lead providers re-package JustDial and similar sources, marked up 100-1000x. The [JustDial Scraper actor page](/scrapers/justdial-business-scraper) gives you the live structured data; the CRM mapping is downstream pandas. There is no other maintained JustDial scraper on the Apify Store.

## How to scrape JustDial for local business leads in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull leads for a category in a specific city?

Pass categories in `queries` and the city in `city`. Set `maxResultsPerQuery` based on how deep you need coverage — JustDial supports up to 500 per category.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~justdial-business-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["Restaurants", "Hotels", "Caterers", "Bakeries"],
        "city": "Mumbai",
        "maxResultsPerQuery": 100,
    },
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} listings across {df.category.nunique()} categories in {df.location.iloc[0]}")
```

Four hospitality categories × 100 results per category = up to 400 leads, completing in under three minutes and costing $0.80.

### Step 3: How do I filter to high-quality leads?

Filter on rating, review count, and phone availability. Categories with high rating and review count are validated businesses; phone availability is the gate for outbound.

```python
QUALIFIED = df[
    (df.phone.notna() & (df.phone != ""))
    & (pd.to_numeric(df.rating, errors="coerce") >= 3.5)
    & (pd.to_numeric(df.review_count, errors="coerce") >= 10)
].copy()

# Sort by combined trust signal
QUALIFIED["score"] = (
    pd.to_numeric(QUALIFIED.rating, errors="coerce")
    * pd.to_numeric(QUALIFIED.review_count, errors="coerce") ** 0.5
)
top = QUALIFIED.sort_values("score", ascending=False)
print(top[["business_name", "category", "address", "phone", "rating",
           "review_count", "website"]].head(25))
```

Sqrt-weighting review count balances "high rating, many reviews" (the genuine quality signal) against pure rating from a thin review base. A 5.0 with 3 reviews shouldn't outrank a 4.5 with 200.

### Step 4: How do I push leads to a CRM at scale?

Map each row to your CRM's Company schema and POST. HubSpot example:

```python
import requests as r
HUBSPOT_TOKEN = os.environ["HUBSPOT_TOKEN"]

for _, row in QUALIFIED.head(200).iterrows():
    r.post(
        "https://api.hubspot.com/crm/v3/objects/companies",
        headers={"Authorization": f"Bearer {HUBSPOT_TOKEN}"},
        json={"properties": {
            "name": row["business_name"],
            "city": row["location"].split(",")[0].strip() if row["location"] else "",
            "phone": row["phone"],
            "website": row["website"] or "",
            "industry": row["category"],
            "description": f"Rating: {row['rating']}, {row['review_count']} reviews",
            "lifecyclestage": "lead",
            "source": "JustDial",
        }},
        timeout=10,
    )
```

A 200-lead Mumbai-restaurants prospecting batch pushed to HubSpot in under five minutes — the entire workflow from raw scrape to qualified-and-loaded leads.

## Sample output

A single record from the dataset for one Mumbai restaurant looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "business_name": "Hotel Taj Palace",
  "category": "Restaurants",
  "location": "Mumbai, India",
  "address": "123 Marine Drive, Mumbai 400001",
  "phone": "+91-2212345678",
  "rating": 4.2,
  "review_count": 150,
  "timing": "11:00 AM - 11:00 PM",
  "website": "https://hoteltaj.com",
  "photos_count": 12,
  "listing_url": "https://www.justdial.com/Mumbai/Hotel-Taj-Palace/..."
}
```

`phone` is the action field — what your sales team or auto-dialer needs. `rating` and `review_count` are the trust filters. `timing` is the underrated field that lets you schedule outbound calls during business hours rather than spam the line at 7 AM. `website` populates for roughly 40% of listings — many Indian SMBs run their entire operation through JustDial without a separate website, which is itself a signal about the business's digital maturity and may guide your sales pitch.

## Common pitfalls

Three things go wrong in JustDial-based prospecting pipelines. **Phone-number stripping** — JustDial occasionally returns phone in display formats with spaces or dashes; always normalise to a single digit string before passing to a dialer or SMS API. **Category-level overlap** — a "Restaurants" search and a "Caterers" search often return the same business twice (caterers list as restaurants too); dedupe on a normalised business_name + city before pushing to CRM. **Rate limiting on aggressive runs** — JustDial throttles repeat traffic from the same IP, so pulling more than 5,000 records in a tight burst from a single residential IP can trigger blocks. The default Indian residential proxy rotation handles most workloads; for very large pulls, split across multiple runs with cool-down gaps.

Thirdwatch's actor uses an Indian residential proxy rotation by default and conservative concurrency, so it stays well within polite-crawling norms for most lead-generation workloads. The pure-HTTP architecture means a 1,000-lead Mumbai pull completes in under five minutes and costs $2 — small enough to run without budget approval. A fourth subtle issue is that JustDial occasionally rotates a single business across multiple "category" pages (a hotel that also serves food shows up under both "Hotels" and "Restaurants"); when prospecting hospitality verticals it's worth grouping by `business_name` + first half of `address` to find these multi-category listings and decide whether to treat them as one lead or two.

## Related use cases

- [Build an India local services directory from JustDial](/blog/build-india-local-services-directory-from-justdial)
- [Monitor JustDial reviews for reputation management](/blog/monitor-justdial-reviews-for-reputation)
- [Find clinics and doctors in India with JustDial](/blog/find-clinics-and-doctors-india-with-justdial)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape JustDial business leads?

Thirdwatch's JustDial Scraper charges $0.002 per business listing on the FREE tier and drops to $0.001 at GOLD volume. A 10-category lead-generation sweep across Mumbai at 100 results each — typical for B2B prospecting in a single city — costs $2 per refresh, small enough to run weekly without budget overhead.

### Which Indian cities does JustDial cover?

JustDial publishes business listings across 1,000+ Indian cities including all major metros (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata, Ahmedabad), tier-2 cities (Indore, Surat, Coimbatore, Lucknow, Jaipur), and a long tail of smaller cities. The actor accepts any city name JustDial recognises in the `city` input.

### Are phone numbers reliable for outbound sales?

Yes — JustDial publishes verified business phone numbers. Most listings expose a direct phone in the publicly visible data, although some businesses choose to hide it. The actor returns whatever JustDial publishes; expect 70-90% phone fill-rate per category. For categories where contact rate is critical (plumbers, lawyers), expect higher fill.

### How does JustDial differ from Google Maps for India SMB data?

JustDial has materially deeper coverage of Indian small businesses — plumbers, electricians, tutors, local restaurants, chartered accountants — because Indian SMBs actively register on JustDial for visibility. Google Maps coverage is broader but shallower for Indian SMBs. For India-specific local services prospecting, JustDial wins; for global location data with GPS coordinates, Google Maps wins.

### Can I prospect multiple categories in one run?

Yes. Pass an array of categories in `queries` — for example `["Restaurants", "Hotels", "Caterers"]` — and the actor scrapes each independently in the specified city. Each category contributes up to `maxResultsPerQuery` records to the merged dataset, which makes a single run sufficient for full-funnel hospitality prospecting in one city.

### How do I push leads directly to my CRM?

The dataset returns CRM-ready fields: `business_name`, `address`, `phone`, `category`, `rating`, `listing_url`. Map each row to your CRM's Company schema and POST. HubSpot, Salesforce, Pipedrive, and Zoho all accept this shape with minimal field mapping. Most teams use [Apify's webhook integration](https://docs.apify.com/platform/integrations/webhooks) to forward each completed run's dataset directly to a CRM ingestion endpoint.

Run the [JustDial Scraper on Apify Store](https://apify.com/thirdwatch/justdial-business-scraper) — pay-per-business, free to try, no credit card to test.
