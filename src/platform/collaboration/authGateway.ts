import type { Session } from '@supabase/supabase-js';
import { requireSupabaseClient } from './supabaseClient';
import type { AuthChangeEvent } from '@supabase/supabase-js';
import { getEnvironment } from '../../config/environment';
import { isDesktopRuntime } from '../runtime/platformAdapter';

const AUTH_CALLBACK = 'daily-planner://auth/callback';
const DESKTOP_AUTH_ORIGIN = 'https://xgubpuynmcjscfxosplr.supabase.co';

const redirectUrl = (): string =>
    isDesktopRuntime()
        ? AUTH_CALLBACK
        : getEnvironment().VITE_APP_URL || window.location.origin;

export const isAllowedDesktopAuthUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return (
            url.origin === DESKTOP_AUTH_ORIGIN &&
            url.pathname === '/auth/v1/authorize'
        );
    } catch {
        return false;
    }
};

const openDesktopUrl = async (url: string | null): Promise<void> => {
    if (!isDesktopRuntime() || !url) return;
    if (!isAllowedDesktopAuthUrl(url)) {
        throw new Error('The sign-in provider returned an unsupported URL.');
    }
    const { openUrl } = await import('@tauri-apps/plugin-opener');
    await openUrl(url);
};

export class CollaborationAuthGateway {
    async ensureSession(captchaToken?: string): Promise<Session> {
        const supabase = requireSupabaseClient();
        const current = await supabase.auth.getSession();
        if (current.error) throw current.error;
        if (current.data.session) return current.data.session;
        if (!captchaToken) {
            throw new Error(
                'Complete the security check before enabling encrypted sync.'
            );
        }
        const created = await supabase.auth.signInAnonymously({
            options: { captchaToken },
        });
        if (created.error) throw created.error;
        if (!created.data.session) {
            throw new Error('Supabase did not create a collaboration session.');
        }
        return created.data.session;
    }

    async continueWithEmail(email: string): Promise<void> {
        const supabase = requireSupabaseClient();
        const session = await this.ensureSession();
        if (session.user.is_anonymous) {
            const result = await supabase.auth.updateUser(
                { email },
                { emailRedirectTo: redirectUrl() }
            );
            if (result.error) throw result.error;
            return;
        }
        const result = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectUrl(),
                shouldCreateUser: true,
            },
        });
        if (result.error) throw result.error;
    }

    async continueWithGoogle(): Promise<void> {
        const supabase = requireSupabaseClient();
        const session = await this.ensureSession();
        const method = session.user.is_anonymous
            ? 'linkIdentity'
            : 'signInWithOAuth';
        const result = await supabase.auth[method]({
            provider: 'google',
            options: {
                redirectTo: redirectUrl(),
                skipBrowserRedirect: isDesktopRuntime(),
            },
        });
        if (result.error) throw result.error;
        await openDesktopUrl(result.data.url);
    }

    async signInExistingWithEmail(
        email: string,
        captchaToken: string
    ): Promise<void> {
        const supabase = requireSupabaseClient();
        const result = await supabase.auth.signInWithOtp({
            email,
            options: {
                captchaToken,
                emailRedirectTo: redirectUrl(),
                shouldCreateUser: false,
            },
        });
        if (result.error) throw result.error;
    }

    async signInExistingWithGoogle(): Promise<void> {
        const supabase = requireSupabaseClient();
        const result = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl(),
                skipBrowserRedirect: isDesktopRuntime(),
            },
        });
        if (result.error) throw result.error;
        await openDesktopUrl(result.data.url);
    }

    async exchangeCallback(value: string): Promise<Session | null> {
        const url = new URL(value);
        const error = url.searchParams.get('error_description');
        if (error) throw new Error(error);
        const code = url.searchParams.get('code');
        if (!code) return null;
        const flowId = url.searchParams.get('flow_id');
        const result =
            await requireSupabaseClient().auth.exchangeCodeForSession(
                code,
                flowId ? { flowId } : undefined
            );
        if (result.error) throw result.error;
        return result.data.session;
    }

    subscribe(
        callback: (event: AuthChangeEvent, session: Session | null) => void
    ): () => void {
        const { data } = requireSupabaseClient().auth.onAuthStateChange(
            (event, session) => callback(event, session)
        );
        return () => data.subscription.unsubscribe();
    }
}
