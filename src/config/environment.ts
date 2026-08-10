import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.url()]);

const environmentSchema = z.object({
    VITE_APP_URL: optionalUrl.default(''),
    VITE_SUPABASE_PUBLISHABLE_KEY: z.string().default(''),
    VITE_SUPABASE_URL: optionalUrl.default(''),
    VITE_TURNSTILE_SITE_KEY: z.string().default(''),
    VITE_VAPID_PUBLIC_KEY: z.string().default(''),
});

export type PlannerEnvironment = z.infer<typeof environmentSchema>;

let cached: PlannerEnvironment | null = null;

export const getEnvironment = (): PlannerEnvironment => {
    cached ??= environmentSchema.parse(import.meta.env);
    return cached;
};

export const collaborationIsConfigured = (): boolean => {
    const environment = getEnvironment();
    return Boolean(
        environment.VITE_SUPABASE_URL &&
        environment.VITE_SUPABASE_PUBLISHABLE_KEY &&
        environment.VITE_TURNSTILE_SITE_KEY
    );
};
