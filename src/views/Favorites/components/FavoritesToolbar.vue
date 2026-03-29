<template>
    <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
            <Select :model-value="sortValue" @update:modelValue="$emit('update:sortValue', $event)">
                <SelectTrigger size="sm" class="min-w-[200px]">
                    <span class="flex items-center gap-2">
                        <ArrowUpDown class="h-4 w-4" />
                        <SelectValue :placeholder="t('view.settings.appearance.appearance.sort_favorite_by_name')" />
                    </span>
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem
                            value="name"
                            :text-value="t('view.settings.appearance.appearance.sort_favorite_by_name')">
                            {{ t('view.settings.appearance.appearance.sort_favorite_by_name') }}
                        </SelectItem>
                        <SelectItem
                            value="date"
                            :text-value="t('view.settings.appearance.appearance.sort_favorite_by_date')">
                            {{ t('view.settings.appearance.appearance.sort_favorite_by_date') }}
                        </SelectItem>
                        <SelectItem
                            v-for="option in extraSortOptions"
                            :key="option.value"
                            :value="option.value"
                            :text-value="option.label">
                            {{ option.label }}
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
        <div class="flex items-center gap-2 flex-1">
            <InputGroupSearch
                :model-value="searchQuery"
                class="flex-1"
                :placeholder="searchPlaceholder"
                @update:modelValue="$emit('update:searchQuery', $event)"
                @input="$emit('search')">
                <template v-if="searchModeVisible" #trailing>
                    <ToggleGroup
                        type="single"
                        :model-value="searchMode"
                        variant="outline"
                        size="xs"
                        class="mr-0.5"
                        @update:modelValue="$emit('update:searchMode', $event)">
                        <ToggleGroupItem value="name" class="h-5! px-1.5! text-[11px]">
                            {{ t('view.favorite.worlds.search_mode_name') }}
                        </ToggleGroupItem>
                        <ToggleGroupItem value="tag" class="h-5! px-1.5! text-[11px]">
                            {{ t('view.favorite.worlds.search_mode_tag') }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </template>
            </InputGroupSearch>
            <DropdownMenu :open="toolbarMenuOpen" @update:open="$emit('update:toolbarMenuOpen', $event)">
                <DropdownMenuTrigger as-child>
                    <Button class="rounded-full" size="icon-sm" variant="ghost"><Ellipsis /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="p-2">
                    <li class="list-none px-4 pt-3 pb-2 min-w-[220px] cursor-default" @click.stop>
                        <div class="flex items-center justify-between text-[13px] font-semibold mb-2">
                            <span>{{ t('view.friends_locations.scale') }}</span>
                            <span class="text-xs">{{ cardScalePercent }}%</span>
                        </div>
                        <Slider
                            :model-value="cardScaleValue"
                            class="px-1 pb-1"
                            :min="cardScaleSlider.min"
                            :max="cardScaleSlider.max"
                            :step="cardScaleSlider.step"
                            @update:modelValue="$emit('update:cardScaleValue', $event)" />
                    </li>
                    <li class="list-none px-4 pt-3 pb-2 min-w-[220px] cursor-default" @click.stop>
                        <div class="flex items-center justify-between text-[13px] font-semibold mb-2">
                            <span>{{ t('view.friends_locations.spacing') }}</span>
                            <span class="text-xs"> {{ cardSpacingPercent }}% </span>
                        </div>
                        <Slider
                            :model-value="cardSpacingValue"
                            class="px-1 pb-1"
                            :min="cardSpacingSlider.min"
                            :max="cardSpacingSlider.max"
                            :step="cardSpacingSlider.step"
                            @update:modelValue="$emit('update:cardSpacingValue', $event)" />
                    </li>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="$emit('import')">
                        {{ t('view.favorite.import') }}
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="$emit('export')">
                        {{ t('view.favorite.export') }}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
    import { ArrowUpDown, Ellipsis } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { InputGroupSearch } from '@/components/ui/input-group';
    import { Slider } from '@/components/ui/slider';
    import { useI18n } from 'vue-i18n';

    defineProps({
        sortValue: { type: String, default: 'name' },
        extraSortOptions: { type: Array, default: () => [] },
        searchQuery: { type: String, default: '' },
        searchPlaceholder: { type: String, default: '' },
        searchMode: { type: String, default: 'name' },
        searchModeVisible: { type: Boolean, default: false },
        toolbarMenuOpen: { type: Boolean, default: false },
        cardScaleValue: { type: Array, default: () => [50] },
        cardScalePercent: { type: Number, default: 100 },
        cardScaleSlider: { type: Object, default: () => ({ min: 0, max: 100, step: 1 }) },
        cardSpacingValue: { type: Array, default: () => [50] },
        cardSpacingPercent: { type: Number, default: 100 },
        cardSpacingSlider: { type: Object, default: () => ({ min: 0, max: 100, step: 1 }) }
    });

    defineEmits([
        'update:sortValue',
        'update:searchQuery',
        'update:searchMode',
        'update:toolbarMenuOpen',
        'update:cardScaleValue',
        'update:cardSpacingValue',
        'search',
        'import',
        'export'
    ]);

    const { t } = useI18n();
</script>
