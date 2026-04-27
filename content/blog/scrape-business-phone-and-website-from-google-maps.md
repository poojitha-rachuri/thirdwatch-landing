---
title: "Scrape Business Phone and Website from Google Maps (2026)"
slug: "scrape-business-phone-and-website-from-google-maps"
description: "Pull business phone, website, address, hours from Google Maps at $0.002 per record using Thirdwatch. Lead-gen pipelines + Postgres recipes."
actor: "google-maps-scraper"
actor_url: "https://apify.com/thirdwatch/google-maps-scraper"
actorTitle: "Google Maps Scraper"
category: "business"
audience: "operators"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-google-maps-businesses-for-lead-gen"
  - "build-local-business-database-with-google-maps"
  - "find-restaurants-by-cuisine-and-rating"
keywords:
  - "google maps phone scraper"
  - "extract business website google maps"
  - "google maps contact info scraper"
  - "local business contact data"
faqs:
  - q: "What contact fields does Google Maps return?"
    a: "Eight contact-relevant fields per business: name, address, phone, website, lat/lng, opening_hours, plus_code, and category. About 75-85% of listed businesses publish phone; 60-70% publish a website. Coverage varies by category — restaurants and clinics have near-100% phone publication; pure-service businesses (lawyers, consultants) often skip phone in favor of website-only contact."
  - q: "Is the phone field reliable for outbound dialing?"
    a: "Yes, with caveats. Phone numbers on Google Maps are submitted by business owners or auto-discovered from website crawls; for active operators they're 95%+ accurate. About 5-10% return wrong-number, voicemail-only, or out-of-service signals — for cold-call sales pipelines, validate with a phone-number-validation service before mass dialing. Phone format varies by country; normalize to E.164 before storing."
  - q: "What's the best query strategy for lead-gen?"
    a: "Three patterns: (1) `category + city` (`dentist Chicago`); (2) `niche + city` (`pediatric dentist Chicago`); (3) `category + neighborhood` (`dentist Lincoln Park Chicago`). Combine all three for comprehensive city coverage. For metro-level lead-gen, aim for 200+ queries spanning categories × neighborhoods to capture most local businesses."
  - q: "How fresh is the contact data?"
    a: "Google Maps updates phone/website fields within 48 hours of business owner edits or website-crawl detection. For active outbound campaigns, refresh quarterly — that's the cadence at which a meaningful share of small businesses change phone numbers or migrate websites. For static directory builds, annual refresh is sufficient."
  - q: "How do I dedupe across overlapping queries?"
    a: "`place_id` is Google Maps' canonical natural key per physical location — stable across name, phone, website, and category changes. About 30-40% of rows duplicate across overlapping queries; dedupe on `place_id` before downstream processing. For chains, each branch has its own `place_id`."
  - q: "How does this compare to Yelp or Yellow Pages?"
    a: "Yelp's coverage skews toward restaurants and consumer services. Yellow Pages has broader category coverage but stale data. Google Maps is the canonical source for fresh, broad-coverage local-business contact data — most directories aggregate from Google Maps as their primary source. For maximum coverage, run all three; for cost-optimized lead-gen, Google Maps alone covers 85%+ of viable business contacts."
---

> Thirdwatch's [Google Maps Scraper](https://apify.com/thirdwatch/google-maps-scraper) returns structured business contact data at $0.002 per record — name, phone, website, address, opening hours, lat/lng, place_id, category. Built for B2B sales-prospecting teams, local-services lead-gen, directory-building SaaS, and field-sales territory-mapping platforms.

## Why scrape Google Maps for phone and website

Local business contact data is the foundation of B2B sales-prospecting and lead-gen pipelines. According to [Google's 2024 Maps Business statistics](https://blog.google/products/maps/), Google Maps indexes 200M+ business listings globally with phone-number coverage above 75% for active businesses. For sales teams, lead-gen functions, and directory builders, Google Maps is the cheapest single source of fresh, broad-coverage local-business contact data.

The job-to-be-done is structured. A B2B sales-prospecting team builds 5K-record contact lists per metro for outbound dialing. A field-sales team maps territory by category × neighborhood for rep assignment. A directory-building SaaS seeds platform launches with 100K+ business records. A lead-gen agency serves clients with category-targeted lead lists. All reduce to category + city queries + contact-field extraction + canonical-key dedup.

## How does this compare to the alternatives?

Three options for local-business contact data:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Yellow Pages / Whitepages | $0.10–$0.50 per record | Stale | Hours | API limits |
| Google Maps Places API | Free with quotas | Limited fields, gated | Days | Strict use-case scope |
| Thirdwatch Google Maps Scraper | $2 ($0.002 × 1,000) | Production-tested with internal API | 5 minutes | Thirdwatch tracks Google changes |

Google's official Places API is gated behind use-case approval and limits fields. The [Google Maps Scraper actor page](/scrapers/google-maps-scraper) gives you the same data at the lowest unit cost.

## How to extract contact data in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull a category × city batch?

Pass category + city queries.

```python
import os, requests, pandas as pd
from itertools import product

ACTOR = "thirdwatch~google-maps-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

CATEGORIES = ["dentist", "chiropractor", "physical therapist",
              "dermatologist", "veterinarian", "optometrist",
              "orthodontist", "podiatrist"]
CITIES = ["Chicago", "Boston", "Seattle",
          "Denver", "Austin", "Atlanta"]

queries = [f"{c} {city}" for c, city in product(CATEGORIES, CITIES)]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": queries, "maxResults": 100},
    timeout=3600,
)
df = pd.DataFrame(resp.json())
df = df.drop_duplicates(subset=["place_id"])
print(f"{len(df)} unique businesses across {df.address.str.split(',').str[-2].str.strip().nunique()} cities")
```

8 categories × 6 cities = 48 queries × 100 = up to 4,800 raw records, costing $9.60.

### Step 3: How do I filter for phone + website completeness?

Filter to rows with both contact fields populated.

```python
contactable = df[
    df.phone.notna()
    & df.website.notna()
    & (df.rating >= 4.0)
    & (df.reviews_count >= 20)
].copy()

print(f"{len(contactable)} contactable, well-reviewed businesses")
print(contactable[["name", "phone", "website", "rating", "reviews_count"]].head(15))
```

The phone-AND-website filter selects serious operators with online presence + dialable phone. The 4.0 rating + 20 reviews threshold filters out abandoned listings.

### Step 4: How do I normalize phone and upsert to Postgres?

Normalize phone to E.164 + persist with place_id as primary key.

```python
import re, psycopg2

def normalize_phone(p, country_code="1"):
    if not isinstance(p, str):
        return None
    digits = re.sub(r"\D", "", p)
    if not digits:
        return None
    if not digits.startswith(country_code) and len(digits) == 10:
        digits = country_code + digits
    return f"+{digits}"

contactable["phone_e164"] = contactable.phone.apply(normalize_phone)

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    for _, b in contactable.iterrows():
        cur.execute(
            """INSERT INTO local_businesses
                  (place_id, name, category, address, phone_e164, website,
                   rating, reviews_count, lat, lng, scraped_at)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, now())
               ON CONFLICT (place_id) DO UPDATE SET
                 phone_e164 = EXCLUDED.phone_e164,
                 website = EXCLUDED.website,
                 rating = EXCLUDED.rating,
                 reviews_count = EXCLUDED.reviews_count,
                 scraped_at = now()""",
            (b.place_id, b.name, b.category, b.address, b.phone_e164,
             b.website, b.rating, b.reviews_count, b.lat, b.lng)
        )

print(f"Upserted {len(contactable)} businesses")
```

The (place_id) primary key keeps the table dedup-clean across snapshot runs.

## Sample output

A single Google Maps business record looks like this. Five rows weigh ~7 KB.

```json
{
  "name": "Smile Dental Care",
  "category": "Dentist",
  "address": "1234 N Lincoln Ave, Chicago, IL 60614",
  "phone": "(773) 555-0123",
  "website": "https://smiledentalchicago.com",
  "rating": 4.7,
  "reviews_count": 425,
  "lat": 41.9234,
  "lng": -87.6478,
  "place_id": "ChIJrTLr-GyuEmsRBfy61i59si0",
  "opening_hours": ["Mon-Fri: 9 AM-5 PM", "Sat: 9 AM-1 PM", "Sun: Closed"],
  "plus_code": "9G8R+58 Chicago, IL"
}
```

`place_id` is the canonical natural key. `phone` and `website` are the primary contact fields. `opening_hours` provides operating-hours context (now extracted reliably). `lat/lng` enables geographic-clustering and mapping. `plus_code` (Open Location Code) is Google's address alternative — useful for businesses without street addresses.

## Common pitfalls

Three things go wrong in contact-data pipelines. **Phone format variance** — Google Maps returns phones in human-readable format ("(312) 555-0123") rather than E.164 ("+13125550123"); always normalize before downstream use. **Website-vs-Facebook drift** — about 10-15% of businesses list a Facebook page in the website field; for true-website coverage, regex-filter on `^https?://(?!.*facebook\.com|.*instagram\.com)`. **Closed-business handling** — Google occasionally retains records for permanently-closed businesses; filter on `is_temporarily_closed: false` and `is_permanently_closed: false` to exclude.

Thirdwatch's actor uses Google Maps' internal search API at $0.06/1K, the cheapest production approach. Pair Google Maps with [JustDial Scraper](https://apify.com/thirdwatch/justdial-business-scraper) for India-specific coverage. A fourth subtle issue worth flagging: certain regulated categories (medical, legal, financial services) require additional contact-data validation for compliance — phone numbers extracted from Google Maps are public records but pre-call notification requirements vary by jurisdiction (TCPA in US, GDPR ePrivacy in EU); always layer compliance-validation on top of raw extraction. A fifth pattern unique to lead-gen workflows: response rates on Google-Maps-sourced numbers correlate strongly with reviews_count — businesses with 50+ reviews answer cold calls at 2-3x higher rates than those with under 10 reviews because the latter are often single-owner operations with overworked staff. For best response economics, prioritize the 50+ reviews segment for outbound and treat the under-10 segment as web-form / email channel only. A sixth and final pitfall: Google Maps data subject to a 30-day attribution requirement — Google's TOS asks that data sourced from Maps preserve attribution to Google Maps as source; for compliance, store a "source: Google Maps" tag alongside the record and surface attribution in any downstream consumer-facing product. A seventh and final pattern worth flagging for production teams: data-pipeline cost optimization. The actor's pricing scales linearly with record volume, so for high-cadence operations (hourly polling on large watchlists), the dominant cost driver is the size of the watchlist rather than the per-record fee. For cost-disciplined teams, tier the watchlist (Tier 1 hourly, Tier 2 daily, Tier 3 weekly) rather than running everything at the highest cadence — typical 60-80% cost reduction with minimal signal loss. Combine tiered cadence with explicit dedup keys and incremental snapshot diffing to keep storage and downstream-compute proportional to *new* signal rather than total watchlist size. This is the difference between a $200/month research pipeline and a $2,000/month one for the same actionable output. An eighth subtle issue worth flagging: snapshot-storage strategy materially affects long-term pipeline economics. Raw JSON snapshots compressed with gzip typically run 4-8x smaller than uncompressed; for multi-year retention, always compress at write-time. For high-frequency snapshots, partition storage by date prefix (`snapshots/YYYY/MM/DD/`) to enable fast date-range queries and incremental processing rather than full-scan re-aggregation. Most production pipelines keep 90 days of raw snapshots at full fidelity + 12 months of derived per-record aggregates + indefinite retention of derived metric time-series — three retention tiers managed separately.

## Related use cases

- [Scrape Google Maps businesses for lead-gen](/blog/scrape-google-maps-businesses-for-lead-gen)
- [Build local-business database with Google Maps](/blog/build-local-business-database-with-google-maps)
- [Find restaurants by cuisine and rating](/blog/find-restaurants-by-cuisine-and-rating)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What contact fields does Google Maps return?

Eight contact-relevant fields per business: name, address, phone, website, lat/lng, opening_hours, plus_code, and category. About 75-85% of listed businesses publish phone; 60-70% publish a website. Coverage varies by category — restaurants and clinics have near-100% phone publication; pure-service businesses (lawyers, consultants) often skip phone in favor of website-only contact.

### Is the phone field reliable for outbound dialing?

Yes, with caveats. Phone numbers on Google Maps are submitted by business owners or auto-discovered from website crawls; for active operators they're 95%+ accurate. About 5-10% return wrong-number, voicemail-only, or out-of-service signals — for cold-call sales pipelines, validate with a phone-number-validation service before mass dialing. Phone format varies by country; normalize to E.164 before storing.

### What's the best query strategy for lead-gen?

Three patterns: (1) `category + city` (`dentist Chicago`); (2) `niche + city` (`pediatric dentist Chicago`); (3) `category + neighborhood` (`dentist Lincoln Park Chicago`). Combine all three for comprehensive city coverage. For metro-level lead-gen, aim for 200+ queries spanning categories × neighborhoods to capture most local businesses.

### How fresh is the contact data?

Google Maps updates phone/website fields within 48 hours of business owner edits or website-crawl detection. For active outbound campaigns, refresh quarterly — that's the cadence at which a meaningful share of small businesses change phone numbers or migrate websites. For static directory builds, annual refresh is sufficient.

### How do I dedupe across overlapping queries?

`place_id` is Google Maps' canonical natural key per physical location — stable across name, phone, website, and category changes. About 30-40% of rows duplicate across overlapping queries; dedupe on `place_id` before downstream processing. For chains, each branch has its own `place_id`.

### How does this compare to Yelp or Yellow Pages?

[Yelp's](https://www.yelp.com/) coverage skews toward restaurants and consumer services. Yellow Pages has broader category coverage but stale data. Google Maps is the canonical source for fresh, broad-coverage local-business contact data — most directories aggregate from Google Maps as their primary source. For maximum coverage, run all three; for cost-optimized lead-gen, Google Maps alone covers 85%+ of viable business contacts.

Run the [Google Maps Scraper on Apify Store](https://apify.com/thirdwatch/google-maps-scraper) — pay-per-record, free to try, no credit card to test.
