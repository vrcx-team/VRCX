<template>
    <div v-show="menuActiveIndex === 'notification'" v-loading="isNotificationsLoading" class="x-container">
        <data-tables v-bind="notificationTable" ref="notificationTableRef" class="notification-table">
            <template #tool>
                <div style="margin: 0 0 10px; display: flex; align-items: center">
                    <el-select
                        v-model="notificationTable.filters[0].value"
                        multiple
                        clearable
                        style="flex: 1"
                        :placeholder="t('view.notification.filter_placeholder')"
                        @change="saveTableFilters">
                        <el-option
                            v-for="type in [
                                'requestInvite',
                                'invite',
                                'requestInviteResponse',
                                'inviteResponse',
                                'friendRequest',
                                'ignoredFriendRequest',
                                'message',
                                'boop',
                                'event.announcement',
                                'groupChange',
                                'group.announcement',
                                'group.informative',
                                'group.invite',
                                'group.joinRequest',
                                'group.transfer',
                                'group.queueReady',
                                'moderation.warning.group',
                                'moderation.report.closed',
                                'instance.closed'
                            ]"
                            :key="type"
                            :label="t('view.notification.filters.' + type)"
                            :value="type" />
                    </el-select>
                    <el-input
                        v-model="notificationTable.filters[1].value"
                        :placeholder="t('view.notification.search_placeholder')"
                        style="flex: none; width: 150px; margin: 0 10px" />
                    <el-tooltip
                        placement="bottom"
                        :content="t('view.notification.refresh_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            type="default"
                            :loading="isNotificationsLoading"
                            icon="el-icon-refresh"
                            circle
                            style="flex: none"
                            @click="refreshNotifications()" />
                    </el-tooltip>
                </div>
            </template>

            <el-table-column :label="t('table.notification.date')" prop="created_at" sortable="custom" width="120">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.notification.type')" prop="type" width="180">
                <template #default="scope">
                    <span
                        v-if="scope.row.type === 'invite'"
                        class="x-link"
                        @click="showWorldDialog(scope.row.details.worldId)"
                        v-text="t('view.notification.filters.' + scope.row.type)"></span>
                    <el-tooltip
                        v-else-if="scope.row.type === 'group.queueReady' || scope.row.type === 'instance.closed'"
                        placement="top">
                        <template #content>
                            <Location
                                v-if="scope.row.location"
                                :location="scope.row.location"
                                :hint="scope.row.worldName"
                                :grouphint="scope.row.groupName"
                                :link="false" />
                        </template>
                        <span
                            class="x-link"
                            @click="showWorldDialog(scope.row.location)"
                            v-text="t('view.notification.filters.' + scope.row.type)"></span>
                    </el-tooltip>
                    <el-tooltip
                        v-else-if="scope.row.link"
                        placement="top"
                        :content="scope.row.linkText"
                        :disabled="hideTooltips">
                        <span
                            class="x-link"
                            @click="openNotificationLink(scope.row.link)"
                            v-text="t('view.notification.filters.' + scope.row.type)"></span>
                    </el-tooltip>
                    <span v-else v-text="t('view.notification.filters.' + scope.row.type)"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.notification.user_group')" prop="senderUsername" width="150">
                <template #default="scope">
                    <template v-if="scope.row.type === 'groupChange'">
                        <span
                            class="x-link"
                            @click="showGroupDialog(scope.row.senderUserId)"
                            v-text="scope.row.senderUsername"></span>
                    </template>
                    <template v-else-if="scope.row.senderUserId">
                        <span
                            class="x-link"
                            @click="showUserDialog(scope.row.senderUserId)"
                            v-text="scope.row.senderUsername"></span>
                    </template>
                    <template v-else-if="scope.row.link && scope.row.data?.groupName">
                        <span
                            class="x-link"
                            @click="openNotificationLink(scope.row.link)"
                            v-text="scope.row.data?.groupName"></span>
                    </template>
                    <template v-else-if="scope.row.link">
                        <span
                            class="x-link"
                            @click="openNotificationLink(scope.row.link)"
                            v-text="scope.row.linkText"></span>
                    </template>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.notification.photo')" width="100" prop="photo">
                <template #default="scope">
                    <template v-if="scope.row.details && scope.row.details.imageUrl">
                        <el-popover placement="right" width="500px" trigger="click">
                            <template #reference>
                                <img
                                    class="x-link"
                                    :src="getSmallThumbnailUrl(scope.row.details.imageUrl)"
                                    style="flex: none; height: 50px; border-radius: 4px" />
                            </template>
                            <img
                                v-lazy="scope.row.details.imageUrl"
                                class="x-link"
                                style="width: 500px"
                                @click="showFullscreenImageDialog(scope.row.details.imageUrl)" />
                        </el-popover>
                    </template>
                    <template v-else-if="scope.row.imageUrl">
                        <el-popover placement="right" width="500px" trigger="click">
                            <template #reference>
                                <img
                                    class="x-link"
                                    :src="getSmallThumbnailUrl(scope.row.imageUrl)"
                                    style="flex: none; height: 50px; border-radius: 4px" />
                            </template>
                            <img
                                v-lazy="scope.row.imageUrl"
                                class="x-link"
                                style="width: 500px"
                                @click="showFullscreenImageDialog(scope.row.imageUrl)" />
                        </el-popover>
                    </template>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.notification.message')" prop="message">
                <template #default="scope">
                    <span v-if="scope.row.type === 'invite'" style="display: flex">
                        <Location
                            v-if="scope.row.details"
                            :location="scope.row.details.worldId"
                            :hint="scope.row.details.worldName"
                            :grouphint="scope.row.details.groupName"
                            :link="true" />
                        <br v-if="scope.row.details" />
                    </span>
                    <el-tooltip
                        v-if="
                            scope.row.message &&
                            scope.row.message !== `This is a generated invite to ${scope.row.details?.worldName}`
                        "
                        placement="top">
                        <template #content>
                            <pre
                                class="extra"
                                style="
                                    display: inline-block;
                                    vertical-align: top;
                                    font-family: inherit;
                                    font-size: 12px;
                                    white-space: pre-wrap;
                                    margin: 0;
                                "
                                >{{ scope.row.message || '-' }}</pre
                            >
                        </template>
                        <div v-text="scope.row.message"></div>
                    </el-tooltip>
                    <span
                        v-else-if="scope.row.details && scope.row.details.inviteMessage"
                        v-text="scope.row.details.inviteMessage"></span>
                    <span
                        v-else-if="scope.row.details && scope.row.details.requestMessage"
                        v-text="scope.row.details.requestMessage"></span>
                    <span
                        v-else-if="scope.row.details && scope.row.details.responseMessage"
                        v-text="scope.row.details.responseMessage"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.notification.action')" width="100" align="right">
                <template #default="scope">
                    <template v-if="scope.row.senderUserId !== currentUser.id && !scope.row.$isExpired">
                        <template v-if="scope.row.type === 'friendRequest'">
                            <el-tooltip placement="top" content="Accept" :disabled="hideTooltips">
                                <el-button
                                    type="text"
                                    icon="el-icon-check"
                                    style="color: #67c23a"
                                    size="mini"
                                    @click="acceptFriendRequestNotification(scope.row)" />
                            </el-tooltip>
                        </template>
                        <template v-else-if="scope.row.type === 'invite'">
                            <el-tooltip placement="top" content="Decline with message" :disabled="hideTooltips">
                                <el-button
                                    type="text"
                                    icon="el-icon-chat-line-square"
                                    size="mini"
                                    @click="showSendInviteResponseDialog(scope.row)" />
                            </el-tooltip>
                        </template>
                        <template v-else-if="scope.row.type === 'requestInvite'">
                            <template
                                v-if="lastLocation.location && isGameRunning && checkCanInvite(lastLocation.location)">
                                <el-tooltip placement="top" content="Invite" :disabled="hideTooltips">
                                    <el-button
                                        type="text"
                                        icon="el-icon-check"
                                        style="color: #67c23a"
                                        size="mini"
                                        @click="acceptRequestInvite(scope.row)" />
                                </el-tooltip>
                            </template>
                            <el-tooltip placement="top" content="Decline with message" :disabled="hideTooltips">
                                <el-button
                                    type="text"
                                    icon="el-icon-chat-line-square"
                                    size="mini"
                                    style="margin-left: 5px"
                                    @click="showSendInviteRequestResponseDialog(scope.row)" />
                            </el-tooltip>
                        </template>

                        <template v-if="scope.row.responses">
                            <template v-for="response in scope.row.responses">
                                <el-tooltip
                                    placement="top"
                                    :content="response.text"
                                    :disabled="hideTooltips"
                                    :key="response.text">
                                    <el-button
                                        v-if="response.icon === 'check'"
                                        type="text"
                                        icon="el-icon-check"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'cancel'"
                                        type="text"
                                        icon="el-icon-close"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'ban'"
                                        type="text"
                                        icon="el-icon-circle-close"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'bell-slash'"
                                        type="text"
                                        icon="el-icon-bell"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <!--//el-button(-->
                                    <!--//    v-else-if='response.icon === "reply" && scope.row.type === "boop"'-->
                                    <!--//    type='text'-->
                                    <!--//    icon='el-icon-chat-line-square'-->
                                    <!--//    size='mini'-->
                                    <!--//    style='margin-left: 5px'-->
                                    <!--//    @click='showSendBoopDialog(scope.row.senderUserId)')-->
                                    <el-button
                                        v-else-if="response.icon === 'reply'"
                                        type="text"
                                        icon="el-icon-chat-line-square"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else
                                        type="text"
                                        icon="el-icon-collection-tag"
                                        size="mini"
                                        style="margin-left: 5px"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                </el-tooltip>
                            </template>
                        </template>

                        <template
                            v-if="
                                scope.row.type !== 'requestInviteResponse' &&
                                scope.row.type !== 'inviteResponse' &&
                                scope.row.type !== 'message' &&
                                scope.row.type !== 'boop' &&
                                scope.row.type !== 'groupChange' &&
                                !scope.row.type.includes('group.') &&
                                !scope.row.type.includes('moderation.') &&
                                !scope.row.type.includes('instance.')
                            ">
                            <el-tooltip placement="top" content="Decline" :disabled="hideTooltips">
                                <el-button
                                    v-if="shiftHeld"
                                    style="color: #f56c6c; margin-left: 5px"
                                    type="text"
                                    icon="el-icon-close"
                                    size="mini"
                                    @click="hideNotification(scope.row)" />
                                <el-button
                                    v-else
                                    type="text"
                                    icon="el-icon-close"
                                    size="mini"
                                    style="margin-left: 5px"
                                    @click="hideNotificationPrompt(scope.row)" />
                            </el-tooltip>
                        </template>
                    </template>
                    <template v-if="scope.row.type === 'group.queueReady'">
                        <el-tooltip placement="top" content="Delete log" :disabled="hideTooltips">
                            <el-button
                                v-if="shiftHeld"
                                style="color: #f56c6c; margin-left: 5px"
                                type="text"
                                icon="el-icon-close"
                                size="mini"
                                @click="deleteNotificationLog(scope.row)" />
                            <el-button
                                v-else
                                type="text"
                                icon="el-icon-delete"
                                size="mini"
                                style="margin-left: 5px"
                                @click="deleteNotificationLogPrompt(scope.row)" />
                        </el-tooltip>
                    </template>

                    <template
                        v-if="
                            scope.row.type !== 'friendRequest' &&
                            scope.row.type !== 'ignoredFriendRequest' &&
                            !scope.row.type.includes('group.') &&
                            !scope.row.type.includes('moderation.')
                        ">
                        <el-tooltip placement="top" content="Delete log" :disabled="hideTooltips">
                            <el-button
                                v-if="shiftHeld"
                                style="color: #f56c6c; margin-left: 5px"
                                type="text"
                                icon="el-icon-close"
                                size="mini"
                                @click="deleteNotificationLog(scope.row)" />
                            <el-button
                                v-else
                                type="text"
                                icon="el-icon-delete"
                                size="mini"
                                style="margin-left: 5px"
                                @click="deleteNotificationLogPrompt(scope.row)" />
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
        </data-tables>
        <SendInviteResponseDialog
            :send-invite-response-dialog="sendInviteResponseDialog"
            :send-invite-response-dialog-visible.sync="sendInviteResponseDialogVisible" />
        <SendInviteRequestResponseDialog
            :send-invite-response-dialog="sendInviteResponseDialog"
            :send-invite-request-response-dialog-visible.sync="sendInviteRequestResponseDialogVisible" />
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { friendRequest, notificationRequest, worldRequest } from '../../api';
    import {
        checkCanInvite,
        convertFileUrlToImageUrl,
        escapeTag,
        formatDateFilter,
        parseLocation,
        removeFromArray
    } from '../../shared/utils';
    import configRepository from '../../service/config';
    import { database } from '../../service/database';
    import {
        useAppearanceSettingsStore,
        useGalleryStore,
        useGameStore,
        useGroupStore,
        useInviteStore,
        useLocationStore,
        useNotificationStore,
        useUiStore,
        useUserStore,
        useWorldStore
    } from '../../stores';
    import SendInviteRequestResponseDialog from './dialogs/SendInviteRequestResponseDialog.vue';
    import SendInviteResponseDialog from './dialogs/SendInviteResponseDialog.vue';
    import Noty from 'noty';

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { clearInviteImageUpload } = useGalleryStore();
    const { notificationTable, isNotificationsLoading } = storeToRefs(useNotificationStore());
    const { refreshNotifications, handleNotificationHide } = useNotificationStore();
    const { menuActiveIndex, shiftHeld } = storeToRefs(useUiStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());

    const { t } = useI18n();

    const { $confirm, $message } = getCurrentInstance().proxy;

    const sendInviteResponseDialog = ref({
        messageSlot: {},
        invite: {}
    });

    const sendInviteResponseDialogVisible = ref(false);

    const sendInviteRequestResponseDialogVisible = ref(false);

    function saveTableFilters() {
        configRepository.setString(
            'VRCX_notificationTableFilters',
            JSON.stringify(notificationTable.value.filters[0].value)
        );
    }

    function openNotificationLink(link) {
        if (!link) {
            return;
        }
        const data = link.split(':');
        if (!data.length) {
            return;
        }
        switch (data[0]) {
            case 'group':
                showGroupDialog(data[1]);
                break;
            case 'user':
                showUserDialog(data[1]);
                break;
            case 'event':
                const ids = data[1].split(',');
                if (ids.length < 2) {
                    console.error('Invalid event notification link:', data[1]);
                    return;
                }

                showGroupDialog(ids[0]);
                // ids[1] cal_ is the event id
                break;
        }
    }

    function getSmallThumbnailUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    function acceptFriendRequestNotification(row) {
        // FIXME: 메시지 수정
        $confirm('Continue? Accept Friend Request', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    notificationRequest.acceptFriendRequestNotification({
                        notificationId: row.id
                    });
                }
            }
        });
    }

    function showSendInviteResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('response');
        clearInviteImageUpload();
        sendInviteResponseDialogVisible.value = true;
    }

    function acceptRequestInvite(row) {
        $confirm('Continue? Send Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    let currentLocation = lastLocation.value.location;
                    if (lastLocation.value.location === 'traveling') {
                        currentLocation = lastLocationDestination.value;
                    }
                    const L = parseLocation(currentLocation);
                    worldRequest
                        .getCachedWorld({
                            worldId: L.worldId
                        })
                        .then((args) => {
                            notificationRequest
                                .sendInvite(
                                    {
                                        instanceId: L.tag,
                                        worldId: L.tag,
                                        worldName: args.ref.name,
                                        rsvp: true
                                    },
                                    row.senderUserId
                                )
                                .then((_args) => {
                                    $message('Invite sent');
                                    notificationRequest.hideNotification({
                                        notificationId: row.id
                                    });
                                    return _args;
                                });
                        });
                }
            }
        });
    }

    function showSendInviteRequestResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('requestResponse');
        clearInviteImageUpload();
        sendInviteRequestResponseDialogVisible.value = true;
    }

    function sendNotificationResponse(notificationId, responses, responseType) {
        if (!Array.isArray(responses) || responses.length === 0) {
            return;
        }
        let responseData = '';
        for (let i = 0; i < responses.length; i++) {
            if (responses[i].type === responseType) {
                responseData = responses[i].data;
                break;
            }
        }
        const params = {
            notificationId,
            responseType,
            responseData
        };
        notificationRequest
            .sendNotificationResponse(params)
            .then((json) => {
                const args = {
                    json,
                    params
                };
                handleNotificationHide(args);
                new Noty({
                    type: 'success',
                    text: escapeTag(args.json)
                }).show();
                console.log('NOTIFICATION:RESPONSE', args);
            })
            .catch((err) => {
                handleNotificationHide({ params });
                notificationRequest.hideNotificationV2(params.notificationId);
                throw err;
            });
    }

    async function hideNotification(row) {
        if (row.type === 'ignoredFriendRequest') {
            const args = await friendRequest.deleteHiddenFriendRequest(
                {
                    notificationId: row.id
                },
                row.senderUserId
            );
            useNotificationStore().handleNotificationHide(args);
        } else {
            notificationRequest.hideNotification({
                notificationId: row.id
            });
        }
    }

    function hideNotificationPrompt(row) {
        $confirm(`Continue? Decline ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    hideNotification(row);
                }
            }
        });
    }

    function deleteNotificationLog(row) {
        removeFromArray(notificationTable.value.data, row);
        if (row.type !== 'friendRequest' && row.type !== 'ignoredFriendRequest') {
            database.deleteNotification(row.id);
        }
    }

    function deleteNotificationLogPrompt(row) {
        $confirm(`Continue? Delete ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deleteNotificationLog(row);
                }
            }
        });
    }
</script>
