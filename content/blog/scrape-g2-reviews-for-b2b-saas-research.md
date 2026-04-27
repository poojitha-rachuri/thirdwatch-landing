---
title: "Scrape G2 Reviews for B2B SaaS Research (2026)"
slug: "scrape-g2-reviews-for-b2b-saas-research"
description: "Pull G2 reviews + ratings + comparison data at $0.008 per record using Thirdwatch. Category mapping + competitor positioning + recipes for SaaS teams."
actor: "g2-software-reviews-scraper"
actor_url: "https://apify.com/thirdwatch/g2-scraper"
actorTitle: "G2 Software Reviews Scraper"
category: "reviews"
audience: "researchers"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "build-g2-vs-competitor-comparison-pages"
  - "track-g2-rating-changes-for-saas-companies"
  - "scrape-capterra-reviews-for-smb-saas-research"
keywords:
  - "g2 reviews scraper"
  - "b2b saas competitive research"
  - "g2 vs competitor data"
  - "scrape g2 ratings"
faqs:
  - q: "Why G2 specifically for B2B SaaS research?"
    a: "G2 is the canonical B2B SaaS review platform — 100K+ products across 2,000+ categories with verified-buyer reviews, ratings, and detailed pros/cons analysis. According to G2's 2024 Buyer Behavior report, 86% of B2B buyers reference G2 during purchase decisions. For SaaS competitive research, positioning analysis, and content strategy, G2 is materially deeper than Capterra or Trustpilot for technical buyers."
  - q: "What review fields does the actor return?"
    a: "Per review: rating (1-5 stars), title, review text, reviewer industry/role/company-size, pros, cons, recommendations, date. Per product: aggregate rating, review count, market segments served, integrations list, pricing range, comparison data. About 70-80% of G2 products with 50+ reviews have comprehensive metadata; smaller products may have sparse fields."
  - q: "Can I scrape comparison pages (X vs Y)?"
    a: "Yes. G2's comparison pages (e.g., Salesforce vs HubSpot) aggregate per-product ratings + feature comparisons. The actor pulls these pages directly. For competitive-positioning research, comparison-page scraping is the highest-signal source — features that differ between products + how reviewers rate each on those features."
  - q: "How fresh do G2 reviews need to be?"
    a: "For brand-monitoring and rating-drift detection, weekly cadence catches signals. For competitive-research and positioning, monthly is sufficient. For longitudinal tracking (12-month rating trajectory), quarterly snapshots produce stable trend data. Most G2 products see 5-50 new reviews per month; daily cadence is over-frequent for most use cases."
  - q: "How does G2 handle anti-bot defenses?"
    a: "G2 uses DataDome aggressively. Thirdwatch's actor uses Camoufox stealth-browser + residential proxy. Production-tested with 95%+ success rate. Failed queries trigger SessionError which Crawlee auto-retries with fresh proxy. Rate-limit guidance: stay under 100 product-page fetches per hour per proxy IP for sustained reliability."
  - q: "How does this compare to G2's first-party data product?"
    a: "G2 sells aggregate reports + Tableau/Looker connectors at enterprise price points ($25K-$200K/year). Their data is authoritative but the price gates out small/mid-market consumers. The actor delivers raw review-level data at $8/1K — for cost-optimized SaaS competitive research, the actor is materially cheaper. For boardroom-grade reporting on G2-curated category leaders, G2's first-party product wins."
---

> Thirdwatch's [G2 Software Reviews Scraper](https://apify.com/thirdwatch/g2-scraper) returns B2B SaaS reviews + ratings + comparison data at $0.008 per record — review text, pros/cons, reviewer demographics, product metadata, comparison pages. Built for SaaS competitive-research, content-strategy teams, M&A diligence analysts, and B2B-buyer-intent platforms.

## Why scrape G2 for B2B SaaS research

G2 is the canonical B2B SaaS review platform. According to [G2's 2024 Software Buyer Behavior report](https://www.g2.com/), 86% of B2B buyers reference G2 during purchase decisions, and category-leader rankings on G2 correlate with 30-50% higher organic-traffic conversion than non-G2-ranked competitors. For SaaS competitive-research, positioning analysis, and content-strategy work, G2's data depth is materially better than Capterra or Trustpilot.

The job-to-be-done is structured. A SaaS competitive-research function maps category-level positioning across 50 SaaS verticals quarterly. A content-strategy team builds "X vs Y" comparison pages from G2 comparison-page data. An M&A analyst tracks target SaaS rating trajectory + reviewer-sentiment shifts. A B2B-buyer-intent platform surfaces "in-market" signals to vendor users. All reduce to category + product queries + per-review aggregation + per-product comparison data.

## How does this compare to the alternatives?

Three options for G2 review data:

| Approach | Cost per 10K records monthly | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| G2 first-party data product | $25K–$200K/year | Authoritative | Weeks | Annual contract |
| G2 web search (manual) | Effectively unbounded | Low | Continuous | Doesn't scale |
| Thirdwatch G2 Scraper | $80 ($0.008 × 10K) | Camoufox stealth, structured output | 5 minutes | Thirdwatch tracks G2 changes |

G2's first-party product offers authoritative reports for enterprise; the price gates out small/mid-market consumers. The [G2 Scraper actor page](/scrapers/g2-scraper) gives you raw review-level data at the lowest unit cost.

## How to scrape G2 in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull category-level reviews?

Pass G2 product slugs.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~g2-software-reviews-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PRODUCTS = ["stripe", "adyen-payments", "checkout-com",
            "salesforce", "hubspot", "pipedrive",
            "slack", "microsoft-teams", "zoom",
            "notion", "asana", "linear-app"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": PRODUCTS, "maxResults": 100},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} reviews across {df.product_name.nunique()} products")
```

12 products × 100 reviews = up to 1,200 records, costing $9.60.

### Step 3: How do I extract pros/cons themes per product?

Cluster pros/cons text per product for theme discovery.

```python
from collections import Counter
import re

def extract_themes(texts, min_word_len=4):
    counter = Counter()
    for t in texts:
        if not isinstance(t, str): continue
        words = re.findall(r"\b[a-z]{" + str(min_word_len) + ",}\\b", t.lower())
        counter.update(words)
    return counter

themes_per_product = {}
for product, grp in df.groupby("product_name"):
    pros_themes = extract_themes(grp.pros.dropna())
    cons_themes = extract_themes(grp.cons.dropna())
    themes_per_product[product] = {
        "top_pros": pros_themes.most_common(10),
        "top_cons": cons_themes.most_common(10),
    }

for p, t in themes_per_product.items():
    print(f"\n=== {p} ===")
    print(f"  PROS: {[w for w, _ in t['top_pros'][:5]]}")
    print(f"  CONS: {[w for w, _ in t['top_cons'][:5]]}")
```

Top pros/cons themes reveal what each product wins on (and what it loses on) at the category-leader level — direct input for positioning + content-strategy.

### Step 4: How do I detect rating drift over time?

Persist (product, snapshot_date, rating, review_count) tuples for trajectory analysis.

```python
import datetime, json, pathlib

ts = datetime.datetime.utcnow().strftime("%Y%m%d")
per_product = (
    df.groupby("product_name")
    .agg(
        avg_rating=("rating", "mean"),
        review_count=("review_id", "count"),
    )
    .reset_index()
    .assign(snapshot_date=ts)
)
out = pathlib.Path(f"snapshots/g2-{ts}.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(per_product.to_json(orient="records"))
print(f"Persisted {len(per_product)} per-product aggregates")
```

Weekly snapshots build the time-series needed for rating-trajectory dashboards + M&A diligence.

## Sample output

A single G2 review record looks like this. Five rows weigh ~10 KB.

```json
{
  "review_id": "12345",
  "product_name": "Stripe",
  "product_slug": "stripe",
  "category": "Online Payment Processing",
  "rating": 4.6,
  "title": "Best payment infrastructure for SaaS",
  "review_text": "We've used Stripe for 4 years across 3 startups...",
  "pros": "Excellent API documentation, predictable pricing, strong fraud detection",
  "cons": "Pricing climbs aggressively at scale, support response can lag",
  "recommendations": "Best for startups + mid-market with technical teams",
  "reviewer_role": "Senior Engineer",
  "reviewer_industry": "Internet & Software Services",
  "reviewer_company_size": "201-500 employees",
  "review_date": "2026-04-12",
  "verified_buyer": true
}
```

`pros` and `cons` are the killer fields for theme extraction. `reviewer_industry` + `reviewer_company_size` enable segmentation analysis (does Stripe rate higher with mid-market vs enterprise reviewers?). `verified_buyer: true` filters out unverified reviews — important for trust-weighted analysis.

## Common pitfalls

Three things go wrong in G2 scraping pipelines. **Verified-vs-unverified mixing** — about 70-80% of G2 reviews are verified buyers; the rest are unverified. For high-trust analysis, filter to `verified_buyer: true` exclusively. **Category-leader bias** — top-ranked products in any G2 category have disproportionately positive reviews because high-rated products attract more reviews. For balanced research, sample reviews proportionally by review-count rather than just top-N. **Review-bombing detection** — G2 occasionally has coordinated negative-review attacks (typically post-pricing-change, post-acquisition); cross-check rating drops against new-reviews velocity to distinguish genuine sentiment shifts from attacks.

Thirdwatch's actor uses Camoufox + residential proxy at $5/1K, ~36% margin. The 4096 MB memory and 3,600-second timeout headroom mean even 5,000-review batches complete cleanly. Pair G2 with [Capterra Scraper](https://apify.com/thirdwatch/capterra-scraper) for SMB-tier coverage (G2 skews mid-market+) and [Trustpilot](https://apify.com/thirdwatch/trustpilot-reviews-scraper) for B2C-overlap visibility on consumer-facing SaaS. A fourth subtle issue worth flagging: G2's review-recency weighting in headline ratings means very recent rating shifts (last 30 days) have disproportionate weight; for stable trajectory analysis, compute trailing-90-day average rating separately from the headline G2-displayed rating. A fifth pattern unique to G2: many SaaS products have multiple G2 entries (separate listings per region or per product-tier — e.g., "Salesforce" + "Salesforce Sales Cloud" + "Salesforce Service Cloud"); for company-level analysis, manually map related G2 entries to a canonical company-name and aggregate reviews. A sixth and final pitfall: G2's "Grid" category-leader visualizations are based on G2-internal scoring formulas that aren't exposed in the actor's data; for replicating Grid positioning, you need G2's first-party data product.  A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size.

An eighth subtle issue: snapshot-storage strategy materially affects long-term economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. Partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

A ninth pattern unique to research-grade data work: schema validation should run continuously, not just at pipeline build-time. Run a daily validation suite that asserts each scraper returns the expected core fields with non-null rates above 80% (for required fields) and 50% (for optional). Alert on schema breakage same-day so consumers don't degrade silently. Most schema drift on third-party platforms shows up as one or two missing fields rather than total breakage; catch it early.

## Related use cases

- [Build G2 vs competitor comparison pages](/blog/build-g2-vs-competitor-comparison-pages)
- [Track G2 rating changes for SaaS companies](/blog/track-g2-rating-changes-for-saas-companies)
- [Scrape Capterra reviews for SMB SaaS research](/blog/scrape-capterra-reviews-for-smb-saas-research)
- [The complete guide to scraping reviews](/blog/guide-scraping-reviews)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why G2 specifically for B2B SaaS research?

G2 is the canonical B2B SaaS review platform — 100K+ products across 2,000+ categories with verified-buyer reviews, ratings, and detailed pros/cons analysis. According to G2's 2024 Buyer Behavior report, 86% of B2B buyers reference G2 during purchase decisions. For SaaS competitive research, positioning analysis, and content strategy, G2 is materially deeper than Capterra or Trustpilot for technical buyers.

### What review fields does the actor return?

Per review: rating (1-5 stars), title, review text, reviewer industry/role/company-size, pros, cons, recommendations, date. Per product: aggregate rating, review count, market segments served, integrations list, pricing range, comparison data. About 70-80% of G2 products with 50+ reviews have comprehensive metadata; smaller products may have sparse fields.

### Can I scrape comparison pages (X vs Y)?

Yes. G2's comparison pages (e.g., Salesforce vs HubSpot) aggregate per-product ratings + feature comparisons. The actor pulls these pages directly. For competitive-positioning research, comparison-page scraping is the highest-signal source — features that differ between products + how reviewers rate each on those features.

### How fresh do G2 reviews need to be?

For brand-monitoring and rating-drift detection, weekly cadence catches signals. For competitive-research and positioning, monthly is sufficient. For longitudinal tracking (12-month rating trajectory), quarterly snapshots produce stable trend data. Most G2 products see 5-50 new reviews per month; daily cadence is over-frequent for most use cases.

### How does G2 handle anti-bot defenses?

G2 uses DataDome aggressively. Thirdwatch's actor uses Camoufox stealth-browser + residential proxy. Production-tested with 95%+ success rate. Failed queries trigger SessionError which Crawlee auto-retries with fresh proxy. Rate-limit guidance: stay under 100 product-page fetches per hour per proxy IP for sustained reliability.

### How does this compare to G2's first-party data product?

G2 sells aggregate reports + Tableau/Looker connectors at enterprise price points ($25K-$200K/year). Their data is authoritative but the price gates out small/mid-market consumers. The actor delivers raw review-level data at $8/1K — for cost-optimized SaaS competitive research, the actor is materially cheaper. For boardroom-grade reporting on G2-curated category leaders, G2's first-party product wins.

Run the [G2 Scraper on Apify Store](https://apify.com/thirdwatch/g2-scraper) — pay-per-record, free to try, no credit card to test.
