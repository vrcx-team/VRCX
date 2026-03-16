<template>
    <div class="w-223">
        <DialogHeader class="sr-only">
            <DialogTitle>{{
                userDialog.ref?.displayName || userDialog.id || t('dialog.user.info.header')
            }}</DialogTitle>
            <DialogDescription>{{ getUserStateText(userDialog.ref || {}) }}</DialogDescription>
        </DialogHeader>
        <UserSummaryHeader
            :get-user-state-text="getUserStateText"
            :copy-user-display-name="copyUserDisplayName"
            :toggle-badge-visibility="toggleBadgeVisibility"
            :toggle-badge-showcased="toggleBadgeShowcased"
            :user-dialog-command="userDialogCommand" />

        <TabsUnderline
            v-model="userDialog.activeTab"
            :items="userDialogTabs"
            :unmount-on-hide="false"
            @update:modelValue="userDialogTabClick">
            <template #Info>
                <UserDialogInfoTab ref="infoTabRef" @show-bio-dialog="showBioDialog" />
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

            <template v-if="userDialog.id !== currentUser.id" #Activity>
                <UserDialogActivityTab ref="activityTabRef" />
            </template>

            <template #JSON>
                <DialogJsonTab
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
        <SocialStatusDialog
            :social-status-dialog="socialStatusDialog"
            :social-status-history-table="socialStatusHistoryTable" />
        <LanguageDialog />
        <BioDialog :bio-dialog="bioDialog" />
        <PronounsDialog :pronouns-dialog="pronounsDialog" />
        <ModerateGroupDialog />
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

    import BioDialog from './BioDialog.vue';
    import LanguageDialog from './LanguageDialog.vue';
    import ModerateGroupDialog from '../ModerateGroupDialog.vue';
    import PronounsDialog from './PronounsDialog.vue';
    import SendInviteRequestDialog from './SendInviteRequestDialog.vue';
    import SocialStatusDialog from './SocialStatusDialog.vue';

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
        if (userDialog.value.id !== currentUser.value.id) {
            // Insert Activity before JSON
            const jsonIdx = tabs.findIndex((tab) => tab.value === 'JSON');
            tabs.splice(jsonIdx, 0, { value: 'Activity', label: t('dialog.user.activity.header') });
        }
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

    const { userDialog, languageDialog, currentUser } = storeToRefs(useUserStore());
    const { cachedUsers, showSendBoopDialog } = useUserStore();
    const { showFavoriteDialog } = useFavoriteStore();
    import { showAvatarDialog, showAvatarAuthorDialog } from '../../../coordinators/avatarCoordinator';
    import { showUserDialog, refreshUserDialogAvatars } from '../../../coordinators/userCoordinator';
    import { getFriendRequest, handleFriendDelete } from '../../../coordinators/friendRelationshipCoordinator';

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
        useNotificationStore
    });

    watch(
        () => userDialog.value.loading,
        () => {
            if (userDialog.value.visible) {
                !userDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    const userDialogLastMutualFriends = ref('');
    const userDialogLastGroup = ref('');
    const userDialogLastAvatar = ref('');
    const userDialogLastWorld = ref('');
    const userDialogLastFavoriteWorld = ref('');

    const socialStatusDialog = ref({
        visible: false,
        loading: false,
        status: '',
        statusDescription: ''
    });
    const socialStatusHistoryTable = ref({
        data: [],

        layout: 'table'
    });

    const bioDialog = ref({
        visible: false,
        loading: false,
        bio: '',
        bioLinks: []
    });

    const pronounsDialog = ref({
        visible: false,
        loading: false,
        pronouns: ''
    });
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
                ...currentUser.value,
                ...D.ref
            });
            return;
        }
        treeData.value = formatJsonVars(D.ref);
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
            if (userDialogLastMutualFriends.value !== userId) {
                userDialogLastMutualFriends.value = userId;
                mutualFriendsTabRef.value?.getUserMutualFriends(userId);
            }
        } else if (tabName === 'Groups') {
            if (userDialogLastGroup.value !== userId) {
                userDialogLastGroup.value = userId;
                groupsTabRef.value?.getUserGroups(userId);
            }
        } else if (tabName === 'Avatars') {
            avatarsTabRef.value?.setUserDialogAvatars(userId);
            if (userDialogLastAvatar.value !== userId) {
                userDialogLastAvatar.value = userId;
                if (userId === currentUser.value.id) {
                    refreshUserDialogAvatars();
                } else {
                    avatarsTabRef.value?.setUserDialogAvatarsRemote(userId);
                }
            }
        } else if (tabName === 'Worlds') {
            worldsTabRef.value?.setUserDialogWorlds(userId);
            if (userDialogLastWorld.value !== userId) {
                userDialogLastWorld.value = userId;
                worldsTabRef.value?.refreshUserDialogWorlds();
            }
        } else if (tabName === 'favorite-worlds') {
            if (userDialogLastFavoriteWorld.value !== userId) {
                userDialogLastFavoriteWorld.value = userId;
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
        let tab = userDialog.value.lastActiveTab;
        // Activity tab is not available for own profile; fall back to Info
        if (tab === 'Activity' && userDialog.value.id === currentUser.value.id) {
            tab = 'Info';
            userDialog.value.lastActiveTab = 'Info';
            userDialog.value.activeTab = 'Info';
        }
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

    /**
     *
     */
    function showPronounsDialog() {
        const D = pronounsDialog.value;
        D.pronouns = currentUser.value.pronouns;
        D.visible = true;
    }

    /**
     *
     */
    function showLanguageDialog() {
        const D = languageDialog.value;
        D.visible = true;
    }

    // Register simple dialog openers as callbacks for the command composable
    registerCallbacks({
        showSocialStatusDialog,
        showLanguageDialog,
        showBioDialog,
        showPronounsDialog,
        showEditNoteAndMemoDialog: () => {
            infoTabRef.value?.showEditNoteAndMemoDialog();
        }
    });

    /**
     *
     */
    function showSocialStatusDialog() {
        const D = socialStatusDialog.value;
        const { statusHistory } = currentUser.value;
        const statusHistoryArray = [];
        for (let i = 0; i < statusHistory.length; ++i) {
            const addStatus = {
                no: i + 1,
                status: statusHistory[i]
            };
            statusHistoryArray.push(addStatus);
        }
        socialStatusHistoryTable.value.data = statusHistoryArray;
        D.status = currentUser.value.status;
        D.statusDescription = currentUser.value.statusDescription;
        D.visible = true;
    }

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
     */
    function showBioDialog() {
        const D = bioDialog.value;
        D.bio = currentUser.value.bio;
        D.bioLinks = currentUser.value.bioLinks.slice();
        D.visible = true;
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
