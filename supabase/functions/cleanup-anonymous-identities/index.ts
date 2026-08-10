import { createClient } from 'npm:@supabase/supabase-js@2.112.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Anonymous cleanup secrets are incomplete.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const response = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        headers: { 'content-type': 'application/json' },
        status,
    });

Deno.serve(async request => {
    if (request.method !== 'POST') {
        return response({ error: 'Method not allowed' }, 405);
    }
    if (request.headers.get('authorization') !== `Bearer ${serviceRoleKey}`) {
        return response({ error: 'Unauthorized' }, 401);
    }

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
    const candidates = await supabase
        .from('collaboration_identities')
        .select('user_id')
        .eq('is_anonymous', true)
        .lt('updated_at', cutoff)
        .limit(500);
    if (candidates.error) {
        return response({ error: candidates.error.message }, 500);
    }
    const candidateIds = (candidates.data || []).map(row => row.user_id);
    if (!candidateIds.length) return response({ deleted: 0 });

    const memberships = await supabase
        .from('list_memberships')
        .select('user_id')
        .in('user_id', candidateIds);
    if (memberships.error) {
        return response({ error: memberships.error.message }, 500);
    }
    const usersWithMemberships = new Set(
        (memberships.data || []).map(row => row.user_id)
    );
    const deletableIds = candidateIds.filter(
        userId => !usersWithMemberships.has(userId)
    );
    const results = await Promise.allSettled(
        deletableIds.map(userId => supabase.auth.admin.deleteUser(userId))
    );
    return response({
        deleted: results.filter(
            result => result.status === 'fulfilled' && !result.value.error
        ).length,
        failed: results.filter(
            result => result.status === 'rejected' || result.value.error
        ).length,
    });
});
