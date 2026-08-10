import { createClient } from 'npm:@supabase/supabase-js@2.112.2';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
const vapidSubject = Deno.env.get('VAPID_SUBJECT');

if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !vapidPublicKey ||
    !vapidPrivateKey ||
    !vapidSubject
) {
    throw new Error('Notification dispatcher secrets are incomplete.');
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const genericPayload = JSON.stringify({
    body: 'Open Daily Planner to view the encrypted update.',
    title: 'Daily Planner update',
    url: '/',
});

const response = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        headers: { 'content-type': 'application/json' },
        status,
    });

const processJob = async (job: {
    attempts: number;
    id: string;
    recipient_id: string;
}) => {
    const lockedAt = new Date().toISOString();
    const claim = await supabase
        .from('notification_jobs')
        .update({ locked_at: lockedAt, updated_at: lockedAt })
        .eq('id', job.id)
        .in('state', ['pending', 'retry'])
        .is('locked_at', null)
        .select('id')
        .maybeSingle();
    if (claim.error) throw claim.error;
    if (!claim.data) return false;

    const subscriptions = await supabase
        .from('push_subscriptions')
        .select('id,endpoint,p256dh,auth')
        .eq('user_id', job.recipient_id);
    if (subscriptions.error) throw subscriptions.error;

    const failures: string[] = [];
    await Promise.all(
        (subscriptions.data || []).map(async subscription => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            auth: subscription.auth,
                            p256dh: subscription.p256dh,
                        },
                    },
                    genericPayload
                );
            } catch (error) {
                const statusCode = Number(
                    (error as { statusCode?: number })?.statusCode
                );
                if (statusCode === 404 || statusCode === 410) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .eq('id', subscription.id);
                    return;
                }
                failures.push(
                    error instanceof Error ? error.message : 'Push failed'
                );
            }
        })
    );

    const attempts = Math.min(5, job.attempts + 1);
    const now = new Date();
    const update = failures.length
        ? {
              attempts,
              last_error: failures.join('; ').slice(0, 1_000),
              locked_at: null,
              next_attempt_at: new Date(
                  now.getTime() + 2 ** attempts * 30_000
              ).toISOString(),
              state: attempts >= 5 ? 'failed' : 'retry',
              updated_at: now.toISOString(),
          }
        : {
              attempts,
              delivered_at: now.toISOString(),
              last_error: null,
              locked_at: null,
              state: 'delivered',
              updated_at: now.toISOString(),
          };
    const saved = await supabase
        .from('notification_jobs')
        .update(update)
        .eq('id', job.id)
        .eq('locked_at', lockedAt);
    if (saved.error) throw saved.error;
    return true;
};

Deno.serve(async request => {
    if (request.method !== 'POST') {
        return response({ error: 'Method not allowed' }, 405);
    }
    if (request.headers.get('authorization') !== `Bearer ${serviceRoleKey}`) {
        return response({ error: 'Unauthorized' }, 401);
    }

    const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
    await supabase
        .from('notification_jobs')
        .update({ locked_at: null, state: 'retry' })
        .in('state', ['pending', 'retry'])
        .lt('locked_at', staleBefore);

    const due = await supabase
        .from('notification_jobs')
        .select('id,recipient_id,attempts')
        .in('state', ['pending', 'retry'])
        .lte('next_attempt_at', new Date().toISOString())
        .is('locked_at', null)
        .order('created_at', { ascending: true })
        .limit(100);
    if (due.error) return response({ error: due.error.message }, 500);

    const results = await Promise.allSettled(
        (due.data || []).map(job => processJob(job))
    );
    return response({
        claimed: results.filter(
            result => result.status === 'fulfilled' && result.value
        ).length,
        failed: results.filter(result => result.status === 'rejected').length,
    });
});
