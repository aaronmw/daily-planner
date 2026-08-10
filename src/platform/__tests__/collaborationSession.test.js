import { ensureCollaborationSession } from '../collaborationClient';
import { requireSupabaseClient } from '../supabase';

jest.mock('../supabase', () => ({
    getSupabaseConfiguration: jest.fn(() => ({
        appUrl: 'https://planner.example',
    })),
    requireSupabaseClient: jest.fn(),
}));

describe('collaboration sessions', () => {
    const getSession = jest.fn();
    const signInAnonymously = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        getSession.mockResolvedValue({ data: { session: null }, error: null });
        signInAnonymously.mockResolvedValue({
            data: { session: { user: { id: 'identity-1' } } },
            error: null,
        });
        requireSupabaseClient.mockReturnValue({
            auth: { getSession, signInAnonymously },
        });
    });

    it('requires a Turnstile token before creating an anonymous identity', async () => {
        await expect(ensureCollaborationSession()).rejects.toThrow(
            'Complete the security check'
        );
        expect(signInAnonymously).not.toHaveBeenCalled();
    });

    it('passes the Turnstile token to anonymous sign-in', async () => {
        await ensureCollaborationSession({ captchaToken: 'captcha-token' });

        expect(signInAnonymously).toHaveBeenCalledWith({
            options: { captchaToken: 'captcha-token' },
        });
    });

    it('restores an existing session without another challenge', async () => {
        const session = { user: { id: 'identity-1' } };
        getSession.mockResolvedValue({ data: { session }, error: null });

        await expect(ensureCollaborationSession()).resolves.toBe(session);
        expect(signInAnonymously).not.toHaveBeenCalled();
    });
});
