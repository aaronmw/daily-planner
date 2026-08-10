import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Tauri development uses a dedicated bundle identity through the HMR command', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const productionConfig = JSON.parse(
        readFileSync('src-tauri/tauri.conf.json', 'utf8')
    );
    const developmentConfig = JSON.parse(
        readFileSync('src-tauri/tauri.dev.conf.json', 'utf8')
    );

    assert.match(packageJson.scripts['tauri:dev'], /^tauri dev /);
    assert.match(
        packageJson.scripts['tauri:dev'],
        /src-tauri\/tauri\.dev\.conf\.json/
    );
    assert.notEqual(developmentConfig.identifier, productionConfig.identifier);
    assert.equal(
        developmentConfig.identifier,
        'com.aaronwright.dailyplanner.dev'
    );
    assert.equal(developmentConfig.productName, 'Daily Planner Dev');
});
