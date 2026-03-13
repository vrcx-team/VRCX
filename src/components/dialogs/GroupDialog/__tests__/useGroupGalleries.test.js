import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

vi.mock('../../../../api', () => ({
    queryRequest: {
        fetch: vi.fn()
    }
}));

import { useGroupGalleries } from '../useGroupGalleries';
import { queryRequest } from '../../../../api';

function createGroupDialog(overrides = {}) {
    return ref({
        id: 'grp_1',
        ref: {
            galleries: []
        },
        galleries: {},
        ...overrides
    });
}

describe('useGroupGalleries', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('groupGalleryTabs', () => {
        test('returns empty array when no galleries', () => {
            const groupDialog = createGroupDialog();
            const { groupGalleryTabs } = useGroupGalleries(groupDialog);
            expect(groupGalleryTabs.value).toEqual([]);
        });

        test('maps galleries to tabs with index values', () => {
            const groupDialog = createGroupDialog({
                ref: {
                    galleries: [
                        { id: 'g1', name: 'Photos' },
                        { id: 'g2', name: 'Screenshots' }
                    ]
                }
            });
            const { groupGalleryTabs } = useGroupGalleries(groupDialog);
            expect(groupGalleryTabs.value).toEqual([
                { value: '0', label: 'Photos' },
                { value: '1', label: 'Screenshots' }
            ]);
        });

        test('handles galleries with null name', () => {
            const groupDialog = createGroupDialog({
                ref: {
                    galleries: [{ id: 'g1', name: null }]
                }
            });
            const { groupGalleryTabs } = useGroupGalleries(groupDialog);
            expect(groupGalleryTabs.value).toEqual([{ value: '0', label: '' }]);
        });

        test('is reactive to gallery changes', () => {
            const groupDialog = createGroupDialog();
            const { groupGalleryTabs } = useGroupGalleries(groupDialog);
            expect(groupGalleryTabs.value).toHaveLength(0);

            groupDialog.value.ref.galleries = [
                { id: 'g1', name: 'New Gallery' }
            ];
            expect(groupGalleryTabs.value).toHaveLength(1);
        });
    });

    describe('groupGalleryStatus', () => {
        test('returns blue for non-members-only gallery', () => {
            const groupDialog = createGroupDialog();
            const { groupGalleryStatus } = useGroupGalleries(groupDialog);
            expect(groupGalleryStatus({ membersOnly: false })).toEqual({
                blue: true
            });
        });

        test('returns green for members-only without role restriction', () => {
            const groupDialog = createGroupDialog();
            const { groupGalleryStatus } = useGroupGalleries(groupDialog);
            expect(
                groupGalleryStatus({ membersOnly: true, roleIdsToView: null })
            ).toEqual({ green: true });
        });

        test('returns red for role-restricted gallery', () => {
            const groupDialog = createGroupDialog();
            const { groupGalleryStatus } = useGroupGalleries(groupDialog);
            expect(
                groupGalleryStatus({
                    membersOnly: true,
                    roleIdsToView: ['role1']
                })
            ).toEqual({ red: true });
        });
    });

    describe('getGroupGalleries', () => {
        test('resets galleries and tab before loading', async () => {
            const groupDialog = createGroupDialog({
                galleries: { old: [1, 2, 3] }
            });
            const { getGroupGalleries, groupDialogGalleryCurrentName } =
                useGroupGalleries(groupDialog);
            groupDialogGalleryCurrentName.value = '2';

            await getGroupGalleries();

            expect(groupDialogGalleryCurrentName.value).toBe('0');
        });

        test('sets loading state correctly during fetch', async () => {
            const groupDialog = createGroupDialog({
                ref: {
                    galleries: [{ id: 'g1', name: 'Gallery' }]
                }
            });
            queryRequest.fetch.mockResolvedValue({
                json: [],
                params: { groupId: 'grp_1' }
            });

            const { getGroupGalleries, isGroupGalleryLoading } =
                useGroupGalleries(groupDialog);
            expect(isGroupGalleryLoading.value).toBe(false);

            const promise = getGroupGalleries();
            expect(isGroupGalleryLoading.value).toBe(true);

            await promise;
            expect(isGroupGalleryLoading.value).toBe(false);
        });

        test('calls getCachedGroupGallery for each gallery', async () => {
            const groupDialog = createGroupDialog({
                ref: {
                    galleries: [
                        { id: 'g1', name: 'A' },
                        { id: 'g2', name: 'B' }
                    ]
                }
            });
            queryRequest.fetch.mockResolvedValue({
                json: [],
                params: { groupId: 'grp_1' }
            });

            const { getGroupGalleries } = useGroupGalleries(groupDialog);
            await getGroupGalleries();

            expect(queryRequest.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('getGroupGallery', () => {
        test('populates gallery images from API response', async () => {
            const groupDialog = createGroupDialog();
            const { getGroupGallery } = useGroupGalleries(groupDialog);

            queryRequest.fetch.mockResolvedValueOnce({
                json: [
                    {
                        groupId: 'grp_1',
                        galleryId: 'g1',
                        id: 'img1',
                        imageUrl: 'url1'
                    },
                    {
                        groupId: 'grp_1',
                        galleryId: 'g1',
                        id: 'img2',
                        imageUrl: 'url2'
                    }
                ],
                params: { groupId: 'grp_1' }
            });

            await getGroupGallery('grp_1', 'g1');

            expect(groupDialog.value.galleries['g1']).toHaveLength(2);
            expect(groupDialog.value.galleries['g1'][0].id).toBe('img1');
        });

        test('ignores images from different groups', async () => {
            const groupDialog = createGroupDialog();
            const { getGroupGallery } = useGroupGalleries(groupDialog);

            queryRequest.fetch.mockResolvedValueOnce({
                json: [
                    {
                        groupId: 'grp_other',
                        galleryId: 'g1',
                        id: 'img1',
                        imageUrl: 'url1'
                    }
                ],
                params: { groupId: 'grp_other' }
            });

            await getGroupGallery('grp_1', 'g1');

            expect(groupDialog.value.galleries['g1']).toBeUndefined();
        });

        test('stops pagination when fewer than 100 results returned', async () => {
            const groupDialog = createGroupDialog();
            const { getGroupGallery } = useGroupGalleries(groupDialog);

            queryRequest.fetch.mockResolvedValueOnce({
                json: Array.from({ length: 50 }, (_, i) => ({
                    groupId: 'grp_1',
                    galleryId: 'g1',
                    id: `img${i}`,
                    imageUrl: `url${i}`
                })),
                params: { groupId: 'grp_1' }
            });

            await getGroupGallery('grp_1', 'g1');

            expect(queryRequest.fetch).toHaveBeenCalledTimes(1);
        });

        test('handles API errors gracefully', async () => {
            const groupDialog = createGroupDialog();
            const { getGroupGallery } = useGroupGalleries(groupDialog);
            const consoleSpy = vi
                .spyOn(console, 'error')
                .mockImplementation(() => {});

            queryRequest.fetch.mockRejectedValueOnce(new Error('API Error'));

            await expect(
                getGroupGallery('grp_1', 'g1')
            ).resolves.toBeUndefined();
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });
    });
});
