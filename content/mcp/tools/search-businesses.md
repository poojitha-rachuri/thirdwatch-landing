---
title: "search_businesses"
description: "Local business search: Google Maps + JustDial + IndiaMart with phone, address, ratings. 1–3 credits."
path: "mcp/tools/search-businesses/"
type: "mcp-tool"
toolName: "search_businesses"
cluster: "business"
clusterLabel: "Business / local"
costLabel: "1–3 credits"
actorsLabel: "google-maps-scraper, justdial-scraper, indiamart-scraper"
keywords: "google maps api scraper, justdial api, indiamart api, local business search mcp, claude business search"
---

## search_businesses

Local business search across Google Maps + JustDial (India) + IndiaMart (India). Returns name, address, phone, website, ratings, hours.

Cheap and global. The default tool for any "find me X local businesses in Y" query.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | What you're looking for. "plumbers", "yoga studios", "PCB manufacturers". |
| `location` | string | yes | City or region. "Austin TX", "Mumbai", "Dubai Marina". |
| `country` | string | no | ISO alpha-2. Routes to country-specific sources. |
| `max_results` | int | no | Default 30. |

### Output

```json
{
  "query": "plumbers",
  "location": "Austin, TX",
  "results": [
    {
      "name": "ABC Plumbing Co.",
      "address": "123 Main St, Austin, TX 78701",
      "phone": "+1-512-555-0100",
      "website": "abcplumbing.com",
      "rating": 4.8,
      "reviews_count": 421,
      "hours": "Mon-Fri 8am-6pm",
      "lat": 30.267,
      "lng": -97.743,
      "source": "google_maps"
    }
  ],
  "credits_charged": 2
}
```

### Example prompts in Claude

- "Find 30 plumbing businesses in Austin TX with phone and rating."
- "Pull all PCB manufacturers in Bangalore from JustDial and IndiaMart, deduplicated."
- "List 50 yoga studios in Dubai Marina with Google Maps ratings."

### Suggested next

- [`verify_business`](/mcp/tools/verify-business/) — confirm GST/MCA for India businesses.
- [`enrich_company`](/mcp/tools/enrich-company/) — add reviews + employer ratings.
- [`find_suppliers_india`](/mcp/tools/find-suppliers-india/) — for B2B sourcing in India.

### Underlying actors

[Google Maps](https://apify.com/thirdwatch), JustDial, IndiaMart. Google Maps actor has 350K+ users on the Apify Store.
