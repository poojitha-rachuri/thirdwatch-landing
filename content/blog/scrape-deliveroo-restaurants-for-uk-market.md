---
title: "Scrape Deliveroo Restaurants for UK Market (2026)"
slug: "scrape-deliveroo-restaurants-for-uk-market"
description: "Pull Deliveroo restaurants + menus at $0.008 per record using Thirdwatch. UK + UAE + EU coverage + price monitoring + recipes for hospitality teams."
actor: "deliveroo-scraper"
actor_url: "https://apify.com/thirdwatch/deliveroo-scraper"
actorTitle: "Deliveroo Scraper"
category: "food"
audience: "operators"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "monitor-deliveroo-pricing-across-uk-cities"
  - "build-uae-food-delivery-research-with-deliveroo"
  - "scrape-talabat-restaurant-menus-for-price-monitoring"
keywords:
  - "deliveroo scraper"
  - "uk food delivery data"
  - "deliveroo menu scraper"
  - "uk hospitality research"
faqs:
  - q: "Why scrape Deliveroo for UK market research?"
    a: "Deliveroo dominates UK food delivery alongside Uber Eats and Just Eat — the platform processes 300M+ orders annually across 150K+ restaurant partners. According to Deliveroo's 2024 report, the platform has 30%+ UK market share. For UK hospitality competitive research, restaurant-aggregator products, and food-delivery investment analysis, Deliveroo is essential coverage. Strong UAE presence too (Dubai, Abu Dhabi alongside Talabat)."
  - q: "What data does the actor return?"
    a: "Per restaurant: name, slug, rating (4.6-4.9 typical), delivery time, delivery fee, promotions, slug, URL, lat/lng (when available), category. Per restaurant menu (when fetched): 40-116 menu items with prices, descriptions, categories. Comprehensive coverage of active UK + EU + UAE restaurants."
  - q: "How does Deliveroo handle anti-bot defenses?"
    a: "Deliveroo uses Cloudflare + PerimeterX. Thirdwatch's actor uses Camoufox stealth-browser + residential proxy. Production-tested at 90-95% success rate. Restaurants load via GraphQL XHR (`api.deliveroo.com/consumer/graphql/`) after page render — Camoufox is essential for capturing the rendered restaurant data."
  - q: "How does Deliveroo geographic input work?"
    a: "Two patterns: (1) UK + EU — area-based URLs (`deliveroo.co.uk/restaurants/london/soho`); (2) UAE + other — address autocomplete (input lat/lng or Google Maps URL). UAE has no area-based URLs; Deliveroo redirects through address-autocomplete to a geohash-based listing page. Both modes return the same restaurant + menu data structure."
  - q: "Can I track per-restaurant pricing over time?"
    a: "Yes. Persist daily snapshots of (restaurant_slug, menu_item, price) tuples + compute cross-snapshot deltas. Deliveroo restaurants change pricing weekly during promotional windows (lunch deals, dinner specials). For UK competitive research, daily snapshots produce stable price-trajectory data."
  - q: "How does this compare to first-party UK delivery analytics?"
    a: "Deliveroo's first-party Restaurant Hub is owned-restaurant-only (no competitor data). UK food-delivery research SaaS (Lumina Intelligence, NPD Group) bundles cross-platform delivery data at $50K-$200K/year. The actor delivers raw competitor-coverage at $0.008/record without partnership gatekeeping. For UK hospitality competitive research, this is materially cheaper than analyst-firm subscriptions."
---

> Thirdwatch's [Deliveroo Scraper](https://apify.com/thirdwatch/deliveroo-scraper) returns restaurants + menus at $0.008 per record — name, rating, delivery time, fee, promotions, menu items with prices. Built for UK hospitality competitive research, restaurant-aggregator products, food-delivery analysts, and UAE/EU food-research workflows.

## Why scrape Deliveroo for UK market research

Deliveroo dominates UK food delivery. According to [Deliveroo's 2024 Annual report](https://corporate.deliveroo.co.uk/), the platform serves 30%+ UK market share alongside Uber Eats + Just Eat with 150K+ restaurant partners across UK, EU, and UAE markets. For UK hospitality competitive research, restaurant-aggregator builders, and food-delivery analysts, Deliveroo data is essential.

The job-to-be-done is structured. A UK restaurant-operator monitors competitor pricing + promotions across London neighborhoods weekly. A food-delivery analyst tracks per-platform restaurant assortment + pricing differences for UK market reports. A UAE hospitality consultancy researches Deliveroo + Talabat overlap in Dubai for client briefings. A travel-tech aggregator startup ingests UK restaurant data for marketplace seeding. All reduce to area + city queries + per-restaurant detail aggregation.

## How does this compare to the alternatives?

Three options for Deliveroo data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Lumina Intelligence (UK delivery research) | $50K–$200K/year | Authoritative cross-platform | Days | Annual contract |
| Deliveroo Restaurant Hub | Free (owned restaurants only) | Limited to your business | Hours | Per-restaurant license |
| Thirdwatch Deliveroo Scraper | $80 ($0.008 × 10K) | Camoufox + residential proxy | 5 minutes | Thirdwatch tracks Deliveroo changes |

UK food-delivery research SaaS bundles cross-platform data at the high end. Deliveroo's first-party Restaurant Hub is owned-restaurant-only. The [Deliveroo Scraper actor page](/scrapers/deliveroo-scraper) gives you cross-restaurant competitor data at the lowest unit cost.

## How to scrape Deliveroo in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull UK area restaurants?

Pass area-based URLs.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~deliveroo-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

UK_AREAS = [
    "https://deliveroo.co.uk/restaurants/london/soho",
    "https://deliveroo.co.uk/restaurants/london/shoreditch",
    "https://deliveroo.co.uk/restaurants/london/notting-hill",
    "https://deliveroo.co.uk/restaurants/manchester/city-centre",
    "https://deliveroo.co.uk/restaurants/birmingham/city-centre",
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"areaUrls": UK_AREAS, "maxResults": 100},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} restaurants across {len(UK_AREAS)} UK areas")
```

5 areas × 100 restaurants = up to 500 records, costing $4.

### Step 3: How do I pull UAE restaurants via address?

UAE requires address-autocomplete since no area URLs exist.

```python
UAE_ADDRESSES = [
    "https://www.google.com/maps/place/Dubai+Marina,+Dubai",
    "https://www.google.com/maps/place/Downtown+Dubai",
    "https://www.google.com/maps/place/Abu+Dhabi+Corniche",
]

resp_uae = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"locationUrls": UAE_ADDRESSES, "maxResults": 100},
    timeout=900,
)
df_uae = pd.DataFrame(resp_uae.json())
print(f"{len(df_uae)} UAE restaurants")
```

UAE returns ~40-100 restaurants per address (geohash-based). Combined UK + UAE pull = 800-1000 restaurants.

### Step 4: How do I extract menus + track price drift?

Pass restaurant slugs to fetch full menus.

```python
import datetime, pathlib, json

QUALITY = df[df.rating >= 4.5].head(50)

menu_resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"restaurantSlugs": QUALITY.slug.tolist(),
          "fetchMenus": True},
    timeout=1800,
)
menus = pd.DataFrame(menu_resp.json())
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
out = pathlib.Path(f"snapshots/deliveroo-menus-{ts}.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(menus.to_json(orient="records"))
print(f"Persisted {len(menus)} menu items")
```

50 restaurants × ~70 menu items = 3,500 menu records. Daily snapshot enables price-drift detection across the watchlist.

## Sample output

A single Deliveroo restaurant record looks like this. Five rows weigh ~5 KB.

```json
{
  "name": "Dishoom Shoreditch",
  "slug": "dishoom-shoreditch-london",
  "rating": 4.8,
  "delivery_time": "25-40 min",
  "delivery_fee": "£2.49",
  "promo_text": "20% off when you spend £25",
  "category": "Indian, Asian",
  "url": "https://deliveroo.co.uk/menu/london/shoreditch/dishoom-shoreditch-london",
  "is_top_rated": true,
  "is_discounted": true,
  "image_url": "https://rs-menus-api.deliveroo.com/..."
}
```

`slug` is the canonical natural key. `is_top_rated` (Deliveroo's algorithm-promoted flag) and `is_discounted` (promo-active flag) enable filtering for premium-tier or deal-tier cohorts.

## Common pitfalls

Three things go wrong in Deliveroo pipelines. **CSS-class hashing** — Deliveroo uses CSS-module hashed classes (`css-XXXXX`) so DOM scraping must use structural patterns rather than class-based selectors. **Image-as-background-CSS** — restaurant images load as CSS `background-image` rather than `<img>` tags; extract via computed-style rather than DOM-image-query. **wait_until="commit"** — Deliveroo's `domcontentloaded` event never fires reliably; the actor uses `wait_until="commit"` instead.

Thirdwatch's actor uses Camoufox + residential proxy at $3/1K, ~62% margin. Pair Deliveroo with [Talabat Scraper](https://apify.com/thirdwatch/talabat-scraper) for UAE/MENA cross-platform research and [Noon Food Scraper](https://apify.com/thirdwatch/noon-food-scraper) for additional UAE depth. A fourth subtle issue worth flagging: Deliveroo's `is_top_rated` flag is dynamic — restaurants gain/lose this badge based on rolling 30-day rating + delivery-on-time + completion-rate metrics. For accurate competitive research, snapshot the flag weekly + treat status changes as leading indicators of operational shifts. A fifth pattern unique to UK food delivery: Deliveroo Plus (subscription tier) members see different delivery fees + promotions than non-members. The actor's scraped data represents the non-member view; for true effective-pricing research, factor in typical 30-40% Plus penetration in major UK cities. A sixth and final pitfall: Deliveroo's UAE coverage is concentrated in Dubai + Abu Dhabi metros — Sharjah, Ajman, RAK have minimal coverage. For UAE-wide hospitality research, supplement with Talabat (which covers all 7 emirates).

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. Restaurant data changes slowly (rating, hours, menu) — daily polling is sufficient even for active monitoring. Tier the watchlist into Tier 1 (active competitors, daily), Tier 2 (broad market research, weekly), Tier 3 (long-tail discovery, monthly). Typical 60-80% cost reduction with negligible signal loss.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful for menu-trend analysis as your category-classifier evolves. Compress with gzip at write-time (4-8x size reduction).

Schema validation. Run a daily validation suite that asserts each scraper returns expected core fields with non-null rates above 80% (required) and 50% (optional). Deliveroo schema changes occasionally during platform UI revisions — catch drift early before downstream consumers degrade silently.  A seventh and final operational pattern unique to this scraper at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, ownership-transfers, status-changes. These structural changes precede or follow material events (acquisitions, rebrands, regulatory issues, leadership departures) and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, for each scrape, persist (field, old_value, new_value) tuples. Surface high-leverage diffs (name changes, category re-classifications, headcount shifts >10%) to human reviewers; low-leverage diffs (single-record additions, minor count updates) stay in the audit log. This pattern catches signal that pure aggregate-trend monitoring misses entirely.  An eighth pattern unique to UK food delivery: cuisine-specific competitive dynamics differ materially across UK cities — London restaurants compete on cuisine breadth and chef-name recognition, while Manchester + Birmingham compete more on price-point + delivery-speed. For accurate per-city competitive research, segment cuisines by metro-tier and apply different ranking weights (price-weight 30% in Tier 1 metros vs 50% in Tier 2). A ninth and final flag for ramen + sushi + niche-cuisine research: Deliveroo's category tagging often groups niche cuisines under broader "Asian" or "Japanese" tags, missing precise sub-cuisine signals. For high-fidelity cuisine research, supplement with description-keyword matching against menu items rather than relying solely on Deliveroo's category tags.

## Related use cases

- [Monitor Deliveroo pricing across UK cities](/blog/monitor-deliveroo-pricing-across-uk-cities)
- [Build UAE food delivery research with Deliveroo](/blog/build-uae-food-delivery-research-with-deliveroo)
- [Scrape Talabat restaurant menus for price monitoring](/blog/scrape-talabat-restaurant-menus-for-price-monitoring)
- [The complete guide to scraping food delivery](/blog/guide-scraping-food-delivery)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape Deliveroo for UK market research?

Deliveroo dominates UK food delivery alongside Uber Eats and Just Eat — the platform processes 300M+ orders annually across 150K+ restaurant partners. According to Deliveroo's 2024 report, the platform has 30%+ UK market share. For UK hospitality competitive research, restaurant-aggregator products, and food-delivery investment analysis, Deliveroo is essential coverage. Strong UAE presence too (Dubai, Abu Dhabi alongside Talabat).

### What data does the actor return?

Per restaurant: name, slug, rating (4.6-4.9 typical), delivery time, delivery fee, promotions, slug, URL, lat/lng (when available), category. Per restaurant menu (when fetched): 40-116 menu items with prices, descriptions, categories. Comprehensive coverage of active UK + EU + UAE restaurants.

### How does Deliveroo handle anti-bot defenses?

Deliveroo uses Cloudflare + PerimeterX. Thirdwatch's actor uses Camoufox stealth-browser + residential proxy. Production-tested at 90-95% success rate. Restaurants load via GraphQL XHR (`api.deliveroo.com/consumer/graphql/`) after page render — Camoufox is essential for capturing the rendered restaurant data.

### How does Deliveroo geographic input work?

Two patterns: (1) UK + EU — area-based URLs (`deliveroo.co.uk/restaurants/london/soho`); (2) UAE + other — address autocomplete (input lat/lng or Google Maps URL). UAE has no area-based URLs; Deliveroo redirects through address-autocomplete to a geohash-based listing page. Both modes return the same restaurant + menu data structure.

### Can I track per-restaurant pricing over time?

Yes. Persist daily snapshots of `(restaurant_slug, menu_item, price)` tuples + compute cross-snapshot deltas. Deliveroo restaurants change pricing weekly during promotional windows (lunch deals, dinner specials). For UK competitive research, daily snapshots produce stable price-trajectory data.

### How does this compare to first-party UK delivery analytics?

Deliveroo's first-party Restaurant Hub is owned-restaurant-only (no competitor data). UK food-delivery research SaaS ([Lumina Intelligence](https://www.lumina-intelligence.com/), NPD Group) bundles cross-platform delivery data at $50K-$200K/year. The actor delivers raw competitor-coverage at $0.008/record without partnership gatekeeping. For UK hospitality competitive research, this is materially cheaper than analyst-firm subscriptions.

Run the [Deliveroo Scraper on Apify Store](https://apify.com/thirdwatch/deliveroo-scraper) — pay-per-record, free to try, no credit card to test.
