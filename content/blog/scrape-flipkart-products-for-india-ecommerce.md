---
title: "Scrape Flipkart Products for India E-commerce Research (2026)"
slug: "scrape-flipkart-products-for-india-ecommerce"
description: "Pull Flipkart products at $0.003 per record using Thirdwatch — title, price, original price, discount, rating, seller. India's largest marketplace. Python recipes."
actor: "flipkart-products-scraper"
actor_url: "https://apify.com/thirdwatch/flipkart-products-scraper"
actorTitle: "Flipkart Scraper"
category: "ecommerce"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-flipkart-prices-vs-amazon-india"
  - "build-flipkart-product-research-pipeline"
  - "monitor-flipkart-deals-and-discounts"
keywords:
  - "flipkart scraper"
  - "scrape flipkart products"
  - "india ecommerce data"
  - "flipkart api alternative"
faqs:
  - q: "How much does it cost to scrape Flipkart?"
    a: "Thirdwatch's Flipkart Scraper charges $0.003 per product on the FREE tier and drops to $0.0016 at GOLD volume. A 50-keyword Indian e-commerce monitoring sweep at 100 products each costs $15 per refresh. Daily cadence on 50 keywords is roughly $450/month — well below typical retail-monitoring SaaS for India coverage."
  - q: "Why scrape Flipkart specifically for India?"
    a: "Flipkart dominates India e-commerce with 40%+ market share according to industry tracker reports — materially deeper Indian SKU coverage than Amazon India for many categories (especially fashion, electronics, home goods). For Indian e-commerce price-monitoring, competitor research, or SKU-availability tracking, Flipkart is the table-stakes source. Pair it with Amazon India for the full marketplace view."
  - q: "What fields are returned per product?"
    a: "Nine fields per product: title, price, original_price (pre-discount), discount (percentage off), rating (1-5), reviews_count, seller (third-party or Flipkart Official), highlights (array of feature bullets like 12 GB RAM, 256 GB Storage), and url. All prices are in INR. Highlights are particularly useful for product-research workflows since they distill key specs without requiring a separate detail-page scrape."
  - q: "How does this compare to Flipkart's Affiliate API?"
    a: "Flipkart's Affiliate API requires manual approval (2-4 weeks), is restricted to affiliate-marketing use cases, and returns a limited subset of public data. The Seller API only covers your own listings. Thirdwatch's actor accesses the public catalog the same way any shopper does, with no application process and no use-case restrictions beyond standard public-data scraping norms."
  - q: "How fresh is the data?"
    a: "Each run pulls live from flipkart.com at request time. Flipkart prices and stock change rapidly during flash sales (Big Billion Days, Republic Day, end-of-season events) — sometimes hourly within the sale window. For active sale-period monitoring, schedule the actor at hourly cadence; for steady-state price tracking, daily is sufficient."
  - q: "Why are some product fields empty?"
    a: "Flipkart's listing page omits fields when a product is too new (no rating yet) or when the seller hasn't filled them in. The actor returns whatever the page shows. For analytics, treat null fields as missing-data flags rather than zero values; an unrated brand-new SKU is structurally different from a 1.0-star bombed listing."
---

> Thirdwatch's [Flipkart Scraper](https://apify.com/thirdwatch/flipkart-products-scraper) returns Flipkart product search results at $0.003 per product — title, price, original_price, discount, rating, reviews_count, seller, highlights, url. Built for Indian e-commerce ops monitoring competitor pricing, brand teams tracking unauthorized resellers, dropshippers researching catalog opportunities, and analysts building India-specific marketplace datasets.

## Why scrape Flipkart for India e-commerce

Flipkart is the largest Indian e-commerce marketplace by GMV. According to [Walmart's 2024 annual report](https://corporate.walmart.com/) (Flipkart's parent), the platform processed over $30B in gross merchandise value across 700+ categories with 500M+ registered customers. For Indian-market e-commerce intelligence — price monitoring, competitor research, SKU availability — Flipkart is the canonical primary source. The blocker for systematic access: Flipkart's Affiliate API requires manual approval, restricts use cases, and returns limited data.

The job-to-be-done is structured. An Indian seller monitoring 200 SKUs daily wants price diff against competitors. A brand team watches for unauthorized resellers carrying their products at sub-MSRP prices. A dropshipper researches Flipkart for product opportunities to source from AliExpress. A market researcher builds a longitudinal Indian e-commerce dataset for category trend analysis. All reduce to keyword + maxResults pulls returning structured product rows.

## How does this compare to the alternatives?

Three options for getting Flipkart product data into a pipeline:

| Approach | Cost per 1,000 products | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Flipkart Affiliate API | Free (after approval) | Restricted to affiliate use cases | 2-4 weeks for approval | Per-API quota limits |
| Manual Flipkart browsing + Excel | Effectively unbounded analyst time | Low | Continuous | Doesn't scale |
| Thirdwatch Flipkart Scraper | $3 ($0.003 × 1,000) | Production-tested with impit + residential proxy | 5 minutes | Thirdwatch tracks Flipkart changes |

Flipkart's Affiliate API is the official path but its use-case restrictions and approval process exclude most analytics workflows. The [Flipkart Scraper actor page](/scrapers/flipkart-products-scraper) gives you the public catalog at pay-per-result pricing — no application process, no approval gate.

## How to scrape Flipkart products in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a watchlist of products?

Pass each product keyword as a query and set `maxResults` to your daily refresh size.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~flipkart-products-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

WATCHLIST = ["samsung galaxy s24 ultra", "iphone 15 pro",
             "macbook air m3", "sony wh-1000xm5", "kindle paperwhite"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": WATCHLIST, "maxResults": 100},
    timeout=600,
)
records = resp.json()
today = datetime.date.today().isoformat()
pathlib.Path(f"snapshots/flipkart-{today}.json").write_text(json.dumps(records))
print(f"{today}: {len(records)} products across {len(WATCHLIST)} keywords")
```

5 keywords × ~20 unique results per query = ~100 records, costing $0.30.

### Step 3: How do I parse INR prices and detect deep discounts?

Flipkart prices use Indian comma format (`₹1,29,999`); regex-parse to numerics for analytics.

```python
import pandas as pd, re

def parse_inr(s):
    if not s:
        return None
    digits = re.sub(r"[^\d]", "", str(s))
    return int(digits) if digits else None

def parse_pct(s):
    if not s:
        return None
    m = re.search(r"(\d+)", str(s))
    return int(m.group(1)) if m else None

df = pd.DataFrame(records)
df["price_num"] = df.price.apply(parse_inr)
df["original_num"] = df.original_price.apply(parse_inr)
df["discount_pct"] = df.discount.apply(parse_pct)

deep_deals = df[
    df.discount_pct.notna()
    & (df.discount_pct >= 30)
    & df.rating.notna()
    & (df.rating >= 4.0)
    & (df.reviews_count >= 1000)
].sort_values("discount_pct", ascending=False)
print(deep_deals[["title", "price", "original_price",
                  "discount_pct", "rating", "reviews_count", "seller"]].head(15))
```

A 30%+ discount on a 4.0+ rated product with 1,000+ reviews is the canonical "real deal" filter — not a flash-sale scam, not a low-quality clearance.

### Step 4: How do I diff today's prices against yesterday and forward to Slack?

Persist snapshots, dedupe by URL, alert on price drops.

```python
import glob, requests as r

frames = []
for f in sorted(glob.glob("snapshots/flipkart-*.json")):
    date = pathlib.Path(f).stem.replace("flipkart-", "")
    for j in json.loads(pathlib.Path(f).read_text()):
        frames.append({
            "date": date, "url": j.get("url"), "title": j.get("title"),
            "price_num": parse_inr(j.get("price")),
        })

ts = pd.DataFrame(frames).dropna(subset=["url", "price_num"])
ts["date"] = pd.to_datetime(ts["date"])
last_two = sorted(ts.date.unique())[-2:]
yest = ts[ts.date == last_two[0]].set_index("url")
todays = ts[ts.date == last_two[1]].copy()
todays["yest_price"] = todays.url.map(yest.price_num)
todays["delta_pct"] = (todays.price_num - todays.yest_price) / todays.yest_price

drops = todays[todays.delta_pct <= -0.05]
for _, row in drops.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":chart_with_downwards_trend: *{row.title[:60]}* "
                          f"₹{int(row.yest_price):,} → ₹{int(row.price_num):,} "
                          f"({row.delta_pct*100:+.1f}%)")},
           timeout=10)
print(f"{len(drops)} price drops alerted")
```

A 5%+ daily price drop is a meaningful signal during steady-state trading. During Big Billion Days or other sale events, raise the threshold to 15%+ to filter sale-window noise.

## Sample output

A single record from the dataset for one Samsung Galaxy phone looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "title": "Samsung Galaxy S24 Ultra (Titanium Gray, 256 GB)",
  "price": "₹1,29,999",
  "original_price": "₹1,44,999",
  "discount": "10% off",
  "rating": 4.6,
  "reviews_count": 45000,
  "seller": "Samsung Official",
  "highlights": ["12 GB RAM", "256 GB Storage", "200 MP Camera"],
  "url": "https://www.flipkart.com/samsung-galaxy-s24-ultra/..."
}
```

`url` is the canonical natural key for cross-snapshot dedup. `seller` distinguishes Flipkart-direct (Flipkart Official) from third-party marketplace sellers — a useful signal for brand-protection workflows. `highlights` is an array of key spec bullets, much richer than a typical listing snippet — for product comparison this saves a separate detail-page scrape. `original_price` populated alongside `price` means the listing is on discount; `original_price: null` means the displayed price is the full price.

## Common pitfalls

Three things go wrong in production Flipkart pipelines. **INR price-format parsing** — Flipkart uses lakh notation (`₹1,29,999` for 1.3 lakh, not 1,000 with separators); regex-strip non-digits rather than splitting on commas. **Flash-sale cycle noise** — Big Billion Days and similar events cause 50%+ price swings within hours; flag sale windows in your downstream analytics rather than treating them as steady-state signal. **Seller variability** — the same SKU can appear under multiple sellers with different prices, ratings, and dispatch times. For a single canonical price per SKU, sort by seller (prefer Flipkart Official or named brand seller) before deduping.

Thirdwatch's actor uses impit (Chrome TLS fingerprint) + residential proxy to bypass Flipkart's anti-bot defenses — production-tested at sustained daily volumes. The pure-HTTP architecture means a 100-product daily snapshot completes in under three minutes and costs $0.30 — small enough to run hourly during sale events. Pair Flipkart with our [Amazon Scraper](https://apify.com/thirdwatch/amazon-product-scraper) for cross-marketplace India e-commerce comparison and [AliExpress Scraper](https://apify.com/thirdwatch/aliexpress-product-scraper) for sourcing research. A fourth subtle issue worth flagging is that Flipkart's "10% off" discount label sometimes refers to a coupon-applied price rather than the displayed listing price, which can mislead automated discount-detection. Cross-check `original_price` minus `price` against the percentage label rather than trusting the label alone. A fifth pattern unique to Flipkart: many listings show "Bank Offer" or "No Cost EMI" badges that aren't reflected in the price field; for fully-effective-cost analysis these need to be parsed separately, but for headline-price monitoring the actor's data is sufficient.

## Related use cases

- [Track Flipkart prices vs Amazon India](/blog/track-flipkart-prices-vs-amazon-india)
- [Build a Flipkart product research pipeline](/blog/build-flipkart-product-research-pipeline)
- [Monitor Flipkart deals and discounts](/blog/monitor-flipkart-deals-and-discounts)
- [The complete guide to scraping e-commerce](/blog/guide-scraping-ecommerce)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape Flipkart?

Thirdwatch's Flipkart Scraper charges $0.003 per product on the FREE tier and drops to $0.0016 at GOLD volume. A 50-keyword Indian e-commerce monitoring sweep at 100 products each costs $15 per refresh. Daily cadence on 50 keywords is roughly $450/month — well below typical retail-monitoring SaaS for India coverage.

### Why scrape Flipkart specifically for India?

Flipkart dominates India e-commerce with 40%+ market share according to industry tracker reports — materially deeper Indian SKU coverage than Amazon India for many categories (especially fashion, electronics, home goods). For Indian e-commerce price-monitoring, competitor research, or SKU-availability tracking, Flipkart is the table-stakes source. Pair it with Amazon India for the full marketplace view.

### What fields are returned per product?

Nine fields per product: `title`, `price`, `original_price` (pre-discount), `discount` (percentage off), `rating` (1-5), `reviews_count`, `seller` (third-party or Flipkart Official), `highlights` (array of feature bullets like `12 GB RAM`, `256 GB Storage`), and `url`. All prices are in INR. Highlights are particularly useful for product-research workflows since they distill key specs without requiring a separate detail-page scrape.

### How does this compare to Flipkart's Affiliate API?

Flipkart's [Affiliate API](https://affiliate.flipkart.com/) requires manual approval (2-4 weeks), is restricted to affiliate-marketing use cases, and returns a limited subset of public data. The Seller API only covers your own listings. Thirdwatch's actor accesses the public catalog the same way any shopper does, with no application process and no use-case restrictions beyond standard public-data scraping norms.

### How fresh is the data?

Each run pulls live from flipkart.com at request time. Flipkart prices and stock change rapidly during flash sales (Big Billion Days, Republic Day, end-of-season events) — sometimes hourly within the sale window. For active sale-period monitoring, schedule the actor at hourly cadence; for steady-state price tracking, daily is sufficient.

### Why are some product fields empty?

Flipkart's listing page omits fields when a product is too new (no rating yet) or when the seller hasn't filled them in. The actor returns whatever the page shows. For analytics, treat null fields as missing-data flags rather than zero values; an unrated brand-new SKU is structurally different from a 1.0-star bombed listing.

Run the [Flipkart Scraper on Apify Store](https://apify.com/thirdwatch/flipkart-products-scraper) — pay-per-product, free to try, no credit card to test.
