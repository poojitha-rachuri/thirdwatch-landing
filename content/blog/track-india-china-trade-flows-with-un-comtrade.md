---
title: "Track India-China Trade Flows with UN Comtrade Data (2026)"
slug: "track-india-china-trade-flows-with-un-comtrade"
description: "Pull bilateral India-China trade by HS code at $0.0015 per record with Thirdwatch's UN Comtrade Scraper. Python recipes, real outputs, year-over-year trends."
actor: "trade-data-scraper"
actor_url: "https://apify.com/thirdwatch/trade-data-scraper"
actorTitle: "UN Comtrade Trade Data Scraper"
category: "business"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "find-emerging-import-export-categories-with-trade-data"
  - "build-supply-chain-risk-dashboard-from-trade-flows"
  - "research-tariff-impact-with-bilateral-trade-data"
keywords:
  - "india china trade data"
  - "UN comtrade scraper"
  - "bilateral trade by HS code"
  - "trade flow analysis API"
faqs:
  - q: "How much does it cost to query UN Comtrade trade data?"
    a: "Thirdwatch's UN Comtrade Scraper charges $0.0015 per trade record on the FREE tier and drops to $0.00085 at GOLD volume. A full India-China bilateral pull at 4-digit HS detail for one year is typically 1,200 records — under $2 per refresh, with annual data only updated once a year."
  - q: "What HS code granularity is best for India-China analysis?"
    a: "2-digit HS chapters give the densest coverage and the cleanest top-line view (electronics, machinery, organic chemicals). 4-digit headings are the sweet spot for product-level trends. 6-digit subheadings are most granular but India and China both report sparsely at that depth, so expect gaps."
  - q: "How fresh is UN Comtrade data?"
    a: "Annual data lags 12 to 18 months — at any moment the most recently complete year is usually two calendar years ago. Monthly data lags only a few months but coverage is thinner. For real-time trade signals, pair this with Indian customs ICEGATE data or trade press monitoring; UN Comtrade is the structured baseline."
  - q: "Do I need an API key from the UN?"
    a: "No. The actor uses UN Comtrade's public preview endpoint, which requires no authentication or API key. Thirdwatch handles request shaping, country-name to M49 code mapping, and pagination internally. You only need an Apify API token to run the actor itself."
  - q: "Can I track multi-year trends in one run?"
    a: "Yes. Pass a comma-separated string in years like 2018,2019,2020,2021,2022,2023 and every record is repeated per year, so a downstream pivot table on (hs_code, year) gives a clean trend matrix. For monthly trends within a year, set frequency to monthly instead."
  - q: "Why is China the partner default and India the reporter default?"
    a: "Because India publishes import data covering Chinese-origin goods consistently, while China-as-reporter for India is sparser. UN Comtrade's bilateral records are reporter-defined — when reporter equals India and partner equals China, you get India's customs view of trade with China, which is the stable view for India-side analysis."
---

> Thirdwatch's [UN Comtrade Trade Data Scraper](https://apify.com/thirdwatch/trade-data-scraper) returns bilateral India-China trade records at $0.0015 per record — trade value in USD, net weight, quantity, and CIF/FOB breakdowns at any HS code level (2-, 4-, or 6-digit). No API key, no proxy, no manual portal exports. Built for trade analysts, supply-chain teams, and policy researchers who need machine-readable trade flow data without paying $10K-$50K a year for Panjiva or ImportGenius.

## Why scrape UN Comtrade for India-China trade flows

India's import dependence on China is a consistent boardroom conversation across electronics, pharmaceuticals, machinery, and textiles. The [Government of India's 2024 trade statement](https://commerce.gov.in/about-us/divisions/foreign-trade-territorial-divisions/foreign-trade-east-asia/) put India's bilateral merchandise trade with China at over $118 billion, with a deficit exceeding $85 billion concentrated in a handful of HS chapters. Tracking which categories are growing fastest, which are reversing, and which represent the highest concentration risk is a structured exercise — but answering it requires pulling thousands of trade records and slicing them by HS code, year, and flow direction.

Manual exports from the UN Comtrade web portal cap at a few thousand rows per query, demand interactive parameter selection, and produce CSVs that downstream code has to repeatedly reshape. A pipeline that refreshes annual data once a quarter and slices it for a dashboard or model needs the same data in JSON, programmatically. That is what this actor exists for: send a JSON request, receive normalised records ready to load into pandas, BigQuery, or a Looker dashboard. The same shape works for any reporter–partner pair the UN tracks, so once the India-China pipeline is built, swapping in Vietnam-China or India-USA is a one-line change.

## How does this compare to the alternatives?

Three honest options for getting bilateral India-China trade data into a pipeline:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| UN Comtrade web portal (manual) | Free, but human-time-bound | High | Per-query interactive | You manage CSVs, parameter drift |
| Paid trade DB (Panjiva, ImportGenius, Export Genius) | $5K–$50K/year flat | High | Days to onboard | Vendor lock-in |
| Thirdwatch UN Comtrade Scraper | $1.50 ($0.0015 × 1,000) | Production-tested, official UN source | 5 minutes | Thirdwatch tracks UN endpoint changes |

UN Comtrade is the official source that paid trade databases re-package and resell; this actor connects directly. The [Trade Data Scraper actor page](/scrapers/trade-data-scraper) documents every supported reporter country and HS-code level, but for India-China analysis the main thing to remember is reporter = `India` and partner = `China` is the stable bilateral view.

## How to track India-China trade flows in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull top India-China import categories for a year?

The most useful first query is "top imports from China at 4-digit HS detail for the latest available year". Set `flow: "imports"` (so reporter India sees inbound from China), `hsCode: ""` (no filter), and let the actor sort by trade value descending.

```python
import os, requests

ACTOR = "thirdwatch~trade-data-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "reporterCountry": "India",
        "partnerCountry": "China",
        "flow": "imports",
        "years": "2023",
        "frequency": "annual",
        "maxResults": 50,
    },
    timeout=600,
)
records = resp.json()
top = sorted(records, key=lambda r: -r["trade_value_usd"])[:10]
for r in top:
    print(f"{r['hs_code']:>6}  ${r['trade_value_usd']/1e9:>6.2f}B  {r['hs_description']}")
```

The output is sorted server-side by trade value descending, so the top 10 rows are the 10 largest categories. For India-China imports the leaders are typically HS 85 (electronics), HS 84 (machinery), and HS 29 (organic chemicals).

### Step 3: How do I build a year-over-year trend for one HS chapter?

Pass multiple years and a chapter-level HS filter. Each year produces its own set of records that you can pivot.

```python
import pandas as pd

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "reporterCountry": "India",
        "partnerCountry": "China",
        "flow": "imports",
        "hsCode": "85",
        "years": "2018,2019,2020,2021,2022,2023",
        "frequency": "annual",
        "maxResults": 1000,
    },
)
df = pd.DataFrame(resp.json())
trend = (
    df.groupby(["year", "hs_code"])["trade_value_usd"].sum()
      .unstack(level=0)
      .fillna(0)
)
print(trend.head())
```

The result is one row per HS subcode and one column per year — drop into a chart and the COVID dip in 2020 plus the post-2021 electronics surge is visible in three lines of plotting code.

### Step 4: How do I monitor a specific category like telecom equipment?

Use 4-digit HS for product-level focus. HS 8517 covers telephone sets, smartphones, base stations, and related transmission equipment — historically India's single largest line item from China.

```python
resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "reporterCountry": "India",
        "partnerCountry": "China",
        "flow": "imports",
        "hsCode": "8517",
        "years": "2020,2021,2022,2023",
        "frequency": "annual",
        "maxResults": 200,
    },
)
records = resp.json()
total_by_year = {}
for r in records:
    total_by_year[r["year"]] = total_by_year.get(r["year"], 0) + r["trade_value_usd"]
for y in sorted(total_by_year):
    print(f"{y}  ${total_by_year[y]/1e9:>6.2f}B")
```

Schedule the same query on a quarterly cadence and your dashboard auto-refreshes when UN Comtrade publishes new annual data — typically every January for the prior calendar year.

## Sample output

A single record from the dataset looks like this. The example below is one row of India's 2023 telecom-equipment imports from China at 4-digit HS detail.

```json
{
  "reporter_country": "India",
  "partner_country": "China",
  "flow": "import",
  "hs_code": "8517",
  "hs_description": "Telephone sets and other apparatus for transmission of voice, images or data",
  "trade_value_usd": 4200000000,
  "cif_value_usd": 4200000000,
  "net_weight_kg": 85000000,
  "quantity": 85000000,
  "quantity_unit": "kg",
  "unit_price_usd": 49.41,
  "year": 2023,
  "period": "2023"
}
```

Two fields deserve special attention. `unit_price_usd` is derived (`trade_value_usd / quantity`) and is the cleanest way to detect price-mix shifts — in HS 8517, a unit price moving from $25 to $50 between years usually signals a mix shift toward higher-end smartphones rather than pure inflation. `cif_value_usd` and `fob_value_usd` are populated based on `flow`: imports report CIF (cost + insurance + freight, what India paid landed), exports report FOB (free on board, what India was paid at port). Mixing them in a single sum is a common mistake.

## Common pitfalls

Three things go wrong in any UN Comtrade pipeline. **Data lag** — annual data is published 12 to 18 months after the year ends; if today is April 2026, the most recent complete annual dataset is usually 2024 with partial 2025. Build your dashboards to surface the data year explicitly, not "latest". **Reporter asymmetry** — India's reported imports from China rarely match China's reported exports to India because of valuation differences, transhipment via Hong Kong/Singapore, and timing lags. Treat reporter-side data as the source of truth for that country's perspective and don't try to reconcile both sides as if they should be identical. **HS code revisions** — UN Comtrade follows HS revisions (HS2017, HS2022, etc.), and some 6-digit subheadings reshuffle between revisions; for trend lines spanning a revision boundary, aggregate to the chapter level (2-digit) where codes are stable.

Thirdwatch's actor returns `year` and `period` on every record, so you always know exactly which reporting period you're looking at. The actor uses UN Comtrade's preview endpoint, which automatically applies the HS revision in force for each year.

## Related use cases

- [Find emerging import-export categories with trade data](/blog/find-emerging-import-export-categories-with-trade-data)
- [Build a supply chain risk dashboard from bilateral trade flows](/blog/build-supply-chain-risk-dashboard-from-trade-flows)
- [Research tariff impact with bilateral trade data](/blog/research-tariff-impact-with-bilateral-trade-data)
- [The complete guide to scraping business and trade data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to query UN Comtrade trade data?

Thirdwatch's UN Comtrade Scraper charges $0.0015 per trade record on the FREE tier and drops to $0.00085 at GOLD volume. A full India-China bilateral pull at 4-digit HS detail for one year is typically 1,200 records — under $2 per refresh, with annual data only updated once a year.

### What HS code granularity is best for India-China analysis?

2-digit HS chapters give the densest coverage and the cleanest top-line view (electronics, machinery, organic chemicals). 4-digit headings are the sweet spot for product-level trends. 6-digit subheadings are most granular but India and China both report sparsely at that depth, so expect gaps.

### How fresh is UN Comtrade data?

Annual data lags 12 to 18 months — at any moment the most recently complete year is usually two calendar years ago. Monthly data lags only a few months but coverage is thinner. For real-time trade signals, pair this with [Indian customs ICEGATE data](https://www.icegate.gov.in/) or trade-press monitoring; UN Comtrade is the structured baseline.

### Do I need an API key from the UN?

No. The actor uses UN Comtrade's public preview endpoint, which requires no authentication or API key. Thirdwatch handles request shaping, country-name to M49 code mapping, and pagination internally. You only need an Apify API token to run the actor itself.

### Can I track multi-year trends in one run?

Yes. Pass a comma-separated string in `years` like `"2018,2019,2020,2021,2022,2023"` and every record is repeated per year, so a downstream pivot table on `(hs_code, year)` gives a clean trend matrix. For monthly trends within a year, set `frequency: "monthly"` instead.

### Why is China the partner default and India the reporter default?

Because India publishes import data covering Chinese-origin goods consistently, while China-as-reporter for India is sparser. UN Comtrade's bilateral records are reporter-defined — when reporter equals India and partner equals China, you get India's customs view of trade with China, which is the stable view for India-side analysis.

Run the [UN Comtrade Trade Data Scraper on Apify Store](https://apify.com/thirdwatch/trade-data-scraper) — pay-per-record, free to try, no credit card to test.
