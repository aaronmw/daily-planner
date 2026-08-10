import { describe, expect, it } from 'vitest';
import { parsePlannerDeepLink } from '../deepLinks';

describe('planner deep links', () => {
    it('validates share and authentication routes', () => {
        const listId = crypto.randomUUID();
        expect(
            parsePlannerDeepLink(
                `daily-planner://share/${listId}#invitation-secret`
            )
        ).toMatchObject({ listId, type: 'share' });
        expect(
            parsePlannerDeepLink('daily-planner://auth/callback#access_token=x')
        ).toMatchObject({ type: 'auth' });
    });

    it('rejects malformed and non-planner routes', () => {
        expect(parsePlannerDeepLink('not a URL')).toBeNull();
        expect(
            parsePlannerDeepLink('daily-planner://share/not-a-uuid')
        ).toBeNull();
        expect(parsePlannerDeepLink('https://example.com/items')).toBeNull();
    });
});
