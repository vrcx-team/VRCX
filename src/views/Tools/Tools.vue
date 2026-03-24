<template>
    <div id="chart" class="x-container">
        <div class="options-container">
            <span class="header">{{ t('view.tools.header') }}</span>

            <div class="mt-5 px-5">
                <div
                    v-for="category in categories"
                    :key="category.key"
                    class="mb-6">
                    <div
                        class="cursor-pointer flex items-center p-2 px-3 rounded-lg mb-3 transition-all duration-200 ease-in-out"
                        @click="toggleCategory(category.key)">
                        <i
                            class="ri-arrow-down-s-line mr-2 text-sm transition-transform duration-300"
                            :class="{ '-rotate-90': categoryCollapsed[category.key] }" />
                        <span class="ml-1.5 text-base font-semibold">
                            {{ t(category.labelKey) }}
                        </span>
                    </div>

                    <div
                        class="grid grid-cols-2 gap-4 ml-4"
                        v-show="!categoryCollapsed[category.key]">
                        <ToolItem
                            v-for="tool in category.tools"
                            :key="tool.key"
                            :icon="tool.navIcon"
                            :title="t(tool.titleKey)"
                            :description="t(tool.descriptionKey)"
                            @click="triggerTool(tool)">
                            <template #actions>
                                <TooltipWrapper
                                    v-if="
                                        tool.navEligible &&
                                        pinnedToolKeys.has(tool.key)
                                    "
                                    side="top"
                                    :content="
                                        t('nav_menu.custom_nav.unpin_from_nav')
                                    ">
                                    <Button
                                        size="icon-xs"
                                        variant="secondary"
                                        class="opacity-0 transition-opacity group-hover:opacity-100"
                                        :title="
                                            t(
                                                'nav_menu.custom_nav.unpin_from_nav'
                                            )
                                        "
                                        :aria-label="
                                            t(
                                                'nav_menu.custom_nav.unpin_from_nav'
                                            )
                                        "
                                        @click.stop="unpinToolFromNav(tool.key)">
                                        <span class="relative inline-flex size-4">
                                            <i
                                                class="ri-side-bar-line inline-flex size-4 items-center justify-center text-base" />
                                            <span
                                                class="absolute -right-1 -top-1 grid size-2.5 place-items-center rounded-full bg-background shadow-sm">
                                                <i
                                                    class="ri-subtract-line inline-flex size-2 items-center justify-center text-[10px]" />
                                            </span>
                                        </span>
                                    </Button>
                                </TooltipWrapper>

                                <TooltipWrapper
                                    v-else-if="tool.navEligible"
                                    side="top"
                                    :content="t('nav_menu.custom_nav.pin_to_nav')">
                                    <Button
                                        size="icon-xs"
                                        variant="ghost"
                                        class="opacity-0 transition-opacity group-hover:opacity-100"
                                        :title="
                                            t('nav_menu.custom_nav.pin_to_nav')
                                        "
                                        :aria-label="
                                            t('nav_menu.custom_nav.pin_to_nav')
                                        "
                                        @click.stop="pinToolToNav(tool.key)">
                                        <span class="relative inline-flex size-4">
                                            <i
                                                class="ri-side-bar-line inline-flex size-4 items-center justify-center text-base" />
                                            <span
                                                class="absolute -right-1 -top-1 grid size-2.5 place-items-center rounded-full bg-background shadow-sm">
                                                <i
                                                    class="ri-add-line inline-flex size-2 items-center justify-center text-[10px]" />
                                            </span>
                                        </span>
                                    </Button>
                                </TooltipWrapper>
                            </template>
                        </ToolItem>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Button } from '@/components/ui/button';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import ToolItem from './components/ToolItem.vue';
    import { useToolActions } from '../../composables/useToolActions';
    import { useToolNavPinning } from '../../composables/useToolNavPinning';
    import {
        getToolsByCategory,
        toolCategories
    } from '../../shared/constants';
    import configRepository from '../../services/config.js';

    const { t } = useI18n();
    const { triggerTool } = useToolActions();
    const {
        pinToolToNav,
        pinnedToolKeys,
        refreshPinnedState,
        unpinToolFromNav
    } =
        useToolNavPinning();
    const toolsCategoryCollapsedConfigKey = 'VRCX_toolsCategoryCollapsed';

    const categories = toolCategories.map((category) => ({
        ...category,
        tools: getToolsByCategory(category.key)
    }));

    const categoryCollapsed = ref({
        group: false,
        image: false,
        shortcuts: false,
        system: false,
        user: false,
        other: false
    });

    const toggleCategory = (category) => {
        categoryCollapsed.value[category] = !categoryCollapsed.value[category];
        configRepository.setString(
            toolsCategoryCollapsedConfigKey,
            JSON.stringify(categoryCollapsed.value)
        );
    };

    onMounted(async () => {
        await refreshPinnedState();
        const storedValue = await configRepository.getString(
            toolsCategoryCollapsedConfigKey,
            '{}'
        );
        try {
            const parsed = JSON.parse(storedValue);
            categoryCollapsed.value = {
                ...categoryCollapsed.value,
                ...parsed
            };
        } catch {
            // ignore invalid stored value and keep defaults
        }
    });
</script>
