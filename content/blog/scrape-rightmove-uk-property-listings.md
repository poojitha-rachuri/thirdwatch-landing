---
title: "Scrape Rightmove UK Property Listings (2026)"
slug: "scrape-rightmove-uk-property-listings"
description: "Pull Rightmove UK property listings at $0.002 per record using Thirdwatch. Buy + rent + commercial coverage + recipes for UK real estate teams."
actor: "rightmove-scraper"
actor_url: "https://apify.com/thirdwatch/rightmove-scraper"
actorTitle: "Rightmove Scraper"
category: "real-estate"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "track-uk-housing-market-with-rightmove"
  - "build-uk-rental-yield-database-from-rightmove"
  - "scrape-99acres-india-real-estate-listings"
keywords:
  - "rightmove scraper"
  - "uk property api"
  - "rightmove listings"
  - "uk real estate data"
faqs:
  - q: "Why scrape Rightmove for UK real estate research?"
    a: "Rightmove dominates UK property listings — 1M+ active listings with 80%+ market share among UK estate agents. According to Rightmove's 2024 report, the platform serves 13B+ page-views monthly. For UK real estate research, rental-yield analysis, and property-investment intelligence, Rightmove is canonical alongside Zoopla."
  - q: "What data does the actor return?"
    a: "Per listing: title, property type (Detached/Semi/Terraced/Flat/Bungalow), location (postcode area + town), price (£), price per sqft, bedrooms, bathrooms, tenure (Freehold/Leasehold), council tax band, agent name, posted date, image URLs. About 95% of Rightmove listings have comprehensive metadata."
  - q: "How does Rightmove compare to Zoopla + OnTheMarket?"
    a: "Rightmove (~80% market share) dominates UK property listings; Zoopla (~50%) is secondary; OnTheMarket (~25%) is tertiary. Most UK estate agents post on multiple platforms — typical 70-80% overlap between Rightmove and Zoopla. For comprehensive UK property research, run both. Rightmove tends to have fresher listings (agent priority); Zoopla has stronger valuation tooling."
  - q: "Can I compute UK rental yields per area?"
    a: "Yes. Pull buy-listings (capital value) + rent-listings (annual rent) per UK postcode area + property-type. Compute (annual rent × 12) / capital value × 100 = gross rental yield. UK metro yields typically 3-6%; regional yields 6-10%. London + South East have lower yields (2-4%) but stronger capital appreciation; North England + Wales have higher yields (6-10%) with slower appreciation."
  - q: "How fresh do Rightmove snapshots need to be?"
    a: "For active UK property-research, daily cadence catches new listings within 24h. For UK property-investment monitoring, weekly is sufficient. UK property listings turn over fast (median 30-60 days on market for buy listings, 14-30 days for rentals); for rental-velocity research, daily polling captures rapid-turn cycles."
  - q: "How does this compare to Rightmove's official API?"
    a: "Rightmove's official Data API is gated behind enterprise B2B partnerships ($25K+/year). The actor delivers similar coverage at $0.002/record without partnership gatekeeping. For active estate-agency operations using full ATS integration, Rightmove's API is required. For research-only use cases, the actor is materially cheaper."
---

> Thirdwatch's [Rightmove Scraper](https://apify.com/thirdwatch/rightmove-scraper) returns UK property listings at $0.002 per record — title, property type, location, price, area, bedrooms, tenure, council tax, agent, posted date. Built for UK real estate research, rental-yield analysis, UK property-investment intelligence, and UK proptech aggregator products.

## Why scrape Rightmove for UK property research

Rightmove dominates UK property listings. According to [Rightmove's 2024 Annual report](https://plc.rightmove.co.uk/), the platform serves 13B+ page-views monthly with 1M+ active listings and 80%+ market share among UK estate agents. For UK real estate research, rental-yield analysis, and property-investment intelligence, Rightmove is canonical alongside Zoopla.

The job-to-be-done is structured. A UK property-research function maps per-postcode-area rental yields quarterly. A UK rental-yield SaaS powers UK investor-facing yield calculators with Rightmove data. A UK property-investment platform tracks new-listings + price-drops daily for investor alerts. A UK proptech aggregator builder ingests Rightmove + Zoopla for comprehensive UK coverage. All reduce to postcode + property-type queries + per-listing aggregation.

## How does this compare to the alternatives?

Three options for Rightmove data:

| Approach | Cost per 10K records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Rightmove Data API | $25K+/year (partnership) | Official | Weeks (approval) | Per-tier license |
| Manual Rightmove browsing | Effectively unbounded | Low | Continuous | Doesn't scale |
| Thirdwatch Rightmove Scraper | $20 ($0.002 × 10K) | HTTP + structured data | 5 minutes | Thirdwatch tracks Rightmove changes |

Rightmove's official Data API requires enterprise partnership. The [Rightmove Scraper actor page](/scrapers/rightmove-scraper) gives you raw listing data at materially lower per-record cost.

## How to scrape Rightmove in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a UK postcode batch?

Pass postcode + property-type queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~rightmove-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

UK_AREAS = ["London", "Manchester", "Birmingham", "Edinburgh",
            "Bristol", "Leeds", "Cardiff", "Glasgow"]
TYPES = ["flat", "house", "studio"]
LISTING = "rent"

queries = [{"area": a, "property_type": t, "listing": LISTING}
           for a, t in product(UK_AREAS, TYPES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 100},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} {LISTING} listings across {df.area.nunique()} UK areas")
```

8 areas × 3 types = 24 queries × 100 = up to 2,400 records, costing $4.80.

### Step 3: How do I parse £ + compute rental yields?

Combine buy + rent listings to compute per-area yields.

```python
import re

def parse_gbp(s):
    if not isinstance(s, str): return None
    m = re.search(r"£([\d,]+)", s.replace(",", ""))
    return float(m.group(1)) if m else None

df["price_gbp"] = df.price.apply(parse_gbp)
df["bedrooms"] = pd.to_numeric(df.bedrooms, errors="coerce")

# Per-area median rents
rent_med = df[df.listing == "rent"].groupby(["area", "bedrooms"]).price_gbp.median().reset_index()
rent_med.columns = ["area", "bedrooms", "median_monthly_rent"]
rent_med["annual_rent"] = rent_med.median_monthly_rent * 12

# Pull buy listings separately + cross-reference
# Assume buy_df from a separate scrape with listing="buy"
# yield_pct = (annual_rent / capital_value) × 100
print(rent_med.head(15))
```

UK yields typically run 3-6% in metros, 6-10% in regional cities. For accurate yield research, segment by tenure (Freehold typically yields 0.5-1% higher than Leasehold) and council tax band.

### Step 4: How do I track price-drops + new-listings?

Daily snapshot enables price-change detection.

```python
import datetime, pathlib

ts = datetime.datetime.utcnow().strftime("%Y%m%d")
df.to_json(f"snapshots/rightmove-{ts}.json", orient="records")

# Compare against yesterday
prev = pd.read_json("snapshots/rightmove-20260427.json")
combined = df.merge(prev, on="listing_id", suffixes=("", "_prev"))
combined["price_delta"] = combined.price_gbp - combined.price_gbp_prev
drops = combined[combined.price_delta < 0]
print(f"{len(drops)} listings with price drops since yesterday")
```

Price-drops on Rightmove buy-listings (typically £5K-£25K reductions) signal motivated sellers — high-leverage for buyer-side investment research.

## Sample output

A single Rightmove listing record looks like this. Five rows weigh ~6 KB.

```json
{
  "listing_id": "129876543",
  "title": "2 Bedroom Flat for Rent in Shoreditch",
  "property_type": "Flat",
  "area": "London",
  "postcode_area": "EC2A",
  "price": "£2,750 per month",
  "price_gbp": 2750,
  "bedrooms": 2,
  "bathrooms": 1,
  "tenure": "Leasehold",
  "council_tax_band": "D",
  "agent_name": "Foxtons",
  "posted_date": "2026-04-22",
  "available_from": "2026-05-15",
  "url": "https://www.rightmove.co.uk/properties/129876543"
}
```

`postcode_area` (EC2A) is the canonical UK location anchor — enables PostGIS-based territory analysis. `tenure` (Freehold/Leasehold) materially affects buy-listing yields (Leasehold typically 5-15% lower price for same property due to ground-rent + service charges).

## Common pitfalls

Three things go wrong in Rightmove pipelines. **Per-week vs per-month rental price** — Rightmove displays rentals in weekly OR monthly format depending on agent preference; for cross-listing comparisons, normalize to monthly (× 4.33) before benchmarking. **Council Tax band variance** — affects total housing cost meaningfully (Band A: £1K-£1.5K/year; Band H: £4K-£6K/year); for accurate effective-cost research, factor in council tax + service charges (Leasehold). **Sold STC vs Available** — Rightmove shows "Sold STC" (Subject To Contract) listings alongside available; filter on `status: "available"` strictly to avoid stale-availability bias.

Thirdwatch's actor uses HTTP + structured data extraction at $0.05/1K, ~96% margin. Pair Rightmove with [Zoopla scraper](https://apify.com/thirdwatch/zoopla-scraper) (separate actor) for comprehensive UK coverage and [Adzuna Scraper](https://apify.com/thirdwatch/adzuna-scraper) for UK demographic + commute data. A fourth subtle issue worth flagging: London + South East (postcode prefixes BR, CR, DA, EN, HA, IG, KT, RM, SM, TN, TW, UB, WD) follow different price-trajectories than rest of UK; for accurate UK national benchmarks, segment by region rather than aggregating to national medians. A fifth pattern unique to UK rentals: short-let (Airbnb-style) vs long-let (12+ month tenancies) have materially different effective rates — short-let rates often 2-3x long-let for same property, but with much higher vacancy. For accurate rental-yield research, filter to long-let tenancies only. A sixth and final pitfall: stamp duty thresholds (£250K, £925K, £1.5M) drive bunched listing prices just below thresholds. For accurate price-distribution research, account for stamp-duty-driven bunching when interpreting per-area median values.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. UK property data turns over moderately fast — daily polling on top postcode areas + weekly on long-tail covers most use cases. Tier the watchlist into Tier 1 (active investor-research postcodes, daily), Tier 2 (broader UK research, weekly), Tier 3 (long-tail postcodes, monthly).

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful for council-tax-band normalization as area-specific mappings evolve.

Schema validation. Run a daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Rightmove schema occasionally changes during platform UI revisions — catch drift early. Cross-snapshot diff alerts on price-drop events, listing-removals (likely Sold STC), and agent-name changes catch market-velocity signals that pure aggregate-trend monitoring misses.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression for end-to-end pipeline-cost reductions of 70%+ at scale.

## Related use cases

- [Track UK housing market with Rightmove](/blog/track-uk-housing-market-with-rightmove)
- [Build UK rental yield database from Rightmove](/blog/build-uk-rental-yield-database-from-rightmove)
- [Scrape 99acres India real estate listings](/blog/scrape-99acres-india-real-estate-listings)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why scrape Rightmove for UK real estate research?

Rightmove dominates UK property listings — 1M+ active listings with 80%+ market share among UK estate agents. According to Rightmove's 2024 report, the platform serves 13B+ page-views monthly. For UK real estate research, rental-yield analysis, and property-investment intelligence, Rightmove is canonical alongside Zoopla.

### What data does the actor return?

Per listing: title, property type (Detached/Semi/Terraced/Flat/Bungalow), location (postcode area + town), price (£), price per sqft, bedrooms, bathrooms, tenure (Freehold/Leasehold), council tax band, agent name, posted date, image URLs. About 95% of Rightmove listings have comprehensive metadata.

### How does Rightmove compare to Zoopla + OnTheMarket?

Rightmove (~80% market share) dominates UK property listings; Zoopla (~50%) is secondary; OnTheMarket (~25%) is tertiary. Most UK estate agents post on multiple platforms — typical 70-80% overlap between Rightmove and Zoopla. For comprehensive UK property research, run both. Rightmove tends to have fresher listings (agent priority); Zoopla has stronger valuation tooling.

### Can I compute UK rental yields per area?

Yes. Pull buy-listings (capital value) + rent-listings (annual rent) per UK postcode area + property-type. Compute `(annual rent × 12) / capital value × 100` = gross rental yield. UK metro yields typically 3-6%; regional yields 6-10%. London + South East have lower yields (2-4%) but stronger capital appreciation; North England + Wales have higher yields (6-10%) with slower appreciation.

### How fresh do Rightmove snapshots need to be?

For active UK property-research, daily cadence catches new listings within 24h. For UK property-investment monitoring, weekly is sufficient. UK property listings turn over fast (median 30-60 days on market for buy listings, 14-30 days for rentals); for rental-velocity research, daily polling captures rapid-turn cycles.

### How does this compare to Rightmove's official API?

Rightmove's official Data API is gated behind enterprise B2B partnerships ($25K+/year). The actor delivers similar coverage at $0.002/record without partnership gatekeeping. For active estate-agency operations using full ATS integration, Rightmove's API is required. For research-only use cases, the actor is materially cheaper.

Run the [Rightmove Scraper on Apify Store](https://apify.com/thirdwatch/rightmove-scraper) — pay-per-record, free to try, no credit card to test.
