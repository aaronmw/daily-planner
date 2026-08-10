import { createClient } from '@supabase/supabase-js';
import { isDesktopRuntime } from './runtime';

let client;

export const getSupabaseConfiguration = () => ({
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
});

export const isSupabaseConfigured = () => {
    const { publishableKey, turnstileSiteKey, url } =
        getSupabaseConfiguration();
    return Boolean(url && publishableKey && turnstileSiteKey);
};

export const getSupabaseClient = () => {
    if (client !== undefined) {
        return client;
    }

    const { publishableKey, url } = getSupabaseConfiguration();
    if (!url || !publishableKey) {
        client = null;
        return client;
    }

    client = createClient(url, publishableKey, {
        auth: {
            autoRefreshToken: true,
            detectSessionInUrl: !isDesktopRuntime(),
            experimental: { appendPkceFlowIdToRedirects: true },
            flowType: 'pkce',
            persistSession: true,
        },
        realtime: {
            params: { eventsPerSecond: 10 },
        },
    });

    return client;
};

export const requireSupabaseClient = () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error(
            'Sync is not configured for this build of Daily Planner.'
        );
    }
    return supabase;
};

export const resetSupabaseClientForTests = () => {
    client = undefined;
};
