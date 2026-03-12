import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mocks = vi.hoisted(() => ({
    execute: vi.fn(),
    openExternalLink: vi.fn()
}));

vi.mock('../../services/webapi', () => ({
    default: {
        execute: (...args) => mocks.execute(...args)
    }
}));

vi.mock('worker-timers', () => ({
    setInterval: vi.fn(),
    clearInterval: vi.fn(),
    setTimeout: vi.fn(),
    clearTimeout: vi.fn()
}));

vi.mock('../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args)
}));

/**
 *
 */
function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

import { useVrcStatusStore } from '../vrcStatus';

describe('useVrcStatusStore.getVrcStatus', () => {
    beforeEach(async () => {
        mocks.execute.mockResolvedValue({
            status: 200,
            data: JSON.stringify({
                page: { updated_at: '2026-01-01T00:00:00.000Z' },
                status: { description: 'All Systems Operational' }
            })
        });

        setActivePinia(createPinia());
        useVrcStatusStore();
        await flushPromises();
        vi.clearAllMocks();
    });

    test('sets failed status when API returns non-200', async () => {
        const store = useVrcStatusStore();
        mocks.execute.mockResolvedValueOnce({
            status: 503,
            data: 'service unavailable'
        });

        await store.getVrcStatus();

        expect(mocks.execute).toHaveBeenCalledWith({
            url: 'https://status.vrchat.com/api/v2/status.json',
            method: 'GET',
            headers: { Referer: 'https://vrcx.app' }
        });
        expect(store.lastStatus).toBe('Failed to fetch VRC status');
        expect(store.hasIssue).toBe(true);
    });

    test('fetches summary for incident status and appends component summary', async () => {
        const store = useVrcStatusStore();
        mocks.execute
            .mockResolvedValueOnce({
                status: 200,
                data: JSON.stringify({
                    page: { updated_at: '2026-01-02T00:00:00.000Z' },
                    status: { description: 'Partial System Outage' }
                })
            })
            .mockResolvedValueOnce({
                status: 200,
                data: JSON.stringify({
                    components: [
                        { name: 'API', status: 'major_outage' },
                        { name: 'Website', status: 'operational' },
                        { name: 'CDN', status: 'partial_outage' }
                    ]
                })
            });

        await store.getVrcStatus();
        await flushPromises();

        expect(mocks.execute).toHaveBeenCalledTimes(2);
        expect(mocks.execute.mock.calls[1][0].url).toBe(
            'https://status.vrchat.com/api/v2/summary.json'
        );
        expect(store.lastStatus).toBe('Partial System Outage');
        expect(store.statusText).toBe('Partial System Outage: API, CDN');
        expect(store.hasIssue).toBe(true);
    });

    test('clears status when all systems are operational', async () => {
        const store = useVrcStatusStore();
        mocks.execute.mockResolvedValueOnce({
            status: 200,
            data: JSON.stringify({
                page: { updated_at: '2026-01-03T00:00:00.000Z' },
                status: { description: 'All Systems Operational' }
            })
        });

        await store.getVrcStatus();

        expect(mocks.execute).toHaveBeenCalledTimes(1);
        expect(store.lastStatus).toBe('');
        expect(store.statusText).toBe('');
    });
});
