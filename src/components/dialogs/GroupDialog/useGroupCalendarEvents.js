import { computed } from 'vue';

/**
 * Composable for filtering group calendar events into past and upcoming,
 * and updating follow state on individual events.
 * @param {import('vue').Ref} groupDialog - reactive ref to the group dialog state
 * @returns {{
 *   pastCalenderEvents: import('vue').ComputedRef<Array>,
 *   upcomingCalenderEvents: import('vue').ComputedRef<Array>,
 *   updateFollowingCalendarData: (event: Object) => void
 * }}
 */
export function useGroupCalendarEvents(groupDialog) {
    const pastCalenderEvents = computed(() => {
        if (!groupDialog.value.calendar) {
            return [];
        }
        const now = Date.now();
        return groupDialog.value.calendar.filter((event) => {
            const eventEnd = new Date(event.endsAt).getTime();
            return eventEnd < now;
        });
    });

    const upcomingCalenderEvents = computed(() => {
        if (!groupDialog.value.calendar) {
            return [];
        }
        const now = Date.now();
        return groupDialog.value.calendar.filter((event) => {
            const eventEnd = new Date(event.endsAt).getTime();
            return eventEnd >= now;
        });
    });

    /**
     * @param {object} event
     */
    function updateFollowingCalendarData(event) {
        const calendar = groupDialog.value.calendar;
        for (let i = 0; i < calendar.length; i++) {
            if (calendar[i].id === event.id) {
                calendar[i] = {
                    ...calendar[i],
                    ...event
                };
                break;
            }
        }
    }

    return {
        pastCalenderEvents,
        upcomingCalenderEvents,
        updateFollowingCalendarData
    };
}
