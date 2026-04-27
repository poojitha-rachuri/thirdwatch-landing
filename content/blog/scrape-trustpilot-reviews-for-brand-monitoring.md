---
title: "Scrape Trustpilot Reviews for Brand Monitoring (2026)"
slug: "scrape-trustpilot-reviews-for-brand-monitoring"
description: "Pull Trustpilot reviews + ratings at $0.002 per record using Thirdwatch. Daily snapshot + sentiment + Slack alerts on rating drift."
actor: "trustpilot-reviews-scraper"
actor_url: "https://apify.com/thirdwatch/trustpilot-scraper"
actorTitle: "Trustpilot Scraper"
category: "reviews"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "track-trustpilot-rating-changes-over-time"
  - "build-consumer-brand-reputation-dashboard"
  - "scrape-g2-reviews-for-b2b-saas-research"
keywords:
  - "trustpilot scraper"
  - "consumer brand reviews"
  - "trustpilot reputation monitoring"
  - "scrape trustpilot ratings"
faqs:
  - q: "Why Trustpilot for consumer-brand monitoring?"
    a: "Trustpilot is the canonical consumer-side review platform — 50K+ verified-domain brands across 65 countries with strict reviewer-verification. According to Trustpilot's 2024 Trust report, 89% of consumers reference review platforms before purchasing online; Trustpilot dominates outside the US (vs Yelp/Google in US). For consumer brand monitoring, e-commerce reputation, and crisis detection, Trustpilot is materially deeper than Google reviews for purchase-intent context."
  - q: "What data does the actor return per review?"
    a: "Per review: 1-5 star rating, review text, review date, reviewer name + verified flag, review title, response from company (when present). Per business: aggregate rating, review count, business category, domain, country. About 95% of Trustpilot-listed brands with 100+ reviews have comprehensive aggregate metadata; smaller brands may have sparse review counts."
  - q: "How does Trustpilot compare to Google reviews?"
    a: "Google reviews dominate US local-business + restaurants; Trustpilot dominates EU + UK + AU + DACH for ecommerce/SaaS/B2C brands. Trustpilot has stricter reviewer verification (domain-link required for many reviews) — higher trust for brand-monitoring. For US ecommerce/SaaS, Trustpilot adds international coverage Google misses. For UK/EU consumer brands, Trustpilot is primary."
  - q: "Can I track rating-drift over time?"
    a: "Yes. Persist daily (domain, snapshot_date, aggregate_rating, review_count) tuples + alert on 0.2-star drops with 20+ new reviews (real signal vs noise). Trustpilot moderates reviews more aggressively than Google — about 5-10% of reviews are removed within 30 days, so apparent rating 'improvements' can lag actual sentiment. Cross-reference with company-side data for interpretation."
  - q: "How fresh do brand-monitoring snapshots need to be?"
    a: "Daily for active brand-monitoring (catches rating drift, crisis events, viral negative reviews). Weekly for competitive-research benchmarking. Monthly for long-term reporting. For high-stakes monitoring (M&A diligence, public-company brand-track), 6-hour cadence catches major events same-day. Most teams settle on daily for top-10 brands + weekly for the broader watchlist."
  - q: "How does this compare to Reputation.com or Birdeye?"
    a: "Reputation.com and Birdeye bundle multi-platform review aggregation + response-management UX at $5K-$50K/year per seat. They aggregate Trustpilot alongside Google, Facebook, Yelp etc. The actor delivers raw Trustpilot data at $2/1K records — for cost-optimized brand-monitoring stacks or platform-builder use cases, the actor is materially cheaper. For full-stack reputation operations, Reputation.com / Birdeye win."
---

> Thirdwatch's [Trustpilot Scraper](https://apify.com/thirdwatch/trustpilot-scraper) returns consumer-brand reviews + ratings at $0.002 per record — review text, ratings, reviewer metadata, business aggregates. Built for consumer brand-monitoring teams, ecommerce reputation tracking, M&A diligence on B2C brands, and crisis-detection workflows.

## Why scrape Trustpilot for brand monitoring

Trustpilot is the highest-trust consumer-review platform globally. According to [Trustpilot's 2024 Trust report](https://www.trustpilot.com/), the platform serves 50K+ verified domains across 65 countries with strict reviewer-verification (many reviews require domain-link verification). For consumer-brand monitoring, ecommerce reputation tracking, and B2C-brand competitive research, Trustpilot is materially deeper than Google reviews for purchase-context-rich content.

The job-to-be-done is structured. A consumer-brand-monitoring team tracks 50 client brands daily for rating drift + crisis detection. An M&A diligence analyst studies target brand-trajectory over 24 months for acquisition decision support. An ecommerce reputation tracking function catches viral negative-review events early. A consumer-brand competitive-research function maps category-level rating + reviewer-sentiment positioning. All reduce to brand-domain queries + review pulls + daily aggregation.

## How does this compare to the alternatives?

Three options for Trustpilot data:

| Approach | Cost per 10K records monthly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Reputation.com / Birdeye | $5K–$50K/year per seat | Multi-platform aggregation | Days | Vendor contract |
| Trustpilot Business (paid) | $50–$1,000/month per business | Owned-brand only | Hours | Per-business license |
| Thirdwatch Trustpilot Scraper | $20 ($0.002 × 10K) | Production-tested with HTTP + Next.js | 5 minutes | Thirdwatch tracks Trustpilot changes |

Reputation.com offers comprehensive aggregation at the high end. Trustpilot's Business product is owned-brand-only (no competitor visibility). The [Trustpilot Scraper actor page](/scrapers/trustpilot-scraper) gives you raw cross-brand review-level data at the lowest unit cost.

## How to scrape Trustpilot in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a brand watchlist?

Pass brand-domain queries.

```python
import os, requests, datetime, json, pathlib

ACTOR = "thirdwatch~trustpilot-reviews-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

BRANDS = ["stripe.com", "shopify.com", "klarna.com",
          "wise.com", "revolut.com", "monzo.com",
          "n26.com", "starlingbank.com", "nubank.com",
          "mercury.com"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": BRANDS, "maxResults": 100},
    timeout=900,
)
records = resp.json()
ts = datetime.datetime.utcnow().strftime("%Y%m%d")
pathlib.Path(f"snapshots/trustpilot-{ts}.json").write_text(json.dumps(records))
print(f"{ts}: {len(records)} reviews across {len(BRANDS)} brands")
```

10 brands × 100 reviews each = up to 1,000 records, costing $2.

### Step 3: How do I detect rating drift?

Compare aggregate ratings across snapshots.

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

weekly["rating_delta_4w"] = weekly.groupby("business_domain").rating.diff(4)
weekly["reviews_delta_4w"] = weekly.groupby("business_domain").review_count.diff(4)

drops = weekly[
    (weekly.rating_delta_4w <= -0.2)
    & (weekly.reviews_delta_4w >= 20)
]
print(f"{len(drops)} brand-rating drops detected")
```

A 0.2-star drop with 20+ new reviews driving it = real sentiment shift, alert-worthy.

### Step 4: How do I forward alerts to Slack?

Persist alerted (brand, week) tuples and forward only new alerts.

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
                          f"(now {a.rating}, +{int(a.reviews_delta_4w)} reviews).")})

new_keys = [(a.business_domain, str(a.snapshot_date)) for _, a in new_alerts.iterrows()]
snapshot.write_text(json.dumps(list(seen | set(new_keys))))
```

Schedule daily; alert pipeline runs unattended, surfaces only new events.

## Sample output

A single Trustpilot review record looks like this. Five rows weigh ~7 KB.

```json
{
  "review_id": "abc123",
  "business_domain": "stripe.com",
  "business_name": "Stripe",
  "business_category": "Online Payment Service",
  "aggregate_rating": 4.3,
  "aggregate_review_count": 1842,
  "rating": 5,
  "title": "Best payment processor for SaaS",
  "review_text": "We've used Stripe for 3 years across multiple companies...",
  "reviewer_name": "John D.",
  "reviewer_country": "United States",
  "verified_buyer": true,
  "review_date": "2026-04-15",
  "company_response": "Thanks for the kind words John..."
}
```

`business_domain` is the canonical natural key. `aggregate_rating` + `aggregate_review_count` provide brand-level metrics; per-review `rating` enables sentiment-distribution analysis. `verified_buyer: true` filters to highest-trust reviews.

## Common pitfalls

Three things go wrong in Trustpilot pipelines. **Verified-vs-unverified mixing** — about 70% of Trustpilot reviews are verified buyers; the rest unverified. For high-trust analysis, filter to verified-only. **Brand-name ambiguity** — common brand names match unrelated domains (`stripe.com` vs `stripe.io` vs `stripestudios.com`); always anchor on canonical domain rather than name. **Moderation lag** — Trustpilot removes ~5-10% of reviews within 30 days for policy violations; rating "improvements" may reflect moderation rather than sentiment shift. Cross-check with review-volume velocity for interpretation.

Thirdwatch's actor uses HTTP + Next.js data extraction at $0.04/1K, ~98% margin. The 256 MB memory profile means a 5,000-review batch runs in 15-25 minutes for $10. Pair Trustpilot with [G2 Scraper](https://apify.com/thirdwatch/g2-scraper) for B2B-buyer perspective and [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) for local-business reviews. A fourth subtle issue worth flagging: Trustpilot's domain-verification status is binary (verified/unverified) but the verification depth varies — some businesses pay for "Trustpilot Business" features that boost their displayed rating via review-invitation programs (which generate disproportionately positive reviews). For unbiased competitive research, supplement Trustpilot with G2 (B2B) or Google reviews (local) to triangulate. A fifth pattern unique to Trustpilot: company-response rate strongly correlates with rating — businesses responding to >50% of negative reviews maintain ratings 0.3-0.5 stars higher than non-responders. For brand-strategy research, response-rate is a leading indicator of rating trajectory. A sixth and final pitfall: review-volume and reviewer-country distribution skew heavily by category — UK/EU brands accumulate Trustpilot reviews at 5-10x the rate of US brands due to regional adoption patterns. For cross-region brand-comparison research, normalize against per-country baselines rather than treating absolute review counts as comparable.  A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size.

An eighth subtle issue: snapshot-storage strategy materially affects long-term economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. Partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early.

## Related use cases

- [Track Trustpilot rating changes over time](/blog/track-trustpilot-rating-changes-over-time)
- [Build a consumer brand reputation dashboard](/blog/build-consumer-brand-reputation-dashboard)
- [Scrape G2 reviews for B2B SaaS research](/blog/scrape-g2-reviews-for-b2b-saas-research)
- [The complete guide to scraping reviews](/blog/guide-scraping-reviews)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why Trustpilot for consumer-brand monitoring?

Trustpilot is the canonical consumer-side review platform — 50K+ verified-domain brands across 65 countries with strict reviewer-verification. According to Trustpilot's 2024 Trust report, 89% of consumers reference review platforms before purchasing online; Trustpilot dominates outside the US (vs Yelp/Google in US). For consumer brand monitoring, e-commerce reputation, and crisis detection, Trustpilot is materially deeper than Google reviews for purchase-intent context.

### What data does the actor return per review?

Per review: 1-5 star rating, review text, review date, reviewer name + verified flag, review title, response from company (when present). Per business: aggregate rating, review count, business category, domain, country. About 95% of Trustpilot-listed brands with 100+ reviews have comprehensive aggregate metadata; smaller brands may have sparse review counts.

### How does Trustpilot compare to Google reviews?

Google reviews dominate US local-business + restaurants; Trustpilot dominates EU + UK + AU + DACH for ecommerce/SaaS/B2C brands. Trustpilot has stricter reviewer verification (domain-link required for many reviews) — higher trust for brand-monitoring. For US ecommerce/SaaS, Trustpilot adds international coverage Google misses. For UK/EU consumer brands, Trustpilot is primary.

### Can I track rating-drift over time?

Yes. Persist daily (domain, snapshot_date, aggregate_rating, review_count) tuples + alert on 0.2-star drops with 20+ new reviews (real signal vs noise). Trustpilot moderates reviews more aggressively than Google — about 5-10% of reviews are removed within 30 days, so apparent rating "improvements" can lag actual sentiment. Cross-reference with company-side data for interpretation.

### How fresh do brand-monitoring snapshots need to be?

Daily for active brand-monitoring (catches rating drift, crisis events, viral negative reviews). Weekly for competitive-research benchmarking. Monthly for long-term reporting. For high-stakes monitoring (M&A diligence, public-company brand-track), 6-hour cadence catches major events same-day. Most teams settle on daily for top-10 brands + weekly for the broader watchlist.

### How does this compare to Reputation.com or Birdeye?

[Reputation.com](https://reputation.com/) and [Birdeye](https://birdeye.com/) bundle multi-platform review aggregation + response-management UX at $5K-$50K/year per seat. They aggregate Trustpilot alongside Google, Facebook, Yelp etc. The actor delivers raw Trustpilot data at $2/1K records — for cost-optimized brand-monitoring stacks or platform-builder use cases, the actor is materially cheaper. For full-stack reputation operations, Reputation.com / Birdeye win.

Run the [Trustpilot Scraper on Apify Store](https://apify.com/thirdwatch/trustpilot-scraper) — pay-per-record, free to try, no credit card to test.
