import { computed, ref } from 'vue';

/**
 * @param {object} options
 * @param {import('vue').Ref<Array>} options.remoteGroups - remote groups ref
 * @param {import('vue').Ref<Array>} options.localGroups - local groups ref (string keys)
 * @param {import('vue').Ref<object>} options.localFavorites - local favorites map { groupKey: items[] }
 * @param {Function} options.clearSelection - callback to clear entity selection
 * @param {Array} [options.placeholders] - placeholder groups when remote data not yet loaded
 * @param {boolean} [options.hasHistory] - whether history group type is supported (Avatar only)
 * @param {import('vue').Ref<Array>} [options.historyItems] - items for history group
 * @returns {object}
 */
export function useFavoritesGroupPanel(options = {}) {
    const {
        remoteGroups,
        localGroups,
        localFavorites,
        clearSelection,
        placeholders = [],
        hasHistory = false,
        historyItems = null
    } = options;

    const selectedGroup = ref(null);
    const activeGroupMenu = ref(null);
    const hasUserSelectedGroup = ref(false);
    const remoteGroupsResolved = ref(false);

    const isRemoteGroupSelected = computed(
        () => selectedGroup.value?.type === 'remote'
    );
    const isLocalGroupSelected = computed(
        () => selectedGroup.value?.type === 'local'
    );
    const isHistorySelected = computed(
        () => hasHistory && selectedGroup.value?.type === 'history'
    );

    const remoteGroupMenuKey = (key) => `remote:${key}`;
    const localGroupMenuKey = (key) => `local:${key}`;

    const activeRemoteGroup = computed(() => {
        if (!isRemoteGroupSelected.value) {
            return null;
        }
        return (
            remoteGroups.value.find(
                (group) => group.key === selectedGroup.value.key
            ) || null
        );
    });

    const activeLocalGroupName = computed(() => {
        if (!isLocalGroupSelected.value) {
            return '';
        }
        return selectedGroup.value.key;
    });

    const activeLocalGroupCount = computed(() => {
        if (!activeLocalGroupName.value) {
            return 0;
        }
        const favorites = localFavorites.value[activeLocalGroupName.value];
        return favorites ? favorites.length : 0;
    });

    /**
     *
     * @param key {string}
     * @param visible {boolean}
     */
    function handleGroupMenuVisible(key, visible) {
        if (visible) {
            activeGroupMenu.value = key;
            return;
        }
        if (activeGroupMenu.value === key) {
            activeGroupMenu.value = null;
        }
    }

    /**
     *
     * @param type {string}
     * @param key {string}
     * @param options {object}
     * @param opts {object}
     */
    function selectGroup(type, key, opts = {}) {
        if (
            selectedGroup.value?.type === type &&
            selectedGroup.value?.key === key
        ) {
            return;
        }
        selectedGroup.value = { type, key };
        if (opts.userInitiated) {
            hasUserSelectedGroup.value = true;
        }
        clearSelection();
    }

    /**
     *
     * @param type {string}
     * @param key {string}
     * @returns {boolean}
     */
    function isGroupActive(type, key) {
        return (
            selectedGroup.value?.type === type &&
            selectedGroup.value?.key === key
        );
    }

    /**
     *
     * @param group {object}
     * @returns {boolean}
     */
    function isGroupAvailable(group) {
        if (!group) {
            return false;
        }
        if (group.type === 'remote') {
            if (placeholders.length && !remoteGroupsResolved.value) {
                return true;
            }
            return remoteGroups.value.some((item) => item.key === group.key);
        }
        if (group.type === 'local') {
            return localGroups.value.includes(group.key);
        }
        if (group.type === 'history' && hasHistory && historyItems) {
            return historyItems.value.length > 0;
        }
        return false;
    }

    /**
     * @returns {void}
     */
    function selectDefaultGroup() {
        if (!hasUserSelectedGroup.value && placeholders.length) {
            const remote =
                remoteGroups.value.find((group) => group.count > 0) ||
                remoteGroups.value[0] ||
                placeholders[0];
            if (remote) {
                selectGroup('remote', remote.key);
                return;
            }
        } else if (remoteGroups.value.length) {
            const remote =
                remoteGroups.value.find((group) => group.count > 0) ||
                remoteGroups.value[0];
            if (remote) {
                selectGroup('remote', remote.key);
                return;
            }
        }
        if (localGroups.value.length) {
            selectGroup('local', localGroups.value[0]);
            return;
        }
        if (hasHistory && historyItems && historyItems.value.length) {
            selectGroup('history', 'local-history');
            return;
        }
        selectedGroup.value = null;
        clearSelection();
    }

    /**
     * @returns {void}
     */
    function ensureSelectedGroup() {
        if (selectedGroup.value && isGroupAvailable(selectedGroup.value)) {
            return;
        }
        selectDefaultGroup();
    }

    return {
        selectedGroup,
        activeGroupMenu,
        hasUserSelectedGroup,
        remoteGroupsResolved,
        isRemoteGroupSelected,
        isLocalGroupSelected,
        isHistorySelected,
        remoteGroupMenuKey,
        localGroupMenuKey,
        activeRemoteGroup,
        activeLocalGroupName,
        activeLocalGroupCount,
        handleGroupMenuVisible,
        selectGroup,
        isGroupActive,
        isGroupAvailable,
        selectDefaultGroup,
        ensureSelectedGroup
    };
}
