const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const config = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/__tests__/**/*.test.js'],
};

module.exports = async () => ({
    ...(await createJestConfig(config)()),
    transformIgnorePatterns: [
        'node_modules/(?!(mdast-util-.*|unist-util-.*|micromark.*|decode-named-character-reference|character-entities.*|devlop|vfile.*)/)',
        '^.+\\.module\\.(css|sass|scss)$',
    ],
});
