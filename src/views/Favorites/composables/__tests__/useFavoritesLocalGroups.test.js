import { describe, expect, it, vi } from 'vitest';

import { useFavoritesLocalGroups } from '../useFavoritesLocalGroups';

describe('useFavoritesLocalGroups', () => {
    it('starts, confirms and selects created local group', async () => {
        const createGroup = vi.fn();
        const selectGroup = vi.fn();
        const api = useFavoritesLocalGroups({ createGroup, selectGroup });

        api.startLocalGroupCreation();
        expect(api.isCreatingLocalGroup.value).toBe(true);

        api.newLocalGroupName.value = '  Local A  ';
        api.handleLocalGroupCreationConfirm();
        await Promise.resolve();

        expect(createGroup).toHaveBeenCalledWith('Local A');
        expect(selectGroup).toHaveBeenCalledWith('local', 'Local A', {
            userInitiated: true
        });
        expect(api.isCreatingLocalGroup.value).toBe(false);
    });

    it('cancels when name is empty', () => {
        const createGroup = vi.fn();
        const selectGroup = vi.fn();
        const api = useFavoritesLocalGroups({ createGroup, selectGroup });

        api.startLocalGroupCreation();
        api.newLocalGroupName.value = '   ';
        api.handleLocalGroupCreationConfirm();

        expect(createGroup).not.toHaveBeenCalled();
        expect(selectGroup).not.toHaveBeenCalled();
        expect(api.isCreatingLocalGroup.value).toBe(false);
    });
});
