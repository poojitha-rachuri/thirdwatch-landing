---
title: "The Complete Guide to Scraping E-commerce Marketplaces (2026)"
slug: "guide-scraping-ecommerce"
description: "Pick the right Thirdwatch scraper for any ecommerce use case — Amazon, Flipkart, AliExpress, Noon, Shopify. Decision tree + cross-marketplace recipes."
actor: "amazon-product-scraper"
actor_url: "https://apify.com/thirdwatch/amazon-scraper"
actorTitle: "Thirdwatch Ecommerce Scrapers"
category: "ecommerce"
audience: "operators"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-amazon-products-for-price-monitoring"
  - "scrape-flipkart-products-for-india-ecommerce"
  - "build-amazon-product-research-tool"
keywords:
  - "scrape ecommerce marketplaces"
  - "amazon vs flipkart scraper"
  - "ecommerce data api"
  - "marketplace pricing scraper"
faqs:
  - q: "Which marketplace gives the best pricing data?"
    a: "Amazon for global breadth (200M+ ASINs, BSR + monthly-sold visible). Flipkart for India breadth and price-sensitive segments. AliExpress for sourcing-cost research (China supplier prices). Noon for UAE/MENA. Shopify for D2C brand-direct research. Most operators run Amazon + 1-2 regional marketplaces depending on target audience."
  - q: "How does niche-opportunity scoring differ across marketplaces?"
    a: "Same four-condition filter applies everywhere: (1) product count tractable (50-500); (2) median rating 3.8-4.3 (quality gap); (3) median reviews 100+ (real demand); (4) top-brand share <0.4 (no monopolist). Tune review thresholds by marketplace — Amazon US needs 200+ reviews for noise filtering, Flipkart needs 100+, AliExpress needs 50+ (lower-trust marketplace, fewer reviews per product)."
  - q: "Can I track prices across marketplaces?"
    a: "Yes. Amazon's `asin` is canonical for Amazon-only; cross-marketplace requires fuzzy matching on (title-norm, brand-norm, primary-image-hash). About 30-50% of branded products have parallel listings across Amazon + Flipkart in India; cross-marketplace price comparison reveals 5-15% baseline divergence (Flipkart cheaper for non-brand, Amazon cheaper for branded electronics)."
  - q: "How fresh does pricing data need to be?"
    a: "For active sellers in price-competitive categories (electronics, mobile, books), daily cadence is the minimum; many operators run 6-hourly. For evergreen categories (kitchen, pet supplies), daily is sufficient. For Big Billion Day / Prime Day windows, 30-minute cadence catches flash deals. For research-only use cases, weekly cadence captures the meaningful patterns."
  - q: "What about counterfeit detection?"
    a: "Three signals: (1) abnormally low price for branded SKU (>30% below brand-direct MSRP); (2) seller-name mismatch with brand-authorized seller list; (3) review velocity inflation (50+ reviews in 7 days at low rating). For brand-protection teams, daily ASIN watchlist on top SKUs + seller-name alerts catches most counterfeit listings within 24 hours of posting."
  - q: "How does this compare to Jungle Scout / Helium 10?"
    a: "Jungle Scout and Helium 10 are Amazon-focused at $50-$200/month per seat. Their estimation models for sales volume and BSR-to-units conversion are proprietary. The actor delivers raw data at $2/1K records — for cross-marketplace research, platform builders, or high-volume operators, raw data is materially more flexible. For individual Amazon sellers, the SaaS tools win on UX."
---

> Thirdwatch publishes 5 ecommerce-marketplace scrapers covering Amazon (global + India), Flipkart (India), AliExpress (China supplier-side), Noon (UAE/MENA), and Shopify (D2C brand-direct). This guide is the decision tree for picking the right one (or combination) for your use case — competitive monitoring, niche research, deal-aggregator, supplier sourcing, brand protection.

## The ecommerce-scraping landscape

Marketplace coverage is regional and category-specific. According to [Marketplace Pulse's 2024 report](https://www.marketplacepulse.com/), Amazon dominates US/UK/EU global ecommerce with 50%+ share, while Flipkart leads non-metro India, Noon dominates UAE/Saudi, and AliExpress is the canonical wholesale-supplier discovery surface globally. No single marketplace covers all geographies — production research stacks layer 2-4 sources.

For an operator (FBA seller, D2C brand), the right answer is usually Amazon + 1 regional marketplace per target geography. For a platform builder (price-comparison SaaS, deal aggregator), 3-5 marketplaces. For sourcing research (where to buy wholesale), AliExpress is essential.

## Compare Thirdwatch ecommerce scrapers

| Scraper | Coverage | Approach | Cost/1K | Best for |
|---|---|---|---|---|
| [Amazon](/scrapers/amazon-scraper) | Global, 200M ASINs | HTTP + datacenter proxy | $2 | Global pricing, BSR research |
| [Flipkart](/scrapers/flipkart-scraper) | India broad | impit + residential | $3 | India ecommerce, deals |
| [AliExpress](/scrapers/aliexpress-scraper) | China supplier-side | HTTP + residential | $3 | Sourcing cost research |
| [Noon](/scrapers/noon-scraper) | UAE/Saudi | Camoufox + residential | $2 | MENA ecommerce |
| [Shopify](/scrapers/shopify-scraper) | D2C brand-direct | HTTP | $1 | Brand-store research |
| [Shopify Reviews](/scrapers/shopify-reviews-scraper) | D2C reviews | HTTP | $2 | Product-quality signal |

## Decision tree

**"I'm an FBA seller scoping a niche."** Amazon (price + BSR + reviews) + Jungle Scout / Helium 10 sales-velocity model. For category-level structure (top-brand share, price-band fit), the Amazon scraper alone produces opportunity scores. Run weekly snapshots + daily during niche-evaluation windows.

**"I'm a D2C founder scoping a category."** Amazon (where mass-market shops) + Shopify (where peer D2C brands live) + Shopify Reviews (review-quality signal of competitors). Ignore AliExpress for product-research; it's a supplier surface, not a customer surface.

**"I'm building a price-comparison SaaS."** Amazon + Flipkart + Noon (cover US/India/MENA). Cross-marketplace dedup on `(title-norm, brand-norm, image-hash)`. Run daily snapshots, weekly aggregations.

**"I'm sourcing products to resell."** AliExpress for wholesale-cost discovery + Amazon for retail-price benchmarking. Compute `gross_margin = (amazon_retail - aliexpress_wholesale) / aliexpress_wholesale`. Margins above 200% are typical reseller targets.

**"I'm a brand-protection team."** Amazon (counterfeit detection on flagship ASINs) + Flipkart for India + Shopify for branded-domain monitoring. Daily ASIN watchlist + seller-name allowlist alerts.

## Cross-marketplace recipe: India price-arbitrage detection

```python
import os, requests, pandas as pd

TOKEN = os.environ["APIFY_TOKEN"]

def run(actor, payload, timeout=3600):
    r = requests.post(
        f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items",
        params={"token": TOKEN}, json=payload, timeout=timeout
    )
    return r.json()

PRODUCTS = ["boat stone bluetooth speaker", "noise smartwatch",
            "mi water purifier", "philips trimmer"]

amazon = run("thirdwatch~amazon-product-scraper",
             {"queries": PRODUCTS, "country": "in", "maxResults": 50})
flipkart = run("thirdwatch~flipkart-products-scraper",
               {"queries": PRODUCTS, "maxResults": 50})

amz = pd.DataFrame(amazon).assign(marketplace="amazon")
fk = pd.DataFrame(flipkart).assign(marketplace="flipkart")

# Normalize
for d in [amz, fk]:
    d["price_inr"] = pd.to_numeric(
        d.price.astype(str).str.replace(r"[₹$,]", "", regex=True),
        errors="coerce"
    )
    d["title_norm"] = d.title.str.lower().str.replace(r"[^a-z0-9 ]", "", regex=True)
    d["brand_norm"] = d.brand.str.lower().str.strip() if "brand" in d.columns else None

# Fuzzy join on title-prefix overlap
merged = amz.merge(fk, on="title_norm", suffixes=("_amz", "_fk"), how="inner")
merged["arbitrage_pct"] = (merged.price_inr_amz - merged.price_inr_fk) / merged.price_inr_fk

opportunities = merged[merged.arbitrage_pct.abs() > 0.10]
print(f"{len(opportunities)} cross-marketplace price gaps >10%")
print(opportunities[["title_norm", "price_inr_amz", "price_inr_fk", "arbitrage_pct"]].head(15))
```

A 10%+ gap in either direction typically reflects either inventory-clearance pricing or marketplace-specific promo windows.

## All use-case guides for ecommerce scrapers

### Amazon
- [Scrape Amazon products for price monitoring](/blog/scrape-amazon-products-for-price-monitoring)
- [Track Amazon bestsellers by category](/blog/track-amazon-bestsellers-by-category)
- [Build an Amazon product research tool](/blog/build-amazon-product-research-tool)
- [Monitor Amazon competitor pricing and ratings](/blog/monitor-amazon-competitor-pricing-and-ratings)

### Flipkart
- [Scrape Flipkart products for India ecommerce](/blog/scrape-flipkart-products-for-india-ecommerce)
- [Track Flipkart prices vs Amazon India](/blog/track-flipkart-prices-vs-amazon-india)
- [Build a Flipkart product research pipeline](/blog/build-flipkart-product-research-pipeline)
- [Monitor Flipkart deals and discounts](/blog/monitor-flipkart-deals-and-discounts)

(More AliExpress, Noon, Shopify use-case guides in Wave 3.)

## Common patterns across ecommerce scrapers

**Canonical natural keys.**
- Amazon: `asin`
- Flipkart: `product_id` (FSN)
- AliExpress: `productId`
- Noon: `sku`
- Shopify: `(domain, handle)`

**Price normalization.** Strip currency symbols + commas, convert to numeric. For multi-currency cross-marketplace work, convert to a common currency (USD typically) at scrape-time exchange rate.

**Out-of-stock handling.** Always combine `in_stock: true` filter with price/rating delta detection. Out-of-stock products show $0 or removed-listing rather than real price drops.

**Rating-bombing detection.** Cross-check rating drops against new-reviews-this-week velocity. Genuine quality issues correlate with sustained review-volume increase; coordinated attacks correlate with concentrated bursts.

**MRP-vs-price misuse (India).** Sellers inflate MRP to display fake discounts. Anchor against historical MRP across snapshots rather than treating displayed MRP as truth.

## Operational best practices for production pipelines

A handful of patterns matter more than the per-actor specifics once you're running these scrapers in production at scale.

**Tier the cadence to match signal half-life.** Daily polling is canonical for monitoring use cases (price drift, hiring velocity, brand mentions), but most teams over-poll long-tail watchlist items. Tier the watchlist into Tier 1 (high-stakes, hourly), Tier 2 (active monitoring, daily), Tier 3 (research-only, weekly). Typical 60-80% cost reduction with negligible signal loss.

**Snapshot raw payloads alongside derived fields.** Pipeline cost is dominated by scrape volume, not storage. Persisting the raw JSON response per snapshot lets you re-derive metrics without re-scraping when your sentiment model improves, your category-classifier evolves, or you discover a previously-ignored field. Compress with gzip at write-time (4-8x size reduction).

**Three-tier retention.** Most production pipelines run: 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series. Storage costs stay flat at scale; query patterns map cleanly to the right retention tier.

**Cross-source dedup via the canonical 4-tuple.** Across-source dedup (LinkedIn vs Indeed vs Google Jobs; Talabat vs Deliveroo vs Noon Food; Trustpilot vs G2) typically uses `(name-norm, location-norm, identifier-norm, key-numeric)`. Within-source dedup uses each platform's stable natural key (place_id, asin, videoId, shortcode, etc.). Both are essential — get either wrong and metrics become noisy.

**Validate live before declaring fields stable.** Schemas drift. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day.

**Tag scrape timestamps in every record.** Platform-displayed timestamps lag actual events by minutes-to-hours. For accurate freshness analysis, treat `(platform_timestamp, scrape_timestamp)` as a tuple — the larger of the two is your "actively-listed since" anchor, the smaller is your "first-detected" anchor.

## Frequently asked questions

### Which marketplace gives the best pricing data?

Amazon for global breadth (200M+ ASINs, BSR + monthly-sold visible). Flipkart for India breadth and price-sensitive segments. AliExpress for sourcing-cost research (China supplier prices). Noon for UAE/MENA. Shopify for D2C brand-direct research. Most operators run Amazon + 1-2 regional marketplaces depending on target audience.

### How does niche-opportunity scoring differ across marketplaces?

Same four-condition filter applies everywhere: (1) product count tractable (50-500); (2) median rating 3.8-4.3 (quality gap); (3) median reviews 100+ (real demand); (4) top-brand share <0.4 (no monopolist). Tune review thresholds by marketplace — Amazon US needs 200+ reviews for noise filtering, Flipkart needs 100+, AliExpress needs 50+ (lower-trust marketplace, fewer reviews per product).

### Can I track prices across marketplaces?

Yes. Amazon's `asin` is canonical for Amazon-only; cross-marketplace requires fuzzy matching on `(title-norm, brand-norm, primary-image-hash)`. About 30-50% of branded products have parallel listings across Amazon + Flipkart in India; cross-marketplace price comparison reveals 5-15% baseline divergence (Flipkart cheaper for non-brand, Amazon cheaper for branded electronics).

### How fresh does pricing data need to be?

For active sellers in price-competitive categories (electronics, mobile, books), daily cadence is the minimum; many operators run 6-hourly. For evergreen categories (kitchen, pet supplies), daily is sufficient. For Big Billion Day / Prime Day windows, 30-minute cadence catches flash deals. For research-only use cases, weekly cadence captures the meaningful patterns.

### What about counterfeit detection?

Three signals: (1) abnormally low price for branded SKU (>30% below brand-direct MSRP); (2) seller-name mismatch with brand-authorized seller list; (3) review velocity inflation (50+ reviews in 7 days at low rating). For brand-protection teams, daily ASIN watchlist on top SKUs + seller-name alerts catches most counterfeit listings within 24 hours of posting.

### How does this compare to Jungle Scout / Helium 10?

[Jungle Scout](https://www.junglescout.com/) and [Helium 10](https://www.helium10.com/) are Amazon-focused at $50-$200/month per seat. Their estimation models for sales volume and BSR-to-units conversion are proprietary. The actor delivers raw data at $2/1K records — for cross-marketplace research, platform builders, or high-volume operators, raw data is materially more flexible. For individual Amazon sellers, the SaaS tools win on UX.

Browse all [Thirdwatch scrapers on Apify Store](https://apify.com/thirdwatch) — pay-per-result, free to try, no credit card to test.
