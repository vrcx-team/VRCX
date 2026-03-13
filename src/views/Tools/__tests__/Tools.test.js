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
    useGalleryStore: () => ({ showGalleryPage })
}));

vi.mock('../../../stores/settings/advanced', () => ({
    useAdvancedSettingsStore: () => ({ showVRChatConfig })
}));

vi.mock('../../../stores/launch', () => ({
    useLaunchStore: () => ({ showLaunchOptions })
}));

vi.mock('../../../stores/vrcx', () => ({
    useVrcxStore: () => ({ showRegistryBackupDialog })
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

    test('clicking inventory tool calls showGalleryPage', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const inventoryItem = findToolItemByTitle(
            wrapper,
            'view.tools.pictures.inventory'
        );

        expect(inventoryItem).toBeTruthy();
        await inventoryItem.trigger('click');

        expect(showGalleryPage).toHaveBeenCalled();
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
