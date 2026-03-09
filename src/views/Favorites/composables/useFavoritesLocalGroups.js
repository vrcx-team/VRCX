import { nextTick, ref } from 'vue';

/**
 * @param {object} options
 * @param {Function} options.createGroup - store function to create a new local group
 * @param {Function} options.selectGroup - function to select a group after creation
 * @returns {object}
 */
export function useFavoritesLocalGroups(options = {}) {
    const { createGroup, selectGroup, canCreate = () => true } = options;

    const isCreatingLocalGroup = ref(false);
    const newLocalGroupName = ref('');
    const newLocalGroupInput = ref(null);

    /**
     * @returns {void}
     */
    function startLocalGroupCreation() {
        if (!canCreate() || isCreatingLocalGroup.value) {
            return;
        }
        isCreatingLocalGroup.value = true;
        newLocalGroupName.value = '';
        nextTick(() => {
            const el =
                newLocalGroupInput.value?.$el ?? newLocalGroupInput.value;
            el?.focus?.();
        });
    }

    /**
     * @returns {void}
     */
    function cancelLocalGroupCreation() {
        isCreatingLocalGroup.value = false;
        newLocalGroupName.value = '';
    }

    /**
     * @returns {void}
     */
    function handleLocalGroupCreationConfirm() {
        const name = newLocalGroupName.value.trim();
        if (!name) {
            cancelLocalGroupCreation();
            return;
        }
        createGroup(name);
        cancelLocalGroupCreation();
        nextTick(() => {
            selectGroup('local', name, { userInitiated: true });
        });
    }

    return {
        isCreatingLocalGroup,
        newLocalGroupName,
        newLocalGroupInput,
        startLocalGroupCreation,
        cancelLocalGroupCreation,
        handleLocalGroupCreationConfirm
    };
}
