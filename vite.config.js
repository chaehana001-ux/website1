import { defineConfig } from 'vite';

export default defineConfig({
  // Keep production assets relative so dist/index.html also works when opened
  // directly from the filesystem, not only when served from a domain root.
  base: './',
});
