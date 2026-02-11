import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.js'],
        coverage: {
            reporter: ['text', 'text-summary'],
            include: ['src/shared/utils/**/*.js'],
            exclude: [
                'src/shared/utils/**/*.test.js',
                'src/shared/utils/**/__tests__/**'
            ]
        }
    },
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, 'src')
        }
    }
});
