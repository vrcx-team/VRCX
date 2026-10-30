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
    return wrapper.findAllComponents({ name: 'ToolItem' }).find((component) => component.text().includes(titleKey));
}

function findCategoryHeaderByTitle(wrapper, titleKey) {
    return wrapper.findAll('div.cursor-pointer').find((node) => node.text().includes(titleKey));
}

describe('Tools.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        routeName = 'not-tools';
        getString.mockResolvedValue('{}');
    });

    test('hides VRChat-only tools and the categories they leave empty', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        expect(findToolItemByTitle(wrapper, 'view.tools.pictures.screenshot')).toBeFalsy();
        expect(findToolItemByTitle(wrapper, 'view.tools.pictures.gallery')).toBeFalsy();
        expect(findCategoryHeaderByTitle(wrapper, 'view.tools.pictures.header')).toBeFalsy();
    });

    test('toggle category persists collapsed state', async () => {
        const wrapper = mount(Tools);
        await flushPromises();

        const shortcutsCategoryHeader = findCategoryHeaderByTitle(wrapper, 'view.tools.shortcuts.header');

        expect(shortcutsCategoryHeader).toBeTruthy();
        await shortcutsCategoryHeader.trigger('click');

        expect(setString).toHaveBeenCalledWith(
            'VRCX_toolsCategoryCollapsed',
            expect.stringContaining('"shortcuts":true')
        );
    });

    test('loads stored collapsed state before toggling category', async () => {
        getString.mockResolvedValue('{"shortcuts":true}');

        const wrapper = mount(Tools);
        await flushPromises();

        const shortcutsCategoryHeader = findCategoryHeaderByTitle(wrapper, 'view.tools.shortcuts.header');

        expect(shortcutsCategoryHeader).toBeTruthy();
        await shortcutsCategoryHeader.trigger('click');

        expect(setString).toHaveBeenCalledWith(
            'VRCX_toolsCategoryCollapsed',
            expect.stringContaining('"shortcuts":false')
        );
    });
});
