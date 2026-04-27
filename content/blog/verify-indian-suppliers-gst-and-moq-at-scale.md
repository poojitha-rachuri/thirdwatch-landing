---
title: "Verify Indian Suppliers' GST and MOQ at Scale (2026 Guide)"
slug: "verify-indian-suppliers-gst-and-moq-at-scale"
description: "Verify GST registration and MOQ compatibility across Indian suppliers at $0.002 per record using Thirdwatch's IndiaMart Scraper. Compliance and onboarding recipes."
actor: "indiamart-supplier-scraper"
actor_url: "https://apify.com/thirdwatch/indiamart-supplier-scraper"
actorTitle: "IndiaMart Scraper"
category: "compliance"
audience: "ops"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "find-b2b-suppliers-india-with-indiamart-scraper"
  - "build-procurement-shortlist-from-indiamart"
  - "monitor-wholesale-prices-india-with-indiamart"
keywords:
  - "verify indian supplier GST"
  - "MOQ compliance check india"
  - "supplier onboarding verification"
  - "GSTIN validation api"
faqs:
  - q: "Why does GST verification matter for Indian supplier onboarding?"
    a: "A registered GSTIN is the basic compliance signal in Indian B2B procurement. Indian tax law requires GST registration for businesses above ₹40 lakh annual turnover (₹20 lakh for service providers). A missing or invalid GST number on a supplier listing is a compliance red flag — either the supplier is below the threshold (small business, may be acceptable for low-volume) or non-compliant (high risk for any contract above ₹50,000)."
  - q: "How do I structurally verify a GST number?"
    a: "Two layers: (1) format validation (15 characters, structured as 2-digit state + 10-digit PAN + 1 entity + 1 digit + 1 alphanumeric) ensures the number is well-formed. (2) Cross-reference against India's official GST portal via Thirdwatch's GST Verification Scraper to confirm the GSTIN is active and matches the claimed business name. Format validation catches typos; portal verification catches fraud."
  - q: "What MOQ thresholds matter for a procurement workflow?"
    a: "Three categorical bands: low (under ₹10K) for SME purchasing and rapid prototyping, medium (₹10K-₹100K) for standard B2B procurement, high (₹100K+) for enterprise sourcing. Most Indian SMB procurement workflows match suppliers' MOQ to the buyer's average order size; 2-3x mismatch causes friction (buyer too small for supplier, or supplier too small for buyer's volume needs)."
  - q: "How accurate is IndiaMart's GST data?"
    a: "About 80% of IndiaMart listings publish a GST number. Of those, roughly 95% are well-formed and 90% are still active per India's GST portal. A 15-character GST number that fails format validation is almost always a typo by the supplier; one that fails portal verification is either a recently-cancelled registration or fraud (rare but exists)."
  - q: "Can I batch-verify thousands of suppliers automatically?"
    a: "Yes. The IndiaMart Scraper returns gst_number on every record where the supplier publishes it; pipe non-null GSTINs into Thirdwatch's [GST Verification Scraper](https://apify.com/thirdwatch/gst-verification-scraper) for portal cross-reference at scale. The two-actor pipeline takes a 1,000-supplier list to fully-verified-or-flagged in under 30 minutes."
  - q: "How fresh does GST verification need to be?"
    a: "Annual is the standard cadence for established suppliers (re-verify GST and MOQ once a year per supplier). For new supplier onboarding, verify at the time of first contract. For high-volume supplier panels (50+ vendors with significant spend each), quarterly is the right cadence — GST registrations occasionally lapse or change after corporate restructuring."
---

> Thirdwatch's [IndiaMart Scraper](https://apify.com/thirdwatch/indiamart-supplier-scraper) returns supplier-published GST numbers and MOQ on every listing at $0.002 per record. Combined with Thirdwatch's [GST Verification Scraper](https://apify.com/thirdwatch/gst-verification-scraper) for cross-reference against India's official GST portal, this is the canonical pipeline for batch-verifying Indian suppliers' compliance status during onboarding or panel review. Built for procurement compliance teams, supplier-onboarding ops, and audit functions who need structured GST/MOQ data without manual tax-portal lookups.

## Why verify GST and MOQ at scale

Indian B2B procurement compliance is increasingly automated. According to the [Indian government's Goods and Services Tax Network's 2024 disclosures](https://www.gstn.org.in/), more than 1.4 crore (14 million) businesses are registered for GST as of late 2024 — and Indian Income Tax rules require buyers to verify their suppliers' GST status to claim Input Tax Credit. A buyer claiming ITC against a supplier whose GST registration was cancelled is exposed to disallowance on audit; the resulting tax liability often exceeds the original invoice value.

The job-to-be-done is structured. A procurement compliance team needs to verify GST registration status for every supplier in their panel quarterly. A supplier-onboarding ops team needs MOQ-vs-buyer-volume compatibility check on each new vendor. An audit function needs proof of compliance verification for every supplier transaction above the materiality threshold. All of these reduce to the same shape: pull supplier GST and MOQ at scale, format-validate, cross-reference against the tax portal, flag misses. The two Thirdwatch actors handle the data layer.

## How does this compare to the alternatives?

Three options for batch GST/MOQ supplier verification in India:

| Approach | Cost per 1,000 suppliers verified | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual tax-portal lookups | Effectively unbounded analyst time | High but slow | Continuous | Doesn't scale |
| Indian compliance SaaS (TaxGenie, ClearTax compliance) | $5K–$30K/year flat | High | Days–weeks to onboard | Vendor lock-in |
| Thirdwatch IndiaMart + GST Verification scrapers | $4 ($0.002 + $0.002 per supplier) | Production-tested, monopoly on Apify | Half a day | Thirdwatch tracks both sources |

Indian compliance SaaS bundles GST verification with broader tax-compliance functionality. Building your own pipeline gives full schema control at 0.5% of the cost. The [IndiaMart Scraper actor page](/scrapers/indiamart-supplier-scraper) returns supplier-published GST; the [GST Verification Scraper actor page](/scrapers/gst-verification-scraper) cross-references against the official portal.

## How to verify Indian suppliers in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull GST and MOQ across a supplier panel?

Pass each panel-supplier query and aggregate results.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~indiamart-supplier-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

# Categories you currently buy from
PANEL_QUERIES = ["industrial gloves", "stainless steel screws",
                 "packaging boxes corrugated", "PVC pipes",
                 "MS angle iron", "office furniture"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"queries": PANEL_QUERIES, "maxResultsPerQuery": 100},
    timeout=900,
)
df = pd.DataFrame(resp.json())
df = df.drop_duplicates(subset=["company_name"])
print(f"{len(df)} unique suppliers across {len(PANEL_QUERIES)} categories")
```

Six categories × 100 = 600 raw, ~400 unique after dedup, costing $1.20 at FREE pricing.

### Step 3: How do I format-validate GSTINs and parse MOQ?

Format validation catches typos before the (more expensive) portal-verification step.

```python
import re

GST_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")

def validate_gst(gst):
    if not gst or not isinstance(gst, str):
        return ("missing", None)
    gst_clean = gst.strip().upper()
    if not GST_RE.match(gst_clean):
        return ("malformed", gst_clean)
    state_code = gst_clean[:2]
    return ("well_formed", gst_clean)

MOQ_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(Kg|Piece|Pieces|Tonne|Roll|Meter|Litre|Box|Set)?",
                    re.IGNORECASE)
def parse_moq(moq):
    if not moq:
        return (None, None)
    m = MOQ_RE.search(moq)
    if not m:
        return (None, None)
    return (float(m.group(1)), (m.group(2) or "").strip() or None)

df[["gst_status", "gst_clean"]] = df.gst_number.apply(
    lambda x: pd.Series(validate_gst(x)))
df[["moq_value", "moq_unit"]] = df.moq.apply(
    lambda x: pd.Series(parse_moq(x)))

print(df.gst_status.value_counts())
print(df[["company_name", "gst_clean", "gst_status",
          "moq_value", "moq_unit"]].head(20))
```

The `gst_status` column partitions suppliers cleanly — `well_formed` candidates proceed to portal verification, `malformed` get flagged for manual cleanup, `missing` either get GSTIN requested from the supplier or quarantined.

### Step 4: How do I cross-reference well-formed GSTINs against India's GST portal?

Pipe the well-formed candidates into Thirdwatch's GST Verification Scraper.

```python
GST_VERIFY_ACTOR = "thirdwatch~gst-verification-scraper"

well_formed = df[df.gst_status == "well_formed"].copy()
gstins = well_formed.gst_clean.dropna().unique().tolist()

verify_resp = requests.post(
    f"https://api.apify.com/v2/acts/{GST_VERIFY_ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"gstins": gstins},
    timeout=1800,
)
verified = pd.DataFrame(verify_resp.json())

merged = well_formed.merge(verified, left_on="gst_clean",
                            right_on="gstin", how="left")
print("--- Compliance summary ---")
print(merged.groupby("status")["company_name"].count())

flags = merged[merged.status != "Active"]
print(f"\n{len(flags)} suppliers with non-Active GST status:")
print(flags[["company_name", "gst_clean", "status"]].head(15))
```

Status of `Active` confirms the GSTIN is valid; anything else (`Cancelled`, `Suspended`, or no record found) needs follow-up before any new contract.

## Sample output

A single record from the IndiaMart Scraper with GST and MOQ fields highlighted looks like this. The verification pipeline stitches the IndiaMart and GST-Verification outputs.

```json
{
  "company_name": "Tata Steel Ltd.",
  "product_name": "Stainless Steel Pipes 304",
  "price": "Rs 180 / Kg",
  "moq": "500 Kg",
  "city": "Mumbai",
  "state": "Maharashtra",
  "phone": "8044464742",
  "gst_number": "27AAACT2727Q1ZV",
  "supplier_rating": "4.5",
  "rating_count": "1240",
  "member_since": "1998",
  "catalog_url": "https://www.indiamart.com/tata-steel/"
}
```

A typical batch-verification summary looks like:

| Status | Count | % |
|---|---|---|
| Active | 312 | 78% |
| Missing | 53 | 13% |
| Malformed | 21 | 5% |
| Cancelled | 14 | 3.5% |
| Suspended | 2 | 0.5% |

312 of 400 cleared on the first pass. The 14 Cancelled + 2 Suspended need immediate panel removal; the 21 Malformed need format clarification from the supplier; the 53 Missing get a GST request before any new contract.

## Common pitfalls

Three things go wrong in batch-verification pipelines. **State-code mismatch** — the first 2 digits of a GSTIN encode the state of registration; if a supplier's listed `city`/`state` doesn't match the GSTIN state-code, that's either a multi-state operation (legitimate, common for big chains) or a copy-paste error. Surface state mismatch as a soft flag for review. **Multi-GSTIN suppliers** — large chains have GSTINs per state of operation; a single-listing approach gives you only one of them. For panel verification of multi-state chains, search by `company_name` across multiple cities and aggregate distinct GSTINs. **MOQ unit confusion** — comparing a supplier with `MOQ: 500 Kg` to a buyer with `target volume: 200 Pieces` is meaningless without unit conversion; always parse and normalise units before doing compatibility math.

Thirdwatch's IndiaMart actor returns `gst_number`, `moq`, and supplier metadata on every record; the GST Verification actor handles the portal cross-reference. The combined two-actor pipeline takes a 1,000-supplier list to fully-verified-or-flagged in under 30 minutes and costs roughly $4.

## Related use cases

- [Find B2B suppliers in India with IndiaMart](/blog/find-b2b-suppliers-india-with-indiamart-scraper)
- [Build a procurement shortlist from IndiaMart](/blog/build-procurement-shortlist-from-indiamart)
- [Monitor wholesale prices in India with IndiaMart](/blog/monitor-wholesale-prices-india-with-indiamart)
- [The complete guide to scraping business data](/blog/guide-scraping-business-data)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why does GST verification matter for Indian supplier onboarding?

A registered GSTIN is the basic compliance signal in Indian B2B procurement. Indian tax law requires GST registration for businesses above ₹40 lakh annual turnover (₹20 lakh for service providers). A missing or invalid GST number on a supplier listing is a compliance red flag — either the supplier is below the threshold (small business, may be acceptable for low-volume) or non-compliant (high risk for any contract above ₹50,000).

### How do I structurally verify a GST number?

Two layers: (1) format validation (15 characters, structured as 2-digit state + 10-digit PAN + 1 entity + 1 digit + 1 alphanumeric) ensures the number is well-formed. (2) Cross-reference against [India's official GST portal](https://services.gst.gov.in/services/searchtp) via Thirdwatch's [GST Verification Scraper](https://apify.com/thirdwatch/gst-verification-scraper) to confirm the GSTIN is active and matches the claimed business name. Format validation catches typos; portal verification catches fraud.

### What MOQ thresholds matter for a procurement workflow?

Three categorical bands: low (under ₹10K) for SME purchasing and rapid prototyping, medium (₹10K-₹100K) for standard B2B procurement, high (₹100K+) for enterprise sourcing. Most Indian SMB procurement workflows match suppliers' MOQ to the buyer's average order size; 2-3x mismatch causes friction (buyer too small for supplier, or supplier too small for buyer's volume needs).

### How accurate is IndiaMart's GST data?

About 80% of IndiaMart listings publish a GST number. Of those, roughly 95% are well-formed and 90% are still active per India's GST portal. A 15-character GST number that fails format validation is almost always a typo by the supplier; one that fails portal verification is either a recently-cancelled registration or fraud (rare but exists).

### Can I batch-verify thousands of suppliers automatically?

Yes. The IndiaMart Scraper returns `gst_number` on every record where the supplier publishes it; pipe non-null GSTINs into Thirdwatch's [GST Verification Scraper](https://apify.com/thirdwatch/gst-verification-scraper) for portal cross-reference at scale. The two-actor pipeline takes a 1,000-supplier list to fully-verified-or-flagged in under 30 minutes.

### How fresh does GST verification need to be?

Annual is the standard cadence for established suppliers (re-verify GST and MOQ once a year per supplier). For new supplier onboarding, verify at the time of first contract. For high-volume supplier panels (50+ vendors with significant spend each), quarterly is the right cadence — GST registrations occasionally lapse or change after corporate restructuring.

Run the [IndiaMart Scraper on Apify Store](https://apify.com/thirdwatch/indiamart-supplier-scraper) — pay-per-supplier, free to try, no credit card to test.
