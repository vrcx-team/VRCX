<template>
    <div class="user-dialog-scrollbars flex-1 min-h-0 min-w-0 flex flex-row">
        <DialogHeader class="sr-only">
            <DialogTitle>{{
                userDialog.ref?.displayName || userDialog.id || t('dialog.user.info.header')
            }}</DialogTitle>
            <DialogDescription>{{ getUserStateText(userDialog.ref || {}) }}</DialogDescription>
        </DialogHeader>

        <div class="flex-none w-77 overflow-y-auto">
            <UserSummaryHeader
                :get-user-state-text="getUserStateText"
                :copy-user-display-name="copyUserDisplayName"
                :toggle-badge-visibility="toggleBadgeVisibility"
                :toggle-badge-showcased="toggleBadgeShowcased"
                :user-dialog-command="userDialogCommand" />
        </div>

        <div class="flex-1 min-w-0 flex flex-col min-h-0 pl-2">
            <TabsUnderline
                v-model="userDialog.activeTab"
                :items="userDialogTabs"
                :tab-color="userDialogTabColor"
                :unmount-on-hide="false"
                fill
                :background="true"
                @update:modelValue="userDialogTabClick">
                <template #Info>
                    <UserDialogInfoTab ref="infoTabRef" />
                </template>

                <template v-if="userDialog.id !== currentUser.id && !currentUser.hasSharedConnectionsOptOut" #mutual>
                    <UserDialogMutualFriendsTab ref="mutualFriendsTabRef" />
                </template>

                <template #Groups>
                    <UserDialogGroupsTab ref="groupsTabRef" />
                </template>

                <template #Worlds>
                    <UserDialogWorldsTab ref="worldsTabRef" />
                </template>

                <template #favorite-worlds>
                    <UserDialogFavoriteWorldsTab ref="favoriteWorldsTabRef" />
                </template>

                <template #Avatars>
                    <UserDialogAvatarsTab ref="avatarsTabRef" />
                </template>

                <template #Activity>
                    <UserDialogActivityTab ref="activityTabRef" />
                </template>

                <template #JSON>
                    <DialogJsonTab
                        class="rounded-xl bg-(--profile-card) p-2"
                        :tree-data="treeData"
                        :tree-data-key="treeData?.id"
                        :dialog-id="userDialog.id"
                        :dialog-ref="userDialog.ref"
                        @refresh="refreshUserDialogTreeData()" />
                </template>
            </TabsUnderline>
            <SendInviteDialog
                v-model:sendInviteDialogVisible="sendInviteDialogVisible"
                v-model:sendInviteDialog="sendInviteDialog"
                @closeInviteDialog="closeInviteDialog" />
            <SendInviteRequestDialog
                v-model:sendInviteRequestDialogVisible="sendInviteRequestDialogVisible"
                v-model:sendInviteDialog="sendInviteDialog"
                @closeInviteDialog="closeInviteDialog" />
            <ModerateGroupDialog />
        </div>
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useFavoriteStore,
        useFriendStore,
        useGalleryStore,
        useGroupStore,
        useInstanceStore,
        useInviteStore,
        useLocationStore,
        useModalStore,
        useModerationStore,
        useNotificationStore,
        useUserStore
    } from '../../../stores';
    import { copyToClipboard } from '../../../shared/utils';
    import { formatJsonVars } from '../../../shared/utils/base/ui';
    import { miscRequest } from '../../../api';
    import { useUserDialogCommands } from './useUserDialogCommands';
    import { showAvatarDialog, showAvatarAuthorDialog } from '../../../coordinators/avatarCoordinator';
    import { showUserDialog, refreshUserDialogAvatars } from '../../../coordinators/userCoordinator';
    import { getFriendRequest, handleFriendDelete } from '../../../coordinators/friendRelationshipCoordinator';

    import DialogJsonTab from '../DialogJsonTab.vue';
    import SendInviteDialog from '../InviteDialog/SendInviteDialog.vue';
    import UserDialogActivityTab from './UserDialogActivityTab.vue';
    import UserDialogAvatarsTab from './UserDialogAvatarsTab.vue';
    import UserDialogFavoriteWorldsTab from './UserDialogFavoriteWorldsTab.vue';
    import UserDialogGroupsTab from './UserDialogGroupsTab.vue';
    import UserDialogInfoTab from './UserDialogInfoTab.vue';
    import UserDialogMutualFriendsTab from './UserDialogMutualFriendsTab.vue';
    import UserDialogWorldsTab from './UserDialogWorldsTab.vue';
    import UserSummaryHeader from './UserSummaryHeader.vue';

    import ModerateGroupDialog from '../ModerateGroupDialog.vue';
    import SendInviteRequestDialog from './SendInviteRequestDialog.vue';

    const props = defineProps({
        previousIds: {
            type: Object,
            required: true
        },
        updatePreviousId: {
            type: Function,
            default: () => {}
        }
    });

    const { t } = useI18n();
    const userDialogTabs = computed(() => {
        const tabs = [
            { value: 'Info', label: t('dialog.user.info.header') },
            { value: 'Groups', label: t('dialog.user.groups.header') },
            { value: 'Worlds', label: t('dialog.user.worlds.header') },
            { value: 'favorite-worlds', label: t('dialog.user.favorite_worlds.header') },
            { value: 'Avatars', label: t('dialog.user.avatars.header') },
            { value: 'JSON', label: t('dialog.user.json.header') }
        ];
        if (userDialog.value.id !== currentUser.value.id && !currentUser.value.hasSharedConnectionsOptOut) {
            tabs.splice(1, 0, { value: 'mutual', label: t('dialog.user.mutual_friends.header') });
        }
        // Insert Activity before JSON
        const jsonIdx = tabs.findIndex((tab) => tab.value === 'JSON');
        tabs.splice(jsonIdx, 0, { value: 'Activity', label: t('dialog.user.activity.header') });
        return tabs;
    });
    const infoTabRef = ref(null);
    const activityTabRef = ref(null);
    const favoriteWorldsTabRef = ref(null);
    const mutualFriendsTabRef = ref(null);
    const worldsTabRef = ref(null);
    const avatarsTabRef = ref(null);
    const groupsTabRef = ref(null);

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const userDialogTabColor = computed(() => {
        const color = userDialog.value.theme?.buttonColor;
        if (!color) {
            return 'var(--primary)';
        }
        return color;
    });
    const { cachedUsers, showSendBoopDialog, showEditProfileDialog } = useUserStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { showModerateGroupDialog } = useGroupStore();
    const { inviteGroupDialog } = storeToRefs(useGroupStore());
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { friendLogTable } = storeToRefs(useFriendStore());
    const { clearInviteImageUpload, showGalleryPage } = useGalleryStore();

    const { applyPlayerModeration, handlePlayerModerationDelete } = useModerationStore();

    const {
        sendInviteDialogVisible,
        sendInviteDialog,
        sendInviteRequestDialogVisible,
        userDialogCommand,
        registerCallbacks
    } = useUserDialogCommands(userDialog, {
        t,
        toast,
        modalStore,
        currentUser,
        cachedUsers,
        friendLogTable,
        lastLocation,
        lastLocationDestination,
        inviteGroupDialog,
        showUserDialog,
        showFavoriteDialog,
        showAvatarDialog,
        showAvatarAuthorDialog,
        showModerateGroupDialog,
        showSendBoopDialog,
        showGalleryPage,
        getFriendRequest,
        handleFriendDelete,
        applyPlayerModeration,
        handlePlayerModerationDelete,
        refreshInviteMessageTableData,
        clearInviteImageUpload,
        instanceStore,
        useNotificationStore,
        showEditProfileDialog
    });

    watch(
        () => userDialog.value.loading,
        () => {
            if (userDialog.value.visible) {
                !userDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    watch(
        () => userDialog.value.visible,
        (visible) => {
            if (visible && !userDialog.value.loading) {
                loadLastActiveTab();
            }
        }
    );

    const treeData = ref({});

    /**
     *
     * @param user
     */
    function getUserStateText(user) {
        let state = '';
        if (user.state === 'active') {
            state = t('dialog.user.status.active');
        } else if (user.state === 'offline') {
            state = t('dialog.user.status.offline');
        } else {
            return getUserStatusText(user.status);
        }
        if (user.status && user.status !== 'active') {
            state += ` (${getUserStatusText(user.status)})`;
        }
        return state;
    }

    /**
     *
     * @param status
     */
    function getUserStatusText(status) {
        if (status === 'active') {
            return t('dialog.user.status.active');
        }
        if (status === 'join me') {
            return t('dialog.user.status.join_me');
        }
        if (status === 'ask me') {
            return t('dialog.user.status.ask_me');
        }
        if (status === 'busy') {
            return t('dialog.user.status.busy');
        }
        return t('dialog.user.status.offline');
    }

    /**
     *
     */
    function refreshUserDialogTreeData() {
        const D = userDialog.value;
        if (D.id === currentUser.value.id) {
            treeData.value = formatJsonVars({
                currentUser: currentUser.value,
                user: D.ref,
                profile: D.publicProfileRef
            });
            return;
        }
        treeData.value = formatJsonVars({
            user: D.ref,
            profile: D.publicProfileRef
        });
    }

    /**
     *
     * @param tabName
     */
    function handleUserDialogTab(tabName) {
        userDialog.value.lastActiveTab = tabName;
        const userId = userDialog.value.id;
        if (tabName === 'Info') {
            infoTabRef.value?.onTabActivated();
        } else if (tabName === 'mutual') {
            if (userId === currentUser.value.id) {
                userDialog.value.activeTab = 'Info';
                userDialog.value.lastActiveTab = 'Info';
                return;
            }
            if (props.previousIds.mutualFriend !== userId) {
                props.updatePreviousId('mutualFriend', userId);
                mutualFriendsTabRef.value?.getUserMutualFriends(userId);
            }
        } else if (tabName === 'Groups') {
            if (props.previousIds.group !== userId) {
                props.updatePreviousId('group', userId);
                groupsTabRef.value?.getUserGroups(userId);
            }
        } else if (tabName === 'Avatars') {
            avatarsTabRef.value?.setUserDialogAvatars(userId);
            if (props.previousIds.avatar !== userId) {
                props.updatePreviousId('avatar', userId);
                if (userId === currentUser.value.id) {
                    refreshUserDialogAvatars();
                } else {
                    avatarsTabRef.value?.setUserDialogAvatarsRemote(userId);
                }
            }
        } else if (tabName === 'Worlds') {
            worldsTabRef.value?.setUserDialogWorlds(userId);
            if (props.previousIds.world !== userId) {
                props.updatePreviousId('world', userId);
                worldsTabRef.value?.refreshUserDialogWorlds();
            }
        } else if (tabName === 'favorite-worlds') {
            if (props.previousIds.favoriteWorld !== userId) {
                props.updatePreviousId('favoriteWorld', userId);
                favoriteWorldsTabRef.value?.getUserFavoriteWorlds(userId);
            }
        } else if (tabName === 'Activity') {
            activityTabRef.value?.loadOnlineFrequency(userId);
        } else if (tabName === 'JSON') {
            refreshUserDialogTreeData();
        }
    }

    /**
     *
     */
    function loadLastActiveTab() {
        const tab = userDialog.value.lastActiveTab;
        handleUserDialogTab(tab);
    }

    /**
     *
     * @param tabName
     */
    function userDialogTabClick(tabName) {
        if (tabName === userDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshUserDialogTreeData();
            }
            return;
        }
        handleUserDialogTab(tabName);
    }

    // Register simple dialog openers as callbacks for the command composable
    registerCallbacks({
        showEditProfileDialog
    });

    /**
     *
     * @param badge
     */
    async function toggleBadgeVisibility(badge) {
        if (badge.hidden) {
            badge.showcased = false;
        }
        const args = await miscRequest.updateBadge({
            badgeId: badge.badgeId,
            hidden: badge.hidden,
            showcased: badge.showcased
        });
        handleBadgeUpdate(args);
    }

    /**
     *
     * @param badge
     */
    async function toggleBadgeShowcased(badge) {
        if (badge.showcased) {
            badge.hidden = false;
        }
        const args = await miscRequest.updateBadge({
            badgeId: badge.badgeId,
            hidden: badge.hidden,
            showcased: badge.showcased
        });
        handleBadgeUpdate(args);
    }

    /**
     *
     * @param args
     */
    function handleBadgeUpdate(args) {
        if (args.json) {
            toast.success(t('message.badge.updated'));
        }
    }

    /**
     *
     * @param displayName
     */
    function copyUserDisplayName(displayName) {
        copyToClipboard(displayName, 'User DisplayName copied to clipboard');
    }

    /**
     *
     */
    function closeInviteDialog() {
        clearInviteImageUpload();
    }
</script>

<style scoped>
    .user-dialog-scrollbars {
        --user-dialog-scrollbar-thumb: color-mix(in oklab, var(--foreground) 30%, transparent);
        --user-dialog-scrollbar-track: transparent;
    }

    .user-dialog-scrollbars :deep(*) {
        scrollbar-color: var(--user-dialog-scrollbar-thumb) var(--user-dialog-scrollbar-track);
    }
</style>
