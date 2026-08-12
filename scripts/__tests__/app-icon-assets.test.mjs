import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const assertPng512 = path => {
    const image = readFileSync(path);
    assert.equal(image.toString('ascii', 12, 16), 'IHDR');
    assert.equal(image.readUInt32BE(16), 512, `${path} must be 512px wide`);
    assert.equal(image.readUInt32BE(20), 512, `${path} must be 512px high`);
    assert.equal(image[24], 8, `${path} must use 8-bit channels`);
    assert.equal(image[25], 6, `${path} must use RGBA color`);
};

test('app icons are reproducible from the canonical SVG', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const sourcePath = 'src-tauri/icons/app-icon.svg';

    assert.equal(
        packageJson.scripts['icons:generate'],
        'node scripts/generate-app-icons.mjs'
    );
    assert.equal(existsSync('scripts/generate-app-icons.mjs'), true);
    assert.equal(existsSync(sourcePath), true);
    assert.match(readFileSync(sourcePath, 'utf8'), /fill="#001651"/);
});

test('Dock artwork covers every list accent and the navy fallback', () => {
    const accentColors = JSON.parse(
        readFileSync('src/core/domain/accent-colors.json', 'utf8')
    );
    const variants = ['default', ...Object.keys(accentColors)];

    for (const variant of variants) {
        assertPng512(`src-tauri/icons/dock/${variant}.png`);
        assertPng512(`src-tauri/icons/dock/${variant}-dev.png`);
    }

    assert.deepEqual(
        readFileSync('src-tauri/icons/dev-icon.png'),
        readFileSync('src-tauri/icons/dock/default-dev.png')
    );
});
