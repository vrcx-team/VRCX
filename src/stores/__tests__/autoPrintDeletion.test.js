import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// ------------------------------------------------------------------
// Mocks
// ------------------------------------------------------------------

const getPrints = vi.fn();
const deletePrint = vi.fn();
const getPrintFavorites = vi.fn();

const advancedSettingsStore = {
    autoDeleteOldPrints: true,
    ugcFolderPath: '',
    cropInstancePrints: false,
    currentUserInventory: new Map()
};

vi.mock('../../api', () => ({
    vrcPlusImageRequest: {
        getPrints: (...args) => getPrints(...args),
        deletePrint: (...args) => deletePrint(...args)
    },

    vrcPlusIconRequest: {
        getFileList: vi.fn()
    },

    inventoryRequest: {
        getInventoryItems: vi.fn(),
        getGlobalInventory: vi.fn()
    },

    queryRequest: {
        fetch: vi.fn()
    }
}));

vi.mock('../../services/database', () => ({
    database: {
        getPrintFavorites: (...args) => getPrintFavorites(...args)
    }
}));

vi.mock('../settings/advanced', () => ({
    useAdvancedSettingsStore: () => advancedSettingsStore
}));

vi.mock('../modal', () => ({
    useModalStore: () => ({
        confirm: vi.fn()
    })
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('../../plugins/router', () => ({
    router: {
        currentRoute: {
            value: {
                name: 'gallery'
            }
        },
        push: vi.fn()
    }
}));

vi.mock('../../services/appConfig', () => ({
    AppDebug: {
        errorNoty: null
    }
}));

vi.mock('../../coordinators/imageUploadCoordinator', () => ({
    handleImageUploadInput: vi.fn()
}));

vi.mock('worker-timers', () => ({
    setInterval: vi.fn(),
    clearInterval: vi.fn()
}));

vi.mock('vue-sonner', () => ({
    toast: {
        info: vi.fn(),
        warning: vi.fn(),
        dismiss: vi.fn()
    }
}));

// Import AFTER mocks
import { useGalleryStore } from '../gallery.js';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function createPrints(count) {
    const prints = [];

    for (let i = 0; i < count; i++) {
        prints.push({
            id: `prnt_${i}`,
            timestamp: new Date(
                2026,
                0,
                1,
                0,
                i
            ).toISOString()
        });
    }

    return prints;
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe('automatic old print deletion', () => {
    beforeEach(() => {
        setActivePinia(createPinia());

        vi.clearAllMocks();

        advancedSettingsStore.autoDeleteOldPrints = true;

        deletePrint.mockResolvedValue({
            printId: ''
        });

        getPrintFavorites.mockResolvedValue([]);
    });

    test('does nothing when auto delete is disabled', async () => {
        advancedSettingsStore.autoDeleteOldPrints = false;

        const galleryStore = useGalleryStore();

        await galleryStore.tryDeleteOldPrints();

        expect(getPrints).not.toHaveBeenCalled();
        expect(deletePrint).not.toHaveBeenCalled();
    });

    test('does nothing when print count is below the limit', async () => {
        getPrints.mockResolvedValue({
            json: createPrints(60)
        });

        const galleryStore = useGalleryStore();

        await galleryStore.tryDeleteOldPrints();

        expect(deletePrint).not.toHaveBeenCalled();
    });

    test('deletes the oldest non-favorite prints', async () => {
        /*
         * Limit is 62.
         * 64 prints means two prints need to be deleted.
         *
         * prnt_0 = oldest
         * prnt_1 = second oldest
         *
         * Both are favorited, so auto deletion should skip them
         * and delete prnt_2 and prnt_3 instead.
         */

        getPrints.mockResolvedValue({
            json: createPrints(64)
        });

        getPrintFavorites.mockResolvedValue([
            { printId: 'prnt_0' },
            { printId: 'prnt_1' }
        ]);

        const galleryStore = useGalleryStore();

        await galleryStore.tryDeleteOldPrints();

        expect(deletePrint).toHaveBeenCalledTimes(2);

        expect(deletePrint).toHaveBeenNthCalledWith(
            1,
            'prnt_2'
        );

        expect(deletePrint).toHaveBeenNthCalledWith(
            2,
            'prnt_3'
        );

        expect(deletePrint).not.toHaveBeenCalledWith(
            'prnt_0'
        );

        expect(deletePrint).not.toHaveBeenCalledWith(
            'prnt_1'
        );
    });

    test('never automatically deletes favorite prints', async () => {
        getPrints.mockResolvedValue({
            json: createPrints(64)
        });

        getPrintFavorites.mockResolvedValue([
            { printId: 'prnt_0' },
            { printId: 'prnt_1' },
            { printId: 'prnt_2' }
        ]);

        const galleryStore = useGalleryStore();

        await galleryStore.tryDeleteOldPrints();

        expect(deletePrint).not.toHaveBeenCalledWith(
            'prnt_0'
        );

        expect(deletePrint).not.toHaveBeenCalledWith(
            'prnt_1'
        );

        expect(deletePrint).not.toHaveBeenCalledWith(
            'prnt_2'
        );
    });

    test('logs a warning when all prints are favorites', async () => {
        const prints = createPrints(64);

        getPrints.mockResolvedValue({
            json: prints
        });

        getPrintFavorites.mockResolvedValue(
            prints.map((print) => ({
                printId: print.id
            }))
        );

        const logSpy = vi
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const galleryStore = useGalleryStore();

        await galleryStore.tryDeleteOldPrints();

        expect(deletePrint).not.toHaveBeenCalled();

        expect(logSpy).toHaveBeenCalledWith(
            'Unable to automatically delete enough old prints because 2 print(s) are protected by favorites.'
        );

        logSpy.mockRestore();
    });

    test('deletes available prints and warns when there are not enough', async () => {
        const prints = createPrints(64);

        /*
         * Only prnt_63 is not favorited.
         * We need to delete 2 prints, but only one is available.
         */
        getPrints.mockResolvedValue({
            json: prints
        });

        getPrintFavorites.mockResolvedValue(
            prints
                .filter((print) => print.id !== 'prnt_63')
                .map((print) => ({
                    printId: print.id
                }))
        );

        const logSpy = vi
            .spyOn(console, 'log')
            .mockImplementation(() => {});

        const galleryStore = useGalleryStore();

        await galleryStore.tryDeleteOldPrints();

        expect(deletePrint).toHaveBeenCalledTimes(1);
        expect(deletePrint).toHaveBeenCalledWith(
            'prnt_63'
        );

        expect(logSpy).toHaveBeenCalledWith(
            'Unable to automatically delete enough old prints because 1 print(s) are protected by favorites.'
        );

        logSpy.mockRestore();
    });
});