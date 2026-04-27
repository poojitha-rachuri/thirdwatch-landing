---
title: "Scrape Swiggy Restaurants for India Research (2026)"
slug: "scrape-swiggy-restaurants-for-india-research"
description: "Pull Swiggy India restaurants + menus at $0.005 per record using Thirdwatch. City coverage + cuisine research + recipes for India hospitality teams."
actor: "swiggy-scraper"
actor_url: "https://apify.com/thirdwatch/swiggy-scraper"
actorTitle: "Swiggy Scraper"
category: "food"
audience: "operators"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "monitor-swiggy-vs-zomato-india-pricing"
  - "build-india-food-delivery-coverage-with-swiggy"
  - "scrape-talabat-restaurant-menus-for-price-monitoring"
keywords:
  - "swiggy scraper"
  - "india food delivery data"
  - "swiggy menu scraper"
  - "india hospitality research"
faqs:
  - q: "Why scrape Swiggy for India research?"
    a: "Swiggy dominates India food delivery alongside Zomato — duopoly accounting for 90%+ of organized India food-delivery market. According to Swiggy's 2024 IPO filings, the platform processes 200M+ orders annually across 250K+ restaurant partners in 580+ cities. For India hospitality competitive research, restaurant-aggregator products, and India food-tech investment analysis, Swiggy data is essential."
  - q: "What data does the actor return?"
    a: "Per restaurant: name, cuisine list, rating (3.8-4.7 typical), delivery time, cost-for-two, lat/lng, address, restaurant ID, image. Per menu (when fetched): items grouped by category with prices, descriptions, veg/non-veg flags. Comprehensive coverage of active Swiggy restaurants across 580+ Indian cities."
  - q: "How does the actor handle anti-bot defenses?"
    a: "Swiggy uses Akamai + cookie-based session-tracking. Thirdwatch's actor uses lat/lng-based queries (Swiggy's homepage requires location input). For multi-city scraping, pass lat/lng tuples per target city. Sustained polling rate: 100 restaurants per minute per proxy IP."
  - q: "How does Swiggy compare to Zomato for India?"
    a: "Swiggy and Zomato have meaningful overlap (~70% of restaurants present on both) but each has unique restaurant assortments. Swiggy skews slightly toward Tier 2/3 cities (better non-metro coverage). Zomato has stronger metro + dine-in restaurant assortment. For comprehensive India food-delivery research, run both — typically 20-30% non-overlap."
  - q: "How fresh do Swiggy snapshots need to be?"
    a: "For active restaurant-operator competitive monitoring, daily cadence captures pricing + promotion changes. For weekly market-research reporting, weekly cadence is sufficient. For longitudinal India food-tech research, monthly snapshots produce stable trend data. During festival seasons (Diwali, IPL), daily cadence catches rapid promotional cycles."
  - q: "How does this compare to first-party Swiggy analytics?"
    a: "Swiggy Partner Dashboard is owned-restaurant-only. India food-research SaaS (Crisil Research, RedSeer) bundles cross-platform delivery data at $20K-$100K/year. The actor delivers raw competitor data at $0.005/record without partnership gatekeeping. For India hospitality competitive research, this is materially cheaper than analyst-firm subscriptions."
---

> Thirdwatch's [Swiggy Scraper](https://apify.com/thirdwatch/swiggy-scraper) returns India restaurant + menu data at $0.005 per record — name, cuisine, rating, delivery time, cost-for-two, location, menu items with prices. Built for India hospitality competitive research, restaurant-aggregator products, food-delivery investment analysts, and India food-tech research.

## Why scrape Swiggy for India research

Swiggy dominates India food delivery. According to [Swiggy's 2024 IPO filings](https://www.sebi.gov.in/), the platform processes 200M+ orders annually across 250K+ restaurant partners in 580+ Indian cities — alongside Zomato, the duopoly accounts for 90%+ of organized India food-delivery market. For India hospitality competitive research, restaurant-aggregator builders, and India food-tech investment analysis, Swiggy data is essential.

The job-to-be-done is structured. An India restaurant-operator monitors competitor pricing + promotions across Bangalore neighborhoods weekly. A food-delivery analyst tracks per-platform restaurant assortment + pricing differences for India market reports. An India hospitality consultancy researches Swiggy + Zomato overlap in metros for client briefings. A food-tech investor studies per-platform GMV-leading-indicators (restaurant velocity, cost-for-two trends). All reduce to city + lat/lng queries + per-restaurant detail aggregation.

## How does this compare to the alternatives?

Three options for Swiggy data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| RedSeer / Crisil Research (India) | $20K–$100K/year | Authoritative | Days | Annual contract |
| Swiggy Partner Dashboard | Free (owned restaurants only) | Limited to your business | Hours | Per-restaurant license |
| Thirdwatch Swiggy Scraper | $50 ($0.005 × 10K) | HTTP + lat/lng queries | 5 minutes | Thirdwatch tracks Swiggy changes |

India food-research SaaS bundles cross-platform data at the high end. The [Swiggy Scraper actor page](/scrapers/swiggy-scraper) gives you cross-restaurant competitor data at the lowest unit cost.

## How to scrape Swiggy in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull restaurants by city?

Pass lat/lng tuples per target city.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~swiggy-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

INDIA_LOCATIONS = [
    {"city": "Bangalore - Indiranagar", "lat": 12.9716, "lng": 77.6411},
    {"city": "Bangalore - Koramangala", "lat": 12.9352, "lng": 77.6245},
    {"city": "Mumbai - Bandra", "lat": 19.0596, "lng": 72.8295},
    {"city": "Delhi - Connaught Place", "lat": 28.6315, "lng": 77.2167},
    {"city": "Hyderabad - Banjara Hills", "lat": 17.4239, "lng": 78.4738},
    {"city": "Pune - Koregaon Park", "lat": 18.5362, "lng": 73.8939},
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"locations": INDIA_LOCATIONS, "maxResults": 100},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} restaurants across {df.city.nunique()} city neighborhoods")
```

6 neighborhoods × 100 restaurants = up to 600 records, costing $3.

### Step 3: How do I filter by quality + cuisine?

Filter to top-rated, well-trafficked restaurants per cuisine.

```python
df["rating"] = pd.to_numeric(df.rating, errors="coerce")
df["cost_for_two"] = pd.to_numeric(
    df.cost_for_two.astype(str).str.replace(r"[₹,]", "", regex=True),
    errors="coerce"
)
df["primary_cuisine"] = df.cuisines.str.split(",").str[0].str.strip()

quality = df[
    (df.rating >= 4.2)
    & (df.rating_count >= 1000)  # 1K+ Swiggy ratings = trafficked
    & df.cost_for_two.between(200, 800)  # mid-market price band
]

per_cuisine = quality.groupby("primary_cuisine").agg(
    restaurant_count=("name", "count"),
    median_rating=("rating", "median"),
    median_cost=("cost_for_two", "median"),
).sort_values("restaurant_count", ascending=False)
print(per_cuisine.head(15))
```

Per-cuisine restaurant density × rating × cost-for-two reveals city-level cuisine-mix patterns useful for hospitality investment + restaurant-launch research.

### Step 4: How do I extract menus + track pricing?

Pull per-restaurant menu data.

```python
import datetime, pathlib, json

QUALITY_RIDS = quality.head(50).restaurant_id.tolist()

menu_resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"restaurantIds": QUALITY_RIDS, "fetchMenus": True},
    timeout=1800,
)
menus = pd.DataFrame(menu_resp.json())
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
out = pathlib.Path(f"snapshots/swiggy-menus-{ts}.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(menus.to_json(orient="records"))
print(f"Persisted {len(menus)} menu items across {QUALITY_RIDS} restaurants")
```

Daily snapshots build per-restaurant pricing trajectories useful for promotional-pattern research.

## Sample output

A single Swiggy restaurant record looks like this. Five rows weigh ~6 KB.

```json
{
  "restaurant_id": "12345",
  "name": "Truffles - Indiranagar",
  "cuisines": "Continental, American, Burgers",
  "rating": 4.4,
  "rating_count": 18450,
  "delivery_time": "30-35 min",
  "cost_for_two": "₹600",
  "address": "100 Feet Road, Indiranagar, Bangalore",
  "lat": 12.9716,
  "lng": 77.6411,
  "image_url": "https://media-assets.swiggy.com/...",
  "is_pure_veg": false,
  "discount": "20% off up to ₹100"
}
```

`restaurant_id` is the canonical natural key. `cost_for_two` (in INR) is India's canonical price-per-meal metric. `rating_count` (number of users who rated) reveals traffic — restaurants with 10K+ ratings are high-volume operators.

## Common pitfalls

Three things go wrong in Swiggy pipelines. **Lat/lng granularity** — Swiggy uses delivery-radius-based filtering; same lat/lng with 1km offset can return materially different restaurant sets. For comprehensive city coverage, use multiple lat/lng anchors per neighborhood (3-5 anchors per major area). **Veg/Non-Veg filter** — `is_pure_veg` flag matters for India consumer-research; pure-veg restaurants have systematically different pricing + cuisine patterns than non-veg-inclusive restaurants. **Promotional-pricing volatility** — discounts change every 4-8 hours during peak periods (lunch, dinner, weekend); for accurate base-pricing research, snapshot at consistent times of day rather than mixing peak/off-peak data.

Thirdwatch's actor uses HTTP + lat/lng-based queries at $0.005/result. Pair Swiggy with [Talabat Scraper](https://apify.com/thirdwatch/talabat-scraper) for cross-region food-delivery research. A fourth subtle issue worth flagging: Swiggy's rating values are visible to 1 decimal (4.4 vs 4.5) but underlying ratings are typically computed to 2-3 decimals; rating "ties" at 4.4 may differ at 4.42 vs 4.48 — for high-precision rankings, supplement with rating_count weighting. A fifth pattern unique to India food delivery: festival days (Diwali, Holi, IPL match days) cause 3-5x order-volume spikes with sustained promotional pricing for 24-48 hours; for accurate base-rate research, exclude festival windows from longitudinal analysis or compute separate festival-specific aggregates. A sixth and final pitfall: Swiggy's `cost_for_two` is editorial-set by restaurant onboarding, not auto-computed from menu prices — actual per-meal cost often exceeds cost_for_two by 20-40% in practice. For accurate per-meal-cost research, supplement with menu-data extraction + median-item-price calculations.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. Restaurant data changes slowly (rating, hours) — daily polling is sufficient. Tier the watchlist into Tier 1 (active competitors, daily), Tier 2 (broad market research, weekly), Tier 3 (long-tail discovery, monthly). 60-80% cost reduction with negligible signal loss.

Snapshot raw payloads alongside derived fields. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful for menu-trend analysis as your category-classifier evolves. Compress with gzip at write-time (4-8x size reduction).

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Swiggy schema changes during platform UI revisions — catch drift early.  A seventh and final operational pattern unique to this scraper at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, ownership-transfers, status-changes. These structural changes precede or follow material events (acquisitions, rebrands, regulatory issues, leadership departures) and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, for each scrape, persist (field, old_value, new_value) tuples. Surface high-leverage diffs (name changes, category re-classifications, headcount shifts >10%) to human reviewers; low-leverage diffs (single-record additions, minor count updates) stay in the audit log. This pattern catches signal that pure aggregate-trend monitoring misses entirely.

## Related use cases

- [Monitor Swiggy vs Zomato India pricing](/blog/monitor-swiggy-vs-zomato-india-pricing)
- [Build India food delivery coverage with Swiggy](/blog/build-india-food-delivery-coverage-with-swiggy)
- [Scrape Talabat restaurant menus for price monitoring](/blog/scrape-talabat-restaurant-menus-for-price-monitoring)
- [The complete guide to scraping food delivery](/blog/guide-scraping-food-delivery)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape Swiggy for India research?

Swiggy dominates India food delivery alongside Zomato — duopoly accounting for 90%+ of organized India food-delivery market. According to Swiggy's 2024 IPO filings, the platform processes 200M+ orders annually across 250K+ restaurant partners in 580+ cities. For India hospitality competitive research, restaurant-aggregator products, and India food-tech investment analysis, Swiggy data is essential.

### What data does the actor return?

Per restaurant: name, cuisine list, rating (3.8-4.7 typical), delivery time, cost-for-two, lat/lng, address, restaurant ID, image. Per menu (when fetched): items grouped by category with prices, descriptions, veg/non-veg flags. Comprehensive coverage of active Swiggy restaurants across 580+ Indian cities.

### How does the actor handle anti-bot defenses?

Swiggy uses Akamai + cookie-based session-tracking. Thirdwatch's actor uses lat/lng-based queries (Swiggy's homepage requires location input). For multi-city scraping, pass lat/lng tuples per target city. Sustained polling rate: 100 restaurants per minute per proxy IP.

### How does Swiggy compare to Zomato for India?

Swiggy and Zomato have meaningful overlap (~70% of restaurants present on both) but each has unique restaurant assortments. Swiggy skews slightly toward Tier 2/3 cities (better non-metro coverage). Zomato has stronger metro + dine-in restaurant assortment. For comprehensive India food-delivery research, run both — typically 20-30% non-overlap.

### How fresh do Swiggy snapshots need to be?

For active restaurant-operator competitive monitoring, daily cadence captures pricing + promotion changes. For weekly market-research reporting, weekly cadence is sufficient. For longitudinal India food-tech research, monthly snapshots produce stable trend data. During festival seasons (Diwali, IPL), daily cadence catches rapid promotional cycles.

### How does this compare to first-party Swiggy analytics?

Swiggy Partner Dashboard is owned-restaurant-only. India food-research SaaS ([Crisil Research](https://www.crisilresearch.com/), [RedSeer](https://redseer.com/)) bundles cross-platform delivery data at $20K-$100K/year. The actor delivers raw competitor data at $0.005/record without partnership gatekeeping. For India hospitality competitive research, this is materially cheaper than analyst-firm subscriptions.

Run the [Swiggy Scraper on Apify Store](https://apify.com/thirdwatch/swiggy-scraper) — pay-per-record, free to try, no credit card to test.
