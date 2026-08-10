import { z } from 'zod';
import { listIdSchema, type ListId } from '../domain/ids';

const exportedListKeySchema = z.object({
    key: z.string().min(1),
    keyVersion: z.number().int().positive(),
});

export interface InvitationPayload {
    inviteSecret: string;
    listId: ListId;
    listKeys: z.infer<typeof exportedListKeySchema>[];
}

export const buildInvitationUrl = ({
    inviteSecret,
    listId,
    listKeys,
    origin,
}: InvitationPayload & { origin: string }): string => {
    const parsedListId = listIdSchema.parse(listId);
    const parsedKeys = z.array(exportedListKeySchema).min(1).parse(listKeys);
    const url = new URL(`/share/${encodeURIComponent(parsedListId)}`, origin);
    url.hash = new URLSearchParams({
        invite: z.string().min(1).parse(inviteSecret),
        keys: JSON.stringify(parsedKeys),
    }).toString();
    return url.toString();
};

export const parseInvitationUrl = (value: string): InvitationPayload | null => {
    try {
        const url = new URL(value);
        const match = /^\/share\/([^/]+)$/.exec(url.pathname);
        if (!match?.[1]) return null;
        const listId = listIdSchema.parse(decodeURIComponent(match[1]));
        const params = new URLSearchParams(url.hash.slice(1));
        const inviteSecret = z.string().min(1).parse(params.get('invite'));
        const listKeys = z
            .array(exportedListKeySchema)
            .min(1)
            .parse(JSON.parse(params.get('keys') ?? 'null'));
        return { inviteSecret, listId, listKeys };
    } catch {
        return null;
    }
};

export const scrubInvitationUrl = (value: string): string => {
    const url = new URL(value);
    url.hash = '';
    return url.toString();
};
