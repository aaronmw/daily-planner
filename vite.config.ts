import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    build: {
        emptyOutDir: true,
        outDir: 'dist',
        sourcemap: false,
        rolldownOptions: {
            input: {
                index: resolve(import.meta.dirname, 'index.html'),
                sw: resolve(import.meta.dirname, 'src/service-worker.ts'),
            },
            output: {
                entryFileNames: chunk =>
                    chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js',
            },
        },
    },
    plugins: [react()],
    server: {
        host: '127.0.0.1',
    },
});
