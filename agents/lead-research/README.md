# AI by AO lead research agent

A Claude Managed Agent that runs every weekday at 07:15 UK time. It finds up to 8 new West Yorkshire small businesses that show evidenced signs they'd benefit from AI by AO's services, researches each one, and drafts personalised outreach for Oliver to review. It never contacts anyone itself.

| File | What it is |
|---|---|
| `agent.md` | The agent: model, tools (web search and fetch on) and its instructions |
| `environment.yaml` | The cloud sandbox it runs in |
| `memory_store-history.yaml` | Memory of every business already suggested, so nothing repeats |
| `deployment-weekday.yaml` | The weekday schedule, the $5 per run cost cap, and the quality checklist each report must pass |
| `scripts/leads.py` | Start a run now, or download the latest report |

Each run writes `leads-YYYY-MM-DD.md` (full report with email drafts) and `leads-YYYY-MM-DD.csv` (for a spreadsheet or CRM).

Sector rotation: Mon trades, Tue professional services, Wed health and beauty, Thu hospitality and retail, Fri print and decoration (DecoNetwork users) plus manufacturing.

## One time setup

1. Install the Anthropic CLI (`ant`, version 1.30 or later): https://github.com/anthropics/anthropic-cli/releases
2. Sign in: `ant auth login` (or set `ANTHROPIC_API_KEY` from https://platform.claude.com)
3. From the repo root, preview then create everything:

```sh
ant apply --dry-run -v agents/lead-research/agent.md agents/lead-research/environment.yaml agents/lead-research/memory_store-history.yaml
ant apply agents/lead-research/agent.md agents/lead-research/environment.yaml agents/lead-research/memory_store-history.yaml
```

4. Create the schedule and pause it straight away, so you can test before it runs on its own:

```sh
ant apply agents/lead-research/deployment-weekday.yaml &&
  DEPLOYMENT_ID=$(jq -r '.resources["./agents/lead-research/deployment-weekday.yaml"].id' claude-lock.json) &&
  ant beta:deployments pause --deployment-id "$DEPLOYMENT_ID"
```

5. Commit `claude-lock.json` (it holds the IDs so future `ant apply` runs update instead of duplicating).

## Test, then switch on

```sh
pip install "anthropic>=0.92.0"
python agents/lead-research/scripts/leads.py run     # start a test run now
python agents/lead-research/scripts/leads.py fetch   # 10 to 25 minutes later: saves the report to ./lead-reports/
```

You can also watch it work live from the link `fetch` prints. When a run looks right, switch on the weekday schedule:

```sh
ant beta:deployments unpause --deployment-id "$DEPLOYMENT_ID"
```

## Changing it

Edit `agent.md` (who to target, signals, email style) or `deployment-weekday.yaml` (time, budget, checklist) and run `ant apply` again with the same file paths. Running sessions keep the old version; the next run uses the new one.

## Cost

Each run is capped at $5 of list cost (model usage, web searches at $10 per 1,000, and $0.08 per hour of run time). Expect roughly $1 to $4 per run; check real figures in the Claude Console after the first few runs and adjust the cap in `deployment-weekday.yaml`.

## Rules it follows

Only public business contact details, no personal data hunting, sole traders and partnerships flagged for phone or contact form rather than cold email (UK PECR), an opt out line on every email draft, and no invented claims about AI by AO. Oliver reviews and sends everything himself.
