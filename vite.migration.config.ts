import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
    base: '/',
    build: {
        emptyOutDir: true,
        outDir: 'src-tauri/migration-dist',
        rolldownOptions: {
            input: resolve(import.meta.dirname, 'migration.html'),
        },
        sourcemap: false,
    },
});
