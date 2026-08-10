const DEFAULT_ROUTE_PREFIX = '/share';

const normalizeRoutePrefix = routePrefix => {
    const prefixed = String(routePrefix || DEFAULT_ROUTE_PREFIX);
    const withLeadingSlash = prefixed.startsWith('/')
        ? prefixed
        : `/${prefixed}`;

    return withLeadingSlash.replace(/\/+$/, '');
};

export const buildInvitationUrl = ({
    origin,
    listId,
    listKey,
    listKeys,
    inviteSecret,
    routePrefix = DEFAULT_ROUTE_PREFIX,
}) => {
    const hasKeyMaterial =
        String(listKey || '') || (Array.isArray(listKeys) && listKeys.length);

    if (!String(listId || '') || !hasKeyMaterial || !inviteSecret) {
        throw new TypeError(
            'Invitation list ID, key, and secret are required.'
        );
    }

    const route = normalizeRoutePrefix(routePrefix);
    const url = new URL(`${route}/${encodeURIComponent(listId)}`, origin);
    const fragment = new URLSearchParams({ invite: String(inviteSecret) });
    if (Array.isArray(listKeys) && listKeys.length) {
        fragment.set('keys', JSON.stringify(listKeys));
    } else {
        fragment.set('key', String(listKey));
    }
    url.hash = fragment.toString();

    return url.toString();
};

export const parseInvitationUrl = (
    invitationUrl,
    { routePrefix = DEFAULT_ROUTE_PREFIX } = {}
) => {
    let url;

    try {
        url = new URL(invitationUrl);
    } catch {
        return null;
    }

    const route = normalizeRoutePrefix(routePrefix);
    const pathPrefix = `${route}/`;

    if (!url.pathname.startsWith(pathPrefix)) {
        return null;
    }

    const encodedListId = url.pathname.slice(pathPrefix.length);

    if (!encodedListId || encodedListId.includes('/')) {
        return null;
    }

    const params = new URLSearchParams(url.hash.slice(1));
    const encodedListKeys = params.get('keys');
    const listKey = params.get('key');
    const inviteSecret = params.get('invite');

    if ((!listKey && !encodedListKeys) || !inviteSecret) {
        return null;
    }

    try {
        const result = {
            inviteSecret,
            listId: decodeURIComponent(encodedListId),
        };
        if (encodedListKeys) {
            const listKeys = JSON.parse(encodedListKeys);
            if (
                !Array.isArray(listKeys) ||
                !listKeys.length ||
                listKeys.some(
                    entry =>
                        !Number.isInteger(entry?.keyVersion) ||
                        entry.keyVersion < 1 ||
                        !String(entry?.key || '')
                )
            ) {
                return null;
            }
            return { ...result, listKeys };
        }
        return { ...result, listKey };
    } catch {
        return null;
    }
};

export const scrubInvitationUrl = invitationUrl => {
    const url = new URL(invitationUrl);
    const params = new URLSearchParams(url.hash.slice(1));

    params.delete('key');
    params.delete('keys');
    params.delete('invite');
    url.hash = params.toString();

    return url.toString();
};
