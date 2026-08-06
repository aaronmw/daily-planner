const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const config = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/__tests__/**/*.test.js'],
};

module.exports = createJestConfig(config);
