/* three.js is self-hosted under /public/vendor/three (r177, MIT) and resolved
   through this import map, which the root layout writes into <head>. */
export const THREE_IMPORT_MAP = {
  imports: {
    three: '/vendor/three/build/three.module.min.js',
    'three/addons/': '/vendor/three/examples/jsm/',
  },
};
