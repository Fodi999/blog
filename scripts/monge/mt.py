#!/usr/bin/env python3
"""Tiny client for the Monge TEST instance (port 9899). Usage: mt.py TOOL [json-params | @file.rhai]"""
import json, os, socket, sys
PORT = 9899
TOKEN = open(os.path.expanduser(f"~/.monge/test_home/.monge/mcp_token.{PORT}")).read().strip()
def call(tool, params=None, timeout=900):
    msg = json.dumps({"tool": tool, "params": params or {}, "token": TOKEN, "client": "claude-rocket"}) + "\n"
    with socket.create_connection(("127.0.0.1", PORT), timeout=10) as s:
        s.settimeout(timeout); s.sendall(msg.encode()); buf = b""
        while not buf.endswith(b"\n"):
            c = s.recv(65536)
            if not c: break
            buf += c
    return json.loads(buf.decode())
if __name__ == "__main__":
    tool = sys.argv[1]
    arg = sys.argv[2] if len(sys.argv) > 2 else None
    if arg and arg.startswith("@"):
        params = {"code": open(arg[1:]).read()}
    elif arg:
        params = json.loads(arg)
    else:
        params = {}
    r = call(tool, params)
    print(json.dumps(r, ensure_ascii=False, indent=1)[:12000])
