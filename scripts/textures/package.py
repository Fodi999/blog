#!/usr/bin/env python3
"""Pack a texture baked by Monge (cad_materials --example bake_surface) for the site.

  python3 scripts/textures/package.py BAKE_DIR SLUG VERSION RENDER_MONGE.png RENDER_THREE.png PLATE.png

BAKE_DIR/SLUG/{1k,2k,4k}/ and BAKE_DIR/SLUG/bake.json come from the bake. Writes
  r2/textures/SLUG/VERSION/SLUG-{1k,2k,4k}.zip        one archive per resolution (maps + material.json + .mtlx + README)
  r2/textures/SLUG/VERSION/live/{normal_gl,roughness}.png   the 1K maps the page's 3D ball loads
  r2/textures/SLUG/VERSION/{render-monge,render-three,tile}.webp
and the entry of data/textures.json (sizes, SHA-256, measured bake times). Nothing is uploaded here.
"""
import hashlib, json, os, shutil, subprocess, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
bake, slug, ver, r_monge, r_three, plate = sys.argv[1:7]
src = os.path.join(bake, slug)
meta = json.load(open(os.path.join(src, 'bake.json')))
out = os.path.join(ROOT, 'r2', 'textures', slug, ver)
shutil.rmtree(out, ignore_errors=True)
os.makedirs(os.path.join(out, 'live'))

def sha(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()

README = """{name} — {slug} ({res})
Made by Monge's own procedural generator (cad_materials::procedural), not from a photo or a scan.
Tile: {tile} mm. Seamless in both directions.

Files
  normal_gl.png   normal map, OpenGL convention (green up). For DirectX engines invert the green channel.
  roughness.png   roughness, linear (not sRGB), 0 = mirror, 1 = matte.
  height.png      16-bit height, physical: {lo:.4f} … {hi:.4f} mm over the 0…65535 range.
  material.json   the set as Monge reads it.
  {slug}.mtlx  MaterialX standard_surface.
Base colour and metalness are values, not maps: base colour (linear) {base}, metalness {metal}.

What it is not: a look, not a surface specification. No roughness (Ra / Rz) or finish grade is claimed.
The normal map's relief is exaggerated so it shows (RMS slope {slope}); height.png keeps the physical numbers.

Licence: free to use in your own work, commercial included; do not resell or redistribute these files as files.
https://dima-fomin.pl/en/license
"""

entry = {'slug': slug, 'version': ver, 'files': []}
for m in meta['maps']:
    res = f"{m['size'] // 1024}k"
    d = os.path.join(src, res)
    mat = json.load(open(os.path.join(d, 'material.json')))
    lo, hi = mat['height_range_mm']
    slope = meta['recipe'].split('normal_slope: ')[1].split(',')[0]
    z = os.path.join(out, f'{slug}-{res}.zip')
    # byte-reproducible: fixed time and order, so packing the same maps again gives the same SHA-256
    def put(zf, name, data):
        zi = zipfile.ZipInfo(f'{slug}-{res}/{name}', date_time=(2026, 1, 1, 0, 0, 0))
        zi.compress_type, zi.external_attr = zipfile.ZIP_DEFLATED, 0o644 << 16
        zf.writestr(zi, data, compresslevel=9)
    with zipfile.ZipFile(z, 'w') as zf:
        for f in ['normal_gl.png', 'roughness.png', 'height.png', 'material.json', f'{slug}.mtlx']:
            put(zf, f, open(os.path.join(d, f), 'rb').read())
        put(zf, 'README.txt', README.format(
            name=mat['name'], slug=slug, res=f"{m['size']}×{m['size']} px", tile=mat['scale_mm'], lo=lo, hi=hi,
            base=', '.join(f'{c:.2f}' for c in mat['base']), metal=mat['metal'], slope=slope).encode())
    entry['files'].append({
        'res': res, 'px': m['size'], 'key': f'textures/{slug}/{ver}/{slug}-{res}.zip', 'bytes': os.path.getsize(z), 'sha256': sha(z),
        'octaves': m['octaves'], 'generate_ms': round(m['generate_ms']), 'write_ms': round(m['write_ms']),
        'rough_avg': round(m['rough_avg'], 3), 'relief_um': round(m['relief_mm'] * 1000, 1),
    })
    if res == '1k':
        for f in ['normal_gl.png', 'roughness.png']:
            shutil.copy(os.path.join(d, f), os.path.join(out, 'live', f))
        entry.update(name=mat['name'], category=mat['category'], tile_mm=mat['scale_mm'], base=mat['base'], metal=mat['metal'],
                     rough_avg=round(m['rough_avg'], 3), normal_rms=float(slope))
        # a plate of 2 × 2 tiles under the studio light (Three.js, 1080 × 1080): shows the look and that it repeats
        # without a seam
        subprocess.run(['magick', plate, '-crop', '1080x700+0+170', '+repage', '-resize', '960x', '-quality', '86',
                        os.path.join(out, 'tile.webp')], check=True)

def crop_render(src_png, dst, geom):
    # a 1920 × 1080 frame: the ball in the middle is cut out; any other picture is taken as it is (already framed)
    w = int(subprocess.run(['magick', 'identify', '-format', '%w', src_png], check=True, capture_output=True, text=True).stdout)
    crop = ['-crop', geom, '+repage'] if w == 1920 else []
    subprocess.run(['magick', src_png, *crop, '-resize', '960x', '-quality', '86', dst], check=True)

crop_render(r_monge, os.path.join(out, 'render-monge.webp'), '900x700+510+140')
crop_render(r_three, os.path.join(out, 'render-three.webp'), '900x700+510+120')
base_key = f'textures/{slug}/{ver}'
entry['assets'] = {'normal_gl': f'{base_key}/live/normal_gl.png', 'roughness': f'{base_key}/live/roughness.png',
                   'render_monge': f'{base_key}/render-monge.webp', 'render_three': f'{base_key}/render-three.webp',
                   'tile': f'{base_key}/tile.webp'}

data = os.path.join(ROOT, 'data', 'textures.json')
items = json.load(open(data)) if os.path.exists(data) else []
items = [t for t in items if t['slug'] != slug] + [entry]
json.dump(items, open(data, 'w'), ensure_ascii=False, indent=1)
print(json.dumps(entry, ensure_ascii=False, indent=1))
