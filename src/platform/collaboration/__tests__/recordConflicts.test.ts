import { describe, expect, it } from 'vitest';
import { mergeDisjointChanges } from '../recordGateway';

describe('collaboration record conflict merging', () => {
    const base = {
        label: 'Base',
        notes: 'Original notes',
        revision: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('rebases non-overlapping local and remote changes', () => {
        expect(
            mergeDisjointChanges(
                base,
                { ...base, label: 'Local label', revision: 2 },
                { ...base, notes: 'Remote notes', revision: 2 }
            )
        ).toEqual({
            ...base,
            label: 'Local label',
            notes: 'Remote notes',
            revision: 2,
        });
    });

    it('requires a resolver when both clients changed the same field', () => {
        expect(
            mergeDisjointChanges(
                base,
                { ...base, label: 'Local label', revision: 2 },
                { ...base, label: 'Remote label', revision: 2 }
            )
        ).toBeNull();
    });
});
