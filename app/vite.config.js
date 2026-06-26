import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default {
  plugins: [svelte({ configFile: false })],
  server: {
    proxy: {
      '/github-oauth': {
        target: 'https://github.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/github-oauth/, ''),
      },
    },
  },
}
