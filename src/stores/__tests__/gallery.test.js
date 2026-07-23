import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import en from '../../localization/en.json';

vi.mock('../../plugins/router', () => ({
    router: { beforeEach: vi.fn(), push: vi.fn(), replace: vi.fn() },
    initRouter: vi.fn()
}));
vi.mock('../../services/appConfig', () => ({ AppDebug: false }));
vi.mock('../../coordinators/imageUploadCoordinator', () => ({
    handleImageUploadInput: vi.fn()
}));
vi.mock('../../services/watchState', () => ({
    watchState: { isLoggedIn: false }
}));
vi.mock('vue-i18n', async (importOriginal) => {
    const actual = await importOriginal();
    const i18n = actual.createI18n({
        locale: 'en',
        fallbackLocale: 'en',
        legacy: false,
        missingWarn: false,
        fallbackWarn: false,
        messages: { en }
    });
    return { ...actual, useI18n: () => i18n.global };
});

const mockFetch = vi.fn();
function makeApiMock() {
    return {
        inventoryRequest: {},
        queryRequest: { fetch: (...args) => mockFetch(...args) },
        vrcPlusIconRequest: {},
        vrcPlusImageRequest: {}
    };
}
vi.mock('../../api', () => makeApiMock());
vi.mock('../../api/', () => makeApiMock());

const lastLocation = {
    name: 'The Black Cat',
    location: 'wrld_12345678-1234-1234-1234-1234567890ab:4269~region(use)'
};
vi.mock('../settings/advanced', () => ({
    useAdvancedSettingsStore: () => ({ ugcFolderPath: 'C:\\ugc' })
}));
vi.mock('../location', () => ({
    useLocationStore: () => ({ lastLocation })
}));
vi.mock('../modal', () => ({ useModalStore: () => ({ prompt: vi.fn() }) }));

import { useGalleryStore } from '../gallery';

const mockSaveStickerToFile = vi.fn();

describe('useGalleryStore - trySaveStickerToFile metadata', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        globalThis.AppApi = { SaveStickerToFile: mockSaveStickerToFile };
        mockSaveStickerToFile.mockResolvedValue('C:\\ugc\\2026-06\\saved.png');
        mockFetch.mockResolvedValue({
            json: {
                itemType: 'sticker',
                flags: ['ugc'],
                imageUrl: 'https://example.com/sticker.png',
                created_at: '2026-06-25T12:34:56.000Z'
            }
        });
    });

    function getMetadataArg() {
        const call = mockSaveStickerToFile.mock.calls[0];
        return JSON.parse(call[4]);
    }

    test('uses the sticker placer as the metadata author', async () => {
        const store = useGalleryStore();

        await store.trySaveStickerToFile(
            'Alice',
            'usr_aaaa',
            'inv_1111',
            '2026-06-25T12:34:56.000Z'
        );

        expect(mockSaveStickerToFile).toHaveBeenCalledOnce();
        const meta = getMetadataArg();
        expect(meta.application).toBe('VRCX');
        expect(meta.version).toBe(1);
        expect(meta.author).toEqual({ id: 'usr_aaaa', displayName: 'Alice' });
        expect(meta.inventoryId).toBe('inv_1111');
        expect(meta.spawnTime).toBe('2026-06-25T12:34:56.000Z');
    });

    test('derives world fields from the current location via parseLocation', async () => {
        const store = useGalleryStore();

        await store.trySaveStickerToFile(
            'Alice',
            'usr_aaaa',
            'inv_2222',
            '2026-06-25T12:34:56.000Z'
        );

        const meta = getMetadataArg();
        expect(meta.world.name).toBe('The Black Cat');
        expect(meta.world.id).toBe('wrld_12345678-1234-1234-1234-1234567890ab');
        expect(meta.world.instanceName).toBe('4269');
        expect(meta.world.accessType).toBe('public');
        expect(meta.world.region).toBe('use');
        expect(meta.world.groupId).toBeNull();
        expect(meta.world.ageGate).toBe(false);
    });

    test('skips non-sticker inventory items without writing a file', async () => {
        mockFetch.mockResolvedValue({
            json: { itemType: 'prop', flags: ['ugc'] }
        });
        const store = useGalleryStore();

        await store.trySaveStickerToFile(
            'Alice',
            'usr_aaaa',
            'inv_3333',
            '2026-06-25T12:34:56.000Z'
        );

        expect(mockSaveStickerToFile).not.toHaveBeenCalled();
    });

    test('does not re-save an inventory id already in the cache', async () => {
        const store = useGalleryStore();

        await store.trySaveStickerToFile('Alice', 'usr_aaaa', 'inv_dupe', 'dt');
        await store.trySaveStickerToFile('Alice', 'usr_aaaa', 'inv_dupe', 'dt');

        expect(mockSaveStickerToFile).toHaveBeenCalledOnce();
    });
});

describe('useGalleryStore - sticker world metadata per instance type', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        globalThis.AppApi = { SaveStickerToFile: mockSaveStickerToFile };
        mockSaveStickerToFile.mockResolvedValue('C:\\ugc\\2026-06\\saved.png');
        mockFetch.mockResolvedValue({
            json: {
                itemType: 'sticker',
                flags: ['ugc'],
                imageUrl: 'https://example.com/sticker.png',
                created_at: '2026-06-25T12:34:56.000Z'
            }
        });
    });

    async function worldMetaFor(locationTag, worldName, inventoryId) {
        lastLocation.name = worldName;
        lastLocation.location = locationTag;
        const store = useGalleryStore();
        await store.trySaveStickerToFile(
            'Alice',
            'usr_placer',
            inventoryId,
            '2026-06-25T12:34:56.000Z'
        );
        return JSON.parse(mockSaveStickerToFile.mock.calls[0][4]).world;
    }

    test('public: no owner, region from tag', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269~region(use)',
            'Public World',
            'inv_pub'
        );
        expect(world.accessType).toBe('public');
        expect(world.instanceName).toBe('4269');
        expect(world.userId).toBeNull();
        expect(world.groupId).toBeNull();
        expect(world.region).toBe('use');
        expect(world.ageGate).toBe(false);
    });

    test('public without region tag: region stays empty', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269',
            'No Region World',
            'inv_noreg'
        );
        expect(world.accessType).toBe('public');
        expect(world.region).toBe('');
    });

    test('group only (members): group instance, no user owner', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269~group(grp_xyz)~region(use)',
            'Group World',
            'inv_grp'
        );
        expect(world.accessType).toBe('group');
        expect(world.userId).toBeNull();
        expect(world.groupId).toBe('grp_xyz');
    });

    test('group public: refined access name', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269~group(grp_xyz)~groupAccessType(public)~region(eu)',
            'Group World',
            'inv_grppub'
        );
        expect(world.accessType).toBe('groupPublic');
        expect(world.userId).toBeNull();
        expect(world.region).toBe('eu');
    });

    test('friends: owner captured in userId', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269~friends(usr_owner)~region(jp)',
            'Friends World',
            'inv_fr'
        );
        expect(world.accessType).toBe('friends');
        expect(world.userId).toBe('usr_owner');
        expect(world.region).toBe('jp');
    });

    test('invite+: owner captured, access name invite+', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269~private(usr_owner)~canRequestInvite',
            'Invite World',
            'inv_inv'
        );
        expect(world.accessType).toBe('invite+');
        expect(world.userId).toBe('usr_owner');
    });

    test('ageGate flag captured for an age-gated instance', async () => {
        const world = await worldMetaFor(
            'wrld_abc:4269~group(grp_xyz)~groupAccessType(public)~ageGate~region(eu)',
            'Age Gated World',
            'inv_ag'
        );
        expect(world.ageGate).toBe(true);
        expect(world.groupId).toBe('grp_xyz');
        expect(world.accessType).toBe('groupPublic');
    });
});
