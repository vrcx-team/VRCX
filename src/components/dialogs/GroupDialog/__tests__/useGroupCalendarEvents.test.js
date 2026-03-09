import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useGroupCalendarEvents } from '../useGroupCalendarEvents';

function createGroupDialog(calendar = []) {
    return ref({
        calendar
    });
}

const PAST_DATE = '2020-01-01T00:00:00Z';
const FUTURE_DATE = '2099-12-31T23:59:59Z';

describe('useGroupCalendarEvents', () => {
    describe('pastCalenderEvents', () => {
        test('returns empty array when calendar is null', () => {
            const groupDialog = ref({ calendar: null });
            const { pastCalenderEvents } = useGroupCalendarEvents(groupDialog);
            expect(pastCalenderEvents.value).toEqual([]);
        });

        test('returns empty array when calendar is undefined', () => {
            const groupDialog = ref({});
            const { pastCalenderEvents } = useGroupCalendarEvents(groupDialog);
            expect(pastCalenderEvents.value).toEqual([]);
        });

        test('returns empty array when no past events exist', () => {
            const groupDialog = createGroupDialog([
                { id: '1', endsAt: FUTURE_DATE }
            ]);
            const { pastCalenderEvents } = useGroupCalendarEvents(groupDialog);
            expect(pastCalenderEvents.value).toEqual([]);
        });

        test('returns only past events', () => {
            const groupDialog = createGroupDialog([
                { id: '1', endsAt: PAST_DATE },
                { id: '2', endsAt: FUTURE_DATE },
                { id: '3', endsAt: PAST_DATE }
            ]);
            const { pastCalenderEvents } = useGroupCalendarEvents(groupDialog);
            expect(pastCalenderEvents.value).toHaveLength(2);
            expect(pastCalenderEvents.value.map((e) => e.id)).toEqual([
                '1',
                '3'
            ]);
        });

        test('is reactive to calendar changes', () => {
            const groupDialog = createGroupDialog([]);
            const { pastCalenderEvents } = useGroupCalendarEvents(groupDialog);
            expect(pastCalenderEvents.value).toHaveLength(0);

            groupDialog.value.calendar = [{ id: '1', endsAt: PAST_DATE }];
            expect(pastCalenderEvents.value).toHaveLength(1);
        });
    });

    describe('upcomingCalenderEvents', () => {
        test('returns empty array when calendar is null', () => {
            const groupDialog = ref({ calendar: null });
            const { upcomingCalenderEvents } =
                useGroupCalendarEvents(groupDialog);
            expect(upcomingCalenderEvents.value).toEqual([]);
        });

        test('returns empty array when no upcoming events exist', () => {
            const groupDialog = createGroupDialog([
                { id: '1', endsAt: PAST_DATE }
            ]);
            const { upcomingCalenderEvents } =
                useGroupCalendarEvents(groupDialog);
            expect(upcomingCalenderEvents.value).toEqual([]);
        });

        test('returns only upcoming events', () => {
            const groupDialog = createGroupDialog([
                { id: '1', endsAt: PAST_DATE },
                { id: '2', endsAt: FUTURE_DATE },
                { id: '3', endsAt: FUTURE_DATE }
            ]);
            const { upcomingCalenderEvents } =
                useGroupCalendarEvents(groupDialog);
            expect(upcomingCalenderEvents.value).toHaveLength(2);
            expect(upcomingCalenderEvents.value.map((e) => e.id)).toEqual([
                '2',
                '3'
            ]);
        });

        test('past and upcoming are mutually exclusive', () => {
            const events = [
                { id: '1', endsAt: PAST_DATE },
                { id: '2', endsAt: FUTURE_DATE }
            ];
            const groupDialog = createGroupDialog(events);
            const { pastCalenderEvents, upcomingCalenderEvents } =
                useGroupCalendarEvents(groupDialog);

            const allIds = [
                ...pastCalenderEvents.value.map((e) => e.id),
                ...upcomingCalenderEvents.value.map((e) => e.id)
            ];
            expect(allIds).toHaveLength(2);
            expect(new Set(allIds).size).toBe(2);
        });
    });

    describe('updateFollowingCalendarData', () => {
        test('updates an existing event by id', () => {
            const groupDialog = createGroupDialog([
                { id: '1', title: 'Old Title', endsAt: FUTURE_DATE },
                { id: '2', title: 'Other', endsAt: FUTURE_DATE }
            ]);
            const { updateFollowingCalendarData } =
                useGroupCalendarEvents(groupDialog);

            updateFollowingCalendarData({ id: '1', title: 'New Title' });

            expect(groupDialog.value.calendar[0].title).toBe('New Title');
            expect(groupDialog.value.calendar[0].endsAt).toBe(FUTURE_DATE);
        });

        test('does not modify other events', () => {
            const groupDialog = createGroupDialog([
                { id: '1', title: 'Event 1', endsAt: FUTURE_DATE },
                { id: '2', title: 'Event 2', endsAt: FUTURE_DATE }
            ]);
            const { updateFollowingCalendarData } =
                useGroupCalendarEvents(groupDialog);

            updateFollowingCalendarData({ id: '1', title: 'Updated' });

            expect(groupDialog.value.calendar[1].title).toBe('Event 2');
        });

        test('does nothing when event id is not found', () => {
            const events = [{ id: '1', title: 'Event 1', endsAt: FUTURE_DATE }];
            const groupDialog = createGroupDialog([...events]);
            const { updateFollowingCalendarData } =
                useGroupCalendarEvents(groupDialog);

            updateFollowingCalendarData({
                id: 'nonexistent',
                title: 'Updated'
            });

            expect(groupDialog.value.calendar[0].title).toBe('Event 1');
        });

        test('merges new properties into the event', () => {
            const groupDialog = createGroupDialog([
                { id: '1', title: 'Event', endsAt: FUTURE_DATE }
            ]);
            const { updateFollowingCalendarData } =
                useGroupCalendarEvents(groupDialog);

            updateFollowingCalendarData({
                id: '1',
                userInterest: { isFollowing: true }
            });

            expect(groupDialog.value.calendar[0].title).toBe('Event');
            expect(groupDialog.value.calendar[0].userInterest.isFollowing).toBe(
                true
            );
        });
    });
});
