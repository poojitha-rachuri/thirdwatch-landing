---
title: "Track Flipkart vs Amazon India Prices in Real Time (2026)"
slug: "track-flipkart-prices-vs-amazon-india"
description: "Build a cross-marketplace India e-commerce tracker at $0.005 per product using Thirdwatch's Flipkart + Amazon scrapers. Diff alerts and arbitrage recipes inside."
actor: "flipkart-products-scraper"
actor_url: "https://apify.com/thirdwatch/flipkart-products-scraper"
actorTitle: "Flipkart Scraper"
category: "ecommerce"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-flipkart-products-for-india-ecommerce"
  - "build-flipkart-product-research-pipeline"
  - "monitor-flipkart-deals-and-discounts"
keywords:
  - "flipkart vs amazon india"
  - "india ecommerce price comparison"
  - "cross marketplace pricing india"
  - "flipkart amazon arbitrage"
faqs:
  - q: "Why compare Flipkart and Amazon India prices?"
    a: "These two platforms split the Indian e-commerce market roughly 40/30, and they price the same SKUs differently because of different seller bases, fulfilment networks, and promotional cycles. According to RedSeer's 2024 India e-commerce report, the two platforms differ by 5-15% on identical SKUs roughly 30% of the time. For consumer apps, sellers managing dual-marketplace listings, or arbitrage operations, this delta is meaningful."
  - q: "How do I match the same SKU across Flipkart and Amazon?"
    a: "There's no shared identifier between Flipkart and Amazon, so matching requires text-based similarity. Three common approaches: (1) exact-substring match on brand + model name (Samsung Galaxy S24 Ultra 256GB Titanium Gray), (2) fuzzy string matching with Levenshtein distance, (3) image-hash comparison if you fetch product images from both. Most production pipelines use (1) for known SKUs and (2) as a fallback for long-tail products."
  - q: "What's the right cadence for cross-marketplace monitoring?"
    a: "Daily during steady-state, hourly during major sale events (Big Billion Days, Great Indian Festival, Republic Day sales). Both Flipkart and Amazon shift prices intraday during sale windows; missing the window means missing the deal. Steady-state daily snapshots cost roughly $1-$2/day; sale-event hourly bursts cost $25-$50/day for a 100-SKU watchlist."
  - q: "How do I detect arbitrage opportunities?"
    a: "Compute (amazon_price - flipkart_price) per matched SKU pair. A 10%+ price gap with both products in stock and Prime/Flipkart-Plus eligible is a viable arbitrage signal. The arbitrage decays fast — once you start buying from the cheaper marketplace, it usually closes within hours as inventory shifts. Build alerting that fires on first detection, not on sustained gaps."
  - q: "What about authorized vs grey-market sellers?"
    a: "Flipkart and Amazon both host third-party sellers alongside their own retail operations. The cheaper price often comes from a grey-market seller who sourced inventory through unauthorized channels. The actor returns the seller field on Flipkart records — for brand-protection workflows, flag listings where seller is unfamiliar to the brand or where Flipkart shows a non-Flipkart-fulfilled marker. Amazon doesn't expose seller name in search results; for Amazon seller verification, fetch the specific ASIN URL."
  - q: "How does this compare to paid Indian price-tracking SaaS?"
    a: "Indian price-tracking platforms (Pricepe, MySmartPrice, BuyHatke) bundle cross-marketplace tracking with consumer apps and affiliate revenue. Building your own using Flipkart + Amazon Scraper is meaningfully cheaper for systematic operational use; the SaaS option is better when you need consumer-facing tooling as part of a larger product."
---

> Thirdwatch's [Flipkart Scraper](https://apify.com/thirdwatch/flipkart-products-scraper) and [Amazon Product Scraper](https://apify.com/thirdwatch/amazon-product-scraper) feed a structured cross-marketplace India e-commerce tracker — daily snapshot the same SKU watchlist on both platforms, compute price deltas, surface arbitrage opportunities. Built for e-commerce ops teams managing dual-marketplace listings, brand-protection functions tracking grey-market pricing, arbitrage operators, and price-comparison consumer apps.

## Why track Flipkart vs Amazon India prices

India e-commerce is a duopoly, but not a uniform one. According to [RedSeer Strategy Consultants' 2024 India e-commerce report](https://redseer.com/), Flipkart and Amazon India together capture roughly 70% of India's $80B+ online retail GMV — but they differ in seller composition, fulfilment, and promotional strategy. The same Samsung Galaxy phone sells for ₹1,29,999 on Flipkart and ₹1,34,999 on Amazon India during one weekend, and reverses the next. For ops teams, brand protectors, and arbitrage operators, the price delta is operational signal.

The job-to-be-done is structured. An e-commerce ops team monitoring a 200-SKU electronics catalog wants daily price diff between Flipkart and Amazon. A brand-protection team watches authorized vs grey-market pricing on their SKUs across both platforms. An arbitrage operator detects 10%+ gaps in real time. A price-comparison consumer-app builder ingests both as the data layer. All reduce to dual-marketplace daily snapshot + SKU matching + delta computation.

## How does this compare to the alternatives?

Three options for cross-marketplace India price tracking:

| Approach | Cost per 1,000 product-pairs × daily | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual price checking + Excel | Effectively unbounded analyst time | Low | Continuous | Doesn't scale |
| Paid Indian price-tracking SaaS (Pricepe, BuyHatke, MySmartPrice) | $5K–$30K/year per brand | High, includes consumer apps | Days | Vendor lock-in |
| Thirdwatch Flipkart + Amazon Scrapers | $5/day for 1K products on each side | Production-tested | Half a day | Thirdwatch maintains both |

Indian price-tracking SaaS is priced for consumer-app operators. The actors ([Flipkart Scraper](/scrapers/flipkart-products-scraper), [Amazon Scraper](/scrapers/amazon-product-scraper)) give you the data layer at meaningfully lower unit cost.

## How to track Flipkart vs Amazon India prices in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull both marketplaces in parallel?

Spawn one async run for Flipkart and one for Amazon India with the same SKU watchlist.

```python
import os, requests, time, datetime, json, pathlib

TOKEN = os.environ["APIFY_TOKEN"]

WATCHLIST = ["samsung galaxy s24 ultra", "iphone 15 pro",
             "macbook air m3", "sony wh-1000xm5",
             "dyson v15 detect", "kindle paperwhite"]

# Flipkart run
fk_resp = requests.post(
    "https://api.apify.com/v2/acts/thirdwatch~flipkart-products-scraper/runs",
    params={"token": TOKEN},
    json={"queries": WATCHLIST, "maxResults": 60},
).json()

# Amazon India run
amz_resp = requests.post(
    "https://api.apify.com/v2/acts/thirdwatch~amazon-product-scraper/runs",
    params={"token": TOKEN},
    json={"queries": WATCHLIST, "country": "in", "maxResults": 60},
).json()

results = {}
for label, run_id in [("flipkart", fk_resp["data"]["id"]),
                       ("amazon", amz_resp["data"]["id"])]:
    while True:
        s = requests.get(f"https://api.apify.com/v2/actor-runs/{run_id}",
                         params={"token": TOKEN}).json()["data"]["status"]
        if s in ("SUCCEEDED", "FAILED", "ABORTED"):
            break
        time.sleep(20)
    if s == "SUCCEEDED":
        results[label] = requests.get(
            f"https://api.apify.com/v2/actor-runs/{run_id}/dataset/items",
            params={"token": TOKEN}).json()
        print(f"{label}: {len(results[label])} products")

today = datetime.date.today().isoformat()
out = pathlib.Path(f"snapshots/cross-{today}")
out.mkdir(parents=True, exist_ok=True)
for label, items in results.items():
    (out / f"{label}.json").write_text(json.dumps(items))
```

6 keywords × 60 products on each side = ~720 raw records, costing $1.80 ($0.003 × 360 Flipkart + $0.002 × 360 Amazon).

### Step 3: How do I match SKUs across marketplaces?

Use rapidfuzz for fuzzy string matching on titles.

```python
import pandas as pd, re
from rapidfuzz import fuzz

def normalise(s):
    return re.sub(r"[^a-z0-9 ]", " ", (s or "").lower()).strip()

def parse_inr(s):
    digits = re.sub(r"[^\d]", "", str(s) if s else "")
    return int(digits) if digits else None

fk = pd.DataFrame(results["flipkart"])
amz = pd.DataFrame(results["amazon"])

fk["title_norm"] = fk.title.apply(normalise)
amz["title_norm"] = amz.title.apply(normalise)
fk["price_num"] = fk.price.apply(parse_inr)
amz["price_num"] = amz.price.apply(parse_inr)

matched = []
for _, fk_row in fk.iterrows():
    if not fk_row.title_norm:
        continue
    best_score = 0
    best_amz = None
    for _, amz_row in amz.iterrows():
        if not amz_row.title_norm:
            continue
        score = fuzz.token_set_ratio(fk_row.title_norm, amz_row.title_norm)
        if score > best_score:
            best_score = score
            best_amz = amz_row
    if best_score >= 75 and best_amz is not None:
        matched.append({
            "title_fk": fk_row.title,
            "title_amz": best_amz.title,
            "match_score": best_score,
            "fk_price": fk_row.price_num,
            "amz_price": best_amz.price_num,
            "delta_inr": (best_amz.price_num - fk_row.price_num) if (best_amz.price_num and fk_row.price_num) else None,
            "delta_pct": ((best_amz.price_num - fk_row.price_num) / fk_row.price_num) if (best_amz.price_num and fk_row.price_num) else None,
        })

m_df = pd.DataFrame(matched).dropna(subset=["delta_pct"])
print(f"Matched {len(m_df)} SKU pairs across marketplaces")
print(m_df.sort_values("delta_pct", ascending=False).head(10))
```

A token-set-ratio of 75+ catches most legitimate matches; below 75 you'll get false positives like matching different storage variants.

### Step 4: How do I detect arbitrage and forward alerts?

A 10%+ price gap between marketplaces is the canonical arbitrage signal.

```python
import requests as r

arb = m_df[m_df.delta_pct.abs() >= 0.10]
for _, row in arb.iterrows():
    cheaper = "Flipkart" if row.delta_pct > 0 else "Amazon"
    pricier = "Amazon" if row.delta_pct > 0 else "Flipkart"
    pct = abs(row.delta_pct) * 100
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":dart: *{row.title_fk[:60]}* — "
                          f"{cheaper} ₹{int(row.fk_price if row.delta_pct>0 else row.amz_price):,} vs "
                          f"{pricier} ₹{int(row.amz_price if row.delta_pct>0 else row.fk_price):,} "
                          f"({pct:.1f}% gap)")},
           timeout=10)

print(f"{len(arb)} arbitrage opportunities flagged")
```

Schedule both actors at six-hourly cadence during steady-state, hourly during sale events.

## Sample output

A single matched cross-marketplace row looks like this:

```json
{
  "title_fk": "Samsung Galaxy S24 Ultra (Titanium Gray, 256 GB)",
  "title_amz": "Samsung Galaxy S24 Ultra 5G (Titanium Gray, 256GB)",
  "match_score": 91,
  "fk_price": 129999,
  "amz_price": 134999,
  "delta_inr": 5000,
  "delta_pct": 0.038
}
```

`match_score` is the rapidfuzz token-set-ratio; 91 indicates strong match. The 3.8% delta on this Samsung Galaxy is below the 10% arbitrage threshold but still useful for ops dashboards. `delta_inr` is the absolute INR difference, useful for order-value-impact analysis.

## Common pitfalls

Three things go wrong in cross-marketplace tracking. **Storage variant collisions** — `Samsung Galaxy S24 Ultra 256GB` and `Samsung Galaxy S24 Ultra 512GB` will fuzzy-match well above 75 but represent different SKUs at different prices. Build a regex check for storage spec collisions before treating matches as valid. **Color/variant mismatch** — same model in different colors sometimes prices differently. Include color in the matching key for color-priced products. **Out-of-stock rows** — both platforms occasionally show sold-out products with stale prices. The actors return current displayed price; cross-check stock status separately if order placement is part of your downstream workflow.

Pair Flipkart with [Amazon Scraper](https://apify.com/thirdwatch/amazon-product-scraper) for cross-marketplace coverage. Total cost for daily 100-SKU dual-marketplace tracking is under $5/day at FREE pricing. The structured outputs from both actors share enough schema overlap that the matching pipeline above works without further normalisation.

## Related use cases

- [Scrape Flipkart products for India e-commerce](/blog/scrape-flipkart-products-for-india-ecommerce)
- [Build a Flipkart product research pipeline](/blog/build-flipkart-product-research-pipeline)
- [Monitor Flipkart deals and discounts](/blog/monitor-flipkart-deals-and-discounts)
- [The complete guide to scraping e-commerce](/blog/guide-scraping-ecommerce)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why compare Flipkart and Amazon India prices?

These two platforms split the Indian e-commerce market roughly 40/30, and they price the same SKUs differently because of different seller bases, fulfilment networks, and promotional cycles. According to RedSeer's 2024 India e-commerce report, the two platforms differ by 5-15% on identical SKUs roughly 30% of the time. For consumer apps, sellers managing dual-marketplace listings, or arbitrage operations, this delta is meaningful.

### How do I match the same SKU across Flipkart and Amazon?

There's no shared identifier between Flipkart and Amazon, so matching requires text-based similarity. Three common approaches: (1) exact-substring match on brand + model name (`Samsung Galaxy S24 Ultra 256GB Titanium Gray`), (2) fuzzy string matching with Levenshtein distance, (3) image-hash comparison if you fetch product images from both. Most production pipelines use (1) for known SKUs and (2) as a fallback for long-tail products.

### What's the right cadence for cross-marketplace monitoring?

Daily during steady-state, hourly during major sale events (Big Billion Days, Great Indian Festival, Republic Day sales). Both Flipkart and Amazon shift prices intraday during sale windows; missing the window means missing the deal. Steady-state daily snapshots cost roughly $1-$2/day; sale-event hourly bursts cost $25-$50/day for a 100-SKU watchlist.

### How do I detect arbitrage opportunities?

Compute `(amazon_price - flipkart_price)` per matched SKU pair. A 10%+ price gap with both products in stock and Prime/Flipkart-Plus eligible is a viable arbitrage signal. The arbitrage decays fast — once you start buying from the cheaper marketplace, it usually closes within hours as inventory shifts. Build alerting that fires on first detection, not on sustained gaps.

### What about authorized vs grey-market sellers?

Flipkart and Amazon both host third-party sellers alongside their own retail operations. The cheaper price often comes from a grey-market seller who sourced inventory through unauthorized channels. The actor returns the `seller` field on Flipkart records — for brand-protection workflows, flag listings where `seller` is unfamiliar to the brand or where Flipkart shows a non-Flipkart-fulfilled marker. Amazon doesn't expose seller name in search results; for Amazon seller verification, fetch the specific ASIN URL.

### How does this compare to paid Indian price-tracking SaaS?

Indian price-tracking platforms (Pricepe, MySmartPrice, BuyHatke) bundle cross-marketplace tracking with consumer apps and affiliate revenue. Building your own using Flipkart + Amazon Scraper is meaningfully cheaper for systematic operational use; the SaaS option is better when you need consumer-facing tooling as part of a larger product.

Run the [Flipkart Scraper on Apify Store](https://apify.com/thirdwatch/flipkart-products-scraper) — pay-per-product, free to try, no credit card to test.
