import { playwright } from '@vitest/browser-playwright';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    optimizeDeps: {
        include: [
            '@tanstack/react-virtual',
            '@tauri-apps/api/event',
            '@tauri-apps/api/window',
            '@tauri-apps/plugin-deep-link',
            '@tauri-apps/plugin-global-shortcut',
            '@tauri-apps/plugin-opener',
            '@testing-library/react',
            'dexie',
            'fractional-indexing',
            'react',
            'react-dom',
            'zod',
            'zustand',
            'zustand/vanilla',
        ],
    },
    plugins: [react()],
    test: {
        projects: [
            {
                extends: true,
                test: {
                    environment: 'jsdom',
                    exclude: ['src/**/*.browser.test.{ts,tsx}'],
                    include: ['src/**/*.test.{ts,tsx}'],
                    name: 'unit',
                    setupFiles: ['./src/test/setup.ts'],
                },
            },
            {
                extends: true,
                test: {
                    environment: 'node',
                    include: ['scripts/**/*.test.ts'],
                    name: 'node',
                },
            },
            {
                extends: true,
                test: {
                    browser: {
                        enabled: true,
                        headless: true,
                        instances: [{ browser: 'chromium' }],
                        provider: playwright(),
                    },
                    include: ['src/**/*.browser.test.{ts,tsx}'],
                    name: 'browser',
                },
            },
        ],
    },
});
