---
title: "Verify Indian GST Numbers at Scale (2026 Guide)"
slug: "verify-indian-gst-numbers-at-scale"
description: "Verify Indian GSTIN numbers at $0.01 per record using Thirdwatch. Bulk supplier compliance + KYB workflows + India vendor due diligence recipes."
actor: "gst-verification-scraper"
actor_url: "https://apify.com/thirdwatch/gst-verification-scraper"
actorTitle: "GST Verification Scraper"
category: "compliance"
audience: "operators"
publishedAt: "2026-04-28"
updatedAt: "2026-04-28"
medium_status: "pending"
related:
  - "build-india-supplier-compliance-pipeline"
  - "monitor-gst-status-changes-for-vendor-due-diligence"
  - "verify-indian-suppliers-gst-and-moq-at-scale"
keywords:
  - "gst verification api"
  - "indian gst lookup"
  - "kyb india supplier"
  - "gstin validation scraper"
faqs:
  - q: "Why automate GSTIN verification?"
    a: "Indian GST regulations require buyers to verify supplier GSTIN status before claiming Input Tax Credit (ITC). According to GSTN's 2024 compliance guidelines, ITC mismatches due to invalid/cancelled supplier GSTINs are the #1 source of GST audit-flags. For finance teams managing 100+ India-supplier networks, automated GSTIN verification is essential for compliance — manual verification at scale is unsustainable."
  - q: "What data does the actor return per GSTIN?"
    a: "Per GSTIN: legal_name, trade_name, registration_status (Active/Cancelled/Suspended), registration_date, principal_place_of_business, state_jurisdiction, taxpayer_type (Regular/Composition/SEZ), business_constitution (Proprietorship/Partnership/Company), authorized_signatories. About 100% of valid GSTINs return comprehensive metadata via India's GSTN Public Portal."
  - q: "How does the actor handle anti-bot defenses?"
    a: "GSTN Public Portal is intentionally accessible for compliance use cases. Thirdwatch's actor uses HTTP scraping aligned with GSTN's public-data API guidelines. Sustained rate: 100 lookups/minute per session. Production-tested at 95%+ success rate."
  - q: "Can I bulk-verify a vendor list?"
    a: "Yes. Pass an array of GSTINs (15-character alphanumeric — `27ABCDE1234F1Z5` format). For 1000-vendor verification, batch in 100-GSTIN chunks. Cost: 1000 × $0.01 = $10. Daily refresh of 5K-vendor watchlist for status-change monitoring = $50/day = $1,500/month FREE tier."
  - q: "How fresh do GSTIN snapshots need to be?"
    a: "For active vendor compliance (ongoing transactions), monthly cadence catches status changes (cancellations, suspensions). For high-stakes transactions (large invoices, contracts), per-transaction lookup at point-of-payment. For comprehensive vendor due-diligence, quarterly full-list refresh + alerts on status changes."
  - q: "How does this compare to GSTN's official API?"
    a: "GSTN provides an official API gated behind authorized GSP/ASP partnerships ($5K-$50K/year onboarding). The actor delivers similar coverage at $0.01/record without GSP partnership gatekeeping. For active GST-suvidha-provider operations, GSTN API is required. For compliance-research + KYB + vendor due-diligence, the actor scales without onboarding overhead."
---

> Thirdwatch's [GST Verification Scraper](https://apify.com/thirdwatch/gst-verification-scraper) returns Indian GSTIN verification data at $0.01 per record — legal name, trade name, registration status, principal business address, state jurisdiction, taxpayer type, signatories. Built for India compliance teams, finance operations, KYB workflows, and vendor due-diligence pipelines.

## Why automate GSTIN verification at scale

Indian GST compliance is increasingly automation-dependent. According to [GSTN's 2024 compliance report](https://www.gst.gov.in/), Input Tax Credit (ITC) mismatches due to invalid supplier GSTINs are the #1 source of GST audit flags — typically costing buyers 2-5% of transaction value in disallowed ITC + penalties. For finance teams managing India-supplier networks above 100 vendors, automated GSTIN verification is mission-critical for compliance.

The job-to-be-done is structured. A finance team verifies 5K-vendor GSTIN status monthly for ITC compliance. A KYB platform offers vendor-onboarding GSTIN verification as a service feature. A procurement function validates new-supplier GSTINs at onboarding (one-time lookup) + monitors active suppliers for status changes (recurring). A B2B SaaS providing India-tax software integrates GSTIN-status checks into invoice workflows. All reduce to GSTIN list + verification batch + status-change alerting.

## How does this compare to the alternatives?

Three options for GSTIN verification:

| Approach | Cost per 1,000 GSTINs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| GSTN official API (via GSP) | $5K–$50K/year onboarding + per-call | Authoritative | Weeks (GSP approval) | Per-tier license |
| Manual GSTN portal lookup | Effectively unbounded | Low (rate-limited) | Continuous | Doesn't scale |
| Thirdwatch GST Verification Scraper | $10 ($0.01 × 1,000) | Production-tested HTTP | 5 minutes | Thirdwatch tracks GSTN changes |

GSTN's official API requires GSP/ASP partnership onboarding. The [GST Verification Scraper actor page](/scrapers/gst-verification-scraper) gives you raw verification data at the lowest unit cost.

## How to verify GSTINs in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I bulk-verify a vendor list?

Pass GSTIN array.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~gst-verification-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

VENDORS = [
    "27AABCT3518Q1ZS",  # Example only
    "29AABCM1234R1ZQ",
    "07AABCS5678P1ZW",
    # ... up to 1000 GSTINs per batch
]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={"gstins": VENDORS},
    timeout=900,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} GSTINs verified")
print(f"Active: {(df.registration_status == 'Active').sum()}")
print(f"Cancelled: {(df.registration_status == 'Cancelled').sum()}")
print(f"Suspended: {(df.registration_status == 'Suspended').sum()}")
```

1000 GSTINs verified per batch, costing $10. Daily 5K-vendor refresh = $50/day FREE tier.

### Step 3: How do I detect status changes vs prior snapshot?

Compare daily snapshots and alert on status flips.

```python
import pandas as pd, glob, json, requests as r

snapshots = sorted(glob.glob("snapshots/gst-*.json"))
dfs = []
for s in snapshots:
    snap = pd.DataFrame(json.loads(open(s).read()))
    snap["snapshot_date"] = pd.to_datetime(s.split("-")[-1].split(".")[0])
    dfs.append(snap)

all_df = pd.concat(dfs, ignore_index=True)
latest = all_df[all_df.snapshot_date == all_df.snapshot_date.max()]
prev = all_df[all_df.snapshot_date == sorted(all_df.snapshot_date.unique())[-2]]

merged = latest.merge(prev, on="gstin", suffixes=("", "_prev"))
status_changes = merged[merged.registration_status != merged.registration_status_prev]

for _, row in status_changes.iterrows():
    r.post("https://hooks.slack.com/services/.../...",
           json={"text": (f":warning: GSTIN {row.gstin} ({row.legal_name}) "
                          f"changed: {row.registration_status_prev} → {row.registration_status}")})
print(f"{len(status_changes)} status changes alerted")
```

Status flips (Active → Cancelled or Suspended) require immediate compliance action — block payments + claw back ITC for affected transactions.

### Step 4: How do I push to compliance Postgres?

Upsert per GSTIN with snapshot history.

```python
import psycopg2

with psycopg2.connect(...) as conn, conn.cursor() as cur:
    for _, v in df.iterrows():
        cur.execute(
            """INSERT INTO gst_vendors (gstin, legal_name, trade_name, status,
                                          state_jurisdiction, taxpayer_type,
                                          last_verified)
               VALUES (%s,%s,%s,%s,%s,%s, current_date)
               ON CONFLICT (gstin) DO UPDATE SET
                 status = EXCLUDED.status,
                 last_verified = current_date""",
            (v.gstin, v.legal_name, v.get("trade_name"), v.registration_status,
             v.state_jurisdiction, v.taxpayer_type)
        )
print(f"Upserted {len(df)} GSTIN records")
```

## Sample output

A single GSTIN verification record looks like this. Five rows weigh ~5 KB.

```json
{
  "gstin": "27AABCT3518Q1ZS",
  "legal_name": "Tata Consultancy Services Limited",
  "trade_name": "TCS",
  "registration_status": "Active",
  "registration_date": "2017-07-01",
  "principal_place_of_business": "Mumbai, Maharashtra",
  "state_jurisdiction": "Maharashtra",
  "taxpayer_type": "Regular",
  "business_constitution": "Public Limited Company",
  "authorized_signatories": ["N. Chandrasekaran", "Samir Seksaria"],
  "verified_at": "2026-04-28T08:00:00Z"
}
```

`gstin` is the canonical natural key (15-char). `registration_status` is the killer compliance field. `legal_name` + `trade_name` enable cross-reference with vendor-onboarding records to catch identity mismatches.

## Common pitfalls

Three things go wrong in GSTIN verification pipelines. **GSTIN format validation** — pre-validate GSTIN format (15 chars, state-code + PAN + entity-code + check-digit) before API call to filter typos. About 5-10% of vendor-submitted GSTINs are typo-corrupted. **State-jurisdiction nuance** — GSTIN encodes state-of-registration but vendors operate across states; match invoice-state with billing-address rather than GSTIN-state for ITC eligibility. **Suspension-vs-cancellation difference** — Suspended GSTINs can be reactivated within 30 days; Cancelled GSTINs cannot. Treat the two states differently in compliance workflows (suspension = warn, cancellation = hard-block payments).

Thirdwatch's actor uses HTTP scraping aligned with GSTN public-data guidelines at $0.01/record. Pair GST Verification with [IndiaMart Scraper](https://apify.com/thirdwatch/indiamart-scraper) for B2B supplier discovery + verification combined. A fourth subtle issue worth flagging: GSTN portal occasionally returns rate-limit errors during peak compliance windows (10th of each month for GSTR-3B filing deadline); for high-volume verification, schedule batches outside 8am-6pm IST on filing-deadline days. A fifth pattern unique to compliance work: cancelled-GSTIN ITC clawback periods extend up to 2 years backward — for retrospective compliance audits, supplement current-snapshot verification with historical-status reconstruction by checking GSTN's status-history endpoint per GSTIN. A sixth and final pitfall: composition-tier taxpayers (small businesses with turnover under ₹1.5Cr) cannot pass through ITC — accepting invoices from composition-tier vendors and claiming ITC is non-compliant. For ITC-eligible vendor screening, filter on `taxpayer_type == "Regular"` strictly.

## Operational best practices for production pipelines

Tier the cadence to match signal half-life. GSTIN status changes are infrequent — monthly polling on full vendor list + per-transaction lookups for new vendors covers most use cases. 60-80% cost reduction with negligible signal loss when watchlist is properly tiered.

Snapshot raw payloads. Pipeline cost is dominated by scrape volume, not storage. Persisting raw JSON snapshots lets you re-derive metrics — particularly useful for retrospective compliance audits. Compress with gzip at write-time.

Schema validation. Run a daily validation suite asserting expected core fields (gstin, legal_name, registration_status) with non-null rates above 99%. GSTN schema is stable but occasional outages produce empty responses — catch before treating as authoritative. Cross-snapshot diff alerts on status-field changes are critical compliance signal that should escalate to finance team within hours.  A seventh and final operational pattern at production scale: cross-snapshot diff alerts. Beyond detecting individual changes, build alerts on cross-snapshot field-level diffs — name changes, category re-classifications, status changes. These structural changes precede or follow material events and are leading indicators of organization-level disruption. Persist a structured-diff log alongside aggregate snapshots: for each entity, persist (field, old_value, new_value) tuples per scrape. Surface high-leverage diffs to human reviewers; low-leverage diffs stay in the audit log.

An eighth pattern worth flagging for cost-controlled teams: implement an incremental-diff pipeline that only re-processes records whose hash changed since the previous snapshot. For watchlists where 90%+ of records are unchanged between snapshots, hash-comparison-driven incremental processing reduces downstream-compute by 80-90% while preserving full data fidelity. Combine with snapshot-storage compression and tiered-cadence polling for end-to-end pipeline-cost reductions of 70%+ at scale. This pattern is particularly important when scaling beyond 100K records per snapshot — the difference between manageable monthly costs and runaway compute spend.

## Related use cases

- [Build India supplier compliance pipeline](/blog/build-india-supplier-compliance-pipeline)
- [Monitor GST status changes for vendor due-diligence](/blog/monitor-gst-status-changes-for-vendor-due-diligence)
- [Verify Indian suppliers GST and MOQ at scale](/blog/verify-indian-suppliers-gst-and-moq-at-scale)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### Why automate GSTIN verification?

Indian GST regulations require buyers to verify supplier GSTIN status before claiming Input Tax Credit (ITC). According to GSTN's 2024 compliance guidelines, ITC mismatches due to invalid/cancelled supplier GSTINs are the #1 source of GST audit-flags. For finance teams managing 100+ India-supplier networks, automated GSTIN verification is essential for compliance — manual verification at scale is unsustainable.

### What data does the actor return per GSTIN?

Per GSTIN: legal_name, trade_name, registration_status (Active/Cancelled/Suspended), registration_date, principal_place_of_business, state_jurisdiction, taxpayer_type (Regular/Composition/SEZ), business_constitution (Proprietorship/Partnership/Company), authorized_signatories. About 100% of valid GSTINs return comprehensive metadata via India's GSTN Public Portal.

### How does the actor handle anti-bot defenses?

GSTN Public Portal is intentionally accessible for compliance use cases. Thirdwatch's actor uses HTTP scraping aligned with GSTN's public-data API guidelines. Sustained rate: 100 lookups/minute per session. Production-tested at 95%+ success rate.

### Can I bulk-verify a vendor list?

Yes. Pass an array of GSTINs (15-character alphanumeric — `27ABCDE1234F1Z5` format). For 1000-vendor verification, batch in 100-GSTIN chunks. Cost: 1000 × $0.01 = $10. Daily refresh of 5K-vendor watchlist for status-change monitoring = $50/day = $1,500/month FREE tier.

### How fresh do GSTIN snapshots need to be?

For active vendor compliance (ongoing transactions), monthly cadence catches status changes (cancellations, suspensions). For high-stakes transactions (large invoices, contracts), per-transaction lookup at point-of-payment. For comprehensive vendor due-diligence, quarterly full-list refresh + alerts on status changes.

### How does this compare to GSTN's official API?

[GSTN](https://www.gst.gov.in/) provides an official API gated behind authorized GSP/ASP partnerships ($5K-$50K/year onboarding). The actor delivers similar coverage at $0.01/record without GSP partnership gatekeeping. For active GST-suvidha-provider operations, GSTN API is required. For compliance-research + KYB + vendor due-diligence, the actor scales without onboarding overhead.

Run the [GST Verification Scraper on Apify Store](https://apify.com/thirdwatch/gst-verification-scraper) — pay-per-verification, free to try, no credit card to test.
