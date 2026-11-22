/* Monge model viewer — an MCP App (SEP-1865) view.
   Talks to the host over postMessage JSON-RPC (ui/initialize → ui/notifications/initialized → tool-input / tool-result),
   renders the models' own GLB files with Three.js, and shows their data from the tool result. No SDK, no network
   except the GLB and WebP files on dima-fomin.pl (declared in the resource's CSP). Built by scripts/build-mcp-viewer.mjs.
   Layout: a short header, a large stage (side by side / assembled), a bar with the selected part's key facts, «more»,
   one download with a format choice. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const T = {
  en: {
    loading: 'Loading the 3D model…', no3d: 'This window cannot show 3D (WebGL is off or the file could not load). The data are of the selected model; the picture shows the option named on it. Open the model in 3D on the Monge site.',
    glbFail: 'The 3D file could not be loaded here.', waiting: 'Waiting for the model…', cancelled: 'Cancelled.', standalone: 'Open this view from an MCP host (e.g. Claude) — it shows the models a tool call returns.',
    side: 'Side by side', assembly: 'Assembly', joint: 'Joint', fasteners: 'Fasteners', reset: 'Reset view', full: 'Full screen', exitFull: 'Exit full screen', info: 'Details',
    more: 'More', less: 'Less', download: 'Download', pitchWord: 'pitch', std: 'Standard', size: 'Size', pitch: 'Thread pitch', thread: 'Thread', length: 'Length', overall: 'Overall', mass: 'Mass ≈', checks: 'Kernel check', ok: 'passed',
    open: 'Open in Monge', license: 'Licence', imgDefault: (o) => `The picture is of this size's default option (${o}); the 3D shows the selected one.`,
    grip: 'Grip', explode: 'Explode', cut: 'Section', out: 'out of the nut', fitting: 'Picking the length…', unit: 'mm', g: 'g', kg: 'kg', imgFamily: 'The picture shows a representative size of the family.', picture: 'Picture', family: 'a size of the family', D: 'Outside Ø', B: 'Width', gripFact: 'Grip',
  },
  ru: {
    loading: 'Загружаю 3D-модель…', no3d: 'Здесь нельзя показать 3D (WebGL выключен или файл не загрузился). Данные — выбранной модели; на картинке — исполнение, указанное на ней. Откройте модель в 3D на сайте Monge.',
    glbFail: 'Не удалось загрузить 3D-файл здесь.', waiting: 'Жду модель…', cancelled: 'Отменено.', standalone: 'Откройте этот просмотр из MCP-клиента (например, Claude) — он показывает модели из ответа инструмента.',
    side: 'Рядом', assembly: 'Сборка', joint: 'Соединение', fasteners: 'Крепёж', reset: 'Сбросить вид', full: 'Во весь экран', exitFull: 'Выйти из полноэкранного режима', info: 'Характеристики',
    more: 'Подробнее', less: 'Скрыть', download: 'Скачать', pitchWord: 'шаг', std: 'Стандарт', size: 'Размер', pitch: 'Шаг резьбы', thread: 'Резьба', length: 'Длина', overall: 'Габарит', mass: 'Масса ≈', checks: 'Проверка ядром', ok: 'пройдена',
    open: 'Открыть в Monge', license: 'Лицензия', imgDefault: (o) => `Картинка — исполнение этого размера по умолчанию (${o}); в 3D — выбранное.`,
    grip: 'Пакет', explode: 'Разнести', cut: 'Сечение', out: 'выступ', fitting: 'Подбираю длину…', unit: 'мм', g: 'г', kg: 'кг', imgFamily: 'Картинка — типовой размер семейства.', picture: 'На картинке', family: 'типовой размер семейства', D: 'Наружный Ø', B: 'Ширина', gripFact: 'Пакет',
  },
  pl: {
    loading: 'Wczytuję model 3D…', no3d: 'Tu nie da się pokazać 3D (WebGL wyłączony albo plik się nie wczytał). Dane dotyczą wybranego modelu; obraz pokazuje opcję podaną na nim. Otwórz model w 3D na stronie Monge.',
    glbFail: 'Nie udało się wczytać pliku 3D.', waiting: 'Czekam na model…', cancelled: 'Anulowano.', standalone: 'Otwórz ten podgląd z klienta MCP (np. Claude) — pokazuje modele z odpowiedzi narzędzia.',
    side: 'Obok siebie', assembly: 'Złożenie', joint: 'Połączenie', fasteners: 'Łączniki', reset: 'Resetuj widok', full: 'Pełny ekran', exitFull: 'Zamknij pełny ekran', info: 'Dane',
    more: 'Więcej', less: 'Mniej', download: 'Pobierz', pitchWord: 'skok', std: 'Norma', size: 'Rozmiar', pitch: 'Skok gwintu', thread: 'Gwint', length: 'Długość', overall: 'Wymiary', mass: 'Masa ≈', checks: 'Kontrola jądra', ok: 'zaliczona',
    open: 'Otwórz w Monge', license: 'Licencja', imgDefault: (o) => `Obraz to domyślna opcja tego rozmiaru (${o}); 3D pokazuje wybraną.`,
    grip: 'Pakiet', explode: 'Rozsuń', cut: 'Przekrój', out: 'wystaje', fitting: 'Dobieram długość…', unit: 'mm', g: 'g', kg: 'kg', imgFamily: 'Obraz pokazuje typowy rozmiar rodziny.', picture: 'Na obrazie', family: 'typowy rozmiar rodziny', D: 'Ø zewn.', B: 'Szerokość', gripFact: 'Grubość pakietu',
  },
};

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

const S = { locale: 'en', models: [], active: 0, layout: 'side', wantLayout: null, optionOf: {}, caps: {}, ctx: {}, mode: 'inline', webgl: true, userMoved: false, format: 'step', section: false, cut: 0, explode: 0, assembly: null };
let L = T.en;

// ── MCP Apps bridge ─────────────────────────────────────────────────────────────────────────────────────────────
const inFrame = window.parent !== window;
let nextId = 1;
const pending = new Map();
const post = (msg) => inFrame && window.parent.postMessage(msg, '*');
function request(method, params, ms = 10000) {
  const id = nextId++;
  post({ jsonrpc: '2.0', id, method, params });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { pending.delete(id); reject(new Error(`${method}: no answer`)); }, ms);
    pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
  });
}
const notify = (method, params) => post({ jsonrpc: '2.0', method, params });

window.addEventListener('message', (ev) => {
  if (ev.source !== window.parent) return;
  const m = ev.data;
  if (!m || m.jsonrpc !== '2.0') return;
  if (m.method === undefined && m.id != null) {
    const p = pending.get(m.id);
    if (p) { pending.delete(m.id); m.error ? p.reject(new Error(m.error.message || 'error')) : p.resolve(m.result); }
    return;
  }
  switch (m.method) {
    case 'ui/notifications/tool-input': onInput(m.params); break;
    case 'ui/notifications/tool-result': onResult(m.params); break;
    case 'ui/notifications/tool-cancelled': status(L.cancelled); break;
    case 'ui/notifications/host-context-changed': applyContext(m.params || {}); break;
    case 'ui/resource-teardown': stop(); if (m.id != null) post({ jsonrpc: '2.0', id: m.id, result: {} }); break;
    case 'ping': if (m.id != null) post({ jsonrpc: '2.0', id: m.id, result: {} }); break;
  }
});

function applyContext(ctx) {
  Object.assign(S.ctx, ctx);
  if (ctx.theme) document.documentElement.dataset.theme = ctx.theme;
  const vars = ctx.styles?.variables;
  if (vars) for (const [k, v] of Object.entries(vars)) if (v) document.documentElement.style.setProperty(k, v);
  if (ctx.displayMode) setMode(ctx.displayMode);
  if (!S.models.length && ctx.locale) setLocale(ctx.locale.slice(0, 2));
}

function setLocale(l) {
  S.locale = T[l] ? l : 'en';
  L = T[S.locale];
  document.documentElement.lang = S.locale;
  $('reset').title = L.reset;
  $('full').title = S.mode === 'fullscreen' ? L.exitFull : L.full;
  $('info').title = L.info;
  $('moreLabel').textContent = $('details').hidden ? L.more : L.less;
  $('downloadLabel').textContent = L.download;
  $('site').textContent = `${L.open} ↗`;
  $('license').textContent = L.license;
  $('gripLabel').textContent = L.grip;
  $('gripUnit').textContent = L.unit;
  $('explodeLabel').textContent = L.explode;
  $('cutLabel').textContent = L.cut;
  $('section').title = L.cut;
}

async function start() {
  setLocale((navigator.language || 'en').slice(0, 2));
  status(L.waiting);
  if (!inFrame) { status(L.standalone); return; }
  try {
    const r = await request('ui/initialize', {
      protocolVersion: '2026-01-26',
      appInfo: { name: 'monge-model-viewer', version: '1.0.0' },
      appCapabilities: { availableDisplayModes: ['inline', 'fullscreen'] },
    });
    S.caps = r?.hostCapabilities || {};
    applyContext(r?.hostContext || {});
    notify('ui/notifications/initialized', {});
  } catch {
    // a host that renders the view without the MCP Apps handshake (e.g. an older ChatGPT bridge) — see legacy below
  }
  legacyOpenAI();
  watchSize();
}

/* ChatGPT's own bridge (window.openai) carries the same tool output; used only when the MCP Apps notifications do not come. */
function legacyOpenAI() {
  const read = () => {
    const out = window.openai?.toolOutput;
    if (out?.models && !S.models.length) { if (out.layout) S.wantLayout = out.layout; setModels(out.models, out.locale); }
    if (window.openai?.theme) document.documentElement.dataset.theme = window.openai.theme;
  };
  read();
  window.addEventListener('openai:set_globals', read);
}

/* Auto-size as the MCP Apps SDK does: observe <html> and <body>, measure the content with height: max-content (a plain
   measure is clamped to the iframe's viewport and never grows), width = the window's. */
let lastSize = '';
let sizeTimer = 0;
function measureAndSend() {
  if (S.mode === 'fullscreen') return;
  const html = document.documentElement;
  const was = html.style.height;
  html.style.height = 'max-content';
  const height = Math.ceil(html.getBoundingClientRect().height);
  html.style.height = was;
  const width = Math.ceil(window.innerWidth);
  // a hidden frame measures 0 — never tell the host that (it would keep the view at zero height)
  if (width < 40 || height < 40) return;
  const key = `${width}x${height}`;
  if (key !== lastSize) { lastSize = key; notify('ui/notifications/size-changed', { width, height }); }
}
/* Measured at once (a ResizeObserver callback runs after layout; getBoundingClientRect lays out otherwise) and once
   more shortly after — never through requestAnimationFrame alone, which a host may hold back while the frame is off
   screen, leaving the view stuck at its first height. */
function sendSize() {
  measureAndSend();
  clearTimeout(sizeTimer);
  sizeTimer = setTimeout(measureAndSend, 120);
}
function watchSize() {
  const ro = new ResizeObserver(sendSize);
  ro.observe(document.documentElement);
  ro.observe(document.body);
  // the frame's own width changing (a host that lays the view out late) also arrives as a window resize
  window.addEventListener('resize', sendSize);
  // and, since not every host delivers either to a nested frame, a once-a-second check (sends only on a change)
  setInterval(measureAndSend, 1000);
  sendSize();
}

function onInput(params) {
  const loc = params?.arguments?.locale;
  if (loc && !S.models.length) setLocale(loc);
  status(L.loading);
}

function onResult(res) {
  const sc = res?.structuredContent;
  if (sc?.layout) S.wantLayout = sc.layout;
  if (sc?.assembly !== undefined) S.assembly = sc.assembly;
  if (sc?.view?.section) S.section = true;
  if (res?.isError || !sc?.models?.length) {
    const msg = res?.content?.find?.((c) => c.type === 'text')?.text || 'No model.';
    status(msg);
    return;
  }
  setModels(sc.models, sc.locale);
}

async function openLink(url) {
  if (S.caps.openLinks) {
    try { await request('ui/open-link', { url }); return; } catch { /* fall through */ }
  }
  if (window.openai?.openExternal) { window.openai.openExternal({ href: url }); return; }
  window.open(url, '_blank', 'noopener');
}

// ── 3D ──────────────────────────────────────────────────────────────────────────────────────────────────────────
let renderer, scene, camera, controls, root, home, raf = 0;
/* The section: one plane through the parts' axes (all parts stand on z = 0), keeping z ≤ c. Off — pushed far away.
   The cut faces show as the parts' back faces in a flat colour, so the thread's profile reads as a solid section. */
const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e6);
const capMat = new THREE.MeshBasicMaterial({ color: 0xb08d4e, side: THREE.BackSide, clippingPlanes: [clip] });
const loaded = new Map(); // glb url → Promise<Object3D>

function initGL() {
  try {
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('no webgl');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    S.webgl = false;
    return false;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  $('stage').prepend(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');

  scene = new THREE.Scene();
  // the studio light of the Monge site: a top softbox, two side strips, a dark floor — baked into an environment map
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x4a525e);
  const panel = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  panel(14, 7, 0xffffff, 4.0, [0, 6, 1]);
  panel(2.5, 8, 0xffffff, 3.0, [-6, 1, 2]);
  panel(2.5, 8, 0xffe9c4, 2.2, [6, 1, -2]);
  panel(16, 16, 0x0e1218, 1.0, [0, -5, 0]);
  scene.environment = pmrem.fromScene(studio, 0.02).texture;

  camera = new THREE.PerspectiveCamera(30, 1, 0.0001, 100);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.addEventListener('start', () => { S.userMoved = true; });
  // a click on a part (not a drag) makes it the selected one: its facts below, its files to download
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
    const r = renderer.domElement.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    const hit = ray.intersectObjects(root.children, true)[0];
    let o = hit?.object;
    while (o && o.userData.model == null) o = o.parent;
    if (o) select(o.userData.model);
  });
  root = new THREE.Group();
  scene.add(root);

  new ResizeObserver(resize).observe($('stage'));
  resize();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    placeLabels();
  };
  loop();
  return true;
}

function resize() {
  if (!renderer) return;
  const r = $('stage').getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height);
  camera.updateProjectionMatrix();
  if (root?.children.length && (needFrame || !S.userMoved)) frame();
}

const steel = () => new THREE.MeshPhysicalMaterial({ color: 0xd2d6db, metalness: 1, roughness: 0.24, clearcoat: 0.3, clearcoatRoughness: 0.25, clippingPlanes: [clip] });
const KIND = {
  rubber: () => new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, metalness: 0, roughness: 0.85, clippingPlanes: [clip] }),
  plastic: () => new THREE.MeshPhysicalMaterial({ color: 0x121418, metalness: 0, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4, clippingPlanes: [clip] }),
};

function loadGlb(url) {
  if (!loaded.has(url)) {
    loaded.set(url, new GLTFLoader().loadAsync(url).then((g) => {
      const mat = steel();
      g.scene.traverse((o) => {
        if (!o.isMesh) return;
        const kind = String(o.material?.name ?? '');
        o.material = KIND[kind] ? KIND[kind]() : mat;
      });
      return g.scene;
    }).catch((e) => { loaded.delete(url); throw e; }));
  }
  return loaded.get(url);
}

const glbOf = (m) => {
  const o = m.options?.find((x) => x.option === S.optionOf[m.id]);
  return o?.glb || m.glb?.url || null;
};

/* What can be put together exactly: one bolt or cap screw with washers and nuts of the same nominal size. Every part's
   GLB has its axis along Y and its centre on it; a bolt's bearing face is y = 0 (shank down to −L), a washer and a nut
   lie from y = 0 up to their thickness. The washer goes on the shank, the nut under it, two thread pitches standing out. */
const FASTENER = /^(bolt-iso-4017|screw-iso-4762)$/;
function assemblyPlan() {
  const ms = S.models;
  const bolts = ms.filter((m) => FASTENER.test(m.family_id));
  const rest = ms.filter((m) => !FASTENER.test(m.family_id));
  if (bolts.length !== 1 || !rest.length) return null;
  const d = bolts[0].dimensions?.nominal_diameter_mm;
  const ok = rest.every((m) => /^(washer-iso-7089|nut-iso-4032)$/.test(m.family_id) && m.dimensions?.nominal_diameter_mm === d);
  return ok && bolts[0].dimensions?.length_mm ? { bolt: bolts[0], washers: rest.filter((m) => m.family_id.startsWith('washer')), nuts: rest.filter((m) => m.family_id.startsWith('nut')) } : null;
}

let labels = [];
async function show() {
  const assembled = S.layout === 'assembly' && assemblyPlan();
  const list = S.models;
  status(L.loading);
  if (!S.webgl) return fallback();
  let objs;
  try {
    objs = await Promise.all(list.map((m) => { const u = glbOf(m); return u ? loadGlb(u) : Promise.reject(new Error('no glb')); }));
  } catch {
    return fallback(L.glbFail);
  }
  root.clear();
  S.userMoved = false;
  labels.forEach((l) => l.el.remove());
  labels = [];
  const boxes = objs.map((o) => new THREE.Box3().setFromObject(o));
  const put = (i, x, y, k = 0) => {
    const holder = new THREE.Group();
    const inst = objs[i].clone(true);
    const meshes = [];
    inst.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const o of meshes) { const cap = new THREE.Mesh(o.geometry, capMat); cap.renderOrder = 1; o.add(cap); }
    holder.add(inst);
    holder.position.set(x, y, 0);
    holder.userData = { model: i, baseY: y, k };
    root.add(holder);
    return holder;
  };
  if (assembled) {
    // along the bolt's axis, in the GLBs' own millimetre-true coordinates
    const plan = assembled;
    const bi = list.indexOf(plan.bolt);
    const P = plan.bolt.dimensions.thread_pitch_mm / 1000;
    const Lb = plan.bolt.dimensions.length_mm / 1000;
    const th = (m) => boxes[list.indexOf(m)].max.y - boxes[list.indexOf(m)].min.y;
    const stack = [...plan.washers, ...plan.nuts];
    const fitted = S.assembly?.fits ? S.assembly.grip_mm / 1000 : null;
    const clamp = fitted ?? Math.max(0, Lb - stack.reduce((a, m) => a + th(m), 0) - 2 * P);
    S.clampMm = Math.round(clamp * 10000) / 10;
    put(bi, 0, 0, -1);
    let y = -clamp;
    stack.forEach((m, k) => { y -= th(m); put(list.indexOf(m), 0, y - boxes[list.indexOf(m)].min.y, k + 1); });
    S.spread = Lb;
  } else {
    // side by side at true scale: every part on the floor, a gap of half the widest
    const widest = Math.max(...boxes.map((b) => b.getSize(new THREE.Vector3()).x));
    let x = 0;
    objs.forEach((o, i) => {
      const b = boxes[i];
      const w = b.getSize(new THREE.Vector3()).x;
      const c = b.getCenter(new THREE.Vector3());
      const h = put(i, x + w / 2 - c.x, -b.min.y);
      h.children[0].position.z = -c.z;
      x += w + widest * 0.5;
      if (list.length > 1) {
        const lab = el('div', 'label3d', list[i].role || list[i].tag);
        $('stage').appendChild(lab);
        labels.push({ el: lab, at: new THREE.Vector3(x - w / 2 - widest * 0.5, 0, 0), model: i });
      }
    });
    const shift = -(x - widest * 0.5) / 2;
    root.position.x = shift;
    labels.forEach((l) => (l.at.x += shift));
  }
  if (assembled) root.position.x = 0;
  markActive();
  renderControls();
  applyExplode(false);
  frame();
  applyCut();
  $('poster').classList.add('hidden');
  status('');
}

/* Explode the assembly along its axis: the bolt up, the washers and nuts down, each a little further. */
function applyExplode(reframe = true) {
  const t = S.layout === 'assembly' ? S.explode : 0;
  for (const h of root.children) {
    const k = h.userData.k ?? 0;
    h.position.y = h.userData.baseY + (k < 0 ? 0.45 : -0.35 * k) * (S.spread || 0) * t;
  }
  for (const l of labels) if (l.model === -1 && l.base == null) l.base = l.at.y;
  for (const l of labels) if (l.model === -1) l.at.y = l.base - 0.25 * (root.children.length - 1) * (S.spread || 0) * t;
  if (reframe && !S.userMoved) frame();
}

function applyCut() {
  if (!S.section || !root?.children.length) { clip.constant = 1e6; return; }
  const box = new THREE.Box3().setFromObject(root);
  const zr = Math.max(Math.abs(box.min.z), Math.abs(box.max.z)) * 0.98;
  clip.constant = S.cut * zr;
}

const canCall = () => !!(S.caps.serverTools || window.openai?.callTool);
async function callTool(name, args) {
  if (S.caps.serverTools) return request('tools/call', { name, arguments: args }, 20000);
  if (window.openai?.callTool) return window.openai.callTool(name, args);
  throw new Error('no tool calls from this view');
}

/* «Grip»: the server picks the bolt length (the shortest of the series with a pitch out of the nut) and sends the set back. */
let gripTimer = 0;
async function fitGrip(v) {
  const plan = assemblyPlan();
  if (!plan || !(v > 0)) return;
  $('fit').className = 'fit';
  $('fit').textContent = L.fitting;
  try {
    const others = S.models.filter((m) => m !== plan.bolt).map((m) => m.id);
    const r = await callTool('render_model_viewer', { id: plan.bolt.id, compare_with: others, layout: 'assembly', grip_mm: v, locale: S.locale });
    const sc = r?.structuredContent;
    if (!sc?.models) throw new Error('no models');
    S.assembly = sc.assembly ?? null;
    S.wantLayout = 'assembly';
    setModels(sc.models, sc.locale);
    const a = S.assembly;
    if (a?.fits) {
      const b = sc.models.find((m) => /^(bolt|screw)-/.test(m.family_id));
      request('ui/update-model-context', { content: [{ type: 'text', text: `In the Monge viewer the user set a grip of ${a.grip_mm} mm: ${b.id} (length ${a.bolt_length_mm} mm, ${a.protrusion_mm} mm out of the nut).` }] }).catch(() => {});
    }
  } catch (e) {
    $('fit').className = 'fit bad';
    $('fit').textContent = String(e.message || e);
  }
}

function renderControls() {
  const asm = S.layout === 'assembly' && !!assemblyPlan();
  $('explodeRow').hidden = !asm;
  $('explode').value = String(S.explode);
  $('gripRow').hidden = !(asm && canCall());
  const g = $('grip');
  if (document.activeElement !== g) g.value = String(S.assembly?.grip_mm ?? S.clampMm ?? '');
  const a = S.assembly;
  const fit = $('fit');
  if (a && !a.fits) { fit.className = 'fit bad'; fit.textContent = a.note || ''; }
  else if (a?.fits) {
    const b = S.models.find((m) => /^(bolt|screw)-/.test(m.family_id));
    fit.className = 'fit';
    fit.textContent = `→ ${b?.tag ?? ''} · ${L.out} ${mm(a.protrusion_mm)}`;
  } else { fit.className = 'fit'; fit.textContent = ''; }
  $('cutRow').hidden = !S.section;
  $('section').classList.toggle('on', S.section);
  $('section').setAttribute('aria-pressed', String(S.section));
  sendSize();
}

$('explode').oninput = (e) => { S.explode = Number(e.target.value); applyExplode(); };
$('cut').oninput = (e) => { S.cut = Number(e.target.value); applyCut(); };
$('section').onclick = () => { S.section = !S.section; renderControls(); if (!S.userMoved) frame(); applyCut(); };
$('grip').oninput = (e) => { clearTimeout(gripTimer); const v = Number(String(e.target.value).replace(',', '.')); gripTimer = setTimeout(() => fitGrip(v), 600); };
for (const id of ['controls']) $(id).addEventListener('pointerdown', (e) => e.stopPropagation());

function markActive() {
  for (const l of labels) l.el.classList.toggle('on', l.model === -1 || l.model === S.active || S.models.length === 1);
}

function placeLabels() {
  if (!labels.length) return;
  const r = renderer.domElement.getBoundingClientRect();
  const pts = labels.map((l) => l.at.clone().project(camera));
  const line = Math.max(...pts.map((p) => ((1 - p.y) / 2) * r.height)) + 14;
  labels.forEach((l, i) => {
    l.el.style.left = `${((pts[i].x + 1) / 2) * r.width}px`;
    l.el.style.top = `${line}px`;
  });
}

/* Fits the camera to the models — not while the stage has no size yet (a host may lay the frame out only after the
   models arrive; framed at zero width the parts end up as dots): then resize() does it. Room is left below for labels. */
let needFrame = false;
function frame() {
  const r = $('stage').getBoundingClientRect();
  if (r.width < 40 || r.height < 40) { needFrame = true; return; }
  needFrame = false;
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const vfov = (camera.fov * Math.PI) / 180;
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  // room: the set fills ~78 % of the width and ~70 % of the height (labels below, the controls in the corners)
  // the controls at the bottom (grip, explode, section) take room: lift the set above them
  const ctl = $('controls').getBoundingClientRect();
  const reserved = ctl.height > 0 ? ctl.height + 16 : 0;
  camera.setViewOffset(r.width, r.height, 0, reserved / 2, r.width, r.height);
  const fitH = (size.y / ((labels.length ? 0.74 : 0.86) - reserved / r.height)) / 2 / Math.tan(vfov / 2);
  const fitW = (Math.max(size.x, size.z) / 0.8) / 2 / Math.tan(hfov / 2);
  const dist = Math.max(fitH, fitW) + size.z / 2;
  const dir = new THREE.Vector3(0.22, 0.26, 1).normalize();
  const target = center.clone();
  if (labels.length) target.y -= size.y * 0.06;
  camera.near = dist / 200;
  camera.far = dist * 20;
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.updateProjectionMatrix();
  controls.target.copy(target);
  controls.minDistance = Math.max(size.x, size.y) * 0.3;
  controls.maxDistance = dist * 6;
  controls.update();
  home = { pos: camera.position.clone(), target: controls.target.clone() };
}

function resetView() {
  if (!home) return;
  camera.position.copy(home.pos);
  controls.target.copy(home.target);
  controls.update();
}

function stop() {
  cancelAnimationFrame(raf);
  renderer?.dispose();
}

// ── page ────────────────────────────────────────────────────────────────────────────────────────────────────────
function status(text) {
  $('status').textContent = text || '';
  $('status').hidden = !text;
}

function fallback(why) {
  document.body.classList.add('no3d');
  const badge = $('badge');
  badge.hidden = false;
  badge.textContent = `${L.picture}: ${S.posterLabel}`;
  $('fallback').textContent = why ? `${why} ${L.no3d}` : L.no3d;
  $('poster').classList.remove('hidden');
  if ($('imgnote').textContent) $('imgnote').hidden = false;
  status('');
}

const nf = (n, d = 2) => new Intl.NumberFormat(S.locale, { maximumFractionDigits: d }).format(n);
const bytes = (b) => (b >= 1e6 ? `${nf(b / 1048576, 1)} MB` : `${nf(Math.max(1, Math.round(b / 1024)), 0)} KB`);
const mm = (v, d = 2) => `${nf(v, d)} ${L.unit}`;
const optionOfModel = (m) => m.options?.find((o) => o.option === S.optionOf[m.id]);
const optionLabel = (m) => optionOfModel(m)?.label ?? m.option.label ?? '';
const filesOf = (m) => (S.optionOf[m.id] === m.option.id ? m.files : optionOfModel(m)?.glb ? [{ format: 'glb', url: optionOfModel(m).glb }] : []);

function setModels(models, locale) {
  S.models = models;
  if (locale) setLocale(locale);
  for (const m of models) S.optionOf[m.id] = S.optionOf[m.id] || m.option.id;
  S.active = 0;
  S.layout = S.wantLayout === 'assembly' && assemblyPlan() ? 'assembly' : 'side';
  if (S.webgl && !renderer && !initGL()) fallback();
  render();
}

/* The header: one part — its name; a set of one nominal size — «Fasteners M12»; else the parts' roles. */
function setTitle() {
  const ms = S.models;
  if (ms.length === 1) { $('title').textContent = ms[0].label || ms[0].name; return; }
  const ds = new Set(ms.map((m) => m.dimensions?.nominal_diameter_mm));
  const fasteners = ms.every((m) => /^(bolt|screw|nut|washer)-/.test(m.family_id));
  $('title').textContent = fasteners && ds.size === 1 && [...ds][0] ? `${L.fasteners} M${nf([...ds][0])}` : ms.map((m) => m.role || m.short).join(' · ');
}

function renderLayout() {
  const seg = $('layout');
  seg.innerHTML = '';
  const can = S.models.length > 1 && assemblyPlan();
  seg.hidden = !can;
  if (!can) return;
  for (const [id, text] of [['side', L.side], ['assembly', L.assembly]]) {
    const b = el('button', null, text);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(S.layout === id));
    b.onclick = () => { if (S.layout !== id) { S.layout = id; S.explode = 0; renderLayout(); show(); } };
    seg.append(b);
  }
}

/* The option (thread: real / cosmetic / print) — one choice for the whole set where the parts have it. */
function renderOption() {
  const m = S.models[S.active];
  const chip = $('option');
  chip.hidden = !(m.options?.length > 1);
  const ol = optionLabel(m);
  chip.textContent = ol.charAt(0).toUpperCase() + ol.slice(1);
  chip.onclick = (e) => {
    e.stopPropagation();
    openMenu(chip, m.options.filter((o) => o.glb).map((o) => ({
      text: o.label,
      checked: o.option === S.optionOf[m.id],
      run: () => {
        for (const x of S.models) if (x.options?.some((y) => y.option === o.option && y.glb)) S.optionOf[x.id] = o.option;
        renderInfo();
        show();
      },
    })), 'up');
  };
}

/* The bar: the selected part's key facts. */
function renderFacts() {
  const m = S.models[S.active];
  const d = m.dimensions || {};
  const box = $('facts');
  box.innerHTML = '';
  const strong = el('b', null, m.tag || m.size);
  let rest = '';
  if (m.thread?.pitch_mm != null) rest = `${L.pitchWord} ${mm(m.thread.pitch_mm)}`;
  else if (d.outside_diameter_mm != null) rest = `${nf(d.nominal_diameter_mm)} × ${nf(d.outside_diameter_mm)} × ${nf(d.width_mm)} ${L.unit}`;
  else if (Array.isArray(d.overall_mm)) rest = `${d.overall_mm.map((v) => nf(v, 1)).join(' × ')} ${L.unit}`;
  box.append(strong);
  if (S.models.length > 1) { box.prepend(el('span', null, `${m.role} `)); }
  if (rest) box.append(` · ${rest}`);
}

/* The format choice: the formats the selected part has (in the order of the catalogue). */
function renderFormats() {
  const sel = $('format');
  const have = new Set(S.models.flatMap((m) => filesOf(m).map((f) => f.format)));
  const list = ['step', 'stl', '3mf', 'glb'].filter((f) => have.has(f));
  if (!list.includes(S.format)) S.format = list[0] || 'glb';
  sel.innerHTML = '';
  for (const f of list) { const o = el('option', null, f.toUpperCase()); o.value = f; sel.append(o); }
  sel.value = S.format;
  sel.onchange = () => { S.format = sel.value; };
}

/* «Download»: one part — its file; a set — a short menu, one line per part. */
function download(e) {
  e.stopPropagation();
  const rows = S.models.map((m) => ({ m, f: filesOf(m).find((x) => x.format === S.format) })).filter((r) => r.f);
  if (rows.length === 1) return openLink(rows[0].f.download_url || rows[0].f.url);
  openMenu($('download'), rows.map(({ m, f }) => ({ text: `${m.role} ${m.tag}`, side: `${S.format.toUpperCase()} ${f.bytes ? bytes(f.bytes) : ''}`, run: () => openLink(f.download_url || f.url) })), 'up', 'right');
}

let menu = null;
function closeMenu() { menu?.remove(); menu = null; }
function openMenu(anchor, items, dir = 'down', align = 'left') {
  closeMenu();
  menu = el('div', 'menu');
  menu.setAttribute('role', 'menu');
  for (const it of items) {
    const b = el('button', null, it.text);
    b.type = 'button';
    b.setAttribute('role', 'menuitemradio');
    if (it.checked) b.setAttribute('aria-checked', 'true');
    if (it.side) b.append(el('span', 'num', it.side));
    b.onclick = (e) => { e.stopPropagation(); closeMenu(); it.run(); };
    menu.append(b);
  }
  document.body.append(menu);
  const a = anchor.getBoundingClientRect();
  const mr = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(4, align === 'right' ? a.right - mr.width : a.left) + window.scrollX}px`;
  menu.style.top = `${(dir === 'up' ? a.top - mr.height - 6 : a.bottom + 6) + window.scrollY}px`;
}
document.addEventListener('click', closeMenu);

/* «More»: the facts — one part a list, a set one column per part. */
function facts(m) {
  const d = m.dimensions || {};
  const own = S.optionOf[m.id] === m.option.id;
  return [
    [L.std, m.standard?.id],
    [L.size, m.tag || m.size],
    [L.pitch, m.thread?.pitch_mm != null ? mm(m.thread.pitch_mm) : null],
    [L.thread, m.thread ? (own ? m.thread.label : optionLabel(m)) : null],
    [L.length, d.length_mm != null ? mm(d.length_mm) : null],
    [L.gripFact, d.grip_mm != null ? mm(d.grip_mm) : null],
    [L.D, d.outside_diameter_mm != null ? mm(d.outside_diameter_mm) : null],
    [L.B, d.width_mm != null ? mm(d.width_mm) : null],
    [L.overall, Array.isArray(d.overall_mm) ? `${d.overall_mm.map((v) => nf(v, 1)).join(' × ')} ${L.unit}` : null],
    [L.mass, own && m.mass_kg != null ? (m.mass_kg >= 1 ? `${nf(m.mass_kg)} ${L.kg}` : `${nf(m.mass_kg * 1000, 1)} ${L.g}`) : null],
    [L.checks, own && m.checks?.kernel ? L.ok : null],
  ];
}
function renderData() {
  const list = S.models;
  const table = $('data');
  table.innerHTML = '';
  const cols = list.map(facts);
  if (list.length > 1) {
    const tr = el('tr');
    tr.append(el('th', null, ''));
    list.forEach((m) => { const th = el('th', null, `${m.role} ${m.tag}`); th.title = m.name; tr.append(th); });
    const head = el('thead');
    head.append(tr);
    table.append(head);
  }
  const body = el('tbody');
  cols[0].forEach(([label], r) => {
    const values = cols.map((c) => c[r][1]);
    if (values.every((v) => !v)) return;
    const tr = el('tr');
    tr.append(el('th', null, label));
    for (const v of values) tr.append(el('td', v ? 'num' : 'na', v || '—'));
    body.append(tr);
  });
  table.append(body);
  const m = S.models[S.active];
  const optId = S.optionOf[m.id];
  const shows = m.image.option ? m.image.option === optId : false;
  const defLabel = m.options?.find((o) => o.option === m.image.option)?.label ?? m.image.option;
  const note = m.image.option ? (shows ? '' : L.imgDefault(defLabel)) : L.imgFamily;
  S.posterLabel = m.image.option ? defLabel : L.family;
  $('imgnote').textContent = note;
  $('imgnote').hidden = !note || S.webgl;
}

function toggleDetails(open = $('details').hidden) {
  $('details').hidden = !open;
  $('more').setAttribute('aria-expanded', String(open));
  $('moreLabel').textContent = open ? L.less : L.more;
  sendSize();
}

/* Everything that depends on the selected part (not the 3D). */
function renderInfo() {
  renderOption();
  renderFacts();
  renderFormats();
  renderData();
  const m = S.models[S.active];
  $('site').onclick = () => openLink(`${m.viewer_url}?option=${S.optionOf[m.id]}`);
  $('license').onclick = () => openLink(m.license?.url || m.viewer_url);
  sendSize();
}

function select(i) {
  if (i < 0 || i === S.active) return;
  S.active = i;
  markActive();
  renderInfo();
}

function render() {
  const m = S.models[S.active];
  setTitle();
  renderLayout();
  const poster = $('poster');
  poster.hidden = false;
  poster.src = m.image.url;
  poster.alt = m.name;
  $('badge').hidden = true;
  renderInfo();
  if (!S.webgl) poster.classList.remove('hidden');
  show();
}

$('more').onclick = () => toggleDetails();
$('info').onclick = () => toggleDetails();
$('download').onclick = download;

// ── display mode ────────────────────────────────────────────────────────────────────────────────────────────────
function setMode(mode) {
  S.mode = mode;
  document.body.classList.toggle('fs', mode === 'fullscreen');
  $('full').title = mode === 'fullscreen' ? L.exitFull : L.full;
  requestAnimationFrame(resize);
}

$('full').onclick = async () => {
  const want = S.mode === 'fullscreen' ? 'inline' : 'fullscreen';
  const modes = S.ctx.availableDisplayModes || [];
  if (modes.includes('fullscreen')) {
    try { const r = await request('ui/request-display-mode', { mode: want }); setMode(r?.mode || want); return; } catch { /* fall through */ }
  }
  if (window.openai?.requestDisplayMode) {
    try { await window.openai.requestDisplayMode({ mode: want }); setMode(want); return; } catch { /* fall through */ }
  }
  const card = $('card');
  if (document.fullscreenElement) { await document.exitFullscreen(); return; }
  if (card.requestFullscreen) { try { await card.requestFullscreen(); } catch { /* not allowed here */ } }
};
document.addEventListener('fullscreenchange', () => requestAnimationFrame(resize));
$('reset').onclick = resetView;

start();
