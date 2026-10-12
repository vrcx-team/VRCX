<template>
    <div class="flex items-baseline justify-between gap-3 text-xs">
        <div class="text-[13px] font-semibold">{{ event.title }}</div>
        <div class="whitespace-nowrap">
            {{
                relativeTime
                    ? formatRelativeTimeRange(event.startsAt, event.endsAt)
                    : formatTimeRange(event.startsAt, event.endsAt)
            }}
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
</template>

<script setup>
    import { Calendar, Download } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import dayjs from 'dayjs';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { AppDebug } from '../../../services/appConfig';
    import { formatDateFilter } from '../../../shared/utils';

    const { t } = useI18n();

    defineProps({
        event: {
            type: Object,
            required: true
        },
        relativeTime: {
            type: Boolean,
            default: false
        }
    });

    /**
     * @param event
     */
    async function openCalendarEvent(event) {
        const content = await getCalendarIcs(event);
        if (!content) return;
        await AppApi.OpenCalendarFile(content);
    }

    /**
     * @param event
     */
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

    /**
     * @param event
     */
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

    const formatTimeRange = (startsAt, endsAt) =>
        `${formatDateFilter(startsAt, 'time')} - ${formatDateFilter(endsAt, 'time')}`;

    const formatRelativeTimeRange = (startsAt, endsAt) => `${dayjs(startsAt).fromNow()} - ${dayjs(endsAt).fromNow()}`;

    const capitalizeFirst = (str) => str?.charAt(0).toUpperCase() + str?.slice(1);
</script>
