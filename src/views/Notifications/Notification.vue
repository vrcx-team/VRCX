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
                    <Select
                        multiple
                        :model-value="
                            Array.isArray(notificationTable.filters?.[0]?.value)
                                ? notificationTable.filters[0].value
                                : []
                        "
                        @update:modelValue="handleNotificationFilterChange">
                        <SelectTrigger class="w-full" style="flex: 1">
                            <SelectValue :placeholder="t('view.notification.filter_placeholder')" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
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
                                    :value="type">
                                    {{ t('view.notification.filters.' + type) }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <InputGroupField
                        v-model="notificationTable.filters[1].value"
                        :placeholder="t('view.notification.search_placeholder')"
                        clearable
                        class="flex-[0.4]"
                        style="margin: 0 10px" />
                    <TooltipWrapper side="bottom" :content="t('view.notification.refresh_tooltip')">
                        <Button
                            class="rounded-full"
                            variant="ghost"
                            size="icon-sm"
                            :disabled="isNotificationsLoading"
                            style="flex: none"
                            @click="refreshNotifications()">
                            <Spinner v-if="isNotificationsLoading" />
                            <RefreshCw v-else />
                        </Button>
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
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { RefreshCw } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
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
        useModalStore,
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
    const modalStore = useModalStore();

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
        get data() {
            return notificationDisplayData.value;
        },
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

    function handleNotificationFilterChange(value) {
        notificationTable.value.filters[0].value = Array.isArray(value) ? value : [];
        saveTableFilters();
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
        modalStore
            .confirm({
                description: t('confirm.accept_friend_request'),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (!ok) {
                    return;
                }
                notificationRequest.acceptFriendRequestNotification({
                    notificationId: row.id
                });
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
        modalStore
            .confirm({
                description: t('confirm.send_invite'),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (!ok) {
                    return;
                }
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
                                toast(t('message.invite.sent'));
                                notificationRequest.hideNotification({
                                    notificationId: row.id
                                });
                                return _args;
                            });
                    });
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
        modalStore
            .confirm({
                description: t('confirm.decline_type', { type: row.type }),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (ok) {
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
        modalStore
            .confirm({
                description: t('confirm.delete_type', { type: row.type }),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (ok) {
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

    .notification-image {
        flex: none;
        height: 30px;
        width: 30px;
        border-radius: 4px;
        object-fit: cover;
    }
</style>
