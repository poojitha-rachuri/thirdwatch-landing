---
title: "Build Hotel Availability Monitoring with Booking.com (2026)"
slug: "build-hotel-availability-monitoring-with-booking"
description: "Monitor real-time hotel availability + occupancy via Booking.com at $0.008 per result using Thirdwatch. Per-property per-date snapshots + recipes."
actor: "booking-hotel-scraper"
actor_url: "https://apify.com/thirdwatch/booking-hotel-scraper"
actorTitle: "Booking.com Scraper"
category: "business"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-booking-hotel-data-for-travel-research"
  - "track-booking-com-pricing-for-hotel-revenue"
  - "scrape-tripadvisor-hotels-and-attractions"
keywords:
  - "hotel availability monitoring"
  - "booking.com occupancy"
  - "real-time hotel inventory"
  - "hospitality occupancy data"
faqs:
  - q: "Why monitor hotel availability via Booking.com?"
    a: "Booking.com surfaces real-time availability for 28M+ properties globally — the canonical consumer-facing inventory signal. According to Booking Holdings' 2024 report, the platform processes 1B+ room nights annually. For revenue-management teams, hotel-investment research, and travel-tech platforms, Booking availability is the closest proxy to true market-occupancy without first-party PMS access."
  - q: "What availability signals matter?"
    a: "Four signals: (1) sold-out vs available status per date; (2) lowest-available-rate per date (correlated with occupancy); (3) room-type availability mix (suite-only available = high-occupancy signal); (4) booking-window 'Only X rooms left' urgency-tags (active demand signal). Combined per-property per-date tracking reveals occupancy-velocity + revenue-pacing patterns."
  - q: "How fresh do availability snapshots need to be?"
    a: "Daily cadence for active revenue-management. 6-hourly cadence during high-demand windows (event-week, holiday surge, conference periods) catches intra-day rate movements. Most properties update inventory hourly; snapshot at peak booking-decision times (10am, 2pm, 8pm local) for highest-signal data."
  - q: "Can I infer occupancy from availability data?"
    a: "Yes — directional, not absolute. If a property's calendar shows 80% of dates 'sold out' over 30-day forward window, occupancy ~= 70-80%. Cross-validate against STR (Smith Travel Research) reports for accuracy benchmarking. For revenue-management, directional occupancy + competitor-pricing context is sufficient for rate-decisions; absolute occupancy requires PMS access."
  - q: "How do I segment by property class + market?"
    a: "Booking categorizes properties by star-rating (1-5), property-type (hotel, apartment, hostel), and market-tier. Segment before benchmarking: luxury (4-5 star) shows different occupancy patterns than economy (1-2 star). Per-market segmentation also matters: Manhattan vs Brooklyn show different mid-week patterns. For accurate revenue-research, segment per category-and-market."
  - q: "How does this compare to STR + first-party PMS data?"
    a: "STR ($25K-$100K/year): authoritative aggregate occupancy data, 30-90 day lag, market-level only. First-party PMS access: real-time, property-level, but only for owned properties. Booking availability: real-time, per-property, public data — material gap fill between STR (lagged + aggregate) and PMS (owned-only). For competitive-intelligence + multi-property revenue-research, Booking is essential."
---

> Thirdwatch's [Booking.com Scraper](https://apify.com/thirdwatch/booking-hotel-scraper) makes hotel availability-monitoring a structured workflow at $0.008 per result — per-property per-date availability + lowest-rate snapshots, daily cadence support, urgency-tag detection. Built for hotel revenue-management teams, hospitality-investment research, travel-tech platforms, and OTA-competitive-intelligence functions.

## Why monitor hotel availability via Booking.com

Booking.com is the canonical consumer-facing inventory signal. According to [Booking Holdings' 2024 annual report](https://www.bookingholdings.com/), the platform processes 1B+ room nights annually with 28M+ active property listings — providing real-time availability data unavailable from any other source short of first-party PMS access. For revenue-management + hotel-investment research teams, Booking availability is the canonical multi-property occupancy proxy.

The job-to-be-done is structured. A hotel revenue-management function monitors 5 direct competitors daily across 90-day forward window. A hospitality-investment fund tracks 200 portfolio properties for occupancy-trajectory analysis. A travel-tech platform powers customer-facing rate-comparison tools with live availability data. A OTA-competitive-intelligence team studies cross-OTA inventory dynamics for marketplace strategy. All reduce to per-property per-date queries + cross-snapshot delta computation.

## How does this compare to the alternatives?

Three options for hotel availability data:

| Approach | Cost per 100 properties × 90 dates daily | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| STR (Smith Travel Research) | $25K-$100K/year | Authoritative, 30-90d lag | Days | Annual contract |
| First-party PMS access | Varies, owned-only | Real-time owned | Weeks | Per-property integration |
| Thirdwatch Booking.com Scraper | ~$72/day (9K records) | Camoufox + residential | 5 minutes | Thirdwatch tracks Booking |

The [Booking.com Scraper actor page](/scrapers/booking-hotel-scraper) gives you raw real-time availability data at the lowest unit cost.

## How to monitor availability in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull daily availability snapshots per property × date

```python
import os, requests, datetime, json, pathlib
from itertools import product

ACTOR = "thirdwatch~booking-hotel-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PROPERTIES = [
    "https://www.booking.com/hotel/us/standard-high-line.html",
    "https://www.booking.com/hotel/us/the-line-la.html",
    "https://www.booking.com/hotel/us/ace-new-orleans.html",
]

today = datetime.date.today()
DATES = [(today + datetime.timedelta(days=d)).isoformat() for d in [7, 14, 30, 60, 90]]

queries = [{"hotelUrl": p, "checkIn": d, "checkOut": (datetime.date.fromisoformat(d) + datetime.timedelta(days=1)).isoformat()}
           for p, d in product(PROPERTIES, DATES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries},
    timeout=1800,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/booking-avail-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} property-date availability snapshots")
```

3 properties × 5 dates = 15 records, costing $0.12 per snapshot.

### Step 3: Compute per-property per-date availability metrics

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/booking-avail-*.json"))
all_dfs = []
for s in snapshots:
    df = pd.DataFrame(json.loads(open(s).read()))
    df["snapshot_ts"] = pd.to_datetime(s.split("-")[-1].split(".")[0])
    all_dfs.append(df)
combined = pd.concat(all_dfs, ignore_index=True)

combined["lowest_rate"] = pd.to_numeric(combined.lowest_rate, errors="coerce")
combined["is_sold_out"] = combined.available == False

# Per property × date occupancy proxy
occupancy = (
    combined.groupby(["hotel_name", "checkin_date"])
    .agg(latest_rate=("lowest_rate", "last"),
         latest_avail=("available", "last"),
         rate_volatility=("lowest_rate", "std"),
         sold_out_count=("is_sold_out", "sum"))
    .reset_index()
)
print(occupancy.sort_values("latest_rate", ascending=False).head(10))
```

### Step 4: Build per-market occupancy index

```python
import requests as r

# Compare against market-level baselines
baseline_rate = combined.groupby("market").lowest_rate.median()
combined["rate_vs_market_pct"] = (combined.lowest_rate - combined.market.map(baseline_rate)) / combined.market.map(baseline_rate) * 100

# Alert on significant rate moves
moves = combined[combined.rate_vs_market_pct.abs() >= 20]
for _, row in moves.iterrows():
    direction = "above" if row.rate_vs_market_pct > 0 else "below"
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":hotel: {row.hotel_name} on {row.checkin_date}: "
                          f"${row.lowest_rate} ({row.rate_vs_market_pct:+.0f}% {direction} market)")})

print(f"{len(moves)} property-dates with ≥20% market-rate divergence")
```

## Sample output

```json
{
  "hotel_name": "The Standard High Line",
  "hotel_id": "us-standard-high-line",
  "checkin_date": "2026-05-15",
  "checkout_date": "2026-05-16",
  "available": true,
  "lowest_rate": 425,
  "currency": "USD",
  "rooms_left_message": "Only 2 rooms left at this price",
  "star_rating": 4,
  "market": "New York City"
}
```

## Common pitfalls

Three things go wrong in availability-monitoring pipelines. **Geo-pricing variance** — Booking.com shows different rates to different geo-IPs (US vs EU vs APAC); pin proxy region for consistent benchmarking. **Date-window confusion** — properties frequently flag near-term dates (0-7 days out) "sold out" due to inventory-management policies; for accurate occupancy proxy, focus on 14-90 day forward window. **Rate-currency normalization** — multi-market monitoring requires daily FX normalization to a common currency (USD or EUR).

Thirdwatch's actor uses Camoufox + residential proxy at ~$2/1K, ~68% margin. Pair with [TripAdvisor Scraper](https://apify.com/thirdwatch/tripadvisor-scraper) for review-context alongside availability data. A fourth subtle issue worth flagging: Booking.com shows "Genius member" rates (loyalty-tier pricing) to logged-in users — public scraping captures non-member rates, which run 5-15% higher than logged-in rates; for accurate competitive-pricing research, factor in genius-tier discount baseline. A fifth pattern unique to Booking-availability: events drive material occupancy spikes (NYE, Coachella, conferences); for accurate base-rate research, exclude event-windows from longitudinal analysis. A sixth and final pitfall: shoulder-season vs peak-season availability patterns differ dramatically — for fair YoY comparison, segment by season rather than treating all forward-dates as comparable.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (active competitive watchlist, daily), Tier 2 (broader market, weekly), Tier 3 (long-tail discovery, monthly). 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads with gzip compression. Re-derive availability metrics from raw JSON as your sold-out-detection logic evolves. Cross-snapshot diff alerts on dramatic rate-movement catch demand-shock signals (events, weather, news) that propagate to revenue-management decisions.

Schema validation. Daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). Booking.com schema occasionally changes during platform UI revisions — catch drift early. A seventh pattern at scale: cross-snapshot diff alerts for rate movements ≥20% vs market baseline catch demand-pricing inflection points before they propagate to broader market awareness. An eighth pattern for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early before downstream consumers degrade silently.

A tenth pattern around alert-fatigue management: tune alert thresholds quarterly based on actual revenue-manager-action rates. If managers ignore 80%+ of alerts at a given threshold, raise the threshold. If they manually surface signals the alerts missed, lower the threshold. The right threshold drifts as your watchlist composition changes and as your downstream consumers learn what's actually actionable.

An eleventh and final pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, room-type re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.


A twelfth pattern worth flagging: persist a structured-diff log alongside aggregate snapshots. For each entity, persist (field, old_value, new_value) tuples per scrape into a separate audit table. Surface high-leverage diffs to human reviewers via Slack or email; route low-leverage diffs to the audit log only. This separation prevents alert fatigue while preserving full historical context for post-hoc investigation when downstream consumers report unexpected behavior.

A thirteenth and final pattern at production scale: cost attribution per consumer. Tag every API call with a downstream-consumer identifier (team, product, feature) so you can attribute compute spend back to the workflow that drove it. When a downstream consumer's spend exceeds projected budget, you can have a precise conversation with them about the queries driving cost rather than a vague "scraping is expensive" debate. Cost attribution also surfaces unused snapshot data — consumers who paid for daily cadence but only query weekly results are candidates for cadence-tier downgrade.


## Related use cases

- [Scrape Booking hotel data for travel research](/blog/scrape-booking-hotel-data-for-travel-research)
- [Track Booking.com pricing for hotel revenue](/blog/track-booking-com-pricing-for-hotel-revenue)
- [Scrape TripAdvisor hotels and attractions](/blog/scrape-tripadvisor-hotels-and-attractions)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why monitor hotel availability via Booking.com?

Booking.com surfaces real-time availability for 28M+ properties globally — the canonical consumer-facing inventory signal. According to Booking Holdings' 2024 report, the platform processes 1B+ room nights annually. For revenue-management teams, hotel-investment research, and travel-tech platforms, Booking availability is the closest proxy to true market-occupancy without first-party PMS access.

### What availability signals matter?

Four signals: (1) sold-out vs available status per date; (2) lowest-available-rate per date (correlated with occupancy); (3) room-type availability mix (suite-only available = high-occupancy signal); (4) booking-window 'Only X rooms left' urgency-tags (active demand signal). Combined per-property per-date tracking reveals occupancy-velocity + revenue-pacing patterns.

### How fresh do availability snapshots need to be?

Daily cadence for active revenue-management. 6-hourly cadence during high-demand windows (event-week, holiday surge, conference periods) catches intra-day rate movements. Most properties update inventory hourly; snapshot at peak booking-decision times (10am, 2pm, 8pm local) for highest-signal data.

### Can I infer occupancy from availability data?

Yes — directional, not absolute. If a property's calendar shows 80% of dates 'sold out' over 30-day forward window, occupancy ~= 70-80%. Cross-validate against STR (Smith Travel Research) reports for accuracy benchmarking. For revenue-management, directional occupancy + competitor-pricing context is sufficient for rate-decisions; absolute occupancy requires PMS access.

### How do I segment by property class + market?

Booking categorizes properties by star-rating (1-5), property-type (hotel, apartment, hostel), and market-tier. Segment before benchmarking: luxury (4-5 star) shows different occupancy patterns than economy (1-2 star). Per-market segmentation also matters: Manhattan vs Brooklyn show different mid-week patterns. For accurate revenue-research, segment per category-and-market.

### How does this compare to STR + first-party PMS data?

[STR](https://str.com/) ($25K-$100K/year): authoritative aggregate occupancy data, 30-90 day lag, market-level only. First-party PMS access: real-time, property-level, but only for owned properties. Booking availability: real-time, per-property, public data — material gap fill between STR (lagged + aggregate) and PMS (owned-only). For competitive-intelligence + multi-property revenue-research, Booking is essential.

Run the [Booking.com Scraper on Apify Store](https://apify.com/thirdwatch/booking-hotel-scraper) — pay-per-result, free to try, no credit card to test.
