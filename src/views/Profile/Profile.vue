<template>
    <div class="x-container">
        <div class="options-container" style="margin-top: 0">
            <span class="header">{{ t('view.profile.profile.header') }}</span>
            <div class="x-friend-list" style="margin-top: 10px">
                <div class="x-friend-item" @click="showUserDialog(currentUser.id)">
                    <div class="avatar">
                        <img :src="userImage(currentUser, true)" loading="lazy" />
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
                    :icon="SwitchButton"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="logout()"
                    >{{ t('view.profile.profile.logout') }}</el-button
                >
                <el-button
                    size="small"
                    :icon="Picture"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="redirectToToolsTab"
                    >{{ t('view.profile.profile.manage_gallery_inventory_icon') }}</el-button
                >
                <el-button
                    size="small"
                    :icon="ChatDotRound"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="redirectToToolsTab"
                    >{{ t('view.tools.export.discord_names') }}</el-button
                >
                <el-button
                    size="small"
                    :icon="Printer"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="redirectToToolsTab"
                    >{{ t('view.tools.export.export_friend_list') }}</el-button
                >
                <el-button
                    size="small"
                    :icon="User"
                    style="margin-left: 0; margin-right: 5px; margin-top: 10px"
                    @click="redirectToToolsTab"
                    >{{ t('view.tools.export.export_own_avatars') }}</el-button
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
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
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
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteMessageTable.visible = true;
                            refreshInviteMessageTableData('message');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <DataTable v-if="inviteMessageTable.visible" v-bind="inviteMessageTable" style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    :sortable="true"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    :sortable="true"
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
                            :icon="Edit"
                            size="small"
                            @click="showEditInviteMessageDialog('message', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </DataTable>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_response_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteResponseMessageTable.visible = true;
                            refreshInviteMessageTableData('response');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteResponseMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <DataTable
                v-if="inviteResponseMessageTable.visible"
                v-bind="inviteResponseMessageTable"
                style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    :sortable="true"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    :sortable="true"
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
                            :icon="Edit"
                            size="small"
                            @click="showEditInviteMessageDialog('response', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </DataTable>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_request_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteRequestMessageTable.visible = true;
                            refreshInviteMessageTableData('request');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteRequestMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <DataTable
                v-if="inviteRequestMessageTable.visible"
                v-bind="inviteRequestMessageTable"
                style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    :sortable="true"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    :sortable="true"
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
                            :icon="Edit"
                            size="small"
                            @click="showEditInviteMessageDialog('request', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </DataTable>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.invite_request_response_messages') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="
                            inviteRequestResponseMessageTable.visible = true;
                            refreshInviteMessageTableData('requestResponse');
                        "></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
                        circle
                        style="margin-left: 5px"
                        @click="inviteRequestResponseMessageTable.visible = false"></el-button>
                </el-tooltip>
            </div>
            <DataTable
                v-if="inviteRequestResponseMessageTable.visible"
                v-bind="inviteRequestResponseMessageTable"
                style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.invite_messages.slot')"
                    prop="slot"
                    :sortable="true"
                    width="70"></el-table-column>
                <el-table-column :label="t('table.profile.invite_messages.message')" prop="message"></el-table-column>
                <el-table-column
                    :label="t('table.profile.invite_messages.cool_down')"
                    prop="updatedAt"
                    :sortable="true"
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
                            :icon="Edit"
                            size="small"
                            @click="showEditInviteMessageDialog('requestResponse', scope.row)"></el-button>
                    </template>
                </el-table-column>
            </DataTable>
        </div>

        <div class="options-container">
            <span class="header">{{ t('view.profile.past_display_names') }}</span>
            <DataTable v-bind="pastDisplayNameTable" style="margin-top: 10px">
                <el-table-column
                    :label="t('table.profile.previous_display_name.date')"
                    prop="updated_at"
                    :sortable="true">
                    <template #default="scope">
                        <span>{{ formatDateFilter(scope.row.updated_at, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.profile.previous_display_name.name')"
                    prop="displayName"></el-table-column>
            </DataTable>
        </div>

        <div class="options-container">
            <div class="header-bar">
                <span class="header">{{ t('view.profile.config_json') }}</span>
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="refreshConfigTreeData()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
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
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="refreshCurrentUserTreeData()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
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
                <el-tooltip placement="top" :content="t('view.profile.refresh_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Refresh"
                        circle
                        style="margin-left: 5px"
                        @click="getCurrentUserFeedback()"></el-button>
                </el-tooltip>
                <el-tooltip placement="top" :content="t('view.profile.clear_results_tooltip')">
                    <el-button
                        type="default"
                        size="small"
                        :icon="Delete"
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
    </div>
</template>

<script setup>
    import { ChatDotRound, Delete, Edit, Picture, Printer, Refresh, SwitchButton, User } from '@element-plus/icons-vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        buildTreeData,
        formatDateFilter,
        openExternalLink,
        parseAvatarUrl,
        parseUserUrl,
        userImage
    } from '../../shared/utils';
    import { useAvatarStore, useInviteStore, useSearchStore, useUiStore, useUserStore } from '../../stores';
    import { authRequest, miscRequest, userRequest } from '../../api';
    import { redirectToToolsTab } from '../../shared/utils/base/ui';
    import { useAuthStore } from '../../stores';

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
    const { directAccessWorld } = useSearchStore();
    const { logout } = useAuthStore();
    const { cachedConfig } = storeToRefs(useAuthStore());

    const { t } = useI18n();

    const vrchatCredit = ref(null);
    const configTreeData = ref([]);
    const currentUserTreeData = ref([]);
    const currentUserFeedbackData = ref([]);

    const visits = ref(0);

    function getVisits() {
        miscRequest.getVisits().then((args) => {
            visits.value = args.json;
        });
    }

    function getVRChatCredits() {
        miscRequest.getVRChatCredits().then((args) => (vrchatCredit.value = args.json?.balance));
    }

    function promptUsernameDialog() {
        ElMessageBox.prompt(t('prompt.direct_access_username.description'), t('prompt.direct_access_username.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_username.ok'),
            cancelButtonText: t('prompt.direct_access_username.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_username.input_error')
        })
            .then(({ value }) => {
                if (value) {
                    lookupUser({
                        displayName: value
                    });
                }
            })
            .catch(() => {});
    }
    function promptUserIdDialog() {
        ElMessageBox.prompt(t('prompt.direct_access_user_id.description'), t('prompt.direct_access_user_id.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_user_id.ok'),
            cancelButtonText: t('prompt.direct_access_user_id.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_user_id.input_error')
        })
            .then(({ value }) => {
                if (value) {
                    const trimmedValue = value.trim();
                    const testUrl = trimmedValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        const userId = parseUserUrl(trimmedValue);
                        if (userId) {
                            showUserDialog(userId);
                        } else {
                            ElMessage({
                                message: t('prompt.direct_access_user_id.message.error'),
                                type: 'error'
                            });
                        }
                    } else {
                        showUserDialog(trimmedValue);
                    }
                }
            })
            .catch(() => {});
    }
    function promptWorldDialog() {
        ElMessageBox.prompt(t('prompt.direct_access_world_id.description'), t('prompt.direct_access_world_id.header'), {
            distinguishCancelAndClose: true,
            confirmButtonText: t('prompt.direct_access_world_id.ok'),
            cancelButtonText: t('prompt.direct_access_world_id.cancel'),
            inputPattern: /\S+/,
            inputErrorMessage: t('prompt.direct_access_world_id.input_error')
        })
            .then(({ value }) => {
                if (value) {
                    const trimmedValue = value.trim();
                    if (!directAccessWorld(trimmedValue)) {
                        ElMessage({
                            message: t('prompt.direct_access_world_id.message.error'),
                            type: 'error'
                        });
                    }
                }
            })
            .catch(() => {});
    }
    function promptAvatarDialog() {
        ElMessageBox.prompt(
            t('prompt.direct_access_avatar_id.description'),
            t('prompt.direct_access_avatar_id.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.direct_access_avatar_id.ok'),
                cancelButtonText: t('prompt.direct_access_avatar_id.cancel'),
                inputPattern: /\S+/,
                inputErrorMessage: t('prompt.direct_access_avatar_id.input_error')
            }
        )
            .then(({ value }) => {
                if (value) {
                    const trimmedValue = value.trim();
                    const testUrl = trimmedValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        const avatarId = parseAvatarUrl(trimmedValue);
                        if (avatarId) {
                            showAvatarDialog(avatarId);
                        } else {
                            ElMessage({
                                message: t('prompt.direct_access_avatar_id.message.error'),
                                type: 'error'
                            });
                        }
                    } else {
                        showAvatarDialog(trimmedValue);
                    }
                }
            })
            .catch(() => {});
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
