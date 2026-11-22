#!/usr/bin/env python3
"""The review scenarios of Monge CAD, run against the live MCP server: each scenario's tool calls, what came back, and
whether it is what the scenario expects. Writes results.json next to this file.

    python3 run_scenarios.py [https://dima-fomin.pl/mcp]"""
import hashlib, json, os, sys, time, urllib.request

URL = sys.argv[1] if len(sys.argv) > 1 else "https://dima-fomin.pl/mcp"
UA = "monge-review-scenarios/1.0"

def call(tool, args):
    body = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": tool, "arguments": args}}
    for attempt in range(3):
        req = urllib.request.Request(URL, data=json.dumps(body).encode(), headers={"content-type": "application/json", "accept": "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18", "user-agent": UA})
        try:
            return json.load(urllib.request.urlopen(req, timeout=60))["result"]
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and attempt < 2:
                time.sleep(30 if e.code == 429 else 3); continue
            raise

def sha_of(url):
    data = urllib.request.urlopen(urllib.request.Request(url, headers={"user-agent": UA}), timeout=120).read()
    return len(data), hashlib.sha256(data).hexdigest()

S = []
def scenario(sid, kind, prompt, steps, check):
    out = []
    for tool, args in steps:
        r = call(tool, args)
        out.append({"tool": tool, "arguments": args, "isError": bool(r.get("isError")), "structuredContent": r.get("structuredContent"), "text": None if r.get("structuredContent") else r["content"][0]["text"]})
    ok, note = check(out)
    S.append({"id": sid, "kind": kind, "prompt": prompt, "calls": out, "pass": ok, "observed": note})
    print(f"{'PASS' if ok else 'FAIL'} {sid}  {note}")

ids = lambda sc: [r["id"] for r in (sc or {}).get("results", [])]

# ── positive ──
def p1(o):
    sc, links = o[0]["structuredContent"], o[1]["structuredContent"]
    step = next(f for f in links["files"] if f["format"] == "step")
    n, h = sha_of(step["url"])
    ok = sc["match"] == "exact" and ids(sc) == ["bolt-iso-4017--m12-x-60--exact"] and n == step["bytes"] and h == step["sha256"]
    return ok, f"match {sc['match']}, {ids(sc)}; STEP {n} B, SHA-256 {h} {'= server' if h == step['sha256'] else '≠ server'}"
scenario("P1", "positive", "Find an ISO 4017 M12×60 hex bolt with a real thread and give me the STEP file.",
         [("search_models", {"standard": "ISO 4017", "size": "M12", "length": 60, "thread": "exact", "format": "step"}),
          ("get_download_links", {"id": "bolt-iso-4017--m12-x-60--exact", "formats": ["step"]})], p1)

def p2(o):
    sc, links = o[0]["structuredContent"], o[1]["structuredContent"]
    f = links["files"][0]; n, h = sha_of(f["url"])
    ok = ids(sc)[:1] == ["nut-iso-4032--m8--print"] and f["format"] == "3mf" and h == f["sha256"]
    return ok, f"{ids(sc)}; 3MF {n} B, SHA-256 {'matches' if h == f['sha256'] else 'DIFFERS'}"
scenario("P2", "positive", "I need an M8 nut to 3D print. Give me the 3MF and its checksum.",
         [("search_models", {"query": "M8 nut", "thread": "print", "format": "3mf"}),
          ("get_download_links", {"id": "nut-iso-4032--m8--print", "formats": ["3mf"]})], p2)

def p3(o):
    sc = o[0]["structuredContent"]; got = sorted(ids(sc))
    return sc["match"] == "exact" and all(i.startswith("bearing-iso-15--6204--") for i in got) and len(got) >= 3, f"{sc['match']}: {got}"
scenario("P3", "positive", "Which versions of the 6204 ball bearing are there? (open, shielded, sealed)",
         [("search_models", {"size": "6204", "category": "bearing-iso-15", "limit": 10})], p3)

def p4(o):
    sc, m = o[0]["structuredContent"], o[1]["structuredContent"]
    ok = "screw-iso-4762--m10-x-40--exact" in ids(sc) and m["dimensions"]["length_mm"] == 40 and m["dimensions"]["nominal_diameter_mm"] == 10 and "/pl/" in m["url"]
    return ok, f"{ids(sc)[:3]}; {m['name']}, d {m['dimensions']['nominal_diameter_mm']}, L {m['dimensions']['length_mm']}, P {m['dimensions'].get('thread_pitch_mm')}"
scenario("P4", "positive", "Znajdź śrubę z łbem walcowym ISO 4762 M10×40 z prawdziwym gwintem i pokaż jej wymiary.",
         [("search_models", {"query": "śruba z łbem walcowym ISO 4762 M10x40", "thread": "exact", "locale": "pl"}),
          ("get_model", {"id": "screw-iso-4762--m10-x-40--exact", "locale": "pl"})], p4)

def p5(o):
    sc = o[0]["structuredContent"]; got = ids(sc)
    return sc["match"] == "exact" and got and all(i.startswith("rebar-en-10080--d16-") for i in got), f"{sc['match']} total {sc['total']}: {got}"
scenario("P5", "positive", "Какие варианты арматуры Ø16 по EN 10080 есть в библиотеке?",
         [("search_models", {"query": "арматура Ø16 EN 10080", "locale": "ru", "limit": 10})], p5)

# ── negative ──
def n1(o):
    sc = o[0]["structuredContent"]
    near = [(x["id"], x["differs"]) for x in sc.get("nearest", [])][:3]
    return sc["match"] == "not_found" and sc["results"] == [] and all(d for _, d in near), f"{sc['match']}, results {sc['results']}, nearest {near}"
scenario("N1", "negative", "Give me an ISO 4017 M12×61 bolt with a real thread.  (61 mm is not a length of the standard)",
         [("search_models", {"standard": "ISO 4017", "size": "M12", "length": 61, "thread": "exact"})], n1)

def n2(o):
    sc = o[0]["structuredContent"]
    near = [(x["id"], x["differs"]) for x in sc.get("nearest", [])][:2]
    return sc["match"] == "not_found" and sc["results"] == [], f"{sc['match']}, results {sc['results']}, nearest {near}"
scenario("N2", "negative", "I need an ISO 4762 socket head cap screw M48×100.  (the library's ISO 4762 screws end at M36)",
         [("search_models", {"standard": "ISO 4762", "size": "M48", "length": 100})], n2)

def n3(o):
    r = o[0]
    return r["isError"] and "files" not in (r["structuredContent"] or {}), f"isError {r['isError']}: {r['text']}"
scenario("N3", "negative", "Download links for model bolt-iso-4017--m12-x-61--exact.  (an id that does not exist — e.g. one an assistant made up)",
         [("get_download_links", {"id": "bolt-iso-4017--m12-x-61--exact"})], n3)

json.dump({"server": URL, "run": time.strftime("%Y-%m-%d %H:%M:%S %Z"), "scenarios": S}, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.json"), "w"), ensure_ascii=False, indent=2)
print(f"\n{sum(s['pass'] for s in S)} of {len(S)} passed")
sys.exit(0 if all(s["pass"] for s in S) else 1)
