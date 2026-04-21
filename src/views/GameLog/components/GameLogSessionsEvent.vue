<template>
    <div class="py-0.5">
        <!-- Aggregated session join group -->
        <template v-if="event.type === 'JoinGroup'">
            <Collapsible v-model:open="isExpanded">
                <CollapsibleTrigger as-child>
                    <button
                        type="button"
                        class="flex items-center gap-1.5 px-2 py-0.5 rounded w-full text-left text-[0.8125rem] min-h-7 hover:bg-muted/50 border-none bg-transparent text-muted-foreground cursor-pointer">
                        <span class="shrink-0 min-w-22 text-muted-foreground text-[0.75rem] tabular-nums">
                            {{ formatTime(event.created_at) }}
                        </span>
                        <div class="min-w-28 shrink-0">
                            <Badge variant="outline" class="justify-center text-muted-foreground">
                                {{ t('view.game_log.filters.OnPlayerJoined') }}
                            </Badge>
                        </div>
                        <span class="flex-1 font-medium">
                            {{ t('view.game_log.sessions.players_joined', { count: event.count }) }}
                        </span>
                        <ChevronRight
                            class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150"
                            :class="{ 'rotate-90': isExpanded }" />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div class="pl-20 py-0.5 pb-1">
                        <div
                            v-for="(member, idx) in event.members"
                            :key="idx"
                            class="px-2 py-px text-[0.8125rem] rounded hover:bg-muted/30 flex items-center gap-1">
                            <span class="cursor-pointer" @click="lookupUser(member)">
                                {{ member.displayName }}
                            </span>
                            <span v-if="member.isFriend">{{ member.isFavorite ? '⭐' : '💚' }}</span>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </template>

        <!-- Aggregated session leave group -->
        <template v-else-if="event.type === 'LeftGroup'">
            <Collapsible v-model:open="isExpanded">
                <CollapsibleTrigger as-child>
                    <button
                        type="button"
                        class="flex items-center gap-1.5 px-2 py-0.5 rounded w-full text-left text-[0.8125rem] min-h-7 hover:bg-muted/50 border-none bg-transparent text-muted-foreground cursor-pointer">
                        <span class="shrink-0 min-w-22 text-muted-foreground text-[0.75rem] tabular-nums">
                            {{ formatTime(event.created_at) }}
                        </span>
                        <div class="min-w-28 shrink-0">
                            <Badge variant="outline" class="justify-center text-muted-foreground">
                                {{ t('view.game_log.filters.OnPlayerLeft') }}
                            </Badge>
                        </div>
                        <span class="flex-1 font-medium">
                            {{ t('view.game_log.sessions.players_left', { count: event.count }) }}
                        </span>
                        <ChevronRight
                            class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150"
                            :class="{ 'rotate-90': isExpanded }" />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div class="pl-20 py-0.5 pb-1">
                        <div
                            v-for="(member, idx) in event.members"
                            :key="idx"
                            class="px-2 py-px text-[0.8125rem] text-muted-foreground rounded hover:bg-muted/30 flex items-center gap-1">
                            <span class="cursor-pointer" @click="lookupUser(member)">
                                {{ member.displayName }}
                            </span>
                            <span v-if="member.isFriend">{{ member.isFavorite ? '⭐' : '💚' }}</span>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </template>

        <!-- Single session join -->
        <template v-else-if="event.type === 'OnPlayerJoined'">
            <div class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.8125rem] min-h-7 hover:bg-muted/50">
                <span class="shrink-0 min-w-22 text-muted-foreground text-[0.75rem] tabular-nums">
                    {{ formatTime(event.created_at) }}
                </span>
                <div class="min-w-28 shrink-0">
                    <Badge variant="outline" class="justify-center text-muted-foreground">
                        {{ t('view.game_log.filters.OnPlayerJoined') }}
                    </Badge>
                </div>
                <span class="flex-1 min-w-0 flex items-center gap-1 truncate cursor-pointer" @click="lookupUser(event)">
                    <LogIn class="shrink-0 text-xs" />
                    {{ event.displayName
                    }}<span v-if="event.isFriend" class="ml-1"> {{ event.isFavorite ? '⭐' : '💚' }}</span>
                </span>
            </div>
        </template>

        <!-- Single session leave -->
        <template v-else-if="event.type === 'OnPlayerLeft'">
            <div
                class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.8125rem] min-h-7 hover:bg-muted/50 text-muted-foreground">
                <span class="shrink-0 min-w-22 text-muted-foreground text-[0.75rem] tabular-nums">
                    {{ formatTime(event.created_at) }}
                </span>
                <div class="min-w-28 shrink-0">
                    <Badge variant="outline" class="justify-center text-muted-foreground">
                        {{ t('view.game_log.filters.OnPlayerLeft') }}
                    </Badge>
                </div>
                <span class="flex-1 min-w-0 flex items-center gap-1 truncate cursor-pointer" @click="lookupUser(event)">
                    <LogOut class="shrink-0 text-xs" />
                    {{ event.displayName
                    }}<span v-if="event.isFriend" class="ml-1"> {{ event.isFavorite ? '⭐' : '💚' }}</span>
                </span>
            </div>
        </template>

        <!-- Session video play -->
        <template v-else-if="event.type === 'VideoPlay'">
            <ContextMenu>
                <ContextMenuTrigger as-child>
                    <div
                        class="flex items-center gap-1.5 px-2 py-0.5 rounded text-[0.8125rem] min-h-7 hover:bg-muted/50 cursor-default">
                        <span class="shrink-0 min-w-22 text-muted-foreground text-[0.75rem] tabular-nums">
                            {{ formatTime(event.created_at) }}
                        </span>
                        <div class="min-w-28 shrink-0">
                            <Badge variant="outline" class="justify-center text-muted-foreground">
                                {{ t('view.game_log.filters.VideoPlay') }}
                            </Badge>
                        </div>
                        <span class="flex-1 min-w-0 flex items-center gap-1 truncate">
                            <Play class="shrink-0 text-xs" />
                            <span
                                v-if="showLink"
                                class="truncate cursor-pointer"
                                @click="openExternalLink(event.videoUrl)">
                                {{ videoLabel }}
                            </span>
                            <span v-else class="truncate">{{ videoLabel }}</span>
                            <Badge
                                v-if="event.playCount > 1"
                                variant="secondary"
                                class="shrink-0 text-[0.625rem] h-4 px-1">
                                {{ t('view.game_log.sessions.play_count', { count: event.playCount }) }}
                            </Badge>
                        </span>
                        <span v-if="event.displayName" class="shrink-0 text-muted-foreground text-[0.75rem]">
                            {{ event.displayName }}
                        </span>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    <ContextMenuItem v-if="showLink" @click="openExternalLink(event.videoUrl)">
                        <ExternalLink class="size-4" />
                        {{ t('common.actions.open_link') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator v-if="showLink" />
                    <ContextMenuItem @click="copyToClipboard(event.videoUrl)">
                        <Copy class="size-4" />
                        {{ t('common.actions.copy') }}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </template>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { ChevronRight, Copy, ExternalLink, Play, LogIn, LogOut } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { Badge } from '../../../components/ui/badge';
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../../components/ui/collapsible';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '../../../components/ui/context-menu';
    import { copyToClipboard, formatDateFilter, openExternalLink } from '../../../shared/utils';
    import { lookupUser } from '../../../coordinators/userCoordinator';

    const { t } = useI18n();

    const props = defineProps({
        event: {
            type: Object,
            required: true
        }
    });

    const isExpanded = ref(false);

    const showLink = computed(() => {
        if (props.event.type !== 'VideoPlay') return false;
        return props.event.videoId !== 'LSMedia' && props.event.videoId !== 'PopcornPalace';
    });

    const videoLabel = computed(() => {
        if (props.event.type !== 'VideoPlay') return '';
        return props.event.videoName || props.event.videoUrl;
    });

    function formatTime(dateStr) {
        return formatDateFilter(dateStr, 'short');
    }
</script>
