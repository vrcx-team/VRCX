<template>
    <Popover :open="eventPopoverOpen">
        <PopoverTrigger as-child>
            <Card
                class="event-card x-hover-card p-0 gap-0 hover:bg-accent hover:shadow-sm"
                :class="cardClass"
                @mouseenter="openEventPopover"
                @mouseleave="scheduleCloseEventPopover">
                <img
                    v-if="!bannerError"
                    :src="bannerUrl"
                    @click="showFullscreenImageDialog(bannerUrl)"
                    @error="bannerError = true"
                    class="banner" />
                <div v-else class="banner flex items-center justify-center bg-muted">
                    <Image class="size-6 text-muted-foreground" />
                </div>
                <div class="event-content">
                    <div class="event-title">
                        <div v-if="showGroupName" class="event-group-name" @click="onGroupClick">
                            {{ groupName }}
                        </div>
                        <div class="event-title-content" @click="onGroupClick">
                            <TooltipWrapper
                                v-if="event.seriesId"
                                :content="t('dialog.group_calendar.event_card.repeating_event_tooltip')">
                                <Repeat class="size-4! inline" />
                            </TooltipWrapper>
                            {{ event.title }}
                        </div>
                    </div>
                    <div class="event-info">
                        <div :class="timeClass">
                            {{ formattedTime }}
                        </div>
                        <div>
                            {{ capitalizeFirst(event.accessType) }}
                        </div>
                    </div>
                </div>
                <div class="badges">
                    <Button
                        v-if="canManageEvent"
                        @click="editEvent(event)"
                        size="icon"
                        variant="secondary"
                        class="rounded-full badge">
                        <Pencil />
                    </Button>
                    <Button @click="copyEventLink(event)" size="icon" variant="secondary" class="rounded-full badge">
                        <Share2 />
                    </Button>
                    <Button
                        @click="toggleEventFollow(event)"
                        size="icon"
                        :variant="isFollowing ? 'default' : 'secondary'"
                        class="rounded-full badge">
                        <Star fill="currentColor" v-if="isFollowing" />
                        <Star v-else />
                    </Button>
                </div>
            </Card>
        </PopoverTrigger>
        <PopoverContent
            side="right"
            align="start"
            class="w-125 p-3"
            @mouseenter="openEventPopover"
            @mouseleave="scheduleCloseEventPopover">
            <GroupCalendarEventDetails :event="event" />
        </PopoverContent>
    </Popover>
</template>

<script setup>
    import { Image, Pencil, Repeat, Share2, Star } from 'lucide-vue-next';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useGroupStore } from '../../../stores';
    import { formatDateFilter, hasGroupPermission } from '../../../shared/utils';
    import { groupRequest, queryRequest } from '../../../api';
    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';
    import GroupCalendarEventDetails from './GroupCalendarEventDetails.vue';

    const { showFullscreenImageDialog } = useGalleryStore();

    const { t } = useI18n();
    const groupStore = useGroupStore();
    const { cachedGroups } = groupStore;

    const props = defineProps({
        event: {
            type: Object,
            required: true
        },
        groupRef: {
            type: Object,
            default: null
        },
        mode: {
            type: String,
            required: true,
            // @ts-ignore
            validator: (value) => ['timeline', 'grid'].includes(value)
        },
        isFollowing: {
            type: Boolean,
            default: false
        },
        cardClass: {
            type: [String, Object, Array],
            default: ''
        }
    });

    const emit = defineEmits(['update-following-calendar-data', 'click-action']);

    const showGroupName = computed(() => props.mode === 'timeline');
    const canManageEvent = computed(() =>
        hasGroupPermission(props.groupRef ?? cachedGroups.get(props.event.ownerId), 'group-calendar-manage')
    );

    const timeClass = computed(() => (props.mode === 'grid' ? 'event-time' : ''));
    const eventPopoverOpen = ref(false);
    let eventPopoverCloseTimer = null;

    const bannerUrl = computed(() => {
        if (!props.event) return '';
        if (props.event.imageUrl) {
            return props.event.imageUrl;
        } else {
            return cachedGroups.get(props.event.ownerId)?.bannerUrl || '';
        }
    });

    const bannerError = ref(false);

    async function editEvent(event) {
        let group = props.groupRef;
        if (!group) {
            try {
                const args = await queryRequest.fetch('group.dialog', {
                    groupId: event.ownerId
                });
                group = args.ref;
            } catch (error) {
                console.error('Failed to load group event for editing:', error);
                toast.error(t('dialog.group_event_edit.load_error'));
                return;
            }
        }
        groupStore.showEditGroupEventDialog(event, group);
    }

    const groupName = computed(() => {
        if (!props.event) return '';
        return cachedGroups.get(props.event.ownerId)?.name || '';
    });

    const formattedTime = computed(() => {
        if (props.mode === 'timeline') {
            return formatTimeRange(props.event.startsAt, props.event.endsAt);
        } else {
            return `${formatDateFilter(props.event.startsAt, 'short')} - ${formatDateFilter(props.event.endsAt, 'short')}`;
        }
    });

    /**
     * @param event
     */
    async function toggleEventFollow(event) {
        const args = await groupRequest.followGroupEvent({
            groupId: event.ownerId,
            eventId: event.id,
            isFollowing: !props.isFollowing
        });
        emit('update-following-calendar-data', args.json);
    }

    /**
     * @param event
     */
    function copyEventLink(event) {
        const eventLink = `https://vrchat.com/home/group/${event.ownerId}/calendar/${event.id}`;
        navigator.clipboard.writeText(eventLink);
        toast.success(t('dialog.group_calendar.event_card.copied_event_link'));
    }

    const formatTimeRange = (startsAt, endsAt) =>
        `${formatDateFilter(startsAt, 'time')} - ${formatDateFilter(endsAt, 'time')}`;

    const capitalizeFirst = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);

    const onGroupClick = () => {
        emit('click-action');
    };

    const openEventPopover = () => {
        if (eventPopoverCloseTimer) {
            clearTimeout(eventPopoverCloseTimer);
            eventPopoverCloseTimer = null;
        }
        eventPopoverOpen.value = true;
    };

    const scheduleCloseEventPopover = () => {
        if (eventPopoverCloseTimer) {
            clearTimeout(eventPopoverCloseTimer);
        }
        eventPopoverCloseTimer = setTimeout(() => {
            eventPopoverOpen.value = false;
        }, 100);
    };
</script>

<style scoped>
    .event-card {
        position: relative;
        overflow: visible;
        border-radius: var(--radius-lg);
        width: 100%;
    }

    .event-card.grouped-card {
        margin-bottom: 0;
    }

    .event-card.grid-card {
        flex: 0 0 280px;
        max-width: 280px;
    }

    .event-card.group-dialog-grid-card {
        flex: 0 0 320px;
        max-width: 320px;
    }

    .event-card .banner {
        cursor: pointer;
        width: 100%;
        object-fit: cover;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .timeline-view .event-card .banner {
        height: 125px;
    }

    .grid-view .event-card .banner {
        height: 100px;
    }

    .event-card .badges {
        display: inline-flex;
        position: absolute;
        top: -8px;
        right: -9px;
        z-index: 10;
        font-size: 15px;
    }

    .event-card .badges .badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        gap: 4px;
        cursor: pointer;
        margin-left: 6px;
    }

    .event-card .event-content {
        font-size: 12px;
    }

    .timeline-view .event-card .event-content {
        padding: 4px 12px 12px 12px;
    }

    .grid-view .event-card .event-content {
        padding: 8px 12px 12px 12px;
    }

    .event-card .event-title {
        display: flex;
        flex-direction: column;
    }

    .grid-view .event-card .event-title {
        margin-bottom: 8px;
    }

    .event-card .event-group-name {
        cursor: pointer;
    }

    .grid-view .event-card .event-group-name {
        display: none;
    }

    .event-card .event-title-content {
        font-size: 14px;
        font-weight: bold;
        line-height: 1.2;
        cursor: pointer;
    }

    .timeline-view .event-card .event-title-content {
        margin-bottom: 2px;
    }

    .event-card .event-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .timeline-view .event-card .event-info > :first-child {
        font-size: 14px;
    }

    .grid-view .event-card .event-info {
        font-size: 11px;
    }

    .event-card .event-time {
        font-weight: 500;
    }
</style>
