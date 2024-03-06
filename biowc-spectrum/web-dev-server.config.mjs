import { hmrPlugin, presets } from '@open-wc/dev-server-hmr';
import proxy from 'koa-proxies';

const hmr = process.argv.includes('--hmr');

export default /** @type {import('@web/dev-server').DevServerConfig} */ ({
  open: '/demo/',
  watch: !hmr,

  nodeResolve: {
    exportConditions: ['browser', 'development'],
  },

  plugins: [
    hmr && hmrPlugin({ exclude: ['**/*/node_modules/**/*'], presets: [presets.litElement] }),
  ],

  middleware: [proxy('/koina', {
    target: 'https://koina.wilhelmlab.org',
    rewrite: path => path.replace(/^\/koina/, ''),
    changeOrigin: true,
    logs: true,
  })]

});
