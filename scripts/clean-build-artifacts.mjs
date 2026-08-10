import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const requestedMode = process.argv[2] ?? 'all';
const validModes = new Set(['all', 'web', 'rust-dev', 'rust-release']);

if (!validModes.has(requestedMode)) {
    console.error(
        `Unknown cleanup mode "${requestedMode}". Use all, web, rust-dev, or rust-release.`
    );
    process.exitCode = 1;
} else {
    if (requestedMode === 'all' || requestedMode === 'web') {
        remove(join(projectRoot, '.next'));
        remove(join(projectRoot, 'dist-desktop'));
    }

    if (requestedMode.startsWith('rust') || requestedMode === 'all') {
        const targetDirectory = getCargoTargetDirectory();

        if (requestedMode === 'all' || requestedMode === 'rust-dev') {
            remove(join(targetDirectory, 'debug'));
        }

        if (requestedMode === 'all' || requestedMode === 'rust-release') {
            cleanReleaseIntermediates(join(targetDirectory, 'release'));
        }
    }
}

function getCargoTargetDirectory() {
    const metadata = execFileSync(
        'cargo',
        [
            'metadata',
            '--format-version',
            '1',
            '--no-deps',
            '--manifest-path',
            join(projectRoot, 'src-tauri', 'Cargo.toml'),
        ],
        { encoding: 'utf8' }
    );

    return JSON.parse(metadata).target_directory;
}

function cleanReleaseIntermediates(releaseDirectory) {
    if (!existsSync(releaseDirectory)) return;

    for (const entry of readdirSync(releaseDirectory)) {
        if (entry !== 'bundle') remove(join(releaseDirectory, entry));
    }
}

function remove(path) {
    if (!existsSync(path)) return;
    rmSync(path, { force: true, recursive: true });
    console.log(`Removed ${path}`);
}
