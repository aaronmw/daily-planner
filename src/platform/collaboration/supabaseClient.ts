import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnvironment } from '../../config/environment';
import { isDesktopRuntime } from '../runtime/platformAdapter';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | null | undefined;

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
    if (client !== undefined) return client;
    const environment = getEnvironment();
    if (
        !environment.VITE_SUPABASE_URL ||
        !environment.VITE_SUPABASE_PUBLISHABLE_KEY
    ) {
        client = null;
        return client;
    }
    client = createClient<Database>(
        environment.VITE_SUPABASE_URL,
        environment.VITE_SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                detectSessionInUrl: !isDesktopRuntime(),
                flowType: 'pkce',
                persistSession: true,
            },
            realtime: { params: { eventsPerSecond: 10 } },
        }
    );
    return client;
};

export const requireSupabaseClient = (): SupabaseClient<Database> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
        throw new Error('Sync is not configured for this Daily Planner build.');
    }
    return supabase;
};
