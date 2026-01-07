import { reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { avatarModerationRequest, playerModerationRequest } from '../api';
import { useAvatarStore } from './avatar';
import { useUserStore } from './user';
import { watchState } from '../service/watchState';

export const useModerationStore = defineStore('Moderation', () => {
    const avatarStore = useAvatarStore();
    const userStore = useUserStore();

    const cachedPlayerModerations = reactive(new Map());
    const cachedPlayerModerationsUserIds = reactive(new Set());
    const playerModerationTable = ref({
        data: [],
        search: '',
        loading: false,
        filters: [
            {
                prop: 'type',
                value: []
            },
            {
                prop: ['sourceDisplayName', 'targetDisplayName'],
                value: ''
            }
        ],
        pageSize: 20,
        pageSizeLinked: true
    });

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            cachedPlayerModerations.clear();
            cachedPlayerModerationsUserIds.clear();
            playerModerationTable.value.loading = false;
            playerModerationTable.value.data = [];
            if (isLoggedIn) {
                refreshPlayerModerations();
            }
        },
        { flush: 'sync' }
    );

    function handlePlayerModerationAtDelete(args) {
        const { ref } = args;

        let hasModeration = false;
        for (const ref of cachedPlayerModerations.values()) {
            if (ref.targetUserId === ref.targetUserId) {
                hasModeration = true;
                break;
            }
        }
        if (!hasModeration) {
            cachedPlayerModerationsUserIds.delete(ref.targetUserId);
        }

        const userRef = userStore.cachedUsers.get(ref.targetUserId);
        if (typeof userRef !== 'undefined') {
            userRef.$moderations = getUserModerations(ref.targetUserId);
        }

        const array = playerModerationTable.value.data;
        const { length } = array;
        for (let i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                array.splice(i, 1);
                break;
            }
        }

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
    }

    function handlePlayerModerationDelete(args) {
        let { type, moderated } = args.params;
        const userId = userStore.currentUser.id;
        for (let ref of cachedPlayerModerations.values()) {
            if (
                ref.type === type &&
                ref.targetUserId === moderated &&
                ref.sourceUserId === userId
            ) {
                cachedPlayerModerations.delete(ref.id);
                handlePlayerModerationAtDelete({
                    ref,
                    params: {
                        playerModerationId: ref.id
                    }
                });
                break;
            }
        }
    }

    /**
     *
     * @param {object} json
     * @returns {object}
     */
    function applyPlayerModeration(json) {
        let ref = cachedPlayerModerations.get(json.id);
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
            cachedPlayerModerations.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        if (json.targetUserId) {
            cachedPlayerModerationsUserIds.add(json.targetUserId);
        }
        const array = playerModerationTable.value.data;
        const index = array.findIndex((item) => item.id === ref.id);
        if (index !== -1) {
            array[index] = ref;
        } else {
            array.push(ref);
        }
        const userRef = userStore.cachedUsers.get(ref.targetUserId);
        if (typeof userRef !== 'undefined') {
            userRef.$moderations = getUserModerations(ref.targetUserId);
        }
        return ref;
    }

    function expirePlayerModerations() {
        cachedPlayerModerationsUserIds.clear();
        for (let ref of cachedPlayerModerations.values()) {
            ref.$isExpired = true;
        }
    }

    function deleteExpiredPlayerModerations() {
        for (let ref of cachedPlayerModerations.values()) {
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
        if (playerModerationTable.value.loading) {
            return;
        }
        playerModerationTable.value.loading = true;
        expirePlayerModerations();
        Promise.all([
            playerModerationRequest.getPlayerModerations(),
            avatarModerationRequest.getAvatarModerations()
        ])
            .finally(() => {
                playerModerationTable.value.loading = false;
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

    /**
     * Get user moderations
     * @param {string} userId
     * @return {object} moderations
     * @property {boolean} isBlocked
     * @property {boolean} isMuted
     * @property {boolean} isAvatarInteractionDisabled
     * @property {boolean} isChatBoxMuted
     */
    function getUserModerations(userId) {
        let moderations = {
            isBlocked: false,
            isMuted: false,
            isAvatarInteractionDisabled: false,
            isChatBoxMuted: false
        };
        for (let ref of cachedPlayerModerations.values()) {
            if (ref.targetUserId !== userId) {
                continue;
            }
            switch (ref.type) {
                case 'block':
                    moderations.isBlocked = true;
                    break;
                case 'mute':
                    moderations.isMuted = true;
                    break;
                case 'interactOff':
                    moderations.isAvatarInteractionDisabled = true;
                    break;
                case 'muteChat':
                    moderations.isChatBoxMuted = true;
                    break;
            }
        }
        return moderations;
    }

    return {
        cachedPlayerModerations,
        cachedPlayerModerationsUserIds,
        playerModerationTable,

        refreshPlayerModerations,
        applyPlayerModeration,
        handlePlayerModerationDelete,
        getUserModerations
    };
});
