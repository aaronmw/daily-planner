import {
    buildInvitationUrl,
    parseInvitationUrl,
    scrubInvitationUrl,
} from '../invitations';

describe('collaboration invitation URLs', () => {
    it('keeps list keys and invitation secrets in the fragment', () => {
        const invitationUrl = buildInvitationUrl({
            origin: 'https://planner.example.test/app?from=home',
            listId: 'list/with spaces',
            listKey: 'list-key-secret',
            inviteSecret: 'single-use-secret',
        });
        const url = new URL(invitationUrl);

        expect(url.pathname).toBe('/share/list%2Fwith%20spaces');
        expect(url.search).toBe('');
        expect(url.hash).toContain('key=list-key-secret');
        expect(url.hash).toContain('invite=single-use-secret');
        expect(parseInvitationUrl(invitationUrl)).toEqual({
            inviteSecret: 'single-use-secret',
            listId: 'list/with spaces',
            listKey: 'list-key-secret',
        });
    });

    it('scrubs secrets while retaining non-secret URL state', () => {
        const invitationUrl =
            'https://planner.example.test/share/list-1?desktop=1' +
            '#key=secret-key&invite=secret-invite&source=email';

        expect(scrubInvitationUrl(invitationUrl)).toBe(
            'https://planner.example.test/share/list-1?desktop=1#source=email'
        );
    });

    it('carries every versioned list key and scrubs the complete keyring', () => {
        const invitationUrl = buildInvitationUrl({
            inviteSecret: 'single-use-secret',
            listId: 'list-1',
            listKeys: [
                { key: 'old-key', keyVersion: 1 },
                { key: 'current-key', keyVersion: 2 },
            ],
            origin: 'https://planner.example.test',
        });

        expect(parseInvitationUrl(invitationUrl)).toEqual({
            inviteSecret: 'single-use-secret',
            listId: 'list-1',
            listKeys: [
                { key: 'old-key', keyVersion: 1 },
                { key: 'current-key', keyVersion: 2 },
            ],
        });
        expect(scrubInvitationUrl(invitationUrl)).toBe(
            'https://planner.example.test/share/list-1'
        );
    });

    it('returns null for incomplete or unrelated links', () => {
        expect(
            parseInvitationUrl(
                'https://planner.example.test/share/list-1#key=only-key'
            )
        ).toBeNull();
        expect(
            parseInvitationUrl(
                'https://planner.example.test/lists/list-1#key=a&invite=b'
            )
        ).toBeNull();
    });
});
