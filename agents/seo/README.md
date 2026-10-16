# AI by AO SEO agent

A Claude Managed Agent that runs every Monday at 06:10 UK time. It audits www.aibyao.com the way Google and AI answer engines see it, picks up to 6 evidenced, white hat improvements, tests them, and opens a pull request for Oliver to review. Vercel builds a private preview of the pull request; nothing reaches the live site until Oliver merges it.

It never pushes to `main`, never merges, and only gets the five GitHub tools it needs to open a pull request (read files, list pull requests, create a branch, push to that branch, open the pull request).

| File | What it is |
|---|---|
| `agent.md` | The agent: model, tools and its full SEO playbook |
| `environment.yaml` | The cloud sandbox it runs in |
| `memory_store-seo-log.yaml` | Memory of every change it has made and why, so it never repeats or undoes work |
| `vault.yaml` | Secure container for the GitHub token (the token is never stored in this repo) |
| `deployment-weekly.yaml` | The Monday schedule, the $15 per run cost cap, and the checklist each run must pass |
| `scripts/check_site.py` | The site audit it runs before and after every change (you can run it too) |
| `scripts/seo.py` | Start a run now, or download the latest report |

## What it covers

- **Crawling and indexing:** robots.txt, sitemap and lastmod, canonicals, redirects, real 404s, broken links, orphan pages, click depth.
- **Core Web Vitals:** Google PageSpeed Insights (LCP, INP, CLS, plus real user data when Google has it), image sizes and formats, lazy loading, preconnect, font loading, script loading.
- **On page:** titles, meta descriptions, headings, search intent and topic coverage compared with the pages ranking in the UK, alt text, internal links.
- **Structured data:** Organization / ProfessionalService, WebSite, Service, BreadcrumbList and FAQPage, all linked as one entity and checked against Google's rules.
- **AI search (GEO):** clear answer first content that ChatGPT, Perplexity and Google AI Overviews can quote, consistent entity details, an `llms.txt` file, AI crawlers allowed.
- **Local SEO:** Leeds and West Yorkshire pages kept genuinely useful (not doorway pages), consistent business details, local competitor research.
- **Social sharing:** Open Graph and Twitter cards.
- **Accessibility overlaps:** link text, labels, contrast.
- **Off site:** a short list of directories, listings and link opportunities for you to act on. It never does outreach itself.

Every Monday you get a pull request titled "SEO weekly: ..." with a plain English report: what changed and why, what to check in the preview, health check numbers, next opportunities, and anything that needs you.

## One time setup

1. **Protect `main` on GitHub** (belt and braces, so nothing can reach the live site without a pull request): repo Settings, Rules, Rulesets, New branch ruleset. Target the default branch, tick "Restrict deletions", "Block force pushes" and "Require a pull request before merging" (0 approvals is fine, you merge your own PRs), leave the bypass list empty, and set it to Active.

2. **Create a GitHub token for this repo only:** GitHub Settings, Developer settings, Fine grained tokens, Generate new token.
   - Repository access: Only select repositories, `Grobler96/AI-by-AO`
   - Permissions: Contents **Read and write**, Pull requests **Read and write** (Metadata read is added automatically)
   - Expiry: up to a year; set a reminder to renew it

3. **Install the Anthropic CLI** (`ant`, version 1.34 or later) and sign in, as for the lead agent: https://github.com/anthropics/anthropic-cli/releases then `ant auth login`.

4. **Create the agent** from the repo root (preview first):

```sh
ant apply --dry-run -v agents/seo/agent.md agents/seo/environment.yaml agents/seo/memory_store-seo-log.yaml agents/seo/vault.yaml
ant apply agents/seo/agent.md agents/seo/environment.yaml agents/seo/memory_store-seo-log.yaml agents/seo/vault.yaml
```

5. **Store the GitHub token in the vault.** Paste it at the silent prompt, so it never lands in your shell history:

```sh
read -rs CMA_GITHUB_TOKEN && export CMA_GITHUB_TOKEN
VAULT_ID=$(jq -r '.resources["./agents/seo/vault.yaml"].id' claude-lock.json)
jq -n '{display_name: "GitHub MCP (AI by AO repo only)", auth: {type: "static_bearer", mcp_server_url: "https://api.githubcopilot.com/mcp/", token: (env.CMA_GITHUB_TOKEN // error("CMA_GITHUB_TOKEN is not set"))}}' |
  ant beta:vaults:credentials create --vault-id "$VAULT_ID"
unset CMA_GITHUB_TOKEN
echo "$VAULT_ID"
```

   Put the printed `vlt_...` ID into `vault_ids` in `deployment-weekly.yaml`.

6. **Create the schedule and pause it straight away**, so you can test first:

```sh
ant apply agents/seo/deployment-weekly.yaml &&
  DEPLOYMENT_ID=$(jq -r '.resources["./agents/seo/deployment-weekly.yaml"].id' claude-lock.json) &&
  ant beta:deployments pause --deployment-id "$DEPLOYMENT_ID"
```

7. Commit `claude-lock.json` and the `vault_ids` change.

## Test, then switch on

```sh
pip install "anthropic>=0.92.0"
python agents/seo/scripts/seo.py run     # start a test run now
python agents/seo/scripts/seo.py fetch   # 20 to 45 minutes later: saves the report to ./seo-reports/
```

Then open the pull request on GitHub, click the Vercel preview link in it, and check the changed pages on your phone and laptop. Merge if you're happy, close it if not (the agent reads its log and won't open a second one while one is still open). When the first run looks right:

```sh
ant beta:deployments unpause --deployment-id "$DEPLOYMENT_ID"
```

## Run the audit yourself

```sh
python3 agents/seo/scripts/check_site.py
```

Lists every page's title and description length and any errors (broken links, missing tags, duplicate titles, invalid structured data, dashes in visible copy) and warnings.

## Changing it

Edit `agent.md` (what it checks, house style, limits) or `deployment-weekly.yaml` (day, time, budget, checklist) and run `ant apply` again with the same file paths.

## Cost

Each run is capped at $15 of list cost (model usage, web searches at $10 per 1,000, and $0.08 per hour of run time). Expect roughly $4 to $12 a week; check real figures in the Claude Console after the first few runs and lower the cap if there's room.

## Coming next (stage 2)

Google Search Console data (which searches you appear for, clicks, positions and pages Google has not indexed), so the agent can target pages that already get impressions and measure whether each change worked. That needs a Google Cloud service account added to your Search Console property.
