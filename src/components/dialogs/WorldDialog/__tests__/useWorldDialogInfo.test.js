import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useWorldDialogInfo } from '../useWorldDialogInfo';

vi.mock('../../../../shared/utils', () => ({
    commaNumber: vi.fn((n) => n?.toLocaleString()),
    compareUnityVersion: vi.fn(() => true),
    formatDateFilter: vi.fn((d) => d),
    timeToText: vi.fn((ms) => `${Math.floor(ms / 1000)}s`)
}));

vi.mock('../../../../services/database', () => ({
    database: {
        setWorldMemo: vi.fn(),
        deleteWorldMemo: vi.fn()
    }
}));

const { database } = await import('../../../../services/database');
const { compareUnityVersion } = await import('../../../../shared/utils');

/**
 *
 * @param overrides
 */
function createWorldDialog(overrides = {}) {
    return ref({
        id: 'wrld_123',
        memo: '',
        timeSpent: 60000,
        ref: {
            name: 'Test World',
            description: 'A test world',
            publicationDate: '2024-06-01T00:00:00Z',
            labsPublicationDate: '2024-05-01T00:00:00Z',
            favorites: 100,
            visits: 500,
            tags: ['author_tag_fun', 'author_tag_social', 'content_horror'],
            unityPackages: [
                {
                    platform: 'standalonewindows',
                    unityVersion: '2022.3.6f1',
                    unitySortNumber: 20220306,
                    variant: 'standard',
                    created_at: '2024-05-15T00:00:00Z'
                },
                {
                    platform: 'android',
                    unityVersion: '2022.3.6f1',
                    unitySortNumber: 20220306,
                    variant: 'standard',
                    created_at: '2024-05-20T00:00:00Z'
                }
            ]
        },
        ...overrides
    });
}

/**
 *
 * @param overrides
 */
function createDeps(overrides = {}) {
    return {
        t: vi.fn((key) => key),
        toast: {
            success: vi.fn(),
            error: vi.fn()
        },
        ...overrides
    };
}

describe('useWorldDialogInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        compareUnityVersion.mockReturnValue(true);
    });

    describe('memo computed', () => {
        test('gets memo value from worldDialog', () => {
            const worldDialog = createWorldDialog({ memo: 'my memo' });
            const { memo } = useWorldDialogInfo(worldDialog, createDeps());

            expect(memo.value).toBe('my memo');
        });

        test('sets memo value on worldDialog', () => {
            const worldDialog = createWorldDialog();
            const { memo } = useWorldDialogInfo(worldDialog, createDeps());

            memo.value = 'new memo';
            expect(worldDialog.value.memo).toBe('new memo');
        });
    });

    describe('isTimeInLabVisible', () => {
        test('returns true when both dates exist and are not "none"', () => {
            const worldDialog = createWorldDialog();
            const { isTimeInLabVisible } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(isTimeInLabVisible.value).toBe(true);
        });

        test('returns false when publicationDate is "none"', () => {
            const worldDialog = createWorldDialog();
            worldDialog.value.ref.publicationDate = 'none';
            const { isTimeInLabVisible } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(isTimeInLabVisible.value).toBe(false);
        });

        test('returns false when labsPublicationDate is falsy', () => {
            const worldDialog = createWorldDialog();
            worldDialog.value.ref.labsPublicationDate = '';
            const { isTimeInLabVisible } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(isTimeInLabVisible.value).toBeFalsy();
        });
    });

    describe('timeInLab', () => {
        test('computes time difference between publication and labs dates', () => {
            const worldDialog = createWorldDialog();
            const { timeInLab } = useWorldDialogInfo(worldDialog, createDeps());

            // Should call timeToText with the ms difference
            expect(timeInLab.value).toBeDefined();
        });
    });

    describe('favoriteRate', () => {
        test('calculates favorite rate based on favorites and visits', () => {
            const worldDialog = createWorldDialog();
            const { favoriteRate } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            // ((100 - 500) / 500 * 100 + 100) * 100 / 100
            // = (-80 + 100) = 20
            expect(favoriteRate.value).toBe(20);
        });
    });

    describe('worldTags', () => {
        test('filters and formats author tags', () => {
            const worldDialog = createWorldDialog();
            const { worldTags } = useWorldDialogInfo(worldDialog, createDeps());

            expect(worldTags.value).toBe('fun, social');
        });

        test('returns empty string when no author tags', () => {
            const worldDialog = createWorldDialog();
            worldDialog.value.ref.tags = ['content_horror'];
            const { worldTags } = useWorldDialogInfo(worldDialog, createDeps());

            expect(worldTags.value).toBe('');
        });
    });

    describe('timeSpent', () => {
        test('converts milliseconds to text', () => {
            const worldDialog = createWorldDialog({ timeSpent: 120000 });
            const { timeSpent } = useWorldDialogInfo(worldDialog, createDeps());

            expect(timeSpent.value).toBe('120s');
        });
    });

    describe('worldDialogPlatform', () => {
        test('formats platform strings from unity packages', () => {
            const worldDialog = createWorldDialog();
            const { worldDialogPlatform } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(worldDialogPlatform.value).toContain('PC/2022.3.6f1');
            expect(worldDialogPlatform.value).toContain('Android/2022.3.6f1');
        });

        test('skips packages filtered by compareUnityVersion', () => {
            compareUnityVersion.mockReturnValue(false);
            const worldDialog = createWorldDialog();
            const { worldDialogPlatform } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(worldDialogPlatform.value).toBe('');
        });

        test('uses platform name directly for unknown platforms', () => {
            const worldDialog = createWorldDialog();
            worldDialog.value.ref.unityPackages = [
                {
                    platform: 'ios',
                    unityVersion: '2022.3.6f1',
                    unitySortNumber: 20220306
                }
            ];
            const { worldDialogPlatform } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(worldDialogPlatform.value).toBe('ios/2022.3.6f1');
        });
    });

    describe('worldDialogPlatformCreatedAt', () => {
        test('returns newest created_at per platform', () => {
            const worldDialog = createWorldDialog();
            const { worldDialogPlatformCreatedAt } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(worldDialogPlatformCreatedAt.value).toEqual({
                standalonewindows: '2024-05-15T00:00:00Z',
                android: '2024-05-20T00:00:00Z'
            });
        });

        test('returns null when no unityPackages', () => {
            const worldDialog = createWorldDialog();
            worldDialog.value.ref.unityPackages = undefined;
            const { worldDialogPlatformCreatedAt } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(worldDialogPlatformCreatedAt.value).toBeNull();
        });

        test('skips non-standard variants', () => {
            const worldDialog = createWorldDialog();
            worldDialog.value.ref.unityPackages = [
                {
                    platform: 'standalonewindows',
                    variant: 'custom',
                    created_at: '2024-05-15T00:00:00Z'
                }
            ];
            const { worldDialogPlatformCreatedAt } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(worldDialogPlatformCreatedAt.value).toEqual({});
        });
    });

    describe('onWorldMemoChange', () => {
        test('saves memo when it has value', () => {
            const worldDialog = createWorldDialog({ memo: 'test memo' });
            const { onWorldMemoChange } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            onWorldMemoChange();

            expect(database.setWorldMemo).toHaveBeenCalledWith(
                expect.objectContaining({
                    worldId: 'wrld_123',
                    memo: 'test memo'
                })
            );
        });

        test('deletes memo when it is empty', () => {
            const worldDialog = createWorldDialog({ memo: '' });
            const { onWorldMemoChange } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            onWorldMemoChange();

            expect(database.deleteWorldMemo).toHaveBeenCalledWith('wrld_123');
        });
    });

    describe('clipboard operations', () => {
        let originalClipboard;

        beforeEach(() => {
            originalClipboard = navigator.clipboard;
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: vi.fn().mockResolvedValue(undefined)
                },
                writable: true,
                configurable: true
            });
        });

        test('copyWorldId copies world id', async () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { copyWorldId } = useWorldDialogInfo(worldDialog, deps);

            copyWorldId();
            await vi.waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                    'wrld_123'
                );
            });
        });

        test('copyWorldUrl copies full url', async () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { copyWorldUrl } = useWorldDialogInfo(worldDialog, deps);

            copyWorldUrl();
            await vi.waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                    'https://vrchat.com/home/world/wrld_123'
                );
            });
        });

        test('copyWorldName copies world name', async () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { copyWorldName } = useWorldDialogInfo(worldDialog, deps);

            copyWorldName();
            await vi.waitFor(() => {
                expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                    'Test World'
                );
            });
        });

        test('shows toast on clipboard success', async () => {
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { copyWorldId } = useWorldDialogInfo(worldDialog, deps);

            copyWorldId();
            await vi.waitFor(() => {
                expect(deps.toast.success).toHaveBeenCalled();
            });
        });

        test('shows error toast on clipboard failure', async () => {
            navigator.clipboard.writeText = vi
                .fn()
                .mockRejectedValue(new Error('denied'));
            const worldDialog = createWorldDialog();
            const deps = createDeps();
            const { copyWorldId } = useWorldDialogInfo(worldDialog, deps);

            copyWorldId();
            await vi.waitFor(() => {
                expect(deps.toast.error).toHaveBeenCalled();
            });
        });
    });

    describe('utility re-exports', () => {
        test('re-exports commaNumber and formatDateFilter', () => {
            const worldDialog = createWorldDialog();
            const { commaNumber, formatDateFilter } = useWorldDialogInfo(
                worldDialog,
                createDeps()
            );

            expect(commaNumber).toBeDefined();
            expect(formatDateFilter).toBeDefined();
        });
    });
});
