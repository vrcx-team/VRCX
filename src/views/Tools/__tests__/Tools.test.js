import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

const push = vi.fn();
const showGalleryPage = vi.fn();
const showVRChatConfig = vi.fn();
const showLaunchOptions = vi.fn();
const showRegistryBackupDialog = vi.fn();
const getString = vi.fn();
const setString = vi.fn();
const friends = ref([]);
let routeName = 'not-tools';

vi.mock('vue-router', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useRouter: () => ({ push }),
        useRoute: () => ({
            get name() {
                return routeName;
            }
        })
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({ t: (key) => key })
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('../../../stores', () => ({
    useFriendStore: () => ({ friends }),
    useGalleryStore: () => ({ showGalleryPage }),
    useToolsStore: () => ({ openDialog: vi.fn() }),
    useAdvancedSettingsStore: () => ({ showVRChatConfig }),
    useLaunchStore: () => ({ showLaunchOptions }),
    useVrcxStore: () => ({ showRegistryBackupDialog })
}));

vi.mock('../../../composables/useToolNavPinning', () => ({
    useToolNavPinning: () => ({
        pinToolToNav: vi.fn(),
        pinnedToolKeys: new Set(),
        refreshPinnedState: vi.fn().mockResolvedValue(undefined),
        unpinToolFromNav: vi.fn()
    })
}));

vi.mock('../../../services/config.js', () => ({
    default: {
        getString: (...args) => getString(...args),
        setString: (...args) => setString(...args)
    }
}));

vi.mock('../dialogs/AutoChangeStatusDialog.vue', () => ({
    default: { template: '<div />' }
}));

vi.mock('../../../components/ui/tooltip', () => ({
    TooltipWrapper: {
        template: '<div><slot /></div>',
        props: ['content', 'disabled', 'side']
    }
}));

import Tools from '../Tools.vue';

function findToolItemByTitle(wrapper, titleKey) {
    return wrapper
        .findAllComponents({ name: 'ToolItem' })
        .find((component) => component.text().includes(titleKey));
}

function findCategoryHeaderByTitle(wrapper, titleKey) {
    return wrapper
        .findAll('div.cursor-pointer')
        .find((node) => node.text().includes(titleKey));
}

describe('Tools.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        routeName = 'not-tools';
        getString.mockResolvedValue('{}');
    });

    test('clicking screenshot tool navigates to screenshot metadata', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const screenshotItem = findToolItemByTitle(
            wrapper,
            'view.tools.pictures.screenshot'
        );

        expect(screenshotItem).toBeTruthy();
        await screenshotItem.trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'screenshot-metadata' });
    });

    test('clicking gallery tool calls showGalleryPage', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const galleryItem = findToolItemByTitle(
            wrapper,
            'view.tools.pictures.gallery'
        );

        expect(galleryItem).toBeTruthy();
        await galleryItem.trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'gallery' });
    });

    test('toggle category persists collapsed state', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const imageCategoryHeader = findCategoryHeaderByTitle(
            wrapper,
            'view.tools.pictures.header'
        );

        expect(imageCategoryHeader).toBeTruthy();
        await imageCategoryHeader.trigger('click');

        expect(setString).toHaveBeenCalledWith(
            'VRCX_toolsCategoryCollapsed',
            expect.stringContaining('"image":true')
        );
    });

    test('loads stored collapsed state before toggling category', async () => {
        getString.mockResolvedValue('{"image":true}');

        const wrapper = mount(Tools);
        await flushPromises();

        const imageCategoryHeader = findCategoryHeaderByTitle(
            wrapper,
            'view.tools.pictures.header'
        );

        expect(imageCategoryHeader).toBeTruthy();
        await imageCategoryHeader.trigger('click');

        expect(setString).toHaveBeenCalledWith(
            'VRCX_toolsCategoryCollapsed',
            expect.stringContaining('"image":false')
        );
    });
});
