import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

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
    assert.deepEqual(developmentConfig.bundle.icon, ['icons/dev-icon.png']);
    assert.equal(existsSync('src-tauri/icons/dev-icon.png'), true);

    const developmentIcon = readFileSync('src-tauri/icons/dev-icon.png');
    assert.equal(developmentIcon.toString('ascii', 12, 16), 'IHDR');
    assert.equal(developmentIcon.readUInt32BE(16), 1024);
    assert.equal(developmentIcon.readUInt32BE(20), 1024);
    assert.equal(developmentIcon[24], 8, 'dev icon must use 8-bit channels');
    assert.equal(developmentIcon[25], 6, 'dev icon must use RGBA color');
});
