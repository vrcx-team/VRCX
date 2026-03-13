<template>
    <SidebarMenuItem>
        <ContextMenu>
            <ContextMenuTrigger as-child>
                <div class="w-full">
                    <DropdownMenu
                        v-if="isCollapsed"
                        :open="collapsedDropdownOpenId === item.index"
                        @update:open="(value) => emit('collapsed-dropdown-open-change', item.index, value)">
                        <DropdownMenuTrigger as-child>
                            <SidebarMenuButton
                                :is-active="item.children?.some((e) => e.index === activeMenuIndex)"
                                :tooltip="item.titleIsCustom ? item.title : t(item.title || '')">
                                <i
                                    :class="item.icon"
                                    class="inline-flex size-6 items-center justify-center text-lg relative"
                                    ><span
                                        v-if="isNavItemNotified(item)"
                                        class="notify-dot bg-red-500 -right-1!"
                                        aria-hidden="true"></span
                                ></i>
                                <span v-show="!isCollapsed">{{
                                    item.titleIsCustom ? item.title : t(item.title || '')
                                }}</span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" class="w-56">
                            <DropdownMenuItem
                                v-for="entry in item.children"
                                :key="entry.index"
                                @select="(event) => emit('collapsed-submenu-select', event, entry)">
                                <i
                                    v-if="entry.icon"
                                    :class="entry.icon"
                                    class="inline-flex size-4 items-center justify-center text-base relative"
                                    ><span
                                        v-if="isEntryNotified(entry)"
                                        class="notify-dot bg-red-500 -right-1! top-0.5!"
                                        aria-hidden="true"></span
                                ></i>
                                <span v-if="entry.titleIsCustom">{{ entry.label }}</span>
                                <span v-else>{{ t(entry.label) }}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Collapsible
                        v-else
                        class="group/collapsible"
                        :default-open="activeMenuIndex && item.children?.some((e) => e.index === activeMenuIndex)">
                        <template #default="{ open }">
                            <CollapsibleTrigger as-child>
                                <SidebarMenuButton
                                    :is-active="item.children?.some((e) => e.index === activeMenuIndex)"
                                    :tooltip="item.titleIsCustom ? item.title : t(item.title || '')">
                                    <i
                                        :class="item.icon"
                                        class="inline-flex size-6 items-center justify-center text-lg relative"
                                        ><span
                                            v-if="isNavItemNotified(item)"
                                            class="notify-dot bg-red-500"
                                            aria-hidden="true"></span
                                    ></i>
                                    <span v-show="!isCollapsed">{{
                                        item.titleIsCustom ? item.title : t(item.title || '')
                                    }}</span>

                                    <ChevronRight
                                        v-show="!isCollapsed"
                                        class="ml-auto transition-transform"
                                        :class="open ? 'rotate-90' : ''" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem v-for="entry in item.children" :key="entry.index">
                                        <ContextMenu>
                                            <ContextMenuTrigger as-child>
                                                <SidebarMenuSubButton
                                                    :is-active="activeMenuIndex === entry.index"
                                                    @click="emit('submenu-click', entry)">
                                                    <i
                                                        v-if="entry.icon"
                                                        :class="entry.icon"
                                                        class="inline-flex size-5 items-center justify-center text-base relative"
                                                        ><span
                                                            v-if="isEntryNotified(entry)"
                                                            class="notify-dot bg-red-500 -right-0.5!"
                                                            aria-hidden="true"></span
                                                    ></i>
                                                    <span v-if="entry.titleIsCustom">{{ entry.label }}</span>
                                                    <span v-else>{{ t(entry.label) }}</span>
                                                </SidebarMenuSubButton>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem
                                                    v-if="hasNotifications"
                                                    @click="emit('clear-notifications')">
                                                    {{ t('nav_menu.mark_all_read') }}
                                                </ContextMenuItem>
                                                <ContextMenuSeparator v-if="hasNotifications" />
                                                <template v-if="isDashboardItem(entry)">
                                                    <ContextMenuItem @click="emit('edit-dashboard', entry)">
                                                        {{ t('nav_menu.edit_dashboard') }}
                                                    </ContextMenuItem>
                                                    <ContextMenuItem
                                                        variant="destructive"
                                                        @click="emit('delete-dashboard', entry)">
                                                        {{ t('nav_menu.delete_dashboard') }}
                                                    </ContextMenuItem>
                                                    <ContextMenuSeparator />
                                                </template>
                                                <ContextMenuItem @click="emit('create-dashboard')">
                                                    {{ t('dashboard.new_dashboard') }}
                                                </ContextMenuItem>
                                                <ContextMenuItem @click="emit('open-custom-nav')">
                                                    {{ t('nav_menu.custom_nav.header') }}
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </template>
                    </Collapsible>
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem v-if="hasNotifications" @click="emit('clear-notifications')">
                    {{ t('nav_menu.mark_all_read') }}
                </ContextMenuItem>
                <ContextMenuSeparator v-if="hasNotifications" />
                <ContextMenuItem @click="emit('create-dashboard')">
                    {{ t('dashboard.new_dashboard') }}
                </ContextMenuItem>
                <ContextMenuItem @click="emit('open-custom-nav')">
                    {{ t('nav_menu.custom_nav.header') }}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    </SidebarMenuItem>
</template>

<script setup>
    import { ChevronRight } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import {
        SidebarMenuButton,
        SidebarMenuItem,
        SidebarMenuSub,
        SidebarMenuSubButton,
        SidebarMenuSubItem
    } from '@/components/ui/sidebar';

    defineProps({
        item: {
            type: Object,
            required: true
        },
        isCollapsed: {
            type: Boolean,
            default: false
        },
        activeMenuIndex: {
            type: String,
            default: ''
        },
        collapsedDropdownOpenId: {
            type: String,
            default: null
        },
        hasNotifications: {
            type: Boolean,
            default: false
        },
        isEntryNotified: {
            type: Function,
            required: true
        },
        isNavItemNotified: {
            type: Function,
            required: true
        },
        isDashboardItem: {
            type: Function,
            required: true
        }
    });

    const emit = defineEmits([
        'collapsed-dropdown-open-change',
        'collapsed-submenu-select',
        'submenu-click',
        'clear-notifications',
        'edit-dashboard',
        'delete-dashboard',
        'create-dashboard',
        'open-custom-nav'
    ]);
    const { t } = useI18n();
</script>

<style scoped>
    .notify-dot {
        position: absolute;
        top: 4px;
        right: 0;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        transform: translateY(-50%);
    }
</style>
