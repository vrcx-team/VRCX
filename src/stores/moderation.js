import { defineStore } from 'pinia';
import Vue, { computed, reactive, watch } from 'vue';
import { avatarModerationRequest, playerModerationRequest } from '../api';
import { $app } from '../app';
import { watchState } from '../service/watchState';
import { useAvatarStore } from './avatar';
import { useUserStore } from './user';
import { useI18n } from 'vue-i18n-bridge';

export const useModerationStore = defineStore('Moderation', () => {
    const avatarStore = useAvatarStore();
    const userStore = useUserStore();
    const { t } = useI18n();

    const state = reactive({
        cachedPlayerModerations: new Map(),
        cachedPlayerModerationsUserIds: new Set(),
        isPlayerModerationsLoading: false,
        playerModerationTable: {
            data: [],
            pageSize: 15
        }
    });

    const cachedPlayerModerations = computed({
        get: () => state.cachedPlayerModerations,
        set: (value) => {
            state.cachedPlayerModerations = value;
        }
    });

    const cachedPlayerModerationsUserIds = computed({
        get: () => state.cachedPlayerModerationsUserIds,
        set: (value) => {
            state.cachedPlayerModerationsUserIds = value;
        }
    });

    const isPlayerModerationsLoading = computed({
        get: () => state.isPlayerModerationsLoading,
        set: (value) => {
            state.isPlayerModerationsLoading = value;
        }
    });

    const playerModerationTable = computed({
        get: () => state.playerModerationTable,
        set: (value) => {
            state.playerModerationTable = value;
        }
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            state.cachedPlayerModerations.clear();
            state.cachedPlayerModerationsUserIds.clear();
            state.isPlayerModerationsLoading = false;
            state.playerModerationTable.data = [];
            if (isLoggedIn) {
                refreshPlayerModerations();
            }
        },
        { flush: 'sync' }
    );

    function handlePlayerModerationAtDelete(args) {
        const { ref } = args;
        const D = userStore.userDialog;
        if (
            D.visible === false ||
            ref.targetUserId !== D.id ||
            ref.sourceUserId !== userStore.currentUser.id
        ) {
            return;
        }
        if (ref.type === 'block') {
            D.isBlock = false;
        } else if (ref.type === 'mute') {
            D.isMute = false;
        } else if (ref.type === 'hideAvatar') {
            D.isHideAvatar = false;
        } else if (ref.type === 'interactOff') {
            D.isInteractOff = false;
        } else if (ref.type === 'muteChat') {
            D.isMuteChat = false;
        }

        const array = state.playerModerationTable.data;
        const { length } = array;
        for (let i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                array.splice(i, 1);
                return;
            }
        }
    }

    function handlePlayerModerationDelete(args) {
        let { type, moderated } = args.params;
        const userId = userStore.currentUser.id;
        for (let ref of state.cachedPlayerModerations.values()) {
            if (
                ref.type === type &&
                ref.targetUserId === moderated &&
                ref.sourceUserId === userId
            ) {
                state.cachedPlayerModerations.delete(ref.id);
                handlePlayerModerationAtDelete({
                    ref,
                    params: {
                        playerModerationId: ref.id
                    }
                });
            }
        }
        state.cachedPlayerModerationsUserIds.delete(moderated);
    }

    /**
     *
     * @param {object} json
     * @returns {object}
     */
    function applyPlayerModeration(json) {
        let ref = state.cachedPlayerModerations.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                type: '',
                sourceUserId: '',
                sourceDisplayName: '',
                targetUserId: '',
                targetDisplayName: '',
                created: '',
                // VRCX
                $isExpired: false,
                //
                ...json
            };
            state.cachedPlayerModerations.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        if (json.targetUserId) {
            state.cachedPlayerModerationsUserIds.add(json.targetUserId);
        }
        const array = state.playerModerationTable.data;
        const index = array.findIndex((item) => item.id === ref.id);
        if (index !== -1) {
            array[index] = ref;
        } else {
            array.push(ref);
        }
        return ref;
    }

    function expirePlayerModerations() {
        state.cachedPlayerModerationsUserIds.clear();
        for (let ref of state.cachedPlayerModerations.values()) {
            ref.$isExpired = true;
        }
    }

    function deleteExpiredPlayerModerations() {
        for (let ref of state.cachedPlayerModerations.values()) {
            if (!ref.$isExpired) {
                continue;
            }
            handlePlayerModerationAtDelete({
                ref,
                params: {
                    playerModerationId: ref.id
                }
            });
        }
    }

    async function refreshPlayerModerations() {
        if (state.isPlayerModerationsLoading) {
            return;
        }
        state.isPlayerModerationsLoading = true;
        expirePlayerModerations();
        Promise.all([
            playerModerationRequest.getPlayerModerations(),
            avatarModerationRequest.getAvatarModerations()
        ])
            .finally(() => {
                state.isPlayerModerationsLoading = false;
            })
            .then((res) => {
                // TODO: compare with cachedAvatarModerations
                avatarStore.cachedAvatarModerations = new Map();
                if (res[1]?.json) {
                    for (const json of res[1].json) {
                        avatarStore.applyAvatarModeration(json);
                    }
                }
                if (res[0]?.json) {
                    for (let json of res[0].json) {
                        applyPlayerModeration(json);
                    }
                }
                deleteExpiredPlayerModerations();
            })
            .catch((error) => {
                console.error(
                    'Failed to load player/avatar moderations:',
                    error
                );
            });
    }

    return {
        state,
        cachedPlayerModerations,
        cachedPlayerModerationsUserIds,
        isPlayerModerationsLoading,
        playerModerationTable,

        refreshPlayerModerations,
        applyPlayerModeration,
        handlePlayerModerationDelete
    };
});
