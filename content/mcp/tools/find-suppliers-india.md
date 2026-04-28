---
title: "find_suppliers_india"
description: "India suppliers from IndiaMart + JustDial cross-validated against the GST registry. 4–6 credits."
path: "mcp/tools/find-suppliers-india/"
type: "mcp-tool"
toolName: "find_suppliers_india"
cluster: "business"
clusterLabel: "Business / India sourcing"
costLabel: "4–6 credits"
actorsLabel: "indiamart-scraper, justdial-scraper, gst-scraper"
keywords: "india supplier api, indiamart suppliers, justdial wholesale, gst verified suppliers, claude india sourcing"
---

## find_suppliers_india

India-specific B2B sourcing tool. Pulls suppliers from IndiaMart + JustDial, optionally filtered by minimum order count and GST verification status.

This is the tool to use when you're a foreign buyer evaluating Indian vendors, or an Indian e-commerce operator looking for wholesale capacity.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `category` | string | yes | Product category. "cotton bedsheets", "PCB manufacturing". |
| `location` | string | no | Indian city or state. "Karur Tamil Nadu". |
| `min_orders` | int | no | Minimum monthly orders on IndiaMart. |
| `verified_gst` | bool | no | If true, cross-validates against GST registry. |
| `max_results` | int | no | Default 25. |

### Output

```json
{
  "category": "cotton bedsheets",
  "location": "Karur, Tamil Nadu",
  "results": [
    {
      "name": "ABC Textiles Pvt Ltd",
      "address": "...",
      "phone": "...",
      "indiamart_url": "...",
      "category": "Cotton Bed Sheets",
      "moq": "100 pieces",
      "monthly_orders": 421,
      "rating": 4.6,
      "gst": {"verified": true, "status": "Active", "legal_name": "ABC Textiles Pvt Ltd"},
      "year_established": 2014,
      "member_since": "2018"
    }
  ],
  "credits_charged": 5
}
```

### Example prompts in Claude

- "Find 20 cotton-bedsheet suppliers in Karur with verified GST and 100+ orders/month."
- "PCB manufacturers in Bangalore with GST active. I need 10."
- "Wholesale silicone-baby-bib suppliers in Yiwu — wait, I mean India. Mumbai. 50+ orders."

### Suggested next

- [`verify_business`](/mcp/tools/verify-business/) — deeper compliance check (GST + MCA + IBBI).
- [`search_businesses`](/mcp/tools/search-businesses/) — broader local-business search.

### Underlying actors

IndiaMart, JustDial, GST scrapers.
