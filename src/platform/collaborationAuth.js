import { protectAccountKey } from '../collaboration';
import {
    loadCollaborationIdentity,
    updateCollaborationIdentityRecord,
} from './collaborationIdentityStore';
import { isDesktopRuntime } from './runtime';
import { getSupabaseConfiguration, requireSupabaseClient } from './supabase';

export const DAILY_PLANNER_AUTH_CALLBACK = 'daily-planner://auth/callback';

const getRedirectUrl = () => {
    if (isDesktopRuntime()) return DAILY_PLANNER_AUTH_CALLBACK;
    const { appUrl } = getSupabaseConfiguration();
    return appUrl || window.location.origin;
};

const openDesktopAuthUrl = async url => {
    if (!isDesktopRuntime() || !url) return;
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('The sign-in provider returned an unsupported URL.');
    }
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
};

export const continueCollaborationWithGoogle = async () => {
    const supabase = requireSupabaseClient();
    const session = await supabase.auth.getSession();
    if (session.error) throw session.error;
    const user = session.data.session?.user;
    const method = user?.is_anonymous ? 'linkIdentity' : 'signInWithOAuth';
    const result = await supabase.auth[method]({
        provider: 'google',
        options: {
            redirectTo: getRedirectUrl(),
            skipBrowserRedirect: isDesktopRuntime(),
        },
    });
    if (result.error) throw result.error;
    await openDesktopAuthUrl(result.data.url);
};

export const continueCollaborationWithEmail = async ({
    captchaToken,
    email,
}) => {
    const supabase = requireSupabaseClient();
    const session = await supabase.auth.getSession();
    if (session.error) throw session.error;
    const user = session.data.session?.user;
    if (user?.is_anonymous) {
        const result = await supabase.auth.updateUser(
            { email },
            { emailRedirectTo: getRedirectUrl() }
        );
        if (result.error) throw result.error;
        return;
    }
    const result = await supabase.auth.signInWithOtp({
        email,
        options: {
            captchaToken: captchaToken || undefined,
            emailRedirectTo: getRedirectUrl(),
            shouldCreateUser: true,
        },
    });
    if (result.error) throw result.error;
};

export const signInToExistingCollaborationWithGoogle = async () => {
    const supabase = requireSupabaseClient();
    await supabase.auth.signOut({ scope: 'local' });
    const result = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: getRedirectUrl(),
            skipBrowserRedirect: isDesktopRuntime(),
        },
    });
    if (result.error) throw result.error;
    await openDesktopAuthUrl(result.data.url);
};

export const signInToExistingCollaborationWithEmail = async ({
    captchaToken,
    email,
}) => {
    const supabase = requireSupabaseClient();
    await supabase.auth.signOut({ scope: 'local' });
    const result = await supabase.auth.signInWithOtp({
        email,
        options: {
            captchaToken: captchaToken || undefined,
            emailRedirectTo: getRedirectUrl(),
            shouldCreateUser: false,
        },
    });
    if (result.error) throw result.error;
};

export const exchangeCollaborationAuthCallback = async value => {
    const url = new URL(value);
    const errorMessage = url.searchParams.get('error_description');
    if (errorMessage) throw new Error(errorMessage);
    const code = url.searchParams.get('code');
    if (!code) return null;
    const flowId = url.searchParams.get('flow_id');
    const result = await requireSupabaseClient().auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined
    );
    if (result.error) throw result.error;
    return result.data.session;
};

export const finalizeCollaborationAccountUpgrade = async user => {
    if (!user || user.is_anonymous) return null;
    const identity = await loadCollaborationIdentity();
    if (!identity || identity.record.userId !== user.id) return null;
    if (!identity.record.isAnonymous && identity.record.protectedAccountKey) {
        return { identity, recoveryCode: null };
    }

    const recovery = await protectAccountKey(identity.accountKey);
    const keyring = await requireSupabaseClient()
        .from('identity_keyrings')
        .select('revision')
        .eq('user_id', user.id)
        .single();
    if (keyring.error) throw keyring.error;
    const protectedKey = recovery.protectedKey;
    const updated = await requireSupabaseClient().rpc(
        'update_collaboration_keyring',
        {
            p_account_key_iv: protectedKey.iv,
            p_encrypted_account_key: protectedKey.ciphertext,
            p_encrypted_private_key: identity.record.wrappedPrivateKey,
            p_expected_revision: keyring.data.revision,
            p_private_key_iv: 'aes-kw',
            p_public_key: identity.publicKey,
            p_recovery_iv: protectedKey.iv,
            p_recovery_salt: protectedKey.salt,
        }
    );
    if (updated.error) throw updated.error;
    const record = await updateCollaborationIdentityRecord({
        email: user.email || null,
        isAnonymous: false,
        protectedAccountKey: protectedKey,
    });
    return {
        identity: { ...identity, record },
        recoveryCode: recovery.recoveryCode,
    };
};

export const subscribeToCollaborationAuth = callback => {
    const { data } = requireSupabaseClient().auth.onAuthStateChange(
        (event, session) => callback(event, session)
    );
    return () => data.subscription.unsubscribe();
};
