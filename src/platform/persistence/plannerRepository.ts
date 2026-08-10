import type {
    PlannerMutation,
    PlannerRepository,
    QueuedPlannerMutation,
} from '../../core/application/ports';
import type { ListId } from '../../core/domain/ids';
import {
    plannerListSchema,
    plannerItemSchema,
} from '../../core/domain/schemas';
import type {
    PlannerList,
    PlannerSnapshot,
    PlannerItem,
} from '../../core/domain/types';
import {
    type PlannerDatabase,
    plannerDatabase,
    type EncryptedRecordKind,
    type StoredEncryptedRecord,
    type StoredOutboxOperation,
} from './database';
import { createVaultKey, decryptRecord, encryptRecord } from './recordCrypto';

const VAULT_KEY_ID = 'planner-vault-key';

export const getOrCreateVaultKey = async (
    database: PlannerDatabase = plannerDatabase
): Promise<CryptoKey> => {
    const stored = await database.keys.get(VAULT_KEY_ID);
    if (stored) return stored.key;
    const key = await createVaultKey();
    await database.keys.add({ id: VAULT_KEY_ID, key });
    return key;
};

export class EncryptedDexiePlannerRepository implements PlannerRepository {
    readonly #database: PlannerDatabase;

    constructor(database: PlannerDatabase = plannerDatabase) {
        this.#database = database;
    }

    async #getVaultKey(): Promise<CryptoKey> {
        return getOrCreateVaultKey(this.#database);
    }

    async apply(
        mutations: readonly PlannerMutation[],
        options: { enqueueForSync?: boolean } = {}
    ): Promise<void> {
        const key = await this.#getVaultKey();
        const puts = await Promise.all(
            mutations.flatMap(mutation => {
                if (!('entity' in mutation)) return [];
                const kind = mutation.type === 'put-list' ? 'list' : 'item';
                const { entity } = mutation;
                const listId =
                    mutation.type === 'put-list'
                        ? mutation.entity.id
                        : mutation.entity.listId;
                return encryptRecord({
                    id: entity.id,
                    key,
                    keyVersion: entity.keyVersion,
                    kind,
                    revision: entity.revision,
                    value: entity,
                }).then((envelope): StoredEncryptedRecord => ({
                    ...envelope,
                    id: entity.id,
                    kind,
                    listId,
                    updatedAt: entity.updatedAt,
                }));
            })
        );
        const outbox = options.enqueueForSync
            ? await Promise.all(
                  mutations.map(async mutation => {
                      const id = crypto.randomUUID();
                      const createdAt = new Date().toISOString();
                      const envelope = await encryptRecord({
                          id,
                          key,
                          keyVersion: 1,
                          kind: 'outbox',
                          revision: 0,
                          value: mutation,
                      });
                      return {
                          ...envelope,
                          createdAt,
                          id,
                          listId:
                              'entity' in mutation &&
                              'listId' in mutation.entity
                                  ? mutation.entity.listId
                                  : mutation.type === 'put-list'
                                    ? mutation.entity.id
                                    : null,
                          recordId:
                              'entity' in mutation
                                  ? mutation.entity.id
                                  : mutation.id,
                      } satisfies StoredOutboxOperation;
                  })
              )
            : [];

        await this.#database.transaction(
            'rw',
            this.#database.records,
            this.#database.outbox,
            async () => {
                if (puts.length > 0) await this.#database.records.bulkPut(puts);
                for (const mutation of mutations) {
                    if (mutation.type === 'delete-list') {
                        await this.#database.records.delete(mutation.id);
                        await this.#database.records
                            .where('[kind+listId]')
                            .equals(['item', mutation.id])
                            .delete();
                    } else if (mutation.type === 'delete-item') {
                        await this.#database.records.delete(mutation.id);
                    }
                }
                if (outbox.length > 0)
                    await this.#database.outbox.bulkAdd(outbox);
            }
        );
    }

    async deleteOutbox(ids: readonly string[]): Promise<void> {
        await this.#database.outbox.bulkDelete([...ids]);
    }

    async #decrypt<Value>(
        record: StoredEncryptedRecord,
        kind: EncryptedRecordKind
    ): Promise<Value> {
        const key = await this.#getVaultKey();
        return decryptRecord<Value>({
            envelope: record,
            id: record.id,
            key,
            kind,
        });
    }

    async load(): Promise<PlannerSnapshot> {
        const [listRecords, itemRecords] = await Promise.all([
            this.#database.records.where('kind').equals('list').toArray(),
            this.#database.records.where('kind').equals('item').toArray(),
        ]);
        const [lists, items] = await Promise.all([
            Promise.all(
                listRecords.map(async record =>
                    plannerListSchema.parse(
                        await this.#decrypt<PlannerList>(record, 'list')
                    )
                )
            ),
            Promise.all(
                itemRecords.map(async record =>
                    plannerItemSchema.parse(
                        await this.#decrypt<PlannerItem>(record, 'item')
                    )
                )
            ),
        ]);
        return { lists, items };
    }

    async loadOutbox(limit = 100): Promise<QueuedPlannerMutation[]> {
        const key = await this.#getVaultKey();
        const records = await this.#database.outbox
            .orderBy('createdAt')
            .limit(limit)
            .toArray();
        return Promise.all(
            records.map(async record => ({
                createdAt: record.createdAt,
                id: record.id,
                listId: record.listId as ListId | null,
                mutation: await decryptRecord<PlannerMutation>({
                    envelope: record,
                    id: record.id,
                    key,
                    kind: 'outbox',
                }),
            }))
        );
    }

    async replace(snapshot: PlannerSnapshot): Promise<void> {
        const key = await this.#getVaultKey();
        const puts = await Promise.all([
            ...snapshot.lists.map(async entity => ({
                ...(await encryptRecord({
                    id: entity.id,
                    key,
                    keyVersion: entity.keyVersion,
                    kind: 'list',
                    revision: entity.revision,
                    value: entity,
                })),
                id: entity.id,
                kind: 'list' as const,
                listId: entity.id,
                updatedAt: entity.updatedAt,
            })),
            ...snapshot.items.map(async entity => ({
                ...(await encryptRecord({
                    id: entity.id,
                    key,
                    keyVersion: entity.keyVersion,
                    kind: 'item',
                    revision: entity.revision,
                    value: entity,
                })),
                id: entity.id,
                kind: 'item' as const,
                listId: entity.listId,
                updatedAt: entity.updatedAt,
            })),
        ]);
        await this.#database.transaction(
            'rw',
            this.#database.records,
            async () => {
                const currentIds = await this.#database.records
                    .where('kind')
                    .anyOf('list', 'item')
                    .primaryKeys();
                await this.#database.records.bulkDelete(currentIds);
                await this.#database.records.bulkPut(puts);
            }
        );
    }
}
