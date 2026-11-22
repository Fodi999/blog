#!/usr/bin/env python3
"""Monge MCP — protocol and tool checks against a running site.

    python3 scripts/test/mcp_check.py [https://dima-fomin.pl]

Both eras of MCP (initialize-based 2024-11-05 … 2025-11-25 and stateless 2026-07-28), the HTTP rules (Origin, methods,
content type, batches, body size, header mirroring), the three tools, and the STEP of ISO 4017 M12x60 with a real
thread downloaded and its SHA-256 computed here. Retries a request once on 503 (Cloudflare's CPU limit)."""

import base64
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request

SITE = (sys.argv[1] if len(sys.argv) > 1 else "https://dima-fomin.pl").rstrip("/")
URL = SITE + "/mcp"
UA = "monge-mcp-test/1.0"
MODERN = "2026-07-28"
WANT = "bolt-iso-4017--m12-x-60--exact"

passed = failed = 0


def check(name, cond, info=""):
    global passed, failed
    if cond:
        passed += 1
        print(f"ok   {name}")
    else:
        failed += 1
        print(f"FAIL {name}  {info}")


def http(method="POST", body=None, headers=None, raw=None):
    h = {"user-agent": UA, "content-type": "application/json", "accept": "application/json, text/event-stream"}
    h.update(headers or {})
    h = {k: v for k, v in h.items() if v is not None}
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    for attempt in range(3):
        req = urllib.request.Request(URL, data=data, method=method, headers=h)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                status, hdrs, text = r.status, dict(r.headers), r.read().decode()
        except urllib.error.HTTPError as e:
            status, hdrs, text = e.code, dict(e.headers), e.read().decode()
        if status == 503 and attempt < 2:
            time.sleep(2)
            continue
        if status == 429 and attempt < 2 and not (headers or {}).get("x-expect-429"):
            # the server's own limit (about 60 a minute): wait as it says, like a well-behaved client
            time.sleep(int(hdrs.get("Retry-After") or hdrs.get("retry-after") or 60) + 1)
            continue
        break
    try:
        js = json.loads(text) if text else None
    except ValueError:
        js = None
    return status, {k.lower(): v for k, v in hdrs.items()}, js


def legacy(method, params=None, version="2025-06-18", rid=1):
    hdr = {"mcp-protocol-version": version} if method != "initialize" else {}
    return http(body={"jsonrpc": "2.0", "id": rid, "method": method, "params": params or {}}, headers=hdr)


def modern(method, params=None, name=None, headers=None, rid=7):
    p = dict(params or {})
    p["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": MODERN,
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {"name": "monge-mcp-test", "version": "1.0"},
    }
    h = {"mcp-protocol-version": MODERN, "mcp-method": method}
    if name is not None:
        h["mcp-name"] = name
    h.update(headers or {})
    return http(body={"jsonrpc": "2.0", "id": rid, "method": method, "params": p}, headers=h)


def call(tool, args, version="2025-06-18"):
    s, _, js = legacy("tools/call", {"name": tool, "arguments": args}, version)
    return s, (js or {}).get("result") or {}, js


# ── legacy era ──
for v in ["2024-11-05", "2025-03-26", "2025-06-18", "2025-11-25"]:
    s, h, js = legacy("initialize", {"protocolVersion": v, "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
    r = (js or {}).get("result", {})
    check(f"initialize {v}", s == 200 and r.get("protocolVersion") == v and r.get("serverInfo", {}).get("name") == "monge-mcp" and "tools" in r.get("capabilities", {}) and "mcp-session-id" not in h, (s, js))
s, _, js = legacy("initialize", {"protocolVersion": "2099-01-01", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
check("initialize unknown version → our latest legacy", s == 200 and js["result"]["protocolVersion"] == "2025-11-25", js)
s, _, _ = http(body={"jsonrpc": "2.0", "method": "notifications/initialized"}, headers={"mcp-protocol-version": "2025-06-18"})
check("notification → 202", s == 202, s)
s, _, js = legacy("ping")
check("ping", s == 200 and js.get("result") == {}, js)
s, _, js = legacy("tools/list")
tools = {t["name"]: t for t in (js or {}).get("result", {}).get("tools", [])}
PROD = re.match(r"^https://(dima-fomin\.pl|blog\.fodi85999\.workers\.dev)", SITE) is not None
check("tools/list: four tools (+ the UI test off production)", list(tools) == ["search_models", "get_model", "get_download_links", "render_model_viewer"] + ([] if PROD else ["monge_ui_test"]), list(tools))
check("tools read-only", all(t["annotations"]["readOnlyHint"] and not t["annotations"]["destructiveHint"] for t in tools.values()))
check("tools have outputSchema", all(t.get("outputSchema", {}).get("type") == "object" for t in tools.values()))
s, _, js = legacy("prompts/list")
check("unknown method → -32601", js and js.get("error", {}).get("code") == -32601, js)
s, _, js = legacy("tools/list", version="1999-01-01")
check("unsupported MCP-Protocol-Version header → 400", s == 400, (s, js))

# ── the tools ──
s, r, js = call("search_models", {"standard": "ISO 4017", "size": "M12", "length": 60, "thread": "exact", "format": "step"})
sc = r.get("structuredContent", {})
check("search ISO 4017 M12x60 exact → exact, one result", sc.get("match") == "exact" and [x["id"] for x in sc.get("results", [])] == [WANT], json.dumps(sc)[:300])
first = (sc.get("results") or [{}])[0]
check("search result carries the STEP as file", first.get("file", {}).get("format") == "step" and len(first.get("file", {}).get("sha256", "")) == 64, first.get("file"))
check("text content mirrors structured", r.get("content") and r["content"][0]["type"] == "text" and WANT in r["content"][0]["text"])

s, r, _ = call("search_models", {"query": "ISO 4017 M12x60 real thread STEP"})
check("search by words → same model", [x["id"] for x in r.get("structuredContent", {}).get("results", [])][:1] == [WANT], r.get("structuredContent", {}).get("results", [{}])[:1])
s, r, _ = call("search_models", {"query": "болт М12х60 настоящая резьба", "locale": "ru"})
res = r.get("structuredContent", {}).get("results", [])
check("search in Russian", res and res[0]["id"] == WANT and "/ru/" in res[0]["url"], res[:1])
s, r, _ = call("search_models", {"query": "śruba M12x60 ISO 4017", "thread": "exact", "locale": "pl"})
res = r.get("structuredContent", {}).get("results", [])
check("search in Polish", res and res[0]["id"] == WANT and "/pl/" in res[0]["url"], res[:1])

s, r, _ = call("search_models", {"standard": "ISO 4017", "size": "M12", "length": 61, "thread": "exact"})
sc = r.get("structuredContent", {})
check("M12x61 → not_found, results empty", sc.get("match") == "not_found" and sc.get("results") == [] and sc.get("total") == 0, json.dumps(sc)[:300])
check("not_found lists nearest with differs", sc.get("nearest") and all(x.get("differs") for x in sc["nearest"]), sc.get("nearest", [])[:1])
check("not_found says nothing substituted", any("substituted" in n for n in sc.get("notes", [])))
s, r, _ = call("search_models", {"standard": "ISO 4017", "size": "M12", "length": 25, "thread": "exact"})
ids = [x["id"] for x in r.get("structuredContent", {}).get("results", [])]
check("standard filter: ISO 4017 M12x25 → only the bolt, not the bolted joint", ids == ["bolt-iso-4017--m12-x-25--exact"], ids)
s, r, _ = call("search_models", {"standard": "ISO 4032", "size": "M12"})
fams = {x["id"].split("--")[0] for x in r.get("structuredContent", {}).get("results", [])}
check("standard filter: ISO 4032 → nuts only", fams == {"nut-iso-4032"}, fams)
s, r, _ = call("search_models", {"category": "bolt-joint-iso-4017", "size": "M12"})
fams = {x["id"].split("--")[0] for x in r.get("structuredContent", {}).get("results", [])}
check("bolted joint by category", fams == {"bolt-joint-iso-4017"}, fams)
s, r, _ = call("search_models", {"query": "hello"})
check("words naming no part → browse", r.get("structuredContent", {}).get("match") == "browse", r)

s, r, _ = call("search_models", {"size": "M12", "colour": "red"})
check("unknown argument → tool error", r.get("isError") is True, r)
s, r, _ = call("search_models", {"thread": "fine"})
check("bad enum → tool error", r.get("isError") is True, r)
s, r, _ = call("search_models", {"limit": 500, "size": "M12"})
check("limit over 20 → tool error", r.get("isError") is True, r)
s, _, js = legacy("tools/call", {"name": "delete_everything", "arguments": {}})
check("unknown tool → -32602", js and js.get("error", {}).get("code") == -32602, js)

s, r, _ = call("get_model", {"id": WANT})
sc = r.get("structuredContent", {})
check("get_model: dimensions, thread, verification, image, glb", sc.get("dimensions", {}).get("length_mm") == 60 and sc.get("thread", {}).get("type") == "exact" and sc.get("verification", {}).get("geometry", {}).get("kernel_body_report") is True and sc.get("image", {}).get("url", "").endswith(".webp") and sc.get("glb", "").endswith(".glb"), json.dumps(sc)[:400])
check("get_model: other options listed", any(o["id"].endswith("--cosmetic") for o in sc.get("other_options", [])), sc.get("other_options"))
s, r, _ = call("get_model", {"id": "bolt-iso-4017--m12-x-61--exact"})
check("get_model unknown id → tool error with the size's options", r.get("isError") is True, r)
s, r, _ = call("get_model", {"id": "../../models/x"})
check("get_model malformed id → tool error", r.get("isError") is True, r)

s, r, _ = call("get_download_links", {"id": WANT})
sc = r.get("structuredContent", {})
files = {f["format"]: f for f in sc.get("files", [])}
check("links: STEP STL 3MF GLB with bytes and sha256", set(files) == {"step", "stl", "3mf", "glb"} and all(f["bytes"] > 0 and len(f.get("sha256", "")) == 64 for f in files.values()), list(files))
check("links: only free library files", all(re.match(r"^https://[^/]+/api/files/downloads/", f["url"]) for f in files.values()), [f["url"] for f in files.values()])
s, r, _ = call("get_download_links", {"id": WANT, "formats": ["step"]})
check("links: formats filter", [f["format"] for f in r.get("structuredContent", {}).get("files", [])] == ["step"], r.get("structuredContent"))

step = files.get("step")
if step:
    req = urllib.request.Request(step["url"], headers={"user-agent": UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
        digest = resp.headers.get("repr-digest", "")
    sha = hashlib.sha256(data).hexdigest()
    check("STEP downloaded: size matches", len(data) == step["bytes"], (len(data), step["bytes"]))
    check("STEP downloaded: SHA-256 matches", sha == step["sha256"], (sha, step["sha256"]))
    check("STEP is ISO 10303-21", data[:13] == b"ISO-10303-21;", data[:20])
    check("Repr-Digest matches", digest == "sha-256=:" + base64.b64encode(bytes.fromhex(sha)).decode() + ":", digest)
    print(f"     STEP {len(data)} B sha256 {sha}")

# ── MCP Apps: the 3D viewer ──
vt = tools.get("render_model_viewer", {})
VIEWER = vt.get("_meta", {}).get("ui", {}).get("resourceUri", "")
check("viewer URI is versioned ui://", VIEWER.startswith("ui://monge/model-viewer") and VIEWER.endswith(".html"), VIEWER)
check("viewer tool: _meta.ui.resourceUri + visibility + openai/outputTemplate", vt.get("_meta", {}).get("ui", {}).get("resourceUri") == VIEWER and "model" in vt["_meta"]["ui"].get("visibility", []) and vt["_meta"].get("openai/outputTemplate") == VIEWER, vt.get("_meta"))
check("viewer tool read-only", vt.get("annotations", {}).get("readOnlyHint") is True)
s, _, js = legacy("initialize", {"protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": {"name": "t", "version": "1"}})
check("initialize advertises resources and the ui extension", "resources" in js["result"]["capabilities"] and "io.modelcontextprotocol/ui" in js["result"]["capabilities"].get("extensions", {}), js["result"]["capabilities"])
s, _, js = legacy("resources/list")
res = (js or {}).get("result", {}).get("resources", [])
check("resources/list: the viewer (+ the UI test off production), text/html;profile=mcp-app", [r["uri"] for r in res] == [VIEWER] + ([] if PROD else ["ui://monge/ui-test-v1.html"]) and all(r["mimeType"] == "text/html;profile=mcp-app" for r in res), res)
s, _, js = legacy("resources/read", {"uri": VIEWER})
c = ((js or {}).get("result", {}).get("contents") or [{}])[0]
csp = c.get("_meta", {}).get("ui", {}).get("csp", {})
check("resources/read: html, mime, csp only dima-fomin.pl", c.get("mimeType") == "text/html;profile=mcp-app" and c.get("text", "").startswith("<!doctype html>") and "ui/initialize" in c.get("text", "") and csp == {"connectDomains": ["https://dima-fomin.pl"], "resourceDomains": ["https://dima-fomin.pl"]}, (c.get("mimeType"), csp, len(c.get("text", ""))))
check("viewer html loads no external script", "<script src" not in c.get("text", "").lower())
s, _, js = legacy("resources/read", {"uri": "ui://other"})
check("resources/read unknown uri → error", js and "error" in js, js)
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60", "compare_with": ["nut-iso-4032--m12--exact"], "layout": "side_by_side"})
ms = r.get("structuredContent", {}).get("models", [])
check("viewer: size id → the real-thread option; nut added", [m["id"] for m in ms] == ["bolt-iso-4017--m12-x-60--exact", "nut-iso-4032--m12--exact"] and r["structuredContent"]["layout"] == "side_by_side", [m.get("id") for m in ms])
b = ms[0] if ms else {}
check("viewer: GLB of that option, standard, pitch, thread type", b.get("glb", {}).get("url", "").endswith("/exact/bolt-iso-4017-m12-x-60-exact.glb") and b.get("standard", {}).get("id") == "ISO 4017" and b.get("thread", {}).get("pitch_mm") == 1.75 and b.get("thread", {}).get("type") == "exact", b.get("glb"))
check("viewer: image is this option's (exact)", b.get("image", {}).get("option") == "exact" and b["image"]["shows_this_option"] is True and b["image"]["note"] is None, b.get("image"))
check("viewer: STEP STL 3MF GLB links", sorted(f["format"] for f in b.get("files", [])) == ["3mf", "glb", "step", "stl"])
check("viewer: text fallback has the site 3D view, WebP and files", "?option=exact" in r["content"][0]["text"] and ".webp" in r["content"][0]["text"] and ".step" in r["content"][0]["text"])
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60--cosmetic"})
im = r.get("structuredContent", {}).get("models", [{}])[0].get("image", {})
check("viewer: cosmetic → picture marked as the default option", im.get("shows_this_option") is False and "default option" in (im.get("note") or ""), im)
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-61--exact"})
check("viewer: unknown id → tool error, no models", r.get("isError") is True and "structuredContent" not in r, r)
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60", "compare_with": ["a", "b", "c", "d"]})
check("viewer: more than four models → tool error", r.get("isError") is True, r)
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60", "compare_with": ["washer-iso-7089--m12--std", "nut-iso-4032--m12--exact"], "grip_mm": 22})
sc = r.get("structuredContent", {}); asm = sc.get("assembly") or {}
check("grip 22 mm → M12 × 40 (need 37.05 mm), 4.7 mm out, assembly", asm.get("fits") is True and asm.get("bolt_length_mm") == 40 and asm.get("protrusion_mm") == 4.7 and sc.get("layout") == "assembly" and sc["models"][0]["id"] == "bolt-iso-4017--m12-x-40--exact", (asm, [m["id"] for m in sc.get("models", [])]))
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60", "compare_with": ["nut-iso-4032--m12--exact"], "grip_mm": 200})
sc = r.get("structuredContent", {}); asm = sc.get("assembly") or {}
check("grip 200 mm → no length, no substitution", asm.get("fits") is False and "longest" in (asm.get("note") or "") and sc["models"][0]["id"] == "bolt-iso-4017--m12-x-60--exact", asm)
s, r, _ = call("render_model_viewer", {"id": "bearing-iso-15--6204", "compare_with": ["nut-iso-4032--m12--exact"], "grip_mm": 10})
check("grip on a set that is not a bolt + washer/nut → tool error", r.get("isError") is True, r)
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60", "section": True})
check("section: true → view.section", r.get("structuredContent", {}).get("view", {}).get("section") is True, r.get("structuredContent", {}).get("view"))
s, r, _ = call("render_model_viewer", {"id": "bolt-iso-4017--m12-x-60", "grip_mm": -3})
check("grip_mm ≤ 0 → tool error", r.get("isError") is True, r)
for u in (b.get("glb", {}).get("url"), b.get("image", {}).get("url")):
    if not u: continue
    req = urllib.request.Request(u, method="HEAD", headers={"user-agent": UA, "origin": "null"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        check(f"CORS for the sandbox: {u.rsplit('.', 1)[-1]}", resp.headers.get("access-control-allow-origin") == "*" and resp.headers.get("content-type") in ("model/gltf-binary", "image/webp"), (resp.headers.get("access-control-allow-origin"), resp.headers.get("content-type")))

# ── modern era (2026-07-28) ──
s, _, js = modern("server/discover")
r = (js or {}).get("result", {})
check("server/discover", s == 200 and r.get("supportedVersions") == [MODERN] and r.get("resultType") == "complete" and r.get("_meta", {}).get("io.modelcontextprotocol/serverInfo", {}).get("name") == "monge-mcp", js)
s, _, js = modern("tools/list")
r = (js or {}).get("result", {})
check("modern tools/list: ttlMs, cacheScope, resultType", len(r.get("tools", [])) == (4 if PROD else 5) and r.get("ttlMs", 0) > 0 and r.get("cacheScope") == "public" and r.get("resultType") == "complete", js)
s, _, js = modern("tools/call", {"name": "search_models", "arguments": {"query": "ISO 4017 M12x60 real thread"}}, name="search_models")
check("modern tools/call", s == 200 and js["result"]["structuredContent"]["results"][0]["id"] == WANT and js["result"]["resultType"] == "complete", js)
s, _, js = modern("tools/call", {"name": "search_models", "arguments": {"size": "M12"}}, name="=?base64?" + base64.b64encode(b"search_models").decode() + "?=")
check("modern Mcp-Name in base64 accepted", s == 200 and "result" in js, js)
s, _, js = modern("tools/call", {"name": "search_models", "arguments": {"size": "M12"}}, name="get_model")
check("Mcp-Name mismatch → 400 -32020", s == 400 and js["error"]["code"] == -32020, (s, js))
s, _, js = modern("tools/call", {"name": "search_models", "arguments": {"size": "M12"}})
check("Mcp-Name missing → 400 -32020", s == 400 and js["error"]["code"] == -32020, (s, js))
s, _, js = modern("tools/list", headers={"mcp-method": "tools/call"})
check("Mcp-Method mismatch → 400 -32020", s == 400 and js["error"]["code"] == -32020, (s, js))
s, _, js = modern("tools/list", headers={"mcp-protocol-version": "2025-06-18"})
check("protocol header ≠ _meta → 400 -32020", s == 400 and js["error"]["code"] == -32020, (s, js))
p = {"_meta": {"io.modelcontextprotocol/protocolVersion": "2030-01-01", "io.modelcontextprotocol/clientCapabilities": {}}}
s, _, js = http(body={"jsonrpc": "2.0", "id": 3, "method": "tools/list", "params": p}, headers={"mcp-protocol-version": "2030-01-01", "mcp-method": "tools/list"})
check("unsupported modern version → 400 -32022 with supported", s == 400 and js["error"]["code"] == -32022 and js["error"]["data"]["supported"] == [MODERN], (s, js))
s, _, js = modern("prompts/list")
check("modern unknown method → 404 -32601", s == 404 and js["error"]["code"] == -32601, (s, js))

# ── HTTP rules ──
s, h, _ = http("GET", headers={"content-type": None})
check("GET → 405", s == 405 and "POST" in h.get("allow", ""), s)
s, _, _ = http("DELETE", headers={"content-type": None})
check("DELETE → 405", s == 405, s)
s, _, js = legacy("tools/list") if False else http(body={"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, headers={"origin": "https://evil.example"})
check("foreign Origin → 403", s == 403, (s, js))
s, h, _ = http(body={"jsonrpc": "2.0", "id": 1, "method": "ping"}, headers={"origin": "http://localhost:6274"})
check("localhost Origin (Inspector) → allowed with CORS", s == 200 and h.get("access-control-allow-origin") == "http://localhost:6274", (s, h.get("access-control-allow-origin")))
s, h, _ = http("OPTIONS", headers={"origin": "http://localhost:6274", "access-control-request-method": "POST", "content-type": None})
check("preflight from localhost", s == 204 and "mcp-protocol-version" in h.get("access-control-allow-headers", ""), (s, h))
s, _, _ = http(raw=b'{"jsonrpc":"2.0","id":1,"method":"ping"}', headers={"content-type": "text/plain"})
check("wrong Content-Type → 415", s == 415, s)
s, _, js = http(raw=b"{not json")
check("parse error → 400 -32700", s == 400 and js["error"]["code"] == -32700, (s, js))
s, _, js = http(body=[{"jsonrpc": "2.0", "id": 1, "method": "ping"}])
check("batch → 400", s == 400, (s, js))
s, _, js = http(raw=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "ping", "pad": "x" * 70000}).encode())
check("body over 64 KB → 413", s == 413, s)
s, _, js = http(body={"jsonrpc": "1.0", "id": 1, "method": "ping"})
check("jsonrpc ≠ 2.0 → 400 -32600", s == 400 and js["error"]["code"] == -32600, (s, js))

print(f"\n{passed} of {passed + failed} passed")
sys.exit(1 if failed else 0)
