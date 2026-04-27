---
title: "Build a Supply Chain Risk Dashboard from Trade Flows (2026)"
slug: "build-supply-chain-risk-dashboard-from-trade-flows"
description: "Quantify supply chain concentration risk at $0.0015 per record using Thirdwatch's UN Comtrade Scraper. HHI, top-supplier exposure, single-source detection."
actor: "trade-data-scraper"
actor_url: "https://apify.com/thirdwatch/trade-data-scraper"
actorTitle: "UN Comtrade Trade Data Scraper"
category: "business"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-india-china-trade-flows-with-un-comtrade"
  - "find-emerging-import-export-categories-with-trade-data"
  - "research-tariff-impact-with-bilateral-trade-data"
keywords:
  - "supply chain risk dashboard"
  - "import concentration analysis"
  - "HHI trade dependency"
  - "single source supplier risk"
faqs:
  - q: "What does supply-chain concentration risk actually mean?"
    a: "Concentration risk is the share of your imports for a category that comes from a single country or a small group of countries. A category where 90% of imports come from one country is at high risk: a tariff, sanction, port closure, or natural disaster in that one country disrupts your entire supply. The Herfindahl-Hirschman Index (HHI) is the standard quantification — sum of squared partner shares, ranging from 0 (perfectly diversified) to 10,000 (single-source)."
  - q: "What HHI threshold counts as concentrated?"
    a: "The U.S. Department of Justice uses HHI bands of <1,500 unconcentrated, 1,500-2,500 moderately concentrated, >2,500 highly concentrated for antitrust analysis. The same bands work for supply chain risk. A category at HHI 4,000+ has dangerous concentration; one at HHI 7,000+ is effectively single-source. Track the trend over time — a category moving from 2,000 to 5,000 in three years signals deteriorating diversification."
  - q: "How often should I refresh a supply chain risk dashboard?"
    a: "Quarterly is the right cadence for annual UN Comtrade data — the underlying source updates as countries report, with most data refreshing 12-18 months in arrears. For real-time disruption signals, pair this with news monitoring or your own customs data. The Trade Data Scraper handles the structured baseline; live disruption is a separate problem."
  - q: "What countries should I include as partners?"
    a: "Pull all relevant trading partners for the category, not just the top one. Run separate queries with each candidate partner country and aggregate. The actor's enum supports the top 20 reporters; for partners outside that list, pass the numeric M49 country code directly. A complete concentration analysis typically covers 8-15 partner countries per category."
  - q: "Can I detect single-source dependencies that aren't obvious from totals?"
    a: "Yes. At 4-digit HS detail, individual subcategories often have single-country dominance even when the parent 2-digit chapter looks diversified. For example, India's rare-earth-element imports may be 95%+ from China at the 4-digit level even though the full HS 25 (mineral products) chapter looks balanced. Always drill down to 4-digit or finer for risk analysis."
  - q: "How do I prioritise which categories to investigate first?"
    a: "Sort by category-trade-value × HHI. High-value, high-concentration categories are the riskiest exposures and the right first investigations. Add in trend — a category whose HHI has grown 50%+ in three years is a deteriorating exposure, even at a moderate absolute level. Procurement, finance, and risk teams use this pivot to triage their 50-100 watched categories down to the 5-10 that need immediate diversification work."
---

> Thirdwatch's [UN Comtrade Trade Data Scraper](https://apify.com/thirdwatch/trade-data-scraper) feeds a supply-chain risk dashboard at $0.0015 per record — pull bilateral trade flows for every category and partner pair, compute Herfindahl-Hirschman Index per category, surface single-source dependencies. Built for procurement teams, supply-chain ops, and corporate risk managers who need to quantify concentration risk across hundreds of categories without subscribing to a six-figure trade-intelligence platform.

## Why build a supply chain risk dashboard from trade flows

Supply-chain concentration is the largest non-cyclical risk most large manufacturers carry. The 2020 pandemic, the 2022 chip shortage, and the 2023 Red Sea disruptions each showed how a single-country dependency can shut down entire production lines. According to the [OECD's 2024 economic surveys](https://www.oecd.org/economy/), companies with diversified supplier bases recovered 30-40% faster than concentrated counterparts in each of those events. Quantifying concentration before the next disruption is the entire point of a supply-chain risk dashboard.

The job-to-be-done is structured. A procurement team wants to see, for every component category they import, which partner countries supply how much, summarised as an HHI score and tracked over time. A risk team wants alerts when an HHI crosses a threshold — say, 6,000 — for any category where annual trade value exceeds $50M. A board-level dashboard needs the top-10 most concentrated categories ranked by absolute trade exposure. All of these reduce to the same data shape: pull bilateral trade for category × multiple partner countries, compute concentration metrics, sort by exposure. The Trade Data Scraper is the data layer; pandas plus a charting tool is the rest.

## How does this compare to the alternatives?

Three options for building a supply-chain risk dashboard:

| Approach | Cost per 1,000 records × 50 categories | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual UN Comtrade web exports | Free, hours of analyst time | High | Days per quarterly refresh | You manage CSV stitching |
| Paid risk-intel SaaS (Resilinc, Interos, Everstream) | $50K–$500K/year flat | High | Weeks to onboard | Vendor lock-in |
| Thirdwatch UN Comtrade Scraper | $75 ($0.0015 × 1,000 × 50) per quarterly pull | Production-tested, official source | Half a day | Thirdwatch tracks endpoint changes |

Paid risk-intel platforms layer real-time disruption signals (news, weather, port congestion) on top of the same UN Comtrade data they re-package. For a structured-baseline dashboard owned in-house, the [Trade Data Scraper actor page](/scrapers/trade-data-scraper) gives you the raw input; the analytics layer is downstream pandas. Most procurement teams build the structured baseline on top of UN Comtrade and bolt on news monitoring separately.

## How to build a supply chain risk dashboard in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull imports for one category from every relevant partner?

Run the actor once per partner country with the same reporter and HS code. Fan out the calls; the actor's all-HTTP architecture handles parallel runs cheaply.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~trade-data-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

REPORTER = "USA"
HS_CODE = "8541"   # photovoltaic cells, semiconductor diodes
PARTNERS = ["China", "Japan", "South Korea", "Germany", "Mexico",
            "Vietnam", "Malaysia", "Taiwan", "Thailand", "India"]

rows = []
for partner in PARTNERS:
    resp = requests.post(
        f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
        params={"token": TOKEN},
        json={
            "reporterCountry": REPORTER,
            "partnerCountry": partner,
            "flow": "imports",
            "hsCode": HS_CODE,
            "years": "2019,2020,2021,2022,2023",
            "frequency": "annual",
            "maxResults": 500,
        },
        timeout=600,
    )
    rows.extend(resp.json())

df = pd.DataFrame(rows)
print(f"{len(df)} records across {df.partner_country.nunique()} partners and {df.year.nunique()} years")
```

Ten partners × 5 years × ~30 records per partner-year = roughly 1,500 records. Cost: ~$2.25 per category.

### Step 3: How do I compute the Herfindahl-Hirschman Index per year?

Group by year and HS subcode, compute partner shares, sum squared shares × 10,000.

```python
def hhi(group):
    total = group.trade_value_usd.sum()
    if total <= 0:
        return None
    shares = group.groupby("partner_country").trade_value_usd.sum() / total
    return float((shares ** 2).sum() * 10_000)

result = (
    df.groupby(["year", "hs_code"])
      .apply(hhi)
      .reset_index(name="hhi")
)
print(result.head())
```

An HHI above 2,500 is moderately concentrated; above 5,000 is high-risk; above 7,500 is effectively single-source. Track the trend across years to surface deteriorating exposures.

### Step 4: How do I rank categories across an entire commodity portfolio?

Wrap the per-category logic in a function and run across a watchlist of 50+ HS codes:

```python
import functools

WATCHLIST = ["8541", "8517", "2933", "3004", "8507", "7202", "2710", "9027"]

@functools.lru_cache(maxsize=None)
def category_hhi(hs):
    rows = []
    for partner in PARTNERS:
        resp = requests.post(
            f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
            params={"token": TOKEN},
            json={"reporterCountry": REPORTER, "partnerCountry": partner,
                  "flow": "imports", "hsCode": hs, "years": "2023",
                  "frequency": "annual", "maxResults": 200},
            timeout=600,
        )
        rows.extend(resp.json())
    if not rows:
        return None
    g = pd.DataFrame(rows)
    total = g.trade_value_usd.sum()
    shares = g.groupby("partner_country").trade_value_usd.sum() / total
    return {"hs": hs, "value_b": total / 1e9, "hhi": float((shares ** 2).sum() * 10_000)}

portfolio = pd.DataFrame([category_hhi(hs) for hs in WATCHLIST])
portfolio["risk_score"] = portfolio.value_b * portfolio.hhi / 10_000
print(portfolio.sort_values("risk_score", ascending=False))
```

`risk_score` is the key column for board-level reporting — it captures both absolute exposure and concentration in one number. Categories at the top are the dashboard's first action items.

## Sample output

A single record from the dataset for one HS code, one year, one partner pair looks like this. The HHI analysis stitches many such rows together.

```json
{
  "reporter_country": "USA",
  "partner_country": "China",
  "flow": "import",
  "hs_code": "8541",
  "hs_description": "Photovoltaic cells, semiconductor diodes and similar devices",
  "trade_value_usd": 6800000000,
  "cif_value_usd": 6800000000,
  "net_weight_kg": 220000000,
  "quantity": 220000000,
  "quantity_unit": "kg",
  "unit_price_usd": 30.91,
  "year": 2023,
  "period": "2023"
}
```

The aggregated dashboard view on the same category from a 10-partner pull typically looks like this:

| HS code | Description | 2023 ($B) | 2023 HHI | Trend (2019→2023) |
|---|---|---|---|---|
| 8541 | Semiconductor diodes & PV cells | 12.4 | 5,200 | +1,800 |
| 8517 | Telecom equipment | 28.1 | 4,100 | -300 |
| 2933 | Heterocyclic compounds (pharma intermediates) | 4.8 | 6,800 | +2,200 |

8541 at HHI 5,200 with growing concentration is exactly the kind of category a procurement leader puts on the top of the diversification roadmap.

## Common pitfalls

Three things go wrong in supply-chain risk dashboards built on trade-flow data. **Reporter-side blind spots** — UN Comtrade gives the reporter country's customs view, but transhipment means real origin can differ from declared origin (a Chinese-origin component shipped through Vietnam often shows in the Vietnam-as-partner row). For deeper origin analysis, supplement with import declarations or supplier audits. **HHI sensitivity to long tails** — if 95% of imports are spread across 10 small partners and 5% through one large one, HHI looks low even though a tiny disruption in the long tail could matter operationally. Inspect the actual share table, not just the HHI summary. **HS-code mapping drift across revisions** — UN Comtrade applies different HS revisions across years (HS2017, HS2022); for trend lines, aggregate to 2-digit chapters where codes are stable, or build a manual revision-mapping for the 4-digit categories you watch.

Thirdwatch's actor returns reporter, partner, hs_code, and trade_value_usd on every record so the right groupings can happen downstream. The pure-HTTP architecture means a 50-category × 10-partner × 5-year quarterly refresh costs about $75 — meaningful budget but trivially less than any paid risk-intel subscription.

## Related use cases

- [Track India-China trade flows with UN Comtrade](/blog/track-india-china-trade-flows-with-un-comtrade)
- [Find emerging import-export categories with trade data](/blog/find-emerging-import-export-categories-with-trade-data)
- [Research tariff impact with bilateral trade data](/blog/research-tariff-impact-with-bilateral-trade-data)
- [The complete guide to scraping business and trade data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What does supply-chain concentration risk actually mean?

Concentration risk is the share of your imports for a category that comes from a single country or a small group of countries. A category where 90% of imports come from one country is at high risk: a tariff, sanction, port closure, or natural disaster in that one country disrupts your entire supply. The [Herfindahl-Hirschman Index](https://www.justice.gov/atr/herfindahl-hirschman-index) (HHI) is the standard quantification — sum of squared partner shares, ranging from 0 (perfectly diversified) to 10,000 (single-source).

### What HHI threshold counts as concentrated?

The U.S. Department of Justice uses HHI bands of <1,500 unconcentrated, 1,500-2,500 moderately concentrated, >2,500 highly concentrated for antitrust analysis. The same bands work for supply chain risk. A category at HHI 4,000+ has dangerous concentration; one at HHI 7,000+ is effectively single-source. Track the trend over time — a category moving from 2,000 to 5,000 in three years signals deteriorating diversification.

### How often should I refresh a supply chain risk dashboard?

Quarterly is the right cadence for annual UN Comtrade data — the underlying source updates as countries report, with most data refreshing 12-18 months in arrears. For real-time disruption signals, pair this with news monitoring or your own customs data. The Trade Data Scraper handles the structured baseline; live disruption is a separate problem.

### What countries should I include as partners?

Pull all relevant trading partners for the category, not just the top one. Run separate queries with each candidate partner country and aggregate. The actor's enum supports the top 20 reporters; for partners outside that list, pass the numeric M49 country code directly. A complete concentration analysis typically covers 8-15 partner countries per category.

### Can I detect single-source dependencies that aren't obvious from totals?

Yes. At 4-digit HS detail, individual subcategories often have single-country dominance even when the parent 2-digit chapter looks diversified. For example, India's rare-earth-element imports may be 95%+ from China at the 4-digit level even though the full HS 25 (mineral products) chapter looks balanced. Always drill down to 4-digit or finer for risk analysis.

### How do I prioritise which categories to investigate first?

Sort by category-trade-value × HHI. High-value, high-concentration categories are the riskiest exposures and the right first investigations. Add in trend — a category whose HHI has grown 50%+ in three years is a deteriorating exposure, even at a moderate absolute level. Procurement, finance, and risk teams use this pivot to triage their 50-100 watched categories down to the 5-10 that need immediate diversification work.

Run the [UN Comtrade Trade Data Scraper on Apify Store](https://apify.com/thirdwatch/trade-data-scraper) — pay-per-record, free to try, no credit card to test.
