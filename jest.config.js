module.exports = {
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'vue'],
    transform: {
        '^.+\\.js$': 'esbuild-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    testMatch: ['<rootDir>/src/**/*.{test,spec}.js'],
    testPathIgnorePatterns: [],
    watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
    coverageReporters: ['text', 'text-summary'],
    collectCoverageFrom: [
        'src/shared/utils/**/*.js',
        '!src/shared/utils/**/*.test.js',
        '!src/shared/utils/**/__tests__/**'
    ]
};
