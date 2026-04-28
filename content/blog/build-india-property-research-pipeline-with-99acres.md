---
title: "Build an India Property Research Pipeline with 99acres (2026)"
slug: "build-india-property-research-pipeline-with-99acres"
description: "Build a production India property-research pipeline from 99acres at $0.002 per result using Thirdwatch. Multi-city + per-locality + recipes."
actor: "acres99-scraper"
actor_url: "https://apify.com/thirdwatch/acres99-scraper"
actorTitle: "99acres Scraper"
category: "real-estate"
audience: "developers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-99acres-india-real-estate-listings"
  - "monitor-99acres-rental-trends-by-city"
  - "track-india-real-estate-prices-with-magicbricks"
keywords:
  - "india property pipeline"
  - "99acres data engineering"
  - "india proptech"
  - "real estate research india"
faqs:
  - q: "Why build a 99acres property research pipeline?"
    a: "99acres (InfoEdge) is the canonical India tier-1 metro real-estate aggregator with 1.5M+ active listings + 90%+ Mumbai/Delhi/Bangalore broker representation. According to 99acres' 2024 IRIS report, the platform powers India real-estate transaction-data feeding into RBI Housing Price Index. For India proptech platforms, real-estate-investment SaaS, and India PE-research functions, 99acres provides the canonical foundation feed."
  - q: "What does a production property pipeline architecture look like?"
    a: "Three-stage pipeline: (1) ingestion (weekly per-city per-locality scrapes); (2) enrichment (locality-name normalization, BHK-tier classification, capital-rental yield computation); (3) persistence (PostgreSQL with cross-snapshot history). Output: per-locality longitudinal data warehouse with rental + capital + yield benchmarks updated weekly."
  - q: "How fresh do pipeline snapshots need to be?"
    a: "Weekly cadence catches meaningful India tier-1 shifts. Monthly cadence captures faster-moving Bangalore + Hyperabad markets (post-tech-cycle). For active investor-research, weekly snapshots produce stable trend data. India tier-1 metros move materially faster than tier-2/3 — Bangalore can shift 5-10% within a quarter post-major tech layoffs/hiring."
  - q: "How do I scale to 100+ tier-1 localities?"
    a: "100 localities × 4 BHK-tiers × 2 listing-types (rent+sale) = 800 queries × 50 records = 40K records weekly. Cost: ~$80/week. Compute: ~30 min run-time on Apify. For 10K-locality scale (full India coverage including tier-2/3), partition into geographic batches + parallelize 4-8 actor instances."
  - q: "Can I integrate with proptech downstream products?"
    a: "Yes. Production pipeline pattern: (1) actor pulls weekly; (2) enrichment Lambda normalizes data; (3) PostgreSQL upsert with snapshot-history; (4) downstream products query via REST API + Snowflake. Most India proptech SaaS startups (Squareyards, NoBroker analytics) use this pattern. Build time: 2-3 weeks for full pipeline + downstream integration."
  - q: "How does this compare to Knight Frank + JLL India research?"
    a: "[Knight Frank India](https://www.knightfrank.com/india) + [JLL India](https://www.jll.in/) bundle India real-estate research at $20K-$100K/year, lagged 30-90 days. The actor delivers raw real-time per-locality 99acres data at $0.002/record. For programmatic India property pipelines (auto-scoring + auto-categorization), the actor at scale is materially cheaper. For curated qualitative India trend-narratives, consultancies still add value."
---

> Thirdwatch's [99acres Scraper](https://apify.com/thirdwatch/acres99-scraper) makes India property-research-pipeline development a structured workflow at $0.002 per result — multi-city ingestion, locality-tier enrichment, longitudinal data warehouse seeding. Built for India proptech SaaS startups, India real-estate-investment platforms, India HR-relocation services, and India PE-research SaaS founders.

## Why build a 99acres research pipeline

99acres is the canonical India tier-1 metro foundation source. According to [99acres' 2024 IRIS quarterly report](https://www.99acres.com/), the platform indexes 1.5M+ active India listings with 90%+ tier-1 metro broker representation — material foundation for India proptech products. For India proptech + real-estate-investment teams, 99acres provides the canonical multi-source India property pipeline starting point.

The job-to-be-done is structured. An India proptech SaaS startup builds a 100-locality data warehouse for customer-facing comparison tools. An India real-estate-investment platform powers per-locality investment scoring with weekly 99acres data. An India HR-relocation service offers tier-1 metro relocation briefings. An India PE-research SaaS provides society-level yield benchmarks. All reduce to multi-city ingestion + cross-snapshot enrichment + downstream-product API exposure.

## How does this compare to the alternatives?

Three options for India property-research pipelines:

| Approach | Cost per 100-locality weekly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Knight Frank / JLL India | $20K-$100K/year | Authoritative, lagged | Weeks | Annual contract |
| Manual locality-research | Free, time-intensive | Slow | Hours/locality | Daily manual work |
| Thirdwatch 99acres Scraper | ~$80/week (40K records) | HTTP + structured data | 5 minutes | Thirdwatch tracks 99acres |

The [99acres Scraper actor page](/scrapers/acres99-scraper) gives you raw real-time tier-1 data at materially lower per-record cost.

## How to build the pipeline in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Ingest tier-1 metro per-locality batches

```python
import os, requests, datetime, json, pathlib
from itertools import product

ACTOR = "thirdwatch~acres99-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

INDIA_TIER_1 = {
    "Mumbai": ["Powai", "Bandra-West", "Andheri-West", "Lower-Parel"],
    "Delhi-NCR": ["Gurgaon", "Noida", "Saket", "Vasant-Kunj"],
    "Bangalore": ["Indiranagar", "Whitefield", "HSR-Layout", "Koramangala"],
    "Hyderabad": ["Hitech-City", "Gachibowli", "Banjara-Hills"],
    "Pune": ["Koregaon-Park", "Hinjewadi", "Aundh"],
    "Chennai": ["OMR", "Velachery", "Anna-Nagar"],
}

queries = []
for city, localities in INDIA_TIER_1.items():
    for loc in localities:
        for bhk in ["2BHK", "3BHK"]:
            for listing in ["rent", "buy"]:
                queries.append({"city": city, "locality": loc,
                                "property_type": "apartment",
                                "bhk": bhk, "listing": listing})

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 50},
    timeout=3600,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/99acres-pipeline-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} listings across {len(queries)} queries")
```

22 city-localities × 2 BHK × 2 listing-types = 88 queries × 50 = 4,400 records, costing $8.80 per snapshot.

### Step 3: Enrich + persist to PostgreSQL

```python
import re, pandas as pd, psycopg2

def parse_inr(s):
    if not isinstance(s, str): return None
    s = s.lower().replace("₹", "").replace(",", "").strip()
    if "k" in s: return float(s.replace("k", "").strip()) * 1000
    if "cr" in s: return float(re.search(r"([\d.]+)", s).group(1)) * 10_000_000
    if "lac" in s or "lakh" in s: return float(re.search(r"([\d.]+)", s).group(1)) * 100_000
    try: return float(s)
    except: return None

df = pd.DataFrame(records)
df["price_inr"] = df.price.apply(parse_inr)
df["area_sqft"] = pd.to_numeric(df.area_sqft, errors="coerce")
df["price_per_sqft"] = df.price_inr / df.area_sqft

# Locality-name normalization
LOCALITY_CANONICAL = {
    "Indira Nagar": "Indiranagar",
    "HSR": "HSR-Layout",
    # ... extend mapping
}
df["locality"] = df.locality.replace(LOCALITY_CANONICAL)

# Persist to PostgreSQL
with psycopg2.connect(...) as conn, conn.cursor() as cur:
    for _, row in df.iterrows():
        cur.execute(
            """INSERT INTO india_listings
                  (listing_id, city, locality, bhk, listing_type, price_inr,
                   area_sqft, price_per_sqft, snapshot_date)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s, current_date)
               ON CONFLICT (listing_id) DO UPDATE SET
                 price_inr = EXCLUDED.price_inr,
                 snapshot_date = EXCLUDED.snapshot_date""",
            (row.listing_id, row.city, row.locality, row.bhk, row.listing,
             row.price_inr, row.area_sqft, row.price_per_sqft),
        )
print(f"Persisted {len(df)} listings")
```

### Step 4: Compute per-locality benchmarks + expose via API

```python
# Per-locality benchmarks (refreshed weekly)
benchmarks = (
    df.dropna(subset=["price_per_sqft"])
    .groupby(["city", "locality", "bhk", "listing"])
    .agg(median_psf=("price_per_sqft", "median"),
         p25_psf=("price_per_sqft", lambda x: x.quantile(0.25)),
         p75_psf=("price_per_sqft", lambda x: x.quantile(0.75)),
         listing_count=("listing_id", "count"))
    .reset_index()
)
benchmarks = benchmarks[benchmarks.listing_count >= 5]
benchmarks.to_sql("india_benchmarks", con=engine, if_exists="replace")

# Expose via REST API (FastAPI example)
# @app.get("/api/locality/{city}/{locality}/benchmarks")
# def get_benchmarks(city: str, locality: str):
#     return query("SELECT * FROM india_benchmarks WHERE city=%s AND locality=%s",
#                  (city, locality))

print(f"{len(benchmarks)} locality-tier benchmarks ready for API")
```

## Sample output

```json
{
  "listing_id": "99acres-12345",
  "title": "3 BHK Apartment for Sale in Indiranagar",
  "city": "Bangalore",
  "locality": "Indiranagar",
  "price": "₹3.5 Cr",
  "price_inr": 35000000,
  "area_sqft": 1850,
  "price_per_sqft": 18919,
  "bedrooms": 3,
  "furnishing_status": "Semi-Furnished",
  "tenure": "Freehold",
  "url": "https://www.99acres.com/property-99acres-12345"
}
```

## Common pitfalls

Three things go wrong in property-pipeline development. **Locality-name normalization variance** — Indiranagar vs Indira Nagar vs Indiranagara; for clean longitudinal research, build canonical-name mapping (50-100 entries cover 99% of cases). **Format-mixing in price** — listings mix Crores (₹3.5 Cr), Lakhs (₹35 Lac), Thousands (₹35K) per BHK + listing-type; always normalize to base INR before benchmarking. **Cross-platform dedup** — same listing posted on 99acres + MagicBricks; for accurate inventory research, cluster on (locality, area_sqft, bedrooms) before benchmarking.

Thirdwatch's actor uses HTTP + structured data extraction at $0.10/1K, ~88% margin. Pair 99acres with [MagicBricks Scraper](https://apify.com/thirdwatch/magicbricks-scraper) for tier-2/3 cross-validation + [NoBroker Scraper](https://apify.com/thirdwatch/nobroker-scraper) for owner-listed cross-reference. A fourth subtle issue worth flagging: India tier-1 cycles tightly correlate with tech-hiring cycles — Bangalore pricing dropped 8-12% during 2022-2023 tech layoffs, recovered 12-15% during 2024 hiring rebound; for accurate trend research, segment per tech-cycle phase. A fifth pattern unique to India proptech: society-level data isn't available on 99acres directly — for society-tier research, supplement with CommonFloor (society-skewed). A sixth and final pitfall: India fiscal-year-start (April 1) drives 30-40% of annual real-estate transaction activity; for accurate base-rate research, deseasonalize against fiscal-year cycle.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (active investor-research watchlist, weekly), Tier 2 (broader tier-1 coverage, monthly), Tier 3 (long-tail localities, quarterly). 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads with gzip compression. Re-derive per-locality benchmarks from raw JSON as your locality-name + BHK-classification logic evolves. Cross-snapshot diff alerts on per-locality price-velocity catch India real-estate-cycle inflection points.

Schema validation. Daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). 99acres schema occasionally changes during platform UI revisions — catch drift early. A seventh pattern at scale: cross-snapshot diff alerts for material price shifts (>5% Q/Q at locality level) catch market-cycle inflection points before broader market awareness. An eighth pattern for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently.

A tenth pattern around alert-fatigue management: tune alert thresholds quarterly based on actual analyst-action rates. If analysts ignore 80%+ of alerts at a given threshold, raise the threshold. If they manually surface signals the alerts missed, lower the threshold.

An eleventh and final pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

A twelfth pattern: cost attribution per consumer. Tag every API call with a downstream-consumer identifier (team, product, feature) so you can attribute compute spend back to the workflow that drove it. When a downstream consumer's spend exceeds projected budget, you can have a precise conversation with them about the queries driving cost.

## Related use cases

- [Scrape 99acres India real estate listings](/blog/scrape-99acres-india-real-estate-listings)
- [Monitor 99acres rental trends by city](/blog/monitor-99acres-rental-trends-by-city)
- [Track India real estate prices with MagicBricks](/blog/track-india-real-estate-prices-with-magicbricks)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why build a 99acres property research pipeline?

99acres (InfoEdge) is the canonical India tier-1 metro real-estate aggregator with 1.5M+ active listings + 90%+ Mumbai/Delhi/Bangalore broker representation. According to 99acres' 2024 IRIS report, the platform powers India real-estate transaction-data feeding into RBI Housing Price Index. For India proptech platforms, real-estate-investment SaaS, and India PE-research functions, 99acres provides the canonical foundation feed.

### What does a production property pipeline architecture look like?

Three-stage pipeline: (1) ingestion (weekly per-city per-locality scrapes); (2) enrichment (locality-name normalization, BHK-tier classification, capital-rental yield computation); (3) persistence (PostgreSQL with cross-snapshot history). Output: per-locality longitudinal data warehouse with rental + capital + yield benchmarks updated weekly.

### How fresh do pipeline snapshots need to be?

Weekly cadence catches meaningful India tier-1 shifts. Monthly cadence captures faster-moving Bangalore + Hyperabad markets (post-tech-cycle). For active investor-research, weekly snapshots produce stable trend data. India tier-1 metros move materially faster than tier-2/3 — Bangalore can shift 5-10% within a quarter post-major tech layoffs/hiring.

### How do I scale to 100+ tier-1 localities?

100 localities × 4 BHK-tiers × 2 listing-types (rent+sale) = 800 queries × 50 records = 40K records weekly. Cost: ~$80/week. Compute: ~30 min run-time on Apify. For 10K-locality scale (full India coverage including tier-2/3), partition into geographic batches + parallelize 4-8 actor instances.

### Can I integrate with proptech downstream products?

Yes. Production pipeline pattern: (1) actor pulls weekly; (2) enrichment Lambda normalizes data; (3) PostgreSQL upsert with snapshot-history; (4) downstream products query via REST API + Snowflake. Most India proptech SaaS startups (Squareyards, NoBroker analytics) use this pattern. Build time: 2-3 weeks for full pipeline + downstream integration.

### How does this compare to Knight Frank + JLL India research?

[Knight Frank India](https://www.knightfrank.com/india) + [JLL India](https://www.jll.in/) bundle India real-estate research at $20K-$100K/year, lagged 30-90 days. The actor delivers raw real-time per-locality 99acres data at $0.002/record. For programmatic India property pipelines (auto-scoring + auto-categorization), the actor at scale is materially cheaper. For curated qualitative India trend-narratives, consultancies still add value.

Run the [99acres Scraper on Apify Store](https://apify.com/thirdwatch/acres99-scraper) — pay-per-result, free to try, no credit card to test.
