<template>
    <el-card :body-style="{ padding: '0px' }" class="event-card" :class="cardClass">
        <img :src="bannerUrl" @click="showFullscreenImageDialog(bannerUrl)" class="banner" />
        <div class="event-content">
            <div class="event-title">
                <div v-if="showGroupName" class="event-group-name" @click="onGroupClick">
                    {{ groupName }}
                </div>
                <el-popover placement="right" :width="500" trigger="hover">
                    <el-descriptions :title="event.title" size="small" :column="2" class="event-title-popover">
                        <template #extra>
                            <div>
                                {{ formatTimeRange(event.startsAt, event.endsAt) }}
                            </div>
                        </template>

                        <el-descriptions-item>
                            <el-button type="default" :icon="Calendar" size="small" @click="openCalendarEvent(event)">{{
                                t('dialog.group_calendar.event_card.export_to_calendar')
                            }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item>
                            <el-button type="default" :icon="Download" size="small" @click="downloadEventIcs(event)">{{
                                t('dialog.group_calendar.event_card.download_ics')
                            }}</el-button>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('dialog.group_calendar.event_card.category')">
                            {{ capitalizeFirst(event.category) }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('dialog.group_calendar.event_card.interested_user')">
                            {{ event.interestedUserCount }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('dialog.group_calendar.event_card.close_time')">
                            {{ event.closeInstanceAfterEndMinutes + ' min' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('dialog.group_calendar.event_card.created')">
                            {{ formatDateFilter(event.createdAt, 'long') }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('dialog.group_calendar.event_card.description')">
                            {{ event.description }}
                        </el-descriptions-item>
                    </el-descriptions>
                    <template #reference>
                        <div class="event-title-content" @click="onGroupClick">
                            {{ event.title }}
                        </div>
                    </template>
                </el-popover>
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
                <el-icon><Share /></el-icon>
            </div>
            <div v-if="isFollowing" @click="toggleEventFollow(event)" class="following-badge is-following">
                <el-icon><Star /></el-icon>
            </div>
            <div v-else @click="toggleEventFollow(event)" class="following-badge">
                <el-icon><StarFilled /></el-icon>
            </div>
        </div>
    </el-card>
</template>

<script setup>
    import { Calendar, Download, Share, Star, StarFilled } from '@element-plus/icons-vue';
    import { computed } from 'vue';
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
</script>

<style scoped>
    .event-card {
        transition: all 0.3s ease;
        position: relative;
        overflow: visible;
        border-radius: 8px;
    }

    .event-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--el-box-shadow-light);
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

    .event-card :deep(.el-card__body) {
        overflow: visible;
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
        background-color: var(--el-text-color-regular);
        color: var(--el-bg-color);
        box-shadow: var(--el-box-shadow-lighter);
        cursor: pointer;
    }

    .event-card .badges .following-badge.is-following {
        background-color: var(--group-calendar-badge-following, var(--el-color-success));
    }

    .event-card .badges .share-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        gap: 4px;
        border-radius: 50%;
        background-color: var(--el-text-color-regular);
        color: var(--el-bg-color);
        box-shadow: var(--el-box-shadow-lighter);
        cursor: pointer;
        margin-right: 5px;
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

    .event-card .event-title-content:hover {
        color: var(--el-color-primary);
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
        color: var(--el-text-color-regular);
    }

    .event-card .event-time {
        font-weight: 500;
        color: var(--el-color-primary);
    }

    :deep(.el-card) {
        border-radius: 8px;
        width: 100%;
        overflow: visible;
    }
</style>
