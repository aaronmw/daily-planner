import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the default development command launches the isolated Tauri HMR shell', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const productionConfig = JSON.parse(
        readFileSync('src-tauri/tauri.conf.json', 'utf8')
    );
    const developmentConfig = JSON.parse(
        readFileSync('src-tauri/tauri.dev.conf.json', 'utf8')
    );

    assert.equal(packageJson.scripts.dev, 'pnpm tauri:dev');
    assert.equal(
        packageJson.scripts['dev:web'],
        'vite --host 127.0.0.1 --port 3010 --strictPort'
    );
    assert.equal(
        packageJson.scripts['dev:desktop'],
        'vite --host 127.0.0.1 --port 1420 --strictPort'
    );
    assert.match(packageJson.scripts['tauri:dev'], /^tauri dev /);
    assert.match(
        packageJson.scripts['tauri:dev'],
        /src-tauri\/tauri\.dev\.conf\.json/
    );
    assert.equal(productionConfig.build.beforeDevCommand, 'pnpm dev:desktop');
    assert.equal(productionConfig.build.devUrl, 'http://127.0.0.1:1420');
    assert.notEqual(developmentConfig.identifier, productionConfig.identifier);
    assert.equal(
        developmentConfig.identifier,
        'com.aaronwright.dailyplanner.dev'
    );
    assert.equal(developmentConfig.productName, 'Daily Planner Dev');
});
