import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Critical for single-file builds: the bundled JS (xlsx lib etc.) contains literal
// "</script" sequences. When inlined into index.html the browser closes the <script>
// tag early and renders the rest of the code as text. Escape them safely
// ("<\/script" is identical to "</script" inside JS strings and regexes).
const escapeInlineScript = {
  name: 'escape-inline-script',
  enforce: 'post',
  generateBundle(_, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type === 'chunk') {
        file.code = file.code.replace(/<\/script/gi, '<\\/script');
      }
    }
  },
};

export default defineConfig({
  plugins: [
    react(),
    escapeInlineScript,
    // bundle EVERYTHING (js + css) into one self-contained index.html
    viteSingleFile({ removeViteModuleLoader: true }),
  ],
  build: {
    chunkSizeWarningLimit: 4000,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
});
