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

vi.mock('vue-router', () => ({
    useRouter: () => ({ push }),
    useRoute: () => ({ name: 'not-tools' })
}));

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

describe('Tools.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getString.mockResolvedValue('{}');
    });

    test('clicking screenshot tool navigates to screenshot metadata', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const screenshotItem = wrapper.findAllComponents({ name: 'ToolItem' })[0];
        await screenshotItem.trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'screenshot-metadata' });
    });

    test('clicking inventory tool calls showGalleryPage', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const inventoryItem = wrapper.findAllComponents({ name: 'ToolItem' })[1];
        await inventoryItem.trigger('click');

        expect(showGalleryPage).toHaveBeenCalled();
    });

    test('toggle category persists collapsed state', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const firstCategoryHeader = wrapper.find('.category-header');
        await firstCategoryHeader.trigger('click');

        expect(setString).toHaveBeenCalledWith(
            'VRCX_toolsCategoryCollapsed',
            expect.any(String)
        );
    });
});
