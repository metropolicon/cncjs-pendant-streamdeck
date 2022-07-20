import { fileURLToPath, URL } from 'url'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
import legacy from '@vitejs/plugin-legacy'
export default defineConfig(({ command, mode }) => {
  const pkg = require('./package.json')
  const config = {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      outDir: '../dist/cli',
      emptyOutDir: true,
      rollupOptions: {
        treeshake: 'smallest',
        input: {
          cli: path.resolve(__dirname, 'src/cli.js'),
          'gcode-thread-worker': path.resolve(
            __dirname,
            'src/gcode-thread-worker.js'
          ),
        },
      },
    },
    esbuild: {
      keepNames: true,
    },
    ssr: {
      noExternal: ['cation', 'adapter'],
    },
    legacy: {
      buildSsrCjsExternalHeuristics: true,
    },
    plugins: [vue(), legacy({ targets: ['node 14'] })],
    root: 'src',
    server: {},
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        adapter: fileURLToPath(
          new URL('./src/services/adapter/node.js', import.meta.url)
        ),
      },
    },
  }

  return config
})
