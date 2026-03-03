import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { useActivityDataFilter } from '../useActivityDataFilter';

function setup({
    detailData = [],
    isDetailVisible = true,
    isSoloInstanceVisible = true,
    isNoFriendInstanceVisible = true
} = {}) {
    return useActivityDataFilter(
        ref(detailData),
        ref(isDetailVisible),
        ref(isSoloInstanceVisible),
        ref(isNoFriendInstanceVisible)
    );
}

describe('useActivityDataFilter', () => {
    it('returns empty array when isDetailVisible is false', () => {
        const { filteredActivityDetailData } = setup({
            detailData: [[{ isFriend: true }]],
            isDetailVisible: false
        });
        expect(filteredActivityDetailData.value).toEqual([]);
    });

    it('returns all data when all filters are enabled', () => {
        const data = [
            [{ isFriend: true }],
            [{ isFriend: false }],
            [{ isFriend: true }, { isFriend: false }]
        ];
        const { filteredActivityDetailData } = setup({ detailData: data });
        expect(filteredActivityDetailData.value).toHaveLength(3);
    });

    it('filters solo instances when isSoloInstanceVisible is false', () => {
        const data = [
            [{ isFriend: true }], // solo — filtered
            [{ isFriend: true }, { isFriend: false }] // not solo — kept
        ];
        const { filteredActivityDetailData } = setup({
            detailData: data,
            isSoloInstanceVisible: false
        });
        expect(filteredActivityDetailData.value).toHaveLength(1);
        expect(filteredActivityDetailData.value[0]).toHaveLength(2);
    });

    it('filters no-friend instances when isNoFriendInstanceVisible is false', () => {
        const data = [
            [{ isFriend: false }, { isFriend: false }], // no friends — filtered
            [{ isFriend: true }, { isFriend: false }] // has friend — kept
        ];
        const { filteredActivityDetailData } = setup({
            detailData: data,
            isNoFriendInstanceVisible: false
        });
        expect(filteredActivityDetailData.value).toHaveLength(1);
    });

    it('keeps solo instances even when isNoFriendInstanceVisible is false', () => {
        const data = [
            [{ isFriend: false }] // solo — special case, kept
        ];
        const { filteredActivityDetailData } = setup({
            detailData: data,
            isNoFriendInstanceVisible: false
        });
        expect(filteredActivityDetailData.value).toHaveLength(1);
    });

    it('combines solo and no-friend filters', () => {
        const data = [
            [{ isFriend: false }], // solo — filtered by solo filter
            [{ isFriend: false }, { isFriend: false }], // no friends — filtered
            [{ isFriend: true }, { isFriend: false }] // kept
        ];
        const { filteredActivityDetailData } = setup({
            detailData: data,
            isSoloInstanceVisible: false,
            isNoFriendInstanceVisible: false
        });
        expect(filteredActivityDetailData.value).toHaveLength(1);
    });

    it('returns empty array for empty input data', () => {
        const { filteredActivityDetailData } = setup({ detailData: [] });
        expect(filteredActivityDetailData.value).toEqual([]);
    });
});
