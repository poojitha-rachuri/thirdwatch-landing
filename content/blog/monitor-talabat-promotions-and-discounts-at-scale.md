---
title: "Monitor Talabat Promotions and Discounts at Scale (2026)"
slug: "monitor-talabat-promotions-and-discounts-at-scale"
description: "Detect every menu discount across 9 MENA countries at $0.002 per restaurant with Thirdwatch's Talabat Scraper. old_price diff + alerting recipes."
actor: "talabat-scraper"
actor_url: "https://apify.com/thirdwatch/talabat-scraper"
actorTitle: "Talabat Scraper"
category: "food"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-talabat-restaurant-menus-for-price-monitoring"
  - "build-food-delivery-price-comparison-with-talabat"
  - "extract-talabat-cuisines-and-ratings-for-market-research"
keywords:
  - "talabat promotions tracker"
  - "discount monitoring food delivery MENA"
  - "old_price discount detection"
  - "competitor promotion tracking"
faqs:
  - q: "How does Talabat surface a discount in the menu data?"
    a: "Every menu item has a price field (the live selling price) and an old_price field that's populated only when the item is on promotion. old_price is the pre-discount reference price, so a non-null old_price greater than price means an active discount. Discount magnitude is (old_price - price) / old_price."
  - q: "What's the typical discount level worth alerting on?"
    a: "Anything above 30% off is uncommon enough to be worth a real-time alert. 15-30% is steady-state promotional behaviour for most chains and probably noise. Below 15% is often franchise-level pricing variation rather than a true promotion. Tune per category — coffee chains rarely discount above 20%, while pizza chains routinely run 50% deals."
  - q: "How often should I refresh to catch limited-time offers?"
    a: "Hourly is the right cadence for real-time competitor-promotion alerting; daily is fine for general trend tracking. Talabat changes prices throughout the day for some chains, especially on Friday and weekends, so a 24-hour cadence misses 30-50% of intra-day promotions. The actor's pure-HTTP architecture makes hourly affordable."
  - q: "Can I detect new promotional items, not just price changes on existing items?"
    a: "Yes. Compare each run's menu items against the previous run by item name within each restaurant. Net-new items often correlate with promotional launches — limited-time offerings are typically added with old_price already populated. Track both new-with-discount and existing-now-discounted as separate alert classes."
  - q: "Does the actor track promotion duration so I can see how long a deal runs?"
    a: "Indirectly. Schedule the actor every hour and persist each snapshot; the timestamp at which old_price first appears and the timestamp it disappears bracket the promotion window. Most restaurant-led promotions last 24-72 hours; aggregator-led campaigns can last 1-2 weeks. The data is in your time series, the analysis is downstream."
  - q: "How do competitors usually respond to a sustained discount campaign?"
    a: "Within 48-72 hours, most direct competitors in the same cuisine and area drop their own prices on flagship items by a similar magnitude. Tracking response time per category is itself useful intelligence — a chain that doesn't respond is either holding margin discipline or losing share. This pattern is most visible during Ramadan, summer slowdowns, and pre-Eid periods."
---

> Thirdwatch's [Talabat Scraper](https://apify.com/thirdwatch/talabat-scraper) detects every menu-level discount across all nine Talabat markets at $0.002 per restaurant by surfacing `old_price` on every menu item — populated only when the item is on promotion. Built for chain ops, competitive intelligence, and growth teams who need real-time alerts on competitor discounting without scraping web pages by hand or paying for a bespoke pricing-intel platform.

## Why monitor Talabat promotions at scale

Discount activity is competitive intelligence. A chain that drops 35% off its flagship pizza for a weekend is either testing demand elasticity, defending share against a new entrant, or running a clearance on an over-ordered ingredient — all of those matter to neighbouring chains. According to [Talabat's 2024 quarterly business signals](https://www.talabat.com/), promotional activity drives more than 40% of orders during peak periods like Ramadan, which means a single high-profile discount campaign can shift order share by double-digit percentages within a week.

The job-to-be-done is concrete: detect every active discount on a watchlist of competitor restaurants in real time, classify by magnitude, alert when discounts cross a threshold. Manual menu checks scale to maybe ten restaurants per analyst per day; a 200-chain regional intelligence operation needs automation. The Talabat Scraper handles this at the data layer because every menu item carries `old_price` whenever a discount is active — the entire detection logic reduces to filtering on `old_price > price`.

## How does this compare to the alternatives?

Three options for tracking food-delivery promotional activity:

| Approach | Cost per 1,000 restaurants × 24 hourly snapshots | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual analyst monitoring | Effectively unbounded | Low (misses 70% of promotions) | Continuous | Doesn't scale |
| Bespoke promo-intel SaaS (Wiser, Intelligence Node) | $40K–$120K/year flat | Vendor-dependent | Weeks to onboard | Vendor lock-in |
| Thirdwatch Talabat Scraper × hourly | $48 ($0.002 × 1,000 × 24) per day | Production-tested | Half a day | Thirdwatch tracks Talabat changes |

Hourly snapshots of 1,000 restaurants cost roughly $1,400 a month at FREE pricing or $700 at GOLD. The [Talabat Scraper actor page](/scrapers/talabat-scraper) documents every output field, but for promotion monitoring the only fields that matter are `slug`, `country`, `menu_items[].name`, `menu_items[].price`, and `menu_items[].old_price`. Everything else is overhead the actor returns for free.

## How to monitor Talabat promotions in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull menus for a watchlist hourly?

Pass restaurant slugs directly via `restaurantSlugs` (skip search for speed) and enable `scrapeMenu`. For a 200-chain hourly run, 200 × $0.002 = $0.40 per snapshot.

```python
import os, requests, json, datetime, pathlib

ACTOR = "thirdwatch~talabat-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

watchlist = ["pizza-hut", "mcdonalds", "kfc", "papa-johns", "dominos",
             "burger-king", "starbucks", "subway"]  # extend per market

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "restaurantSlugs": watchlist,
        "country": "uae",
        "scrapeMenu": True,
    },
    timeout=600,
)
restaurants = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d-%H")
pathlib.Path(f"snapshots/uae-{ts}.json").write_text(json.dumps(restaurants))
print(f"{ts}: saved {len(restaurants)} restaurants, "
      f"{sum(len(r.get('menu_items', [])) for r in restaurants)} menu items")
```

### Step 3: How do I detect active discounts and compute magnitude?

Filter every menu item for non-null `old_price` greater than `price`. Compute the discount percentage and threshold-filter.

```python
import pandas as pd

rows = []
for r in restaurants:
    for item in r.get("menu_items", []):
        if item.get("old_price") and item["old_price"] > item["price"]:
            rows.append({
                "country": r["country"],
                "chain": r["slug"],
                "item": item["name"],
                "category": item.get("category"),
                "price": item["price"],
                "old_price": item["old_price"],
                "discount_pct": (item["old_price"] - item["price"]) / item["old_price"],
                "scraped_at": r["scraped_at"],
            })
df = pd.DataFrame(rows)
hot = df[df.discount_pct >= 0.30].sort_values("discount_pct", ascending=False)
print(hot[["chain", "item", "old_price", "price", "discount_pct"]].head(20))
```

A 30%+ threshold typically returns a few dozen items per snapshot per market — manageable to scan, high enough signal-to-noise.

### Step 4: How do I alert only on net-new promotions?

Maintain a running set of `(country, chain, item)` tuples currently on promotion. Diff against the previous snapshot and forward only the additions:

```python
import pickle, pathlib, requests

prev_path = pathlib.Path("active-promos.pkl")
prev = pickle.loads(prev_path.read_bytes()) if prev_path.exists() else set()

current = {(r["country"], r["chain"], r["item"]): r["discount_pct"] for r in df.to_dict("records")}
new_promos = {k: v for k, v in current.items() if k not in prev and v >= 0.30}

for (country, chain, item), pct in new_promos.items():
    requests.post(
        "https://hooks.slack.com/services/.../...",
        json={"text": f":fire: *{chain}* ({country}): *{item}* now {int(pct*100)}% off"},
    )

prev_path.write_bytes(pickle.dumps(set(current)))
print(f"{len(new_promos)} new promos forwarded")
```

Wired to Apify's [scheduler](https://docs.apify.com/platform/schedules) at `0 * * * *` (every hour), this loop is fully self-maintaining.

## Sample output

A single restaurant snapshot with discount-relevant fields highlighted. `old_price: 59.0` on a `price: 49.0` item is the canonical signal — about 17% off in this case.

```json
{
  "name": "Pizza Hut",
  "slug": "pizza-hut",
  "country": "uae",
  "menu_items": [
    {
      "name": "Pepperoni Pizza (Large)",
      "price": 49.0,
      "old_price": 59.0,
      "category": "Pizzas",
      "image": "https://images.deliveryhero.io/.../pepperoni-large.jpg"
    },
    {
      "name": "Veggie Supreme Pizza (Large)",
      "price": 45.0,
      "old_price": null,
      "category": "Pizzas"
    }
  ],
  "scraped_at": "2026-04-27T08:14:22.000000+00:00"
}
```

The two-item example shows the core pattern: one item is on promotion (old_price populated), the other is at steady-state pricing (old_price null). A pipeline filtering on `old_price IS NOT NULL` cleanly partitions the catalog into promotional and non-promotional inventory.

## Common pitfalls

Three things break promotion-monitoring pipelines. **Stale promotion residue** — Talabat occasionally leaves `old_price` populated briefly after a promotion ends; cross-validate by requiring the same item to show the same `old_price` across two consecutive snapshots before alerting, to avoid stale-data false positives. **Cross-currency confusion** — discount percentage is currency-invariant and safe to compare across markets, but absolute discount value is not; always alert in percentage terms unless your downstream consumer needs the local-currency amount. **Item-name drift across snapshots** — Talabat occasionally renames items mid-promotion (e.g. "Pepperoni Pizza Large" → "Pepperoni Pizza (Large)"); use a fuzzy match or category-and-image-hash join when detecting "same item" across snapshots.

Thirdwatch's actor returns `image` URLs on every menu item, which makes image-hash a reliable fallback identity when item names drift. The actor's pure-HTTP architecture means hourly snapshots scale linearly without proxy budget pain — running a 24-hour history across all nine MENA countries simultaneously costs under $5 a day. A fourth issue worth highlighting: aggregator-side promotions (Talabat-funded discounts on top of restaurant pricing) sometimes show up with `old_price` populated even when the underlying restaurant didn't change its price; treat aggregator-promo and restaurant-promo as distinct event classes when the discount is uniform across many chains in the same hour.

## Related use cases

- [Scrape Talabat restaurant menus for price monitoring](/blog/scrape-talabat-restaurant-menus-for-price-monitoring)
- [Build a food delivery price comparison with Talabat](/blog/build-food-delivery-price-comparison-with-talabat)
- [Extract Talabat cuisines and ratings for MENA market research](/blog/extract-talabat-cuisines-and-ratings-for-market-research)
- [The complete guide to scraping food delivery platforms](/blog/guide-scraping-food-delivery)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How does Talabat surface a discount in the menu data?

Every menu item has a `price` field (the live selling price) and an `old_price` field that's populated only when the item is on promotion. `old_price` is the pre-discount reference price, so a non-null `old_price` greater than `price` means an active discount. Discount magnitude is `(old_price - price) / old_price`.

### What's the typical discount level worth alerting on?

Anything above 30% off is uncommon enough to be worth a real-time alert. 15-30% is steady-state promotional behaviour for most chains and probably noise. Below 15% is often franchise-level pricing variation rather than a true promotion. Tune per category — coffee chains rarely discount above 20%, while pizza chains routinely run 50% deals.

### How often should I refresh to catch limited-time offers?

Hourly is the right cadence for real-time competitor-promotion alerting; daily is fine for general trend tracking. Talabat changes prices throughout the day for some chains, especially on Friday and weekends, so a 24-hour cadence misses 30-50% of intra-day promotions. The actor's pure-HTTP architecture makes hourly affordable.

### Can I detect new promotional items, not just price changes on existing items?

Yes. Compare each run's menu items against the previous run by item name within each restaurant. Net-new items often correlate with promotional launches — limited-time offerings are typically added with `old_price` already populated. Track both new-with-discount and existing-now-discounted as separate alert classes.

### Does the actor track promotion duration so I can see how long a deal runs?

Indirectly. Schedule the actor every hour and persist each snapshot; the timestamp at which `old_price` first appears and the timestamp it disappears bracket the promotion window. Most restaurant-led promotions last 24-72 hours; aggregator-led campaigns can last 1-2 weeks. The data is in your time series, the analysis is downstream.

### How do competitors usually respond to a sustained discount campaign?

Within 48-72 hours, most direct competitors in the same cuisine and area drop their own prices on flagship items by a similar magnitude. Tracking response time per category is itself useful intelligence — a chain that doesn't respond is either holding margin discipline or losing share. This pattern is most visible during Ramadan, summer slowdowns, and pre-Eid periods.

Run the [Talabat Scraper on Apify Store](https://apify.com/thirdwatch/talabat-scraper) — pay-per-restaurant, free to try, no credit card to test.
