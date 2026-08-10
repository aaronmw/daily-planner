import { z } from 'zod';
import {
    buildInvitationUrl,
    parseInvitationUrl,
} from '../../core/collaboration/invitations';
import type { CollaborationRole } from '../../core/collaboration/roles';
import type {
    CollaborationInvitation,
    CollaborationMembership,
} from '../../core/collaboration/types';
import {
    identityIdSchema,
    listIdSchema,
    type IdentityId,
    type ListId,
} from '../../core/domain/ids';
import { getEnvironment } from '../../config/environment';
import {
    exportListKey,
    generateListKey,
    importListKey,
    importPublicIdentityKey,
    wrapListKey,
} from './crypto';
import type { Json, Tables } from './database.types';
import type { CollaborationIdentity } from './identityStore';
import { type CollaborationRecordGateway } from './recordGateway';
import { requireSupabaseClient } from './supabaseClient';

type ListRow = Pick<
    Tables<'encrypted_lists'>,
    'current_key_version' | 'id' | 'revision'
>;

const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

const randomHex = (byteLength: number): string =>
    Array.from(crypto.getRandomValues(new Uint8Array(byteLength)), byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

const sha256Hex = async (value: string): Promise<string> =>
    Array.from(
        new Uint8Array(
            await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(value)
            )
        ),
        byte => byte.toString(16).padStart(2, '0')
    ).join('');

const dataOrThrow = <Value>(result: {
    data: Value;
    error: Error | null;
}): Value => {
    if (result.error) throw result.error;
    return result.data;
};

const shareableRoleSchema = z.enum(['read', 'comment', 'write', 'full']);

export class CollaborationAccessGateway {
    readonly #records: CollaborationRecordGateway;

    constructor(records: CollaborationRecordGateway) {
        this.#records = records;
    }

    async createInvitation(
        identity: CollaborationIdentity,
        listId: ListId,
        role: Exclude<CollaborationRole, 'owner'>
    ): Promise<CollaborationInvitation> {
        const supabase = requireSupabaseClient();
        const parsedRole = shareableRoleSchema.parse(role);
        const list = dataOrThrow(
            await supabase
                .from('encrypted_lists')
                .select('id,current_key_version,revision')
                .eq('id', listId)
                .single()
        );
        if (!list) throw new Error('The shared list is unavailable.');
        const invitationId = crypto.randomUUID();
        const secret = randomHex(32);
        const expiresAt = new Date(Date.now() + INVITATION_LIFETIME_MS);
        dataOrThrow(
            await supabase.rpc('create_list_invitation', {
                p_expires_at: expiresAt.toISOString(),
                p_invitation_id: invitationId,
                p_list_id: listId,
                p_role: parsedRole,
                p_secret_hash: await sha256Hex(secret),
            })
        );
        const listKeys = await Promise.all(
            Array.from(
                { length: list.current_key_version },
                async (_, index) => ({
                    key: await exportListKey(
                        await this.#records.loadListKey(
                            identity,
                            listId,
                            index + 1
                        )
                    ),
                    keyVersion: index + 1,
                })
            )
        );
        const environment = getEnvironment();
        return {
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            id: invitationId,
            listId,
            revokedAt: null,
            role: parsedRole,
            url: buildInvitationUrl({
                inviteSecret: `${invitationId}.${secret}`,
                listId,
                listKeys,
                origin: environment.VITE_APP_URL || window.location.origin,
            }),
            usedAt: null,
        };
    }

    async revokeInvitation(
        listId: ListId,
        invitationId: string
    ): Promise<void> {
        dataOrThrow(
            await requireSupabaseClient().rpc('revoke_list_invitation', {
                p_invitation_id: z.uuid().parse(invitationId),
                p_list_id: listId,
            })
        );
    }

    async updateMemberRole(
        listId: ListId,
        member: CollaborationMembership,
        role: Exclude<CollaborationRole, 'owner'>
    ): Promise<void> {
        dataOrThrow(
            await requireSupabaseClient().rpc('set_list_member_role', {
                p_expected_revision: member.revision,
                p_list_id: listId,
                p_role: shareableRoleSchema.parse(role),
                p_user_id: member.userId,
            })
        );
    }

    async removeMember(
        identity: CollaborationIdentity,
        listId: ListId,
        member: CollaborationMembership
    ): Promise<void> {
        const rotation = await this.#prepareRotation(
            identity,
            listId,
            member.userId
        );
        dataOrThrow(
            await requireSupabaseClient().rpc('remove_list_member', {
                p_envelopes: rotation.envelopes,
                p_expected_list_revision: rotation.list.revision,
                p_expected_member_revision: member.revision,
                p_list_id: listId,
                p_new_key_version: rotation.keyVersion,
                p_user_id: member.userId,
            })
        );
        await this.#records.saveListKey(
            listId,
            rotation.keyVersion,
            rotation.listKey
        );
    }

    async leaveList(
        identity: CollaborationIdentity,
        listId: ListId,
        membership: CollaborationMembership
    ): Promise<void> {
        const rotation = await this.#prepareRotation(
            identity,
            listId,
            identity.record.userId
        );
        dataOrThrow(
            await requireSupabaseClient().rpc('leave_list', {
                p_envelopes: rotation.envelopes,
                p_expected_list_revision: rotation.list.revision,
                p_expected_member_revision: membership.revision,
                p_list_id: listId,
                p_new_key_version: rotation.keyVersion,
            })
        );
    }

    async transferOwnership(
        identity: CollaborationIdentity,
        listId: ListId,
        newOwner: CollaborationMembership,
        formerOwnerRole: Exclude<CollaborationRole, 'owner'> | null
    ): Promise<void> {
        const removesFormerOwner = formerOwnerRole === null;
        if (removesFormerOwner) {
            const rotation = await this.#prepareRotation(
                identity,
                listId,
                identity.record.userId
            );
            dataOrThrow(
                await requireSupabaseClient().rpc('transfer_list_ownership', {
                    p_envelopes: rotation.envelopes,
                    p_expected_list_revision: rotation.list.revision,
                    p_expected_new_owner_revision: newOwner.revision,
                    p_former_owner_role: null,
                    p_list_id: listId,
                    p_new_key_version: rotation.keyVersion,
                    p_new_owner_id: newOwner.userId,
                })
            );
            return;
        }
        const access = await this.#loadAccess(listId);
        dataOrThrow(
            await requireSupabaseClient().rpc('transfer_list_ownership', {
                p_expected_list_revision: access.list.revision,
                p_expected_new_owner_revision: newOwner.revision,
                p_former_owner_role: formerOwnerRole,
                p_list_id: listId,
                p_new_owner_id: newOwner.userId,
            })
        );
    }

    async redeemInvitation(
        identity: CollaborationIdentity,
        invitationUrl: string
    ): Promise<ListId> {
        const invitation = parseInvitationUrl(invitationUrl);
        if (!invitation) throw new Error('This sharing link is incomplete.');
        const [invitationId, secret] = invitation.inviteSecret.split('.', 2);
        if (!invitationId || !secret) {
            throw new Error('This sharing link is invalid.');
        }
        const publicKey = await importPublicIdentityKey(identity.publicKey);
        const imported = await Promise.all(
            invitation.listKeys.map(async entry => ({
                ...entry,
                listKey: await importListKey(entry.key),
            }))
        );
        const keyEnvelopes = (await Promise.all(
            imported.map(async entry => ({
                key_version: entry.keyVersion,
                wrapped_key: await wrapListKey(entry.listKey, publicKey),
                wrapped_key_iv: 'rsa-oaep',
            }))
        )) satisfies Json[];
        dataOrThrow(
            await requireSupabaseClient().rpc('redeem_list_invitation', {
                p_invitation_id: z.uuid().parse(invitationId),
                p_key_envelopes: keyEnvelopes,
                p_secret: secret,
            })
        );
        await Promise.all(
            imported.map(entry =>
                this.#records.saveListKey(
                    invitation.listId,
                    entry.keyVersion,
                    entry.listKey
                )
            )
        );
        return invitation.listId;
    }

    async #loadAccess(listId: ListId): Promise<{
        list: ListRow;
        memberships: CollaborationMembership[];
    }> {
        const supabase = requireSupabaseClient();
        const [listResult, membershipResult] = await Promise.all([
            supabase
                .from('encrypted_lists')
                .select('id,current_key_version,revision')
                .eq('id', listId)
                .single(),
            supabase
                .from('list_memberships')
                .select('*')
                .eq('list_id', listId)
                .eq('state', 'active'),
        ]);
        const list = dataOrThrow(listResult);
        if (!list) throw new Error('The shared list is unavailable.');
        const memberships = (dataOrThrow(membershipResult) ?? []).map(row => ({
            joinedAt: row.joined_at,
            listId: listIdSchema.parse(row.list_id),
            removedAt: row.removed_at,
            revision: row.revision,
            role: row.role,
            state: row.state,
            updatedAt: row.updated_at,
            userId: identityIdSchema.parse(row.user_id),
        }));
        return { list, memberships };
    }

    async #prepareRotation(
        identity: CollaborationIdentity,
        listId: ListId,
        excludedUserId: IdentityId
    ): Promise<{
        envelopes: Json[];
        keyVersion: number;
        list: ListRow;
        listKey: CryptoKey;
        memberships: CollaborationMembership[];
    }> {
        const access = await this.#loadAccess(listId);
        const recipients = access.memberships.filter(
            member => member.userId !== excludedUserId
        );
        const identityRows = dataOrThrow(
            await requireSupabaseClient()
                .from('collaboration_identities')
                .select('user_id,public_key')
                .in(
                    'user_id',
                    recipients.map(member => member.userId)
                )
        );
        const publicKeys = new Map(
            (identityRows ?? []).map(row => [row.user_id, row.public_key])
        );
        if (publicKeys.size !== recipients.length) {
            throw new Error('A collaborator public key is unavailable.');
        }
        const listKey = await generateListKey();
        const keyVersion = access.list.current_key_version + 1;
        const envelopes = (await Promise.all(
            recipients.map(async member => {
                const publicKey = publicKeys.get(member.userId);
                if (!publicKey) {
                    throw new Error(
                        'A collaborator public key is unavailable.'
                    );
                }
                return {
                    user_id: member.userId,
                    wrapped_key: await wrapListKey(
                        listKey,
                        await importPublicIdentityKey(publicKey)
                    ),
                    wrapped_key_iv: 'rsa-oaep',
                };
            })
        )) satisfies Json[];
        return { ...access, envelopes, keyVersion, listKey };
    }
}
