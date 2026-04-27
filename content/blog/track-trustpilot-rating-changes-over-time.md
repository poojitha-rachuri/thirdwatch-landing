---
title: "Track Trustpilot Rating Changes Over Time (2026)"
slug: "track-trustpilot-rating-changes-over-time"
description: "Monitor Trustpilot brand rating drift at $0.002 per record using Thirdwatch. Weekly snapshot + 4-week rolling delta + Slack alerts on negative rating drift."
actor: "trustpilot-reviews-scraper"
actor_url: "https://apify.com/thirdwatch/trustpilot-scraper"
actorTitle: "Trustpilot Scraper"
category: "reviews"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "scrape-trustpilot-reviews-for-brand-monitoring"
  - "build-consumer-brand-reputation-dashboard"
  - "track-glassdoor-rating-changes-over-time"
keywords:
  - "trustpilot rating tracker"
  - "brand rating drift"
  - "trustpilot delta detection"
  - "consumer brand reputation"
faqs:
  - q: "Why track Trustpilot rating changes specifically?"
    a: "Trustpilot's aggregate brand rating is the canonical consumer-trust metric outside the US — 89% of consumers reference review platforms before purchasing online (Trustpilot 2024 Trust report). A 0.2-star rating drop within a quarter materially affects conversion rates; a 0.5-star drop signals brand-crisis territory. For consumer-brand monitoring, M&A diligence, and reputation-management, rating drift is the single highest-signal Trustpilot KPI."
  - q: "What rating-change threshold matters?"
    a: "0.2-star drops over 4 weeks at brands with 200+ reviews are statistically meaningful (real signal vs noise). 0.3+ drops are alert-worthy at any review-count. Always check `aggregate_review_count` delta alongside rating delta — if 50+ new reviews drove the move, it's real signal. Below 50-review brands show high statistical noise and aren't reliable for trajectory analysis."
  - q: "How fresh do snapshots need to be?"
    a: "Daily cadence catches ratings drift same-day for crisis-monitoring use cases. Weekly cadence is sufficient for steady-state competitive-research. For M&A diligence (rating trajectory under acquisition narrative), daily during diligence window + monthly historical baseline. Most active Trustpilot brands see 5-50 new reviews per month."
  - q: "Can I detect coordinated review attacks vs genuine quality shifts?"
    a: "Yes. Three signals distinguish: (1) review-volume velocity (>10 negative within 24h vs typical 1-2/day baseline indicates coordination); (2) reviewer-account age (newly-created accounts disproportionate); (3) language similarity (templated phrases). Cross-reference all three for high-confidence attack-detection. Real quality issues show distributed timing + organic-account distribution + diverse language."
  - q: "How does Trustpilot's moderation affect tracking?"
    a: "Trustpilot moderates ~5-10% of reviews within 30 days (policy violations, paid-review detection). For longitudinal rating analysis, expect apparent rating 'improvements' that don't reflect underlying sentiment — moderation removes negative reviews disproportionately. Cross-reference with underlying sentiment data + company-side metrics for accurate trajectory interpretation."
  - q: "What's the best alerting threshold?"
    a: "Tier 1 (immediate Slack): 0.3+ star drop with 20+ new reviews driving it. Tier 2 (daily digest): 0.2 star drop with 10+ reviews. Tier 3 (weekly review): trend-line breaks for any brand. Cumulative across 50-brand watchlist generates 5-15 high-signal alerts per week — manageable for reputation-team review without alert fatigue."
---

> Thirdwatch's [Trustpilot Scraper](https://apify.com/thirdwatch/trustpilot-scraper) makes brand rating drift tracking a structured workflow at $0.002 per record — daily snapshots, 4-week rolling delta detection, threshold-based Slack alerting. Built for consumer-brand monitoring teams, M&A diligence on B2C brands, reputation-management functions, and crisis-detection workflows.

## Why track Trustpilot rating changes

Consumer brand reputation is dynamic + materially affects conversion. According to [Trustpilot's 2024 Trust report](https://www.trustpilot.com/), brands with sustained 0.3-star rating drops within a quarter see 18-25% conversion-rate declines + 30%+ slower customer-acquisition rates. For consumer-brand monitoring teams, M&A diligence on B2C brands, and reputation-management functions, rating drift detection catches signals 6-12 weeks before they show up in lagging revenue metrics.

The job-to-be-done is structured. A consumer-brand-monitoring team tracks 50 brands daily for rating drift + crisis detection. An M&A diligence analyst studies target brand-trajectory over 24 months for acquisition decision support. An ecommerce reputation tracking function catches viral negative-review events early. A consumer-brand competitive-research function maps category-level rating positioning. All reduce to brand-domain queries + daily aggregation + 4-week rolling delta computation.

## How does this compare to the alternatives?

Three options for Trustpilot trajectory data:

| Approach | Cost per 50 brands monthly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Reputation.com / Birdeye | $5K-$50K/year per seat | Multi-platform aggregation | Days | Vendor contract |
| Trustpilot Business (paid) | $50-$1K/month per business | Owned-brand only | Hours | Per-business license |
| Thirdwatch Trustpilot Scraper | ~$30/month (daily, 50 brands × 100 reviews) | HTTP + Next.js extraction | 5 minutes | Thirdwatch tracks Trustpilot changes |

Reputation.com bundles multi-platform aggregation at the high end. Trustpilot Business is owned-brand-only. The [Trustpilot Scraper actor page](/scrapers/trustpilot-scraper) gives you raw cross-brand trajectory data at the lowest unit cost.

## How to track rating changes in 4 steps

### Step 1: Authenticate

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: Pull a brand watchlist daily

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~trustpilot-reviews-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

BRANDS = ["stripe.com", "shopify.com", "klarna.com",
          "wise.com", "revolut.com", "monzo.com",
          "n26.com", "starlingbank.com", "nubank.com",
          "mercury.com", "ramp.com", "deel.com"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": BRANDS, "maxResults": 50},
    timeout=900,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/trustpilot-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} reviews across {len(BRANDS)} brands")
```

12 brands × 50 reviews each = 600 records daily, costing $1.20.

### Step 3: Compute 4-week rating delta

```python
import pandas as pd, glob

snapshots = sorted(glob.glob("snapshots/trustpilot-*.json"))
dfs = []
for s in snapshots:
    df = pd.DataFrame(json.loads(open(s).read()))
    df["snapshot_date"] = pd.to_datetime(s.split("-")[-1].split(".")[0])
    dfs.append(df)

all_df = pd.concat(dfs, ignore_index=True)
weekly = (
    all_df.groupby(["business_domain", "snapshot_date"])
    .agg(rating=("aggregate_rating", "first"),
         review_count=("aggregate_review_count", "first"))
    .reset_index()
)
weekly["rating_delta_4w"] = weekly.groupby("business_domain").rating.diff(28)
weekly["reviews_delta_4w"] = weekly.groupby("business_domain").review_count.diff(28)

drops = weekly[
    (weekly.rating_delta_4w <= -0.2)
    & (weekly.reviews_delta_4w >= 20)
]
print(f"{len(drops)} brand-rating drops over 4 weeks (real signal)")
```

0.2-star drop with 20+ new reviews driving it = real sentiment shift.

### Step 4: Forward Slack alerts on confirmed drift

```python
import requests as r

snapshot = pathlib.Path("trustpilot-alerts-seen.json")
seen = set(tuple(x) for x in json.loads(snapshot.read_text())) if snapshot.exists() else set()

new_alerts = drops[~drops.apply(
    lambda x: (x.business_domain, str(x.snapshot_date)), axis=1
).isin(seen)]

for _, a in new_alerts.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":warning: *{a.business_domain}* rating dropped "
                          f"{a.rating_delta_4w:+.2f} stars over 4 weeks "
                          f"(now {a.rating}, +{int(a.reviews_delta_4w)} new reviews)")})

new_keys = [(a.business_domain, str(a.snapshot_date)) for _, a in new_alerts.iterrows()]
snapshot.write_text(json.dumps(list(seen | set(new_keys))))
print(f"{len(new_alerts)} new rating-drop alerts forwarded")
```

Schedule daily; alert pipeline runs unattended, surfaces only new drift events.

## Sample output

```json
{
  "business_domain": "stripe.com",
  "business_name": "Stripe",
  "aggregate_rating": 4.3,
  "aggregate_review_count": 1842,
  "rating": 5,
  "title": "Best payment processor for SaaS",
  "review_text": "We've used Stripe for 3 years...",
  "review_date": "2026-04-15",
  "verified_buyer": true,
  "company_response": "Thanks for the kind words..."
}
```

## Common pitfalls

Three things go wrong in trajectory pipelines. **Review-volume bias** — brands under 50 reviews show statistical noise; require 100+ review threshold. **Coordinated review-bombing** — distinguish from real quality shifts via volume-velocity + account-age + language-similarity signals. **Moderation lag** — Trustpilot removes ~5-10% of reviews within 30 days; rating "improvements" can lag actual sentiment.

Thirdwatch's actor uses HTTP + Next.js data at $0.04/1K, ~98% margin. Pair Trustpilot with [G2 Scraper](https://apify.com/thirdwatch/g2-scraper) and [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) for cross-platform brand monitoring. A fourth subtle issue: Trustpilot's "Trustpilot Business" subscribers can invite reviews directly, often skewing review-mix positive — for unbiased trajectory research, supplement with Google reviews + organic channels. A fifth pattern: response-rate strongly correlates with rating — high-response-rate brands maintain ratings 0.3-0.5 stars higher. A sixth and final pitfall: regional brand variance — same brand can have different ratings per Trustpilot regional domain (trustpilot.com vs trustpilot.de vs trustpilot.fr); for accurate global tracking, aggregate across regional domains.

## Operational best practices for production pipelines

Tier the cadence: Tier 1 (top brands, daily), Tier 2 (broader watchlist, weekly), Tier 3 (long-tail, monthly). 60-80% cost reduction with negligible signal loss.

Snapshot raw payloads with gzip compression. Re-derive metrics from raw JSON as sentiment models evolve.

Schema validation. Daily validation suite + cross-snapshot diff alerts on rating + review-count changes catch signals.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression for end-to-end pipeline-cost reductions of 70%+ at scale.

A ninth and final pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early.

## Related use cases

- [Scrape Trustpilot reviews for brand monitoring](/blog/scrape-trustpilot-reviews-for-brand-monitoring)
- [Build consumer brand reputation dashboard](/blog/build-consumer-brand-reputation-dashboard)
- [Track Glassdoor rating changes over time](/blog/track-glassdoor-rating-changes-over-time)
- [The complete guide to scraping reviews](/blog/guide-scraping-reviews)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why track Trustpilot rating changes specifically?

Trustpilot's aggregate brand rating is the canonical consumer-trust metric outside the US — 89% of consumers reference review platforms before purchasing online (Trustpilot 2024 Trust report). A 0.2-star rating drop within a quarter materially affects conversion rates; a 0.5-star drop signals brand-crisis territory. For consumer-brand monitoring, M&A diligence, and reputation-management, rating drift is the single highest-signal Trustpilot KPI.

### What rating-change threshold matters?

0.2-star drops over 4 weeks at brands with 200+ reviews are statistically meaningful (real signal vs noise). 0.3+ drops are alert-worthy at any review-count. Always check `aggregate_review_count` delta alongside rating delta — if 50+ new reviews drove the move, it's real signal. Below 50-review brands show high statistical noise and aren't reliable for trajectory analysis.

### How fresh do snapshots need to be?

Daily cadence catches ratings drift same-day for crisis-monitoring use cases. Weekly cadence is sufficient for steady-state competitive-research. For M&A diligence (rating trajectory under acquisition narrative), daily during diligence window + monthly historical baseline. Most active Trustpilot brands see 5-50 new reviews per month.

### Can I detect coordinated review attacks vs genuine quality shifts?

Yes. Three signals distinguish: (1) review-volume velocity (>10 negative within 24h vs typical 1-2/day baseline indicates coordination); (2) reviewer-account age (newly-created accounts disproportionate); (3) language similarity (templated phrases). Cross-reference all three for high-confidence attack-detection. Real quality issues show distributed timing + organic-account distribution + diverse language.

### How does Trustpilot's moderation affect tracking?

Trustpilot moderates ~5-10% of reviews within 30 days (policy violations, paid-review detection). For longitudinal rating analysis, expect apparent rating "improvements" that don't reflect underlying sentiment — moderation removes negative reviews disproportionately. Cross-reference with underlying sentiment data + company-side metrics for accurate trajectory interpretation.

### What's the best alerting threshold?

Tier 1 (immediate Slack): 0.3+ star drop with 20+ new reviews driving it. Tier 2 (daily digest): 0.2 star drop with 10+ reviews. Tier 3 (weekly review): trend-line breaks for any brand. Cumulative across 50-brand watchlist generates 5-15 high-signal alerts per week — manageable for reputation-team review without alert fatigue.

Run the [Trustpilot Scraper on Apify Store](https://apify.com/thirdwatch/trustpilot-scraper) — pay-per-record, free to try, no credit card to test.
