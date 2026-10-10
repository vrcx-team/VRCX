<template>
    <Dialog :open="isGroupInvitesDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.group_invites.header') }}</DialogTitle>
            </DialogHeader>

            <div class="flex items-center gap-2">
                <Tabs v-model="activeTab">
                    <TabsList>
                        <TabsTrigger value="invited">{{ t('dialog.group_invites.invited') }}</TabsTrigger>
                        <TabsTrigger value="requested">{{ t('dialog.group_invites.requested') }}</TabsTrigger>
                    </TabsList>
                </Tabs>
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
                    <TooltipWrapper
                        v-if="activeTab === 'requested'"
                        side="top"
                        :content="t('dialog.group_invites.cancel_request')">
                        <Button size="icon-sm" variant="ghost" @click="cancelRequest(group)">
                            <X class="size-4" />
                        </Button>
                    </TooltipWrapper>
                    <template v-else>
                        <TooltipWrapper side="top" :content="t('dialog.group_invites.accept')">
                            <Button size="icon-sm" variant="ghost" @click="acceptInvite(group)">
                                <Check class="size-4" />
                            </Button>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="t('dialog.group_invites.decline')">
                            <Button size="icon-sm" variant="ghost" @click="declineInvite(group)">
                                <X class="size-4" />
                            </Button>
                        </TooltipWrapper>
                        <TooltipWrapper side="top" :content="t('dialog.group_invites.block')">
                            <Button size="icon-sm" variant="ghost" class="text-destructive" @click="blockGroup(group)">
                                <Ban class="size-4" />
                            </Button>
                        </TooltipWrapper>
                    </template>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Ban, Check, RefreshCw, Users, X } from 'lucide-vue-next';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { groupRequest } from '../../../api';
    import { showGroupDialog } from '../../../coordinators/groupCoordinator';
    import { useModalStore } from '../../../stores';

    const props = defineProps({
        isGroupInvitesDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['close']);

    const { t } = useI18n();
    const modalStore = useModalStore();

    const groups = ref([]);
    const isLoading = ref(false);
    /** @type {import('vue').Ref<'invited' | 'requested'>} */
    const activeTab = ref('invited');

    watch(
        () => props.isGroupInvitesDialogVisible,
        (visible) => {
            if (visible) {
                loadGroups();
            }
        }
    );

    watch(activeTab, () => loadGroups());

    function closeDialog() {
        emit('close');
    }

    async function loadGroups() {
        groups.value = [];
        isLoading.value = true;
        try {
            const { json } = await groupRequest.getMyGroupsByStatus({ membershipStatus: activeTab.value });
            groups.value = json ?? [];
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * @param {string} id
     */
    function removeGroup(id) {
        groups.value = groups.value.filter((g) => g.id !== id);
    }

    /**
     * @param {object} group
     */
    async function acceptInvite(group) {
        await groupRequest.joinGroup({ groupId: group.groupId });
        removeGroup(group.id);
        toast.success(t('dialog.group_invites.accepted'));
    }

    /**
     * @param {object} group
     */
    async function declineInvite(group) {
        await groupRequest.declineGroupInvite({ groupId: group.groupId });
        removeGroup(group.id);
    }

    /**
     * @param {object} group
     */
    async function cancelRequest(group) {
        await groupRequest.cancelGroupRequest({ groupId: group.groupId });
        removeGroup(group.id);
    }

    /**
     * @param {object} group
     */
    async function blockGroup(group) {
        const { ok } = await modalStore.confirm({
            title: t('confirm.title'),
            description: t('confirm.block_group'),
            destructive: true
        });
        if (!ok) {
            return;
        }
        await groupRequest.blockGroup({ groupId: group.groupId });
        removeGroup(group.id);
    }
</script>
