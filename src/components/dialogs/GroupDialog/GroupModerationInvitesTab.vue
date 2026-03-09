<template>
    <div style="margin-top: 8px">
        <Button class="rounded-full" variant="outline" size="icon-sm" :disabled="loading" @click="$emit('refresh')">
            <Spinner v-if="loading" />
            <RefreshCw v-else />
        </Button>
        <br />
        <TabsUnderline default-value="sent" :items="invitesTabs" :unmount-on-hide="false">
            <template #label-sent>
                <span class="text-base font-bold">{{ t('dialog.group_member_moderation.sent_invites') }}</span>
                <span class="text-muted-foreground text-xs ml-1.5">{{ invitesTable.data.length }}</span>
            </template>
            <template #label-join>
                <span class="font-bold text-base">{{ t('dialog.group_member_moderation.join_requests') }}</span>
                <span class="text-muted-foreground text-xs ml-1.5">{{ joinRequestsTable.data.length }}</span>
            </template>
            <template #label-blocked>
                <span class="font-bold text-base">{{ t('dialog.group_member_moderation.blocked_requests') }}</span>
                <span class="text-muted-foreground text-xs ml-1.5">{{ blockedTable.data.length }}</span>
            </template>
            <template #sent>
                <Button size="sm" variant="outline" @click="$emit('select-all', invitesTable.data)">{{
                    t('dialog.group_member_moderation.select_all')
                }}</Button>
                <DataTableLayout
                    style="margin-top: 8px"
                    :table="invitesTanstackTable"
                    :loading="loading"
                    :page-sizes="pageSizes"
                    :total-items="invitesTotalItems" />
                <br />
                <Button variant="outline" :disabled="inviteActionDisabled" @click="$emit('delete-sent-invite')">{{
                    t('dialog.group_member_moderation.delete_sent_invite')
                }}</Button>
            </template>

            <template #join>
                <Button size="sm" variant="outline" @click="$emit('select-all', joinRequestsTable.data)">{{
                    t('dialog.group_member_moderation.select_all')
                }}</Button>
                <DataTableLayout
                    style="margin-top: 8px"
                    :table="joinRequestsTanstackTable"
                    :loading="loading"
                    :page-sizes="pageSizes"
                    :total-items="joinRequestsTotalItems" />
                <br />
                <Button
                    variant="outline"
                    :disabled="inviteActionDisabled"
                    class="mr-2"
                    @click="$emit('accept-invite-request')"
                    >{{ t('dialog.group_member_moderation.accept_join_requests') }}</Button
                >
                <Button
                    variant="outline"
                    :disabled="inviteActionDisabled"
                    class="mr-2"
                    @click="$emit('reject-invite-request')"
                    >{{ t('dialog.group_member_moderation.reject_join_requests') }}</Button
                >
                <Button variant="outline" :disabled="inviteActionDisabled" @click="$emit('block-join-request')">{{
                    t('dialog.group_member_moderation.block_join_requests')
                }}</Button>
            </template>

            <template #blocked>
                <Button size="sm" variant="outline" @click="$emit('select-all', blockedTable.data)">{{
                    t('dialog.group_member_moderation.select_all')
                }}</Button>
                <DataTableLayout
                    style="margin-top: 8px"
                    :table="blockedTanstackTable"
                    :loading="loading"
                    :page-sizes="pageSizes"
                    :total-items="blockedTotalItems" />
                <br />
                <Button variant="outline" :disabled="inviteActionDisabled" @click="$emit('delete-blocked-request')">{{
                    t('dialog.group_member_moderation.delete_blocked_requests')
                }}</Button>
            </template>
        </TabsUnderline>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { DataTableLayout } from '@/components/ui/data-table';
    import { RefreshCw } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { computed } from 'vue';
    import { hasGroupPermission } from '@/shared/utils';
    import { useI18n } from 'vue-i18n';
    import { useVrcxVueTable } from '@/lib/table/useVrcxVueTable';

    import { createColumns as createInvitesColumns } from './groupMemberModerationInvitesColumns.jsx';
    import { createColumns as createJoinRequestsColumns } from './groupMemberModerationJoinRequestsColumns.jsx';
    import { createColumns as createBlockedColumns } from './groupMemberModerationBlockedColumns.jsx';

    const props = defineProps({
        loading: { type: Boolean, default: false },
        invitesTable: { type: Object, required: true },
        joinRequestsTable: { type: Object, required: true },
        blockedTable: { type: Object, required: true },
        groupRef: { type: Object, default: () => ({}) },
        progressCurrent: { type: Number, default: 0 },
        pageSizes: { type: Array, required: true },
        columnContext: { type: Object, required: true }
    });

    defineEmits([
        'refresh',
        'select-all',
        'delete-sent-invite',
        'accept-invite-request',
        'reject-invite-request',
        'block-join-request',
        'delete-blocked-request'
    ]);

    const { t } = useI18n();

    const invitesTabs = computed(() => [
        { value: 'sent', label: t('dialog.group_member_moderation.sent_invites') },
        { value: 'join', label: t('dialog.group_member_moderation.join_requests') },
        { value: 'blocked', label: t('dialog.group_member_moderation.blocked_requests') }
    ]);

    const inviteActionDisabled = computed(() =>
        Boolean(props.progressCurrent || !hasGroupPermission(props.groupRef, 'group-invites-manage'))
    );

    // ── Invites TanStack table ───────────────────────────────────
    const invitesColumns = computed(() => createInvitesColumns(props.columnContext));
    const { table: invitesTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:invites',
        get data() {
            return computed(() => props.invitesTable.data).value;
        },
        columns: invitesColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: props.invitesTable.pageSize ?? 15 }
    });
    const invitesTotalItems = computed(() => invitesTanstackTable.getFilteredRowModel().rows.length);

    // ── Join Requests TanStack table ─────────────────────────────
    const joinRequestsColumns = computed(() => createJoinRequestsColumns(props.columnContext));
    const { table: joinRequestsTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:join-requests',
        get data() {
            return computed(() => props.joinRequestsTable.data).value;
        },
        columns: joinRequestsColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: props.joinRequestsTable.pageSize ?? 15 }
    });
    const joinRequestsTotalItems = computed(() => joinRequestsTanstackTable.getFilteredRowModel().rows.length);

    // ── Blocked TanStack table ───────────────────────────────────
    const blockedColumns = computed(() => createBlockedColumns(props.columnContext));
    const { table: blockedTanstackTable } = useVrcxVueTable({
        persistKey: 'group-moderation:blocked',
        get data() {
            return computed(() => props.blockedTable.data).value;
        },
        columns: blockedColumns,
        getRowId: (row) => String(row?.userId ?? row?.id ?? ''),
        initialPagination: { pageIndex: 0, pageSize: props.blockedTable.pageSize ?? 15 }
    });
    const blockedTotalItems = computed(() => blockedTanstackTable.getFilteredRowModel().rows.length);
</script>
