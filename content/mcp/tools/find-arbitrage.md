---
title: "find_arbitrage"
description: "AliExpress→Amazon/Noon margin opportunities, sortable by spread. 4–8 credits."
path: "mcp/tools/find-arbitrage/"
type: "mcp-tool"
toolName: "find_arbitrage"
cluster: "ecommerce"
clusterLabel: "E-commerce"
costLabel: "4–8 credits"
actorsLabel: "aliexpress-scraper, amazon-scraper, noon-scraper"
keywords: "aliexpress amazon arbitrage, ecommerce arbitrage api, dropshipping mcp, claude arbitrage finder"
---

## find_arbitrage

AliExpress → Amazon (or Noon) margin opportunity finder. Pulls candidate products from AliExpress, matches against Amazon/Noon listings of the same product, and sorts by spread (margin %).

Use it for dropshipping research, FBA sourcing, and Amazon/Noon competitive flips.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `category` | string | yes | Category or query. "silicone kitchen tools". |
| `source_market` | string | yes | Currently `aliexpress`. |
| `target_market` | string | yes | `amazon-us`, `amazon-uk`, `noon-uae`, `noon-saudi`. |
| `max_results` | int | no | Default 20. |

### Output

```json
{
  "category": "silicone kitchen tools",
  "source_market": "aliexpress",
  "target_market": "amazon-us",
  "results": [
    {
      "title": "Silicone Spatula Set, 5pc",
      "aliexpress_url": "...",
      "aliexpress_price_usd": 3.40,
      "ali_orders": 4900,
      "amazon_url": "...",
      "amazon_price_usd": 14.99,
      "amazon_rating": 4.5,
      "amazon_reviews": 8421,
      "amazon_bsr": 2843,
      "spread_usd": 11.59,
      "margin_pct": 77.3
    }
  ],
  "credits_charged": 8
}
```

### Example prompts in Claude

- "Find AliExpress → Amazon US arbitrage in silicone kitchen tools, &gt;50% margin, BSR &lt; 10K."
- "Find dropshipping candidates: AliExpress → Noon UAE, baby category, 30+ orders on Ali."
- "I want 10 SKUs to flip from AliExpress to Amazon UK. Sort by margin descending."

### Suggested next

- [`search_products`](/mcp/tools/search-products/) — explore each candidate further.
- [`track_pricing`](/mcp/tools/track-pricing/) — monitor your candidate listings post-launch.

### Underlying actors

AliExpress, Amazon, Noon. Note: AliExpress requires residential proxy — already handled by the underlying actor.
