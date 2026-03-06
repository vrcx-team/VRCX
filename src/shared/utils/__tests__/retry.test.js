import { executeWithBackoff } from '../retry';

describe('executeWithBackoff', () => {
    test('returns result on first success', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        const result = await executeWithBackoff(fn);
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('retries on failure then succeeds', async () => {
        const fn = vi
            .fn()
            .mockRejectedValueOnce(new Error('fail'))
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValue('ok');

        const result = await executeWithBackoff(fn, {
            maxRetries: 3,
            baseDelay: 1
        });
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    test('throws after exhausting retries', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('always fails'));

        await expect(
            executeWithBackoff(fn, { maxRetries: 2, baseDelay: 1 })
        ).rejects.toThrow('always fails');
        expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    test('stops retrying when shouldRetry returns false', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('permanent'));

        await expect(
            executeWithBackoff(fn, {
                maxRetries: 5,
                baseDelay: 1,
                shouldRetry: () => false
            })
        ).rejects.toThrow('permanent');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('uses exponential backoff delays', async () => {
        const delays = [];
        const originalSetTimeout = globalThis.setTimeout;
        vi.spyOn(globalThis, 'setTimeout').mockImplementation((fn, delay) => {
            delays.push(delay);
            return originalSetTimeout(fn, 0);
        });

        const mockFn = vi
            .fn()
            .mockRejectedValueOnce(new Error('1'))
            .mockRejectedValueOnce(new Error('2'))
            .mockRejectedValueOnce(new Error('3'))
            .mockResolvedValue('done');

        await executeWithBackoff(mockFn, { maxRetries: 5, baseDelay: 100 });

        // Delays: 100 * 2^0, 100 * 2^1, 100 * 2^2
        expect(delays).toEqual([100, 200, 400]);

        vi.restoreAllMocks();
    });
});
