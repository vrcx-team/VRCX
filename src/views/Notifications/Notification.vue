<template>
    <div v-if="menuActiveIndex === 'notification'" v-loading="API.isNotificationsLoading" class="x-container">
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
                            :loading="API.isNotificationsLoading"
                            icon="el-icon-refresh"
                            circle
                            style="flex: none"
                            @click="API.refreshNotifications()" />
                    </el-tooltip>
                </div>
            </template>

            <el-table-column :label="t('table.notification.date')" prop="created_at" sortable="custom" width="120">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ scope.row.created_at | formatDate('long') }}</span>
                        </template>
                        <span>{{ scope.row.created_at | formatDate('short') }}</span>
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
                            <location
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
                        <location
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
                    <template v-if="scope.row.senderUserId !== API.currentUser.id && !scope.row.$isExpired">
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
                                <el-tooltip placement="top" :content="response.text" :disabled="hideTooltips">
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
            :send-invite-response-dialog-visible.sync="sendInviteResponseDialogVisible"
            :invite-response-message-table="inviteResponseMessageTable"
            :upload-image="uploadImage"
            @invite-image-upload="inviteImageUpload" />
        <SendInviteRequestResponseDialog
            :send-invite-request-response-dialog-visible.sync="sendInviteRequestResponseDialogVisible"
            :invite-request-response-message-table="inviteRequestResponseMessageTable"
            :upload-image="uploadImage"
            @invite-image-upload="inviteImageUpload" />
    </div>
</template>

<script>
    export default {
        name: 'NotificationTab'
    };
</script>

<script setup>
    import { getCurrentInstance, inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { friendRequest, inviteMessagesRequest, notificationRequest, worldRequest } from '../../api';
    import utils from '../../classes/utils';
    import { parseLocation } from '../../composables/instance/utils';
    import { convertFileUrlToImageUrl } from '../../composables/shared/utils';
    import configRepository from '../../service/config';
    import database from '../../service/database';
    import SendInviteRequestResponseDialog from './dialogs/SendInviteRequestResponseDialog.vue';
    import SendInviteResponseDialog from './dialogs/SendInviteResponseDialog.vue';
    import Location from '../../components/Location.vue';

    const { t } = useI18n();

    const { $confirm, $message } = getCurrentInstance().proxy;

    const API = inject('API');
    const showWorldDialog = inject('showWorldDialog');
    const showGroupDialog = inject('showGroupDialog');
    const showUserDialog = inject('showUserDialog');
    const showFullscreenImageDialog = inject('showFullscreenImageDialog');

    const props = defineProps({
        menuActiveIndex: {
            type: String,
            default: ''
        },
        notificationTable: {
            type: Object,
            default: () => ({})
        },
        shiftHeld: { type: Boolean, default: false },
        hideTooltips: { type: Boolean, default: false },
        lastLocation: { type: Object, default: () => ({}) },
        inviteResponseMessageTable: {
            type: Object,
            default: () => ({})
        },
        uploadImage: {
            type: String,
            default: ''
        },
        lastLocationDestination: {
            type: String,
            default: ''
        },
        isGameRunning: {
            type: Boolean,
            default: false
        },
        checkCanInvite: {
            type: Function,
            default: () => true
        },
        inviteRequestResponseMessageTable: {
            type: Object,
            default: () => ({})
        }
    });

    const emit = defineEmits(['inviteImageUpload', 'clearInviteImageUpload']);

    const sendInviteResponseDialog = ref({
        message: '',
        messageSlot: 0,
        invite: {}
    });

    const sendInviteResponseDialogVisible = ref(false);

    const sendInviteRequestResponseDialogVisible = ref(false);

    function inviteImageUpload(event) {
        emit('inviteImageUpload', event);
    }

    function saveTableFilters() {
        configRepository.setString(
            'VRCX_notificationTableFilters',
            JSON.stringify(props.notificationTable.filters[0].value)
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
        sendInviteResponseDialog.value = {
            invite
        };
        inviteMessagesRequest.refreshInviteMessageTableData('response');
        clearInviteImageUpload();
        sendInviteResponseDialogVisible.value = true;
    }

    function clearInviteImageUpload() {
        emit('clearInviteImageUpload');
    }

    function acceptRequestInvite(row) {
        $confirm('Continue? Send Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    let currentLocation = props.lastLocation.location;
                    // todo
                    if (props.lastLocation.location === 'traveling') {
                        currentLocation = props.lastLocationDestination;
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
        sendInviteResponseDialog.value = {
            invite
        };
        inviteMessagesRequest.refreshInviteMessageTableData('requestResponse');
        clearInviteImageUpload();
        sendInviteRequestResponseDialogVisible.value = true;
    }

    function sendNotificationResponse(notificationId, responses, responseType) {
        if (!Array.isArray(responses) || responses.length === 0) {
            return null;
        }
        let responseData = '';
        for (let i = 0; i < responses.length; i++) {
            if (responses[i].type === responseType) {
                responseData = responses[i].data;
                break;
            }
        }
        return notificationRequest.sendNotificationResponse({
            notificationId,
            responseType,
            responseData
        });
    }

    function hideNotification(row) {
        if (row.type === 'ignoredFriendRequest') {
            friendRequest.deleteHiddenFriendRequest(
                {
                    notificationId: row.id
                },
                row.senderUserId
            );
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
        utils.removeFromArray(props.notificationTable.data, row);
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
