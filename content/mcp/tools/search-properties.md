---
title: "search_properties"
description: "Property listings across NoBroker + MagicBricks + 99acres + CommonFloor (India). 8 credits."
path: "mcp/tools/search-properties/"
type: "mcp-tool"
toolName: "search_properties"
cluster: "real-estate"
clusterLabel: "Real estate"
costLabel: "8 credits"
actorsLabel: "nobroker-scraper, magicbricks-scraper, 99acres-scraper, commonfloor-scraper"
keywords: "india property api, nobroker scraper, magicbricks api, 99acres api, claude real estate mcp"
---

## search_properties

Cross-portal property search for India: NoBroker + MagicBricks + 99acres + CommonFloor. Listings deduplicated by lat-long + carpet-area to handle the multi-listing problem.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `city` | string | yes | "Bangalore", "Mumbai". |
| `locality` | string | no | Sub-locality. "Indiranagar", "HSR Layout". |
| `search_mode` | string | yes | `rent` or `sale`. |
| `bedrooms` | int | no | 1, 2, 3, 4… |
| `min_price` | int | no | Currency: INR. |
| `max_price` | int | no | Currency: INR. |
| `ready_to_move` | bool | no | Filter to RTM only. |
| `furnished` | string | no | `furnished` / `semi-furnished` / `unfurnished`. |
| `max_results` | int | no | Default 50. |

### Output

```json
{
  "city": "Bangalore",
  "locality": "HSR Layout",
  "search_mode": "sale",
  "bedrooms": 3,
  "results": [
    {
      "title": "3 BHK Apartment in HSR Layout",
      "address": "Sector 2, HSR Layout, Bangalore 560102",
      "price_inr": 22500000,
      "carpet_area_sqft": 1450,
      "bedrooms": 3,
      "bathrooms": 3,
      "ready_to_move": true,
      "furnished": "semi-furnished",
      "lat": 12.910,
      "lng": 77.638,
      "url": "...",
      "source": "magicbricks",
      "posted_at": "2026-04-12"
    }
  ],
  "by_source": {"nobroker": 18, "magicbricks": 22, "99acres": 9, "commonfloor": 3},
  "credits_charged": 8
}
```

### Example prompts in Claude

- "Find 3BHK flats in HSR Layout under ₹2.5 Cr, ready-to-move."
- "List 2BHK rentals in Indiranagar between ₹30K and ₹50K, semi-furnished."
- "Compare ask-prices for the same building across NoBroker / MagicBricks / 99acres."

### Suggested next

- [`analyze_property_market`](/mcp/tools/analyze-property-market/) — market summary stats.

### Underlying actors

NoBroker, MagicBricks, 99acres, CommonFloor.
