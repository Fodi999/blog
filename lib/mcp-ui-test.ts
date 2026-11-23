/* A diagnostic MCP App: the smallest possible view (no Three.js, no network) that reports, stage by stage, what the host
   did — the HTML is shown, the script runs, ui/initialize is answered, the tool result arrives, window.openai exists.
   Exposed only outside production (test and preview addresses), to find why a host does not show the 3D viewer. */

export const UI_TEST_URI = 'ui://monge/ui-test-v1.html';
const MIME = 'text/html;profile=mcp-app';

const HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monge CAD UI test</title>
<style>
body{margin:0;padding:16px;font:14px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;background:#16181c;color:#eef0f3}
h1{margin:0 0 10px;font-size:22px;color:#d4aa4e}
li{margin:3px 0;font-family:ui-monospace,Menlo,monospace;font-size:12.5px}
.ok{color:#7dd87d}.no{color:#ff9b7a}.wait{color:#9aa1ab}
</style></head>
<body>
<h1>Monge CAD UI works</h1>
<p>The host shows this HTML resource (${UI_TEST_URI}).</p>
<ul id="s">
<li class="no" id="js">JavaScript: not running</li>
<li class="wait" id="init">ui/initialize: —</li>
<li class="wait" id="input">ui/notifications/tool-input: —</li>
<li class="wait" id="result">ui/notifications/tool-result: —</li>
<li class="wait" id="oa">window.openai: —</li>
</ul>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var set = function (id, cls, text) { var e = $(id); e.className = cls; e.textContent = text; };
  set('js', 'ok', 'JavaScript: running');
  var id = 1, inFrame = window.parent !== window;
  var post = function (m) { if (inFrame) window.parent.postMessage(m, '*'); };
  var size = function () { post({ jsonrpc: '2.0', method: 'ui/notifications/size-changed', params: { width: Math.ceil(window.innerWidth), height: Math.ceil(document.documentElement.scrollHeight) } }); };
  window.addEventListener('message', function (ev) {
    if (ev.source !== window.parent) return;
    var m = ev.data; if (!m || m.jsonrpc !== '2.0') return;
    if (m.id === 1 && m.method === undefined) {
      if (m.error) set('init', 'no', 'ui/initialize: error ' + (m.error.message || ''));
      else {
        var h = (m.result && m.result.hostInfo) || {};
        set('init', 'ok', 'ui/initialize: answered by ' + (h.name || '?') + ' ' + (h.version || '') + ' (protocol ' + ((m.result && m.result.protocolVersion) || '?') + ')');
        post({ jsonrpc: '2.0', method: 'ui/notifications/initialized', params: {} });
      }
      size(); return;
    }
    if (m.method === 'ui/notifications/tool-input') set('input', 'ok', 'tool-input: ' + JSON.stringify((m.params && m.params.arguments) || {}));
    if (m.method === 'ui/notifications/tool-result') { var sc = m.params && m.params.structuredContent; set('result', 'ok', 'tool-result: ' + (sc ? JSON.stringify(sc) : 'no structuredContent')); }
    if (m.id != null && m.method === 'ui/resource-teardown') post({ jsonrpc: '2.0', id: m.id, result: {} });
    size();
  });
  set('init', 'wait', inFrame ? 'ui/initialize: sent, waiting…' : 'ui/initialize: not in a frame');
  post({ jsonrpc: '2.0', id: id, method: 'ui/initialize', params: { protocolVersion: '2026-01-26', appInfo: { name: 'monge-ui-test', version: '1' }, appCapabilities: {} } });
  setTimeout(function () { if ($('init').className === 'wait') set('init', 'no', 'ui/initialize: no answer in 5 s'); size(); }, 5000);
  var oa = function () {
    if (window.openai) set('oa', 'ok', 'window.openai: present' + (window.openai.toolOutput ? ', toolOutput ' + JSON.stringify(window.openai.toolOutput) : ''));
    else set('oa', 'wait', 'window.openai: absent');
  };
  oa(); window.addEventListener('openai:set_globals', oa); setTimeout(oa, 1500);
  size();
})();
</script>
</body></html>`;

export const UI_TEST_RESOURCE = {
  uri: UI_TEST_URI,
  name: 'monge_ui_test',
  title: 'Monge CAD UI test',
  description: 'Diagnostic view: shows which steps of MCP Apps rendering the host performed.',
  mimeType: MIME,
  _meta: { ui: { prefersBorder: true } },
};

export function readUiTest(domain?: string) {
  return { contents: [{ uri: UI_TEST_URI, mimeType: MIME, text: HTML, _meta: { ui: { prefersBorder: true, ...(domain ? { domain } : {}) }, 'openai/widgetPrefersBorder': true } }] };
}

export const UI_TEST_TOOL = {
  name: 'monge_ui_test',
  title: 'Monge CAD UI test',
  description: 'Diagnostic: shows a tiny test panel "Monge CAD UI works" in the chat (MCP Apps). Use only when asked to test whether the client shows Monge UI panels.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  outputSchema: { type: 'object', properties: { message: { type: 'string' }, at: { type: 'string' } }, required: ['message'] },
  annotations: { title: 'Monge CAD UI test', readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  _meta: {
    ui: { resourceUri: UI_TEST_URI, visibility: ['model', 'app'] },
    'openai/outputTemplate': UI_TEST_URI,
    'openai/toolInvocation/invoking': 'Opening the UI test…',
    'openai/toolInvocation/invoked': 'UI test ready',
  },
};

export function runUiTest() {
  const out = { message: 'Monge CAD UI works', at: new Date().toISOString() };
  return {
    content: [{ type: 'text' as const, text: 'Monge CAD UI test: the tool ran. A client that supports MCP Apps shows a panel titled "Monge CAD UI works" with the steps it performed; a client without them shows only this text.' }],
    structuredContent: out,
  };
}

/** The diagnostic tool and view exist only off production (lib/hosts.ts). */
export { isProductionHost } from '@/lib/hosts';
