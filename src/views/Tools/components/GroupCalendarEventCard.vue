<template>
    <Popover :open="eventPopoverOpen">
        <PopoverTrigger as-child>
            <Card
                class="event-card p-0 gap-0"
                :class="cardClass"
                @mouseenter="openEventPopover"
                @mouseleave="scheduleCloseEventPopover">
                <img :src="bannerUrl" @click="showFullscreenImageDialog(bannerUrl)" class="banner" />
                <div class="event-content">
                    <div class="event-title">
                        <div v-if="showGroupName" class="event-group-name" @click="onGroupClick">
                            {{ groupName }}
                        </div>
                        <div class="event-title-content" @click="onGroupClick">
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
                    <div @click="copyEventLink(event)" class="share-badge">
                        <Share2 />
                    </div>
                    <div v-if="isFollowing" @click="toggleEventFollow(event)" class="following-badge is-following">
                        <Star />
                    </div>
                    <div v-else @click="toggleEventFollow(event)" class="following-badge">
                        <Star />
                    </div>
                </div>
            </Card>
        </PopoverTrigger>
        <PopoverContent
            side="right"
            align="start"
            class="w-125 p-3"
            @mouseenter="openEventPopover"
            @mouseleave="scheduleCloseEventPopover">
            <div class="flex items-baseline justify-between gap-3 text-xs">
                <div class="text-[13px] font-semibold">{{ event.title }}</div>
                <div class="whitespace-nowrap">
                    {{ formatTimeRange(event.startsAt, event.endsAt) }}
                </div>
            </div>
            <div class="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div class="flex min-w-0 flex-col gap-1">
                    <Button variant="outline" size="sm" @click="openCalendarEvent(event)">
                        <Calendar />
                        {{ t('dialog.group_calendar.event_card.export_to_calendar') }}
                    </Button>
                </div>
                <div class="flex min-w-0 flex-col gap-1">
                    <Button variant="outline" size="sm" @click="downloadEventIcs(event)">
                        <Download />
                        {{ t('dialog.group_calendar.event_card.download_ics') }}
                    </Button>
                </div>
                <div class="flex min-w-0 flex-col gap-1">
                    <div>
                        {{ t('dialog.group_calendar.event_card.category') }}
                    </div>
                    <div class="font-medium">{{ capitalizeFirst(event.category) }}</div>
                </div>
                <div class="flex min-w-0 flex-col gap-1">
                    <div>
                        {{ t('dialog.group_calendar.event_card.interested_user') }}
                    </div>
                    <div class="font-medium">{{ event.interestedUserCount }}</div>
                </div>
                <div class="flex min-w-0 flex-col gap-1">
                    <div>
                        {{ t('dialog.group_calendar.event_card.close_time') }}
                    </div>
                    <div class="font-medium">
                        {{ event.closeInstanceAfterEndMinutes + ' min' }}
                    </div>
                </div>
                <div class="flex min-w-0 flex-col gap-1">
                    <div>
                        {{ t('dialog.group_calendar.event_card.created') }}
                    </div>
                    <div class="font-medium">
                        {{ formatDateFilter(event.createdAt, 'long') }}
                    </div>
                </div>
                <div class="col-span-2 flex min-w-0 flex-col gap-1">
                    <div>
                        {{ t('dialog.group_calendar.event_card.description') }}
                    </div>
                    <div class="whitespace-pre-wrap break-words font-normal leading-snug">
                        {{ event.description }}
                    </div>
                </div>
            </div>
        </PopoverContent>
    </Popover>
</template>

<script setup>
    import { Calendar, Download, Share2, Star } from 'lucide-vue-next';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Card } from '@/components/ui/card';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useGalleryStore, useGroupStore } from '../../../stores';
    import { AppDebug } from '../../../service/appConfig';
    import { formatDateFilter } from '../../../shared/utils';
    import { groupRequest } from '../../../api';

    const { showFullscreenImageDialog } = useGalleryStore();

    const { t } = useI18n();
    const { cachedGroups } = useGroupStore();

    const props = defineProps({
        event: {
            type: Object,
            required: true
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

    async function openCalendarEvent(event) {
        const content = await getCalendarIcs(event);
        if (!content) return;
        await AppApi.OpenCalendarFile(content);
    }

    async function getCalendarIcs(event) {
        const url = `${AppDebug.endpointDomain}/calendar/${event.ownerId}/${event.id}.ics`;
        try {
            const response = await webApiService.execute({
                url,
                method: 'GET'
            });
            if (response.status !== 200) {
                throw new Error(`Error: ${response.data}`);
            }
            return response.data;
        } catch (error) {
            toast.error(`Failed to download .ics file, ${error.message}`);
            console.error('Failed to download .ics file:', error);
        }
    }

    async function downloadEventIcs(event) {
        const content = await getCalendarIcs(event);
        if (!content) return;
        const blob = new Blob([content], { type: 'text/calendar' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${event.id}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    async function toggleEventFollow(event) {
        const args = await groupRequest.followGroupEvent({
            groupId: event.ownerId,
            eventId: event.id,
            isFollowing: !props.isFollowing
        });
        emit('update-following-calendar-data', args.json);
    }

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
        transition: all 0.3s ease;
        position: relative;
        overflow: visible;
        border-radius: 8px;
        width: 100%;
    }

    .event-card:hover {
        transform: translateY(-2px);
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
        border-radius: 8px 8px 0 0;
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

    .event-card .badges .following-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        gap: 4px;
        border-radius: 50%;
        cursor: pointer;
        background-color: var(--color-accent);
    }

    .event-card .badges .share-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        gap: 4px;
        border-radius: 50%;
        cursor: pointer;
        margin-right: 5px;
        background-color: var(--color-accent);
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
