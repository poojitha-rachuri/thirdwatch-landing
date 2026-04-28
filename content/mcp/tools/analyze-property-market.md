---
title: "analyze_property_market"
description: "Market summary with median, p25, p75, listing counts, optional rental-yield computation. 6–12 credits."
path: "mcp/tools/analyze-property-market/"
type: "mcp-tool"
toolName: "analyze_property_market"
cluster: "real-estate"
clusterLabel: "Real estate"
costLabel: "6–12 credits"
actorsLabel: "nobroker-scraper, magicbricks-scraper, 99acres-scraper, commonfloor-scraper"
keywords: "india property analytics, rental yield calculator, market median price, claude property analytics mcp"
---

## analyze_property_market

City + locality + BHK summary stats. Returns median ask, p25, p50, p75, listing counts by source, and (optionally) gross rental yield computed from rent and sale listings for the same locality and BHK band.

The closest thing to live Knight Frank for India real estate.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `city` | string | yes | "Bangalore", "Mumbai". |
| `locality` | string | yes | Sub-locality. |
| `listing_type` | string | yes | `rent` / `sale`. |
| `country` | string | no | `IN` (default), `UK` (Rightmove). |
| `bedrooms` | int | no | 1, 2, 3, 4… |
| `compute_yield` | bool | no | If true, also pulls rent + sale and computes gross yield. |
| `max_results` | int | no | Default 200. Higher = more accurate medians. |

### Output

```json
{
  "city": "Bangalore",
  "locality": "Whitefield",
  "listing_type": "rent",
  "bedrooms": 2,
  "summary": {
    "median_ask_inr": 38000,
    "p25_inr": 32000,
    "p50_inr": 38000,
    "p75_inr": 45000,
    "listing_count": 247,
    "by_source": {"nobroker": 92, "magicbricks": 78, "99acres": 51, "commonfloor": 26}
  },
  "yield": {
    "median_sale_inr": 14500000,
    "median_rent_annual_inr": 456000,
    "gross_yield_pct": 3.14
  },
  "credits_charged": 12
}
```

### Example prompts in Claude

- "Median 2BHK rent in Indiranagar Bangalore, with p25 and p75."
- "Gross yield for buy-to-let 2BHK in Whitefield."
- "Weekly market report for DLF Phase 5 Gurgaon: median ask, listing count, week-over-week delta."

### Suggested next

- [`search_properties`](/mcp/tools/search-properties/) — listings under the median.

### Underlying actors

NoBroker, MagicBricks, 99acres, CommonFloor (India). Rightmove for UK.

### Note

Yield calculation is **gross** (annual rent / sale price). Net yield (after maintenance, vacancy, taxes) is your math.
