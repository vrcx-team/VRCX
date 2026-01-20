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
    import { useAvatarStore, useGroupStore, useUiStore, useUserStore, useWorldStore } from '@/stores';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Dialog, DialogContent } from '@/components/ui/dialog';
    import { computed } from 'vue';

    import AvatarDialog from './AvatarDialog/AvatarDialog.vue';
    import GroupDialog from './GroupDialog/GroupDialog.vue';
    import UserDialog from './UserDialog/UserDialog.vue';
    import WorldDialog from './WorldDialog/WorldDialog.vue';

    const avatarStore = useAvatarStore();
    const groupStore = useGroupStore();
    const uiStore = useUiStore();
    const userStore = useUserStore();
    const worldStore = useWorldStore();

    const isOpen = computed({
        get: () =>
            userStore.userDialog.visible ||
            worldStore.worldDialog.visible ||
            avatarStore.avatarDialog.visible ||
            groupStore.groupDialog.visible,
        set: (value) => {
            if (!value) {
                userStore.userDialog.visible = false;
                worldStore.worldDialog.visible = false;
                avatarStore.avatarDialog.visible = false;
                groupStore.groupDialog.visible = false;
                uiStore.clearDialogCrumbs();
            }
        }
    });

    const dialogCrumbs = computed(() => uiStore.dialogCrumbs);
    const activeCrumb = computed(() => dialogCrumbs.value[dialogCrumbs.value.length - 1] || null);
    const activeType = computed(() => {
        if (activeCrumb.value?.type) {
            return activeCrumb.value.type;
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
        return null;
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
            default:
                return null;
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
            case 'user':
            default:
                return 'x-dialog x-user-dialog sm:max-w-235 translate-y-0';
        }
    });

    const shouldShowBreadcrumbs = computed(() => dialogCrumbs.value.length > 1);
    const shouldCollapseBreadcrumbs = computed(() => dialogCrumbs.value.length > 4);
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
            userStore.showUserDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'world') {
            worldStore.showWorldDialog(item.id, null, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'avatar') {
            avatarStore.showAvatarDialog(item.id, { skipBreadcrumb: true });
            return;
        }
        if (item.type === 'group') {
            groupStore.showGroupDialog(item.id, { skipBreadcrumb: true });
        }
    };
</script>

<template>
    <Dialog v-model:open="isOpen">
        <DialogContent :class="dialogClass" style="top: 10vh" :show-close-button="false">
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

            <component :is="activeComponent" v-if="activeComponent" />
        </DialogContent>
    </Dialog>
</template>
