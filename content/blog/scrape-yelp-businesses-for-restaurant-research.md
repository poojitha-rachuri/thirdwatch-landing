---
title: "Scrape Yelp Businesses for Restaurant Research (2026)"
slug: "scrape-yelp-businesses-for-restaurant-research"
description: "Pull Yelp restaurant + service-business data at $0.008 per record using Thirdwatch. Cuisine + rating + reviews + photos + recipes for hospitality teams."
actor: "yelp-business-scraper"
actor_url: "https://apify.com/thirdwatch/yelp-scraper"
actorTitle: "Yelp Scraper"
category: "business"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "build-us-local-services-directory-from-yelp"
  - "monitor-yelp-reviews-for-restaurant-reputation"
  - "find-restaurants-by-cuisine-and-rating"
keywords:
  - "yelp scraper"
  - "scrape restaurant reviews"
  - "us local business scraper"
  - "yelp api alternative"
faqs:
  - q: "Why Yelp for restaurant + service-business research?"
    a: "Yelp dominates US restaurants + consumer-services discovery (legal, medical, home services). According to Yelp's 2024 Local Business report, the platform indexes 240M+ reviews across 6M+ businesses with deep review-text richness. For US-focused restaurant research, hospitality competitive analysis, and service-business reputation tracking, Yelp is materially deeper than Google Maps for review content."
  - q: "What data does the actor return?"
    a: "Per business: name, address, phone, website, hours, lat/lng, business_id, primary category, all categories, price range ($-$$$$), aggregate rating, review count, photos URLs. Per review (when scraped separately): rating, text, reviewer name, helpful-count, review date. About 90%+ of active Yelp businesses have comprehensive metadata."
  - q: "How does Yelp handle anti-bot defenses?"
    a: "Yelp uses DataDome aggressively on search pages but allows business-detail (`/biz/{slug}`) pages through. Thirdwatch's actor uses Camoufox stealth-browser on detail pages where DataDome auto-resolves; search-page access has more retry overhead. About 95%+ success rate on detail pages; search may need 2-3 retries with fresh proxy."
  - q: "Can I scrape reviews at scale?"
    a: "Yes, but at higher cost. Each business detail-page returns 20 reviews per scrape; pagination through additional review pages costs 1 detail-page-fetch per 20 reviews. For 500-business reputation-monitoring with 100 reviews each = 25K records = $200 FREE tier. For sentiment-analysis projects, batch reviews on a rolling 90-day refresh."
  - q: "How does this compare to Yelp Fusion API?"
    a: "Yelp Fusion API is rate-limited (5K/day free tier) and gates beyond a strict use-case approval. The actor delivers similar coverage at $0.008/record without daily caps. For low-volume one-off research (under 5K records/day), Yelp's free Fusion API is the cheapest path. For high-volume research, monitoring, or platform-builder use cases, the actor scales without API gatekeeping."
  - q: "What's the cost for typical restaurant research?"
    a: "$0.008/record FREE tier. A 100-restaurant city-research batch with detail data = $0.80. Daily monitoring of 50 restaurants in a city for rating drift = $0.40/day = $12/month. Quarterly comprehensive city-restaurant research (1000 restaurants × 50 reviews each) = $400/quarter at FREE tier."
---

> Thirdwatch's [Yelp Scraper](https://apify.com/thirdwatch/yelp-scraper) returns US restaurant + service-business data at $0.008 per record — name, phone, website, address, hours, rating, review count, reviews, photos, categories, price range. Built for hospitality competitive research, restaurant-aggregator builders, US local-services lead-gen, and service-business reputation tracking.

## Why scrape Yelp for restaurant research

Yelp dominates US restaurant + consumer-services discovery. According to [Yelp's 2024 Local Business report](https://www.yelp-press.com/), the platform indexes 240M+ reviews across 6M+ businesses with depth of review-text richness no other platform matches in US restaurants. For US-focused hospitality research, restaurant-aggregator products, and service-business reputation tracking, Yelp is materially deeper than Google Maps for review content.

The job-to-be-done is structured. A restaurant-aggregator startup ingests 50K Yelp businesses across top US metros for marketplace seeding. A hospitality-competitive-research function maps category + price-band + rating distributions per metro. A US local-services lead-gen team extracts contact data + ratings for sales-prospecting. A service-business reputation tracking function monitors per-business rating + review-velocity for crisis detection. All reduce to category + city queries + per-business detail pulls.

## How does this compare to the alternatives?

Three options for Yelp data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Yelp Fusion API | Free (5K/day cap, gated) | Official | Days (use-case approval) | Strict TOS |
| Reputation.com / Birdeye | $5K–$50K/year per seat | Multi-platform aggregation | Days | Vendor contract |
| Thirdwatch Yelp Scraper | $80 ($0.008 × 10K) | Camoufox + cookie pool | 5 minutes | Thirdwatch tracks Yelp changes |

Yelp Fusion API is the official path but capped at 5K/day with gated approval. Reputation SaaS aggregators bundle Yelp at the high end. The [Yelp Scraper actor page](/scrapers/yelp-scraper) gives you raw Yelp data at the lowest unit cost.

## How to scrape Yelp in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a city × category batch?

Pass `category city` queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~yelp-business-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CATEGORIES = ["italian restaurant", "japanese restaurant", "thai restaurant",
              "mexican restaurant", "indian restaurant"]
CITIES = ["San Francisco", "New York", "Chicago",
          "Los Angeles", "Boston"]

queries = [f"{c} {city}" for c, city in product(CATEGORIES, CITIES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
df = df.drop_duplicates(subset=["business_id"])
print(f"{len(df)} unique businesses across {df.address.str.split(',').str[-2].str.strip().nunique()} cities")
```

5 categories × 5 cities = 25 queries × 50 results = up to 1,250 raw records, costing $10.

### Step 3: How do I filter by quality + price band?

Filter to serious operators with rating + reviews + price-band.

```python
df["price_int"] = df.price_range.str.len()  # $ -> 1, $$ -> 2, etc.
df["rating"] = pd.to_numeric(df.rating, errors="coerce")
df["reviews_count"] = pd.to_numeric(df.reviews_count, errors="coerce")

quality = df[
    (df.rating >= 4.0)
    & (df.reviews_count >= 100)
    & df.phone.notna()
    & df.price_int.between(2, 4)  # $$ to $$$$ exclude $ (cheapest)
].sort_values(["rating", "reviews_count"], ascending=[False, False])

print(f"{len(quality)} quality restaurants ($$ to $$$$, 4.0+ stars, 100+ reviews)")
print(quality[["name", "rating", "reviews_count", "price_range", "address"]].head(15))
```

The `(rating >= 4.0) & (reviews_count >= 100)` threshold filters serious operators. Price-band filtering targets specific market segments (budget vs mid vs upscale dining).

### Step 4: How do I export per-cuisine, per-city directories?

Group by cuisine + city + emit Markdown directory.

```python
import pathlib

def cuisine_from_query(q):
    return q.split()[0].title()

quality["cuisine"] = quality.searchString.apply(cuisine_from_query)
quality["metro"] = quality.address.str.extract(r",\s*([^,]+),\s*[A-Z]{2}")

for (cuisine, metro), grp in quality.groupby(["cuisine", "metro"]):
    if len(grp) < 5: continue
    out = pathlib.Path(f"directory/{cuisine}_{metro.replace(' ', '_')}.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"# Best {cuisine} Restaurants in {metro}\n",
             "_Sourced from Yelp, refreshed quarterly._\n"]
    for _, r in grp.head(10).iterrows():
        lines.append(f"## {r['name']}\n- Rating: {r.rating} ({int(r.reviews_count)} reviews)\n"
                     f"- Price: {r.price_range}\n- Address: {r.address}\n- Phone: {r.phone}\n")
    out.write_text("\n".join(lines))

print(f"Exported {len(list(pathlib.Path('directory').glob('*.md')))} directory files")
```

Static-site-generator-ready markdown for editorial restaurant directories.

## Sample output

A single Yelp business record looks like this. Five rows weigh ~10 KB.

```json
{
  "business_id": "L-Industrie-Pizzeria-Brooklyn",
  "name": "L'Industrie Pizzeria",
  "category": "Pizza",
  "all_categories": ["Pizza", "Italian"],
  "address": "254 S 2nd St, Brooklyn, NY 11211",
  "phone": "+1-718-599-0002",
  "website": "https://lindustriebk.com",
  "rating": 4.7,
  "reviews_count": 1842,
  "price_range": "$$",
  "lat": 40.7104,
  "lng": -73.9608,
  "hours": ["Mon: Closed", "Tue-Sun: 12-10 PM"],
  "photos": ["https://s3-media2.fl.yelpcdn.com/..."],
  "yelp_url": "https://www.yelp.com/biz/lindustrie-pizzeria-brooklyn"
}
```

`business_id` is the canonical natural key (URL slug). `price_range` ($/$$/$$$/$$$$) enables market-segment filtering. `all_categories` (vs primary `category`) catches multi-cuisine restaurants. `photos` array enables visual-content pipelines.

## Common pitfalls

Three things go wrong in Yelp pipelines. **DataDome on search pages** — search-page access requires Camoufox + retries; business-detail pages are easier. For high-volume research, prioritize known business-IDs over search-driven discovery. **Closed-business handling** — Yelp retains records for permanently-closed businesses; check `is_closed: true` flag and exclude. **Fake reviews + Yelp's filter** — Yelp's algorithm hides ~10-25% of reviews as "not currently recommended" — these are typically lower-quality. The actor returns only "currently recommended" reviews by default; for full review-set including filtered, configure separately.

Thirdwatch's actor uses Camoufox + cookie preservation at $5/1K, ~40% margin. Pair Yelp with [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) for global coverage and [Trustpilot](https://apify.com/thirdwatch/trustpilot-reviews-scraper) for non-US reviews. A fourth subtle issue worth flagging: Yelp's category taxonomy is non-standard (a "Pizza" restaurant may also tag as "Italian", "Sandwiches", "Salads") — for accurate cuisine-pure filtering, use `category` (primary) rather than `all_categories` (multi-tag). A fifth pattern unique to Yelp restaurant research: weekend-vs-weekday rating distribution shifts noticeably for restaurants serving brunch — same restaurant rated 4.2 on weekday lunch, 4.6 on weekend brunch. For accurate per-restaurant quality assessment, examine review-date distribution alongside aggregate rating. A sixth and final pitfall: Yelp's mobile-app-driven review patterns differ from desktop — younger reviewers leave shorter mobile reviews with higher emoji density. For sentiment analysis on long-form review text, filter by review-text length (>50 words) before NLP processing to focus on substantive reviews.  A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size.

An eighth subtle issue: snapshot-storage strategy materially affects long-term economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. Partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early.

## Related use cases

- [Build US local-services directory from Yelp](/blog/build-us-local-services-directory-from-yelp)
- [Monitor Yelp reviews for restaurant reputation](/blog/monitor-yelp-reviews-for-restaurant-reputation)
- [Find restaurants by cuisine and rating](/blog/find-restaurants-by-cuisine-and-rating)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why Yelp for restaurant + service-business research?

Yelp dominates US restaurants + consumer-services discovery (legal, medical, home services). According to Yelp's 2024 Local Business report, the platform indexes 240M+ reviews across 6M+ businesses with deep review-text richness. For US-focused restaurant research, hospitality competitive analysis, and service-business reputation tracking, Yelp is materially deeper than Google Maps for review content.

### What data does the actor return?

Per business: name, address, phone, website, hours, lat/lng, business_id, primary category, all categories, price range ($-$$$$), aggregate rating, review count, photos URLs. Per review (when scraped separately): rating, text, reviewer name, helpful-count, review date. About 90%+ of active Yelp businesses have comprehensive metadata.

### How does Yelp handle anti-bot defenses?

Yelp uses DataDome aggressively on search pages but allows business-detail (`/biz/{slug}`) pages through. Thirdwatch's actor uses Camoufox stealth-browser on detail pages where DataDome auto-resolves; search-page access has more retry overhead. About 95%+ success rate on detail pages; search may need 2-3 retries with fresh proxy.

### Can I scrape reviews at scale?

Yes, but at higher cost. Each business detail-page returns 20 reviews per scrape; pagination through additional review pages costs 1 detail-page-fetch per 20 reviews. For 500-business reputation-monitoring with 100 reviews each = 25K records = $200 FREE tier. For sentiment-analysis projects, batch reviews on a rolling 90-day refresh.

### How does this compare to Yelp Fusion API?

[Yelp Fusion API](https://www.yelp.com/developers) is rate-limited (5K/day free tier) and gates beyond a strict use-case approval. The actor delivers similar coverage at $0.008/record without daily caps. For low-volume one-off research (under 5K records/day), Yelp's free Fusion API is the cheapest path. For high-volume research, monitoring, or platform-builder use cases, the actor scales without API gatekeeping.

### What's the cost for typical restaurant research?

$0.008/record FREE tier. A 100-restaurant city-research batch with detail data = $0.80. Daily monitoring of 50 restaurants in a city for rating drift = $0.40/day = $12/month. Quarterly comprehensive city-restaurant research (1000 restaurants × 50 reviews each) = $400/quarter at FREE tier.

Run the [Yelp Scraper on Apify Store](https://apify.com/thirdwatch/yelp-scraper) — pay-per-record, free to try, no credit card to test.
