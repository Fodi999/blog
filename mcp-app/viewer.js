/* Monge model viewer — an MCP App (SEP-1865) view.
   Talks to the host over postMessage JSON-RPC (ui/initialize → ui/notifications/initialized → tool-input / tool-result),
   renders the models' own GLB files with Three.js, and shows their data from the tool result. No SDK, no network
   except the GLB and WebP files on dima-fomin.pl (declared in the resource's CSP). Built by scripts/build-mcp-viewer.mjs. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const T = {
  en: {
    loading: 'Loading the 3D model…', no3d: 'This window cannot show 3D (WebGL is off or the file could not load). The data below are of the selected model; the picture shows the option named on it. Open the model in 3D on the Monge site.',
    glbFail: 'The 3D file could not be loaded here.', waiting: 'Waiting for the model…', cancelled: 'Cancelled.', standalone: 'Open this view from an MCP host (e.g. ChatGPT) — it shows the models a tool call returns.',
    hint: 'Drag to rotate · scroll or pinch to zoom · right-drag or two fingers to pan', compare: 'Side by side', reset: 'Reset view', full: 'Full screen', exitFull: 'Exit full screen',
    std: 'Standard', size: 'Size', pitch: 'Thread pitch', thread: 'Thread', length: 'Length', overall: 'Overall', mass: 'Mass ≈', checks: 'Kernel check', ok: 'passed',
    open: 'Open on the Monge site', license: 'Licence', imgDefault: (o) => `Picture: this size's default option (${o}). The 3D view shows the selected option.`,
    imgFamily: 'Picture: a representative size of the family.', picture: 'Picture', family: 'a size of the family', showing: 'Showing', option: 'Option', d: 'Diameter', D: 'Outside Ø', B: 'Width', grip: 'Grip',
  },
  ru: {
    loading: 'Загружаю 3D-модель…', no3d: 'Здесь нельзя показать 3D (WebGL выключен или файл не загрузился). Данные ниже — выбранной модели; на картинке — исполнение, указанное на ней. Откройте модель в 3D на сайте Monge.',
    glbFail: 'Не удалось загрузить 3D-файл здесь.', waiting: 'Жду модель…', cancelled: 'Отменено.', standalone: 'Откройте этот просмотр из MCP-клиента (например, ChatGPT) — он показывает модели из ответа инструмента.',
    hint: 'Тяните — вращение · колесо или щипок — масштаб · правая кнопка или два пальца — сдвиг', compare: 'Рядом', reset: 'Сбросить вид', full: 'Во весь экран', exitFull: 'Выйти из полноэкранного режима',
    std: 'Стандарт', size: 'Размер', pitch: 'Шаг резьбы', thread: 'Резьба', length: 'Длина', overall: 'Габарит', mass: 'Масса ≈', checks: 'Проверка ядром', ok: 'пройдена',
    open: 'Открыть на сайте Monge', license: 'Лицензия', imgDefault: (o) => `Картинка: исполнение этого размера по умолчанию (${o}). В 3D — выбранное исполнение.`,
    imgFamily: 'Картинка: типовой размер семейства.', picture: 'На картинке', family: 'типовой размер семейства', showing: 'Показано', option: 'Исполнение', d: 'Диаметр', D: 'Наружный Ø', B: 'Ширина', grip: 'Пакет',
  },
  pl: {
    loading: 'Wczytuję model 3D…', no3d: 'Tu nie da się pokazać 3D (WebGL wyłączony albo plik się nie wczytał). Dane poniżej dotyczą wybranego modelu; obraz pokazuje opcję podaną na nim. Otwórz model w 3D na stronie Monge.',
    glbFail: 'Nie udało się wczytać pliku 3D.', waiting: 'Czekam na model…', cancelled: 'Anulowano.', standalone: 'Otwórz ten podgląd z klienta MCP (np. ChatGPT) — pokazuje modele z odpowiedzi narzędzia.',
    hint: 'Przeciągnij — obrót · kółko lub uszczypnięcie — zoom · prawy przycisk lub dwa palce — przesunięcie', compare: 'Obok siebie', reset: 'Resetuj widok', full: 'Pełny ekran', exitFull: 'Zamknij pełny ekran',
    std: 'Norma', size: 'Rozmiar', pitch: 'Skok gwintu', thread: 'Gwint', length: 'Długość', overall: 'Wymiary', mass: 'Masa ≈', checks: 'Kontrola jądra', ok: 'zaliczona',
    open: 'Otwórz na stronie Monge', license: 'Licencja', imgDefault: (o) => `Obraz: domyślna opcja tego rozmiaru (${o}). Widok 3D pokazuje wybraną opcję.`,
    imgFamily: 'Obraz: typowy rozmiar rodziny.', picture: 'Na obrazie', family: 'typowy rozmiar rodziny', showing: 'Pokazano', option: 'Opcja', d: 'Średnica', D: 'Ø zewn.', B: 'Szerokość', grip: 'Grubość pakietu',
  },
};

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

const S = { locale: 'en', models: [], active: 0, compare: false, optionOf: {}, caps: {}, ctx: {}, mode: 'inline', webgl: true };
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
  $('hint').textContent = L.hint;
  $('reset').title = L.reset;
  $('full').title = S.mode === 'fullscreen' ? L.exitFull : L.full;
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
    if (out?.models && !S.models.length) { if (out.layout === 'side_by_side' && out.models.length > 1) S.compare = true; setModels(out.models, out.locale); }
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
  sendSize();
}

function onInput(params) {
  const loc = params?.arguments?.locale;
  if (loc && !S.models.length) setLocale(loc);
  status(L.loading);
}

function onResult(res) {
  const sc = res?.structuredContent;
  if (sc?.layout === 'side_by_side' && sc.models?.length > 1) S.compare = true;
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
}

const steel = () => new THREE.MeshPhysicalMaterial({ color: 0xd2d6db, metalness: 1, roughness: 0.24, clearcoat: 0.3, clearcoatRoughness: 0.25 });
const KIND = {
  rubber: () => new THREE.MeshPhysicalMaterial({ color: 0x0b0c0e, metalness: 0, roughness: 0.85 }),
  plastic: () => new THREE.MeshPhysicalMaterial({ color: 0x121418, metalness: 0, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
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

let labels = [];
async function show() {
  const list = S.compare ? S.models : [S.models[S.active]];
  const urls = list.map(glbOf);
  status(L.loading);
  if (!S.webgl) return fallback();
  let objs;
  try {
    objs = await Promise.all(urls.map((u) => (u ? loadGlb(u) : Promise.reject(new Error('no glb')))));
  } catch {
    return fallback(L.glbFail);
  }
  root.clear();
  labels.forEach((l) => l.el.remove());
  labels = [];
  // side by side at true scale: each part stands on the floor, a gap of a third of the largest
  const boxes = objs.map((o) => new THREE.Box3().setFromObject(o));
  const widest = Math.max(...boxes.map((b) => b.getSize(new THREE.Vector3()).x));
  let x = 0;
  objs.forEach((o, i) => {
    const b = boxes[i];
    const size = b.getSize(new THREE.Vector3());
    const c = b.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    const inst = o.clone(true);
    inst.position.set(-c.x, list.length > 1 ? -b.min.y : -c.y, -c.z);
    holder.add(inst);
    holder.position.x = x + size.x / 2;
    x += size.x + widest * 0.35;
    root.add(holder);
    if (list.length > 1) {
      const lab = el('div', 'label3d', `${list[i].standard?.id ?? ''} ${list[i].size}`.trim());
      $('stage').appendChild(lab);
      labels.push({ el: lab, at: new THREE.Vector3(holder.position.x, size.y + widest * 0.08, 0) });
    }
  });
  if (list.length > 1) root.position.x = -(x - widest * 0.35) / 2, labels.forEach((l) => (l.at.x += root.position.x));
  else root.position.set(0, 0, 0);
  frame();
  $('poster').classList.add('hidden');
  status('');
}

function placeLabels() {
  if (!labels.length) return;
  const r = renderer.domElement.getBoundingClientRect();
  for (const l of labels) {
    const p = l.at.clone().project(camera);
    l.el.style.left = `${((p.x + 1) / 2) * r.width}px`;
    l.el.style.top = `${((1 - p.y) / 2) * r.height}px`;
  }
}

function frame() {
  const box = new THREE.Box3().setFromObject(root);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const fov = (camera.fov * Math.PI) / 180;
  const dist = (sphere.radius / Math.sin(Math.min(fov, fov * camera.aspect) / 2)) * 1.08;
  const dir = new THREE.Vector3(1, 0.55, 1.35).normalize();
  camera.near = dist / 200;
  camera.far = dist * 20;
  camera.position.copy(sphere.center).addScaledVector(dir, dist);
  camera.updateProjectionMatrix();
  controls.target.copy(sphere.center);
  controls.minDistance = sphere.radius * 0.3;
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
  // without 3D the picture is what is on screen: the badge names the picture's option, not the selected one
  const badge = $('badge');
  badge.hidden = false;
  badge.className = 'badge warn';
  badge.textContent = `${L.picture}: ${S.posterLabel}`;
  $('fallback').textContent = why ? `${why} ${L.no3d}` : L.no3d;
  $('poster').classList.remove('hidden');
  status('');
}

const nf = (n, d = 2) => new Intl.NumberFormat(S.locale, { maximumFractionDigits: d }).format(n);
const bytes = (b) => (b >= 1e6 ? `${nf(b / 1048576, 1)} MB` : `${nf(Math.max(1, Math.round(b / 1024)), 0)} KB`);

function setModels(models, locale) {
  S.models = models;
  if (locale) setLocale(locale);
  for (const m of models) S.optionOf[m.id] = S.optionOf[m.id] || m.option.id;
  const box = $('models');
  box.innerHTML = '';
  if (models.length > 1) {
    box.hidden = false;
    models.forEach((m, i) => {
      const b = el('button', 'chip', `${m.family} ${m.size}`);
      b.type = 'button';
      b.onclick = () => { S.active = i; S.compare = false; render(); };
      box.appendChild(b);
    });
    const c = el('button', 'chip', L.compare);
    c.type = 'button';
    c.onclick = () => { S.compare = true; render(); };
    box.appendChild(c);
  } else box.hidden = true;
  if (S.webgl && !renderer && !initGL()) fallback();
  render();
}

function specRows(m, optId, opt) {
  const d = m.dimensions || {};
  const own = optId === m.option.id;
  return [
    [L.std, m.standard?.id],
    [L.size, m.size],
    [L.pitch, m.thread?.pitch_mm != null ? `${nf(m.thread.pitch_mm)} mm` : null],
    [L.thread, m.thread ? (own ? m.thread.label : opt?.label) : null],
    [L.length, d.length_mm != null ? `${nf(d.length_mm)} mm` : null],
    [L.grip, d.grip_mm != null ? `${nf(d.grip_mm)} mm` : null],
    [L.D, d.outside_diameter_mm != null ? `${nf(d.outside_diameter_mm)} mm` : null],
    [L.B, d.width_mm != null ? `${nf(d.width_mm)} mm` : null],
    [L.overall, Array.isArray(d.overall_mm) ? `${d.overall_mm.map((v) => nf(v, 1)).join(' × ')} mm` : null],
    [L.mass, own && m.mass_kg != null ? (m.mass_kg >= 1 ? `${nf(m.mass_kg)} kg` : `${nf(m.mass_kg * 1000, 1)} g`) : null],
    [L.checks, own && m.checks?.kernel ? L.ok : null],
  ].filter(([, v]) => v);
}

function render() {
  const m = S.models[S.active];
  const optId = S.optionOf[m.id];
  const opt = m.options?.find((o) => o.option === optId);
  [...$('models').children].forEach((b, i) => b.setAttribute('aria-pressed', String(S.compare ? i === S.models.length : i === S.active)));

  $('title').textContent = S.compare ? S.models.map((x) => `${x.family} ${x.size}`).join(' · ') : m.name.replace(/ — .*$/, '') + (opt ? ` — ${opt.label}` : '');
  $('sub').textContent = S.compare ? '' : [m.standard ? `${m.standard.id} — ${m.standard.title}` : null].filter(Boolean).join('');

  // the option chips of the active size (switch the GLB: real / cosmetic / print)
  const ob = $('options');
  ob.innerHTML = '';
  ob.hidden = S.compare || !(m.options?.length > 1);
  if (!ob.hidden) for (const o of m.options) {
    const b = el('button', 'chip', o.label);
    b.type = 'button';
    b.disabled = !o.glb;
    b.setAttribute('aria-pressed', String(o.option === optId));
    b.onclick = () => { S.optionOf[m.id] = o.option; render(); };
    ob.appendChild(b);
  }

  // what the 3D shows, in words: the option of the GLB on screen
  const badge = $('badge');
  badge.hidden = S.compare;
  badge.className = 'badge';
  badge.textContent = `${L.showing}: ${opt?.label ?? m.option.label ?? ''}`;

  // the picture: the size's WebP — say so when it is another option than the one on screen
  const poster = $('poster');
  poster.hidden = false;
  poster.src = m.image.url;
  poster.alt = m.name;
  const shows = m.image.option ? m.image.option === optId : false;
  const defLabel = m.options?.find((o) => o.option === m.image.option)?.label ?? m.image.option;
  const note = m.image.option ? (shows ? '' : L.imgDefault(defLabel)) : L.imgFamily;
  S.posterLabel = m.image.option ? defLabel : L.family;
  $('imgnote').hidden = !note || S.compare;
  $('imgnote').textContent = note;
  if (!S.webgl) poster.classList.remove('hidden');

  // the data (from each record) and the files: the active model, or — side by side — every model in turn
  const specs = $('specs');
  const files = $('files');
  specs.innerHTML = '';
  files.innerHTML = '';
  for (const x of S.compare ? S.models : [m]) {
    const xo = S.optionOf[x.id];
    const xopt = x.options?.find((o) => o.option === xo);
    if (S.compare) {
      const h = el('div', 'group', x.name);
      specs.appendChild(h);
    }
    for (const [k, v] of specRows(x, xo, xopt)) {
      const w = el('div');
      w.append(el('dt', null, k), el('dd', null, v));
      specs.appendChild(w);
    }
    const fileList = xo === x.option.id ? x.files : (xopt?.glb ? [{ format: 'glb', url: xopt.glb }] : []);
    for (const f of fileList) {
      const b = el('button', 'file');
      b.type = 'button';
      b.append(el('b', null, (S.compare ? `${x.size} · ` : '') + f.format.toUpperCase()), el('span', null, f.bytes ? bytes(f.bytes) : '↗'));
      b.title = f.sha256 ? `SHA-256 ${f.sha256}` : f.url;
      b.onclick = () => openLink(f.download_url || f.url);
      files.appendChild(b);
    }
  }

  const links = $('links');
  links.innerHTML = '';
  const site = el('button', 'link', `${L.open} ↗`);
  site.type = 'button';
  site.onclick = () => openLink(`${m.viewer_url}?option=${optId}`);
  const lic = el('button', 'link', L.license);
  lic.type = 'button';
  lic.onclick = () => openLink(m.license?.url || m.viewer_url);
  links.append(site, lic);

  sendSize();
  show();
}

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
  const stage = $('stage');
  if (document.fullscreenElement) { await document.exitFullscreen(); return; }
  if (stage.requestFullscreen) { try { await stage.requestFullscreen(); } catch { /* not allowed here */ } }
};
document.addEventListener('fullscreenchange', () => requestAnimationFrame(resize));
$('reset').onclick = resetView;

start();
