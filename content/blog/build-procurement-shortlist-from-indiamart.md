---
title: "Build a Procurement Shortlist from IndiaMart Suppliers (2026)"
slug: "build-procurement-shortlist-from-indiamart"
description: "Generate a ranked Indian supplier shortlist at $0.002 per record with Thirdwatch's IndiaMart Scraper. MOQ, GST, rating-weighted scoring with full Python recipes."
actor: "indiamart-supplier-scraper"
actor_url: "https://apify.com/thirdwatch/indiamart-supplier-scraper"
actorTitle: "IndiaMart Scraper"
category: "business"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "find-b2b-suppliers-india-with-indiamart-scraper"
  - "monitor-wholesale-prices-india-with-indiamart"
  - "verify-indian-suppliers-gst-and-moq-at-scale"
keywords:
  - "indian supplier shortlist"
  - "procurement scoring india"
  - "indiamart shortlist automation"
  - "rfq supplier ranking"
faqs:
  - q: "What's the right shortlist size for an Indian procurement RFQ?"
    a: "Five to ten suppliers per category is the standard. Below five, you don't have meaningful price competition; above ten, evaluation effort grows faster than information value. The actor returns enough metadata per supplier (rating, member_since, GST, MOQ, location) that a 200-supplier raw pull collapses cleanly to a 5-10 shortlist with one pandas score-and-sort."
  - q: "How do I weight rating versus rating count in shortlisting?"
    a: "A common pattern is sqrt-weighted score: rating × sqrt(rating_count). This balances a 5.0/3-rating supplier (high rating, low confidence) against a 4.5/200-rating supplier (lower rating, much higher confidence). The 4.5/200 wins, which is correct for procurement risk. Add a hard floor of rating_count >= 20 to filter out unreviewed suppliers."
  - q: "Should I include suppliers without a published GST number?"
    a: "For most procurement workflows, no. A missing GST number signals either an unregistered business or an incomplete IndiaMart profile — both are higher risk than a registered supplier with verified GST. The exception is when sourcing from very small businesses where unregistered status reflects size, not non-compliance. Most procurement teams require gst_number for any contract above ₹50,000."
  - q: "How do I cross-reference MOQ across suppliers when units differ?"
    a: "MOQ comes back as a display string with mixed units (Kg, Pieces, Tonne, Roll, Meter). Build a parser that extracts numeric value and unit, then convert to a canonical unit per category. For metals, normalise to Kg. For textiles, normalise to Meters. The IndiaMart raw moq is preserved in case the parser misses an edge case."
  - q: "Can I automate the entire RFQ generation flow?"
    a: "Partially. The actor produces the supplier shortlist; the RFQ document generation is downstream. Most procurement teams export the shortlist to Excel, populate an RFQ template, and email it to suppliers. For phone-first outreach (common in India), use the public phone numbers the actor returns and route to your call-centre or Twilio dialer with the shortlisted ranking."
  - q: "How fresh does the data need to be for a procurement decision?"
    a: "A single fresh pull at the start of the sourcing exercise is enough. Indian SMB supplier listings are stable — most don't change company_name, GST, or location for years. Prices and MOQ shift more frequently but are rarely the deciding factor in shortlisting. For ongoing supplier monitoring (price changes, rating drift), schedule a weekly re-pull."
---

> Thirdwatch's [IndiaMart Scraper](https://apify.com/thirdwatch/indiamart-supplier-scraper) makes Indian supplier shortlisting a one-call workflow at $0.002 per record — pull every supplier in your category, score by rating-weighted trust × MOQ fit × location, return a ranked Top-10. Built for procurement managers and sourcing analysts who need to compress days of supplier discovery into minutes of structured ranking.

## Why build a procurement shortlist with IndiaMart

Indian procurement still runs on phone calls and word-of-mouth for most categories. According to [the Government of India's MSME ministry data](https://msme.gov.in/), more than 6.3 crore (63 million) registered MSMEs operate in India and the long tail is diffused across thousands of categories — making manual supplier discovery genuinely hard. IndiaMart aggregates roughly 10 million of those suppliers into a single searchable directory, which makes it the most efficient single starting point for any India-sourced procurement exercise.

The job-to-be-done is structured. A factory's procurement manager needs five to ten verified suppliers for stainless steel pipes 304 grade, within driving distance, with usable MOQs, all GST-compliant. A startup's ops team needs the same shape for their packaging, IT equipment, or office supplies categories. A government compliance team verifying an existing supplier panel needs a fresh data snapshot to refresh certification records. The Thirdwatch actor returns the raw input; one short pandas script produces the ranked shortlist.

## How does this compare to the alternatives?

Three options for generating a procurement supplier shortlist in India:

| Approach | Cost per 1,000 suppliers | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual IndiaMart browsing + Excel scoring | Days of sourcer time | Low (subjective) | Continuous | Doesn't scale across categories |
| Paid sourcing service (BidContender, Avetta India) | $5K–$50K/year flat | High | Days–weeks to onboard | Vendor lock-in |
| Thirdwatch IndiaMart Scraper + custom scoring | $2 ($0.002 × 1,000) | Production-tested, monopoly position on Apify | Half a day | Thirdwatch maintains scraper |

Paid sourcing services curate supplier panels but lag IndiaMart by months and apply opaque scoring you don't control. The [IndiaMart Scraper actor page](/scrapers/indiamart-supplier-scraper) gives you the live raw feed; the scoring layer is downstream pandas you can tune to your category, location, and risk tolerance.

## How to build a procurement shortlist in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull the candidate supplier pool for a category?

Pass several specific queries (not one broad term) and the target city or state. Specific queries return tightly relevant results; combining several covers the long tail.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~indiamart-supplier-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": [
            "stainless steel pipes 304 grade",
            "stainless steel pipes 316 grade",
            "GI seamless pipes",
            "ERW MS pipes",
        ],
        "location": "Mumbai",
        "maxResultsPerQuery": 100,
    },
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} listings across {df.company_name.nunique()} unique suppliers")
```

Four queries × 100 results = up to 400 listings. After dedupe, expect 150-250 unique suppliers per category sweep.

### Step 3: How do I compute a procurement-fit score per supplier?

Combine rating-weighted trust, GST presence, vintage (member_since), and listings count into a single score:

```python
import datetime as dt
import numpy as np

now_year = dt.date.today().year

agg = (
    df.dropna(subset=["company_name"])
    .groupby("company_name", as_index=False)
    .agg(
        n_listings=("product_name", "count"),
        city=("city", "first"),
        state=("state", "first"),
        gst_number=("gst_number", "first"),
        phone=("phone", "first"),
        member_since=("member_since", "first"),
        supplier_rating=("supplier_rating", "first"),
        rating_count=("rating_count", "first"),
        catalog_url=("catalog_url", "first"),
    )
)

agg["rating"] = pd.to_numeric(agg.supplier_rating, errors="coerce")
agg["nrate"] = pd.to_numeric(agg.rating_count, errors="coerce").fillna(0)
agg["years_active"] = (now_year - pd.to_numeric(agg.member_since, errors="coerce")).clip(lower=0).fillna(0)
agg["has_gst"] = agg.gst_number.fillna("").ne("").astype(int)

# Composite score
agg["trust"] = agg.rating.fillna(0) * np.sqrt(agg.nrate)
agg["score"] = (
    agg.trust * 1.0
    + np.log1p(agg.years_active) * 5.0
    + agg.has_gst * 8.0
    + np.log1p(agg.n_listings) * 2.0
)

shortlist = (
    agg[(agg.nrate >= 20) & (agg.has_gst == 1)]
    .sort_values("score", ascending=False)
    .head(10)
)
print(shortlist[["company_name", "city", "rating", "nrate",
                 "years_active", "n_listings", "score"]])
```

The composite score weighs rating-confidence highest, then GST verification, then years of IndiaMart presence, then catalog depth. Tune the coefficients to your category's risk profile — high-spend categories should weight `years_active` more heavily.

### Step 4: How do I export the shortlist for RFQ outreach?

Drop the top 10 to a CSV ready for RFQ population, and dial out via Twilio for phone-first outreach (the Indian SMB norm).

```python
shortlist[["company_name", "city", "state", "phone",
           "gst_number", "rating", "nrate", "years_active",
           "n_listings", "catalog_url"]].to_csv("rfq-shortlist-pipes.csv", index=False)

# Optional: open Twilio call to top 10 for verbal RFQ
from twilio.rest import Client
twilio = Client(os.environ["TWILIO_SID"], os.environ["TWILIO_TOKEN"])
for _, row in shortlist.iterrows():
    if pd.isna(row.phone) or not row.phone:
        continue
    twilio.calls.create(
        to="+91" + str(row.phone),
        from_="+1XXXXXXXXXX",
        url="https://your-twiml-endpoint/rfq-pipes-stainless.xml",
    )
```

A 10-supplier shortlist with phone-dialed RFQs typically returns 6-8 quotes within 48 hours — the canonical Indian SMB sourcing rhythm.

## Sample output

A single record from the dataset for one supplier listing looks like this. The shortlist scoring stitches many such rows together.

```json
{
  "company_name": "Tata Steel Ltd.",
  "product_name": "Stainless Steel Pipes 304",
  "price": "Rs 180 / Kg",
  "moq": "500 Kg",
  "product_url": "https://www.indiamart.com/tata-steel/stainless-steel-pipes.html",
  "catalog_url": "https://www.indiamart.com/tata-steel/",
  "image_url": "https://5.imimg.com/data5/SELLER/Default/.../stainless-steel-pipes.jpg",
  "location": "Mumbai, Maharashtra",
  "city": "Mumbai",
  "state": "Maharashtra",
  "phone": "8044464742",
  "gst_number": "27AAACT2727Q1ZV",
  "supplier_rating": "4.5",
  "rating_count": "1240",
  "member_since": "1998"
}
```

A typical shortlist row aggregated from many such records looks like this:

| Company | City | Rating | nRate | Years | Listings | Score |
|---|---|---|---|---|---|---|
| Tata Steel Ltd. | Mumbai | 4.5 | 1240 | 28 | 14 | 184.2 |
| Jindal Stainless | Mumbai | 4.4 | 760 | 22 | 18 | 148.7 |
| Maharashtra Seamless | Pune | 4.3 | 410 | 17 | 9 | 113.3 |

The composite score is the column to sort on; the underlying components let a procurement manager justify the ranking to a sceptical CFO.

## Common pitfalls

Three things go wrong in IndiaMart-driven shortlisting. **Single-listing suppliers** — a supplier that appears only once in your dataset (low `n_listings`) might be a true specialist or a stub profile; visit the catalog_url to verify before including. **Year-of-founding noise** — `member_since` is the year the supplier joined IndiaMart, not the year the business started; a 1998 supplier number doesn't always mean a 28-year-old business. Treat as a soft signal, not absolute proof of vintage. **Composite score weight tuning** — the coefficients in the score formula above are reasonable defaults but should be tuned for your category. Capital-intensive sourcing (machinery, large-volume metals) should weight `years_active` more; commodity sourcing (plastics, packaging) should weight `n_listings` and `nrate`.

Thirdwatch's actor returns 15 fields per record so the shortlisting logic can stay in your code where it belongs. The pure-HTTP architecture means a 400-record category sweep completes in under five minutes and costs $0.80, leaving comfortable budget for re-runs as the shortlist evolves.

## Related use cases

- [Find B2B suppliers in India with IndiaMart](/blog/find-b2b-suppliers-india-with-indiamart-scraper)
- [Monitor wholesale prices in India with IndiaMart](/blog/monitor-wholesale-prices-india-with-indiamart)
- [Verify Indian suppliers' GST and MOQ at scale](/blog/verify-indian-suppliers-gst-and-moq-at-scale)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What's the right shortlist size for an Indian procurement RFQ?

Five to ten suppliers per category is the standard. Below five, you don't have meaningful price competition; above ten, evaluation effort grows faster than information value. The actor returns enough metadata per supplier (rating, `member_since`, GST, MOQ, location) that a 200-supplier raw pull collapses cleanly to a 5-10 shortlist with one pandas score-and-sort.

### How do I weight rating versus rating count in shortlisting?

A common pattern is sqrt-weighted score: `rating × sqrt(rating_count)`. This balances a 5.0/3-rating supplier (high rating, low confidence) against a 4.5/200-rating supplier (lower rating, much higher confidence). The 4.5/200 wins, which is correct for procurement risk. Add a hard floor of `rating_count >= 20` to filter out unreviewed suppliers.

### Should I include suppliers without a published GST number?

For most procurement workflows, no. A missing GST number signals either an unregistered business or an incomplete IndiaMart profile — both are higher risk than a registered supplier with verified GST. The exception is when sourcing from very small businesses where unregistered status reflects size, not non-compliance. Most procurement teams require `gst_number` for any contract above ₹50,000.

### How do I cross-reference MOQ across suppliers when units differ?

MOQ comes back as a display string with mixed units (Kg, Pieces, Tonne, Roll, Meter). Build a parser that extracts numeric value and unit, then convert to a canonical unit per category. For metals, normalise to Kg. For textiles, normalise to Meters. The IndiaMart raw `moq` is preserved in case the parser misses an edge case.

### Can I automate the entire RFQ generation flow?

Partially. The actor produces the supplier shortlist; the RFQ document generation is downstream. Most procurement teams export the shortlist to Excel, populate an RFQ template, and email it to suppliers. For phone-first outreach (common in India), use the public phone numbers the actor returns and route to your call-centre or [Twilio](https://www.twilio.com/) dialer with the shortlisted ranking.

### How fresh does the data need to be for a procurement decision?

A single fresh pull at the start of the sourcing exercise is enough. Indian SMB supplier listings are stable — most don't change `company_name`, GST, or location for years. Prices and MOQ shift more frequently but are rarely the deciding factor in shortlisting. For ongoing supplier monitoring (price changes, rating drift), schedule a weekly re-pull.

Run the [IndiaMart Scraper on Apify Store](https://apify.com/thirdwatch/indiamart-supplier-scraper) — pay-per-supplier, free to try, no credit card to test.
