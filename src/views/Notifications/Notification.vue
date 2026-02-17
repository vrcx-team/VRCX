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
                <div class="mb-2 flex items-center">
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

    import dayjs from 'dayjs';

    import {
        useAppearanceSettingsStore,
        useGalleryStore,
        useGroupStore,
        useInviteStore,
        useNotificationStore,
        useUserStore,
        useVrcxStore
    } from '../../stores';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { convertFileUrlToImageUrl } from '../../shared/utils';
    import { createColumns } from './columns.jsx';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    import SendInviteRequestResponseDialog from './dialogs/SendInviteRequestResponseDialog.vue';
    import SendInviteResponseDialog from './dialogs/SendInviteResponseDialog.vue';
    import configRepository from '../../service/config';

    const { showUserDialog } = useUserStore();
    const { showGroupDialog } = useGroupStore();
    const { refreshInviteMessageTableData } = useInviteStore();
    const { clearInviteImageUpload } = useGalleryStore();
    const { notificationTable, isNotificationsLoading } = storeToRefs(useNotificationStore());
    const {
        refreshNotifications,
        acceptFriendRequestNotification,
        hideNotification,
        hideNotificationPrompt,
        acceptRequestInvite,
        sendNotificationResponse,
        deleteNotificationLog,
        deleteNotificationLogPrompt
    } = useNotificationStore();
    const { showFullscreenImageDialog } = useGalleryStore();
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
        get data() {
            return notificationDisplayData.value;
        },
        columns,
        getRowId: (row) => row.id ?? `${row.type}:${row.senderUserId ?? ''}:${row.created_at ?? ''}`,
        initialSorting: [{ id: 'created_at', desc: true }],
        initialPagination: {
            pageIndex: 0,
            pageSize: pageSize.value
        },
        tableOptions: {
            autoResetPageIndex: false
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
            case 'openNotificationLink':
            default:
                toast.error('Unsupported notification link type');
                break;
        }
    }

    function getSmallThumbnailUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    function showSendInviteResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('response');
        clearInviteImageUpload();
        sendInviteResponseDialogVisible.value = true;
    }

    function showSendInviteRequestResponseDialog(invite) {
        sendInviteResponseDialog.value.invite = invite;
        sendInviteResponseDialog.value.messageSlot = {};
        refreshInviteMessageTableData('requestResponse');
        clearInviteImageUpload();
        sendInviteRequestResponseDialogVisible.value = true;
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
