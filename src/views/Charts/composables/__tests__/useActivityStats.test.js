import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useActivityStats } from '../useActivityStats';

describe('useActivityStats', () => {
    it('sums all time values from activityData', () => {
        const data = ref([{ time: 1000 }, { time: 2000 }, { time: 3000 }]);
        const { totalOnlineTime } = useActivityStats(data);
        expect(totalOnlineTime.value).toBe(6000);
    });

    it('returns 0 for empty array', () => {
        const data = ref([]);
        const { totalOnlineTime } = useActivityStats(data);
        expect(totalOnlineTime.value).toBe(0);
    });

    it('returns undefined when activityData is null', () => {
        const data = ref(null);
        const { totalOnlineTime } = useActivityStats(data);
        expect(totalOnlineTime.value).toBeUndefined();
    });

    it('handles single item', () => {
        const data = ref([{ time: 42 }]);
        const { totalOnlineTime } = useActivityStats(data);
        expect(totalOnlineTime.value).toBe(42);
    });

    it('reacts to changes in activityData', () => {
        const data = ref([{ time: 100 }]);
        const { totalOnlineTime } = useActivityStats(data);

        expect(totalOnlineTime.value).toBe(100);

        data.value = [{ time: 200 }, { time: 300 }];
        expect(totalOnlineTime.value).toBe(500);
    });
});
