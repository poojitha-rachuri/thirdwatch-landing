---
title: "Scrape Remote Jobs with the RemoteOK API at Scale (2026)"
slug: "scrape-remote-jobs-with-remoteok-api"
description: "Pull remote-only job listings at $0.0015 per record with Thirdwatch's RemoteOK Scraper. Salary, tags, location filters. Python and aggregator recipes."
actor: "remoteok-jobs-scraper"
actor_url: "https://apify.com/thirdwatch/remoteok-jobs-scraper"
actorTitle: "RemoteOK Scraper"
category: "jobs"
audience: "developers"
publishedAt: "2026-04-27"
updatedAt: "2026-04-27"
medium_status: "pending"
related:
  - "track-remote-hiring-trends-by-tech-stack"
  - "build-remote-jobs-aggregator-with-apify"
  - "find-remote-engineering-jobs-by-salary-band"
keywords:
  - "remoteok scraper"
  - "remote jobs api"
  - "scrape remoteok by tags"
  - "remote-only jobs feed"
faqs:
  - q: "How much does it cost to scrape RemoteOK?"
    a: "Thirdwatch's RemoteOK Scraper charges $0.0015 per job on the FREE tier and drops to $0.00085 at GOLD volume. A 10-keyword sweep at 200 jobs per query — typical for a remote-jobs aggregator daily refresh — costs $3 per pull, with hourly cadence affordable at under $75 a month."
  - q: "Can I get jobs without specifying a keyword?"
    a: "Not directly — queries is required and accepts at least one keyword. For broad coverage, pass a high-recall term like engineer, developer, or marketing as a single query and crank maxResults to 1000+. The actor scrapes RemoteOK's index filtered by that term and returns up to maxResults across all jobs matching."
  - q: "How is salary normalized in the dataset?"
    a: "RemoteOK publishes salary in USD when the employer provides it. The actor returns salary_min and salary_max as integer USD values. Roughly 40-50% of RemoteOK listings include salary; the remainder leave both fields null. For salary-band analysis, filter to non-null rows before aggregating."
  - q: "What does the tags field contain?"
    a: "RemoteOK's employer-set tags covering tech stack (python, react, kubernetes), seniority (junior, senior, lead), function (backend, devops, design), and location flexibility (worldwide, usa, europe). Each job has 3-8 tags. They're the highest-quality categorization signal in the dataset — much richer than typical keyword extraction from titles or descriptions alone."
  - q: "How does RemoteOK compare to Wellfound or LinkedIn for remote jobs?"
    a: "RemoteOK is remote-only by design — every listing is genuinely remote. Wellfound has remote and on-site startup jobs mixed; LinkedIn has every category. For a pure remote-jobs feed, RemoteOK is the cleanest single source. For comprehensive remote coverage, combine RemoteOK with Wellfound's remote filter and LinkedIn Jobs filtered to remote — Thirdwatch publishes scrapers for all three."
  - q: "Can I run it on a schedule for a job aggregator?"
    a: "Yes. Schedule the actor on Apify's cron with hourly or daily cadence, persist each run's dataset, and dedupe on url (RemoteOK's job URL is unique per posting). A multi-source remote aggregator typically runs RemoteOK hourly, Wellfound 6-hourly, and LinkedIn Jobs daily — the cadence matches each source's posting velocity."
---

> Thirdwatch's [RemoteOK Scraper](https://apify.com/thirdwatch/remoteok-jobs-scraper) returns structured remote-job data from RemoteOK.com — one of the top remote-only job boards — at $0.0015 per job. Returns title, company, salary_min, salary_max, tags, location, description, posted_date, and url per record. Built for developers, recruiters, HR researchers, and aggregator builders who need machine-readable remote-only job feeds without scraping each board separately.

## Why scrape RemoteOK for remote jobs

RemoteOK is one of the highest-signal remote-only job boards. According to [RemoteOK's own published statistics](https://remoteok.com/), the board has served more than 5 million remote workers since launch and indexes thousands of active remote-only postings at any time. Unlike LinkedIn or Indeed (where "remote" is a filter applied to a much larger universe), every job on RemoteOK is remote by definition — making it the cleanest possible feed for remote-only use cases.

The job-to-be-done is structured. A remote job seeker wants daily filtered output to a personal tracker (e.g. only senior Python jobs paying 150K+). A recruiter wants salary-band data on remote roles in a specific stack. An HR researcher wants tag-frequency trends over time to see which tech stacks are growing. An aggregator builder wants RemoteOK as one of three or four sources in a multi-board remote-jobs feed. All of these reduce to the same pull: filter by keyword, return structured rows. The Thirdwatch actor flattens RemoteOK's response into a clean JSON schema ready for pandas, Postgres, or a CRM.

## How does this compare to the alternatives?

Three options for getting RemoteOK data into a pipeline:

| Approach | Cost per 1,000 jobs | Reliability | Setup time | Maintenance |
|---|---|---|---|---|
| RemoteOK public JSON feed | Free, rate-limited | High when stable | 30 min for one-off | You own dedupe + parsing |
| Generic scraping API (Bright Data, ScraperAPI) | $5–$20 (proxy + parsing) | High | 2-4 hours | You own the parser |
| Thirdwatch RemoteOK Scraper | $1.50 ($0.0015 × 1,000) | Production-tested, first on Apify Store | 5 minutes | Thirdwatch tracks RemoteOK changes |

RemoteOK does publish a public JSON feed, and for one-off pulls it works fine. The actor's value is structured field normalisation (salary_min/salary_max as integers, tags as arrays, posted_date as ISO), keyword filtering, and a stable schema across runs. The [RemoteOK Scraper actor page](/scrapers/remoteok-jobs-scraper) documents every field.

## How to scrape RemoteOK in 4 steps

### Step 1: How do I authenticate against Apify?

Sign in at [apify.com](https://apify.com) (free tier, no credit card), open Settings → Integrations, and copy your personal API token. Every example below assumes the token is in `APIFY_TOKEN`:

```bash
export APIFY_TOKEN="apify_api_xxxxxxxxxxxxxxxx"
```

### Step 2: How do I pull jobs filtered by keyword?

Pass keywords in `queries` and an optional `location` filter. Each query filters across title, company, tags, and description.

```python
import os, requests, pandas as pd

ACTOR = "thirdwatch~remoteok-jobs-scraper"
TOKEN = os.environ["APIFY_TOKEN"]

resp = requests.post(
    f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items",
    params={"token": TOKEN},
    json={
        "queries": ["python", "go", "rust"],
        "maxResults": 500,
        "location": "Worldwide",
    },
    timeout=600,
)
df = pd.DataFrame(resp.json())
print(f"{len(df)} jobs across {df.company.nunique()} companies")
```

Three stack-keyword queries with a Worldwide location filter typically return 200-400 unique jobs.

### Step 3: How do I filter by salary and tags?

Salary is null for ~50% of listings (employer didn't publish). For salary-band analysis, filter to non-null rows. Tags are arrays — use `apply` with a lambda for tag-membership tests.

```python
SENIOR_PYTHON = df[
    df.salary_min.notna()
    & (df.salary_min >= 130000)
    & df.tags.apply(lambda t: isinstance(t, list)
                    and "senior" in t
                    and "python" in t)
].sort_values("salary_max", ascending=False)

print(SENIOR_PYTHON[["title", "company", "salary_min", "salary_max",
                     "location", "url"]].head(20))
```

Senior Python roles paying 130K+ USD with structured filtering completes in two lines once the dataset is loaded.

### Step 4: How do I run this as a daily aggregator with Slack alerts?

Schedule the actor daily on Apify's cron, dedupe on `url`, alert only on net-new jobs:

```python
import json, pathlib

snapshot = pathlib.Path("remoteok-snapshot.json")
prev = set(json.loads(snapshot.read_text())) if snapshot.exists() else set()
current = set(df.url.tolist())
new_urls = current - prev

for url in new_urls:
    job = df[df.url == url].iloc[0]
    requests.post(
        "https://hooks.slack.com/services/.../...",
        json={"text": f"*New remote*: {job['title']} at {job['company']} "
                       f"({int(job['salary_min'] or 0)}-{int(job['salary_max'] or 0)} USD)\n{url}"},
        timeout=10,
    )

snapshot.write_text(json.dumps(list(current)))
```

Wired to Apify's [scheduler](https://docs.apify.com/platform/schedules) at `0 9 * * *` (daily, 9 AM), this loop forwards only newly-posted jobs each morning.

## Sample output

A single record from the dataset for one RemoteOK job looks like this. Five rows weigh ~10 KB.

```json
{
  "title": "Senior Backend Engineer",
  "company": "GitLab",
  "salary_min": 120000,
  "salary_max": 180000,
  "tags": ["python", "go", "kubernetes", "senior"],
  "location": "Worldwide",
  "description": "We are looking for a Senior Backend Engineer to help scale our core API across multiple regions...",
  "posted_date": "2026-04-08",
  "url": "https://remoteok.com/remote-jobs/123456-senior-backend-engineer-gitlab"
}
```

`tags` is the highest-information field — RemoteOK's tag taxonomy is much cleaner than typical keyword extraction from titles. `salary_min`/`salary_max` are integers in USD when published; treat null as "salary not disclosed" rather than zero. `url` is the canonical natural key for deduping across snapshots; RemoteOK's URL is stable per posting.

## Common pitfalls

Three things go wrong in RemoteOK-based pipelines. **Salary nulls** — about half of listings have no published salary. Pipelines that compute averages without filtering null rows produce wildly low estimates; always require both salary fields to be non-null before aggregating. **Tag taxonomy drift** — RemoteOK occasionally renames or merges tags (e.g. `js` → `javascript`); for long-running tag-trend analysis, build a normalisation layer that maps old tags to current canonical names. **Posted-date staleness** — `posted_date` reflects when the job was first posted, not when the employer last touched it. A job marked posted 30 days ago may still be active and recruiting; do not implicitly assume old jobs are closed unless you check the URL is still 200-OK.

Thirdwatch's actor returns `salary_min` and `salary_max` as integer USD when published and null otherwise, with `tags` always as a list of strings. The pure-HTTP architecture means a 500-job pull completes in under a minute and costs $0.75 — small enough to run hourly without budget consideration. A fourth subtle issue worth flagging: RemoteOK lets employers boost or pin postings, so the same job may appear repeatedly at the top of the feed across multiple snapshots even though it was first posted weeks ago; rely on `posted_date` and the canonical `url` for true freshness rather than position in the feed. A fifth and last edge case: companies sometimes post the same role with two slightly different titles to catch broader keyword surface area, so dedupe on `(company, title-normalised, salary_min)` rather than title alone for the most accurate aggregator counts. The same pattern applies in reverse — a single posting may legitimately cover two roles ("Frontend or Backend Engineer") and you'll want to keep that as one row rather than splitting it.

## Related use cases

- [Track remote hiring trends by tech stack](/blog/track-remote-hiring-trends-by-tech-stack)
- [Build a remote jobs aggregator with Apify](/blog/build-remote-jobs-aggregator-with-apify)
- [Find remote engineering jobs by salary band](/blog/find-remote-engineering-jobs-by-salary-band)
- [The complete guide to scraping job boards](/blog/guide-scraping-job-boards)
- [All Thirdwatch use-case guides](/blog)

## Frequently asked questions

### How much does it cost to scrape RemoteOK?

Thirdwatch's RemoteOK Scraper charges $0.0015 per job on the FREE tier and drops to $0.00085 at GOLD volume. A 10-keyword sweep at 200 jobs per query — typical for a remote-jobs aggregator daily refresh — costs $3 per pull, with hourly cadence affordable at under $75 a month.

### Can I get jobs without specifying a keyword?

Not directly — `queries` is required and accepts at least one keyword. For broad coverage, pass a high-recall term like `engineer`, `developer`, or `marketing` as a single query and crank `maxResults` to 1000+. The actor scrapes RemoteOK's index filtered by that term and returns up to `maxResults` across all jobs matching.

### How is salary normalized in the dataset?

RemoteOK publishes salary in USD when the employer provides it. The actor returns `salary_min` and `salary_max` as integer USD values. Roughly 40-50% of RemoteOK listings include salary; the remainder leave both fields null. For salary-band analysis, filter to non-null rows before aggregating.

### What does the tags field contain?

RemoteOK's employer-set tags covering tech stack (`python`, `react`, `kubernetes`), seniority (`junior`, `senior`, `lead`), function (`backend`, `devops`, `design`), and location flexibility (`worldwide`, `usa`, `europe`). Each job has 3-8 tags. They're the highest-quality categorization signal in the dataset — much richer than typical keyword extraction from titles or descriptions alone.

### How does RemoteOK compare to Wellfound or LinkedIn for remote jobs?

RemoteOK is remote-only by design — every listing is genuinely remote. Wellfound has remote and on-site startup jobs mixed; LinkedIn has every category. For a pure remote-jobs feed, RemoteOK is the cleanest single source. For comprehensive remote coverage, combine RemoteOK with Wellfound's remote filter and LinkedIn Jobs filtered to remote — Thirdwatch publishes scrapers for all three.

### Can I run it on a schedule for a job aggregator?

Yes. Schedule the actor on Apify's cron with hourly or daily cadence, persist each run's dataset, and dedupe on `url` (RemoteOK's job URL is unique per posting). A multi-source remote aggregator typically runs RemoteOK hourly, Wellfound 6-hourly, and LinkedIn Jobs daily — the cadence matches each source's posting velocity.

Run the [RemoteOK Scraper on Apify Store](https://apify.com/thirdwatch/remoteok-jobs-scraper) — pay-per-job, free to try, no credit card to test.
