<template>
    <Dialog :open="isInfoPushDialogVisible" @update:open="(open) => !open && closeDialog()">
        <DialogContent class="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.info_push.header') }}</DialogTitle>
            </DialogHeader>

            <div class="flex items-center gap-2">
                <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    :model-value="activeCategory"
                    @update:model-value="(value) => value && (activeCategory = value)">
                    <ToggleGroupItem v-for="category in categories" :key="category.name" :value="category.name">
                        {{ getCategoryLabel(category.name) }} ({{ category.count }})
                    </ToggleGroupItem>
                </ToggleGroup>
                <Button size="sm" variant="outline" class="ml-auto" :disabled="isLoading" @click="loadInfoPush">
                    <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
                </Button>
            </div>

            <div ref="listRef" class="max-h-[60vh] overflow-y-auto">
                <DataTableEmpty v-if="!filteredInfoPushes.length && !isLoading" type="nodata" />
                <div v-else-if="BANNER_CATEGORIES.includes(activeCategory)" class="space-y-4">
                    <div v-for="item in filteredInfoPushes" :id="`info-push-${item.id}`" :key="item.id">
                        <img
                            v-if="getImageUrl(item)"
                            :src="getImageUrl(item)"
                            :alt="getName(item)"
                            class="w-full cursor-pointer rounded"
                            loading="lazy"
                            @click="showFullscreenImageDialog(getImageUrl(item))" />
                        <div v-else class="text-sm font-medium" v-text="getName(item)"></div>
                        <div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <TooltipWrapper :content="getEndDateTooltip(item)" side="top">
                                <span>{{ formatDateFilter(item.startDate ?? item.createdAt, 'long') }}</span>
                            </TooltipWrapper>
                            <Button
                                v-if="getAction(item) && isLinkActionable(getAction(item))"
                                size="sm"
                                variant="outline"
                                class="ml-auto"
                                @click="runLink(getAction(item))">
                                {{ getLinkLabel(getAction(item)) }}
                            </Button>
                        </div>
                    </div>
                </div>
                <template v-else>
                    <div
                        v-for="item in filteredInfoPushes"
                        :id="`info-push-${item.id}`"
                        :key="item.id"
                        class="border-b py-2 last:border-b-0">
                        <div class="flex cursor-pointer gap-3" @click="toggleInSet(expandedIds, item.id)">
                            <img
                                v-if="getImageUrl(item)"
                                :src="getImageUrl(item)"
                                class="h-14 w-24 flex-none cursor-pointer rounded object-cover"
                                loading="lazy"
                                @click.stop="showFullscreenImageDialog(getImageUrl(item))" />
                            <div class="min-w-0 flex-1 text-sm">
                                <div class="flex items-center gap-2">
                                    <ChevronRight
                                        class="size-4 flex-none text-muted-foreground transition-transform"
                                        :class="{ 'rotate-90': expandedIds.has(item.id) }" />
                                    <span class="truncate font-medium" v-text="getName(item)"></span>
                                    <Badge v-if="getStatus(item)" variant="destructive" class="flex-none">
                                        {{ t(`dialog.info_push.${getStatus(item)}`) }}
                                    </Badge>
                                    <span class="ml-auto flex-none text-xs text-muted-foreground">
                                        {{ formatDateFilter(item.startDate ?? item.createdAt, 'long') }}
                                    </span>
                                </div>
                                <div
                                    v-if="getDescription(item)"
                                    class="text-xs text-muted-foreground"
                                    :class="{ 'line-clamp-2': !expandedIds.has(item.id) }"
                                    v-text="getDescription(item)"></div>
                                <div
                                    class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span v-if="item.endDate">
                                        {{ t('dialog.info_push.end_date') }}:
                                        {{ formatDateFilter(item.endDate, 'long') }}
                                    </span>
                                    <Badge
                                        v-for="tag in item.requireClientTags"
                                        :key="tag"
                                        variant="outline"
                                        class="text-xs">
                                        {{ tag }}
                                    </Badge>
                                    <template v-if="getAction(item)">
                                        <button
                                            v-if="isLinkActionable(getAction(item))"
                                            type="button"
                                            class="cursor-pointer text-primary hover:underline"
                                            @click.stop="runLink(getAction(item))">
                                            {{ getLinkLabel(getAction(item)) }}
                                        </button>
                                        <span v-else>{{ getAction(item).command }}</span>
                                    </template>
                                </div>
                            </div>
                        </div>

                        <div v-if="expandedIds.has(item.id)" class="mt-3 space-y-3 pl-7 text-sm">
                            <div v-if="getArticleBlocks(item).length" class="space-y-2">
                                <template v-for="(block, index) in getArticleBlocks(item)" :key="index">
                                    <img
                                        v-if="block.type === 'image'"
                                        :src="block.value"
                                        class="w-full max-w-lg cursor-pointer rounded"
                                        loading="lazy"
                                        @click="showFullscreenImageDialog(block.value)" />
                                    <Button
                                        v-else-if="block.type === 'video'"
                                        size="sm"
                                        variant="outline"
                                        @click="openExternalLink(block.value)">
                                        <Video class="size-4" />
                                        {{ t('dialog.info_push.open_video') }}
                                    </Button>
                                    <p
                                        v-else
                                        class="whitespace-pre-line"
                                        :class="{ 'text-base font-semibold': block.type === 'heading' }"
                                        v-text="block.value"></p>
                                </template>
                            </div>

                            <div v-if="item.data?.domainList?.length" class="flex flex-wrap items-center gap-1">
                                <span class="text-xs text-muted-foreground">{{ t('dialog.info_push.domains') }}:</span>
                                <Badge v-for="entry in item.data.domainList" :key="entry.domain" variant="outline">
                                    {{ entry.domain }}
                                </Badge>
                            </div>

                            <div v-if="getLinks(item).length" class="flex flex-wrap gap-2">
                                <Button
                                    v-for="link in getLinks(item)"
                                    :key="`${link.command}:${link.target}`"
                                    size="sm"
                                    variant="outline"
                                    :disabled="!isLinkActionable(link)"
                                    @click="runLink(link)">
                                    {{ getLinkLabel(link) }}
                                </Button>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { ChevronRight, RefreshCw, Video } from 'lucide-vue-next';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, nextTick, reactive, ref, watch } from 'vue';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
    import { useI18n } from 'vue-i18n';

    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';

    import { formatDateFilter, openExternalLink } from '../../../shared/utils';
    import { miscRequest } from '../../../api';
    import { useGalleryStore } from '../../../stores';

    const BANNER_CATEGORIES = ['quick-menu-banner', 'loading-screen-banners'];
    const CATEGORY_ORDER = ['help-article', ...BANNER_CATEGORIES];

    const props = defineProps({
        isInfoPushDialogVisible: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['close']);

    const { t } = useI18n();
    const { showFullscreenImageDialog } = useGalleryStore();

    const infoPushes = ref([]);
    const isLoading = ref(false);
    const activeCategory = ref(CATEGORY_ORDER[0]);
    const expandedIds = reactive(new Set());
    const listRef = ref(null);

    const itemsById = computed(() => new Map(infoPushes.value.map((item) => [item.id, item])));

    const categoryById = computed(() => new Map(infoPushes.value.map((item) => [item.id, getCategory(item)])));

    const categories = computed(() => {
        const counts = new Map();
        for (const category of categoryById.value.values()) {
            counts.set(category, (counts.get(category) ?? 0) + 1);
        }
        return [...counts]
            .map(([name, count]) => ({ name, count }))
            .sort(
                (a, b) =>
                    getCategoryRank(a.name) - getCategoryRank(b.name) ||
                    b.count - a.count ||
                    a.name.localeCompare(b.name)
            );
    });

    const filteredInfoPushes = computed(() =>
        infoPushes.value.filter((item) => categoryById.value.get(item.id) === activeCategory.value)
    );

    watch(
        () => props.isInfoPushDialogVisible,
        (visible) => {
            if (visible) {
                loadInfoPush();
            }
        }
    );

    function closeDialog() {
        emit('close');
    }

    async function loadInfoPush() {
        infoPushes.value = [];
        expandedIds.clear();
        isLoading.value = true;
        try {
            const { json } = await miscRequest.getInfoPush({
                require: 'user-all',
                include: ['help-article', 'quick-menu-banner', 'loading-screen-banners']
            });
            infoPushes.value = (json ?? []).toSorted((a, b) => getSortDate(b) - getSortDate(a));
            if (!categories.value.some((category) => category.name === activeCategory.value)) {
                activeCategory.value = categories.value[0]?.name ?? CATEGORY_ORDER[0];
            }
        } finally {
            isLoading.value = false;
        }
    }

    function getCategoryLabel(name) {
        return CATEGORY_ORDER.includes(name) ? t(`dialog.info_push.categories.${name}`) : name;
    }

    function getCategoryRank(name) {
        const index = CATEGORY_ORDER.indexOf(name);
        return index === -1 ? CATEGORY_ORDER.length : index;
    }

    function getSortDate(item) {
        return Date.parse(item.startDate ?? item.createdAt) || 0;
    }

    /**
     * @param {Set<string>} set
     * @param {string} id
     */
    function toggleInSet(set, id) {
        if (!set.delete(id)) {
            set.add(id);
        }
    }

    /**
     * @param {string | { fallback?: string } | undefined | null} value
     * @returns {string}
     */
    function localize(value) {
        if (typeof value === 'string') {
            return value;
        }
        return value?.fallback ?? '';
    }

    function getCategory(item) {
        return item.tags?.find((tag) => CATEGORY_ORDER.includes(tag)) ?? 'other';
    }

    function getName(item) {
        const data = item.data ?? {};
        return (
            localize(data.name) ||
            data.title ||
            localize(data.contentList?.name) ||
            data.finalName ||
            data.worldTag ||
            data.version ||
            item.id
        );
    }

    function getDescription(item) {
        const data = item.data ?? {};
        return (
            localize(data.description) ||
            data.subtitle ||
            localize(data.tooltipDescription) ||
            data.disclaimerText ||
            data.body ||
            data.search?.searchQuery ||
            data.authorName ||
            ''
        );
    }

    function getImageUrl(item) {
        const data = item.data ?? {};
        return data.imageUrl || data.thumbnailImageUrl || data.bannerImageUrl || data.iconImageUrl || '';
    }

    function getEndDateTooltip(item) {
        if (!item.endDate) {
            return undefined;
        }
        return `${t('dialog.info_push.end_date')}: ${formatDateFilter(item.endDate, 'long')}`;
    }

    function getStatus(item) {
        if (!item.isEnabled) {
            return 'disabled';
        }
        const now = Date.now();
        if (item.endDate && Date.parse(item.endDate) < now) {
            return 'expired';
        }
        if (item.startDate && Date.parse(item.startDate) > now) {
            return 'scheduled';
        }
        return '';
    }

    /**
     * @param {string} text
     * @returns {string}
     */
    function toPlainText(text) {
        return text
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .trim();
    }

    function getArticleBlocks(item) {
        const blocks = [];
        for (const content of item.data?.article?.content ?? []) {
            if (content.imageUrl) {
                blocks.push({ type: 'image', value: content.imageUrl });
            } else if (content.videoUrl) {
                blocks.push({ type: 'video', value: content.videoUrl });
            } else if (content.text) {
                const value = toPlainText(content.text);
                if (value) {
                    const isHeading = /^<size=[^>]+>\s*<b>/i.test(content.text.trim());
                    blocks.push({ type: isHeading ? 'heading' : 'text', value });
                }
            }
        }
        return blocks;
    }

    function toLink(source) {
        return {
            command: source.command,
            target: source.parameters?.[0] ?? '',
            name: source.name ?? ''
        };
    }

    function getAction(item) {
        const onPressed = item.data?.onPressed;
        return onPressed?.command ? toLink(onPressed) : null;
    }

    function getLinks(item) {
        const article = item.data?.article;
        const links = new Map();
        for (const source of [...(article?.moreInfoLinks ?? []), ...(article?.embeddedLinkData ?? [])]) {
            if (!source.command) {
                continue;
            }
            const link = toLink(source);
            const key = `${link.command}:${link.target}`;
            if (!links.has(key)) {
                links.set(key, link);
            }
        }
        return [...links.values()];
    }

    function isLinkActionable(link) {
        if (link.command === 'OpenURL') {
            return Boolean(link.target);
        }
        return link.command === 'OpenHelpArticle' && itemsById.value.has(link.target);
    }

    function getLinkLabel(link) {
        if (link.name) {
            return link.name;
        }
        if (link.command === 'OpenHelpArticle' && itemsById.value.has(link.target)) {
            return getName(itemsById.value.get(link.target));
        }
        if (link.command === 'OpenURL') {
            return t('dialog.info_push.open_link');
        }
        return link.command;
    }

    function runLink(link) {
        if (link.command === 'OpenURL') {
            openExternalLink(link.target);
        } else if (link.command === 'OpenHelpArticle') {
            showInfoPush(link.target);
        }
    }

    async function showInfoPush(id) {
        activeCategory.value = categoryById.value.get(id);
        expandedIds.add(id);
        await nextTick();
        listRef.value?.querySelector(`#info-push-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
</script>
