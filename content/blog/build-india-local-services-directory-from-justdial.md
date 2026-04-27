---
title: "Build an India Local Services Directory from JustDial (2026)"
slug: "build-india-local-services-directory-from-justdial"
description: "Build a multi-city Indian local-services directory at $0.002 per record with Thirdwatch's JustDial Scraper. Postgres schema + city-category fan-out recipes."
actor: "justdial-business-scraper"
actor_url: "https://apify.com/thirdwatch/justdial-business-scraper"
actorTitle: "JustDial Scraper"
category: "business"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-justdial-for-local-business-leads"
  - "monitor-justdial-reviews-for-reputation"
  - "find-clinics-and-doctors-india-with-justdial"
keywords:
  - "india local services directory"
  - "multi city justdial scraper"
  - "build justdial competitor"
  - "india smb directory api"
faqs:
  - q: "How much does it cost to build a multi-city Indian directory?"
    a: "Thirdwatch's JustDial Scraper charges $0.002 per business listing on the FREE tier and drops to $0.001 at GOLD volume. A 20-city × 20-category × 200-result build = 80,000 records = $160 at FREE pricing or $80 at GOLD. Most directories rebuild monthly, so annual data costs sit at $1,000-$2,000 — competitive with the early-stage hosting bill."
  - q: "What's the right cadence for refreshing a directory?"
    a: "Monthly is standard for most directory categories — Indian SMB listings change infrequently (most don't update business_name, phone, or address for years). Categories with high churn (restaurants, salons) benefit from weekly refresh. For pure aggregation listings, monthly is fine; for any category where users are checking active hours or current promotions, weekly or daily."
  - q: "Should I store full text descriptions or just the structured fields?"
    a: "Structured fields are enough for most directory use cases — business_name, address, phone, rating, category, listing_url. Full descriptions are not in the JustDial actor output. For category-specific extra fields (operating hours, photos count), the actor returns timing and photos_count which most directories surface alongside the structured columns."
  - q: "How do I dedupe across overlapping city-category sweeps?"
    a: "Dedupe on listing_url — JustDial's URL is unique per business listing and stable for the lifetime of the listing. A multi-city sweep that includes Mumbai's Bandra and Mumbai's Andheri may surface the same business twice if it has multiple branches, in which case both are legitimate entries with distinct URLs and addresses."
  - q: "What database scheme works best for a JustDial-backed directory?"
    a: "Postgres with a GIN full-text index on business_name + category, plus btree indexes on city, state, and listing_url, handles up to 5 million listings comfortably. For larger or more search-heavy directories, push to Algolia, Typesense, or Meilisearch with city + category as faceted filters. The schema below is a tested baseline."
  - q: "Can I monetize the directory with JustDial data?"
    a: "Yes, with caveats. JustDial publishes business listings publicly; aggregating them for a directory is well within standard fair-use territory. Adding a value layer (better search, custom filters, mobile-friendly UI, integrations) is the path that creates real user value. Pure verbatim re-publication without added value is closer to copyright-grey territory and not recommended."
---

> Thirdwatch's [JustDial Scraper](https://apify.com/thirdwatch/justdial-business-scraper) is the data layer for a multi-city Indian local-services directory at $0.002 per listing — fan out across 20 cities × 20 categories, dedupe by URL, ingest into Postgres with full-text search. Built for developers building India-vertical directories (restaurants, doctors, plumbers) and aggregators who need JustDial's 30M+ listings as a clean structured feed.

## Why build an India local services directory on JustDial data

Indian local-services discovery is fragmented. JustDial dominates with 30M+ listings according to [JustDial's FY24 report](https://corporate.justdial.com/), but the user experience is dated — users complain about cluttered UI, intrusive phone-dialer prompts, and slow mobile pages. That gap is exactly why specialised verticals (Practo for doctors, Urban Company for home services, Zomato for food) have been able to peel off categories one by one. For a developer building the next vertical-directory product — chartered accountants, lawyers, tutors, gym franchises — JustDial is the single best starting dataset and the actor returns it clean.

The job-to-be-done is structured. A directory builder needs to systematically fan out across cities and categories, ingest into Postgres, dedupe, and serve a search UI. A market researcher building an India SMB census wants the same shape but for analysis instead of front-end serving. A vertical SaaS prospecting tool wants high-rated businesses by category as a sales pipeline. All three reduce to the same data shape: city × category × top-N businesses with full metadata. The Thirdwatch actor handles each city-category cell in a single call.

## How does this compare to the alternatives?

Three options for building a multi-city Indian directory:

| Approach | Cost per 80K listings (20 cities × 20 cats × 200) | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual JustDial browsing | Effectively unbounded analyst time | Low | Months | Doesn't scale |
| Indian directory data licence (Sulekha API, GroundTruth) | $20K–$200K/year flat | High | Days–weeks | Vendor lock-in |
| Thirdwatch JustDial Scraper | $160 ($0.002 × 80K) per monthly rebuild | Production-tested, monopoly position on Apify | Half a day | Thirdwatch tracks JustDial changes |

Indian directory data licensing exists but is priced for enterprise consumption. The [JustDial Scraper actor page](/scrapers/justdial-business-scraper) lets you build the same dataset for two orders of magnitude less — $1-2K/year for monthly rebuilds vs. tens of thousands for a licence.

## How to build an India local services directory in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I fan out across cities and categories?

Spawn one run per city × category combination (or batch categories per city). Apify's async runs API supports concurrent spawns.

```python
import os, requests, time

ACTOR = "thirdwatch~justdial-business-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CITIES = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad",
          "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"]
CATEGORIES = ["Restaurants", "Doctors", "Plumbers", "Electricians",
              "Hotels", "Gyms", "Tutors", "Chartered Accountants",
              "Beauty Parlours", "Repair Services"]

run_ids = []
for city in CITIES:
    r = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/runs",
        params={"token": TOKEN},
        json={"queries": CATEGORIES, "city": city, "maxResultsPerQuery": 200},
    )
    run_ids.append((city, r.json()["data"]["id"]))
    time.sleep(0.5)  # gentle stagger

print(f"Spawned {len(run_ids)} city-runs")
```

10 cities × 10 categories × 200 results = up to 20,000 records per pass. Each city run takes 4-8 minutes; with 10 in parallel the wall-clock is roughly 12 minutes total.

### Step 3: How do I ingest into Postgres with full-text search?

Define the schema once; upsert on `listing_url`.

```sql
CREATE TABLE directory (
  listing_url     text PRIMARY KEY,
  business_name   text NOT NULL,
  category        text NOT NULL,
  city            text NOT NULL,
  state           text,
  address         text,
  phone           text,
  rating          numeric,
  review_count    integer,
  timing          text,
  website         text,
  photos_count    integer,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dir_search_idx ON directory USING gin (
  to_tsvector('simple', coalesce(business_name, '') || ' ' || coalesce(category, ''))
);
CREATE INDEX dir_city_cat_idx ON directory (city, category);
```

Upsert from each completed run:

```python
import psycopg2.extras

def ingest(run_id):
    items = requests.get(
        f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
        params={"token": TOKEN},
    ).json()
    if not items:
        return 0
    with psycopg2.connect(...) as conn, conn.cursor() as cur:
        psycopg2.extras.execute_values(
            cur,
            """INSERT INTO directory (listing_url, business_name, category, city,
                                       state, address, phone, rating, review_count,
                                       timing, website, photos_count)
               VALUES %s
               ON CONFLICT (listing_url) DO UPDATE SET
                 business_name = EXCLUDED.business_name,
                 phone = EXCLUDED.phone,
                 rating = EXCLUDED.rating,
                 review_count = EXCLUDED.review_count,
                 last_seen_at = now()""",
            [(j["listing_url"], j["business_name"], j["category"],
              (j["location"] or "").split(",")[0].strip(),
              (j["location"] or "").split(",")[-1].strip() if "," in (j.get("location") or "") else None,
              j.get("address"), j.get("phone"),
              j.get("rating"), j.get("review_count"),
              j.get("timing"), j.get("website"), j.get("photos_count"))
             for j in items],
        )
    return len(items)

total = 0
for city, run_id in run_ids:
    while True:
        status = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}",
            params={"token": TOKEN},
        ).json()["data"]["status"]
        if status in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(15)
    if status == "SUCCEEDED":
        total += ingest(run_id)
print(f"Ingested {total} listings into directory")
```

### Step 4: How do I serve search and faceted filters?

For under 5M listings, Postgres full-text plus `city`, `category` btree indexes handle most search shapes:

```sql
SELECT business_name, category, city, address, phone, rating, listing_url
FROM directory
WHERE city = 'Mumbai'
  AND category = 'Restaurants'
  AND to_tsvector('simple', business_name) @@ plainto_tsquery('simple', 'taj')
  AND rating >= 4.0
ORDER BY rating DESC, review_count DESC NULLS LAST
LIMIT 25;
```

For more demanding search shapes (typo tolerance, multi-facet filtering, ranked search), push the dataset into [Meilisearch](https://www.meilisearch.com/) or [Typesense](https://typesense.org/) and serve from there.

## Sample output

A single record from the dataset for one Mumbai restaurant looks like this. 80,000 rows of this shape weigh roughly 50 MB on disk before indexing.

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

`listing_url` is the canonical natural key for upsert across rebuilds. `category` is set by the search query you passed, not by JustDial-side classification — so be deliberate about your query taxonomy because it becomes your directory's category vocabulary. `photos_count` is an underrated quality signal: businesses with 10+ photos are usually invested in JustDial as a customer-acquisition channel and tend to be more responsive to inquiries than zero-photo listings.

## Common pitfalls

Three things break multi-city directories on JustDial data. **Category-name drift** — JustDial uses several spellings for similar categories (`Beauty Parlours` vs `Beauty Parlor` vs `Salons`); pick one canonical name per concept and pass that exact spelling in `queries`, then map the actor output's `category` field back to your canonical category in the ingestion layer. **City naming inconsistency** — JustDial uses both English and Devanagari names for some cities and there's no canonical id; standardise on the English forms in your `queries` array and treat the location field as input only, not as the source of truth for your directory's city column. **Multi-branch businesses** — a single chain (Domino's, McDonald's) has many JustDial listings, one per outlet; this is correct for a directory but if you're computing "number of unique businesses" you'll over-count chains.

Thirdwatch's actor uses an Indian residential proxy by default at conservative concurrency, so it stays well within polite-crawling norms even at the 80K-record-per-rebuild scale. The pure-HTTP architecture means a 200-listing city-category cell completes in 4-8 minutes and the full nationwide rebuild parallelises to roughly 15-20 minutes wall-clock.

## Related use cases

- [Scrape JustDial for local business leads](/blog/scrape-justdial-for-local-business-leads)
- [Monitor JustDial reviews for reputation management](/blog/monitor-justdial-reviews-for-reputation)
- [Find clinics and doctors in India with JustDial](/blog/find-clinics-and-doctors-india-with-justdial)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to build a multi-city Indian directory?

Thirdwatch's JustDial Scraper charges $0.002 per business listing on the FREE tier and drops to $0.001 at GOLD volume. A 20-city × 20-category × 200-result build = 80,000 records = $160 at FREE pricing or $80 at GOLD. Most directories rebuild monthly, so annual data costs sit at $1,000-$2,000 — competitive with the early-stage hosting bill.

### What's the right cadence for refreshing a directory?

Monthly is standard for most directory categories — Indian SMB listings change infrequently (most don't update `business_name`, `phone`, or `address` for years). Categories with high churn (restaurants, salons) benefit from weekly refresh. For pure aggregation listings, monthly is fine; for any category where users are checking active hours or current promotions, weekly or daily.

### Should I store full text descriptions or just the structured fields?

Structured fields are enough for most directory use cases — `business_name`, `address`, `phone`, `rating`, `category`, `listing_url`. Full descriptions are not in the JustDial actor output. For category-specific extra fields (operating hours, photos count), the actor returns `timing` and `photos_count` which most directories surface alongside the structured columns.

### How do I dedupe across overlapping city-category sweeps?

Dedupe on `listing_url` — JustDial's URL is unique per business listing and stable for the lifetime of the listing. A multi-city sweep that includes Mumbai's Bandra and Mumbai's Andheri may surface the same business twice if it has multiple branches, in which case both are legitimate entries with distinct URLs and addresses.

### What database scheme works best for a JustDial-backed directory?

Postgres with a GIN full-text index on `business_name` + `category`, plus btree indexes on `city`, `state`, and `listing_url`, handles up to 5 million listings comfortably. For larger or more search-heavy directories, push to [Algolia](https://www.algolia.com/), Typesense, or Meilisearch with `city` + `category` as faceted filters. The schema in Step 3 is a tested baseline.

### Can I monetize the directory with JustDial data?

Yes, with caveats. JustDial publishes business listings publicly; aggregating them for a directory is well within standard fair-use territory. Adding a value layer (better search, custom filters, mobile-friendly UI, integrations) is the path that creates real user value. Pure verbatim re-publication without added value is closer to copyright-grey territory and not recommended.

Run the [JustDial Scraper on Apify Store](https://apify.com/thirdwatch/justdial-business-scraper) — pay-per-business, free to try, no credit card to test.
