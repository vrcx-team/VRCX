import { resolveRef } from '../utils/resolveRef';

describe('resolveRef', () => {
    const emptyDefault = { id: '', name: '' };
    const opts = {
        emptyDefault,
        idAlias: 'worldId',
        nameKey: 'name',
        fetchFn: vi.fn()
    };

    beforeEach(() => {
        opts.fetchFn.mockReset();
    });

    test('returns emptyDefault for null input', async () => {
        expect(await resolveRef(null, opts)).toEqual(emptyDefault);
    });

    test('returns emptyDefault for undefined input', async () => {
        expect(await resolveRef(undefined, opts)).toEqual(emptyDefault);
    });

    test('normalises string input to object', async () => {
        const result = await resolveRef('wrld_123', {
            ...opts,
            fetchFn: vi.fn().mockResolvedValue({
                ref: { name: 'MyWorld', extra: true }
            })
        });
        expect(result.id).toBe('wrld_123');
        expect(result.name).toBe('MyWorld');
    });

    test('uses idAlias when id is missing', async () => {
        const result = await resolveRef(
            { worldId: 'wrld_456', name: 'World' },
            opts
        );
        expect(result.id).toBe('wrld_456');
        expect(result.name).toBe('World');
        expect(opts.fetchFn).not.toHaveBeenCalled();
    });

    test('fetches when name is empty', async () => {
        opts.fetchFn.mockResolvedValue({
            ref: { name: 'Fetched', data: 42 }
        });
        const result = await resolveRef({ id: 'wrld_789', name: '' }, opts);
        expect(opts.fetchFn).toHaveBeenCalledWith('wrld_789');
        expect(result.id).toBe('wrld_789');
        expect(result.name).toBe('Fetched');
        expect(result.data).toBe(42);
    });

    test('returns input with id when fetch fails', async () => {
        opts.fetchFn.mockRejectedValue(new Error('network'));
        const result = await resolveRef({ id: 'wrld_111', name: '' }, opts);
        expect(result.id).toBe('wrld_111');
        expect(result.name).toBe('');
    });

    test('does not fetch when name is already present', async () => {
        const result = await resolveRef(
            { id: 'wrld_222', name: 'Known' },
            opts
        );
        expect(opts.fetchFn).not.toHaveBeenCalled();
        expect(result.name).toBe('Known');
    });

    test('works with user-style config (displayName)', async () => {
        const userOpts = {
            emptyDefault: { id: '', displayName: '' },
            idAlias: 'userId',
            nameKey: 'displayName',
            fetchFn: vi.fn().mockResolvedValue({
                ref: { displayName: 'Alice', status: 'online' }
            })
        };
        const result = await resolveRef('usr_1', userOpts);
        expect(result.id).toBe('usr_1');
        expect(result.displayName).toBe('Alice');
        expect(result.status).toBe('online');
    });
});
