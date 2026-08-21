import { type PlannerDatabase } from '../persistence/database';
import {
    importLegacyOrigin,
    type KeyValueStorage,
    type LegacyOriginPayload,
} from './legacyOriginMigration';

const HOSTED_ORIGIN = 'https://aaronmw.github.io';
const HOSTED_PATH_PREFIX = '/daily-planner';
const DEFAULT_POLL_INTERVAL_MS = 100;
const MAX_POLL_ATTEMPTS = 300;

export const HOSTED_MIGRATION_MARKER =
    'daily-planner:v5:hosted-origin-migration';

type Invoke = (command: string) => Promise<unknown>;

type ClaimResult =
    | { status: 'pending' }
    | { message: string; status: 'error' }
    | { payload: LegacyOriginPayload; status: 'ready' };

export type HostedOriginPreparation =
    'already-migrated' | 'migrated' | 'not-required';

const isHostedProductionLocation = (location: URL): boolean =>
    location.origin === HOSTED_ORIGIN &&
    (location.pathname === HOSTED_PATH_PREFIX ||
        location.pathname.startsWith(`${HOSTED_PATH_PREFIX}/`));

const hasCompletedMigration = (storage: KeyValueStorage): boolean => {
    const marker = storage.getItem(HOSTED_MIGRATION_MARKER);
    if (!marker) return false;
    try {
        const parsed = JSON.parse(marker) as {
            sourceOrigin?: unknown;
            version?: unknown;
        };
        return (
            parsed.sourceOrigin === 'tauri://localhost' && parsed.version === 1
        );
    } catch {
        return false;
    }
};

const parseClaimResult = (value: unknown): ClaimResult => {
    if (!value || typeof value !== 'object' || !('status' in value)) {
        throw new Error('The native migration bridge returned invalid state.');
    }
    const status = value.status;
    if (status === 'pending') return { status };
    if (status === 'error') {
        const message = (value as { message?: unknown }).message;
        if (typeof message !== 'string') {
            throw new Error(
                'The native migration bridge returned an invalid error.'
            );
        }
        return { message, status };
    }
    if (status === 'ready') {
        const payload = (value as { payload?: unknown }).payload;
        if (!payload || typeof payload !== 'object') {
            throw new Error(
                'The native migration bridge returned an invalid payload.'
            );
        }
        return { payload: payload as LegacyOriginPayload, status };
    }
    throw new Error('The native migration bridge returned unknown state.');
};

const wait = (duration: number): Promise<void> =>
    new Promise(resolve => window.setTimeout(resolve, duration));

export const prepareHostedOrigin = async ({
    database,
    invoke,
    isDesktop,
    location,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    storage,
}: {
    database: PlannerDatabase;
    invoke: Invoke;
    isDesktop: boolean;
    location: URL;
    pollIntervalMs?: number;
    storage: KeyValueStorage;
}): Promise<HostedOriginPreparation> => {
    if (!isDesktop || !isHostedProductionLocation(location)) {
        return 'not-required';
    }
    if (hasCompletedMigration(storage)) {
        await invoke('complete_legacy_migration');
        return 'already-migrated';
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
        const result = parseClaimResult(await invoke('claim_legacy_migration'));
        if (result.status === 'pending') {
            await wait(pollIntervalMs);
            continue;
        }
        if (result.status === 'error') throw new Error(result.message);

        await importLegacyOrigin(result.payload, database, storage);
        storage.setItem(
            HOSTED_MIGRATION_MARKER,
            JSON.stringify({
                completedAt: new Date().toISOString(),
                sourceOrigin: 'tauri://localhost',
                version: 1,
            })
        );
        await invoke('complete_legacy_migration');
        return 'migrated';
    }
    throw new Error(
        'Timed out while waiting for the encrypted local-data migration bridge.'
    );
};
