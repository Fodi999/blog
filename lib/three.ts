/* three.js is self-hosted under /public/vendor/three (r177, MIT) and resolved
   through this import map, which the 3D viewer writes into <head> before its first import
   (ensureThreeImportMap). */
export const THREE_IMPORT_MAP = {
  imports: {
    three: '/vendor/three/build/three.module.min.js',
    'three/addons/': '/vendor/three/examples/jsm/',
  },
};

/** Writes the import map into <head> once, before the first `import('three')` (in the browser only). */
export function ensureThreeImportMap(): void {
  if (typeof document === 'undefined' || document.querySelector('script[type="importmap"][data-three]')) return;
  const el = document.createElement('script');
  el.type = 'importmap';
  el.dataset.three = '';
  el.textContent = JSON.stringify(THREE_IMPORT_MAP);
  document.head.appendChild(el);
}
