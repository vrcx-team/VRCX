import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('../../services/config.js', () => ({
    default: {
        getBool: vi.fn(),
        getString: vi.fn()
    }
}));

import configRepository from '../../services/config.js';
import { useGameStore } from '../game';

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useGameStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        configRepository.getBool.mockResolvedValue(true);
        configRepository.getString.mockImplementation((key, defaultValue) => {
            if (key === 'VRCX_lastGameSessionMs') {
                return Promise.resolve('7200000');
            }
            if (key === 'VRCX_lastGameOfflineAt') {
                return Promise.resolve('1700000000000');
            }
            return Promise.resolve(defaultValue ?? null);
        });
    });

    test('loads persisted last session data during init', async () => {
        const store = useGameStore();
        await flushPromises();

        expect(store.isGameNoVR).toBe(true);
        expect(store.lastSessionDurationMs).toBe(7200000);
        expect(store.lastOfflineAt).toBe(1700000000000);
    });

    test('setLastSession updates session values', () => {
        const store = useGameStore();

        store.setLastSession(15000, 25000);

        expect(store.lastSessionDurationMs).toBe(15000);
        expect(store.lastOfflineAt).toBe(25000);
    });
});
