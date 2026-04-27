---
title: "Build US Local Services Directory from Yelp (2026)"
slug: "build-us-local-services-directory-from-yelp"
description: "Build a US local-services directory at $0.008 per record using Thirdwatch's Yelp Scraper. Category × city batches + reviews + recipes for directory builders."
actor: "yelp-business-scraper"
actor_url: "https://apify.com/thirdwatch/yelp-scraper"
actorTitle: "Yelp Scraper"
category: "business"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-yelp-businesses-for-restaurant-research"
  - "monitor-yelp-reviews-for-restaurant-reputation"
  - "scrape-google-maps-businesses-for-lead-gen"
keywords:
  - "yelp directory builder"
  - "us local services data"
  - "yelp categories scraper"
  - "yelp business api alternative"
faqs:
  - q: "Why build a US local-services directory from Yelp?"
    a: "Yelp dominates US local-services discovery (legal, medical, home services, automotive, beauty). According to Yelp's 2024 report, the platform indexes 6M+ US businesses across 22 service categories. For US directory-builder products, content-aggregator platforms, and local-services lead-gen tools, Yelp is the canonical content source. Fresh data + review depth makes Yelp materially deeper than Google Maps for US service-business research."
  - q: "What's the right query strategy?"
    a: "Three patterns: (1) `category + city` (`personal injury lawyer Boston`, `pediatrician Chicago`); (2) `niche + neighborhood` (`yoga studio Williamsburg`); (3) `category + zip-code` for hyperlocal coverage. For metro-level directory coverage, target 100+ category-city pairs across top 50 US metros = 5,000+ queries returning 100K+ businesses."
  - q: "How do I dedupe across overlapping queries?"
    a: "Yelp's `business_id` (URL slug) is the canonical natural key per business. Cross-query overlap is typically 20-30% (especially for businesses in multiple categories). Dedupe on `business_id` before treating as unique inventory. For chain-businesses, each location has its own `business_id`."
  - q: "How fresh do directory snapshots need to be?"
    a: "For active directory products serving real-time consumer queries, weekly cadence catches new listings within 7 days. For SEO-driven content directories (long-form pages indexed by Google), monthly cadence suffices. For hyperlocal-services lead-gen (legal, medical), daily snapshots capture new providers + closed businesses for accurate availability."
  - q: "Can I monetize directory products legally?"
    a: "Yes. Yelp data is publicly accessible. Many US local-services directory products (Healthgrades, Avvo, Houzz) compete with Yelp using scraped + curated data. For commercial products: (1) attribute Yelp as data source; (2) avoid wholesale republication of review text; (3) link out to Yelp business pages for full reviews; (4) layer your own value-add (better filtering, AI-summaries, lead-routing)."
  - q: "How does this compare to Yelp Fusion API?"
    a: "Yelp Fusion API is gated behind use-case approval + 5K/day rate limit on free tier. The actor delivers similar coverage at $0.008/record without rate-limit ceiling. For low-volume one-off research (under 5K/day), Yelp Fusion API is cheapest. For high-volume directory-builder products, the actor scales without API gatekeeping."
---

> Thirdwatch's [Yelp Scraper](https://apify.com/thirdwatch/yelp-scraper) lets US directory-builders, content-aggregators, and local-services lead-gen platforms ingest 100K+ businesses at $0.008 per record — name, phone, website, address, hours, reviews, photos, categories, price range. Built for US local-services directory products, hyperlocal lead-gen, and content-aggregator platforms.

## Why build a US directory from Yelp

US local-services discovery happens largely on Yelp + Google. According to [Yelp's 2024 Local Search report](https://www.yelp-press.com/), the platform indexes 6M+ active US businesses across 22 service categories — legal (200K+ lawyers), medical (500K+ providers), home services (1M+ contractors), automotive, beauty, restaurants. For US directory-builders + content-aggregator platforms competing in local-services SEO, Yelp data is the canonical source.

The job-to-be-done is structured. A US legal-services directory startup ingests 100K+ lawyer profiles for SEO-driven content (Boston Personal Injury Lawyers, Chicago Family Law, etc.). A medical-services aggregator surfaces 500K+ providers for patient-search products. A home-services lead-gen platform builds per-metro contractor databases. A travel + lifestyle content publisher mines Yelp for editorial city-guide content. All reduce to category + metro queries + per-business detail aggregation.

## How does this compare to the alternatives?

Three options for US directory data:

| Approach | Cost per 100K records monthly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Yelp Fusion API | Free (5K/day cap) | Official | Days (use-case approval) | Strict TOS + rate limits |
| Manual aggregation from multiple sources | Effectively unbounded analyst time | Patchy | Continuous | Doesn't scale |
| Thirdwatch Yelp Scraper | $800 ($0.008 × 100K) | Camoufox + cookie pool | 5 minutes | Thirdwatch tracks Yelp changes |

Yelp Fusion API rate-limits at 5K/day. The [Yelp Scraper actor page](/scrapers/yelp-scraper) gives you raw directory data at scale without API gatekeeping.

## How to build a directory in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a category × metro batch?

Pass category + city queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~yelp-business-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CATEGORIES = ["personal injury lawyer", "pediatrician",
              "plumber", "electrician", "yoga studio",
              "dentist", "chiropractor", "veterinarian"]
METROS = ["New York", "Los Angeles", "Chicago", "Houston",
          "Phoenix", "Philadelphia", "San Antonio", "San Diego"]

queries = [f"{c} {m}" for c, m in product(CATEGORIES, METROS)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 100},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
df = df.drop_duplicates(subset=["business_id"])
print(f"{len(df)} unique businesses across {df.address.str.split(',').str[-2].str.strip().nunique()} metros")
```

8 categories × 8 metros = 64 queries × 100 = up to 6,400 records, costing $51.

### Step 3: How do I extract structured directory schema?

Build per-business schema for SEO-driven content pages.

```python
def build_directory_schema(row):
    return {
        "name": row.get("name"),
        "category": row.get("category"),
        "all_categories": row.get("all_categories"),
        "address": row.get("address"),
        "phone": row.get("phone"),
        "website": row.get("website"),
        "rating": row.get("rating"),
        "review_count": row.get("review_count"),
        "price_range": row.get("price_range"),
        "hours": row.get("hours"),
        "lat": row.get("lat"),
        "lng": row.get("lng"),
        "photos": row.get("photos", [])[:3],  # first 3 photos
        "yelp_url": row.get("url"),
        "is_open": row.get("is_open", True),
    }

directory = [build_directory_schema(r) for _, r in df.iterrows() if r.get("rating", 0) >= 3.5]
print(f"{len(directory)} businesses in directory (3.5+ rating)")
```

3.5+ rating threshold filters viable directory-listing candidates. Sub-3.5 ratings are typically poor-quality businesses that hurt directory user-trust.

### Step 4: How do I push to Postgres + build SEO pages?

Upsert per business_id + generate static-site directory pages.

```python
import pathlib, psycopg2

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    for biz in directory:
        cur.execute(
            """INSERT INTO local_services
                  (business_id, name, category, address, phone, website,
                   rating, review_count, lat, lng, last_scraped)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, current_date)
               ON CONFLICT (business_id) DO UPDATE SET
                 rating = EXCLUDED.rating,
                 review_count = EXCLUDED.review_count,
                 last_scraped = current_date""",
            (biz["yelp_url"].split("/")[-1], biz["name"], biz["category"],
             biz["address"], biz["phone"], biz["website"], biz["rating"],
             biz["review_count"], biz["lat"], biz["lng"])
        )

# Generate per-(category, city) directory page
for (cat, city), grp in df.groupby(["category", "city"]):
    out = pathlib.Path(f"directory/{cat}_{city}.md".replace(" ", "_"))
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"# Best {cat.title()} in {city}\n"]
    for _, b in grp.head(15).iterrows():
        lines.append(f"## {b['name']}\n- Rating: {b.rating} ({b.review_count} reviews)\n"
                     f"- {b.address}\n- Phone: {b.phone}\n")
    out.write_text("\n".join(lines))
print(f"Generated {len(list(pathlib.Path('directory').glob('*.md')))} directory pages")
```

Static-site-generator-ready directory pages enable SEO-driven traffic acquisition for local-services directory products.

## Sample output

A single Yelp business record looks like this. Five rows weigh ~10 KB.

```json
{
  "business_id": "Smith-Personal-Injury-Boston",
  "name": "Smith & Associates Personal Injury Attorneys",
  "category": "Personal Injury Law",
  "all_categories": ["Personal Injury Law", "Lawyers", "Legal Services"],
  "address": "100 State St, Boston, MA 02109",
  "phone": "+1-617-555-0100",
  "website": "https://smithpersonalinjury.com",
  "rating": 4.8,
  "review_count": 245,
  "price_range": "$$$",
  "lat": 42.3597,
  "lng": -71.0567,
  "hours": ["Mon-Fri: 9 AM-6 PM", "Sat-Sun: Closed"],
  "photos": ["https://s3-media2.fl.yelpcdn.com/..."],
  "url": "https://www.yelp.com/biz/smith-associates-personal-injury-boston"
}
```

`business_id` (URL slug) is the canonical natural key. `all_categories` (vs primary `category`) catches multi-category businesses critical for directory cross-categorization. `price_range` ($-$$$$) enables price-band filtering useful for service-comparison content.

## Common pitfalls

Three things go wrong in directory pipelines. **Closed-business retention** — Yelp shows permanently-closed businesses with `is_closed: true` flag; filter to `is_closed: false` strictly. **Multi-location chain-confusion** — chain businesses (LA Fitness, Starbucks) have separate `business_id` per location; for chain-aware research, group by name + filter by lat/lng cluster. **Review-text licensing** — Yelp's TOS restricts wholesale republication of review text; for directory products, link to Yelp business pages rather than republishing full reviews.

Thirdwatch's actor uses Camoufox + cookie preservation at $5/1K, ~40% margin. Pair Yelp with [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) for cross-source coverage. A fourth subtle issue worth flagging: Yelp's "Yelp Fusion API" terms-of-service require attribution + linking back to yelp.com for any commercial use; for compliance, ensure directory products properly attribute Yelp as data source. A fifth pattern unique to local-services directories: SEO-driven content pages need at minimum 15-20 businesses per (category, city) page to rank well — sparse directory pages (under 5 businesses) tend not to rank. For low-density rural-area pages, supplement with regional-scope or aggregate at county-level. A sixth and final pitfall: Yelp's review-quality varies dramatically by category — restaurants + retail get many reviews per business (50-500+); medical + legal get fewer (10-50) due to confidentiality concerns. For accurate quality-filtering, segment review-count thresholds by category rather than applying a uniform threshold.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. US business data changes slowly — weekly polling on top categories + monthly on long-tail covers most use cases. 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful as your category-classifier evolves with new Yelp taxonomy releases.

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Yelp schema occasionally changes during platform UI revisions — catch drift early. Cross-snapshot diff alerts on business-status changes (active → closed) catch market-velocity signals.

## Related use cases

- [Scrape Yelp businesses for restaurant research](/blog/scrape-yelp-businesses-for-restaurant-research)
- [Monitor Yelp reviews for restaurant reputation](/blog/monitor-yelp-reviews-for-restaurant-reputation)
- [Scrape Google Maps businesses for lead-gen](/blog/scrape-google-maps-businesses-for-lead-gen)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why build a US local-services directory from Yelp?

Yelp dominates US local-services discovery (legal, medical, home services, automotive, beauty). According to Yelp's 2024 report, the platform indexes 6M+ US businesses across 22 service categories. For US directory-builder products, content-aggregator platforms, and local-services lead-gen tools, Yelp is the canonical content source. Fresh data + review depth makes Yelp materially deeper than Google Maps for US service-business research.

### What's the right query strategy?

Three patterns: (1) `category + city` (`personal injury lawyer Boston`, `pediatrician Chicago`); (2) `niche + neighborhood` (`yoga studio Williamsburg`); (3) `category + zip-code` for hyperlocal coverage. For metro-level directory coverage, target 100+ category-city pairs across top 50 US metros = 5,000+ queries returning 100K+ businesses.

### How do I dedupe across overlapping queries?

Yelp's `business_id` (URL slug) is the canonical natural key per business. Cross-query overlap is typically 20-30% (especially for businesses in multiple categories). Dedupe on `business_id` before treating as unique inventory. For chain-businesses, each location has its own `business_id`.

### How fresh do directory snapshots need to be?

For active directory products serving real-time consumer queries, weekly cadence catches new listings within 7 days. For SEO-driven content directories (long-form pages indexed by Google), monthly cadence suffices. For hyperlocal-services lead-gen (legal, medical), daily snapshots capture new providers + closed businesses for accurate availability.

### Can I monetize directory products legally?

Yes. Yelp data is publicly accessible. Many US local-services directory products ([Healthgrades](https://www.healthgrades.com/), [Avvo](https://www.avvo.com/), [Houzz](https://www.houzz.com/)) compete with Yelp using scraped + curated data. For commercial products: (1) attribute Yelp as data source; (2) avoid wholesale republication of review text; (3) link out to Yelp business pages for full reviews; (4) layer your own value-add (better filtering, AI-summaries, lead-routing).

### How does this compare to Yelp Fusion API?

[Yelp Fusion API](https://www.yelp.com/developers) is gated behind use-case approval + 5K/day rate limit on free tier. The actor delivers similar coverage at $0.008/record without rate-limit ceiling. For low-volume one-off research (under 5K/day), Yelp Fusion API is cheapest. For high-volume directory-builder products, the actor scales without API gatekeeping.

Run the [Yelp Scraper on Apify Store](https://apify.com/thirdwatch/yelp-scraper) — pay-per-record, free to try, no credit card to test.
