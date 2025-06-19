import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),

    // @quasar/plugin-vite options list:
    // https://github.com/quasarframework/quasar/blob/dev/vite-plugin/index.d.ts
    quasar({
      sassVariables: fileURLToPath(
        new URL('./src/quasar-variables.sass', import.meta.url)
      )
    })
  ],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      // and the monorepo's common node_modules directory
      allow: [
        path.resolve(__dirname, '../../../common/temp/node_modules/'), // Path to Rush's common node_modules
        path.resolve(__dirname, '../../'), // Allow serving from the 'apps/framer' directory (one level up from src-frontend)
      ],
    },
  }
})