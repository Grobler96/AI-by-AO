"""Deterministic SEO and safety audit for the AI by AO static site.

Usage (from the repo root):
    python3 agents/seo/scripts/check_site.py            # human readable report
    python3 agents/seo/scripts/check_site.py --json     # machine readable

Exit code 1 if any ERROR is found. Standard library only.
"""
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[3]
SITE = "https://www.aibyao.com"
NOINDEX_OK = {"404.html", "thank-you.html"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
# Technical names shown on purpose (the cookie name on the privacy page).
ALLOWED_DASH_WORDS = {"aiao-consent"}
SKIP_TEXT = {"script", "style", "noscript", "svg", "code", "pre", "template"}


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lang = None
        self.title = ""
        self.metas = {}
        self.links = []
        self.canonical = None
        self.headings = []
        self.hrefs = []
        self.imgs = []
        self.jsonld = []
        self.text = []
        self._stack = []
        self._in_title = False
        self._script_type = None
        self._buf = []
        self._heading = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html":
            self.lang = a.get("lang")
        elif tag == "title":
            self._in_title = True
        elif tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.metas[key.lower()] = a.get("content", "")
        elif tag == "link":
            if (a.get("rel") or "").lower() == "canonical":
                self.canonical = a.get("href")
            self.links.append(a)
        elif tag == "a" and a.get("href"):
            self.hrefs.append(a["href"])
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "script":
            self._script_type = (a.get("type") or "").lower()
            self._buf = []
        if re.fullmatch(r"h[1-6]", tag):
            self._heading = [tag, []]
        if tag not in VOID:
            self._stack.append(tag)

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if tag == "script" and self._script_type == "application/ld+json":
            self.jsonld.append("".join(self._buf))
        if tag == "script":
            self._script_type = None
        if self._heading and tag == self._heading[0]:
            self.headings.append((tag, " ".join("".join(self._heading[1]).split())))
            self._heading = None
        if tag in self._stack:
            while self._stack and self._stack.pop() != tag:
                pass

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._script_type is not None:
            self._buf.append(data)
            return
        if self._heading:
            self._heading[1].append(data)
        if not any(t in SKIP_TEXT for t in self._stack) and "head" not in self._stack:
            self.text.append(data)


def local_target(href):
    """Map an internal href to a file in the repo, or None if external."""
    href = href.split("#")[0].split("?")[0]
    if href.startswith(SITE):
        href = href[len(SITE):] or "/"
    if not href.startswith("/") or href.startswith("//"):
        return None
    if href == "/":
        return ROOT / "index.html"
    p = ROOT / href.lstrip("/")
    if p.suffix:
        return p
    return p.with_suffix(".html")


def main():
    as_json = "--json" in sys.argv
    issues = []

    def add(level, page, msg):
        issues.append({"level": level, "page": page, "issue": msg})

    pages = sorted(p for p in ROOT.glob("*.html"))
    sitemap_urls = set()
    try:
        tree = ET.parse(ROOT / "sitemap.xml")
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for loc in tree.getroot().findall("s:url/s:loc", ns):
            sitemap_urls.add(loc.text.strip())
    except Exception as e:  # noqa: BLE001
        add("ERROR", "sitemap.xml", f"does not parse: {e}")

    robots = (ROOT / "robots.txt").read_text() if (ROOT / "robots.txt").exists() else ""
    if f"Sitemap: {SITE}/sitemap.xml" not in robots:
        add("ERROR", "robots.txt", "missing Sitemap line")

    titles, descs, inbound = {}, {}, {p.name: 0 for p in pages}
    summary = []
    for path in pages:
        name = path.name
        pg = Page()
        pg.feed(path.read_text(encoding="utf-8"))
        robots_meta = pg.metas.get("robots", "")
        indexable = "noindex" not in robots_meta
        url = SITE + ("/" if name == "index.html" else "/" + path.stem)
        title = " ".join(pg.title.split())
        desc = pg.metas.get("description", "")
        summary.append({"page": name, "title": title, "title_len": len(title), "desc_len": len(desc),
                        "h1": [h for t, h in pg.headings if t == "h1"], "indexable": indexable})

        if pg.lang != "en-GB":
            add("WARN", name, f'html lang is "{pg.lang}", expected "en-GB"')
        if not title:
            add("ERROR", name, "missing <title>")
        elif not 25 <= len(title) <= 65:
            add("WARN", name, f"title is {len(title)} characters (aim for 30 to 60)")
        if indexable:
            titles.setdefault(title, []).append(name)
            descs.setdefault(desc, []).append(name)
            if not desc:
                add("ERROR", name, "missing meta description")
            elif not 70 <= len(desc) <= 165:
                add("WARN", name, f"meta description is {len(desc)} characters (aim for 120 to 160)")
            if pg.canonical != url:
                add("ERROR", name, f"canonical is {pg.canonical!r}, expected {url!r}")
            if url not in sitemap_urls:
                add("WARN", name, "indexable page missing from sitemap.xml")
            for key in ("og:title", "og:description", "og:image", "og:url", "twitter:card"):
                if key not in pg.metas:
                    add("WARN", name, f"missing {key}")
        elif name not in NOINDEX_OK:
            add("WARN", name, "page is noindex")
        if "viewport" not in pg.metas:
            add("ERROR", name, "missing viewport meta")

        h1s = [h for t, h in pg.headings if t == "h1"]
        if len(h1s) != 1:
            add("WARN", name, f"has {len(h1s)} h1 headings (expected 1)")
        last = 0
        for tag, _ in pg.headings:
            level = int(tag[1])
            if last and level > last + 1:
                add("INFO", name, f"heading level jumps from h{last} to h{level}")
                break
            last = level

        for img in pg.imgs:
            if "alt" not in img:
                add("ERROR", name, f"img without alt: {img.get('src')}")
            for dim in ("width", "height"):
                if dim not in img:
                    add("INFO", name, f"img missing {dim} (layout shift risk): {img.get('src')}")
                    break

        for raw in pg.jsonld:
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as e:
                add("ERROR", name, f"JSON-LD does not parse: {e}")
                continue
            items = data.get("@graph", [data]) if isinstance(data, dict) else data
            for item in items:
                if isinstance(item, dict) and "@type" not in item:
                    add("WARN", name, "JSON-LD item without @type")
        if indexable and not pg.jsonld:
            add("WARN", name, "no structured data")

        for href in pg.hrefs:
            target = local_target(href)
            if target is None:
                continue
            if not target.exists():
                add("ERROR", name, f"broken internal link: {href}")
            elif target.name in inbound and target.name != name:
                inbound[target.name] += 1

        text = " ".join(" ".join(pg.text).split())
        for m in re.finditer(r"\S*[—–]\S*|\b\w+-\w+\b", text):
            word = m.group(0)
            if re.fullmatch(r"[\d\-/:.]+", word) or word in ALLOWED_DASH_WORDS:
                continue
            add("ERROR", name, f'dash in visible copy: "{word}"')

    for title, names in titles.items():
        if len(names) > 1:
            add("ERROR", ", ".join(names), f'duplicate title "{title}"')
    for desc, names in descs.items():
        if desc and len(names) > 1:
            add("ERROR", ", ".join(names), "duplicate meta description")
    for name, count in inbound.items():
        if count == 0 and name not in NOINDEX_OK | {"index.html"}:
            add("WARN", name, "orphan page: no internal links point to it")

    if as_json:
        print(json.dumps({"pages": summary, "issues": issues}, indent=2))
    else:
        for s in summary:
            print(f"{s['page']:32} title {s['title_len']:>3}  desc {s['desc_len']:>3}  h1 {len(s['h1'])}  {'' if s['indexable'] else 'noindex'}")
        print()
        order = {"ERROR": 0, "WARN": 1, "INFO": 2}
        for i in sorted(issues, key=lambda i: (order[i["level"]], i["page"])):
            print(f"{i['level']:5} {i['page']}: {i['issue']}")
        counts = {k: sum(1 for i in issues if i["level"] == k) for k in order}
        print(f"\n{counts['ERROR']} errors, {counts['WARN']} warnings, {counts['INFO']} info")
    sys.exit(1 if any(i["level"] == "ERROR" for i in issues) else 0)


if __name__ == "__main__":
    main()
