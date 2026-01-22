<script setup>
    import {
        Breadcrumb,
        BreadcrumbEllipsis,
        BreadcrumbItem,
        BreadcrumbLink,
        BreadcrumbList,
        BreadcrumbPage,
        BreadcrumbSeparator
    } from '@/components/ui/breadcrumb';
    import { useAvatarStore, useGroupStore, useInstanceStore, useUiStore, useUserStore, useWorldStore } from '@/stores';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Dialog, DialogContent } from '@/components/ui/dialog';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';

    import AvatarDialog from './AvatarDialog/AvatarDialog.vue';
    import GroupDialog from './GroupDialog/GroupDialog.vue';
    import PreviousInstancesInfoDialog from './PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';
    import PreviousInstancesListDialog from './PreviousInstancesDialog/PreviousInstancesListDialog.vue';
    import UserDialog from './UserDialog/UserDialog.vue';
    import WorldDialog from './WorldDialog/WorldDialog.vue';

    const avatarStore = useAvatarStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();
    const uiStore = useUiStore();
    const userStore = useUserStore();
    const worldStore = useWorldStore();

    const {
        previousInstancesInfoDialogVisible,
        previousInstancesInfoDialogInstanceId,
        previousInstancesUserDialog,
        previousInstancesWorldDialog,
        previousInstancesGroupDialog
    } = storeToRefs(instanceStore);

    const isOpen = computed({
        get: () =>
            userStore.userDialog.visible ||
            worldStore.worldDialog.visible ||
            avatarStore.avatarDialog.visible ||
            groupStore.groupDialog.visible ||
            previousInstancesInfoDialogVisible.value ||
            previousInstancesUserDialog.value.visible ||
            previousInstancesWorldDialog.value.visible ||
            previousInstancesGroupDialog.value.visible,
        set: (value) => {
            if (!value) {
                userStore.userDialog.visible = false;
                worldStore.worldDialog.visible = false;
                avatarStore.avatarDialog.visible = false;
                groupStore.groupDialog.visible = false;
                instanceStore.hidePreviousInstancesDialogs();
                uiStore.clearDialogCrumbs();
            }
        }
    });

    const dialogCrumbs = computed(() => uiStore.dialogCrumbs);
    const activeCrumb = computed(() => dialogCrumbs.value[dialogCrumbs.value.length - 1] || null);
    const activeType = computed(() => {
        const type = (() => {
            if (previousInstancesInfoDialogVisible.value) {
                return 'previous-instances-info';
            }
            if (previousInstancesUserDialog.value.visible) {
                return 'previous-instances-user';
            }
            if (previousInstancesWorldDialog.value.visible) {
                return 'previous-instances-world';
            }
            if (previousInstancesGroupDialog.value.visible) {
                return 'previous-instances-group';
            }
            if (userStore.userDialog.visible) {
                return 'user';
            }
            if (worldStore.worldDialog.visible) {
                return 'world';
            }
            if (avatarStore.avatarDialog.visible) {
                return 'avatar';
            }
            if (groupStore.groupDialog.visible) {
                return 'group';
            }
            const crumb = activeCrumb.value;
            return crumb?.type ?? null;
        })();
        console.log('[prev-instances] activeType', {
            type,
            infoVisible: previousInstancesInfoDialogVisible.value,
            infoId: previousInstancesInfoDialogInstanceId.value,
            userVisible: previousInstancesUserDialog.value.visible,
            worldVisible: previousInstancesWorldDialog.value.visible,
            groupVisible: previousInstancesGroupDialog.value.visible
        });
        return type;
    });
    const activeComponent = computed(() => {
        switch (activeType.value) {
            case 'user':
                return UserDialog;
            case 'world':
                return WorldDialog;
            case 'avatar':
                return AvatarDialog;
            case 'group':
                return GroupDialog;
            case 'previous-instances-info':
                return PreviousInstancesInfoDialog;
            case 'previous-instances-user':
                return PreviousInstancesListDialog;
            case 'previous-instances-world':
                return PreviousInstancesListDialog;
            case 'previous-instances-group':
                return PreviousInstancesListDialog;
            default:
                return null;
        }
    });
    const activeComponentProps = computed(() => {
        switch (activeType.value) {
            case 'previous-instances-user':
                return { variant: 'user' };
            case 'previous-instances-world':
                return { variant: 'world' };
            case 'previous-instances-group':
                return { variant: 'group' };
            default:
                return {};
        }
    });

    const dialogClass = computed(() => {
        switch (activeType.value) {
            case 'world':
                return 'x-dialog x-world-dialog translate-y-0 sm:max-w-235';
            case 'avatar':
                return 'x-dialog x-avatar-dialog sm:max-w-235 translate-y-0';
            case 'group':
                return 'x-dialog x-group-dialog group-body translate-y-0 sm:max-w-235';
            case 'previous-instances-info':
            case 'previous-instances-user':
            case 'previous-instances-world':
            case 'previous-instances-group':
                return 'x-dialog translate-y-0 sm:max-w-250';
            case 'user':
            default:
                return 'x-dialog x-user-dialog sm:max-w-235 translate-y-0';
        }
    });

    const shouldShowBreadcrumbs = computed(() => dialogCrumbs.value.length > 1);
    const shouldCollapseBreadcrumbs = computed(() => dialogCrumbs.value.length > 5);
    const middleBreadcrumbs = computed(() => {
        if (!shouldCollapseBreadcrumbs.value) {
            return [];
        }
        return dialogCrumbs.value.slice(1, -2);
    });

    const handleBreadcrumbClick = (index) => {
        const item = dialogCrumbs.value[index];
        if (!item) {
            return;
        }
        uiStore.jumpDialogCrumb(index);
        if (item.type === 'user') {
            instanceStore.hidePreviousInstancesDialogs();
            userStore.showUserDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'world') {
            instanceStore.hidePreviousInstancesDialogs();
            worldStore.showWorldDialog(item.id, null, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'avatar') {
            instanceStore.hidePreviousInstancesDialogs();
            avatarStore.showAvatarDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'group') {
            instanceStore.hidePreviousInstancesDialogs();
            groupStore.showGroupDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'previous-instances-user') {
            instanceStore.showPreviousInstancesUserDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'previous-instances-world') {
            instanceStore.showPreviousInstancesWorldDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'previous-instances-group') {
            instanceStore.showPreviousInstancesGroupDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'previous-instances-info') {
            instanceStore.showPreviousInstancesInfoDialog(item.id, { skipBreadcrumb: true });
        }
    };
</script>

<template>
    <Dialog v-model:open="isOpen">
        <DialogContent
            :class="dialogClass"
            style="top: 10vh"
            :show-close-button="false">
            <Breadcrumb v-if="shouldShowBreadcrumbs" class="mb-2">
                <BreadcrumbList>
                    <template v-if="shouldCollapseBreadcrumbs">
                        <BreadcrumbItem>
                            <BreadcrumbLink as-child>
                                <button
                                    type="button"
                                    class="max-w-40 truncate text-left"
                                    @click="handleBreadcrumbClick(0)">
                                    {{ dialogCrumbs[0]?.label || dialogCrumbs[0]?.id }}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger class="flex items-center gap-1">
                                    <BreadcrumbEllipsis class="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                        v-for="(crumb, index) in middleBreadcrumbs"
                                        :key="`${crumb.type}-${crumb.id}`"
                                        @click="handleBreadcrumbClick(index + 1)">
                                        {{ crumb.label || crumb.id }}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink as-child>
                                <button
                                    type="button"
                                    class="max-w-40 truncate text-left"
                                    @click="handleBreadcrumbClick(dialogCrumbs.length - 2)">
                                    {{
                                        dialogCrumbs[dialogCrumbs.length - 2]?.label ||
                                        dialogCrumbs[dialogCrumbs.length - 2]?.id
                                    }}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage class="max-w-40 truncate">
                                {{
                                    dialogCrumbs[dialogCrumbs.length - 1]?.label ||
                                    dialogCrumbs[dialogCrumbs.length - 1]?.id
                                }}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </template>
                    <template v-else>
                        <template v-for="(crumb, index) in dialogCrumbs" :key="`${crumb.type}-${crumb.id}`">
                            <BreadcrumbItem>
                                <BreadcrumbLink v-if="index < dialogCrumbs.length - 1" as-child>
                                    <button
                                        type="button"
                                        class="max-w-40 truncate text-left"
                                        @click="handleBreadcrumbClick(index)">
                                        {{ crumb.label || crumb.id }}
                                    </button>
                                </BreadcrumbLink>
                                <BreadcrumbPage v-else class="max-w-40 truncate">
                                    {{ crumb.label || crumb.id }}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator v-if="index < dialogCrumbs.length - 1" />
                        </template>
                    </template>
                </BreadcrumbList>
            </Breadcrumb>

            <component :is="activeComponent" v-if="activeComponent" v-bind="activeComponentProps" :key="activeType" />
        </DialogContent>
    </Dialog>
</template>
