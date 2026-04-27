---
title: "Scrape Google Maps Businesses for Lead Generation (2026)"
slug: "scrape-google-maps-businesses-for-lead-gen"
description: "Pull verified local businesses with phone, website, rating at $0.002 per record using Thirdwatch's Google Maps Scraper. Python and HubSpot CRM recipes inside."
actor: "google-maps-scraper"
actor_url: "https://apify.com/thirdwatch/google-maps-scraper"
actorTitle: "Google Maps Scraper"
category: "business"
audience: "growth"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "build-local-business-database-with-google-maps"
  - "find-restaurants-by-cuisine-and-rating"
  - "scrape-business-phone-and-website-from-google-maps"
keywords:
  - "google maps scraper"
  - "local business lead generation"
  - "scrape google maps phones"
  - "google places api alternative"
faqs:
  - q: "How much does it cost to scrape Google Maps businesses?"
    a: "Thirdwatch's Google Maps Scraper charges $0.002 per business on the FREE tier and drops to $0.001 at GOLD volume — 2-4x cheaper than the leading Apify alternative (compass/crawler-google-places at $0.004). A 50-query lead-generation sweep at 100 results each costs $10 at FREE pricing — competitive with Google's own Places API once you account for its complex per-call billing."
  - q: "What fields does the actor return?"
    a: "Up to 14 fields per business: name, address, phone, website, rating (1-5), categories array, latitude, longitude, place_id, google_maps_url, area (neighborhood), description, opening_status (live status string), and opening_hours (structured day-by-day schedule when Google publishes one). Review count and price level are not exposed by Google Maps' search API at the scrape layer, so those two fields are not returned."
  - q: "Can I scrape outside the US?"
    a: "Yes. Set region to the country code (uk, in, de, fr, ae, au, etc.) and language to a matching locale (en, es, fr, de, ja). Coverage spans every market Google Maps serves. The actor adapts query rendering to the local Google Maps domain so India searches return Indian listings, UK searches return UK listings, and so on."
  - q: "How many results can I get per query?"
    a: "Up to 100 per searchQuery. Google Maps caps search-results depth in its UI; for larger lists, split queries geographically (plumbers in Houston Heights + plumbers in Montrose + plumbers in Galleria) rather than expecting one broad query to return more. A single 100-result query costs $0.20 at FREE pricing."
  - q: "How does this compare to Google's official Places API?"
    a: "The Places API charges per call with a tiered pricing structure that requires billing setup, returns up to 60 results per query, and bills a separate fee for additional fields like phone and website. Thirdwatch's actor returns 100 results, includes contact data in the base price, and uses simple pay-per-result billing. For one-off lookups the Places API is fine; for systematic lead generation or research, this actor is materially cheaper."
  - q: "How fresh is Google Maps data?"
    a: "Each run pulls live from Google Maps at request time — there is no cache. Maps data updates as businesses themselves update profiles or as Google's crawl reflects changes. Most contact fields (phone, website, rating) update within 24-72 hours of a real change. For active prospecting, daily refresh is sufficient; for static directory builds, monthly is fine."
---

> Thirdwatch's [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) returns structured local-business data at $0.002 per record — name, address, phone, website, rating, categories, GPS coordinates, opening hours. Built for B2B sales prospecting, lead-generation agencies, real-estate site selection, and CRM enrichment workflows that need machine-readable Google Maps data without per-call API billing.

## Why scrape Google Maps for lead generation

Google Maps is the largest local-business directory in the world. According to [Google's 2024 Maps disclosures](https://about.google/), the platform indexes more than 200 million businesses across every country it operates in, with roughly 1 billion monthly active users searching for local services. For any product that touches B2B prospecting, location intelligence, or CRM enrichment, Google Maps is the canonical source of contact data.

The job-to-be-done is structured. A sales team selling SaaS to dental practices wants 5,000 verified dentists with phone and website across 10 US metros, sorted by rating. A direct-mail vendor needs every plumber in Texas with an address. A franchise scout planning expansion wants restaurant density and average rating per neighborhood for a target city. A real-estate developer studying retail mix around a new property wants every business within a 1-mile radius. All of these reduce to the same data shape — Google Maps query × location × maxResults — and the actor returns it as clean JSON ready for HubSpot, Salesforce, or pandas.

## How does this compare to the alternatives?

Three options for getting Google Maps data into a sales pipeline:

| Approach | Cost per 1,000 businesses | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Google Places API | $5–$30 (varies by fields requested) | Official | Hours (billing setup required) | Per-call complexity |
| compass/crawler-google-places (Apify) | $4 ($0.004 × 1,000) | Production-tested | 5 minutes | Vendor maintains |
| Thirdwatch Google Maps Scraper | $2 ($0.002 × 1,000) | Production-tested, 2-4x cheaper | 5 minutes | Thirdwatch tracks Maps changes |

The official Places API is the most expensive option once you include the per-field surcharges for phone, website, and price level. The [Google Maps Scraper actor page](/scrapers/google-maps-scraper) returns these in the base price, returns 100 results per query (vs Places' 60-result cap), and uses simple pay-per-result billing.

## How to scrape Google Maps for lead generation in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull businesses for one query?

Pass a natural-language `searchQuery` (the actor renders it as Google Maps would). For lead generation, the highest-yield queries combine category + city.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~google-maps-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "searchQuery": "dentists in Austin TX",
        "maxResults": 100,
        "language": "en",
        "region": "us",
    },
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} businesses, {df.phone.notna().sum()} with phone, "
      f"{df.website.notna().sum()} with website")
```

A 100-result query completes in under two minutes and costs $0.20 at FREE pricing.

### Step 3: How do I scale to multiple cities and dedupe by place_id?

Loop the same query type across cities; dedupe on the canonical Google `place_id`.

```python
import time

CATEGORIES = ["dentists", "orthodontists", "dental clinics"]
CITIES = ["Austin TX", "Houston TX", "Dallas TX",
          "San Antonio TX", "Fort Worth TX"]

all_rows = []
for city in CITIES:
    for category in CATEGORIES:
        q = f"{category} in {city}"
        r = requests.post(
            f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
            params={"token": TOKEN},
            json={"searchQuery": q, "maxResults": 100,
                  "language": "en", "region": "us"},
            timeout=600,
        )
        all_rows.extend(r.json())
        time.sleep(2)  # polite spacing

df = pd.DataFrame(all_rows).drop_duplicates(subset=["place_id"])
print(f"Texas dental sweep: {len(df)} unique businesses")
```

Five cities × three categories × ~70 unique results per query = ~1,000 unique businesses after dedup. Cost: $3 at FREE pricing.

### Step 4: How do I push leads to HubSpot with rating-weighted ranking?

Filter on phone availability and rating, then push to your CRM.

```python
QUALIFIED = df[
    df.phone.notna() & (df.phone != "")
    & df.rating.notna() & (df.rating >= 3.5)
].copy()
QUALIFIED["score"] = QUALIFIED.rating  # extend with review-count weighting if available

import requests as r
HUBSPOT_TOKEN = os.environ["HUBSPOT_TOKEN"]
for _, row in QUALIFIED.head(500).iterrows():
    r.post(
        "https://api.hubspot.com/crm/v3/objects/companies",
        headers={"Authorization": f"Bearer {HUBSPOT_TOKEN}"},
        json={"properties": {
            "name": row["name"],
            "address": row["address"],
            "phone": row["phone"],
            "website": row["website"] or "",
            "industry": (row["categories"] or [""])[0],
            "city": row["address"].split(",")[-3].strip() if "," in row["address"] else "",
            "lifecyclestage": "lead",
            "source": "Google Maps",
            "google_maps_url": row["google_maps_url"],
        }},
        timeout=10,
    )
print(f"{len(QUALIFIED)} qualified leads pushed to HubSpot")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at daily cadence and the loop is fully self-maintaining.

## Sample output

A single record from the dataset for one Houston plumber looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "name": "Village Plumbing, Air & Electric",
  "address": "10644 W Little York Rd Suite 200, Houston, TX 77041",
  "phone": "(281) 607-5357",
  "website": "https://www.villageplumbing.com/",
  "rating": 4.8,
  "categories": ["Plumber", "Air conditioning contractor", "Electrician"],
  "latitude": 29.8640568,
  "longitude": -95.5618629,
  "place_id": "ChIJIc-2aF_AQIYRJabyrgymSoA",
  "google_maps_url": "https://www.google.com/maps/place/?q=place_id:ChIJIc-2aF_AQIYRJabyrgymSoA",
  "area": "Carverdale",
  "opening_status": "Open - Closes 8 PM"
}
```

`place_id` is Google's globally unique identifier — the canonical key for upsert across runs. `phone` and `website` populate for ~75% of US business listings (slightly higher in service categories like plumbers, lower in retail). `categories` is an array because most businesses tag themselves with multiple — Village Plumbing here is plumber + HVAC + electrical, which matters when filtering. `opening_status` is the live "Open / Closes 8 PM" label users see — handy for scheduling outbound calls during business hours.

## Common pitfalls

Three things go wrong in Google Maps lead-gen pipelines. **Phone-format inconsistency** — `phone` arrives as Google's display format (`(281) 607-5357`); always normalise to a single digit string before passing to a dialer. **Duplicate businesses across queries** — overlapping queries (`plumbers in Houston` + `emergency plumbers in Houston`) return overlapping results; always dedupe on `place_id`, never on `name` (chains have many locations with identical names). **Address parsing variability** — Google publishes addresses in their natural form; for clean state/city columns in your CRM, parse the address with a library like [usaddress](https://github.com/datamade/usaddress) for US data or fall back to splitting by `,` for international.

Thirdwatch's actor returns `place_id` on every record, which is Google's permanent canonical id — using it for dedupe and upsert is the cleanest pattern. The pure-HTTP architecture means a 500-business pull completes in under five minutes and costs $1 — small enough to run weekly without budget approval.

## Related use cases

- [Build a local business database with Google Maps](/blog/build-local-business-database-with-google-maps)
- [Find restaurants by cuisine and rating](/blog/find-restaurants-by-cuisine-and-rating)
- [Scrape business phone and website from Google Maps](/blog/scrape-business-phone-and-website-from-google-maps)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Google Maps businesses?

Thirdwatch's Google Maps Scraper charges $0.002 per business on the FREE tier and drops to $0.001 at GOLD volume — 2-4x cheaper than the leading Apify alternative (compass/crawler-google-places at $0.004). A 50-query lead-generation sweep at 100 results each costs $10 at FREE pricing — competitive with Google's own Places API once you account for its complex per-call billing.

### What fields does the actor return?

Up to 14 fields per business: `name`, `address`, `phone`, `website`, `rating` (1-5), `categories` array, `latitude`, `longitude`, `place_id`, `google_maps_url`, `area` (neighborhood), `description`, `opening_status` (live status string), and `opening_hours` (structured day-by-day schedule when Google publishes one). Review count and price level are not exposed by Google Maps' search API at the scrape layer, so those two fields are not returned.

### Can I scrape outside the US?

Yes. Set `region` to the country code (`uk`, `in`, `de`, `fr`, `ae`, `au`, etc.) and `language` to a matching locale (`en`, `es`, `fr`, `de`, `ja`). Coverage spans every market Google Maps serves. The actor adapts query rendering to the local Google Maps domain so India searches return Indian listings, UK searches return UK listings, and so on.

### How many results can I get per query?

Up to 100 per `searchQuery`. Google Maps caps search-results depth in its UI; for larger lists, split queries geographically (`plumbers in Houston Heights` + `plumbers in Montrose` + `plumbers in Galleria`) rather than expecting one broad query to return more. A single 100-result query costs $0.20 at FREE pricing.

### How does this compare to Google's official Places API?

The [Places API](https://developers.google.com/maps/documentation/places/web-service/overview) charges per call with a tiered pricing structure that requires billing setup, returns up to 60 results per query, and bills a separate fee for additional fields like phone and website. Thirdwatch's actor returns 100 results, includes contact data in the base price, and uses simple pay-per-result billing. For one-off lookups the Places API is fine; for systematic lead generation or research, this actor is materially cheaper.

### How fresh is Google Maps data?

Each run pulls live from Google Maps at request time — there is no cache. Maps data updates as businesses themselves update profiles or as Google's crawl reflects changes. Most contact fields (phone, website, rating) update within 24-72 hours of a real change. For active prospecting, daily refresh is sufficient; for static directory builds, monthly is fine.

Run the [Google Maps Scraper on Apify Store](https://apify.com/thirdwatch/google-maps-scraper) — pay-per-business, free to try, no credit card to test.
