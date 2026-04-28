---
title: "verify_business"
description: "India compliance check: GST, MCA, IBBI registration status. 1–2 credits."
path: "mcp/tools/verify-business/"
type: "mcp-tool"
toolName: "verify_business"
cluster: "business"
clusterLabel: "Business / India compliance"
costLabel: "1–2 credits"
actorsLabel: "gst-scraper, mca-scraper, ibbi-scraper"
keywords: "gst verification api, mca india lookup, ibbi check api, indian business verification mcp"
---

## verify_business

India business verification. Pass a GSTIN, CIN, or PAN; get back active/inactive status from the GST registry, MCA company master, and IBBI insolvency registry.

Use it before sending an invoice (GST-active?), before shipping product on credit (MCA-struck-off?), or before pitching (IBBI-resolution?).

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `country` | string | yes | Currently `IN`-only. |
| `identifier` | string | yes | GSTIN, CIN, PAN, or business name. |

### Output

```json
{
  "country": "IN",
  "identifier": "29AAACR5055K1Z5",
  "gst": {
    "registered": true,
    "status": "Active",
    "legal_name": "RELIANCE RETAIL LIMITED",
    "trade_name": "Reliance Retail",
    "address": "...",
    "constitution": "Public Limited Company",
    "registration_date": "2017-07-01"
  },
  "mca": {
    "cin": "U01100MH1999PLC120563",
    "company_name": "RELIANCE RETAIL LIMITED",
    "status": "Active",
    "incorporation_date": "1999-12-09",
    "directors": [{"name": "...", "din": "..."}]
  },
  "ibbi": {"insolvency_proceedings": false},
  "credits_charged": 2
}
```

### Example prompts in Claude

- "Verify this GSTIN: 29AAACR5055K1Z5. Active?"
- "For these 100 Indian companies, check GST + MCA. Strike off any that are inactive."
- "Pull the directors of CIN U01100MH1999PLC120563 from MCA."

### Suggested next

- [`search_businesses`](/mcp/tools/search-businesses/) — discover businesses, then verify.
- [`enrich_company`](/mcp/tools/enrich-company/) — add reviews + employer signals.
- [`find_suppliers_india`](/mcp/tools/find-suppliers-india/) — verified-supplier discovery.

### Underlying actors

GST, MCA, IBBI scrapers. Cached for 24h on the Thirdwatch side to keep cost down.
