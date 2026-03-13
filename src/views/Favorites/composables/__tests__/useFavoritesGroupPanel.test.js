import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useFavoritesGroupPanel } from '../useFavoritesGroupPanel';

/**
 *
 * @param options
 */
function createPanel(options = {}) {
    const remoteGroups = options.remoteGroups ?? ref([]);
    const localGroups = options.localGroups ?? ref([]);
    const localFavorites = options.localFavorites ?? ref({});
    const clearSelection = options.clearSelection ?? vi.fn();
    const placeholders = options.placeholders ?? [];
    const hasHistory = options.hasHistory ?? false;
    const historyItems = options.historyItems ?? null;

    const panel = useFavoritesGroupPanel({
        remoteGroups,
        localGroups,
        localFavorites,
        clearSelection,
        placeholders,
        hasHistory,
        historyItems
    });

    return {
        panel,
        remoteGroups,
        localGroups,
        localFavorites,
        clearSelection,
        historyItems
    };
}

describe('useFavoritesGroupPanel', () => {
    it('selects remote placeholder by default when remote groups are unresolved', () => {
        const placeholders = [
            { key: 'avatar:avatars1', displayName: 'Group 1' }
        ];
        const { panel, clearSelection } = createPanel({ placeholders });

        panel.ensureSelectedGroup();

        expect(panel.selectedGroup.value).toEqual({
            type: 'remote',
            key: 'avatar:avatars1'
        });
        expect(clearSelection).toHaveBeenCalledTimes(1);
    });

    it('falls back to another local group when selected local group is removed', () => {
        const { panel, localGroups, clearSelection } = createPanel({
            localGroups: ref(['A', 'B']),
            localFavorites: ref({
                A: [{ id: 'a1' }],
                B: [{ id: 'b1' }]
            })
        });

        panel.selectGroup('local', 'A', { userInitiated: true });
        clearSelection.mockClear();

        localGroups.value = ['B'];
        panel.ensureSelectedGroup();

        expect(panel.selectedGroup.value).toEqual({ type: 'local', key: 'B' });
        expect(clearSelection).toHaveBeenCalledTimes(1);
    });

    it('falls back to history group when no remote/local groups are available', () => {
        const historyItems = ref([{ id: 'avtr_1' }]);
        const { panel } = createPanel({
            hasHistory: true,
            historyItems
        });

        panel.ensureSelectedGroup();

        expect(panel.selectedGroup.value).toEqual({
            type: 'history',
            key: 'local-history'
        });
    });
});
