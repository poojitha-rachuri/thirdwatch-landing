---
title: "Research Tariff Impact with Bilateral Trade Data (2026)"
slug: "research-tariff-impact-with-bilateral-trade-data"
description: "Quantify before/after tariff effects at $0.0015 per record using Thirdwatch's UN Comtrade Scraper. Substitution flow detection and category-level impact recipes."
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
  - "find-emerging-import-export-categories-with-trade-data"
  - "build-supply-chain-risk-dashboard-from-trade-flows"
keywords:
  - "tariff impact analysis"
  - "trade substitution flows"
  - "bilateral trade tariff research"
  - "before after tariff trade data"
faqs:
  - q: "What questions does bilateral trade data answer about tariffs?"
    a: "Three core questions: (1) Did imports of the tariffed category drop after the tariff took effect? (2) Did imports rise from substitute partner countries (third-country substitution)? (3) Did unit prices change, indicating absorption versus pass-through? Each question is answerable from UN Comtrade data with the right query design."
  - q: "How long after a tariff change does the impact show up?"
    a: "UN Comtrade publishes annual data with a 12-18 month lag and monthly data with a 3-6 month lag. For a tariff that took effect in 2024, the cleanest before/after analysis uses 2022-2023 (before) versus 2024-2025 monthly (during/after). Don't expect impact analysis on a tariff implemented this quarter; the data needs at least one full reporting cycle to materialize."
  - q: "What's third-country substitution and why does it matter?"
    a: "When country A imposes tariffs on imports from country B, importers often shift to country C (a third country) to avoid the tariff while keeping the same goods. This substitution shows up as B's exports to A dropping while C's exports to A rising. The economic effect of the tariff is much smaller than the direct B-to-A drop suggests — third-country substitution often offsets 40-80% of the headline impact."
  - q: "How do I detect substitution flows in the data?"
    a: "Pull A's imports from B (the tariffed pair) AND from a list of substitute partners (C, D, E, ...). Compute year-over-year changes for each pair on the same HS code. A substitution pattern looks like: B's exports to A drop 30%, C's exports to A rise 40%, D's rise 25%. The combined diversion to C+D often equals or exceeds the drop from B."
  - q: "Can I separate price effects from volume effects?"
    a: "Yes. The actor returns trade_value_usd, net_weight_kg, and quantity per record. Compute unit_price_usd = trade_value_usd / quantity (or use the actor's pre-computed unit_price_usd field). A tariff that maintains import volume but raises unit prices means the cost is being passed through to consumers; one that drops volume without unit-price change is a demand-destruction tariff."
  - q: "What HS code level is best for tariff analysis?"
    a: "The HS code level of the tariff itself, ideally. Tariffs are usually written at 4-digit (heading) or 6-digit (subheading) level — match the data extraction to that level. For 2-digit chapter analyses, you'll mix tariffed and non-tariffed sub-products, which dilutes the signal. The actor accepts any HS code level via the hsCode input."
---

> Thirdwatch's [UN Comtrade Trade Data Scraper](https://apify.com/thirdwatch/trade-data-scraper) makes tariff-impact research a structured workflow at $0.0015 per record — pull before/after bilateral trade for the tariffed category, surface volume drops, third-country substitution, and pass-through pricing effects. Built for trade economists, policy researchers, and corporate-strategy teams who need quantified tariff impact analyses without commercial trade-database subscriptions.

## Why use UN Comtrade for tariff-impact research

Tariff debates are won or lost on data. According to [the Peterson Institute for International Economics' 2024 trade tariff database](https://www.piie.com/research/piie-charts), most major tariff actions of the past decade had measurable but partial impact on bilateral flows — partial because third-country substitution offsets the direct effect substantially. Quantifying that substitution requires bilateral trade data at HS-code level for multiple country pairs, on a year-over-year basis. UN Comtrade is the official source the academic and policy community uses.

The job-to-be-done is structured. A trade economist studying the impact of US tariffs on Chinese steel needs to compare US-China steel imports before and after the tariff plus US-Vietnam, US-South Korea, and US-Mexico steel imports across the same window. A corporate-strategy team in a tariffed industry needs to track substitution flows that affect their competitive position. A policy researcher quantifying the effective burden of a tariff needs both volume and unit-price data. All of these reduce to multi-country bilateral pulls × multiple years × HS-code filtering. The Trade Data Scraper handles each pull in a single call.

## How does this compare to the alternatives?

Three options for tariff-impact research using bilateral trade data:

| Approach | Cost per 1,000 records × 5-year window × 8 partners | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual UN Comtrade web exports | Free, hours of analyst time | High | Days per analysis | You manage CSVs |
| Paid trade DB (Panjiva, ImportGenius) | $5K–$50K/year flat | High | Days to onboard | Vendor lock-in |
| Thirdwatch UN Comtrade Scraper | $60 per full study (1K × 5 × 8) | Production-tested, official source | 5 minutes | Thirdwatch tracks endpoint changes |

Paid trade databases re-package UN Comtrade with proprietary derivative metrics; the underlying source is what this actor connects to directly. The [Trade Data Scraper actor page](/scrapers/trade-data-scraper) gives you the structured raw feed; the substitution and pass-through analysis is downstream pandas.

## How to research tariff impact in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull before/after bilateral imports for the tariffed pair?

Pick a tariff event with a clean date — for example, the Section 301 steel tariffs the US imposed on Chinese imports — and pull bilateral US-China steel imports across the years bracketing the event.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~trade-data-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

REPORTER = "USA"
HS_CODE = "7208"   # iron/steel hot-rolled flat products
TARIFFED_PARTNER = "China"
SUBSTITUTE_PARTNERS = ["Vietnam", "South Korea", "Japan", "Mexico",
                       "India", "Brazil", "Germany", "Indonesia"]
BEFORE_AFTER_YEARS = "2018,2019,2020,2021,2022,2023"

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "reporterCountry": REPORTER,
        "partnerCountry": TARIFFED_PARTNER,
        "flow": "imports",
        "hsCode": HS_CODE,
        "years": BEFORE_AFTER_YEARS,
        "frequency": "annual",
        "maxResults": 1000,
    },
    timeout=600,
)
tariffed = pd.DataFrame(resp.json())
print(f"US-China steel: {len(tariffed)} records across {tariffed.year.nunique()} years")
```

### Step 3: How do I pull substitute partners and detect diversion?

Loop the same query across substitute partners; the diversion analysis is downstream.

```python
rows = list(tariffed.to_dict("records"))
for partner in SUBSTITUTE_PARTNERS:
    resp = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
        params={"token": TOKEN},
        json={
            "reporterCountry": REPORTER, "partnerCountry": partner,
            "flow": "imports", "hsCode": HS_CODE,
            "years": BEFORE_AFTER_YEARS, "frequency": "annual",
            "maxResults": 1000,
        },
        timeout=600,
    )
    rows.extend(resp.json())

df = pd.DataFrame(rows)
totals = (df.groupby(["partner_country", "year"])
            ["trade_value_usd"].sum().reset_index())
pivot = totals.pivot(index="partner_country", columns="year", values="trade_value_usd").fillna(0)

PRE = "2018"; POST = "2023"
pivot["pre_b"] = pivot[int(PRE)] / 1e9
pivot["post_b"] = pivot[int(POST)] / 1e9
pivot["delta_b"] = pivot["post_b"] - pivot["pre_b"]
pivot["delta_pct"] = (pivot["post_b"] - pivot["pre_b"]) / pivot["pre_b"].clip(lower=0.001)
print(pivot[["pre_b", "post_b", "delta_b", "delta_pct"]].sort_values("delta_b", ascending=False))
```

The pre-vs-post billion-dollar deltas tell the substitution story. Tariffed partner shows large negative delta; substitute partners show offsetting positive deltas summed across the cohort.

### Step 4: How do I separate volume from price effects?

Compute weighted-average unit price per partner per year, then track its trajectory.

```python
df["unit_price"] = df.trade_value_usd / df.quantity.clip(lower=1)
unit_price = (df.groupby(["partner_country", "year"])
                .apply(lambda g: (g.trade_value_usd * g.unit_price).sum()
                                  / g.trade_value_usd.sum())
                .reset_index(name="weighted_unit_price"))
up = unit_price.pivot(index="partner_country", columns="year", values="weighted_unit_price")
up["price_change_pct"] = (up[int(POST)] / up[int(PRE)]) - 1
print(up.sort_values("price_change_pct", ascending=False).head(15))
```

A tariffed partner showing both a volume drop (Step 3) AND unit-price rise indicates the cost is being absorbed by the importer; volume drop with stable unit-price means the importer simply switched suppliers. The combination is the canonical pass-through-vs-substitution decomposition.

## Sample output

A single record from the dataset for one HS code, one year, one country pair looks like this. The tariff impact analysis stitches many such rows.

```json
{
  "reporter_country": "USA",
  "partner_country": "China",
  "flow": "import",
  "hs_code": "7208",
  "hs_description": "Iron/steel hot-rolled flat products",
  "trade_value_usd": 2400000000,
  "cif_value_usd": 2400000000,
  "net_weight_kg": 4800000000,
  "quantity": 4800000000,
  "quantity_unit": "kg",
  "unit_price_usd": 0.50,
  "year": 2018,
  "period": "2018"
}
```

A typical tariff-impact summary table looks like:

| Partner | 2018 ($B) | 2023 ($B) | Δ ($B) | Δ % |
|---|---|---|---|---|
| China | 2.4 | 0.6 | -1.8 | -75% |
| Vietnam | 0.3 | 1.2 | +0.9 | +300% |
| Mexico | 1.4 | 2.1 | +0.7 | +50% |
| South Korea | 1.0 | 1.5 | +0.5 | +50% |

China dropping $1.8B while Vietnam, Mexico, and South Korea collectively gained $2.1B is the textbook third-country-substitution pattern — net imports actually rose despite the tariff.

## Common pitfalls

Three things go wrong in tariff-impact studies built on UN Comtrade. **HS-code mismatch** — the tariff is written at one HS level (typically 4 or 6 digits), and the data analysis must match that level exactly. Aggregating to 2-digit chapters mixes tariffed and non-tariffed sub-products and dilutes the signal. **Single-year baselines** — using just one pre-tariff year as the baseline is fragile; one-off events (a bad harvest, a strike, a single large contract) can distort it. Use a 2-3 year pre-tariff average instead. **Missing transhipment effects** — apparent country-level substitution sometimes reflects re-routing rather than genuine new sourcing. Tariffed-country goods can transit through Vietnam or Mexico and be relabelled at customs; this is partially captured in unit-price data (relabelled goods often show artificially high unit prices reflecting transit costs).

Thirdwatch's actor returns `unit_price_usd` precomputed on every record so the pass-through analysis is straightforward. The pure-HTTP architecture means a 9-partner × 6-year tariff study completes in 15-25 minutes wall-clock and costs about $60 — meaningfully less than any commercial trade-database subscription.

## Related use cases

- [Track India-China trade flows with UN Comtrade](/blog/track-india-china-trade-flows-with-un-comtrade)
- [Find emerging import-export categories with trade data](/blog/find-emerging-import-export-categories-with-trade-data)
- [Build a supply chain risk dashboard from trade flows](/blog/build-supply-chain-risk-dashboard-from-trade-flows)
- [The complete guide to scraping business and trade data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What questions does bilateral trade data answer about tariffs?

Three core questions: (1) Did imports of the tariffed category drop after the tariff took effect? (2) Did imports rise from substitute partner countries (third-country substitution)? (3) Did unit prices change, indicating absorption versus pass-through? Each question is answerable from UN Comtrade data with the right query design.

### How long after a tariff change does the impact show up?

UN Comtrade publishes annual data with a 12-18 month lag and monthly data with a 3-6 month lag. For a tariff that took effect in 2024, the cleanest before/after analysis uses 2022-2023 (before) versus 2024-2025 monthly (during/after). Don't expect impact analysis on a tariff implemented this quarter; the data needs at least one full reporting cycle to materialize.

### What's third-country substitution and why does it matter?

When country A imposes tariffs on imports from country B, importers often shift to country C (a third country) to avoid the tariff while keeping the same goods. This substitution shows up as B's exports to A dropping while C's exports to A rising. The economic effect of the tariff is much smaller than the direct B-to-A drop suggests — third-country substitution often offsets 40-80% of the headline impact.

### How do I detect substitution flows in the data?

Pull A's imports from B (the tariffed pair) AND from a list of substitute partners (C, D, E, ...). Compute year-over-year changes for each pair on the same HS code. A substitution pattern looks like: B's exports to A drop 30%, C's exports to A rise 40%, D's rise 25%. The combined diversion to C+D often equals or exceeds the drop from B.

### Can I separate price effects from volume effects?

Yes. The actor returns `trade_value_usd`, `net_weight_kg`, and `quantity` per record. Compute `unit_price_usd = trade_value_usd / quantity` (or use the actor's pre-computed `unit_price_usd` field). A tariff that maintains import volume but raises unit prices means the cost is being passed through to consumers; one that drops volume without unit-price change is a demand-destruction tariff.

### What HS code level is best for tariff analysis?

The HS code level of the tariff itself, ideally. Tariffs are usually written at 4-digit (heading) or 6-digit (subheading) level — match the data extraction to that level. For 2-digit chapter analyses, you'll mix tariffed and non-tariffed sub-products, which dilutes the signal. The actor accepts any HS code level via the `hsCode` input.

Run the [UN Comtrade Trade Data Scraper on Apify Store](https://apify.com/thirdwatch/trade-data-scraper) — pay-per-record, free to try, no credit card to test.
