import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    getCodeSigningIdentityOutput,
    hasCodeSigningIdentity,
    isInstallableSigningIdentity,
    LOCAL_MACOS_SIGNING_IDENTITY,
    resolveMacosSigningIdentity,
} from './macos-signing.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tauriExecutable = join(projectRoot, 'node_modules', '.bin', 'tauri');
const environment = { ...process.env };

if (process.platform === 'darwin') {
    const configuredSigningIdentity = environment.APPLE_SIGNING_IDENTITY;
    const signingIdentity = resolveMacosSigningIdentity({
        configuredIdentity: configuredSigningIdentity,
        identityOutput: getCodeSigningIdentityOutput(),
        localIdentity: LOCAL_MACOS_SIGNING_IDENTITY,
    });

    if (!isInstallableSigningIdentity(signingIdentity)) {
        console.error(
            'Ad-hoc signing is not supported for installable Daily Planner ' +
                "builds. Use an Apple-issued identity or Daily Planner's " +
                'project-specific local identity.'
        );
        process.exit(1);
    }

    if (!hasCodeSigningIdentity(signingIdentity)) {
        const setupMessage = configuredSigningIdentity
            ? 'Install the configured identity in an available Keychain before building.'
            : 'Run `npm run setup:macos-signing` before building.';
        console.error(
            `Code-signing identity is unavailable: ${signingIdentity}\n` +
                setupMessage
        );
        process.exit(1);
    }

    environment.APPLE_SIGNING_IDENTITY = signingIdentity;
    console.log(`Signing the macOS app as: ${signingIdentity}`);
}

const result = spawnSync(tauriExecutable, ['build', ...process.argv.slice(2)], {
    cwd: projectRoot,
    env: environment,
    stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
