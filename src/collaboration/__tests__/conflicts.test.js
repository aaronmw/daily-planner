import { getChangedFields, rebaseRecord } from '../conflicts';

describe('field-aware three-way rebasing', () => {
    it('automatically merges changes to different fields', () => {
        const base = { label: 'Task', notes: 'Old', duration: 30 };
        const local = { ...base, label: 'Renamed' };
        const remote = { ...base, duration: 45 };

        expect(rebaseRecord({ base, local, remote })).toEqual({
            canAutoMerge: true,
            conflicts: [],
            merged: { label: 'Renamed', notes: 'Old', duration: 45 },
        });
    });

    it('reports overlapping changes and preserves the local candidate', () => {
        const result = rebaseRecord({
            base: { label: 'Task', notes: 'Old' },
            local: { label: 'Mine', notes: 'Old' },
            remote: { label: 'Theirs', notes: 'Old' },
        });

        expect(result).toEqual({
            canAutoMerge: false,
            conflicts: [
                {
                    base: 'Task',
                    field: 'label',
                    local: 'Mine',
                    remote: 'Theirs',
                },
            ],
            merged: { label: 'Mine', notes: 'Old' },
        });
    });

    it('treats equal concurrent edits and deletions as non-conflicting', () => {
        const base = { label: 'Task', obsolete: true };
        const local = { label: 'Same' };
        const remote = { label: 'Same' };

        expect(rebaseRecord({ base, local, remote })).toEqual({
            canAutoMerge: true,
            conflicts: [],
            merged: { label: 'Same' },
        });
        expect(getChangedFields(base, local)).toEqual(['label', 'obsolete']);
    });

    it('compares structured field values independent of key order', () => {
        const result = rebaseRecord({
            base: { metadata: { a: 1, b: 2 } },
            local: { metadata: { a: 2, b: 2 } },
            remote: { metadata: { b: 2, a: 2 } },
        });

        expect(result.canAutoMerge).toBe(true);
        expect(result.conflicts).toEqual([]);
    });
});
