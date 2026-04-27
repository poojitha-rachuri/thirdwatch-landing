---
title: "Find Glassdoor Interview Questions by Role (2026)"
slug: "find-glassdoor-interview-questions-by-role"
description: "Pull crowd-sourced interview questions from Glassdoor at $0.008 per record using Thirdwatch. Role-specific patterns + per-company question banks for prep workflows."
actor: "glassdoor-scraper"
actor_url: "https://apify.com/thirdwatch/glassdoor-scraper"
actorTitle: "Glassdoor Scraper"
category: "jobs"
audience: "researchers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "scrape-glassdoor-salaries-for-comp-benchmarking"
  - "research-company-reviews-on-glassdoor"
  - "track-glassdoor-rating-changes-over-time"
keywords:
  - "glassdoor interview questions"
  - "interview prep glassdoor"
  - "company interview research"
  - "role interview question bank"
faqs:
  - q: "What does the actor return for interview research?"
    a: "Glassdoor displays interview-question summaries on company review pages alongside pros/cons. Setting scrapeType: reviews and querying by company surfaces the company's review record which includes themed pros and cons; Glassdoor's interview-question summaries are clustered into the cons array when employees report difficult interview experiences. For complete interview-question text on specific companies, run separate queries with company name + interview-question patterns."
  - q: "Why use Glassdoor for interview prep?"
    a: "Glassdoor's interview-question dataset is the largest crowd-sourced corpus of company-specific interview questions on the public web — millions of questions across 1.4M+ companies. For job seekers, it's the canonical resource for company-specific interview research. For interview-prep platform builders or career-coaching SaaS teams, the dataset is a structured input layer."
  - q: "How do I extract role-specific question patterns?"
    a: "Glassdoor's interview-question summaries cluster by role implicitly (the page shows interviews tagged by job title). Pull reviews for a specific company, filter to interview-question content, and group by role-title patterns. Role-level question pattern extraction works best when you cross-reference 5-10 companies in the same domain — common patterns surface as signal across multiple companies."
  - q: "How fresh is interview question data?"
    a: "Each run pulls live from Glassdoor at request time. Interview questions update as new candidates post their experiences — typically 5-50 new interview reports per week per major employer. For interview prep specifically, monthly refresh is sufficient (interview questions evolve slowly); for ongoing question-bank maintenance, weekly is the right cadence."
  - q: "Can I build a question bank across multiple companies?"
    a: "Yes. Run the actor across a peer-company watchlist (15-30 companies in your target domain) and aggregate the interview-related themes from cons + dedicated interview-prep content. Group by detected question category (system design, behavioural, coding, leadership) using keyword-matching or LLM-based categorisation. Cross-company question banks reveal which questions are universal vs company-specific."
  - q: "How does this compare to interview-prep platforms?"
    a: "Platforms like LeetCode, Pramp, and Interview Cake bundle question banks with practice tools and mock-interview features. Glassdoor's data is unique because it's company-specific (real interview questions from real candidates at specific employers). For company-specific prep, Glassdoor wins; for general algorithm/system-design prep, dedicated platforms win. Use both — Glassdoor for which questions to expect at specific companies, LeetCode/etc for general technique."
---

> Thirdwatch's [Glassdoor Scraper](https://apify.com/thirdwatch/glassdoor-scraper) returns Glassdoor interview-question summaries at $0.008 per record — company-specific question themes from millions of crowd-sourced candidate reports across 1.4M+ companies. Built for interview-prep platform builders, career-coaching SaaS teams, candidate-prep workflows, and recruiter teams analyzing interview-process effectiveness.

## Why scrape Glassdoor for interview research

Interview prep is meaningfully more effective when role- and company-specific. According to [Glassdoor's 2024 Site Survey](https://www.glassdoor.com/blog/), candidates who prepare with company-specific interview questions report 40%+ higher offer-acceptance confidence and materially better outcomes. The blocker for systematic access: Glassdoor doesn't expose an API, and aggregator platforms (LeetCode, Pramp, Interview Cake) focus on general algorithmic prep rather than company-specific questions.

The job-to-be-done is structured. An interview-prep platform builder wants 1,000+ company question banks for the platform's content layer. A career-coaching SaaS scrapes per-company interview themes for personalised candidate prep. A recruiter team studies their own interview process by mining what candidates report on Glassdoor. A candidate themselves wants every available question for the specific companies they're interviewing at. All reduce to per-company review pulls + theme aggregation + role-level pattern extraction.

## How does this compare to the alternatives?

Three options for getting Glassdoor interview-question data:

| Approach | Cost per 1,000 records | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| Manual Glassdoor browsing + spreadsheets | Effectively unbounded analyst time | Low (sampling bias) | Continuous | Doesn't scale |
| Paid interview-prep SaaS (Interview Cake, Pramp Pro) | $50–$300/month per seat | Curated, no Glassdoor data | Hours | Vendor-curated content |
| Thirdwatch Glassdoor Scraper | $8 ($0.008 × 1,000) | Camoufox stealth, structured output | 5 minutes | Thirdwatch tracks Glassdoor changes |

Paid interview-prep SaaS is curated and high-quality but doesn't surface company-specific real-candidate questions. The [Glassdoor Scraper actor page](/scrapers/glassdoor-scraper) gives you the raw structured-data layer.

## How to find Glassdoor interview questions in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull Glassdoor reviews scoped to interview content?

Set `scrapeType: "reviews"` and pass company names; Glassdoor reviews include interview-question summaries in pros/cons themes.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~glassdoor-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

PEER_SET = ["google", "meta", "openai", "anthropic", "stripe",
            "airbnb", "amazon", "microsoft", "netflix", "apple"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": PEER_SET,
        "scrapeType": "reviews",
        "country": "us",
        "maxResults": 100,
    },
    timeout=3600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} review records across {df.company_name.nunique()} companies")
```

10 companies × 10 review records = ~100 records, costing $0.80.

### Step 3: How do I extract interview-related themes?

Filter pros/cons arrays for interview-related keywords; cluster into question categories.

```python
INTERVIEW_KEYWORDS = ["interview", "coding", "system design",
                      "behavioural", "behavioral", "technical screen",
                      "phone screen", "onsite", "leadership principle"]

def has_interview_signal(themes):
    if not isinstance(themes, list):
        return False
    return any(any(kw in t.lower() for kw in INTERVIEW_KEYWORDS) for t in themes)

def extract_interview_themes(themes):
    if not isinstance(themes, list):
        return []
    return [t for t in themes
            if any(kw in t.lower() for kw in INTERVIEW_KEYWORDS)]

df["interview_pros"] = df.pros.apply(extract_interview_themes)
df["interview_cons"] = df.cons.apply(extract_interview_themes)
df["has_interview_content"] = df.pros.apply(has_interview_signal) | df.cons.apply(has_interview_signal)

interview_df = df[df.has_interview_content].copy()
print(f"{len(interview_df)} records with interview content")
print(interview_df[["company_name", "interview_pros", "interview_cons"]].head(10))
```

Themes mentioning "leadership principle" surface Amazon's process specifically; "system design" themes are universal across tech companies.

### Step 4: How do I build a per-company question-bank library?

Aggregate interview themes by company; export as Markdown for an interview-prep platform.

```python
from collections import Counter

bank = {}
for _, row in interview_df.iterrows():
    company = row.company_name
    if company not in bank:
        bank[company] = Counter()
    for theme in row.interview_pros + row.interview_cons:
        bank[company][theme.lower().strip()] += 1

# Export top themes per company
import pathlib
for company, theme_counts in bank.items():
    out = pathlib.Path(f"interview_bank/{company.replace(' ', '_')}.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"# {company} Interview Questions\n",
              "_Sourced from Glassdoor employee-reported interviews._\n"]
    for theme, count in theme_counts.most_common(20):
        lines.append(f"- {theme} _(mentioned {count}x)_")
    out.write_text("\n".join(lines))

print(f"Exported {len(bank)} company question banks")
```

The Markdown files are ready to ingest into an interview-prep platform's content layer or a candidate-coaching tool.

## Sample output

A single review record (with interview-related cons) looks like this:

```json
{
  "company_name": "Amazon",
  "company_rating": 3.6,
  "pros": ["Strong leadership principles training", "High autonomy"],
  "cons": ["Tough interview process — 5 rounds covering each leadership principle in depth",
           "System design rounds particularly difficult",
           "Behavioural questions tied to leadership principles take significant prep"]
}
```

Interview-related signals concentrate in the `cons` array because candidates more frequently report tough interview processes than easy ones. Filter on keyword matches in `cons` for the strongest signal; supplement with `pros` for context.

## Common pitfalls

Three things go wrong in interview-research pipelines on Glassdoor data. **Theme abstraction loss** — Glassdoor's pros/cons are clustered themes rather than raw question text, so you get "system design questions" rather than the specific question. For raw question text, fetch individual interview-experience pages by URL after identifying companies via the actor. **Recency bias** — Glassdoor weights recent reviews higher in clustering, so themes reflect the current interview process rather than historical patterns. For long-running prep platforms, refresh quarterly to keep question banks current. **Cross-role contamination** — Glassdoor's company-level reviews mix interview themes across roles (engineering, product, sales). For role-specific question banks, additional filtering on role-name keywords in the theme strings is required.

Thirdwatch's actor uses Camoufox stealth-browser bypass for Glassdoor's Cloudflare protection — production-tested at sustained weekly volumes. The 4096 MB max memory and 3,600-second timeout headroom mean even 100-company batch runs complete cleanly. Pair Glassdoor with our [LinkedIn Profile Scraper](https://apify.com/thirdwatch/linkedin-profile-scraper) to identify candidates who interviewed at target companies and reach out for richer first-person interview content. A fourth subtle issue worth flagging: Glassdoor's review-clustering algorithm gives extra weight to recent and high-engagement reviews, which means the same company viewed three months apart can surface meaningfully different "top themes" even when the underlying interview process hasn't changed. For longitudinal interview-prep dashboards, snapshot themes monthly and treat the rolling 90-day union as your stable theme set rather than reading any single snapshot as authoritative. A fifth pattern unique to interview-prep extraction: companies with employee-review counts under ~50 produce noisy theme clusters because Glassdoor's clustering threshold is built for higher-volume employers. For early-stage startups, fall back to raw review text concatenation + LLM-based theme extraction rather than relying on the clustered pros/cons arrays — you'll get better coverage at the cost of an extra LLM-call step in the pipeline. A sixth pitfall: when Glassdoor surfaces interview-question themes for very large employers (Amazon, Google, Meta), the themes blur across dozens of role families, so for role-specific question banks at mega-employers always cross-reference the themed cons with the `jobTitle` field if present, or fall back to filtering at the company-subdivision level (e.g., "Amazon Web Services" rather than "Amazon" as the query).

## Related use cases

- [Scrape Glassdoor salaries for compensation benchmarking](/blog/scrape-glassdoor-salaries-for-comp-benchmarking)
- [Research company reviews on Glassdoor](/blog/research-company-reviews-on-glassdoor)
- [Track Glassdoor rating changes over time](/blog/track-glassdoor-rating-changes-over-time)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### What does the actor return for interview research?

Glassdoor displays interview-question summaries on company review pages alongside pros/cons. Setting `scrapeType: "reviews"` and querying by company surfaces the company's review record which includes themed pros and cons; Glassdoor's interview-question summaries are clustered into the `cons` array when employees report difficult interview experiences. For complete interview-question text on specific companies, run separate queries with company name + interview-question patterns.

### Why use Glassdoor for interview prep?

Glassdoor's interview-question dataset is the largest crowd-sourced corpus of company-specific interview questions on the public web — millions of questions across 1.4M+ companies. For job seekers, it's the canonical resource for company-specific interview research. For interview-prep platform builders or career-coaching SaaS teams, the dataset is a structured input layer.

### How do I extract role-specific question patterns?

Glassdoor's interview-question summaries cluster by role implicitly (the page shows interviews tagged by job title). Pull reviews for a specific company, filter to interview-question content, and group by role-title patterns. Role-level question pattern extraction works best when you cross-reference 5-10 companies in the same domain — common patterns surface as signal across multiple companies.

### How fresh is interview question data?

Each run pulls live from Glassdoor at request time. Interview questions update as new candidates post their experiences — typically 5-50 new interview reports per week per major employer. For interview prep specifically, monthly refresh is sufficient (interview questions evolve slowly); for ongoing question-bank maintenance, weekly is the right cadence.

### Can I build a question bank across multiple companies?

Yes. Run the actor across a peer-company watchlist (15-30 companies in your target domain) and aggregate the interview-related themes from `cons` + dedicated interview-prep content. Group by detected question category (system design, behavioural, coding, leadership) using keyword-matching or LLM-based categorisation. Cross-company question banks reveal which questions are universal vs company-specific.

### How does this compare to interview-prep platforms?

Platforms like [LeetCode](https://leetcode.com/), Pramp, and Interview Cake bundle question banks with practice tools and mock-interview features. Glassdoor's data is unique because it's company-specific (real interview questions from real candidates at specific employers). For company-specific prep, Glassdoor wins; for general algorithm/system-design prep, dedicated platforms win. Use both — Glassdoor for which questions to expect at specific companies, LeetCode/etc for general technique.

Run the [Glassdoor Scraper on Apify Store](https://apify.com/thirdwatch/glassdoor-scraper) — pay-per-record, free to try, no credit card to test.
