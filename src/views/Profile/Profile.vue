<template>
    <div v-show="menuActiveIndex === 'profile'" class="x-container">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.profile.profile.header') }}</span>
            <div class="x-friend-list" style="margin-top: 10px">
                <div class="x-friend-item" @click="showUserDialog(currentUser.id)">
                    <div class="avatar">
                        <img v-lazy="userImage(currentUser, true)" />
                    </div>
                    <div class="detail">
                        <span class="name" v-text="currentUser.displayName"></span>
                        <span class="extra" v-text="currentUser.username"></span>
                    </div>
                </div>
                <div class="x-friend-item" style="cursor: default">
                    <div class="detail">
                        <span class="name">{{ t('view.profile.profile.last_activity') }}</span>
                        <span class="extra">{{ formatDateFilter(currentUser.last_activity, 'long') }}</span>
                    </div>
                </div>
                <div class="x-friend-item" style="cursor: default">
                    <div class="detail">
                        <span class="name">{{ t('view.profile.profile.two_factor') }}</span>
                        <span class="extra">{{
                            currentUser.twoFactorAuthEnabled
                                ? t('view.profile.profile.two_factor_enabled')
                                : t('view.profile.profile.two_factor_disabled')
                        }}</span>
                    </div>
                </div>
                <div class="x-friend-item" @click="getVRChatCredits()">
                    <div class="detail">
                        <span class="name">{{ t('view.profile.profile.vrchat_credits') }}</span>
                        <span class="extra">{{ vrchatCredit ?? t('view.profile.profile.refresh') }}</span>
                    </div>
                </div>
            </div>
            <div style="margin-top: 10px">
                <el-button
                    size="small"
                    type="danger"
                    plain
                    icon="el-icon-switch-button"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="logout()"
                    >{{ t('view.profile.profile.logout') }}</el-button
                >
                <el-button
                    size="small"
                    icon="el-icon-picture-outline"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="showGalleryDialog()"
                    >{{ t('view.profile.profile.manage_gallery_inventory_icon') }}</el-button
                >
                <el-button
                    size="small"
                    icon="el-icon-chat-dot-round"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="showDiscordNamesDialog()"
                    >{{ t('view.profile.profile.discord_names') }}</el-button
                >
                <el-button
                    size="small"
                    icon="el-icon-printer"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="showExportFriendsListDialog()"
                    >{{ t('view.profile.profile.export_friend_list') }}</el-button
                >
                <el-button
                    size="small"
                    icon="el-icon-user"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="showExportAvatarsListDialog()"
                    >{{ t('view.profile.profile.export_own_avatars') }}</el-button
                >
            </div>
        </div>

        <div class="options-container">
            <span class="header">{{ t('view.profile.game_info.header') }}</span>
            <div class="x-friend-list" style="margin-top: 10px">
                <div class="x-friend-item">
                    <div class="detail" @click="getVisits">
                        <span class="name">{{ t('view.profile.game_info.online_users') }}</span>
                        <span v-if="visits" class="extra">{{
                            t('view.profile.game_info.user_online', { count: visits })
                        }}</span>
                        <span v-else class="extra">{{ t('view.profile.game_info.refresh') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.vrc_sdk_downloads.header') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="getConfig"></el-button>
                </el-tooltip>
            </div>
            <div class="x-friend-list" style="margin-top: 10px">
                <div
                    v-for="(link, item) in cachedConfig.downloadUrls"
                    :key="item"
                    class="x-friend-item"
                    placement="top">
                    <div class="detail" @click="openExternalLink(link)">
                        <span class="name" v-text="item"></span>
                        <span class="extra" v-text="link"></span>
                    </div>
                </div>
            </div>
        </div>

        <div class="options-container">
            <span class="header">{{ t('view.profile.direct_access.header') }}</span>
            <div style="margin-top: 10px">
                <el-button-group>
                    <el-button size="small" @click="promptUsernameDialog()">{{
                        t('view.profile.direct_access.username')
                    }}</el-button>
                    <el-button size="small" @click="promptUserIdDialog()">{{
                        t('view.profile.direct_access.user_id')
                    }}</el-button>
                    <el-button size="small" @click="promptWorldDialog()">{{
                        t('view.profile.direct_access.world_instance')
                    }}</el-button>
                    <el-button size="small" @click="promptAvatarDialog()">{{
                        t('view.profile.direct_access.avatar')
                    }}</el-button>
                </el-button-group>
            </div>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteMessageTable.visible = true;
                            refreshInviteMessageTableData('message');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <data-tables v-if="inviteMessageTable.visible" v-bind="inviteMessageTable" style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    sortable="custom"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    sortable="custom"
                    width="110"
                    align="right">
                    <template #default="scope">
                        <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.action')" width="60" align="right">
                    <template #default="scope">
                        <el-button
                            type="text"
                            icon="el-icon-edit"
                            size="mini"
                            @click="showEditInviteMessageDialog('message', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </data-tables>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_response_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteResponseMessageTable.visible = true;
                            refreshInviteMessageTableData('response');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteResponseMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <data-tables
                v-if="inviteResponseMessageTable.visible"
                v-bind="inviteResponseMessageTable"
                style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    sortable="custom"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    sortable="custom"
                    width="110"
                    align="right">
                    <template #default="scope">
                        <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.action')" width="60" align="right">
                    <template #default="scope">
                        <el-button
                            type="text"
                            icon="el-icon-edit"
                            size="mini"
                            @click="showEditInviteMessageDialog('response', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </data-tables>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_request_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteRequestMessageTable.visible = true;
                            refreshInviteMessageTableData('request');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteRequestMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <data-tables
                v-if="inviteRequestMessageTable.visible"
                v-bind="inviteRequestMessageTable"
                style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    sortable="custom"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    sortable="custom"
                    width="110"
                    align="right">
                    <template #default="scope">
                        <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.action')" width="60" align="right">
                    <template #default="scope">
                        <el-button
                            type="text"
                            icon="el-icon-edit"
                            size="mini"
                            @click="showEditInviteMessageDialog('request', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </data-tables>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_request_response_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteRequestResponseMessageTable.visible = true;
                            refreshInviteMessageTableData('requestResponse');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteRequestResponseMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <data-tables
                v-if="inviteRequestResponseMessageTable.visible"
                v-bind="inviteRequestResponseMessageTable"
                style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    sortable="custom"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    sortable="custom"
                    width="110"
                    align="right">
                    <template #default="scope">
                        <countdown-timer :datetime="scope.row.updatedAt" :hours="1"></countdown-timer>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.action')" width="60" align="right">
                    <template #default="scope">
                        <el-button
                            type="text"
                            icon="el-icon-edit"
                            size="mini"
                            @click="showEditInviteMessageDialog('requestResponse', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </data-tables>
        </div>

        <div class="options-container">
            <span class="header">{{ t('view.profile.past_display_names') }}</span>
            <data-tables v-bind="pastDisplayNameTable" style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.previous_display_name.date')"
                    prop="updated_at"
                    sortable="custom">
                    <template #default="scope">
                        <span>{{ formatDateFilter(scope.row.updated_at, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.profile.previous_display_name.name')"
                    prop="displayName"></el-table-column>
            </data-tables>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.config_json') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="refreshConfigTreeData()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="configTreeData = []"></el-button>
                </el-tooltip>
            </div>
            <el-tree v-if="configTreeData.length > 0" :data="configTreeData" style="margin-top: 10px; font-size: 12px">
                <template #default="scope">
                    <span>
                        <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                        <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                    </span>
                </template>
            </el-tree>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.current_user_json') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="refreshCurrentUserTreeData()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="currentUserTreeData = []"></el-button>
                </el-tooltip>
            </div>
            <el-tree
                v-if="currentUserTreeData.length > 0"
                :data="currentUserTreeData"
                style="margin-top: 10px; font-size: 12px">
                <template #default="scope">
                    <span>
                        <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                        <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                    </span>
                </template>
            </el-tree>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.feedback') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-refresh"
                        circle
                        style="margin-left: 5px"
                        @click="getCurrentUserFeedback()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        size="mini"
                        icon="el-icon-delete"
                        circle
                        style="margin-left: 5px"
                        @click="currentUserFeedbackData = []"></el-button>
                </el-tooltip>
            </div>
            <el-tree
                v-if="currentUserFeedbackData.length > 0"
                :data="currentUserFeedbackData"
                style="margin-top: 10px; font-size: 12px">
                <template #default="scope">
                    <span>
                        <span style="font-weight: bold; margin-right: 5px" v-text="scope.data.key"></span>
                        <span v-if="!scope.data.children" v-text="scope.data.value"></span>
                    </span>
                </template>
            </el-tree>
        </div>
        <DiscordNamesDialog :discord-names-dialog-visible.sync="discordNamesDialogVisible" :friends="friends" />
        <ExportFriendsListDialog
            :is-export-friends-list-dialog-visible.sync="isExportFriendsListDialogVisible"
            :friends="friends" />
        <ExportAvatarsListDialog :is-export-avatars-list-dialog-visible.sync="isExportAvatarsListDialogVisible" />
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { authRequest, miscRequest, userRequest } from '../../api';
    import {
        parseAvatarUrl,
        buildTreeData,
        openExternalLink,
        userImage,
        parseUserUrl,
        formatDateFilter
    } from '../../shared/utils';
    import { useAuthStore } from '../../stores';
    import DiscordNamesDialog from './dialogs/DiscordNamesDialog.vue';
    import ExportFriendsListDialog from './dialogs/ExportFriendsListDialog.vue';
    import ExportAvatarsListDialog from './dialogs/ExportAvatarsListDialog.vue';
    import {
        useAppearanceSettingsStore,
        useSearchStore,
        useFriendStore,
        useUserStore,
        useAvatarStore,
        useInviteStore,
        useGalleryStore,
        useUiStore
    } from '../../stores';

    const { friends } = storeToRefs(useFriendStore());
    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { pastDisplayNameTable, currentUser } = storeToRefs(useUserStore());
    const { showUserDialog, lookupUser, getCurrentUser } = useUserStore();
    const { showAvatarDialog } = useAvatarStore();
    const { showEditInviteMessageDialog, refreshInviteMessageTableData } = useInviteStore();
    const {
        inviteMessageTable,
        inviteResponseMessageTable,
        inviteRequestMessageTable,
        inviteRequestResponseMessageTable
    } = storeToRefs(useInviteStore());
    const { menuActiveIndex } = storeToRefs(useUiStore());
    const { directAccessWorld } = useSearchStore();
    const { logout } = useAuthStore();
    const { cachedConfig } = storeToRefs(useAuthStore());

    const { t } = useI18n();

    const { $prompt, $message } = getCurrentInstance().proxy;

    const vrchatCredit = ref(null);
    const configTreeData = ref([]);
    const currentUserTreeData = ref([]);
    const currentUserFeedbackData = ref([]);

    const discordNamesDialogVisible = ref(false);
    const isExportFriendsListDialogVisible = ref(false);
    const isExportAvatarsListDialogVisible = ref(false);

    const visits = ref(0);

    // redirect to tools tab
    function showGalleryDialog() {
        menuActiveIndex.value = 'tools';
    }

    function getVisits() {
        miscRequest.getVisits().then((args) => {
            visits.value = args.json;
        });
    }

    function getVRChatCredits() {
        miscRequest.getVRChatCredits().then((args) => (vrchatCredit.value = args.json?.balance));
    }

    function showDiscordNamesDialog() {
        discordNamesDialogVisible.value = true;
    }

    function showExportFriendsListDialog() {
        isExportFriendsListDialogVisible.value = true;
    }

    function showExportAvatarsListDialog() {
        isExportAvatarsListDialogVisible.value = true;
    }
    function promptUsernameDialog() {
        $prompt(t('prompt.direct_access_username.description'), t('prompt.direct_access_username.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_username.ok'),
            cancelButtonText: t('prompt.direct_access_username.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_username.input_error'),
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue) {
                    lookupUser({
                        displayName: instance.inputValue
                    });
                }
            }
        });
    }
    function promptUserIdDialog() {
        $prompt(t('prompt.direct_access_user_id.description'), t('prompt.direct_access_user_id.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_user_id.ok'),
            cancelButtonText: t('prompt.direct_access_user_id.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_user_id.input_error'),
            callback: (action, instance) => {
                instance.inputValue = instance.inputValue.trim();
                if (action === 'confirm' && instance.inputValue) {
                    const testUrl = instance.inputValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        const userId = parseUserUrl(instance.inputValue);
                        if (userId) {
                            showUserDialog(userId);
                        } else {
                            $message({
                                message: t('prompt.direct_access_user_id.message.error'),
                                type: 'error'
                            });
                        }
                    } else {
                        showUserDialog(instance.inputValue);
                    }
                }
            }
        });
    }
    function promptWorldDialog() {
        $prompt(t('prompt.direct_access_world_id.description'), t('prompt.direct_access_world_id.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_world_id.ok'),
            cancelButtonText: t('prompt.direct_access_world_id.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_world_id.input_error'),
            callback: (action, instance) => {
                instance.inputValue = instance.inputValue.trim();
                if (action === 'confirm' && instance.inputValue) {
                    if (!directAccessWorld(instance.inputValue)) {
                        $message({
                            message: t('prompt.direct_access_world_id.message.error'),
                            type: 'error'
                        });
                    }
                }
            }
        });
    }
    function promptAvatarDialog() {
        $prompt(t('prompt.direct_access_avatar_id.description'), t('prompt.direct_access_avatar_id.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_avatar_id.ok'),
            cancelButtonText: t('prompt.direct_access_avatar_id.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_avatar_id.input_error'),
            callback: (action, instance) => {
                instance.inputValue = instance.inputValue.trim();
                if (action === 'confirm' && instance.inputValue) {
                    const testUrl = instance.inputValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        const avatarId = parseAvatarUrl(instance.inputValue);
                        if (avatarId) {
                            showAvatarDialog(avatarId);
                        } else {
                            $message({
                                message: t('prompt.direct_access_avatar_id.message.error'),
                                type: 'error'
                            });
                        }
                    } else {
                        showAvatarDialog(instance.inputValue);
                    }
                }
            }
        });
    }
    async function getConfig() {
        await authRequest.getConfig();
    }
    async function refreshConfigTreeData() {
        await getConfig();
        configTreeData.value = buildTreeData(cachedConfig.value);
    }
    async function refreshCurrentUserTreeData() {
        await getCurrentUser();
        currentUserTreeData.value = buildTreeData(currentUser.value);
    }
    function getCurrentUserFeedback() {
        userRequest.getUserFeedback({ userId: currentUser.value.id }).then((args) => {
            if (args.params.userId === currentUser.value.id) {
                currentUserFeedbackData.value = buildTreeData(args.json);
            }
        });
    }
</script>
