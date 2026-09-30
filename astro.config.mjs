// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // TODO(content): production domain, e.g. site: 'https://example.com'.
  // Canonical and Open Graph URLs are only emitted once this is set.
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
