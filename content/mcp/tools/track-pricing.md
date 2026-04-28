---
title: "track_pricing"
description: "One product, multiple marketplaces — instant pricing snapshot. 4–8 credits."
path: "mcp/tools/track-pricing/"
type: "mcp-tool"
toolName: "track_pricing"
cluster: "ecommerce"
clusterLabel: "E-commerce"
costLabel: "4–8 credits"
actorsLabel: "amazon-scraper, aliexpress-scraper, flipkart-scraper, noon-scraper, shopify-scraper"
keywords: "price tracking api, multi marketplace pricing, competitor pricing mcp, claude price monitor"
---

## track_pricing

Pricing snapshot for one product across multiple marketplaces. Use it to monitor a competitor's listing weekly, build a price-drift alert, or just check "is my price competitive?"

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `product_query` | string | yes | Product title or specific URL. |
| `marketplaces` | array | yes | Subset of `amazon`, `aliexpress`, `flipkart`, `noon`, `shopify`. |
| `country` | string | no | ISO alpha-2. |
| `max_results` | int | no | Top-N matches per marketplace. Default 5. |

### Output

```json
{
  "product_query": "AirPods Pro 2",
  "snapshot": [
    {"marketplace": "amazon", "country": "US", "price_usd": 199.00, "rating": 4.8, "url": "..."},
    {"marketplace": "flipkart", "country": "IN", "price_inr": 21900, "price_usd": 263.00, "rating": 4.6, "url": "..."},
    {"marketplace": "noon", "country": "AE", "price_aed": 949, "price_usd": 258.45, "rating": 4.7, "url": "..."},
    {"marketplace": "aliexpress", "country": "global", "price_usd": 145.00, "rating": 4.4, "url": "..."}
  ],
  "spread_pct": 81.4,
  "credits_charged": 6
}
```

### Example prompts in Claude

- "Snapshot AirPods Pro 2 pricing across Amazon US, Flipkart, Noon UAE, AliExpress. Convert to USD."
- "Track this Flipkart URL weekly. Alert if price drops &gt;15%."
- "Compare my listing's price against the top 5 competing listings on Amazon US."

### Suggested next

- [`search_products`](/mcp/tools/search-products/) — broad cross-marketplace search.
- [`find_arbitrage`](/mcp/tools/find-arbitrage/) — find listings to flip.

### Underlying actors

Amazon, AliExpress, Flipkart, Noon, Shopify.
