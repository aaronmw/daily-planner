import { describe, expect, it } from 'vitest';
import { isAllowedDesktopAuthUrl } from '../authGateway';

describe('desktop external authentication boundary', () => {
    it('allows only HTTPS authorization URLs on the linked Supabase project', () => {
        expect(
            isAllowedDesktopAuthUrl(
                'https://xgubpuynmcjscfxosplr.supabase.co/auth/v1/authorize?provider=google'
            )
        ).toBe(true);
        expect(
            isAllowedDesktopAuthUrl('https://example.com/auth/v1/authorize')
        ).toBe(false);
        expect(
            isAllowedDesktopAuthUrl(
                'http://xgubpuynmcjscfxosplr.supabase.co/auth/v1/authorize'
            )
        ).toBe(false);
        expect(
            isAllowedDesktopAuthUrl(
                'https://xgubpuynmcjscfxosplr.supabase.co/storage/v1/object'
            )
        ).toBe(false);
    });
});
