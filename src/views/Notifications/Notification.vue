<template>
    <div v-loading="isNotificationsLoading" class="x-container">
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
            <el-tooltip placement="bottom" :content="t('view.notification.refresh_tooltip')">
                <el-button
                    type="default"
                    :loading="isNotificationsLoading"
                    :icon="Refresh"
                    circle
                    style="flex: none"
                    @click="refreshNotifications()" />
            </el-tooltip>
        </div>

        <DataTable v-bind="notificationTable" ref="notificationTableRef" class="notification-table">
            <el-table-column :label="t('table.notification.date')" prop="created_at" :sortable="true" width="130">
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
                    <el-tooltip v-else-if="scope.row.link" placement="top" :content="scope.row.linkText">
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
                    <template v-if="scope.row.type === 'boop'">
                        <Emoji
                            class="x-link"
                            @click="showFullscreenImageDialog(scope.row.details.imageUrl)"
                            v-if="scope.row.details?.imageUrl && !scope.row.details.imageUrl.startsWith('default_')"
                            :imageUrl="scope.row.details.imageUrl"
                            :size="50"></Emoji>
                    </template>
                    <template v-else-if="scope.row.details && scope.row.details.imageUrl">
                        <img
                            class="x-link"
                            :src="getSmallThumbnailUrl(scope.row.details.imageUrl)"
                            style="flex: none; height: 50px; border-radius: 4px"
                            @click="showFullscreenImageDialog(scope.row.details.imageUrl)"
                            loading="lazy" />
                    </template>
                    <template v-else-if="scope.row.imageUrl">
                        <img
                            class="x-link"
                            :src="getSmallThumbnailUrl(scope.row.imageUrl)"
                            style="flex: none; height: 50px; border-radius: 4px"
                            @click="showFullscreenImageDialog(scope.row.imageUrl)"
                            loading="lazy" />
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
                    <div
                        v-if="
                            scope.row.message &&
                            scope.row.message !== `This is a generated invite to ${scope.row.details?.worldName}`
                        "
                        v-text="scope.row.message"></div>
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
                            <el-tooltip placement="top" content="Accept">
                                <el-button
                                    type="text"
                                    :icon="Check"
                                    style="color: #67c23a"
                                    size="small"
                                    class="button-pd-0"
                                    @click="acceptFriendRequestNotification(scope.row)" />
                            </el-tooltip>
                        </template>
                        <template v-else-if="scope.row.type === 'invite'">
                            <el-tooltip placement="top" content="Decline with message">
                                <el-button
                                    type="text"
                                    :icon="ChatLineSquare"
                                    size="small"
                                    class="button-pd-0"
                                    @click="showSendInviteResponseDialog(scope.row)" />
                            </el-tooltip>
                        </template>
                        <template v-else-if="scope.row.type === 'requestInvite'">
                            <template
                                v-if="lastLocation.location && isGameRunning && checkCanInvite(lastLocation.location)">
                                <el-tooltip placement="top" content="Invite">
                                    <el-button
                                        type="text"
                                        :icon="Check"
                                        style="color: #67c23a"
                                        size="small"
                                        class="button-pd-0"
                                        @click="acceptRequestInvite(scope.row)" />
                                </el-tooltip>
                            </template>
                            <el-tooltip placement="top" content="Decline with message">
                                <el-button
                                    type="text"
                                    :icon="ChatLineSquare"
                                    size="small"
                                    :class="['button-pd-0', 'ml-5']"
                                    @click="showSendInviteRequestResponseDialog(scope.row)" />
                            </el-tooltip>
                        </template>

                        <template v-if="scope.row.responses">
                            <template v-for="response in scope.row.responses" :key="response.text">
                                <el-tooltip placement="top" :content="response.text">
                                    <el-button
                                        v-if="response.type === 'link'"
                                        type="text"
                                        :icon="Link"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="openNotificationLink(response.data)" />
                                    <el-button
                                        v-else-if="response.icon === 'check'"
                                        type="text"
                                        :icon="Check"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'cancel'"
                                        type="text"
                                        :icon="Close"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'ban'"
                                        type="text"
                                        :icon="CircleClose"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'bell-slash'"
                                        type="text"
                                        :icon="Bell"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else-if="response.icon === 'reply' && scope.row.type === 'boop'"
                                        type="text"
                                        :icon="ChatLineSquare"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="showSendBoopDialog(scope.row.senderUserId)" />
                                    <el-button
                                        v-else-if="response.icon === 'reply'"
                                        type="text"
                                        :icon="ChatLineSquare"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
                                        @click="
                                            sendNotificationResponse(scope.row.id, scope.row.responses, response.type)
                                        " />
                                    <el-button
                                        v-else
                                        type="text"
                                        :icon="CollectionTag"
                                        size="small"
                                        :class="['button-pd-0', 'ml-5']"
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
                            <el-tooltip placement="top" content="Decline">
                                <el-button
                                    v-if="shiftHeld"
                                    style="color: #f56c6c"
                                    type="text"
                                    :icon="Close"
                                    size="small"
                                    :class="['button-pd-0', 'ml-5']"
                                    @click="hideNotification(scope.row)" />
                                <el-button
                                    v-else
                                    type="text"
                                    :icon="Close"
                                    size="small"
                                    :class="['button-pd-0', 'ml-5']"
                                    @click="hideNotificationPrompt(scope.row)" />
                            </el-tooltip>
                        </template>
                    </template>
                    <template v-if="scope.row.type === 'group.queueReady'">
                        <el-tooltip placement="top" content="Delete log">
                            <el-button
                                v-if="shiftHeld"
                                style="color: #f56c6c"
                                type="text"
                                :icon="Delete"
                                size="small"
                                :class="['button-pd-0', 'ml-5']"
                                @click="deleteNotificationLog(scope.row)" />
                            <el-button
                                v-else
                                type="text"
                                :icon="Delete"
                                size="small"
                                :class="['button-pd-0', 'ml-5']"
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
                        <el-tooltip placement="top" content="Delete log">
                            <el-button
                                v-if="shiftHeld"
                                style="color: #f56c6c; margin-left: 5px"
                                type="text"
                                :icon="Close"
                                size="small"
                                class="button-pd-0"
                                @click="deleteNotificationLog(scope.row)" />
                            <el-button
                                v-else
                                type="text"
                                :icon="Delete"
                                size="small"
                                :class="['button-pd-0', 'ml-5']"
                                @click="deleteNotificationLogPrompt(scope.row)" />
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
        </DataTable>
        <SendInviteResponseDialog
            v-model:send-invite-response-dialog="sendInviteResponseDialog"
            v-model:sendInviteResponseDialogVisible="sendInviteResponseDialogVisible" />
        <SendInviteRequestResponseDialog
            v-model:send-invite-response-dialog="sendInviteResponseDialog"
            v-model:sendInviteRequestResponseDialogVisible="sendInviteRequestResponseDialogVisible" />
    </div>
</template>

<script setup>
    import {
        Bell,
        ChatLineSquare,
        Check,
        CircleClose,
        Close,
        CollectionTag,
        Delete,
        Link,
        Refresh
    } from '@element-plus/icons-vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import Noty from 'noty';

    import {
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
    import {
        checkCanInvite,
        convertFileUrlToImageUrl,
        escapeTag,
        formatDateFilter,
        parseLocation,
        removeFromArray
    } from '../../shared/utils';
    import { friendRequest, notificationRequest, worldRequest } from '../../api';
    import { database } from '../../service/database';

    import Emoji from '../../components/Emoji.vue';
    import SendInviteRequestResponseDialog from './dialogs/SendInviteRequestResponseDialog.vue';
    import SendInviteResponseDialog from './dialogs/SendInviteResponseDialog.vue';
    import configRepository from '../../service/config';

    const { showUserDialog, showSendBoopDialog } = useUserStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { clearInviteImageUpload } = useGalleryStore();
    const { notificationTable, isNotificationsLoading } = storeToRefs(useNotificationStore());
    const { refreshNotifications, handleNotificationHide } = useNotificationStore();
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { shiftHeld } = storeToRefs(useUiStore());

    const { t } = useI18n();

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
        ElMessageBox.confirm('Continue? Accept Friend Request', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    notificationRequest.acceptFriendRequestNotification({
                        notificationId: row.id
                    });
                }
            })
            .catch(() => {});
    }

    function showSendInviteResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('response');
        clearInviteImageUpload();
        sendInviteResponseDialogVisible.value = true;
    }

    function acceptRequestInvite(row) {
        ElMessageBox.confirm('Continue? Send Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
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
                                    ElMessage('Invite sent');
                                    notificationRequest.hideNotification({
                                        notificationId: row.id
                                    });
                                    return _args;
                                });
                        });
                }
            })
            .catch(() => {});
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
                if (!json) {
                    return;
                }
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
        ElMessageBox.confirm(`Continue? Decline ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    hideNotification(row);
                }
            })
            .catch(() => {});
    }

    function deleteNotificationLog(row) {
        removeFromArray(notificationTable.value.data, row);
        if (row.type !== 'friendRequest' && row.type !== 'ignoredFriendRequest') {
            database.deleteNotification(row.id);
        }
    }

    function deleteNotificationLogPrompt(row) {
        ElMessageBox.confirm(`Continue? Delete ${row.type}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteNotificationLog(row);
                }
            })
            .catch(() => {});
    }
</script>

<style lang="scss" scoped>
    .button-pd-0 {
        padding: 0;
    }
    .ml-5 {
        margin-left: 5px !important; // due to ".el-button + .el-button"
    }
</style>
