---
title: "Monitor Flipkart Deals and Discounts (2026 Guide)"
slug: "monitor-flipkart-deals-and-discounts"
description: "Track Flipkart Big Billion Day and Big Saving Days discounts at $0.002 per record using Thirdwatch. Discount-velocity alerts + Postgres recipes."
actor: "flipkart-products-scraper"
actor_url: "https://apify.com/thirdwatch/flipkart-products-scraper"
actorTitle: "Flipkart Scraper"
category: "ecommerce"
audience: "operators"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-flipkart-products-for-india-ecommerce"
  - "track-flipkart-prices-vs-amazon-india"
  - "build-flipkart-product-research-pipeline"
keywords:
  - "flipkart deals tracker"
  - "big billion day scraper"
  - "flipkart discount monitoring"
  - "india ecommerce sale alerts"
faqs:
  - q: "Why monitor Flipkart deals specifically?"
    a: "Flipkart drives most of India ecommerce volume during Big Billion Day (October) and weekly Big Saving Days throughout the year. Discount density during these windows reaches 40-70% off MRP across categories — materially deeper than Amazon India during the same windows. For India ecommerce operators, deal-aggregator builders, affiliate sites, and price-comparison platforms, Flipkart deal monitoring is the canonical workflow during sale periods."
  - q: "What discount threshold is meaningful?"
    a: "Discounts under 20% off MRP are normal everyday pricing on Flipkart. 30-50% off is sale-tier pricing during Big Saving Days. 50%+ off is Big Billion Day tier and indicates either flagship-promotion pricing or inventory clearance. For affiliate sites and deal-aggregators, the 30%+ threshold is the canonical filter for surfaced-deal content."
  - q: "How fresh do deal snapshots need to be?"
    a: "During sale windows (Big Billion Day, Big Saving Days), 30-minute cadence is justified — discounts can change every hour as inventory clears. For non-sale periods, daily cadence is sufficient. For longitudinal deal-research, weekly cadence captures the meaningful patterns. Most teams run daily year-round + 30-minute during the announced sale dates."
  - q: "Can I detect flash deals?"
    a: "Yes. Flipkart's flash-deals refresh every 4-8 hours during sale windows; products move in and out of deep discounts based on inventory-vs-demand pricing engines. Persist (product_id, price, mrp, snapshot_time) tuples and compute discount_pct deltas across consecutive snapshots. A discount_pct delta of 20+ percentage points in one snapshot interval indicates flash-deal entry."
  - q: "How do I dedupe across sale-event snapshots?"
    a: "`product_id` (Flipkart's FSN) is the canonical natural key. During sale windows the same product often appears on multiple sale-event landing pages; dedupe on FSN before counting unique discount events. About 20-30% of raw rows duplicate across event-pages during peak sale periods."
  - q: "How does this compare to deal-aggregator sites (DealsHeaven, MySmartPrice)?"
    a: "Deal-aggregator sites curate deals manually and at low frequency (daily refreshes). The actor gives you raw 30-minute-frequency Flipkart data — for affiliate sites and deal-aggregator platforms operating at scale, programmatic access to live discount data enables better deal velocity than manual curation. For individual deal-hunters, the SaaS aggregators win on UX."
---

> Thirdwatch's [Flipkart Scraper](https://apify.com/thirdwatch/flipkart-products-scraper) makes deal monitoring a structured workflow at $0.002 per record — 30-minute snapshots during sale windows, discount-percentage delta detection, flash-deal alerting, MRP-vs-price drift tracking. Built for India ecommerce operators, deal-aggregator builders, affiliate marketers, and price-comparison platforms.

## Why monitor Flipkart deals and discounts

India ecommerce concentrates around discount events. According to [Flipkart's 2024 Big Billion Day report](https://stories.flipkart.com/), the platform processes more than 7 days' worth of normal volume during the 7-day Big Billion Day window in October, with similar but smaller spikes during weekly Big Saving Days throughout the year. For deal-aggregators, affiliate marketers, and price-comparison platforms, deal-event monitoring is the canonical workflow.

The job-to-be-done is structured. A deal-aggregator site refreshes 50K+ Flipkart product discounts hourly during Big Billion Day. An affiliate marketer surfaces 30%+ discount products to email lists. A price-comparison platform tracks per-category median discount over time. A reseller arbitrage operator scans deep-discount products for cross-marketplace flip opportunities. All reduce to category × keyword queries + discount-percentage filtering + delta detection.

## How does this compare to the alternatives?

Three options for Flipkart deal-event data:

| Approach | Cost during sale window | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual deal-curation | Effectively unbounded analyst time | Low | Continuous | Doesn't scale |
| Flipkart Affiliate API | Free with affiliate account | Limited fields | Days (account approval) | Strict use-case scope |
| Thirdwatch Flipkart Scraper | $0.002 × scale | Production-tested with impit + residential | 5 minutes | Thirdwatch tracks Flipkart changes |

Flipkart's Affiliate API is gated behind affiliate program approval and limits fields. The [Flipkart Scraper actor page](/scrapers/flipkart-products-scraper) gives you the raw deal data at the lowest unit cost.

## How to monitor deals in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a deal-category watchlist?

Pass category + price-band query strings.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~flipkart-products-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

DEAL_CATEGORIES = ["bluetooth speakers under 5000",
                   "smartwatch under 10000",
                   "wireless earbuds under 3000",
                   "kitchen appliances",
                   "ergonomic office chair",
                   "running shoes",
                   "bedsheets cotton",
                   "kitchen storage"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": DEAL_CATEGORIES, "maxResults": 200},
    timeout=900,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M")
pathlib.Path(f"snapshots/flipkart-deals-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} products")
```

8 categories × 200 = up to 1,600 records per snapshot, costing $3.20.

### Step 3: How do I compute discount percentages and filter?

Parse price + MRP, compute discount, filter to deep discounts.

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/flipkart-deals-*.json"))
all_records = []
for s in snapshots:
    snap = json.loads(open(s).read())
    for r in snap:
        r["snapshot_time"] = pd.to_datetime(s.split("flipkart-deals-")[1].split(".")[0], format="%Y%m%d-%H%M")
        all_records.append(r)

df = pd.DataFrame(all_records)
df["price"] = pd.to_numeric(df.price.astype(str).str.replace(r"[₹,]", "", regex=True), errors="coerce")
df["mrp"] = pd.to_numeric(df.mrp.astype(str).str.replace(r"[₹,]", "", regex=True), errors="coerce")
df["discount_pct"] = (df.mrp - df.price) / df.mrp * 100

deep = df[df.discount_pct >= 30].sort_values("discount_pct", ascending=False)
print(f"{len(deep)} products at 30%+ off")
print(deep[["title", "price", "mrp", "discount_pct"]].head(15))
```

The 30% threshold filters out everyday pricing-engine adjustments and surfaces real deal-event content.

### Step 4: How do I detect flash deals via delta?

Compare consecutive snapshots and detect discount_pct increases.

```python
df_sorted = df.sort_values(["product_id", "snapshot_time"])
df_sorted["prev_discount_pct"] = df_sorted.groupby("product_id").discount_pct.shift(1)
df_sorted["discount_delta"] = df_sorted.discount_pct - df_sorted.prev_discount_pct

flash = df_sorted[
    (df_sorted.discount_delta >= 20)
    & (df_sorted.discount_pct >= 40)
].drop_duplicates(subset=["product_id"], keep="last")

import requests as r
for _, p in flash.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":fire: *{p.title[:80]}* flash deal! "
                          f"Now {p.discount_pct:.0f}% off (was {p.prev_discount_pct:.0f}%)\n"
                          f"₹{p.price:.0f} (MRP ₹{p.mrp:.0f}) — {p.url}")})
print(f"{len(flash)} flash-deal alerts forwarded")
```

A 20+ percentage-point increase in discount_pct between snapshots indicates flash-deal entry — high-priority for affiliate marketing surfaces.

## Sample output

A single Flipkart deal record looks like this. Five rows weigh ~6 KB.

```json
{
  "product_id": "MOBFRZBYMGCSGS5J",
  "title": "boAt Stone 1000 14W Bluetooth Speaker",
  "price": "₹1,799",
  "mrp": "₹3,990",
  "discount_pct": 54.9,
  "rating": 4.3,
  "reviews_count": 28450,
  "category": "Bluetooth Speakers",
  "brand": "boAt",
  "image_url": "https://rukminim2.flixcart.com/...",
  "url": "https://www.flipkart.com/boat-stone-1000-...",
  "in_stock": true,
  "f_assured": true
}
```

`product_id` (FSN) is the canonical natural key. `mrp` and `price` enable discount-percentage computation. `discount_pct` (when present in the response) is the displayed discount label. `f_assured: true` indicates Flipkart-fulfilled deals which convert at higher rates.

## Common pitfalls

Three things go wrong in deal-monitoring pipelines. **MRP inflation** — sellers sometimes inflate MRP to display larger fake discounts; compare deal-event MRP against historical MRP from prior snapshots before treating the discount as genuine. **Out-of-stock false-deal signals** — products go out of stock during sale windows but the listing remains visible with a "notify me" CTA; combine `in_stock: true` filter with discount-percentage filter. **Affiliate-attribution drift** — Flipkart Affiliate API requires specific referral parameters that scraped URLs lack; for affiliate-revenue use cases, layer the URL with your affiliate parameters before serving to consumers.

Thirdwatch's actor uses impit + residential proxy at $0.15/1K, ~91% margin. Pair Flipkart with [Amazon Scraper](https://apify.com/thirdwatch/amazon-scraper) for cross-marketplace deal aggregation. A fourth subtle issue worth flagging: certain Flipkart deal events are restricted to Plus members (Flipkart's loyalty tier), with the public price showing a different higher value than the Plus member price; for accurate deal-aggregator content, label deals as "Plus only" when detected and surface separately to non-Plus audiences who can't realize the headline price. A fifth pattern unique to India ecommerce: regional variance — Flipkart's promotional pricing sometimes varies by delivery PIN code (e.g., metro-only pricing during early-sale windows that propagates to Tier 2/3 cities later); for accurate cross-region deal coverage, run separate snapshot batches per target PIN code or treat metro-pricing as upper-bound estimates for non-metro audiences. A sixth and final pitfall: bank-card-based offers (e.g., "10% off with HDFC card", "Flat ₹500 off with SBI") aren't reflected in the displayed `price` field — the headline price is pre-bank-offer; for true effective-price analysis, parse the bank-offer text from the product page and compute net price before publishing comparative discount rankings. A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size. This is the difference between a $200/month research pipeline and a $2,000/month one for the same actionable output. An eighth subtle issue worth flagging: snapshot-storage strategy materially affects long-term pipeline economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. For high-frequency snapshots, partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

## Related use cases

- [Scrape Flipkart products for India ecommerce](/blog/scrape-flipkart-products-for-india-ecommerce)
- [Track Flipkart prices vs Amazon India](/blog/track-flipkart-prices-vs-amazon-india)
- [Build a Flipkart product research pipeline](/blog/build-flipkart-product-research-pipeline)
- [The complete guide to scraping ecommerce](/blog/guide-scraping-ecommerce)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why monitor Flipkart deals specifically?

Flipkart drives most of India ecommerce volume during Big Billion Day (October) and weekly Big Saving Days throughout the year. Discount density during these windows reaches 40-70% off MRP across categories — materially deeper than Amazon India during the same windows. For India ecommerce operators, deal-aggregator builders, affiliate sites, and price-comparison platforms, Flipkart deal monitoring is the canonical workflow during sale periods.

### What discount threshold is meaningful?

Discounts under 20% off MRP are normal everyday pricing on Flipkart. 30-50% off is sale-tier pricing during Big Saving Days. 50%+ off is Big Billion Day tier and indicates either flagship-promotion pricing or inventory clearance. For affiliate sites and deal-aggregators, the 30%+ threshold is the canonical filter for surfaced-deal content.

### How fresh do deal snapshots need to be?

During sale windows (Big Billion Day, Big Saving Days), 30-minute cadence is justified — discounts can change every hour as inventory clears. For non-sale periods, daily cadence is sufficient. For longitudinal deal-research, weekly cadence captures the meaningful patterns. Most teams run daily year-round + 30-minute during the announced sale dates.

### Can I detect flash deals?

Yes. Flipkart's flash-deals refresh every 4-8 hours during sale windows; products move in and out of deep discounts based on inventory-vs-demand pricing engines. Persist `(product_id, price, mrp, snapshot_time)` tuples and compute discount_pct deltas across consecutive snapshots. A discount_pct delta of 20+ percentage points in one snapshot interval indicates flash-deal entry.

### How do I dedupe across sale-event snapshots?

`product_id` (Flipkart's FSN) is the canonical natural key. During sale windows the same product often appears on multiple sale-event landing pages; dedupe on FSN before counting unique discount events. About 20-30% of raw rows duplicate across event-pages during peak sale periods.

### How does this compare to deal-aggregator sites (DealsHeaven, MySmartPrice)?

[Deal-aggregator sites](https://www.mysmartprice.com/) curate deals manually and at low frequency (daily refreshes). The actor gives you raw 30-minute-frequency Flipkart data — for affiliate sites and deal-aggregator platforms operating at scale, programmatic access to live discount data enables better deal velocity than manual curation. For individual deal-hunters, the SaaS aggregators win on UX.

Run the [Flipkart Scraper on Apify Store](https://apify.com/thirdwatch/flipkart-products-scraper) — pay-per-record, free to try, no credit card to test.
