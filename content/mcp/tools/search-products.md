---
title: "search_products"
description: "Cross-marketplace product search: Amazon + AliExpress + Flipkart + Noon + Shopify. 4–10 credits."
path: "mcp/tools/search-products/"
type: "mcp-tool"
toolName: "search_products"
cluster: "ecommerce"
clusterLabel: "E-commerce"
costLabel: "4–10 credits"
actorsLabel: "amazon-scraper, aliexpress-scraper, flipkart-scraper, noon-scraper, shopify-scraper"
keywords: "amazon scraper api, aliexpress scraper api, flipkart api, noon scraper, cross marketplace product search, claude ecommerce mcp"
---

## search_products

Cross-marketplace product search. One query, multiple marketplaces, deduplicated by ASIN/SKU equivalents and image-hash.

Returns title, price, rating, image, review count, listing URL — per marketplace.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | Search query. "wireless earbuds", "silicone baby bibs". |
| `marketplaces` | array | yes | Subset of `amazon`, `aliexpress`, `flipkart`, `noon`, `shopify`. |
| `country` | string | no | ISO alpha-2. Routes Amazon/Noon to the right locale. |
| `max_results` | int | no | Per-marketplace cap. Default 25. |

### Output

```json
{
  "query": "silicone baby bib",
  "marketplaces": ["amazon", "noon"],
  "country": "AE",
  "results": [
    {
      "title": "Silicone Baby Bib with Pocket",
      "price_aed": 29.99,
      "price_usd": 8.16,
      "rating": 4.5,
      "reviews_count": 421,
      "image": "...",
      "url": "...",
      "marketplace": "amazon",
      "asin": "B0XXXXXX"
    }
  ],
  "by_marketplace": {"amazon": 24, "noon": 18},
  "credits_charged": 6
}
```

### Example prompts in Claude

- "Search 'wireless earbuds' on Amazon US, Flipkart India, Noon UAE. Top 30 each, sorted by review count."
- "Find silicone baby bibs across all 5 marketplaces. UAE-relevant pricing in AED."
- "Pull AirPods Pro 2 listings from Amazon, Flipkart, Noon, AliExpress for cross-region price comparison."

### Suggested next

- [`track_pricing`](/mcp/tools/track-pricing/) — pricing snapshot for one product.
- [`find_arbitrage`](/mcp/tools/find-arbitrage/) — find spread opportunities.

### Underlying actors

[Amazon scraper](https://apify.com/thirdwatch), AliExpress, Flipkart, Noon, Shopify. Amazon scraper has 90K+ users on the Apify Store.
