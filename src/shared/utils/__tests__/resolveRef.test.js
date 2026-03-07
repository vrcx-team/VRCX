import { resolveRef } from '../resolveRef';

describe('resolveRef', () => {
    const emptyDefault = { id: '', displayName: '' };
    const nameKey = 'displayName';
    const idAlias = 'userId';
    const mockFetchFn = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns emptyDefault for null input', async () => {
        const result = await resolveRef(null, {
            emptyDefault,
            idAlias,
            nameKey,
            fetchFn: mockFetchFn
        });
        expect(result).toEqual(emptyDefault);
        expect(mockFetchFn).not.toHaveBeenCalled();
    });

    test('returns emptyDefault for empty string input', async () => {
        const result = await resolveRef('', {
            emptyDefault,
            idAlias,
            nameKey,
            fetchFn: mockFetchFn
        });
        expect(result).toEqual(emptyDefault);
    });

    test('converts string input to object and fetches name', async () => {
        mockFetchFn.mockResolvedValue({
            ref: { id: 'usr_123', displayName: 'Alice' }
        });
        const result = await resolveRef('usr_123', {
            emptyDefault,
            idAlias,
            nameKey,
            fetchFn: mockFetchFn
        });
        expect(mockFetchFn).toHaveBeenCalledWith('usr_123');
        expect(result.id).toBe('usr_123');
        expect(result.displayName).toBe('Alice');
    });

    test('returns object with name when name is already present', async () => {
        const input = { id: 'usr_456', displayName: 'Bob' };
        const result = await resolveRef(input, {
            emptyDefault,
            idAlias,
            nameKey,
            fetchFn: mockFetchFn
        });
        expect(mockFetchFn).not.toHaveBeenCalled();
        expect(result.displayName).toBe('Bob');
    });

    test('fetches name when object has id but no name', async () => {
        mockFetchFn.mockResolvedValue({
            ref: { id: 'usr_789', displayName: 'Charlie' }
        });
        const result = await resolveRef(
            { id: 'usr_789' },
            { emptyDefault, idAlias, nameKey, fetchFn: mockFetchFn }
        );
        expect(mockFetchFn).toHaveBeenCalledWith('usr_789');
        expect(result.displayName).toBe('Charlie');
    });

    test('uses idAlias as fallback for id', async () => {
        mockFetchFn.mockResolvedValue({
            ref: { id: 'usr_alt', displayName: 'AltUser' }
        });
        const result = await resolveRef(
            { userId: 'usr_alt' },
            { emptyDefault, idAlias, nameKey, fetchFn: mockFetchFn }
        );
        expect(mockFetchFn).toHaveBeenCalledWith('usr_alt');
        expect(result.displayName).toBe('AltUser');
    });

    test('handles fetch failure gracefully', async () => {
        mockFetchFn.mockRejectedValue(new Error('Network error'));
        const result = await resolveRef('usr_err', {
            emptyDefault,
            idAlias,
            nameKey,
            fetchFn: mockFetchFn
        });
        expect(result.id).toBe('usr_err');
        expect(result.displayName).toBe('');
    });

    test('returns input properties when no id and no name', async () => {
        const input = { someField: 'value' };
        const result = await resolveRef(input, {
            emptyDefault,
            idAlias,
            nameKey,
            fetchFn: mockFetchFn
        });
        expect(mockFetchFn).not.toHaveBeenCalled();
        expect(result.someField).toBe('value');
    });
});
