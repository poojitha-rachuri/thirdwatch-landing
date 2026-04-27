---
title: "Find Emerging Import-Export Categories with UN Comtrade (2026)"
slug: "find-emerging-import-export-categories-with-trade-data"
description: "Detect rising trade categories at $0.0015 per record with Thirdwatch's UN Comtrade Scraper. Year-over-year growth ranking and emerging-niche recipes."
actor: "trade-data-scraper"
actor_url: "https://apify.com/thirdwatch/trade-data-scraper"
actorTitle: "UN Comtrade Trade Data Scraper"
category: "business"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-india-china-trade-flows-with-un-comtrade"
  - "build-supply-chain-risk-dashboard-from-trade-flows"
  - "research-tariff-impact-with-bilateral-trade-data"
keywords:
  - "emerging trade categories"
  - "fastest growing imports"
  - "year over year HS code growth"
  - "trade trend detection"
faqs:
  - q: "How do I define emerging in a trade dataset?"
    a: "An emerging category is one growing materially faster than the bilateral trade total over a multi-year window. A common working definition: categories whose 3-year compound annual growth rate exceeds 25% and whose absolute trade value crosses a meaningful floor (e.g., $50M) by the latest year. Below the floor, growth percentages are noise."
  - q: "What HS code level surfaces emerging niches best?"
    a: "4-digit HS headings are the sweet spot. 2-digit chapters are too coarse — semiconductor packaging hides inside HS 85. 6-digit subheadings are too granular and sparse for most reporters. 4-digit is granular enough to separate, say, lithium batteries (8507) from lead-acid batteries while keeping coverage dense across countries."
  - q: "How many years of data should I pull for trend detection?"
    a: "Three years minimum, five years preferred. A single-year jump is often noise — a category can spike in one year due to a one-off contract or stockpiling. A 3-year CAGR filters most of that out; 5 years lets you separate structural shifts from post-pandemic recovery effects that distort 2020-2022 baselines."
  - q: "Should I use imports or exports for emerging-category detection?"
    a: "Both, separately. Emerging imports tell you what a country is increasingly buying — opportunity for foreign suppliers, signal for import-substitution policy. Emerging exports tell you what a country is increasingly selling — opportunity for buyers, signal for industrial-policy success. Run two queries with flow=imports and flow=exports and compare."
  - q: "Why does the most recent year show suppressed numbers sometimes?"
    a: "UN Comtrade publishes data as countries report it, which means the most recent year is often partial when you query early in the next calendar year. India typically completes 2024 reporting by late 2025; China by mid-2025. Always cross-check trade_value_usd against the prior year's full-period total before drawing conclusions on the most recent point."
  - q: "Can I do this analysis without writing Python?"
    a: "Yes. Run the actor with frequency=annual and a multi-year years string, export the dataset to CSV from the Apify Console, and pivot in Excel or Google Sheets on (hs_code, year). Compute period-over-period growth as a sheet formula. The structured JSON the actor returns ingests cleanly into any spreadsheet without massaging."
---

> Thirdwatch's [UN Comtrade Trade Data Scraper](https://apify.com/thirdwatch/trade-data-scraper) makes emerging-category detection a one-call workflow at $0.0015 per record — pull multi-year bilateral trade data, rank HS codes by year-over-year growth, surface the categories rising faster than the overall bilateral total. No API key, no proxy, no manual portal exports. Built for trade researchers, industry analysts, and venture investors who need to spot rising trade flows before they hit headlines.

## Why find emerging trade categories

Emerging trade categories are leading indicators for everything from industrial policy to venture investment. A bilateral trade flow that's growing 40% a year while the total grows 5% is telling you a structural shift is happening — a new manufacturing capability, a new consumer demand, a regulatory window. According to the [WTO World Trade Statistical Review 2024](https://www.wto.org/english/res_e/booksp_e/wtsr_2024_e.pdf), the fastest-growing globally-traded categories in 2020-2024 were lithium batteries, semiconductor packaging equipment, and pharmaceutical intermediates — each of those was visible in UN Comtrade data 18 to 24 months before mainstream press coverage.

The job-to-be-done is structured: pull a 3-5 year time series of bilateral trade by HS code, compute compound annual growth rate per category, filter to categories above a meaningful trade-value floor, sort by CAGR descending. The Trade Data Scraper handles the data layer because UN Comtrade's web portal does not let you efficiently pull multi-year bilateral data with a single call — you'd need a separate query per year and a manual stitching step. The actor flattens that into one structured response.

## How does this compare to the alternatives?

Three options for spotting emerging trade categories:

| Approach | Cost per 1,000 records × 5 years | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| UN Comtrade web portal manual | Free, 5+ exports per query | High | Per-query interactive | You manage the stitching |
| Paid trade DB (Panjiva, ImportGenius, Export Genius) | $5K–$50K/year flat | High | Days to onboard | Vendor lock-in |
| Thirdwatch UN Comtrade Scraper | $7.50 per 5-year pull | Production-tested, official source | 5 minutes | Thirdwatch tracks endpoint changes |

Paid trade databases have decent emerging-category dashboards but their underlying data is the same UN Comtrade source, marked up. The [Trade Data Scraper actor page](/scrapers/trade-data-scraper) gives you the structured feed; the CAGR ranking is downstream pandas. For a researcher or analyst who already lives in pandas, this is the cheapest path to the same signal.

## How to find emerging trade categories in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a 5-year bilateral trade time series?

Pass a comma-separated `years` string and a meaningful `maxResults`. For India-USA trade flows at 4-digit HS detail across five years, 1,500 records is a reasonable cap — broad enough to capture every category that moves but small enough to fit in memory.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~trade-data-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "reporterCountry": "India",
        "partnerCountry": "USA",
        "flow": "exports",
        "years": "2019,2020,2021,2022,2023",
        "frequency": "annual",
        "maxResults": 1500,
    },
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} records across {df.year.nunique()} years and {df.hs_code.nunique()} HS codes")
```

The actor returns one row per (HS code × year). For 4-digit detail across five years, expect 600-1,500 rows depending on bilateral coverage.

### Step 3: How do I compute compound annual growth rate per category?

Pivot to (hs_code, year) → trade_value_usd, then compute CAGR between the first and last available year for each category.

```python
pivot = df.pivot_table(
    index=["hs_code", "hs_description"],
    columns="year",
    values="trade_value_usd",
    aggfunc="sum",
).fillna(0)

years = sorted(pivot.columns)
n_years = years[-1] - years[0]

def cagr(row):
    start, end = row[years[0]], row[years[-1]]
    if start <= 0 or end <= 0:
        return None
    return (end / start) ** (1 / n_years) - 1

pivot["cagr"] = pivot.apply(cagr, axis=1)
pivot["latest_value_m"] = pivot[years[-1]] / 1e6

emerging = pivot[(pivot.latest_value_m >= 50) & (pivot.cagr >= 0.25)].sort_values("cagr", ascending=False)
print(emerging[[years[0], years[-1], "latest_value_m", "cagr"]].head(20))
```

The result is the ranked list of bilateral export categories where India's exports to the USA grew at 25%+ CAGR over five years, conditional on the latest-year value being above $50M.

### Step 4: How do I cross-reference against a global baseline?

A category growing 30% bilaterally is interesting; a category growing 30% bilaterally *while the global total grew 5%* is a structural shift. Pull a second dataset for the same category at the global level (use World M49 code or aggregate across multiple partners) and compute the ratio:

```python
global_resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "reporterCountry": "India",
        "partnerCountry": "Germany",  # second sample partner
        "flow": "exports",
        "years": "2019,2023",
        "frequency": "annual",
        "maxResults": 1500,
    },
)
global_df = pd.DataFrame(global_resp.json())
global_pivot = global_df.pivot_table(index="hs_code", columns="year", values="trade_value_usd", aggfunc="sum").fillna(0)
global_pivot["global_cagr"] = (global_pivot[2023] / global_pivot[2019]).pow(1/4) - 1

ratio = emerging.reset_index().merge(
    global_pivot[["global_cagr"]].reset_index(),
    on="hs_code",
).assign(growth_premium=lambda d: d["cagr"] - d["global_cagr"])
print(ratio.sort_values("growth_premium", ascending=False).head(20))
```

Categories with a high `growth_premium` are bilaterally over-indexing — the structural-shift signal you want to investigate further.

## Sample output

A single record from the dataset for one HS code in one year looks like this. The CAGR analysis stitches many such rows together over time.

```json
{
  "reporter_country": "India",
  "partner_country": "USA",
  "flow": "export",
  "hs_code": "8507",
  "hs_description": "Electric accumulators (lithium-ion batteries)",
  "trade_value_usd": 320000000,
  "fob_value_usd": 320000000,
  "net_weight_kg": 12000000,
  "quantity": 12000000,
  "quantity_unit": "kg",
  "unit_price_usd": 26.67,
  "year": 2023,
  "period": "2023"
}
```

The aggregated emerging-categories ranking from a 5-year India-to-USA exports analysis usually surfaces categories like this:

| HS code | Description | 2019 ($M) | 2023 ($M) | CAGR |
|---|---|---|---|---|
| 8507 | Lithium-ion batteries | 18 | 320 | 105% |
| 3004 | Pharmaceutical formulations | 4,200 | 8,800 | 20% |
| 8517 | Telecom equipment | 240 | 1,150 | 48% |
| 8541 | Photovoltaic cells & semiconductors | 28 | 220 | 67% |

Lithium-ion batteries growing 105% CAGR with $300M+ absolute value is the kind of signal that gets a category onto an industrial-policy briefing within a quarter.

## Common pitfalls

Three issues bite trend pipelines on UN Comtrade data. **Most-recent-year incompleteness** — UN Comtrade data updates as countries report; the latest year often shows suppressed numbers when queried before all reporters have completed submission. Always cross-check the latest period against the prior period's full-year total before drawing conclusions. **Currency-conversion drift** — UN Comtrade reports in USD already, but the underlying conversion uses contemporaneous exchange rates; for long time-series in volatile-currency reporters (Egypt, Argentina), the USD value may understate real-terms growth. **One-time contract spikes** — defence equipment, large-vessel deliveries, and infrastructure projects can produce a single-year jump that looks like emergence but isn't structural; surface CAGR alongside year-by-year levels and inspect any category where one year accounts for >50% of total trade.

Thirdwatch's actor returns `year` and `period` on every record so you always know exactly which reporting period you're looking at. The actor's pure-HTTP architecture means a 5-year × 1,500-record pull completes in under two minutes wall-clock and costs $11 — small enough to run quarterly across multiple bilateral pairs.

## Related use cases

- [Track India-China trade flows with UN Comtrade](/blog/track-india-china-trade-flows-with-un-comtrade)
- [Build a supply chain risk dashboard from trade flows](/blog/build-supply-chain-risk-dashboard-from-trade-flows)
- [Research tariff impact with bilateral trade data](/blog/research-tariff-impact-with-bilateral-trade-data)
- [The complete guide to scraping business and trade data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How do I define "emerging" in a trade dataset?

An emerging category is one growing materially faster than the bilateral trade total over a multi-year window. A common working definition: categories whose 3-year compound annual growth rate exceeds 25% and whose absolute trade value crosses a meaningful floor (e.g., $50M) by the latest year. Below the floor, growth percentages are noise.

### What HS code level surfaces emerging niches best?

4-digit HS headings are the sweet spot. 2-digit chapters are too coarse — semiconductor packaging hides inside HS 85. 6-digit subheadings are too granular and sparse for most reporters. 4-digit is granular enough to separate, say, lithium batteries (8507) from lead-acid batteries while keeping coverage dense across countries.

### How many years of data should I pull for trend detection?

Three years minimum, five years preferred. A single-year jump is often noise — a category can spike in one year due to a one-off contract or stockpiling. A 3-year CAGR filters most of that out; 5 years lets you separate structural shifts from post-pandemic recovery effects that distort 2020-2022 baselines.

### Should I use imports or exports for emerging-category detection?

Both, separately. Emerging imports tell you what a country is increasingly buying — opportunity for foreign suppliers, signal for import-substitution policy. Emerging exports tell you what a country is increasingly selling — opportunity for buyers, signal for industrial-policy success. Run two queries with `flow=imports` and `flow=exports` and compare.

### Why does the most recent year show suppressed numbers sometimes?

UN Comtrade publishes data as countries report it, which means the most recent year is often partial when you query early in the next calendar year. India typically completes 2024 reporting by late 2025; China by mid-2025. Always cross-check `trade_value_usd` against the prior year's full-period total before drawing conclusions on the most recent point.

### Can I do this analysis without writing Python?

Yes. Run the actor with `frequency=annual` and a multi-year `years` string, export the dataset to CSV from the Apify Console, and pivot in Excel or Google Sheets on `(hs_code, year)`. Compute period-over-period growth as a sheet formula. The structured JSON the actor returns ingests cleanly into any spreadsheet without massaging.

Run the [UN Comtrade Trade Data Scraper on Apify Store](https://apify.com/thirdwatch/trade-data-scraper) — pay-per-record, free to try, no credit card to test.
