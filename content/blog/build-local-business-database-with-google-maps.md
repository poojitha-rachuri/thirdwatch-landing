---
title: "Build a Local Business Database with Google Maps (2026)"
slug: "build-local-business-database-with-google-maps"
description: "Build a multi-city local-business database at $0.002 per record using Thirdwatch's Google Maps Scraper. Postgres schema, place_id dedup, search-engine recipes."
actor: "google-maps-scraper"
actor_url: "https://apify.com/thirdwatch/google-maps-scraper"
actorTitle: "Google Maps Scraper"
category: "business"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-google-maps-businesses-for-lead-gen"
  - "find-restaurants-by-cuisine-and-rating"
  - "scrape-business-phone-and-website-from-google-maps"
keywords:
  - "build local business database"
  - "google maps scraper postgres"
  - "yellow pages clone google maps"
  - "local business directory api"
faqs:
  - q: "What does it cost to build a multi-city local-business database?"
    a: "Thirdwatch's Google Maps Scraper charges $0.002 per business on the FREE tier and drops to $0.001 at GOLD volume. A 50-city × 30-category × 100-result build = 150,000 records = $300 at FREE pricing or $150 at GOLD. Most local-business databases rebuild quarterly, so annual data costs sit at $1,200-$2,400 — competitive with the early-stage hosting bill."
  - q: "What's the right cadence for refreshing a local-business database?"
    a: "Quarterly is standard for most directory categories. Local business listings change slowly — most don't update name, address, or phone for 12+ months. Categories with high churn (restaurants, salons, fitness studios) benefit from monthly refresh. For pure aggregation listings, quarterly is fine; for any category where users are checking active hours or current promotions, weekly or monthly cadence is justified."
  - q: "How do I dedupe across overlapping city sweeps?"
    a: "Dedupe on place_id — Google's globally unique business identifier. A multi-city sweep that includes Los Angeles, Long Beach, and Beverly Hills will surface businesses from each city's commercial overlap with neighbouring municipalities; place_id catches these as legitimate duplicate listings (same business indexed in multiple geographic search contexts) and lets you keep the canonical row."
  - q: "What database scheme works best?"
    a: "Postgres with PostGIS extension for geo-queries handles 5 million+ businesses comfortably with proper indexing — GIN full-text on name + categories, btree on city + state + place_id, GIST on the geography(POINT) of latitude/longitude for radius searches. For more demanding search (typo tolerance, faceted filters), push to Algolia, Typesense, or Meilisearch with city + categories as faceted attributes."
  - q: "Can I serve search and category browsing from the same data?"
    a: "Yes. Both queries (free-text search like nearby plumber and category browsing like all dentists in Austin) hit the same underlying table. Free-text uses Postgres' to_tsvector full-text on name + categories. Category browsing uses btree on (city, category). Most real-world local-directory products serve both query patterns from a single 200-line schema."
  - q: "How does this compare to building on Google Places API directly?"
    a: "Google's Places API charges per call with strict rate limits, returns up to 60 results per query, and bills per-field for phone/website. Thirdwatch's actor returns 100 per query, includes contact data in the base price, and uses simple pay-per-result billing. For a multi-city database build, the Thirdwatch approach typically costs 5-10x less; for one-off real-time lookups, Places API is simpler."
---

> Thirdwatch's [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) is the data layer for a multi-city local-business database at $0.002 per record — fan out across cities × categories, dedupe by place_id, ingest into Postgres with PostGIS for geo-queries. Built for developers building local-services directories (plumbers, dentists, restaurants) and lead-generation databases who need a structured Google Maps feed at programmatic scale.

## Why build a local-business database on Google Maps data

Google Maps is the most comprehensive global local-business dataset. According to [Google's 2024 Maps disclosures](https://about.google/), the platform indexes more than 200 million businesses across every market it operates in — material depth no other source matches. For a developer building a vertical-directory product (gym finder, dentist locator, restaurant aggregator), Google Maps is the canonical starting source.

The job-to-be-done is structured. A local-services directory builder fans out across 50 US metros × 30 service categories to seed a launch database. A lead-generation SaaS targeting B2B sales prospects in the Indian SMB market builds a 5M-record database for monthly refreshing. A real-estate platform attaches local-business density to property-search results. A franchise scout builds a competitive-density map for site-selection. All reduce to city × category fan-out → Postgres ingestion → faceted search.

## How does this compare to the alternatives?

Three options for building a multi-city local-business database:

| Approach | Cost per 150K listings (50 cities × 30 cats × 100 each) | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Google Maps browsing | Effectively unbounded analyst time | Low | Months | Doesn't scale |
| Indian/US directory licensing (Yelp Fusion, Yellow Pages data) | $50K–$300K/year flat | High | Weeks–months | Vendor lock-in |
| Thirdwatch Google Maps Scraper | $300 ($0.002 × 150K) per quarterly rebuild | Production-tested | Half a day | Thirdwatch tracks Maps changes |

Yellow-pages-style data licensing exists but is priced for enterprise consumption. The [Google Maps Scraper actor page](/scrapers/google-maps-scraper) lets you build the same dataset for two orders of magnitude less — $1,200/year for quarterly rebuilds vs tens of thousands for a license.

## How to build a local-business database in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I fan out across cities and categories?

Spawn one run per (city, category) combination using Apify's async runs API.

```python
import os, requests, time

ACTOR = "thirdwatch~google-maps-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CITIES = ["Austin TX", "Houston TX", "Dallas TX", "San Antonio TX",
          "Fort Worth TX", "El Paso TX", "Arlington TX", "Plano TX"]
CATEGORIES = ["plumbers", "electricians", "dentists", "doctors",
              "restaurants", "lawyers", "accountants", "auto repair"]

run_ids = []
for city in CITIES:
    for category in CATEGORIES:
        r = requests.post(
            f"https://api.apify.com/v2/acts/{ACTOR}/runs",
            params={"token": TOKEN},
            json={"searchQuery": f"{category} in {city}",
                  "maxResults": 100, "language": "en", "region": "us"},
        )
        run_ids.append((city, category, r.json()["data"]["id"]))
        time.sleep(0.5)

print(f"Spawned {len(run_ids)} city × category runs")
```

8 cities × 8 categories × ~70 results = ~4,500 unique businesses (after dedup), costing ~$9 at FREE pricing.

### Step 3: How do I ingest into Postgres with PostGIS?

Define the schema once; upsert on `place_id`.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE businesses (
  place_id        text PRIMARY KEY,
  name            text NOT NULL,
  category        text,
  categories      text[],
  city            text,
  state           text,
  address         text,
  phone           text,
  website         text,
  rating          numeric,
  latitude        double precision,
  longitude       double precision,
  geo             geography(POINT, 4326),
  area            text,
  opening_status  text,
  google_maps_url text,
  first_seen_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX biz_search_idx ON businesses USING gin (
  to_tsvector('english', coalesce(name, '') || ' ' || array_to_string(coalesce(categories, '{}'::text[]), ' '))
);
CREATE INDEX biz_city_cat_idx ON businesses (city, category);
CREATE INDEX biz_geo_idx ON businesses USING gist (geo);
```

Ingest from completed runs:

```python
import json, time, psycopg2.extras

def collect(run_ids):
    items = []
    for city, category, run_id in run_ids:
        while True:
            s = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}",
                             params={"token": TOKEN}).json()["data"]["status"]
            if s in ("SUCCEEDED", "FAILED", "ABORTED"):
                break
            time.sleep(20)
        if s != "SUCCEEDED":
            continue
        rows = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
                            params={"token": TOKEN}).json()
        for r in rows:
            r["queried_city"] = city
            r["queried_category"] = category
        items.extend(rows)
    return items

items = collect(run_ids)
with psycopg2.connect(...) as conn, conn.cursor() as cur:
    psycopg2.extras.execute_values(
        cur,
        """INSERT INTO businesses
              (place_id, name, category, categories, city, state, address,
               phone, website, rating, latitude, longitude, geo, area,
               opening_status, google_maps_url)
           VALUES %s
           ON CONFLICT (place_id) DO UPDATE SET
             rating = EXCLUDED.rating,
             phone = EXCLUDED.phone,
             website = EXCLUDED.website,
             last_seen_at = now()""",
        [(b["place_id"], b["name"], b.get("queried_category"),
          b.get("categories"), b.get("queried_city").split(" ")[0],
          b.get("queried_city").split(" ")[-1] if " " in b.get("queried_city") else None,
          b.get("address"), b.get("phone"), b.get("website"), b.get("rating"),
          b.get("latitude"), b.get("longitude"),
          f"SRID=4326;POINT({b['longitude']} {b['latitude']})" if b.get("longitude") else None,
          b.get("area"), b.get("opening_status"), b.get("google_maps_url"))
         for b in items if b.get("place_id")],
    )
print(f"Ingested {len(items)} businesses")
```

### Step 4: How do I serve free-text + faceted + radius search?

Free-text search:

```sql
SELECT name, category, city, address, phone, rating, google_maps_url
FROM businesses
WHERE city = 'Austin'
  AND to_tsvector('english', name || ' ' || array_to_string(coalesce(categories, '{}'::text[]), ' ')) @@ plainto_tsquery('english', 'taj indian')
  AND rating >= 4.0
ORDER BY rating DESC NULLS LAST
LIMIT 25;
```

Radius search ("dentists within 5km of a downtown point"):

```sql
SELECT name, address, phone, rating,
       ST_Distance(geo, ST_GeographyFromText('SRID=4326;POINT(-97.7431 30.2672)')) AS meters
FROM businesses
WHERE category = 'dentists'
  AND ST_DWithin(geo, ST_GeographyFromText('SRID=4326;POINT(-97.7431 30.2672)'), 5000)
ORDER BY meters
LIMIT 25;
```

For more demanding search (typo tolerance, multi-facet filtering), push to Meilisearch or Typesense with `city` + `category` as faceted attributes.

## Sample output

A single record from the dataset for one Houston plumber looks like this. Five rows weigh ~3 KB.

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

`place_id` is Google's permanent canonical id — the cleanest natural key for cross-snapshot upsert. `categories` is an array because most businesses tag themselves with multiple — Village Plumbing tags as plumber + HVAC + electrical. `latitude`/`longitude` feed the PostGIS geo column for radius queries.

## Common pitfalls

Three things go wrong in production local-business database builds. **Multi-category category-name drift** — Google Maps shows the same category under different names across cities ("Plumber" vs "Plumbing service"); standardise to one canonical category per concept and map at ingestion. **Address parsing inconsistency** — Google publishes addresses in their natural form; for clean state and city columns, parse the address with [usaddress](https://github.com/datamade/usaddress) for US data or fall back to splitting on commas with light validation. **Stale-listing accumulation** — over years of refreshing, your database accumulates closed businesses; flag rows where `last_seen_at` is more than 6 months old and run a manual or automated re-verification batch quarterly.

Thirdwatch's actor returns `place_id` and structured location data on every record. The pure-HTTP architecture means a quarterly 4,500-business sweep completes in under 15 minutes wall-clock and costs $9 — small enough to run unsupervised. Pair Google Maps with our [Yelp Business Scraper](https://apify.com/thirdwatch/yelp-business-scraper) for cross-source validation in US categories where Yelp coverage is comparable.

## Related use cases

- [Scrape Google Maps businesses for lead generation](/blog/scrape-google-maps-businesses-for-lead-gen)
- [Find restaurants by cuisine and rating](/blog/find-restaurants-by-cuisine-and-rating)
- [Scrape business phone and website from Google Maps](/blog/scrape-business-phone-and-website-from-google-maps)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What does it cost to build a multi-city local-business database?

Thirdwatch's Google Maps Scraper charges $0.002 per business on the FREE tier and drops to $0.001 at GOLD volume. A 50-city × 30-category × 100-result build = 150,000 records = $300 at FREE pricing or $150 at GOLD. Most local-business databases rebuild quarterly, so annual data costs sit at $1,200-$2,400 — competitive with the early-stage hosting bill.

### What's the right cadence for refreshing a local-business database?

Quarterly is standard for most directory categories. Local business listings change slowly — most don't update name, address, or phone for 12+ months. Categories with high churn (restaurants, salons, fitness studios) benefit from monthly refresh. For pure aggregation listings, quarterly is fine; for any category where users are checking active hours or current promotions, weekly or monthly cadence is justified.

### How do I dedupe across overlapping city sweeps?

Dedupe on `place_id` — Google's globally unique business identifier. A multi-city sweep that includes Los Angeles, Long Beach, and Beverly Hills will surface businesses from each city's commercial overlap with neighbouring municipalities; `place_id` catches these as legitimate duplicate listings (same business indexed in multiple geographic search contexts) and lets you keep the canonical row.

### What database scheme works best?

Postgres with [PostGIS extension](https://postgis.net/) for geo-queries handles 5 million+ businesses comfortably with proper indexing — GIN full-text on name + categories, btree on city + state + place_id, GIST on the geography(POINT) of latitude/longitude for radius searches. For more demanding search (typo tolerance, faceted filters), push to Algolia, Typesense, or Meilisearch with city + categories as faceted attributes.

### Can I serve search and category browsing from the same data?

Yes. Both queries (free-text search like `nearby plumber` and category browsing like `all dentists in Austin`) hit the same underlying table. Free-text uses Postgres' `to_tsvector` full-text on name + categories. Category browsing uses btree on `(city, category)`. Most real-world local-directory products serve both query patterns from a single 200-line schema.

### How does this compare to building on Google Places API directly?

Google's [Places API](https://developers.google.com/maps/documentation/places/web-service/overview) charges per call with strict rate limits, returns up to 60 results per query, and bills per-field for phone/website. Thirdwatch's actor returns 100 per query, includes contact data in the base price, and uses simple pay-per-result billing. For a multi-city database build, the Thirdwatch approach typically costs 5-10x less; for one-off real-time lookups, Places API is simpler.

Run the [Google Maps Scraper on Apify Store](https://apify.com/thirdwatch/google-maps-scraper) — pay-per-business, free to try, no credit card to test.
