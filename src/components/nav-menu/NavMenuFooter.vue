<template>
    <SidebarFooter class="px-2 py-3">
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <SidebarMenuButton :tooltip="t('nav_tooltip.help_support')">
                            <i class="ri-question-line inline-flex size-6 items-center justify-center text-lg" />
                            <span v-show="!isCollapsed">{{ t('nav_tooltip.help_support') }}</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" class="w-56">
                        <DropdownMenuItem @click="emit('show-whats-new')">
                            <span>{{ t('nav_menu.whats_new') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{{ t('nav_menu.resources') }}</DropdownMenuLabel>
                        <DropdownMenuItem @click="emit('support-link', 'wiki')">
                            <span>{{ t('nav_menu.wiki') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{{ t('nav_menu.get_help') }}</DropdownMenuLabel>
                        <DropdownMenuItem @click="emit('support-link', 'github')">
                            <span>{{ t('nav_menu.github') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="emit('support-link', 'discord')">
                            <span>{{ t('nav_menu.discord') }}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            <SidebarMenuItem>
                <SidebarMenuButton :tooltip="t('nav_tooltip.toggle_theme')" @click="emit('toggle-theme')">
                    <i
                        :class="isDarkMode ? 'ri-moon-line' : 'ri-sun-line'"
                        class="inline-flex size-6 items-center justify-center text-[19px]" />
                    <span v-show="!isCollapsed">{{ t('nav_tooltip.toggle_theme') }}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                        <SidebarMenuButton :tooltip="t('nav_tooltip.manage')">
                            <span class="relative inline-flex size-6 items-center justify-center">
                                <i class="ri-settings-3-line text-lg" />
                                <span
                                    v-if="hasPendingUpdate || hasPendingInstall"
                                    class="absolute top-0.5 -right-1 h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            </span>
                            <span v-show="!isCollapsed">{{ t('nav_tooltip.manage') }}</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" class="w-54">
                        <div class="flex items-center gap-2 px-2 py-1.5">
                            <img
                                class="h-6 w-6 cursor-pointer"
                                :src="vrcxLogo"
                                alt="VRCX"
                                @click="emit('open-github')" />
                            <div class="flex min-w-0 flex-col">
                                <button
                                    type="button"
                                    class="text-left text-sm font-medium truncate flex items-center gap-1"
                                    @click="emit('open-github')">
                                    VRCX
                                    <Heart class="text-primary fill-current stroke-none" />
                                </button>
                                <span class="text-xs text-muted-foreground">{{ version }}</span>
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            v-if="hasPendingUpdate || hasPendingInstall"
                            @click="emit('show-vrcx-update-dialog')">
                            <span>{{ t('nav_menu.update_available') }}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator v-if="hasPendingUpdate || hasPendingInstall" />
                        <DropdownMenuItem @click="emit('settings-click')">
                            <span>{{ t('nav_tooltip.settings') }}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span>{{ t('view.settings.appearance.appearance.theme_mode') }}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent side="right" align="start" class="w-54">
                                <DropdownMenuCheckboxItem
                                    v-for="theme in themes"
                                    :key="theme"
                                    :model-value="themeMode === theme"
                                    indicator-position="right"
                                    @select="emit('theme-select', theme)">
                                    <span>{{ themeDisplayName(theme) }}</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel class="px-2 py-2 font-normal">
                                    <div class="flex items-center justify-around">
                                        <TooltipWrapper
                                            v-for="theme in themeColors"
                                            :key="theme.key"
                                            side="top"
                                            :content="themeColorDisplayName(theme)"
                                            :delay-duration="600">
                                            <button
                                                type="button"
                                                :disabled="isApplyingThemeColor"
                                                :aria-pressed="currentThemeColor === theme.key"
                                                :aria-label="themeColorDisplayName(theme)"
                                                :title="themeColorDisplayName(theme)"
                                                @click="emit('theme-color-select', theme)"
                                                class="h-3.5 w-3.5 shrink-0 rounded-sm transition-transform hover:scale-125"
                                                :class="
                                                    currentThemeColor === theme.key
                                                        ? 'ring-1 ring-ring ring-offset-1 ring-offset-background'
                                                        : ''
                                                "
                                                :style="{ backgroundColor: theme.swatch }"></button>
                                        </TooltipWrapper>
                                    </div>
                                </DropdownMenuLabel>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <span>{{ t('view.settings.appearance.appearance.table_density') }}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent side="right" align="start" class="w-54">
                                <DropdownMenuCheckboxItem
                                    :model-value="tableDensity === 'standard'"
                                    indicator-position="right"
                                    @select="emit('table-density-select', 'standard')">
                                    <span>{{
                                        t('view.settings.appearance.appearance.table_density_comfortable')
                                    }}</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    :model-value="tableDensity === 'comfortable'"
                                    indicator-position="right"
                                    @select="emit('table-density-select', 'comfortable')">
                                    <span>{{ t('view.settings.appearance.appearance.table_density_standard') }}</span>
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    :model-value="tableDensity === 'compact'"
                                    indicator-position="right"
                                    @select="emit('table-density-select', 'compact')">
                                    <span>{{ t('view.settings.appearance.appearance.table_density_compact') }}</span>
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem @click="emit('open-custom-nav')">
                            <span>{{ t('nav_menu.custom_nav.header') }}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" @click="emit('logout-click')">
                            <span>{{ t('dialog.user.actions.logout') }}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            <SidebarMenuItem>
                <SidebarMenuButton
                    :tooltip="isCollapsed ? t('nav_tooltip.expand_menu') : t('nav_tooltip.collapse_menu')"
                    @click="emit('toggle-nav-collapse')">
                    <i class="ri-side-bar-line inline-flex size-6 items-center justify-center text-[19px]" />
                    <span v-show="!isCollapsed">{{ t('nav_tooltip.collapse_menu') }}</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    </SidebarFooter>
</template>

<script setup>
    import { Heart } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { TooltipWrapper } from '@/components/ui/tooltip';
    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { SidebarFooter, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

    defineProps({
        isCollapsed: {
            type: Boolean,
            default: false
        },
        isDarkMode: {
            type: Boolean,
            default: false
        },
        hasPendingUpdate: {
            type: Boolean,
            default: false
        },
        hasPendingInstall: {
            type: Boolean,
            default: false
        },
        version: {
            type: String,
            default: '-'
        },
        vrcxLogo: {
            type: String,
            required: true
        },
        themes: {
            type: Array,
            default: () => []
        },
        themeMode: {
            type: String,
            default: 'system'
        },
        tableDensity: {
            type: String,
            default: 'standard'
        },
        themeColors: {
            type: Array,
            default: () => []
        },
        currentThemeColor: {
            type: String,
            default: ''
        },
        isApplyingThemeColor: {
            type: Boolean,
            default: false
        },
        themeDisplayName: {
            type: Function,
            required: true
        },
        themeColorDisplayName: {
            type: Function,
            required: true
        }
    });

    const emit = defineEmits([
        'show-whats-new',
        'support-link',
        'toggle-theme',
        'show-vrcx-update-dialog',
        'settings-click',
        'theme-select',
        'theme-color-select',
        'table-density-select',
        'open-custom-nav',
        'logout-click',
        'toggle-nav-collapse',
        'open-github'
    ]);
    const { t } = useI18n();
</script>
