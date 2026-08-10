import {
    getSupabaseConfiguration,
    isSupabaseConfigured,
    resetSupabaseClientForTests,
} from '../supabase';

const ENVIRONMENT_KEYS = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
];

describe('Supabase collaboration configuration', () => {
    const originalEnvironment = {};

    beforeAll(() => {
        ENVIRONMENT_KEYS.forEach(key => {
            originalEnvironment[key] = process.env[key];
        });
    });

    beforeEach(() => {
        ENVIRONMENT_KEYS.forEach(key => delete process.env[key]);
        resetSupabaseClientForTests();
    });

    afterAll(() => {
        ENVIRONMENT_KEYS.forEach(key => {
            if (originalEnvironment[key] === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = originalEnvironment[key];
            }
        });
        resetSupabaseClientForTests();
    });

    it('requires Turnstile before anonymous collaboration can be enabled', () => {
        process.env.NEXT_PUBLIC_SUPABASE_URL =
            'https://planner-example.supabase.co';
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';

        expect(isSupabaseConfigured()).toBe(false);

        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = 'turnstile-site-key';

        expect(isSupabaseConfigured()).toBe(true);
        expect(getSupabaseConfiguration()).toEqual(
            expect.objectContaining({
                publishableKey: 'publishable-key',
                turnstileSiteKey: 'turnstile-site-key',
                url: 'https://planner-example.supabase.co',
            })
        );
    });
});
