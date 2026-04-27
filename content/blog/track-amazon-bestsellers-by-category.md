---
title: "Track Amazon Bestsellers by Category at Scale (2026)"
slug: "track-amazon-bestsellers-by-category"
description: "Detect rising Amazon products at $0.002 per record using Thirdwatch's Amazon Scraper. Velocity ranking + category-mix recipes across 19 marketplaces."
actor: "amazon-product-scraper"
actor_url: "https://apify.com/thirdwatch/amazon-product-scraper"
actorTitle: "Amazon Product Scraper"
category: "ecommerce"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-amazon-products-for-price-monitoring"
  - "build-amazon-product-research-tool"
  - "monitor-amazon-competitor-pricing-and-ratings"
keywords:
  - "amazon bestseller tracking"
  - "amazon trending products"
  - "amazon category research"
  - "amazon product velocity"
faqs:
  - q: "Why track Amazon bestsellers programmatically?"
    a: "Amazon bestseller rankings shift rapidly — sometimes hourly within a category. According to Amazon's 2024 marketplace data, the top 100 in any category turns over 30-40% in any given month. For e-commerce sellers, brand teams, dropshippers, and product researchers, programmatic tracking surfaces rising products before they peak, enabling timely inventory decisions, partnership outreach, or competitive responses."
  - q: "How does this differ from price monitoring?"
    a: "Price monitoring tracks the same SKUs over time. Bestseller tracking surfaces NEW SKUs entering the top performers — a different question entirely. Run both in parallel: price monitoring tells you what your watchlist is doing, bestseller tracking tells you what should be on your watchlist. The same Thirdwatch Amazon Scraper handles both with different query patterns."
  - q: "What signals identify a rising bestseller?"
    a: "Three: (1) review-count velocity (week-over-week growth in reviews_count exceeding 30% indicates active customer purchasing). (2) rating stability above 4.3 (rapid review-count growth with rating dropping below 4.0 signals quality issues, not legitimate momentum). (3) Prime availability (new entrants without is_prime: true rarely sustain bestseller positions for long). Combined, these three filter the genuine rising-bestseller signal from sponsored-listing noise."
  - q: "How often should I refresh bestseller tracking?"
    a: "Weekly cadence is the standard for trend detection. Daily catches noise (Amazon's algorithm rotates rankings hourly during prime shopping windows); monthly is too coarse to catch fast-moving categories like consumer electronics or beauty. Weekly Sunday-night snapshots align with how Amazon's category leaderboards stabilise over weekends."
  - q: "Can I track bestsellers across multiple Amazon marketplaces?"
    a: "Yes. The actor supports 19 country marketplaces. Run parallel queries with country=us, uk, in, de, fr, jp etc. and compare bestseller composition by market. Cross-market analysis reveals which products are launching globally vs locally, which categories are saturated in mature markets but rising in emerging ones, and where arbitrage opportunities exist for cross-border sellers."
  - q: "How does this differ from Amazon's own bestseller pages?"
    a: "Amazon publishes bestseller rankings at amazon.com/Best-Sellers/ but doesn't expose them as structured data. The Thirdwatch actor returns search-results data (sorted by relevance, which approximates bestseller-style ranking for category keyword queries) with full structured metadata — rating, reviews_count, is_prime, price, ASIN — ready for trend analysis. For the literal bestseller list, scrape the bestseller pages with our actor by passing those URLs as queries."
---

> Thirdwatch's [Amazon Product Scraper](https://apify.com/thirdwatch/amazon-product-scraper) feeds a structured bestseller-tracking pipeline at $0.002 per record — weekly snapshot category keyword searches across 19 marketplaces, compute review-count velocity, surface rising products before they peak. Built for e-commerce ops watching category trends, brand teams monitoring competitor launches, dropshippers researching opportunities, and market analysts studying Amazon marketplace dynamics.

## Why track Amazon bestsellers by category

Amazon bestseller rankings move fast. According to [Amazon's 2024 marketplace disclosures](https://www.aboutamazon.com/news/), the platform processed over $620B in gross merchandise volume across 19 marketplaces with hundreds of millions of unique SKUs — and category leaderboards turn over 30-40% of their top 100 within any given month. For e-commerce ops planning inventory, brand teams watching competitor launches, and dropshippers researching opportunities, programmatic bestseller tracking is the leading-indicator data layer.

The job-to-be-done is structured. An e-commerce ops team monitors 30 product categories weekly to time their own inventory decisions against rising competitor products. A brand team watches their category for new entrants gaining review velocity above 30% week-over-week. A dropshipper researches which categories are seeing fresh winners worth listing. A market analyst studies cross-market bestseller divergence (US Top-50 vs UK Top-50) to inform pricing and merchandising strategy. All reduce to category keyword + country + maxResults pulls returning structured product rows ready for velocity analysis.

## How does this compare to the alternatives?

Three options for getting Amazon bestseller-tracking data into a pipeline:

| Approach | Cost per 1,000 products × weekly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Amazon Best Sellers browsing | Effectively unbounded analyst time | Low (sampling bias) | Continuous | Doesn't scale |
| Paid Amazon-research SaaS (Helium 10, Jungle Scout, Sellics) | $50–$300/month per seat | High, includes ranking analytics | Hours | Per-seat licensing |
| Thirdwatch Amazon Scraper | $2 ($0.002 × 1,000) | Production-tested across 19 marketplaces | 5 minutes | Thirdwatch tracks Amazon changes |

Helium 10 and Jungle Scout offer Amazon-specific dashboards bundled with seller tools. The [Amazon Scraper actor page](/scrapers/amazon-product-scraper) gives you the raw weekly data layer at meaningfully lower unit cost, with full schema control for custom analytics.

## How to track Amazon bestsellers in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I take a weekly snapshot of bestsellers per category?

Pass category keywords as queries; Amazon's search is relevance-ranked, which approximates bestseller order for broad category terms.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~amazon-product-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CATEGORIES = ["wireless headphones", "smartwatch", "robot vacuum",
              "air fryer", "yoga mat", "mechanical keyboard",
              "gaming mouse", "standing desk", "kindle ereader",
              "portable monitor"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": CATEGORIES, "country": "us", "maxResults": 100},
    timeout=600,
)
records = resp.json()
week = datetime.date.today().isocalendar()
ts = f"{week.year}-W{week.week:02d}"
pathlib.Path(f"snapshots/amazon-bestsellers-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} products across {len(CATEGORIES)} categories")
```

10 categories × 100 results = 1,000 records per weekly snapshot, costing $2.

### Step 3: How do I detect rising products via review-count velocity?

Aggregate snapshots; track `reviews_count` change per ASIN week-over-week.

```python
import pandas as pd, glob, re

def parse_count(s):
    if not s:
        return None
    digits = re.sub(r"[^\d]", "", str(s))
    return int(digits) if digits else None

frames = []
for f in sorted(glob.glob("snapshots/amazon-bestsellers-*.json")):
    week = pathlib.Path(f).stem.replace("amazon-bestsellers-", "")
    for j in json.loads(pathlib.Path(f).read_text()):
        frames.append({
            "week": week,
            "asin": j.get("asin"),
            "title": j.get("title"),
            "rating": j.get("rating"),
            "reviews_count": parse_count(j.get("reviews_count")),
            "is_prime": j.get("is_prime"),
            "price": j.get("price"),
        })

df = pd.DataFrame(frames).dropna(subset=["asin", "reviews_count"])

# Compute review velocity: rate of new reviews per week
pivot = df.pivot_table(index=["asin", "title"], columns="week",
                       values="reviews_count", aggfunc="first").fillna(method="ffill", axis=1)
weeks = sorted(pivot.columns)
if len(weeks) >= 2:
    pivot["wow_growth"] = pivot[weeks[-1]] - pivot[weeks[-2]]
    pivot["wow_pct"] = pivot.wow_growth / pivot[weeks[-2]].clip(lower=1)
    movers = pivot[
        (pivot[weeks[-1]] >= 100)
        & (pivot.wow_pct >= 0.30)
    ].sort_values("wow_pct", ascending=False)
    print(movers[[weeks[-2], weeks[-1], "wow_growth", "wow_pct"]].head(15))
```

A product gaining 30%+ in review count within a week with at least 100 baseline reviews is in active velocity ramp — the canonical "rising bestseller" signal.

### Step 4: How do I cross-validate with rating and Prime availability?

Filter velocity movers by rating ≥ 4.3 and Prime status to remove sponsored-listing noise and quality-issue false positives.

```python
qualified_movers = df[df.asin.isin(movers.index.get_level_values(0))]
qualified_movers = qualified_movers[
    (qualified_movers.rating >= 4.3)
    & (qualified_movers.is_prime == True)
    & (qualified_movers.week == weeks[-1])
]

print(f"Validated rising bestsellers: {len(qualified_movers)}")
print(qualified_movers[["title", "rating", "reviews_count",
                         "is_prime", "price"]].head(15))
```

Forward newly-validated movers to a Slack channel for product-research review, and persist in a Postgres database for longitudinal trend analysis.

## Sample output

A single record from the dataset for one trending product looks like this. Five rows of this shape weigh ~3 KB.

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

`asin` is the canonical primary key for trend tracking; `reviews_count` is the velocity signal. `rating` filters quality-issue false positives — a product with rapidly-growing reviews but rating dropping below 4.0 typically indicates a manufacturing defect or unfulfilled-promise scam, not legitimate momentum. `is_prime` flag indicates whether the product is fulfilled by Amazon — rising bestsellers without Prime rarely sustain top positions.

## Common pitfalls

Three things go wrong in production bestseller-tracking pipelines. **Sponsored-listing noise** — Amazon mixes sponsored placements into search results; sponsored products often show fewer reviews than organic top-rankers, so filtering on `reviews_count >= 100` cuts most sponsored noise. **New-product cold-start** — products launched in the last 30 days have low review baselines that produce wild week-over-week percentage changes; either filter to products with `reviews_count >= 500` baseline or use absolute review-count growth thresholds rather than percentages. **Cross-marketplace ASIN reuse** — the same ASIN can have different reviews_count across `amazon.com` and `amazon.co.uk` because each marketplace has its own review database; group by `(asin, domain)` rather than asin alone for cross-market analysis.

Thirdwatch's actor returns `domain` and `asin` on every record so cross-marketplace dedup and grouping are clean. The pure-HTTP architecture means a 1,000-product weekly snapshot completes in under five minutes and costs $2 — small enough to run across 30+ categories without budget consideration. Pair Amazon with our [Flipkart Scraper](https://apify.com/thirdwatch/flipkart-products-scraper) for cross-marketplace India e-commerce trend analysis or [AliExpress Scraper](https://apify.com/thirdwatch/aliexpress-product-scraper) for sourcing-side bestseller research. A fourth subtle issue worth flagging: Amazon's review_count counter is sticky in the search-results layer (sometimes 6-24 hours behind the detail page), so for absolute-precision velocity tracking on top-rank-sensitive categories, fetch the specific ASIN URLs via the actor at the start of each tracking week to refresh review counts directly. A fifth pattern: seasonal categories (Halloween costumes, Christmas decor, summer gear) show massive seasonal swings that distort year-over-year baselines; segment your trend dashboards by season-aware categories rather than treating them as steady-state.

## Related use cases

- [Scrape Amazon products for price monitoring](/blog/scrape-amazon-products-for-price-monitoring)
- [Build an Amazon product research tool](/blog/build-amazon-product-research-tool)
- [Monitor Amazon competitor pricing and ratings](/blog/monitor-amazon-competitor-pricing-and-ratings)
- [The complete guide to scraping e-commerce data](/blog/guide-scraping-ecommerce)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track Amazon bestsellers programmatically?

Amazon bestseller rankings shift rapidly — sometimes hourly within a category. According to Amazon's 2024 marketplace data, the top 100 in any category turns over 30-40% in any given month. For e-commerce sellers, brand teams, dropshippers, and product researchers, programmatic tracking surfaces rising products before they peak, enabling timely inventory decisions, partnership outreach, or competitive responses.

### How does this differ from price monitoring?

Price monitoring tracks the same SKUs over time. Bestseller tracking surfaces NEW SKUs entering the top performers — a different question entirely. Run both in parallel: price monitoring tells you what your watchlist is doing, bestseller tracking tells you what should be on your watchlist. The same Thirdwatch Amazon Scraper handles both with different query patterns.

### What signals identify a rising bestseller?

Three: (1) review-count velocity (week-over-week growth in `reviews_count` exceeding 30% indicates active customer purchasing). (2) rating stability above 4.3 (rapid review-count growth with rating dropping below 4.0 signals quality issues, not legitimate momentum). (3) Prime availability (new entrants without `is_prime: true` rarely sustain bestseller positions for long). Combined, these three filter the genuine rising-bestseller signal from sponsored-listing noise.

### How often should I refresh bestseller tracking?

Weekly cadence is the standard for trend detection. Daily catches noise (Amazon's algorithm rotates rankings hourly during prime shopping windows); monthly is too coarse to catch fast-moving categories like consumer electronics or beauty. Weekly Sunday-night snapshots align with how Amazon's category leaderboards stabilise over weekends.

### Can I track bestsellers across multiple Amazon marketplaces?

Yes. The actor supports 19 country marketplaces. Run parallel queries with `country=us`, `uk`, `in`, `de`, `fr`, `jp` etc. and compare bestseller composition by market. Cross-market analysis reveals which products are launching globally vs locally, which categories are saturated in mature markets but rising in emerging ones, and where arbitrage opportunities exist for cross-border sellers.

### How does this differ from Amazon's own bestseller pages?

Amazon publishes bestseller rankings at [amazon.com/Best-Sellers/](https://www.amazon.com/Best-Sellers/zgbs) but doesn't expose them as structured data. The Thirdwatch actor returns search-results data (sorted by relevance, which approximates bestseller-style ranking for category keyword queries) with full structured metadata — rating, reviews_count, is_prime, price, ASIN — ready for trend analysis. For the literal bestseller list, scrape the bestseller pages with our actor by passing those URLs as queries.

Run the [Amazon Product Scraper on Apify Store](https://apify.com/thirdwatch/amazon-product-scraper) — pay-per-product, free to try, no credit card to test.
