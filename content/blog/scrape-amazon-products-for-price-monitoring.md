---
title: "Scrape Amazon Products for Price Monitoring (2026 Guide)"
slug: "scrape-amazon-products-for-price-monitoring"
description: "Track Amazon prices across 19 country marketplaces at $0.002 per product using Thirdwatch's Amazon Scraper. ASIN dedup + price-diff alert recipes inside."
actor: "amazon-product-scraper"
actor_url: "https://apify.com/thirdwatch/amazon-product-scraper"
actorTitle: "Amazon Product Scraper"
category: "ecommerce"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-amazon-bestsellers-by-category"
  - "build-amazon-product-research-tool"
  - "monitor-amazon-competitor-pricing-and-ratings"
keywords:
  - "amazon price monitoring"
  - "amazon product scraper"
  - "scrape amazon prices"
  - "amazon competitor tracking"
faqs:
  - q: "How much does it cost to monitor Amazon prices?"
    a: "Thirdwatch's Amazon Scraper charges $0.002 per product on the FREE tier and drops to $0.001 at GOLD volume — 2-5x cheaper than competing Amazon scrapers on Apify. A 50-query daily price-monitoring sweep at 100 results each costs $10 at FREE pricing. Hourly cadence is roughly $250/month — well below typical retail-monitoring SaaS subscriptions."
  - q: "Which Amazon marketplaces does the actor support?"
    a: "19 country domains: US, UK, India, Germany, France, Spain, Italy, Canada, Japan, Australia, Brazil, Mexico, Netherlands, Singapore, Saudi Arabia, UAE, Poland, Sweden, Belgium. Pass the country code as the country input. Each marketplace has its own currency, prices, and Prime availability — the actor handles all of this automatically per request."
  - q: "Can I track the same product across multiple countries?"
    a: "Yes. The same ASIN often exists across multiple Amazon marketplaces with different prices and Prime availability. Run the actor once per country with a search for the product (or with the ASIN as the query) and join the results by ASIN. This is the canonical pattern for cross-market price arbitrage analysis or brand-distribution monitoring."
  - q: "What's the right refresh cadence for price monitoring?"
    a: "Hourly catches intra-day price changes that Amazon ships during peak shopping events (Prime Day, Black Friday). Daily catches everything else. Weekly is fine for trend analysis where you don't care about short-term volatility. For e-commerce ops monitoring competitor pricing, six-hourly is the practical sweet spot — captures most daily promotion windows without burning budget on hourly noise."
  - q: "How do I detect price drops vs Prime-status changes?"
    a: "Persist each snapshot with timestamp; diff against the previous snapshot keyed by (asin, domain). Compute price_delta and is_prime_changed. A price drop with no Prime change is a typical promotion; a price drop combined with a Prime add is often a Lightning Deal or Subscribe-and-Save activation. Track both as separate alert classes — they signal different competitor strategies."
  - q: "Are sponsored listings included?"
    a: "Yes, mixed in with organic results just as Amazon presents them. Sponsored listings sometimes omit review_count or rating — a useful signal if you want to filter them out (treat null reviews as a sponsored hint). The actor returns whatever Amazon shows; downstream classification (organic vs sponsored) is a heuristic you tune to your use case."
---

> Thirdwatch's [Amazon Product Scraper](https://apify.com/thirdwatch/amazon-product-scraper) returns Amazon search-results data across 19 country marketplaces at $0.002 per product — title, price, rating, review count, Prime badge, ASIN, image URL. Built for e-commerce ops, price-comparison platforms, brand-protection teams, and market researchers who need machine-readable Amazon data without per-call API throttling.

## Why scrape Amazon for price monitoring

Amazon dominates global e-commerce. According to [Amazon's 2024 annual report](https://www.aboutamazon.com/news/), the platform processed over $620B in gross merchandise volume across 19 country marketplaces — and the prices on Amazon set the reference point most other retailers benchmark against. For an e-commerce operations team, a brand selling on multiple marketplaces, or a comparison-shopping platform, real-time Amazon price data is the input layer everything else builds on.

The job-to-be-done is structured. A consumer-electronics seller monitoring 50 SKUs wants daily price snapshots across US, UK, and Germany, with alerts on competitor moves. A price-comparison site wants every search result for "wireless headphones" pulled hourly across 5 countries. A brand-protection team tracks third-party sellers carrying their ASINs in foreign markets where they didn't authorise distribution. A market researcher compares Prime adoption rates by category across regions. All of these reduce to the same shape — search query + country + maxResults — returning structured product rows for diff and alert.

## How does this compare to the alternatives?

Three options for getting Amazon product data into a price-monitoring pipeline:

| Approach | Cost per 1,000 products | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Amazon Product Advertising API | Free (with quotas) | Strict throttling, requires affiliate account | Days–weeks | Sales-quota gates |
| junglee/Amazon-crawler (Apify) | ~$5 ($0.005 × 1,000) | Production-tested | 5 minutes | Vendor maintains |
| Thirdwatch Amazon Scraper | $2 ($0.002 × 1,000) | Production-tested, 2-5x cheaper | 5 minutes | Thirdwatch tracks Amazon changes |

The Product Advertising API requires an Amazon Associates account and ties you to affiliate-sales quotas — most price-monitoring teams find the throttling impractical. The [Amazon Product Scraper actor page](/scrapers/amazon-product-scraper) offers the same canonical fields without quota dependencies.

## How to scrape Amazon for price monitoring in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a watchlist of products?

Pass each product keyword (or ASIN) as a query and set the target country.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~amazon-product-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

WATCHLIST = ["airpods pro 2", "sony wh-1000xm5", "bose quietcomfort ultra",
             "apple watch series 9", "kindle paperwhite"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": WATCHLIST, "country": "us", "maxResults": 100},
    timeout=600,
)
records = resp.json()
today = datetime.date.today().isoformat()
pathlib.Path(f"snapshots/amazon-us-{today}.json").write_text(json.dumps(records))
print(f"{today}: {len(records)} products")
```

Five queries × ~20 unique results per query = ~100 records, costing $0.20.

### Step 3: How do I diff today's prices against yesterday?

Persist snapshots, parse price strings to numbers, key on `(asin, domain)`.

```python
import pandas as pd, re, glob

def parse_price(s):
    if not s:
        return None
    m = re.search(r"([\d,]+(?:\.\d+)?)", str(s).replace(",", ""))
    return float(m.group(1)) if m else None

frames = []
for f in sorted(glob.glob("snapshots/amazon-us-*.json")):
    date = pathlib.Path(f).stem.replace("amazon-us-", "")
    for j in json.loads(pathlib.Path(f).read_text()):
        frames.append({
            "date": date, "asin": j.get("asin"),
            "title": j.get("title"),
            "price_str": j.get("price"),
            "price_num": parse_price(j.get("price")),
            "is_prime": j.get("is_prime"),
            "rating": j.get("rating"),
            "reviews_count": j.get("reviews_count"),
        })

df = pd.DataFrame(frames).dropna(subset=["asin", "price_num"])
df["date"] = pd.to_datetime(df["date"])

last_two = sorted(df.date.unique())[-2:]
yest = df[df.date == last_two[0]].set_index("asin")
today = df[df.date == last_two[1]].copy()
today["yest_price"] = today.asin.map(yest.price_num)
today["delta_pct"] = (today.price_num - today.yest_price) / today.yest_price
movers = today[today.delta_pct.abs() >= 0.05].sort_values("delta_pct")
print(movers[["title", "yest_price", "price_num", "delta_pct"]].head(20))
```

A 5%+ daily move at one product is rare enough to be signal; most days produce 0-3 alerts on a 100-product watchlist.

### Step 4: How do I push price-drop alerts to Slack?

Forward newly-flagged drops to a Slack channel for category or merchandising ops.

```python
import requests as r

drops = movers[movers.delta_pct < 0]
for _, row in drops.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":chart_with_downwards_trend: *{row.title[:60]}* "
                          f"${row.yest_price:.2f} → ${row.price_num:.2f} "
                          f"({row.delta_pct*100:+.1f}%)")},
           timeout=10)

print(f"{len(drops)} price drops alerted")
```

Schedule the actor on Apify's [scheduler](https://docs.apify.com/platform/schedules) at six-hourly cadence (`0 */6 * * *`) and the loop is fully self-maintaining.

## Sample output

A single record from the dataset for one Amazon US product looks like this. Five rows of this shape weigh ~3 KB.

```json
{
  "title": "Apple AirPods Pro (2nd Generation)",
  "price": "$189.99",
  "rating": 4.7,
  "reviews_count": 125000,
  "is_prime": true,
  "asin": "B0D1XD1ZV3",
  "image_url": "https://m.media-amazon.com/images/I/...",
  "url": "https://www.amazon.com/dp/B0D1XD1ZV3",
  "domain": "amazon.com"
}
```

`asin` is Amazon's globally unique product identifier — the canonical primary key for cross-snapshot dedup. `price` arrives as a display string (`$189.99`, `£169.00`, `₹19,990`); regex-parse to a numeric for trend analysis. `is_prime` and `reviews_count` are the trust filters most analyses care about. `domain` distinguishes marketplace, important when you're aggregating across countries — the same ASIN can have different prices and Prime status on `amazon.com` vs `amazon.co.uk`.

## Common pitfalls

Three things go wrong in Amazon price-monitoring pipelines. **Cross-currency mixing** — when aggregating across countries, always group by `domain` before computing medians; mixing $189 (USD) and ₹19,990 (INR) into one average produces nonsense. Convert to USD via a daily FX rate when you need cross-market comparisons. **Stock vs price** — a product may show a "Currently unavailable" price string instead of a numeric; parse this as null rather than zero, otherwise your average prices look artificially low. **Sponsored-organic mix** — sponsored listings are blended with organic in the search response. Treat them as data with a footnote: a 5% price drop on a sponsored row may just be a promo paid by the seller for that day, not a real shelf-price move.

Thirdwatch's actor returns `domain` and `asin` on every record so cross-marketplace dedup and grouping are clean. The pure-HTTP architecture means a 100-product daily snapshot completes in under three minutes and costs $0.20 — small enough to run hourly without budget pain even for a 50-product watchlist. A fourth subtle issue worth flagging: Amazon shows different "list price" struck-through values vs the live "deal price" depending on the day; the actor returns whatever the page shows in its primary price slot, so for cleanest comparisons compute price-deltas rather than absolute discounts. A fifth note: a non-trivial fraction of bestseller pages briefly show "Coupon" badges (e.g. "Save $20 with coupon at checkout") that don't reduce the displayed price — track coupon presence separately if you care about effective price-to-customer rather than headline price.

## Related use cases

- [Track Amazon bestsellers by category](/blog/track-amazon-bestsellers-by-category)
- [Build an Amazon product research tool](/blog/build-amazon-product-research-tool)
- [Monitor Amazon competitor pricing and ratings](/blog/monitor-amazon-competitor-pricing-and-ratings)
- [The complete guide to scraping e-commerce data](/blog/guide-scraping-ecommerce)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to monitor Amazon prices?

Thirdwatch's Amazon Scraper charges $0.002 per product on the FREE tier and drops to $0.001 at GOLD volume — 2-5x cheaper than competing Amazon scrapers on Apify. A 50-query daily price-monitoring sweep at 100 results each costs $10 at FREE pricing. Hourly cadence is roughly $250/month — well below typical retail-monitoring SaaS subscriptions.

### Which Amazon marketplaces does the actor support?

19 country domains: US, UK, India, Germany, France, Spain, Italy, Canada, Japan, Australia, Brazil, Mexico, Netherlands, Singapore, Saudi Arabia, UAE, Poland, Sweden, Belgium. Pass the country code as the `country` input. Each marketplace has its own currency, prices, and Prime availability — the actor handles all of this automatically per request.

### Can I track the same product across multiple countries?

Yes. The same ASIN often exists across multiple Amazon marketplaces with different prices and Prime availability. Run the actor once per country with a search for the product (or with the ASIN as the query) and join the results by ASIN. This is the canonical pattern for cross-market price arbitrage analysis or brand-distribution monitoring.

### What's the right refresh cadence for price monitoring?

Hourly catches intra-day price changes that Amazon ships during peak shopping events (Prime Day, Black Friday). Daily catches everything else. Weekly is fine for trend analysis where you don't care about short-term volatility. For e-commerce ops monitoring competitor pricing, six-hourly is the practical sweet spot — captures most daily promotion windows without burning budget on hourly noise.

### How do I detect price drops vs Prime-status changes?

Persist each snapshot with timestamp; diff against the previous snapshot keyed by `(asin, domain)`. Compute `price_delta` and `is_prime_changed`. A price drop with no Prime change is a typical promotion; a price drop combined with a Prime add is often a Lightning Deal or Subscribe-and-Save activation. Track both as separate alert classes — they signal different competitor strategies.

### Are sponsored listings included?

Yes, mixed in with organic results just as Amazon presents them. Sponsored listings sometimes omit `reviews_count` or `rating` — a useful signal if you want to filter them out (treat null reviews as a sponsored hint). The actor returns whatever Amazon shows; downstream classification (organic vs sponsored) is a heuristic you tune to your use case.

Run the [Amazon Product Scraper on Apify Store](https://apify.com/thirdwatch/amazon-product-scraper) — pay-per-product, free to try, no credit card to test.
