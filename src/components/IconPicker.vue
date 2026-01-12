<template>
    <Popover v-model:open="visible">
        <PopoverTrigger asChild>
            <Button>
                {{ t('nav_menu.icon_picker.pick_icon') }}
            </Button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" class="w-155">
            <div class="icon-picker">
                <InputGroupSearch
                    v-model="search"
                    class="icon-picker__search"
                    :placeholder="t('nav_menu.icon_picker.search_placeholder')" />
                <el-scrollbar v-if="filteredCategories.length" height="600px" class="icon-picker__scroll">
                    <div v-for="category in filteredCategories" :key="category.name" class="icon-picker__category">
                        <div class="icon-picker__category-title">
                            {{ category.name }}
                        </div>
                        <div class="icon-picker__grid">
                            <div v-for="group in category.groups" :key="group.id" class="icon-picker__group">
                                <div class="icon-picker__group-label">
                                    {{ group.label }}
                                </div>
                                <div class="icon-picker__variants">
                                    <button
                                        v-for="variant in group.variants"
                                        :key="variant.className"
                                        type="button"
                                        class="icon-picker__variant"
                                        :class="{ 'is-active': variant.className === modelValue }"
                                        :title="group.tooltip"
                                        @click="handleSelect(variant.className)">
                                        <i :class="[variant.className, 'ri-2x']"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-scrollbar>
                <div v-else class="icon-picker__empty">{{ t('nav_menu.icon_picker.no_icon_found') }}</div>
            </div>
        </PopoverContent>
    </Popover>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupSearch } from '@/components/ui/input-group';
    import { useI18n } from 'vue-i18n';

    import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

    import remixIconTags from '../shared/constants/remixIconTags.json';

    const { t } = useI18n();

    defineProps({
        modelValue: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['update:modelValue']);

    const visible = ref(false);
    const search = ref('');

    const parseTags = (tagsText) =>
        typeof tagsText === 'string'
            ? tagsText
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
            : [];

    const formatLabel = (baseName) =>
        baseName
            .split('-')
            .filter(Boolean)
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' ');

    const createGroup = (categoryName, baseName, tagsText) => {
        const normalizedTags = parseTags(tagsText);
        const label = formatLabel(baseName);
        const variants = ['line', 'fill'].map((variant) => ({
            className: `ri-${baseName}-${variant}`,
            variant
        }));
        const searchText = [
            baseName,
            label,
            ...baseName.split('-'),
            ...normalizedTags,
            ...variants.map((variant) => variant.className),
            'line',
            'fill'
        ]
            .join(' ')
            .toLowerCase();

        return {
            id: `${categoryName}-${baseName}`,
            label,
            tooltip: normalizedTags.length ? `${label} • ${normalizedTags.join(', ')}` : label,
            variants,
            searchable: searchText
        };
    };

    const categories = computed(() =>
        Object.entries(remixIconTags)
            .filter(([key]) => key !== '_comment')
            .map(([name, icons]) => ({
                name,
                groups: Object.entries(icons || {}).map(([baseName, tags]) => createGroup(name, baseName, tags))
            }))
    );

    const filteredCategories = computed(() => {
        const query = search.value.trim().toLowerCase();
        if (!query) {
            return categories.value;
        }
        return categories.value
            .map((category) => ({
                name: category.name,
                groups: category.groups.filter((group) => group.searchable.includes(query))
            }))
            .filter((category) => category.groups.length > 0);
    });

    const handleSelect = (className) => {
        emit('update:modelValue', className);
        visible.value = false;
    };

    watch(visible, (nextVisible) => {
        if (!nextVisible) {
            search.value = '';
        }
    });
</script>

<style scoped>
    .icon-picker__trigger i {
        font-size: 16px;
    }

    .icon-picker {
        display: flex;
        flex-direction: column;
        gap: 8px;
        height: 600px;
        width: 100%;
    }

    .icon-picker__search {
        flex-shrink: 0;
    }

    .icon-picker__scroll {
        padding-right: 6px;
    }

    .icon-picker__category {
        margin-bottom: 12px;
    }

    .icon-picker__category-title {
        font-weight: 600;
        margin-bottom: 6px;
    }

    .icon-picker__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
    }

    .icon-picker__group {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px 4px;
        align-items: center;
    }

    .icon-picker__group-label {
        font-size: 12px;
        font-weight: 600;
        text-align: center;
        color: var(--el-text-color-primary);
    }

    .icon-picker__variants {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: center;
    }

    .icon-picker__variant {
        border: 1px solid transparent;
        background: transparent;
        cursor: pointer;
        width: 84px;
        height: 84px;
        border-radius: 10px;
        color: var(--el-text-color-regular);
        transition:
            color 0.2s ease,
            background 0.2s ease,
            transform 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .icon-picker__variant i {
        color: inherit;
    }

    .icon-picker__variant:hover {
        border-color: var(--el-color-primary);
        background: var(--el-fill-color-light);
        transform: translateY(-1px);
    }

    .icon-picker__variant.is-active {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary);
    }

    .icon-picker__empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }
</style>
