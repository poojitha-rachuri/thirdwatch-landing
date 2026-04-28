---
title: "Track G2 Rating Changes for SaaS Companies (2026)"
slug: "track-g2-rating-changes-for-saas-companies"
description: "Detect G2 rating drift for SaaS companies at $0.008 per result using Thirdwatch. Weekly snapshots + alert thresholds + competitive intelligence recipes."
actor: "g2-software-reviews-scraper"
actor_url: "https://apify.com/thirdwatch/g2-software-reviews-scraper"
actorTitle: "G2 Reviews Scraper"
category: "reviews"
audience: "growth"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-g2-reviews-for-b2b-saas-research"
  - "build-g2-vs-competitor-comparison-pages"
  - "scrape-capterra-reviews-for-smb-saas-research"
keywords:
  - "g2 rating tracker"
  - "saas competitive intelligence"
  - "g2 review monitoring"
  - "b2b saas reputation"
faqs:
  - q: "Why track G2 rating changes?"
    a: "G2 ratings drive 40-60% of B2B SaaS purchase decisions per G2's 2024 report. According to G2's annual buyer research, 92% of SaaS buyers reference G2 ratings before purchase. For SaaS competitive-intelligence + brand-monitoring teams, weekly G2 rating snapshots reveal competitor reputation trajectory + product-quality signals."
  - q: "What rating-change signals matter?"
    a: "Five signals: (1) star rating drift (4.5 → 4.3 = warning); (2) review-volume velocity (3x spike = product launch or PR event); (3) negative-review concentration in 14-day windows (early product issue indicator); (4) Leader/High-Performer badge transitions (quarterly G2 Grid recalc); (5) competitor-comparison-page rating shifts (head-to-head perception). Weekly cadence captures all five."
  - q: "How fresh do G2 snapshots need to be?"
    a: "Weekly cadence catches material rating-drift within 7 days. Daily cadence during active competitive-event windows (competitor product launch, public incident, M&A announcement). For broad SaaS market-research, monthly snapshots produce stable longitudinal trend data. G2 reviews accumulate at 20-100/month per major SaaS — weekly cadence captures 95% of changes."
  - q: "Can I detect competitor product launches via G2 velocity?"
    a: "Yes — review-volume velocity is a leading indicator. SaaS launching new product/feature typically see 2-5x spike in 14-day rolling review volume (mostly positive from beta-users + employees). Cross-reference with Twitter/X mentions for organic-vs-paid signal. 3x+ velocity + Twitter mention spike = high-confidence product-launch signal."
  - q: "What thresholds should trigger alerts?"
    a: "Three thresholds: (1) star rating drop ≥0.2 stars in 14 days = quality-concern alert; (2) review volume spike ≥3x rolling baseline = product/PR-event alert; (3) badge transition (Leader → High-Performer or vice versa, quarterly) = market-position alert. Tune thresholds quarterly based on alert-action rates."
  - q: "How does this compare to G2's own analytics?"
    a: "G2's vendor portal shows YOUR product's metrics — not competitors. G2 Pipeline tracks YOUR pipeline. For competitive-intelligence (multiple competitors at once), the actor is essential. G2 Track ($25K-$100K/year) bundles multi-competitor monitoring but covers limited universe. The actor delivers raw data on any G2 product at $0.008/record."
---

> Thirdwatch's [G2 Reviews Scraper](https://apify.com/thirdwatch/g2-software-reviews-scraper) makes B2B SaaS competitive-intelligence a structured workflow at $0.008 per result — weekly G2 rating snapshots, threshold-based alerting on rating drift, badge-transition tracking, review-velocity detection. Built for B2B SaaS competitive-intel teams, brand-monitoring functions, market-research analysts, and SaaS-investment research.

## Why track G2 rating changes

G2 ratings drive B2B SaaS buying. According to [G2's 2024 Software Buyer Behavior report](https://research.g2.com/), 92% of SaaS buyers reference G2 ratings before purchase, and rating drift of 0.2+ stars correlates with 15-20% pipeline impact for affected vendors. For B2B SaaS competitive-intelligence + brand-monitoring teams, weekly G2 rating snapshots are the canonical competitor-reputation signal.

The job-to-be-done is structured. A B2B SaaS competitive-intel function tracks 50 competitor products weekly across 5 categories. A SaaS investor monitors 200 portfolio + watchlist companies for rating-drift signals. A brand-monitoring team tracks own + 10 competitors for early issue detection. A SaaS market-research analyst maps category-level rating distributions for thesis development. All reduce to per-product weekly aggregation + cross-snapshot delta computation.

## How does this compare to the alternatives?

Three options for G2 rating data:

| Approach | Cost per 50 products weekly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| G2 Track (multi-competitor) | $25K-$100K/year | Curated, lagged | Days | Annual contract |
| G2 vendor portal (own only) | Free for own | Limited to your product | Hours | Per-product license |
| Thirdwatch G2 Scraper | ~$20/week (2.5K records) | Camoufox + residential | 5 minutes | Thirdwatch tracks G2 |

The [G2 Reviews Scraper actor page](/scrapers/g2-software-reviews-scraper) gives you raw multi-product data at the lowest unit cost.

## How to track ratings in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull weekly G2 product snapshots

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~g2-software-reviews-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PRODUCTS = [
    "https://www.g2.com/products/salesforce-sales-cloud/reviews",
    "https://www.g2.com/products/hubspot-marketing-hub/reviews",
    "https://www.g2.com/products/notion/reviews",
    "https://www.g2.com/products/figma/reviews",
    "https://www.g2.com/products/linear/reviews",
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"productUrls": PRODUCTS, "maxReviews": 100},
    timeout=1800,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/g2-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} reviews across {len(PRODUCTS)} products")
```

5 products × 100 reviews = 500 records, costing $4 per snapshot.

### Step 3: Compute rating + volume deltas across snapshots

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/g2-*.json"))
all_dfs = []
for s in snapshots:
    df = pd.DataFrame(json.loads(open(s).read()))
    df["snapshot_date"] = pd.to_datetime(s.split("-")[-1].split(".")[0])
    all_dfs.append(df)
combined = pd.concat(all_dfs, ignore_index=True)
combined["rating"] = pd.to_numeric(combined.rating, errors="coerce")

product_weekly = (
    combined.groupby(["product_name", "snapshot_date"])
    .agg(avg_rating=("rating", "mean"),
         review_count=("review_id", "nunique"))
    .reset_index()
    .sort_values(["product_name", "snapshot_date"])
)
product_weekly["rating_delta_14d"] = product_weekly.groupby("product_name").avg_rating.diff(2)
product_weekly["volume_delta_14d"] = product_weekly.groupby("product_name").review_count.pct_change(2)
print(product_weekly.tail(15))
```

### Step 4: Alert on threshold breaches

```python
import requests as r

drift_alerts = product_weekly[product_weekly.rating_delta_14d <= -0.2]
volume_alerts = product_weekly[product_weekly.volume_delta_14d >= 2.0]

for _, row in drift_alerts.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":warning: {row.product_name}: rating dropped "
                          f"{row.rating_delta_14d:+.2f} stars over 14 days")})

for _, row in volume_alerts.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":rocket: {row.product_name}: {row.volume_delta_14d*100:.0f}% "
                          "review-volume spike — likely launch or PR event")})

print(f"{len(drift_alerts)} rating-drift alerts, {len(volume_alerts)} volume-spike alerts")
```

## Sample output

```json
{
  "review_id": "8765432",
  "product_name": "Notion",
  "rating": 4.7,
  "review_title": "Best knowledge-management tool for SaaS teams",
  "reviewer_role": "VP of Engineering",
  "reviewer_company_size": "201-500 employees",
  "review_date": "2026-04-22",
  "pros": "Flexible, fast, beautiful UI...",
  "cons": "Mobile app could be faster...",
  "url": "https://www.g2.com/products/notion/reviews/notion-review-8765432"
}
```

## Common pitfalls

Three things go wrong in G2 rating-tracking pipelines. **Sample-size sensitivity** — products with <50 reviews show high rating-volatility from individual reviews; for stable trend research, only alert on products with ≥100-review base. **Review authenticity** — G2 has incentivized-review programs (G2 gift cards) that can drive volume spikes that aren't organic; cross-reference with Twitter/X mentions to verify. **Badge cycle confusion** — G2 Grid badges (Leader, High-Performer, Niche) reshuffle quarterly; badge changes don't always reflect rating changes — they reflect category-relative position.

Thirdwatch's actor uses Camoufox + residential proxy at ~$5/1K, ~36% margin. Pair with [Capterra Scraper](https://apify.com/thirdwatch/capterra-scraper) for SMB-tier coverage and [TrustRadius / TrustPilot] for cross-platform reputation triangulation. A fourth subtle issue worth flagging: G2's review-moderation lag (3-7 days from submission to publish) means weekly snapshots reflect 1-week-old reviews; for real-time monitoring of incident-cycles, daily cadence + raw review-date tracking. A fifth pattern unique to G2: enterprise-tier products (Salesforce, Microsoft, etc.) show muted rating-volatility because they accumulate 1000+ reviews; SMB-tier products (50-200 reviews) show 5-10x more sensitivity to individual review batches. For accurate trend research, segment by review-base size. A sixth and final pitfall: G2's own-product-comparison pages (Salesforce vs HubSpot) drive different ratings than standalone product pages (head-to-head context biases reviewers); for fair comparison, normalize against standalone-page ratings only.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (active competitive watchlist, weekly), Tier 2 (broader SaaS market, monthly), Tier 3 (long-tail discovery, quarterly). 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads with gzip compression. Re-derive rating + velocity metrics from raw JSON as your alert-threshold logic evolves. Cross-snapshot diff alerts on badge transitions catch market-position-shift signals.

Schema validation. Daily validation suite asserting expected core fields with non-null rates above 80% (required) and 50% (optional). G2 schema occasionally changes during platform UI revisions — catch drift early. A seventh pattern at scale: cross-snapshot diff alerts for material rating shifts (>0.2 stars over 14 days) catch product-quality or PR signal changes before they propagate to buyer-pipeline impact. An eighth pattern for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early before downstream consumers degrade silently.

A tenth pattern around alert-fatigue management: tune alert thresholds quarterly based on actual analyst-action rates. If analysts ignore 80%+ of alerts at a given threshold, raise the threshold (fewer alerts, higher signal-to-noise). If they manually surface signals the alerts missed, lower the threshold. The right threshold drifts as your watchlist composition changes.

An eleventh and final pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.


A twelfth pattern worth flagging: persist a structured-diff log alongside aggregate snapshots. For each entity, persist (field, old_value, new_value) tuples per scrape into a separate audit table. Surface high-leverage diffs (rating shifts, status changes, name changes) to human reviewers via Slack or email; route low-leverage diffs (description tweaks, photo updates) to the audit log only. This separation prevents alert fatigue while preserving full historical context for post-hoc investigation when downstream consumers report unexpected behavior.

A thirteenth and final pattern at production scale: cost attribution per consumer. Tag every API call with a downstream-consumer identifier (team, product, feature) so you can attribute compute spend back to the workflow that drove it. When a downstream consumer's spend exceeds projected budget, you can have a precise conversation with them about the queries driving cost rather than a vague "scraping is expensive" debate. Cost attribution also surfaces unused snapshot data — consumers who paid for daily cadence but only query weekly results are candidates for cadence-tier downgrade.


## Related use cases

- [Scrape G2 reviews for B2B SaaS research](/blog/scrape-g2-reviews-for-b2b-saas-research)
- [Build G2 vs competitor comparison pages](/blog/build-g2-vs-competitor-comparison-pages)
- [Scrape Capterra reviews for SMB SaaS research](/blog/scrape-capterra-reviews-for-smb-saas-research)
- [The complete guide to scraping reviews](/blog/guide-scraping-reviews)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track G2 rating changes?

G2 ratings drive 40-60% of B2B SaaS purchase decisions per G2's 2024 report. According to G2's annual buyer research, 92% of SaaS buyers reference G2 ratings before purchase. For SaaS competitive-intelligence + brand-monitoring teams, weekly G2 rating snapshots reveal competitor reputation trajectory + product-quality signals.

### What rating-change signals matter?

Five signals: (1) star rating drift (4.5 → 4.3 = warning); (2) review-volume velocity (3x spike = product launch or PR event); (3) negative-review concentration in 14-day windows (early product issue indicator); (4) Leader/High-Performer badge transitions (quarterly G2 Grid recalc); (5) competitor-comparison-page rating shifts (head-to-head perception). Weekly cadence captures all five.

### How fresh do G2 snapshots need to be?

Weekly cadence catches material rating-drift within 7 days. Daily cadence during active competitive-event windows (competitor product launch, public incident, M&A announcement). For broad SaaS market-research, monthly snapshots produce stable longitudinal trend data. G2 reviews accumulate at 20-100/month per major SaaS — weekly cadence captures 95% of changes.

### Can I detect competitor product launches via G2 velocity?

Yes — review-volume velocity is a leading indicator. SaaS launching new product/feature typically see 2-5x spike in 14-day rolling review volume (mostly positive from beta-users + employees). Cross-reference with Twitter/X mentions for organic-vs-paid signal. 3x+ velocity + Twitter mention spike = high-confidence product-launch signal.

### What thresholds should trigger alerts?

Three thresholds: (1) star rating drop ≥0.2 stars in 14 days = quality-concern alert; (2) review volume spike ≥3x rolling baseline = product/PR-event alert; (3) badge transition (Leader → High-Performer or vice versa, quarterly) = market-position alert. Tune thresholds quarterly based on alert-action rates.

### How does this compare to G2's own analytics?

[G2's vendor portal](https://sell.g2.com/) shows YOUR product's metrics — not competitors. G2 Pipeline tracks YOUR pipeline. For competitive-intelligence (multiple competitors at once), the actor is essential. G2 Track ($25K-$100K/year) bundles multi-competitor monitoring but covers limited universe. The actor delivers raw data on any G2 product at $0.008/record.

Run the [G2 Reviews Scraper on Apify Store](https://apify.com/thirdwatch/g2-software-reviews-scraper) — pay-per-result, free to try, no credit card to test.
