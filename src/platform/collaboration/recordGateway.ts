import type { Session } from '@supabase/supabase-js';
import { z } from 'zod';
import type {
    CollaborationPublishResult,
    PlannerMutation,
} from '../../core/application/ports';
import {
    identityIdSchema,
    listIdSchema,
    itemIdSchema,
    type ListId,
} from '../../core/domain/ids';
import {
    plannerListSchema,
    plannerItemSchema,
} from '../../core/domain/schemas';
import type {
    PlannerList,
    PlannerSnapshot,
    PlannerItem,
} from '../../core/domain/types';
import type {
    CollaborationComment,
    CollaborationInvitation,
    CollaborationMembership,
    CollaborationProfile,
    CollaborationSnapshot,
    CollaborationThreadRead,
} from '../../core/collaboration/types';
import type { CollaborationConflict } from '../../core/collaboration/types';
import type { Tables } from './database.types';
import {
    decryptCollaborationRecord,
    encryptCollaborationRecord,
    exportListKey,
    generateListKey,
    importListKey,
    importPublicIdentityKey,
    unwrapListKey,
    wrapListKey,
} from './crypto';
import { bytesToBase64Url, utf8ToBytes } from './bytes';
import {
    CollaborationIdentityStore,
    type CollaborationIdentity,
    type PendingIdentityHandoff,
} from './identityStore';
import { requireSupabaseClient } from './supabaseClient';
import { RECOVERY_ITERATIONS } from './recovery';
import {
    SupabaseEncryptedAttachmentGateway,
    type AttachmentMetadata,
} from './cloudAttachmentGateway';

type ListRow = Tables<'encrypted_lists'>;
type ItemRow = Tables<'encrypted_items'>;
type KeyEnvelopeRow = Tables<'list_key_envelopes'>;
type MembershipRow = Tables<'list_memberships'>;
type ProfileRow = Tables<'encrypted_member_profiles'>;
type CommentRow = Tables<'encrypted_comments'>;
type ThreadReadRow = Tables<'thread_reads'>;
type InvitationRow = Tables<'list_invitations'>;

const displayNameForIdentity = (identity: CollaborationIdentity): string => {
    const emailPrefix = identity.record.email?.split('@')[0];
    return emailPrefix && emailPrefix.length > 0
        ? emailPrefix
        : `Planner ${identity.record.userId.slice(0, 6)}`;
};

const listRowSchema = z.object({
    ciphertext: z.string().min(1),
    content_revision: z.number().int().positive(),
    current_key_version: z.number().int().positive(),
    deleted_at: z.string().nullable(),
    id: z.uuid(),
    iv: z.string().min(1),
    key_version: z.number().int().positive(),
    owner_id: z.uuid(),
    revision: z.number().int().positive(),
});

const itemRowSchema = z.object({
    ciphertext: z.string().min(1),
    content_revision: z.number().int().positive(),
    creator_id: z.uuid(),
    deleted_at: z.string().nullable(),
    id: z.uuid(),
    iv: z.string().min(1),
    key_version: z.number().int().positive(),
    list_id: z.uuid(),
    revision: z.number().int().positive(),
});

const keyEnvelopeSchema = z.object({
    key_version: z.number().int().positive(),
    list_id: z.uuid(),
    user_id: z.uuid(),
    wrapped_key: z.string().min(1),
});

const profileRowSchema = z.object({
    ciphertext: z.string().min(1),
    content_revision: z.number().int().positive(),
    iv: z.string().min(1),
    key_version: z.number().int().positive(),
    list_id: z.uuid(),
    revision: z.number().int().positive(),
    user_id: z.uuid(),
});

const commentRowSchema = z.object({
    author_id: z.uuid(),
    ciphertext: z.string().min(1),
    content_revision: z.number().int().positive(),
    created_at: z.iso.datetime(),
    deleted_at: z.string().nullable(),
    id: z.uuid(),
    iv: z.string().min(1),
    key_version: z.number().int().positive(),
    list_id: z.uuid(),
    parent_comment_id: z.string().nullable(),
    revision: z.number().int().positive(),
    item_id: z.uuid(),
    updated_at: z.iso.datetime(),
});

const profileValueSchema = z.object({
    avatarSeed: z.string().min(1),
    displayName: z.string().min(1),
    email: z.string().nullable(),
});

const commentValueSchema = z.object({ body: z.string() });

const selectAll = async <Value>(
    loadPage: (
        from: number,
        to: number
    ) => PromiseLike<{ data: Value[] | null; error: Error | null }>,
    pageSize = 500
): Promise<Value[]> => {
    const values: Value[] = [];
    for (let from = 0; ; from += pageSize) {
        const page = throwIfError(await loadPage(from, from + pageSize - 1));
        values.push(...(page ?? []));
        if (!page || page.length < pageSize) return values;
    }
};

const throwIfError = <Value>({
    data,
    error,
}: {
    data: Value;
    error: Error | null;
}): Value => {
    if (error) throw error;
    return data;
};

const recordEnvelope = (row: {
    ciphertext: string;
    iv: string;
    key_version: number;
}) => ({
    algorithm: 'AES-256-GCM' as const,
    ciphertext: row.ciphertext,
    iv: row.iv,
    keyVersion: row.key_version,
    version: 1 as const,
});

const NON_CONTENT_FIELDS = new Set([
    'keyVersion',
    'ownerIdentityId',
    'creatorIdentityId',
    'revision',
    'updatedAt',
]);

const changedKeys = <Entity extends object>(
    base: Entity,
    value: Entity
): Set<keyof Entity> =>
    new Set(
        (Object.keys(value) as (keyof Entity)[]).filter(
            key =>
                !NON_CONTENT_FIELDS.has(String(key)) &&
                JSON.stringify(base[key]) !== JSON.stringify(value[key])
        )
    );

export const mergeDisjointChanges = <Entity extends object>(
    base: Entity,
    local: Entity,
    remote: Entity
): Entity | null => {
    const localChanges = changedKeys(base, local);
    const remoteChanges = changedKeys(base, remote);
    if ([...localChanges].some(key => remoteChanges.has(key))) return null;
    const merged = { ...remote };
    localChanges.forEach(key => {
        merged[key] = local[key];
    });
    return merged;
};

type PublishOutcome =
    { applied: PlannerMutation } | { conflict: CollaborationConflict };

export class CollaborationRecordGateway {
    readonly #identities: CollaborationIdentityStore;

    constructor(identityStore = new CollaborationIdentityStore()) {
        this.#identities = identityStore;
    }

    async ensureIdentity(session: Session): Promise<CollaborationIdentity> {
        const userId = identityIdSchema.parse(session.user.id);
        const local = await this.#identities.load();
        if (local?.record.userId === userId) return local;
        const pendingHandoff = await this.#identities.loadPendingHandoff();
        if (local && !pendingHandoff) {
            throw new Error(
                'This device vault belongs to another collaboration identity.'
            );
        }
        const supabase = requireSupabaseClient();
        const existing = throwIfError(
            await supabase
                .from('collaboration_identities')
                .select('user_id')
                .eq('user_id', userId)
                .maybeSingle()
        );
        if (existing) {
            throw new Error(
                'This collaboration identity requires its recovery key on this device.'
            );
        }
        const identity = await this.#identities.create({
            email: session.user.email ?? null,
            isAnonymous: session.user.is_anonymous ?? false,
            userId,
        });
        const protectedKey = identity.record.protectedAccountKey;
        throwIfError(
            await supabase.rpc('register_collaboration_identity', {
                p_encrypted_private_key: identity.record.encryptedPrivateKey,
                p_private_key_iv: identity.record.privateKeyIv,
                p_public_key: identity.publicKey,
                ...(protectedKey
                    ? {
                          p_account_key_iv: protectedKey.iv,
                          p_encrypted_account_key: protectedKey.ciphertext,
                          p_recovery_iv: protectedKey.iv,
                          p_recovery_salt: protectedKey.salt,
                      }
                    : {}),
            })
        );
        if (pendingHandoff) {
            await this.#claimIdentityHandoff(identity, pendingHandoff);
        }
        return identity;
    }

    async recoverIdentity(
        session: Session,
        recoveryCode: string
    ): Promise<CollaborationIdentity> {
        const userId = identityIdSchema.parse(session.user.id);
        const local = await this.#identities.load();
        if (local?.record.userId === userId) return local;
        const pendingHandoff = await this.#identities.loadPendingHandoff();
        if (local && !pendingHandoff) {
            throw new Error(
                'This device vault belongs to another collaboration identity.'
            );
        }
        const supabase = requireSupabaseClient();
        const [identityResult, keyringResult] = await Promise.all([
            supabase
                .from('collaboration_identities')
                .select('public_key')
                .eq('user_id', userId)
                .single(),
            supabase
                .from('identity_keyrings')
                .select(
                    'encrypted_private_key,encrypted_account_key,private_key_iv,recovery_iv,recovery_salt'
                )
                .eq('user_id', userId)
                .single(),
        ]);
        const identityRow = throwIfError(identityResult);
        const keyring = throwIfError(keyringResult);
        if (
            !identityRow ||
            !keyring?.encrypted_account_key ||
            !keyring.recovery_iv ||
            !keyring.recovery_salt
        ) {
            throw new Error(
                'This identity is device-bound and has no recovery key.'
            );
        }
        const identity = await this.#identities.recover({
            email: session.user.email ?? null,
            encryptedPrivateKey: keyring.encrypted_private_key,
            privateKeyIv: keyring.private_key_iv,
            protectedAccountKey: {
                algorithm: 'AES-256-GCM',
                ciphertext: keyring.encrypted_account_key,
                iterations: RECOVERY_ITERATIONS,
                iv: keyring.recovery_iv,
                kdf: 'PBKDF2-SHA256',
                salt: keyring.recovery_salt,
                version: 1,
            },
            publicKey: identityRow.public_key,
            recoveryCode,
            userId,
        });
        if (pendingHandoff) {
            await this.#claimIdentityHandoff(identity, pendingHandoff);
        }
        return identity;
    }

    async finalizeAccount(session: Session): Promise<CollaborationIdentity> {
        if (session.user.is_anonymous) {
            return this.ensureIdentity(session);
        }
        const local = await this.#identities.load();
        if (local?.record.userId !== session.user.id) {
            if (await this.#identities.loadPendingHandoff()) {
                return this.ensureIdentity(session);
            }
            throw new Error(
                'This account belongs to another encrypted vault. Enter its recovery key to continue on this device.'
            );
        }
        const identity = await this.#identities.upgradeToPermanent(
            session.user.email ?? null
        );
        const protectedKey = identity.record.protectedAccountKey;
        if (!protectedKey) {
            throw new Error(
                'The permanent account recovery key is unavailable.'
            );
        }
        const supabase = requireSupabaseClient();
        const keyring = throwIfError(
            await supabase
                .from('identity_keyrings')
                .select('revision,encrypted_account_key')
                .eq('user_id', session.user.id)
                .single()
        );
        if (!keyring) throw new Error('The account keyring is unavailable.');
        if (!keyring.encrypted_account_key) {
            throwIfError(
                await supabase.rpc('update_collaboration_keyring', {
                    p_account_key_iv: protectedKey.iv,
                    p_encrypted_account_key: protectedKey.ciphertext,
                    p_encrypted_private_key:
                        identity.record.encryptedPrivateKey,
                    p_expected_revision: keyring.revision,
                    p_private_key_iv: identity.record.privateKeyIv,
                    p_public_key: identity.publicKey,
                    p_recovery_iv: protectedKey.iv,
                    p_recovery_salt: protectedKey.salt,
                })
            );
        }
        return identity;
    }

    async createIdentityHandoff(): Promise<void> {
        const identity = await this.#identities.load();
        if (!identity?.record.isAnonymous) {
            throw new Error('A guest identity is required for handoff.');
        }
        const supabase = requireSupabaseClient();
        const envelopes = await selectAll<KeyEnvelopeRow>((from, to) =>
            supabase
                .from('list_key_envelopes')
                .select('*')
                .eq('user_id', identity.record.userId)
                .range(from, to)
        );
        const keys = await Promise.all(
            envelopes.map(async envelope => ({
                key: await exportListKey(
                    await this.#listKey(
                        identity,
                        listIdSchema.parse(envelope.list_id),
                        envelope.key_version
                    )
                ),
                keyVersion: envelope.key_version,
                listId: listIdSchema.parse(envelope.list_id),
            }))
        );
        const handoffId = crypto.randomUUID();
        const secret = bytesToBase64Url(
            crypto.getRandomValues(new Uint8Array(new ArrayBuffer(32)))
        );
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const secretHash = Array.from(
            new Uint8Array(
                await crypto.subtle.digest('SHA-256', utf8ToBytes(secret))
            ),
            byte => byte.toString(16).padStart(2, '0')
        ).join('');
        throwIfError(
            await supabase.rpc('create_identity_handoff', {
                p_expires_at: expiresAt,
                p_handoff_id: handoffId,
                p_secret_hash: secretHash,
            })
        );
        await this.#identities.savePendingHandoff({
            expiresAt,
            handoffId,
            keys,
            secret,
        });
    }

    async #claimIdentityHandoff(
        identity: CollaborationIdentity,
        pending: PendingIdentityHandoff
    ): Promise<void> {
        const publicKey = await importPublicIdentityKey(identity.publicKey);
        const rewrappedKeys = await Promise.all(
            pending.keys.map(async entry => ({
                key_version: entry.keyVersion,
                list_id: entry.listId,
                wrapped_key: await wrapListKey(
                    await importListKey(entry.key),
                    publicKey
                ),
                wrapped_key_iv: 'rsa-oaep',
            }))
        );
        const currentByList = new Map<ListId, (typeof pending.keys)[number]>();
        pending.keys.forEach(entry => {
            const current = currentByList.get(entry.listId);
            if (!current || entry.keyVersion > current.keyVersion) {
                currentByList.set(entry.listId, entry);
            }
        });
        const profiles = await Promise.all(
            [...currentByList.values()].map(async entry => {
                const envelope = await encryptCollaborationRecord(
                    await importListKey(entry.key),
                    {
                        keyVersion: entry.keyVersion,
                        listId: entry.listId,
                        recordId: identity.record.userId,
                        recordType: 'profile',
                        revision: 1,
                    },
                    {
                        avatarSeed: identity.record.userId,
                        displayName: displayNameForIdentity(identity),
                        email: identity.record.email,
                    }
                );
                return {
                    ciphertext: envelope.ciphertext,
                    iv: envelope.iv,
                    key_version: entry.keyVersion,
                    list_id: entry.listId,
                };
            })
        );
        throwIfError(
            await requireSupabaseClient().rpc('claim_identity_handoff', {
                p_handoff_id: pending.handoffId,
                p_reencrypted_profiles: profiles,
                p_rewrapped_keys: rewrappedKeys,
                p_secret: pending.secret,
            })
        );
        for (const entry of pending.keys) {
            await this.#identities.saveListKey(
                entry.listId,
                entry.keyVersion,
                await importListKey(entry.key)
            );
        }
        await this.#identities.deletePendingHandoff(pending.handoffId);
    }

    async loadListKey(
        identity: CollaborationIdentity,
        listId: ListId,
        keyVersion: number
    ): Promise<CryptoKey> {
        return this.#listKey(identity, listId, keyVersion);
    }

    async saveListKey(
        listId: ListId,
        keyVersion: number,
        listKey: CryptoKey
    ): Promise<void> {
        await this.#identities.saveListKey(listId, keyVersion, listKey);
    }

    async deleteListKey(listId: ListId, keyVersion: number): Promise<void> {
        await this.#identities.deleteListKey(listId, keyVersion);
    }

    async #listKey(
        identity: CollaborationIdentity,
        listId: ListId,
        keyVersion: number,
        envelopes?: readonly KeyEnvelopeRow[]
    ): Promise<CryptoKey> {
        const stored = await this.#identities.loadListKey(listId, keyVersion);
        if (stored) return stored;
        const supabase = requireSupabaseClient();
        const envelope =
            envelopes?.find(
                candidate =>
                    candidate.list_id === listId &&
                    candidate.key_version === keyVersion &&
                    candidate.user_id === identity.record.userId
            ) ??
            throwIfError(
                await supabase
                    .from('list_key_envelopes')
                    .select('*')
                    .eq('list_id', listId)
                    .eq('key_version', keyVersion)
                    .eq('user_id', identity.record.userId)
                    .single()
            );
        const parsed = keyEnvelopeSchema.parse(envelope);
        const key = await unwrapListKey(
            parsed.wrapped_key,
            identity.privateKey
        );
        await this.#identities.saveListKey(listId, keyVersion, key);
        return key;
    }

    async loadSnapshot(
        identity: CollaborationIdentity
    ): Promise<CollaborationSnapshot> {
        const supabase = requireSupabaseClient();
        const [
            listRowsRaw,
            itemRowsRaw,
            envelopeRowsRaw,
            membershipRows,
            profileRowsRaw,
            commentRowsRaw,
            threadReadRows,
            invitationRows,
        ] = await Promise.all([
            selectAll<ListRow>((from, to) =>
                supabase.from('encrypted_lists').select('*').range(from, to)
            ),
            selectAll<ItemRow>((from, to) =>
                supabase.from('encrypted_items').select('*').range(from, to)
            ),
            selectAll<KeyEnvelopeRow>((from, to) =>
                supabase.from('list_key_envelopes').select('*').range(from, to)
            ),
            selectAll<MembershipRow>((from, to) =>
                supabase.from('list_memberships').select('*').range(from, to)
            ),
            selectAll<ProfileRow>((from, to) =>
                supabase
                    .from('encrypted_member_profiles')
                    .select('*')
                    .range(from, to)
            ),
            selectAll<CommentRow>((from, to) =>
                supabase.from('encrypted_comments').select('*').range(from, to)
            ),
            selectAll<ThreadReadRow>((from, to) =>
                supabase.from('thread_reads').select('*').range(from, to)
            ),
            selectAll<InvitationRow>((from, to) =>
                supabase.from('list_invitations').select('*').range(from, to)
            ),
        ]);
        const listRows = z.array(listRowSchema).parse(listRowsRaw);
        const itemRows = z.array(itemRowSchema).parse(itemRowsRaw);
        const envelopes = z.array(keyEnvelopeSchema).parse(envelopeRowsRaw);
        const lists = await Promise.all(
            listRows.map(async raw => {
                const row = raw as ListRow;
                const id = listIdSchema.parse(row.id);
                const key = await this.#listKey(
                    identity,
                    id,
                    row.key_version,
                    envelopes as KeyEnvelopeRow[]
                );
                const value = await decryptCollaborationRecord<PlannerList>(
                    key,
                    {
                        keyVersion: row.key_version,
                        listId: row.id,
                        recordId: row.id,
                        recordType: 'list',
                        revision: row.content_revision,
                    },
                    recordEnvelope(row)
                );
                return plannerListSchema.parse({
                    ...value,
                    id,
                    isArchived: Boolean(row.deleted_at),
                    isPrivateCopy: false,
                    keyVersion: row.current_key_version,
                    ownerIdentityId: identityIdSchema.parse(row.owner_id),
                    revision: row.content_revision,
                });
            })
        );
        const items = await Promise.all(
            itemRows.map(async raw => {
                const row = raw as ItemRow;
                const listId = listIdSchema.parse(row.list_id);
                const key = await this.#listKey(
                    identity,
                    listId,
                    row.key_version,
                    envelopes as KeyEnvelopeRow[]
                );
                const value = await decryptCollaborationRecord<PlannerItem>(
                    key,
                    {
                        keyVersion: row.key_version,
                        listId: row.list_id,
                        recordId: row.id,
                        recordType: 'item',
                        revision: row.content_revision,
                    },
                    recordEnvelope(row)
                );
                return plannerItemSchema.parse({
                    ...value,
                    creatorIdentityId: identityIdSchema.parse(row.creator_id),
                    id: itemIdSchema.parse(row.id),
                    isArchived: Boolean(row.deleted_at),
                    isPrivateCopy: false,
                    keyVersion: row.key_version,
                    listId,
                    revision: row.content_revision,
                });
            })
        );
        const membershipStateByProfile = new Map(
            membershipRows.map(membership => [
                `${membership.list_id}:${membership.user_id}`,
                membership.state,
            ])
        );
        const profiles = await Promise.all(
            z
                .array(profileRowSchema)
                .parse(profileRowsRaw)
                .map(async raw => {
                    const row = raw as ProfileRow;
                    const listId = listIdSchema.parse(row.list_id);
                    const userId = identityIdSchema.parse(row.user_id);
                    const key = await this.#listKey(
                        identity,
                        listId,
                        row.key_version,
                        envelopes as KeyEnvelopeRow[]
                    );
                    const value = profileValueSchema.parse(
                        await decryptCollaborationRecord<unknown>(
                            key,
                            {
                                keyVersion: row.key_version,
                                listId: row.list_id,
                                recordId: row.user_id,
                                recordType: 'profile',
                                revision: row.content_revision,
                            },
                            recordEnvelope(row)
                        )
                    );
                    return {
                        ...value,
                        isFormerCollaborator:
                            membershipStateByProfile.get(
                                `${row.list_id}:${row.user_id}`
                            ) === 'removed',
                        listId,
                        revision: row.content_revision,
                        userId,
                    } satisfies CollaborationProfile;
                })
        );
        const comments = await Promise.all(
            z
                .array(commentRowSchema)
                .parse(commentRowsRaw)
                .filter(row => !row.deleted_at)
                .map(async raw => {
                    const row = raw;
                    const listId = listIdSchema.parse(row.list_id);
                    const key = await this.#listKey(
                        identity,
                        listId,
                        row.key_version,
                        envelopes as KeyEnvelopeRow[]
                    );
                    const value = commentValueSchema.parse(
                        await decryptCollaborationRecord<unknown>(
                            key,
                            {
                                keyVersion: row.key_version,
                                listId: row.list_id,
                                recordId: row.id,
                                recordType: 'comment',
                                revision: row.content_revision,
                            },
                            recordEnvelope(row)
                        )
                    );
                    return {
                        authorId: identityIdSchema.parse(row.author_id),
                        body: value.body,
                        createdAt: row.created_at,
                        deletedAt: row.deleted_at,
                        id: row.id,
                        listId,
                        parentCommentId: row.parent_comment_id,
                        revision: row.revision,
                        itemId: itemIdSchema.parse(row.item_id),
                        updatedAt: row.updated_at,
                    } satisfies CollaborationComment;
                })
        );
        const memberships = membershipRows.map(
            row =>
                ({
                    joinedAt: row.joined_at,
                    listId: listIdSchema.parse(row.list_id),
                    removedAt: row.removed_at,
                    revision: row.revision,
                    role: row.role,
                    state: row.state,
                    updatedAt: row.updated_at,
                    userId: identityIdSchema.parse(row.user_id),
                }) satisfies CollaborationMembership
        );
        const threadReads = threadReadRows.map(
            row =>
                ({
                    lastReadAt: row.last_read_at,
                    listId: listIdSchema.parse(row.list_id),
                    itemId: itemIdSchema.parse(row.item_id),
                    userId: identityIdSchema.parse(row.user_id),
                }) satisfies CollaborationThreadRead
        );
        const invitations = invitationRows.map(
            row =>
                ({
                    createdAt: row.created_at,
                    expiresAt: row.expires_at,
                    id: row.id,
                    listId: listIdSchema.parse(row.list_id),
                    role: row.role as CollaborationInvitation['role'],
                    revokedAt: row.revoked_at,
                    url: null,
                    usedAt: row.used_at,
                }) satisfies CollaborationInvitation
        );
        return {
            comments,
            identity: {
                email: identity.record.email,
                isAnonymous: identity.record.isAnonymous,
                recoveryCode: identity.recoveryCode,
                userId: identity.record.userId,
            },
            invitations,
            memberships,
            planner: { lists, items },
            profiles,
            threadReads,
        };
    }

    async importSnapshot(
        identity: CollaborationIdentity,
        snapshot: PlannerSnapshot
    ): Promise<CollaborationSnapshot> {
        const supabase = requireSupabaseClient();
        for (const list of snapshot.lists) {
            const existing = throwIfError(
                await supabase
                    .from('encrypted_lists')
                    .select('id')
                    .eq('id', list.id)
                    .maybeSingle()
            );
            if (existing) continue;
            const listKey = await generateListKey();
            const listEnvelope = await encryptCollaborationRecord(
                listKey,
                {
                    keyVersion: 1,
                    listId: list.id,
                    recordId: list.id,
                    recordType: 'list',
                    revision: 1,
                },
                { ...list, keyVersion: 1, revision: 1 }
            );
            const publicKey = await importPublicIdentityKey(identity.publicKey);
            const wrappedKey = await wrapListKey(listKey, publicKey);
            throwIfError(
                await supabase.rpc('create_encrypted_list', {
                    p_ciphertext: listEnvelope.ciphertext,
                    p_iv: listEnvelope.iv,
                    p_list_id: list.id,
                    p_wrapped_key: wrappedKey,
                    p_wrapped_key_iv: 'rsa-oaep',
                })
            );
            await this.#identities.saveListKey(list.id, 1, listKey);
            await this.#upsertOwnProfile(identity, list.id, 1, listKey);
            for (const item of snapshot.items.filter(
                candidate => candidate.listId === list.id
            )) {
                const itemEnvelope = await encryptCollaborationRecord(
                    listKey,
                    {
                        keyVersion: 1,
                        listId: list.id,
                        recordId: item.id,
                        recordType: 'item',
                        revision: 1,
                    },
                    { ...item, keyVersion: 1, revision: 1 }
                );
                throwIfError(
                    await supabase.rpc('create_encrypted_item', {
                        p_ciphertext: itemEnvelope.ciphertext,
                        p_iv: itemEnvelope.iv,
                        p_key_version: 1,
                        p_list_id: list.id,
                        p_item_id: item.id,
                    })
                );
            }
        }
        return this.loadSnapshot(identity);
    }

    async #upsertOwnProfile(
        identity: CollaborationIdentity,
        listId: ListId,
        keyVersion: number,
        listKey: CryptoKey
    ): Promise<void> {
        const supabase = requireSupabaseClient();
        const current = throwIfError(
            await supabase
                .from('encrypted_member_profiles')
                .select('content_revision')
                .eq('list_id', listId)
                .eq('user_id', identity.record.userId)
                .maybeSingle()
        );
        const expectedRevision = current?.content_revision ?? 0;
        const nextRevision = expectedRevision + 1;
        const envelope = await encryptCollaborationRecord(
            listKey,
            {
                keyVersion,
                listId,
                recordId: identity.record.userId,
                recordType: 'profile',
                revision: nextRevision,
            },
            {
                avatarSeed: identity.record.userId,
                displayName: displayNameForIdentity(identity),
                email: identity.record.email,
            }
        );
        throwIfError(
            await supabase.rpc('upsert_encrypted_member_profile', {
                p_ciphertext: envelope.ciphertext,
                p_expected_revision: expectedRevision,
                p_iv: envelope.iv,
                p_key_version: keyVersion,
                p_list_id: listId,
            })
        );
    }

    async publish(
        identity: CollaborationIdentity,
        mutations: readonly PlannerMutation[]
    ): Promise<CollaborationPublishResult> {
        const result: CollaborationPublishResult = {
            applied: [],
            conflicts: [],
        };
        for (const mutation of mutations) {
            let outcome: PublishOutcome;
            if (mutation.type === 'put-list') {
                outcome = await this.#publishList(identity, mutation);
            } else if (mutation.type === 'put-item') {
                outcome = await this.#publishItem(identity, mutation);
            } else {
                await this.#publishDeletion(mutation);
                outcome = { applied: mutation };
            }
            if ('applied' in outcome) result.applied.push(outcome.applied);
            else result.conflicts.push(outcome.conflict);
        }
        return result;
    }

    async #publishList(
        identity: CollaborationIdentity,
        mutation: Extract<PlannerMutation, { type: 'put-list' }>
    ): Promise<PublishOutcome> {
        const { base, entity: list } = mutation;
        const supabase = requireSupabaseClient();
        const current = throwIfError(
            await supabase
                .from('encrypted_lists')
                .select('*')
                .eq('id', list.id)
                .maybeSingle()
        );
        if (!current) {
            if (base) {
                return {
                    conflict: {
                        entityId: list.id,
                        entityType: 'list',
                        id: crypto.randomUUID(),
                        local: list,
                        status: 'deleted-remotely',
                    },
                };
            }
            await this.importSnapshot(identity, { lists: [list], items: [] });
            return {
                applied: {
                    base: null,
                    entity: {
                        ...list,
                        keyVersion: 1,
                        ownerIdentityId: identity.record.userId,
                        revision: 1,
                    },
                    type: 'put-list',
                },
            };
        }
        const key = await this.#listKey(
            identity,
            list.id,
            current.current_key_version
        );
        const remote = plannerListSchema.parse({
            ...(await decryptCollaborationRecord<PlannerList>(
                key,
                {
                    keyVersion: current.key_version,
                    listId: current.id,
                    recordId: current.id,
                    recordType: 'list',
                    revision: current.content_revision,
                },
                recordEnvelope(current)
            )),
            id: list.id,
            isArchived: Boolean(current.deleted_at),
            isPrivateCopy: false,
            keyVersion: current.current_key_version,
            ownerIdentityId: identityIdSchema.parse(current.owner_id),
            revision: current.content_revision,
        });
        if (!base) {
            return {
                conflict: {
                    entityId: list.id,
                    entityType: 'list',
                    id: crypto.randomUUID(),
                    local: list,
                    remote,
                    status: 'field-conflict',
                },
            };
        }
        const rebased =
            base.revision === current.content_revision
                ? list
                : mergeDisjointChanges(base, list, remote);
        if (!rebased) {
            return {
                conflict: {
                    entityId: list.id,
                    entityType: 'list',
                    id: crypto.randomUUID(),
                    local: list,
                    remote,
                    status: 'field-conflict',
                },
            };
        }
        const nextRevision = current.content_revision + 1;
        const accepted = plannerListSchema.parse({
            ...rebased,
            keyVersion: current.current_key_version,
            ownerIdentityId: identityIdSchema.parse(current.owner_id),
            revision: nextRevision,
            updatedAt: new Date().toISOString(),
        });
        const envelope = await encryptCollaborationRecord(
            key,
            {
                keyVersion: current.current_key_version,
                listId: list.id,
                recordId: list.id,
                recordType: 'list',
                revision: nextRevision,
            },
            accepted
        );
        throwIfError(
            await supabase.rpc('update_encrypted_list', {
                p_ciphertext: envelope.ciphertext,
                p_expected_revision: current.content_revision,
                p_iv: envelope.iv,
                p_key_version: current.current_key_version,
                p_list_id: list.id,
            })
        );
        if (Boolean(current.deleted_at) !== accepted.isArchived) {
            throwIfError(
                await supabase.rpc('set_encrypted_list_deleted', {
                    p_deleted: accepted.isArchived,
                    p_expected_revision: current.revision + 1,
                    p_list_id: list.id,
                })
            );
        }
        return {
            applied: { base: remote, entity: accepted, type: 'put-list' },
        };
    }

    async #publishItem(
        identity: CollaborationIdentity,
        mutation: Extract<PlannerMutation, { type: 'put-item' }>
    ): Promise<PublishOutcome> {
        const { base, entity: item } = mutation;
        const supabase = requireSupabaseClient();
        const current = throwIfError(
            await supabase
                .from('encrypted_items')
                .select('*')
                .eq('id', item.id)
                .maybeSingle()
        );
        if (!current) {
            if (base) {
                return {
                    conflict: {
                        entityId: item.id,
                        entityType: 'item',
                        id: crypto.randomUUID(),
                        local: item,
                        status: 'deleted-remotely',
                    },
                };
            }
            const key = await this.#listKey(
                identity,
                item.listId,
                item.keyVersion
            );
            const envelope = await encryptCollaborationRecord(
                key,
                {
                    keyVersion: item.keyVersion,
                    listId: item.listId,
                    recordId: item.id,
                    recordType: 'item',
                    revision: 1,
                },
                { ...item, revision: 1 }
            );
            throwIfError(
                await supabase.rpc('create_encrypted_item', {
                    p_ciphertext: envelope.ciphertext,
                    p_iv: envelope.iv,
                    p_key_version: item.keyVersion,
                    p_list_id: item.listId,
                    p_item_id: item.id,
                })
            );
            return {
                applied: {
                    base: null,
                    entity: {
                        ...item,
                        creatorIdentityId: identity.record.userId,
                        revision: 1,
                    },
                    type: 'put-item',
                },
            };
        }
        const key = await this.#listKey(
            identity,
            listIdSchema.parse(current.list_id),
            current.key_version
        );
        const remote = plannerItemSchema.parse({
            ...(await decryptCollaborationRecord<PlannerItem>(
                key,
                {
                    keyVersion: current.key_version,
                    listId: current.list_id,
                    recordId: current.id,
                    recordType: 'item',
                    revision: current.content_revision,
                },
                recordEnvelope(current)
            )),
            creatorIdentityId: identityIdSchema.parse(current.creator_id),
            id: itemIdSchema.parse(current.id),
            isArchived: Boolean(current.deleted_at),
            isPrivateCopy: false,
            keyVersion: current.key_version,
            listId: listIdSchema.parse(current.list_id),
            revision: current.content_revision,
        });
        if (!base) {
            return {
                conflict: {
                    entityId: item.id,
                    entityType: 'item',
                    id: crypto.randomUUID(),
                    local: item,
                    remote,
                    status: 'field-conflict',
                },
            };
        }
        const rebased =
            base.revision === current.content_revision
                ? item
                : mergeDisjointChanges(base, item, remote);
        if (!rebased) {
            return {
                conflict: {
                    entityId: item.id,
                    entityType: 'item',
                    id: crypto.randomUUID(),
                    local: item,
                    remote,
                    status: 'field-conflict',
                },
            };
        }
        if (current.list_id !== item.listId) {
            return this.#moveItem(identity, current, remote, rebased);
        }
        const nextRevision = current.content_revision + 1;
        const accepted = plannerItemSchema.parse({
            ...rebased,
            creatorIdentityId: identityIdSchema.parse(current.creator_id),
            keyVersion: current.key_version,
            revision: nextRevision,
            updatedAt: new Date().toISOString(),
        });
        const envelope = await encryptCollaborationRecord(
            key,
            {
                keyVersion: current.key_version,
                listId: item.listId,
                recordId: item.id,
                recordType: 'item',
                revision: nextRevision,
            },
            accepted
        );
        throwIfError(
            await supabase.rpc('update_encrypted_item', {
                p_ciphertext: envelope.ciphertext,
                p_expected_revision: current.content_revision,
                p_iv: envelope.iv,
                p_key_version: current.key_version,
                p_list_id: item.listId,
                p_item_id: item.id,
            })
        );
        if (Boolean(current.deleted_at) !== accepted.isArchived) {
            throwIfError(
                await supabase.rpc('set_encrypted_item_deleted', {
                    p_deleted: accepted.isArchived,
                    p_expected_revision: current.revision + 1,
                    p_list_id: item.listId,
                    p_item_id: item.id,
                })
            );
        }
        return {
            applied: { base: remote, entity: accepted, type: 'put-item' },
        };
    }

    async #moveItem(
        identity: CollaborationIdentity,
        current: ItemRow,
        remote: PlannerItem,
        rebased: PlannerItem
    ): Promise<PublishOutcome> {
        const supabase = requireSupabaseClient();
        const sourceListId = listIdSchema.parse(current.list_id);
        const destinationListId = listIdSchema.parse(rebased.listId);
        const destinationList = throwIfError(
            await supabase
                .from('encrypted_lists')
                .select('current_key_version')
                .eq('id', destinationListId)
                .is('deleted_at', null)
                .single()
        );
        if (!destinationList) {
            throw new Error('The destination list is unavailable.');
        }
        const [sourceKey, destinationKey, commentRows, attachmentRows] =
            await Promise.all([
                this.#listKey(identity, sourceListId, current.key_version),
                this.#listKey(
                    identity,
                    destinationListId,
                    destinationList.current_key_version
                ),
                selectAll<CommentRow>((from, to) =>
                    supabase
                        .from('encrypted_comments')
                        .select('*')
                        .eq('list_id', sourceListId)
                        .eq('item_id', rebased.id)
                        .range(from, to)
                ),
                selectAll<Tables<'encrypted_attachment_metadata'>>((from, to) =>
                    supabase
                        .from('encrypted_attachment_metadata')
                        .select('*')
                        .eq('list_id', sourceListId)
                        .eq('item_id', rebased.id)
                        .range(from, to)
                ),
            ]);
        const nextRevision = current.content_revision + 1;
        const accepted = plannerItemSchema.parse({
            ...rebased,
            creatorIdentityId: identityIdSchema.parse(current.creator_id),
            keyVersion: destinationList.current_key_version,
            listId: destinationListId,
            revision: nextRevision,
            updatedAt: new Date().toISOString(),
        });
        const itemEnvelope = await encryptCollaborationRecord(
            destinationKey,
            {
                keyVersion: accepted.keyVersion,
                listId: destinationListId,
                recordId: accepted.id,
                recordType: 'item',
                revision: nextRevision,
            },
            accepted
        );
        const comments = await Promise.all(
            commentRows.map(async rawRow => {
                const row = commentRowSchema.parse(rawRow);
                const value = await decryptCollaborationRecord<unknown>(
                    sourceKey,
                    {
                        keyVersion: row.key_version,
                        listId: sourceListId,
                        recordId: row.id,
                        recordType: 'comment',
                        revision: row.content_revision,
                    },
                    recordEnvelope(row)
                );
                const envelope = await encryptCollaborationRecord(
                    destinationKey,
                    {
                        keyVersion: accepted.keyVersion,
                        listId: destinationListId,
                        recordId: row.id,
                        recordType: 'comment',
                        revision: row.content_revision + 1,
                    },
                    value
                );
                return {
                    ciphertext: envelope.ciphertext,
                    expected_revision: row.revision,
                    id: row.id,
                    iv: envelope.iv,
                    key_version: accepted.keyVersion,
                };
            })
        );
        const attachmentGateway = new SupabaseEncryptedAttachmentGateway();
        const signal = new AbortController().signal;
        const activeAttachments = attachmentRows.filter(row => !row.deleted_at);
        const staged: AttachmentMetadata[] = [];
        try {
            for (const attachment of activeAttachments) {
                staged.push(
                    await attachmentGateway.stageMove(
                        attachment.id,
                        destinationListId,
                        accepted.keyVersion,
                        signal
                    )
                );
            }
            throwIfError(
                await supabase.rpc('move_encrypted_item', {
                    p_attachment_ids: attachmentRows.map(row => row.id),
                    p_ciphertext: itemEnvelope.ciphertext,
                    p_comments: comments,
                    p_destination_list_id: destinationListId,
                    p_expected_revision: current.revision,
                    p_iv: itemEnvelope.iv,
                    p_key_version: accepted.keyVersion,
                    p_source_list_id: sourceListId,
                    p_item_id: accepted.id,
                })
            );
        } catch (error) {
            await Promise.all(
                staged.map(attachment =>
                    attachmentGateway
                        .removeMoveDestination(
                            attachment,
                            destinationListId,
                            signal
                        )
                        .catch(() => undefined)
                )
            );
            throw error;
        }
        await Promise.all(
            staged.map(attachment =>
                attachmentGateway.removeMoveSource(attachment, signal)
            )
        );
        return {
            applied: { base: remote, entity: accepted, type: 'put-item' },
        };
    }

    async #publishDeletion(
        mutation: Extract<
            PlannerMutation,
            { type: 'delete-list' | 'delete-item' }
        >
    ): Promise<void> {
        const supabase = requireSupabaseClient();
        if (mutation.type === 'delete-list') {
            const row = throwIfError(
                await supabase
                    .from('encrypted_lists')
                    .select('revision,deleted_at')
                    .eq('id', mutation.id)
                    .maybeSingle()
            );
            if (row && !row.deleted_at) {
                throwIfError(
                    await supabase.rpc('set_encrypted_list_deleted', {
                        p_deleted: true,
                        p_expected_revision: row.revision,
                        p_list_id: mutation.id,
                    })
                );
            }
            return;
        }
        const row = throwIfError(
            await supabase
                .from('encrypted_items')
                .select('revision,deleted_at,list_id')
                .eq('id', mutation.id)
                .maybeSingle()
        );
        if (row && !row.deleted_at) {
            throwIfError(
                await supabase.rpc('set_encrypted_item_deleted', {
                    p_deleted: true,
                    p_expected_revision: row.revision,
                    p_list_id: row.list_id,
                    p_item_id: mutation.id,
                })
            );
        }
    }
}
