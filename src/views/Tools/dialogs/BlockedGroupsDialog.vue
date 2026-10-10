<template>
    <Dialog :open="isBlockedGroupsDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.blocked_groups.header') }}</DialogTitle>
            </DialogHeader>

            <div class="flex items-center">
                <Button size="sm" variant="outline" class="ml-auto" :disabled="isLoading" @click="loadGroups">
                    <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
                </Button>
            </div>

            <div class="max-h-[60vh] overflow-y-auto">
                <DataTableEmpty v-if="!groups.length && !isLoading" type="nodata" />
                <div
                    v-for="group in groups"
                    :key="group.id"
                    class="flex items-center gap-3 border-b py-2 last:border-b-0">
                    <Avatar class="size-9 flex-none">
                        <AvatarImage :src="group.iconUrl" class="object-cover" />
                        <AvatarFallback>
                            <Users class="size-4 text-muted-foreground" />
                        </AvatarFallback>
                    </Avatar>
                    <div class="min-w-0 flex-1 text-sm">
                        <button
                            type="button"
                            class="block max-w-full truncate font-medium hover:underline cursor-pointer"
                            @click="showGroupDialog(group.groupId)"
                            v-text="group.name"></button>
                        <div class="truncate text-xs text-muted-foreground">
                            {{ group.shortCode }}.{{ group.discriminator }} · {{ group.memberCount }}
                        </div>
                    </div>
                    <Button size="sm" variant="outline" @click="unblockGroup(group)">
                        {{ t('dialog.blocked_groups.unblock') }}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { RefreshCw, Users } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useModalStore, useUserStore } from '../../../stores';
    import { groupRequest } from '../../../api';
    import { showGroupDialog } from '../../../coordinators/groupCoordinator';

    const props = defineProps({
        isBlockedGroupsDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['close']);

    const { t } = useI18n();
    const modalStore = useModalStore();
    const { currentUser } = storeToRefs(useUserStore());

    const groups = ref([]);
    const isLoading = ref(false);

    watch(
        () => props.isBlockedGroupsDialogVisible,
        (visible) => {
            if (visible) {
                loadGroups();
            }
        }
    );

    function closeDialog() {
        emit('close');
    }

    async function loadGroups() {
        groups.value = [];
        isLoading.value = true;
        try {
            const { json } = await groupRequest.getMyGroupsByStatus({ membershipStatus: 'userblocked' });
            groups.value = json ?? [];
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * @param {object} group
     */
    async function unblockGroup(group) {
        const { ok } = await modalStore.confirm({
            title: t('confirm.title'),
            description: t('confirm.unblock_group')
        });
        if (!ok) {
            return;
        }
        await groupRequest.unblockGroup({ groupId: group.groupId, userId: currentUser.value.id });
        groups.value = groups.value.filter((g) => g.id !== group.id);
    }
</script>
