import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    define: {
        NIGHTLY: JSON.stringify(false),
        WINDOWS: JSON.stringify(true),
        LINUX: JSON.stringify(false)
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        include: ['src/**/*.{test,spec}.js'],
        coverage: {
            reporter: ['text', 'text-summary'],
            include: ['src/shared/utils/**/*.js', 'src/components/**/*.vue'],
            exclude: [
                'src/shared/utils/**/*.test.js',
                'src/shared/utils/**/__tests__/**',
                'src/components/**/__tests__/**'
            ]
        }
    },
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'src')
        }
    }
});
