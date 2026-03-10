import { computed } from 'vue';

/**
 * A composable that provides key-based selection for an options map.
 * Extracts the repeated pattern of finding the current option's key from an
 * options object and selecting a new option by key.
 * @param {object} optionsMap - A static object mapping string keys to option objects
 *   (each option should have at least `value` and `name` properties).
 * @param {() => any} getCurrentValue - A getter function that returns the currently
 *   selected option value (e.g., `() => userDialog.value.worldSorting`).
 * @param {(option: any) => void} onSelect - Callback invoked when a new option is
 *   selected by key. Receives the full option object.
 * @returns {{ selectedKey: import('vue').ComputedRef<string>, selectByKey: (key: string) => void }}
 */
export function useOptionKeySelect(optionsMap, getCurrentValue, onSelect) {
    const selectedKey = computed(() => {
        const current = getCurrentValue();
        const found = Object.entries(optionsMap).find(([, option]) => {
            if (option === current) {
                return true;
            }
            return (
                option?.value === current?.value ||
                option?.name === current?.name
            );
        });
        return found ? String(found[0]) : '';
    });

    /**
     * @param {string} key
     */
    function selectByKey(key) {
        const option = optionsMap[key];
        if (!option) {
            return;
        }
        onSelect(option);
    }

    return { selectedKey, selectByKey };
}
