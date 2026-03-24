<template>
    <HoverCard :open="hoverOpen" :open-delay="700" :close-delay="100" @update:open="handleHoverOpen">
        <HoverCardTrigger as="div">
            <ContextMenu @update:open="handleContextMenuOpen">
                <ContextMenuTrigger as="div">
                    <div class="avatar-card-wrapper rounded-lg" @click="$emit('click')">
                        <Card
                            class="avatar-card x-hover-card flex flex-col gap-0 p-0 cursor-pointer overflow-hidden rounded-lg relative hover:bg-accent hover:shadow-sm"
                            :class="isActive ? 'x-highlight-ring' : 'border border-border/50'">
                            <div class="w-full aspect-5/2 overflow-hidden bg-muted relative">
                                <img
                                    v-if="avatar.thumbnailImageUrl && !imageLoadError"
                                    :src="avatar.thumbnailImageUrl"
                                    :alt="avatar.name"
                                    loading="lazy"
                                    decoding="async"
                                    fetchpriority="low"
                                    class="w-full h-full object-cover block"
                                    @error="imageLoadError = true" />
                                <div v-else class="w-full h-full grid place-items-center">
                                    <ImageIcon class="size-6 text-muted-foreground" />
                                </div>
                                <!-- Platform dots -->
                                <div
                                    v-if="platformInfo.isQuest || platformInfo.isIos"
                                    class="absolute top-1 right-1 flex -space-x-1">
                                    <span
                                        v-if="platformInfo.isPC"
                                        class="size-2.5 rounded-full border opacity-70 bg-platform-pc" />
                                    <span
                                        v-if="platformInfo.isQuest"
                                        class="size-2.5 rounded-full border opacity-70 bg-platform-quest" />
                                    <span
                                        v-if="platformInfo.isIos"
                                        class="size-2.5 rounded-full border opacity-70 bg-platform-ios" />
                                </div>
                            </div>
                            <div
                                class="min-h-0 flex flex-col gap-0.5"
                                :style="{ padding: `${Math.round(6 * cardScale)}px ${Math.round(8 * cardScale)}px` }">
                                <span
                                    class="block leading-snug overflow-hidden line-clamp-2 min-h-[2.75em]"
                                    :style="{ fontSize: `${Math.max(9, Math.round(18 * cardScale))}px` }">
                                    {{ avatar.name }}
                                </span>
                                <div
                                    v-if="avatar.$tags?.length"
                                    class="flex gap-0.5 overflow-hidden flex-nowrap"
                                    :style="{ maxHeight: `${Math.max(14, Math.round(22 * cardScale))}px` }">
                                    <Badge
                                        v-for="tagEntry in avatar.$tags"
                                        :key="tagEntry.tag"
                                        variant="outline"
                                        class="shrink-0 px-1 py-0 rounded-sm leading-tight"
                                        :style="{
                                            fontSize: `${Math.max(8, Math.round(14 * cardScale))}px`,
                                            borderColor: getTagColor(tagEntry.tag).bg,
                                            color: getTagColor(tagEntry.tag).text
                                        }">
                                        {{ tagEntry.tag }}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem @click="emit('context-action', 'details', avatar)">
                        <Eye class="size-4" />
                        {{ t('dialog.avatar.actions.view_details') }}
                    </ContextMenuItem>
                    <ContextMenuItem :disabled="isActive" @click="emit('context-action', 'wear', avatar)">
                        <Check class="size-4" />
                        {{ t('view.favorite.select_avatar_tooltip') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem @click="emit('context-action', 'manageTags', avatar)">
                        <Tag class="size-4" />
                        {{ t('dialog.avatar.actions.manage_tags') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                        @click="
                            emit(
                                'context-action',
                                avatar.releaseStatus === 'public' ? 'makePrivate' : 'makePublic',
                                avatar
                            )
                        ">
                        <User class="size-4" />
                        {{
                            avatar.releaseStatus === 'public'
                                ? t('dialog.avatar.actions.make_private')
                                : t('dialog.avatar.actions.make_public')
                        }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="emit('context-action', 'rename', avatar)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.rename') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="emit('context-action', 'changeDescription', avatar)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.change_description') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="emit('context-action', 'changeTags', avatar)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.change_content_tags') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="emit('context-action', 'changeStyles', avatar)">
                        <Pencil class="size-4" />
                        {{ t('dialog.avatar.actions.change_styles_author_tags') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="emit('context-action', 'changeImage', avatar)">
                        <ImageIcon class="size-4" />
                        {{ t('dialog.avatar.actions.change_image') }}
                    </ContextMenuItem>
                    <ContextMenuItem @click="emit('context-action', 'createImpostor', avatar)">
                        <RefreshCw class="size-4" />
                        {{ t('dialog.avatar.actions.create_impostor') }}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </HoverCardTrigger>
        <HoverCardContent class="w-80 p-3 text-sm" side="right" :side-offset="8" align="start">
            <div class="flex flex-col gap-2">
                <!-- Name -->
                <div class="flex items-start gap-1">
                    <div class="font-medium text-base truncate flex-1 min-w-0">{{ avatar.name }}</div>
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="shrink-0 size-6 rounded-full"
                        @click="emit('context-action', 'details', avatar)">
                        <ExternalLink class="size-3" />
                    </Button>
                </div>

                <!-- Tags -->
                <div v-if="avatar.$tags?.length" class="flex flex-wrap gap-1">
                    <Badge
                        v-for="tagEntry in avatar.$tags"
                        :key="tagEntry.tag"
                        variant="outline"
                        class="text-xs px-1.5 py-0"
                        :style="{
                            borderColor: getTagColor(tagEntry.tag).bg,
                            color: getTagColor(tagEntry.tag).text
                        }">
                        {{ tagEntry.tag }}
                    </Badge>
                </div>

                <Separator />

                <!-- Info rows -->
                <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <span class="text-muted-foreground">{{ t('dialog.avatar.info.visibility') }}</span>
                    <span>
                        <Badge variant="outline" class="text-xs px-1.5 py-0">
                            {{
                                avatar.releaseStatus === 'public'
                                    ? t('dialog.avatar.tags.public')
                                    : t('dialog.avatar.tags.private')
                            }}
                        </Badge>
                    </span>

                    <span class="text-muted-foreground">{{ t('dialog.avatar.info.platform') }}</span>
                    <div class="flex items-center gap-1">
                        <Badge v-if="platformInfo.isPC" class="text-platform-pc border-platform-pc!" variant="outline">
                            <Monitor class="h-3 w-3" />
                        </Badge>
                        <Badge
                            v-if="platformInfo.isQuest"
                            class="text-platform-quest border-platform-quest!"
                            variant="outline">
                            <Smartphone class="h-3 w-3" />
                        </Badge>
                        <Badge
                            v-if="platformInfo.isIos"
                            class="text-platform-ios border-platform-ios"
                            variant="outline">
                            <Apple class="h-3 w-3" />
                        </Badge>
                    </div>

                    <template v-if="pcPerf">
                        <span class="text-muted-foreground">{{ t('dialog.avatar.info.pc_performance') }}</span>
                        <span>{{ pcPerf }}</span>
                    </template>

                    <template v-if="androidPerf">
                        <span class="text-muted-foreground">{{ t('dialog.avatar.info.android_performance') }}</span>
                        <span>{{ androidPerf }}</span>
                    </template>

                    <template v-if="iosPerf">
                        <span class="text-muted-foreground">{{ t('dialog.avatar.info.ios_performance') }}</span>
                        <span>{{ iosPerf }}</span>
                    </template>

                    <span class="text-muted-foreground">{{ t('dialog.avatar.info.version') }}</span>
                    <span>{{ avatar.version ?? '-' }}</span>

                    <template v-if="avatar.$timeSpent">
                        <span class="text-muted-foreground">{{ t('dialog.avatar.info.time_spent') }}</span>
                        <span>{{ timeToText(avatar.$timeSpent) }}</span>
                    </template>

                    <span class="text-muted-foreground">{{ t('dialog.avatar.info.last_updated') }}</span>
                    <span>{{ formatDateFilter(avatar.updated_at, 'long') }}</span>

                    <span class="text-muted-foreground">{{ t('dialog.avatar.info.created_at') }}</span>
                    <span>{{ formatDateFilter(avatar.created_at, 'long') }}</span>
                </div>
            </div>
        </HoverCardContent>
    </HoverCard>
</template>

<script setup>
    import {
        Apple,
        Check,
        ExternalLink,
        Eye,
        Image as ImageIcon,
        Monitor,
        Pencil,
        RefreshCw,
        Smartphone,
        Tag,
        User
    } from 'lucide-vue-next';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import { formatDateFilter, getAvailablePlatforms, getPlatformInfo, timeToText } from '@/shared/utils';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { computed, ref } from 'vue';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import { Separator } from '@/components/ui/separator';
    import { getTagColor } from '@/shared/constants';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();

    const hoverOpen = ref(false);
    const contextMenuOpen = ref(false);
    const imageLoadError = ref(false);

    const handleContextMenuOpen = (open) => {
        contextMenuOpen.value = open;
        if (open) {
            hoverOpen.value = false;
        }
    };

    const handleHoverOpen = (open) => {
        if (contextMenuOpen.value) {
            return;
        }
        hoverOpen.value = open;
    };

    const props = defineProps({
        avatar: {
            type: Object,
            required: true
        },
        currentAvatarId: {
            type: String,
            default: ''
        },
        cardScale: {
            type: Number,
            default: 0.6
        }
    });

    const emit = defineEmits(['click', 'context-action']);

    const isActive = computed(() => props.avatar.id === props.currentAvatarId);

    const platformInfo = computed(() => getAvailablePlatforms(props.avatar.unityPackages));

    const perfInfo = computed(() => getPlatformInfo(props.avatar.unityPackages));
    const pcPerf = computed(() => perfInfo.value?.pc?.performanceRating ?? '');
    const androidPerf = computed(() => perfInfo.value?.android?.performanceRating ?? '');
    const iosPerf = computed(() => perfInfo.value?.ios?.performanceRating ?? '');
</script>

<style scoped>
    .avatar-card img {
        filter: saturate(0.8) contrast(0.8);
        transition: filter 0.2s ease;
    }

    .avatar-card:hover img {
        filter: saturate(1) contrast(1);
    }
</style>
