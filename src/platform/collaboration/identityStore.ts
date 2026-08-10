import { z } from 'zod';
import {
    identityIdSchema,
    listIdSchema,
    type IdentityId,
    type ListId,
} from '../../core/domain/ids';
import { type PlannerDatabase, plannerDatabase } from '../persistence/database';
import { decryptRecord, encryptRecord } from '../persistence/recordCrypto';
import { getOrCreateVaultKey } from '../persistence/plannerRepository';
import { base64UrlToBytes, bytesToBase64Url } from './bytes';
import { exportPublicIdentityKey, generateIdentityKeyPair } from './crypto';
import {
    protectAccountKey,
    protectedAccountKeySchema,
    recoverAccountKey,
} from './recovery';

const IDENTITY_RECORD_ID = 'collaboration-identity-v5';
const LIST_KEY_PREFIX = 'collaboration-list-key-v5';
const HANDOFF_PREFIX = 'collaboration-handoff-v5:';
const PRIVATE_KEY_AAD = new TextEncoder().encode(
    'daily-planner-private-identity-key:v1'
);

const pendingHandoffSchema = z.object({
    expiresAt: z.iso.datetime(),
    handoffId: z.uuid(),
    keys: z.array(
        z.object({
            key: z.string().min(1),
            keyVersion: z.number().int().positive(),
            listId: listIdSchema,
        })
    ),
    secret: z.string().min(32),
});

export type PendingIdentityHandoff = z.infer<typeof pendingHandoffSchema>;

const identityRecordSchema = z.object({
    accountKey: z.string().min(1),
    createdAt: z.iso.datetime(),
    email: z.email().nullable(),
    encryptedPrivateKey: z.string().min(1),
    isAnonymous: z.boolean(),
    privateKeyIv: z.string().min(1),
    publicKey: z.string().min(1),
    protectedAccountKey: protectedAccountKeySchema.nullable().default(null),
    userId: identityIdSchema,
});

type CollaborationIdentityRecord = z.infer<typeof identityRecordSchema>;

export interface CollaborationIdentity {
    accountKey: CryptoKey;
    privateKey: CryptoKey;
    publicKey: string;
    record: CollaborationIdentityRecord;
    recoveryCode: string | null;
}

const importAccountKey = (encoded: string): Promise<CryptoKey> =>
    crypto.subtle.importKey(
        'raw',
        base64UrlToBytes(encoded),
        { length: 256, name: 'AES-GCM' },
        true,
        ['decrypt', 'encrypt']
    );

const decryptPrivateKey = async (
    encrypted: string,
    iv: string,
    accountKey: CryptoKey
): Promise<CryptoKey> => {
    const plaintext = await crypto.subtle.decrypt(
        {
            additionalData: PRIVATE_KEY_AAD,
            iv: base64UrlToBytes(iv),
            name: 'AES-GCM',
            tagLength: 128,
        },
        accountKey,
        base64UrlToBytes(encrypted)
    );
    return crypto.subtle.importKey(
        'pkcs8',
        plaintext,
        { hash: 'SHA-256', name: 'RSA-OAEP' },
        false,
        ['unwrapKey']
    );
};

export class CollaborationIdentityStore {
    readonly #database: PlannerDatabase;

    constructor(database: PlannerDatabase = plannerDatabase) {
        this.#database = database;
    }

    async create({
        email,
        isAnonymous,
        userId,
    }: {
        email: string | null;
        isAnonymous: boolean;
        userId: IdentityId;
    }): Promise<CollaborationIdentity> {
        const [accountKey, keyPair, vaultKey] = await Promise.all([
            crypto.subtle.generateKey({ length: 256, name: 'AES-GCM' }, true, [
                'decrypt',
                'encrypt',
            ]),
            generateIdentityKeyPair(),
            getOrCreateVaultKey(this.#database),
        ]);
        const privateKeyIv = crypto.getRandomValues(new Uint8Array(12));
        const [rawAccountKey, publicKey, privateKey, recovery] =
            await Promise.all([
                crypto.subtle.exportKey('raw', accountKey),
                exportPublicIdentityKey(keyPair.publicKey),
                crypto.subtle
                    .exportKey('pkcs8', keyPair.privateKey)
                    .then(value =>
                        crypto.subtle.encrypt(
                            {
                                additionalData: PRIVATE_KEY_AAD,
                                iv: privateKeyIv,
                                name: 'AES-GCM',
                                tagLength: 128,
                            },
                            accountKey,
                            value
                        )
                    ),
                isAnonymous
                    ? Promise.resolve(null)
                    : protectAccountKey(accountKey),
            ]);
        const record: CollaborationIdentityRecord = {
            accountKey: bytesToBase64Url(rawAccountKey),
            createdAt: new Date().toISOString(),
            email,
            encryptedPrivateKey: bytesToBase64Url(privateKey),
            isAnonymous,
            privateKeyIv: bytesToBase64Url(privateKeyIv),
            publicKey,
            protectedAccountKey: recovery?.protectedKey ?? null,
            userId,
        };
        const envelope = await encryptRecord({
            id: IDENTITY_RECORD_ID,
            key: vaultKey,
            keyVersion: 1,
            kind: 'identity-keyring',
            revision: 0,
            value: record,
        });
        await this.#database.records.put({
            ...envelope,
            id: IDENTITY_RECORD_ID,
            kind: 'identity-keyring',
            listId: null,
            updatedAt: record.createdAt,
        });
        return {
            accountKey,
            privateKey: keyPair.privateKey,
            publicKey,
            record,
            recoveryCode: recovery?.recoveryCode ?? null,
        };
    }

    async load(): Promise<CollaborationIdentity | null> {
        const stored = await this.#database.records.get(IDENTITY_RECORD_ID);
        if (!stored) return null;
        const vaultKey = await getOrCreateVaultKey(this.#database);
        const record = identityRecordSchema.parse(
            await decryptRecord<unknown>({
                envelope: stored,
                id: IDENTITY_RECORD_ID,
                key: vaultKey,
                kind: 'identity-keyring',
            })
        );
        const accountKey = await importAccountKey(record.accountKey);
        return {
            accountKey,
            privateKey: await decryptPrivateKey(
                record.encryptedPrivateKey,
                record.privateKeyIv,
                accountKey
            ),
            publicKey: record.publicKey,
            record,
            recoveryCode: null,
        };
    }

    async recover(options: {
        email: string | null;
        encryptedPrivateKey: string;
        privateKeyIv: string;
        protectedAccountKey: unknown;
        publicKey: string;
        recoveryCode: string;
        userId: IdentityId;
    }): Promise<CollaborationIdentity> {
        const [accountKey, vaultKey] = await Promise.all([
            recoverAccountKey(
                options.protectedAccountKey,
                options.recoveryCode
            ),
            getOrCreateVaultKey(this.#database),
        ]);
        const privateKey = await decryptPrivateKey(
            options.encryptedPrivateKey,
            options.privateKeyIv,
            accountKey
        );
        const rawAccountKey = await crypto.subtle.exportKey('raw', accountKey);
        const record: CollaborationIdentityRecord = {
            accountKey: bytesToBase64Url(rawAccountKey),
            createdAt: new Date().toISOString(),
            email: options.email,
            encryptedPrivateKey: options.encryptedPrivateKey,
            isAnonymous: false,
            privateKeyIv: options.privateKeyIv,
            protectedAccountKey: protectedAccountKeySchema.parse(
                options.protectedAccountKey
            ),
            publicKey: options.publicKey,
            userId: options.userId,
        };
        const envelope = await encryptRecord({
            id: IDENTITY_RECORD_ID,
            key: vaultKey,
            keyVersion: 1,
            kind: 'identity-keyring',
            revision: 0,
            value: record,
        });
        await this.#database.records.put({
            ...envelope,
            id: IDENTITY_RECORD_ID,
            kind: 'identity-keyring',
            listId: null,
            updatedAt: record.createdAt,
        });
        return {
            accountKey,
            privateKey,
            publicKey: record.publicKey,
            record,
            recoveryCode: null,
        };
    }

    async upgradeToPermanent(
        email: string | null
    ): Promise<CollaborationIdentity> {
        const identity = await this.load();
        if (!identity) throw new Error('No collaboration identity is stored.');
        if (
            !identity.record.isAnonymous &&
            identity.record.protectedAccountKey
        ) {
            return identity;
        }
        const [recovery, vaultKey] = await Promise.all([
            protectAccountKey(identity.accountKey),
            getOrCreateVaultKey(this.#database),
        ]);
        const record: CollaborationIdentityRecord = {
            ...identity.record,
            email,
            isAnonymous: false,
            protectedAccountKey: recovery.protectedKey,
        };
        const envelope = await encryptRecord({
            id: IDENTITY_RECORD_ID,
            key: vaultKey,
            keyVersion: 1,
            kind: 'identity-keyring',
            revision: 0,
            value: record,
        });
        await this.#database.records.put({
            ...envelope,
            id: IDENTITY_RECORD_ID,
            kind: 'identity-keyring',
            listId: null,
            updatedAt: new Date().toISOString(),
        });
        return {
            ...identity,
            record,
            recoveryCode: recovery.recoveryCode,
        };
    }

    async saveListKey(
        listId: ListId,
        keyVersion: number,
        listKey: CryptoKey
    ): Promise<void> {
        const id = `${LIST_KEY_PREFIX}:${listId}:${keyVersion}`;
        const [rawKey, vaultKey] = await Promise.all([
            crypto.subtle.exportKey('raw', listKey),
            getOrCreateVaultKey(this.#database),
        ]);
        const envelope = await encryptRecord({
            id,
            key: vaultKey,
            keyVersion,
            kind: 'identity-keyring',
            revision: 0,
            value: bytesToBase64Url(rawKey),
        });
        await this.#database.records.put({
            ...envelope,
            id,
            kind: 'identity-keyring',
            listId,
            updatedAt: new Date().toISOString(),
        });
    }

    async loadListKey(
        listId: ListId,
        keyVersion: number
    ): Promise<CryptoKey | null> {
        const id = `${LIST_KEY_PREFIX}:${listId}:${keyVersion}`;
        const stored = await this.#database.records.get(id);
        if (!stored) return null;
        const vaultKey = await getOrCreateVaultKey(this.#database);
        const encoded = await decryptRecord<string>({
            envelope: stored,
            id,
            key: vaultKey,
            kind: 'identity-keyring',
        });
        return crypto.subtle.importKey(
            'raw',
            base64UrlToBytes(encoded),
            { length: 256, name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        );
    }

    async deleteListKey(listId: ListId, keyVersion: number): Promise<void> {
        await this.#database.records.delete(
            `${LIST_KEY_PREFIX}:${listId}:${keyVersion}`
        );
    }

    async savePendingHandoff(handoff: PendingIdentityHandoff): Promise<void> {
        const value = pendingHandoffSchema.parse(handoff);
        const id = `${HANDOFF_PREFIX}${value.handoffId}`;
        const key = await getOrCreateVaultKey(this.#database);
        const envelope = await encryptRecord({
            id,
            key,
            keyVersion: 1,
            kind: 'identity-keyring',
            revision: 0,
            value,
        });
        await this.#database.records.put({
            ...envelope,
            id,
            kind: 'identity-keyring',
            listId: null,
            updatedAt: new Date().toISOString(),
        });
    }

    async loadPendingHandoff(): Promise<PendingIdentityHandoff | null> {
        const records = await this.#database.records
            .filter(record => record.id.startsWith(HANDOFF_PREFIX))
            .toArray();
        const key = await getOrCreateVaultKey(this.#database);
        const values = await Promise.all(
            records.map(async record => ({
                id: record.id,
                value: pendingHandoffSchema.parse(
                    await decryptRecord<unknown>({
                        envelope: record,
                        id: record.id,
                        key,
                        kind: 'identity-keyring',
                    })
                ),
            }))
        );
        const now = Date.now();
        const expired = values.filter(
            item => new Date(item.value.expiresAt).getTime() <= now
        );
        if (expired.length > 0) {
            await this.#database.records.bulkDelete(
                expired.map(item => item.id)
            );
        }
        return (
            values
                .filter(item => new Date(item.value.expiresAt).getTime() > now)
                .sort((left, right) =>
                    right.value.expiresAt.localeCompare(left.value.expiresAt)
                )[0]?.value ?? null
        );
    }

    async deletePendingHandoff(handoffId: string): Promise<void> {
        await this.#database.records.delete(`${HANDOFF_PREFIX}${handoffId}`);
    }

    parseUserId(value: string): IdentityId {
        return identityIdSchema.parse(value);
    }
}
