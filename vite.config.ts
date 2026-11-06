import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';

/**
 * Dev-server twin of public/_redirects: send React routes to app.html so they
 * load the app, while "/" shows the static landing page.
 * Keep in sync with public/_redirects.
 */
const APP_ROUTES = [
  '/metronome',
  '/builder',
  '/login',
  '/register',
  '/features',
  '/verify-account',
  '/reset-password',
  '/verify-reset-password',
  '/privacy-policy',
  '/account',
];

function appRoutesInDev(): Plugin {
  return {
    name: 'rhythmaning-app-routes',
    configureServer(server) {
      server.middlewares.use((rawReq, _res, next) => {
        // no @types/node in this project, so IncomingMessage is untyped here
        const req = rawReq as { url?: string };
        const path = (req.url ?? '/').split('?')[0];
        if (APP_ROUTES.some((r) => path === r || path.startsWith(r + '/'))) {
          req.url = '/app.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), svgr(), appRoutesInDev()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // landing page -> dist/index.html (relative to project root)
        app: 'app.html', // React app -> dist/app.html
      },
    },
  },
});
