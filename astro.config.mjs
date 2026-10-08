// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Production domain: canonical and Open Graph URLs are built from it.
  site: 'https://jordibacardit.com',
  vite: {
    build: {
      // three.js (~650 KB) is one chunk, downloaded only on /play when the village starts.
      chunkSizeWarningLimit: 800,
    },
    // Dev server only: /play imports three.js on demand, so Vite would discover it late and
    // re-bundle it mid-session (the page then gets 504s). Bundling it at startup avoids that.
    optimizeDeps: {
      include: [
        'three',
        'three/examples/jsm/loaders/GLTFLoader.js',
        'three/examples/jsm/libs/meshopt_decoder.module.js',
        'three/examples/jsm/utils/SkeletonUtils.js',
        'three/examples/jsm/postprocessing/EffectComposer.js',
        'three/examples/jsm/postprocessing/RenderPass.js',
        'three/examples/jsm/postprocessing/UnrealBloomPass.js',
        'three/examples/jsm/postprocessing/OutputPass.js',
      ],
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Familjen Grotesk',
      cssVariable: '--font-familjen-grotesk',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400],
      styles: ['normal'],
      fallbacks: ['monospace'],
    },
  ],
});
