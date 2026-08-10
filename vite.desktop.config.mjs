import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';

const reactJsAsJsx = {
    enforce: 'pre',
    name: 'react-js-as-jsx',
    transform(code, id) {
        if (!id.includes('/src/') || !id.endsWith('.js')) {
            return null;
        }

        return transformWithEsbuild(code, id, {
            jsx: 'automatic',
            loader: 'jsx',
        });
    },
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const publicEnvironment = [
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
        'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
        'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    ];

    return {
        build: {
            emptyOutDir: true,
            outDir: '../dist-desktop',
        },
        define: Object.fromEntries(
            publicEnvironment.map(key => [
                `process.env.${key}`,
                JSON.stringify(env[key] || ''),
            ])
        ),
        optimizeDeps: {
            esbuildOptions: {
                loader: {
                    '.js': 'jsx',
                },
            },
        },
        plugins: [reactJsAsJsx, react()],
        root: 'desktop',
        server: {
            host: '127.0.0.1',
            port: 1420,
            strictPort: true,
        },
    };
});
