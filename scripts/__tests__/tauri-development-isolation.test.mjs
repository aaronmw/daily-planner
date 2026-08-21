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
        'sh -c \'exec vite "$@" --host 127.0.0.1 --port 3010 --strictPort\' --'
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
    assert.equal(
        productionConfig.app.windows[0].url,
        'https://aaronmw.github.io/daily-planner/'
    );
    assert.equal(
        productionConfig.build.beforeBuildCommand,
        'pnpm desktop:migration:build'
    );
    assert.equal(productionConfig.build.frontendDist, 'migration-dist');
    assert.equal(developmentConfig.build.beforeDevCommand, 'pnpm dev:desktop');
    assert.equal(developmentConfig.build.devUrl, 'http://127.0.0.1:1420');
    assert.equal(developmentConfig.app.windows[0].url, 'http://127.0.0.1:1420');
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
    assert.equal(developmentIcon.readUInt32BE(16), 512);
    assert.equal(developmentIcon.readUInt32BE(20), 512);
    assert.equal(developmentIcon[24], 8, 'dev icon must use 8-bit channels');
    assert.equal(developmentIcon[25], 6, 'dev icon must use RGBA color');
});

test('the hosted origin receives only the native permissions it uses', () => {
    const productionCapability = JSON.parse(
        readFileSync('src-tauri/capabilities/default.json', 'utf8')
    );
    const migrationCapability = JSON.parse(
        readFileSync('src-tauri/capabilities/legacy-migration.json', 'utf8')
    );
    const customPermissions = readFileSync(
        'src-tauri/permissions/hosted-shell.toml',
        'utf8'
    );
    const serializedPermissions = JSON.stringify(
        productionCapability.permissions
    );

    assert.equal(productionCapability.local, false);
    assert.deepEqual(productionCapability.remote.urls, [
        'https://aaronmw.github.io/daily-planner',
        'https://aaronmw.github.io/daily-planner/*',
    ]);
    assert.doesNotMatch(serializedPermissions, /core:default/);
    assert.doesNotMatch(serializedPermissions, /fs:/);
    assert.doesNotMatch(serializedPermissions, /https:\/\/\*/);
    assert.match(serializedPermissions, /allow-hosted-migration/);
    assert.match(
        customPermissions,
        /commands\.allow = \["claim_legacy_migration", "complete_legacy_migration"\]/
    );
    assert.deepEqual(migrationCapability.windows, ['legacy-migration']);
    assert.equal(migrationCapability.local, true);
    assert.equal(migrationCapability.remote, undefined);
    assert.deepEqual(migrationCapability.permissions, [
        'allow-legacy-migration-export',
    ]);
});
