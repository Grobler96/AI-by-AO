"""AI by AO SEO agent helper.

Usage (from the repo root, after `ant apply` has created the agent):
    python agents/seo/scripts/seo.py run     # start a run now (works even while paused)
    python agents/seo/scripts/seo.py fetch   # download the latest report into ./seo-reports/

Needs: pip install "anthropic>=0.92.0" and Anthropic credentials (ANTHROPIC_API_KEY or `ant auth login`).
"""
import json
import pathlib
import sys

import anthropic

ROOT = pathlib.Path(__file__).resolve().parents[3]
DEPLOYMENT_KEY = "./agents/seo/deployment-weekly.yaml"


def deployment_id() -> str:
    lock = json.loads((ROOT / "claude-lock.json").read_text())
    return lock["resources"][DEPLOYMENT_KEY]["id"]


def run(client: anthropic.Anthropic) -> None:
    client.beta.deployments.run(deployment_id())
    print("Run started. It usually takes 20 to 45 minutes. The pull request appears on GitHub; to save the report locally run: seo.py fetch")


def fetch(client: anthropic.Anthropic) -> None:
    runs = [r for r in client.beta.deployment_runs.list(deployment_id=deployment_id()) if r.session_id]
    if not runs:
        print("No successful runs yet.")
        return
    latest = max(runs, key=lambda r: r.created_at)
    session = client.beta.sessions.retrieve(latest.session_id)
    print(f"Latest run: {latest.created_at}  session {session.id}  status {session.status}")
    print(f"Watch or review it: https://platform.claude.com/workspaces/default/sessions/{session.id}")
    files = client.beta.files.list(scope_id=session.id, betas=["managed-agents-2026-04-01"])
    out = ROOT / "seo-reports"
    out.mkdir(exist_ok=True)
    count = 0
    for f in files.data:
        client.beta.files.download(f.id).write_to_file(str(out / f.filename))
        print("Saved", out / f.filename)
        count += 1
    if not count:
        print("No report files yet. If the run is still going, try again in a few minutes.")


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "fetch"
    client = anthropic.Anthropic()
    {"run": run, "fetch": fetch}.get(command, lambda c: print(__doc__))(client)
