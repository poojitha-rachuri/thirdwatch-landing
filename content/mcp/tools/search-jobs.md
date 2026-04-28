---
title: "search_jobs"
description: "14-source cross-platform job search: LinkedIn, Indeed, Wellfound, Glassdoor, Adzuna, Reed, Monster, ZipRecruiter, SimplyHired, Naukri, RemoteOK, Cutshort, Google Jobs, Career Sites."
path: "mcp/tools/search-jobs/"
type: "mcp-tool"
toolName: "search_jobs"
cluster: "talent"
clusterLabel: "Talent"
costLabel: "18–26 credits"
actorsLabel: "linkedin-jobs, indeed-scraper, wellfound, glassdoor, adzuna, reed, monster, ziprecruiter, simplyhired, naukri, remoteok, cutshort, google-jobs, career-site-scraper"
keywords: "cross platform job search api, linkedin jobs api, indeed jobs api, naukri jobs api, multi source job search, claude job search mcp"
---

## search_jobs

The widest job search on the internet. One query, 14 sources in parallel, deduplicated by company + title + location. Returns job postings with salary, seniority, posted-date, apply URL.

### Inputs

| Param | Type | Required | Notes |
|---|---|---|---|
| `query` | string | yes | Free-text role/skills, e.g. "senior python engineer". |
| `location` | string | no | City, state, or country. "Bangalore", "NYC", "remote-EU". |
| `country` | string | no | ISO 3166-1 alpha-2 (`US`, `IN`, `UK`). Routes to country-specific sources. |
| `seniority` | string | no | `intern` / `entry` / `mid` / `senior` / `staff` / `principal` / `director`. |
| `remote_only` | bool | no | Filter to remote-only listings. |
| `salary_min` | int | no | Minimum base salary. Currency inferred from country. |
| `posted_within_days` | int | no | Restrict to recent listings. Default unrestricted. |
| `sources` | array | no | Subset of the 14 sources. Default: all relevant for `country`. |
| `max_results` | int | no | Default 50. Cap 200. |

### Output (sketch)

```json
{
  "query": "senior data engineer",
  "results": [
    {
      "title": "Senior Data Engineer",
      "company": "Stripe",
      "location": "San Francisco, CA",
      "salary_min": 215000,
      "salary_max": 280000,
      "currency": "USD",
      "remote": false,
      "seniority": "senior",
      "posted_at": "2026-04-22",
      "source": "linkedin",
      "apply_url": "...",
      "description_snippet": "..."
    }
  ],
  "total": 87,
  "by_source": {"linkedin": 24, "indeed": 18, "naukri": 0, "wellfound": 7, "...": 38},
  "credits_charged": 22
}
```

### Example prompts in Claude

- "Search jobs: senior backend engineer, San Francisco, base &gt;= $200K, posted last 14 days, exclude crypto. All 14 sources."
- "Find remote-only DevRel jobs in EU posted this week."
- "Show me staff-level ML engineers hiring in Bangalore on Naukri, Cutshort, LinkedIn, and Wellfound."

### Suggested next

- [`find_hiring`](/mcp/tools/find-hiring/) — flip the question: which companies are hiring this role?
- [`search_candidates`](/mcp/tools/search-candidates/) — go from job to candidate list.

### Underlying actors

LinkedIn Jobs, Indeed, Wellfound, Glassdoor, Adzuna, Reed, Monster, ZipRecruiter, SimplyHired, Naukri, RemoteOK, Cutshort, Google Jobs, Career Sites. All on Apify Store under [thirdwatch](https://apify.com/thirdwatch).
