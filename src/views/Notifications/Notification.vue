<template>
    <div class="x-container" ref="notificationsRef">
        <DataTableLayout
            :table="table"
            :loading="isNotificationsLoading"
            :table-style="tableHeightStyle"
            :page-sizes="pageSizes"
            :total-items="totalItems"
            :on-page-size-change="handlePageSizeChange">
            <template #toolbar>
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
                        clearable
                        class="flex-[0.4]"
                        style="margin: 0 10px" />
                    <TooltipWrapper side="bottom" :content="t('view.notification.refresh_tooltip')">
                        <el-button
                            type="default"
                            :loading="isNotificationsLoading"
                            :icon="Refresh"
                            circle
                            style="flex: none"
                            @click="refreshNotifications()" />
                    </TooltipWrapper>
                </div>
            </template>
        </DataTableLayout>
        <SendInviteResponseDialog
            v-model:send-invite-response-dialog="sendInviteResponseDialog"
            v-model:sendInviteResponseDialogVisible="sendInviteResponseDialogVisible" />
        <SendInviteRequestResponseDialog
            v-model:send-invite-response-dialog="sendInviteResponseDialog"
            v-model:sendInviteRequestResponseDialogVisible="sendInviteRequestResponseDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { ElMessageBox } from 'element-plus';
    import { Refresh } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import Noty from 'noty';
    import dayjs from 'dayjs';

    import {
        useAppearanceSettingsStore,
        useGalleryStore,
        useGroupStore,
        useInviteStore,
        useLocationStore,
        useNotificationStore,
        useUserStore,
        useVrcxStore
    } from '../../stores';
    import { convertFileUrlToImageUrl, escapeTag, parseLocation } from '../../shared/utils';
    import { friendRequest, notificationRequest, worldRequest } from '../../api';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { createColumns } from './columns.jsx';
    import { database } from '../../service/database';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    import SendInviteRequestResponseDialog from './dialogs/SendInviteRequestResponseDialog.vue';
    import SendInviteResponseDialog from './dialogs/SendInviteResponseDialog.vue';
    import configRepository from '../../service/config';

    const { showUserDialog } = useUserStore();
    const { showGroupDialog } = useGroupStore();
    const { lastLocation, lastLocationDestination } = storeToRefs(useLocationStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { clearInviteImageUpload } = useGalleryStore();
    const { notificationTable, isNotificationsLoading } = storeToRefs(useNotificationStore());
    const { refreshNotifications, handleNotificationHide } = useNotificationStore();
    const { showFullscreenImageDialog } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const vrcxStore = useVrcxStore();

    const { t } = useI18n();

    const notificationsRef = ref(null);
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(notificationsRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    function getNotificationCreatedAt(row) {
        if (typeof row?.created_at === 'string' && row.created_at.length > 0) {
            return row.created_at;
        }
        if (typeof row?.createdAt === 'string' && row.createdAt.length > 0) {
            return row.createdAt;
        }
        return '';
    }

    function getNotificationCreatedAtTs(row) {
        const createdAtRaw = row?.created_at ?? row?.createdAt;
        if (typeof createdAtRaw === 'number') {
            const ts = createdAtRaw > 1_000_000_000_000 ? createdAtRaw : createdAtRaw * 1000;
            return Number.isFinite(ts) ? ts : 0;
        }

        const createdAt = getNotificationCreatedAt(row);
        const ts = dayjs(createdAt).valueOf();
        return Number.isFinite(ts) ? ts : 0;
    }

    const asRawArray = (value) => (Array.isArray(value) ? value : []);
    const isEmptyFilterValue = (value) => (Array.isArray(value) ? value.length === 0 : !value);
    const applyFilter = (row, filter) => {
        if (Array.isArray(filter.prop)) {
            return filter.prop.some((propItem) => applyFilter(row, { prop: propItem, value: filter.value }));
        }

        const cellValue = row[filter.prop];
        if (cellValue === undefined || cellValue === null) {
            return false;
        }

        if (Array.isArray(filter.value)) {
            return filter.value.some((val) => String(cellValue).toLowerCase() === String(val).toLowerCase());
        }
        return String(cellValue).toLowerCase().includes(String(filter.value).toLowerCase());
    };

    const notificationDisplayData = computed(() => {
        const rawData = asRawArray(notificationTable.value.data);
        const rawFilters = Array.isArray(notificationTable.value.filters) ? notificationTable.value.filters : [];
        const activeFilters = rawFilters.filter((filter) => !isEmptyFilterValue(filter?.value));

        if (activeFilters.length === 0) {
            return rawData.slice();
        }

        return rawData.filter((row) => {
            for (const filter of activeFilters) {
                if (filter.filterFn) {
                    if (!filter.filterFn(row, filter)) {
                        return false;
                    }
                    continue;
                }
                if (!applyFilter(row, filter)) {
                    return false;
                }
            }
            return true;
        });
    });

    const columns = createColumns({
        getNotificationCreatedAt,
        getNotificationCreatedAtTs,
        openNotificationLink,
        showFullscreenImageDialog,
        getSmallThumbnailUrl,
        acceptFriendRequestNotification,
        showSendInviteResponseDialog,
        showSendInviteRequestResponseDialog,
        acceptRequestInvite,
        sendNotificationResponse,
        hideNotification,
        hideNotificationPrompt,
        deleteNotificationLog,
        deleteNotificationLogPrompt
    });

    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const pageSize = computed(() =>
        notificationTable.value.pageSizeLinked
            ? appearanceSettingsStore.tablePageSize
            : notificationTable.value.pageSize
    );

    const { table, pagination } = useVrcxVueTable({
        persistKey: 'notifications',
        data: notificationDisplayData,
        columns,
        getRowId: (row) => row.id ?? `${row.type}:${row.senderUserId ?? ''}:${row.created_at ?? ''}`,
        initialSorting: [{ id: 'created_at', desc: true }],
        initialPagination: {
            pageIndex: 0,
            pageSize: pageSize.value
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        if (notificationTable.value.pageSizeLinked) {
            appearanceSettingsStore.setTablePageSize(size);
        } else {
            notificationTable.value.pageSize = size;
        }
    };

    watch(pageSize, (size) => {
        if (pagination.value.pageSize === size) {
            return;
        }
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
        table.setPageSize(size);
    });

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
                    if (!currentLocation) {
                        // game log disabled, use API location
                        currentLocation = currentUser.$locationTag;
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
                                    toast('Invite sent');
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
        const idx = notificationTable.value.data.findIndex((e) => e.id === row.id);
        if (idx !== -1) {
            notificationTable.value.data.splice(idx, 1);
        }
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

<style scoped>
    .button-pd-0 {
        padding: 0;
    }
    .ml-5 {
        margin-left: 5px !important; /* due to ".el-button + .el-button" */
    }
    .notification-image {
        flex: none;
        height: 30px;
        width: 30px;
        border-radius: 4px;
        object-fit: cover;
    }
    .table-user-text {
        color: var(--x-table-user-text-color);
    }
</style>
