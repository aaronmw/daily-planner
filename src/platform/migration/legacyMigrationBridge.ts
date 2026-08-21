import { invoke } from '@tauri-apps/api/core';
import { plannerDatabase } from '../persistence/database';
import { exportLegacyOrigin } from './legacyOriginMigration';

const messageForError = (error: unknown): string =>
    error instanceof Error
        ? error.message
        : 'The legacy origin could not be exported.';

const publishLegacyOrigin = async (): Promise<void> => {
    try {
        const payload = await exportLegacyOrigin(plannerDatabase, localStorage);
        await invoke('publish_legacy_migration', { payload });
    } catch (error) {
        await invoke('publish_legacy_migration_error', {
            message: messageForError(error),
        });
    }
};

void publishLegacyOrigin();
