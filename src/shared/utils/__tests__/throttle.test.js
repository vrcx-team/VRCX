import { createRateLimiter } from '../throttle';

describe('createRateLimiter', () => {
    test('schedule executes function and returns result', async () => {
        const limiter = createRateLimiter({
            limitPerInterval: 10,
            intervalMs: 1000
        });
        const result = await limiter.schedule(() => 42);
        expect(result).toBe(42);
    });

    test('schedule executes async functions', async () => {
        const limiter = createRateLimiter({
            limitPerInterval: 10,
            intervalMs: 1000
        });
        const result = await limiter.schedule(
            () => new Promise((r) => setTimeout(() => r('async'), 10))
        );
        expect(result).toBe('async');
    });

    test('allows bursts up to limit', async () => {
        const limiter = createRateLimiter({
            limitPerInterval: 3,
            intervalMs: 1000
        });
        const results = [];
        for (let i = 0; i < 3; i++) {
            results.push(await limiter.schedule(() => i));
        }
        expect(results).toEqual([0, 1, 2]);
    });

    test('clear resets the rate limiter', async () => {
        const limiter = createRateLimiter({
            limitPerInterval: 1,
            intervalMs: 50
        });

        await limiter.schedule(() => 'first');
        limiter.clear();
        // After clear, should be able to schedule immediately
        const result = await limiter.schedule(() => 'second');
        expect(result).toBe('second');
    });

    test('wait resolves without executing a function', async () => {
        const limiter = createRateLimiter({
            limitPerInterval: 10,
            intervalMs: 1000
        });
        await expect(limiter.wait()).resolves.toBeUndefined();
    });
});
