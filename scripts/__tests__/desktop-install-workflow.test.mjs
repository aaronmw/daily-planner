import test from 'node:test';
import assert from 'node:assert/strict';

import { runDesktopInstallWorkflow } from '../desktop-install-workflow.mjs';

const createWorkflow = ({
    wasRunning = true,
    failAt = null,
    rollbackRegistrationFails = false,
} = {}) => {
    const events = [];
    let registrationCount = 0;
    const operation = name => () => {
        events.push(name);
        if (name === failAt) throw new Error(`${name} failed`);
    };

    return {
        events,
        run: () =>
            runDesktopInstallWorkflow({
                wasRunning,
                verifySource: operation('verify-source'),
                stopApp: operation('stop'),
                installApp: operation('install'),
                registerApp: () => {
                    registrationCount += 1;
                    events.push(
                        registrationCount === 1
                            ? 'register-new'
                            : 'register-restored'
                    );
                    if (failAt === 'register-new' && registrationCount === 1) {
                        throw new Error('register-new failed');
                    }
                    if (rollbackRegistrationFails && registrationCount === 2) {
                        throw new Error('register-restored failed');
                    }
                },
                normalizeKeychain: operation('normalize-keychain'),
                commitInstall: operation('commit'),
                rollbackInstall: operation('rollback'),
                relaunchApp: operation('relaunch'),
            }),
    };
};

test('orders source verification, replacement, registration, ACL work, commit, and relaunch', () => {
    const workflow = createWorkflow();
    workflow.run();
    assert.deepEqual(workflow.events, [
        'verify-source',
        'stop',
        'install',
        'register-new',
        'normalize-keychain',
        'commit',
        'relaunch',
    ]);
});

test('does not stop or replace the app when source verification fails', () => {
    const workflow = createWorkflow({ failAt: 'verify-source' });
    assert.throws(workflow.run, /verify-source failed/);
    assert.deepEqual(workflow.events, ['verify-source']);
});

test('restores, re-registers, and relaunches the previous app after registration failure', () => {
    const workflow = createWorkflow({ failAt: 'register-new' });
    assert.throws(workflow.run, /register-new failed/);
    assert.deepEqual(workflow.events, [
        'verify-source',
        'stop',
        'install',
        'register-new',
        'rollback',
        'register-restored',
        'relaunch',
    ]);
});

test('restores, re-registers, and relaunches after ACL normalization failure', () => {
    const workflow = createWorkflow({ failAt: 'normalize-keychain' });
    assert.throws(workflow.run, /normalize-keychain failed/);
    assert.deepEqual(workflow.events, [
        'verify-source',
        'stop',
        'install',
        'register-new',
        'normalize-keychain',
        'rollback',
        'register-restored',
        'relaunch',
    ]);
});

test('still attempts relaunch and reports rollback registration failures', () => {
    const workflow = createWorkflow({
        failAt: 'normalize-keychain',
        rollbackRegistrationFails: true,
    });
    assert.throws(workflow.run, AggregateError);
    assert.equal(workflow.events.at(-1), 'relaunch');
});
