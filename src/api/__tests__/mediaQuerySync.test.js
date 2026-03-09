import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockRequest = vi.fn();
const mockFetchWithEntityPolicy = vi.fn();
const mockInvalidateQueries = vi.fn().mockResolvedValue();
const mockRemoveQueries = vi.fn();

vi.mock('../../service/request', () => ({
    request: (...args) => mockRequest(...args)
}));

vi.mock('../../stores', () => ({
    useUserStore: () => ({
        currentUser: { id: 'usr_me' }
    })
}));

vi.mock('../../queries', () => ({
    entityQueryPolicies: {
        galleryCollection: {
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        },
        inventoryCollection: {
            staleTime: 20000,
            gcTime: 120000,
            retry: 1,
            refetchOnWindowFocus: false
        },
        fileObject: {
            staleTime: 60000,
            gcTime: 300000,
            retry: 1,
            refetchOnWindowFocus: false
        }
    },
    fetchWithEntityPolicy: (...args) => mockFetchWithEntityPolicy(...args),
    queryClient: {
        invalidateQueries: (...args) => mockInvalidateQueries(...args),
        removeQueries: (...args) => mockRemoveQueries(...args)
    },
    queryKeys: {
        galleryFiles: (params) => ['gallery', 'files', params],
        prints: (params) => ['gallery', 'prints', params],
        print: (printId) => ['gallery', 'print', printId],
        inventoryItems: (params) => ['inventory', 'items', params],
        userInventoryItem: (params) => ['inventory', 'item', params.userId, params.inventoryId],
        file: (fileId) => ['file', fileId]
    }
}));

import inventoryRequest from '../inventory';
import miscRequest from '../misc';
import vrcPlusIconRequest from '../vrcPlusIcon';
import vrcPlusImageRequest from '../vrcPlusImage';

describe('media and inventory query sync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('cached media/inventory reads go through fetchWithEntityPolicy', async () => {
        mockFetchWithEntityPolicy.mockResolvedValue({
            data: { json: [], params: {} },
            cache: true
        });

        const a = await vrcPlusIconRequest.getCachedFileList({ tag: 'icon', n: 100 });
        const b = await vrcPlusImageRequest.getCachedPrints({ n: 100 });
        const c = await inventoryRequest.getCachedInventoryItems({
            n: 100,
            offset: 0,
            order: 'newest'
        });
        const d = await miscRequest.getCachedFile({ fileId: 'file_1' });

        expect(mockFetchWithEntityPolicy).toHaveBeenCalledTimes(4);
        expect(a.cache && b.cache && c.cache && d.cache).toBe(true);
    });

    test('media mutations invalidate gallery queries and file delete removes file query', async () => {
        mockRequest.mockResolvedValue({ ok: true });

        await vrcPlusIconRequest.deleteFile('file_icon_1');
        await vrcPlusImageRequest.deletePrint('print_1');
        await vrcPlusImageRequest.uploadEmoji('img', { tag: 'emoji' });
        await miscRequest.deleteFile('file_misc_1');

        expect(mockInvalidateQueries).toHaveBeenCalledWith({
            queryKey: ['gallery'],
            refetchType: 'active'
        });
        expect(mockRemoveQueries).toHaveBeenCalledWith({
            queryKey: ['file', 'file_misc_1'],
            exact: true
        });
    });
});
