import { beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: {
        value: { currentAvatar: 'avtr_current', $previousAvatarSwapTime: 0 },
        __v_isRef: true
    },
    modalConfirm: vi.fn(),
    configGetString: vi.fn(),
    configSetString: vi.fn(),
    processBulk: vi.fn(),
    applyAvatar: vi.fn((json) => ({ ...json })),
    selectAvatarWithoutConfirmation: vi.fn(),
    showAvatarDialog: vi.fn(),
    getAllAvatarTags: vi.fn(),
    getAvatarTimeSpent: vi.fn(),
    virtualMeasure: vi.fn()
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key
    })
}));

vi.mock('vue-sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../../../plugins/router', () => ({
    router: {
        push: vi.fn(),
        replace: vi.fn(),
        beforeEach: vi.fn(),
        currentRoute: ref({ path: '/', name: '' }),
        isReady: vi.fn().mockResolvedValue(true)
    },
    initRouter: vi.fn()
}));

vi.mock('@tanstack/vue-virtual', () => ({
    useVirtualizer: () => ({
        value: {
            getVirtualItems: () => [{ key: 0, index: 0, start: 0 }],
            getTotalSize: () => 100,
            measure: (...args) => mocks.virtualMeasure(...args),
            measureElement: vi.fn()
        }
    })
}));

vi.mock('../../../stores', () => ({
    useAppearanceSettingsStore: () => ({
        tablePageSizes: [10, 25, 50],
        tablePageSize: 25
    }),
    useAvatarStore: () => ({}),
    useModalStore: () => ({
        confirm: (...args) => mocks.modalConfirm(...args),
        prompt: vi.fn()
    }),
    useUserStore: () => ({
        currentUser: mocks.currentUser
    })
}));

vi.mock('../../../coordinators/avatarCoordinator', () => ({
    applyAvatar: (...args) => mocks.applyAvatar(...args),
    selectAvatarWithoutConfirmation: (...args) =>
        mocks.selectAvatarWithoutConfirmation(...args),
    showAvatarDialog: (...args) => mocks.showAvatarDialog(...args)
}));

vi.mock('../../../coordinators/imageUploadCoordinator', () => ({
    handleImageUploadInput: () => ({ file: null, clearInput: vi.fn() }),
    resizeImageToFitLimits: vi.fn(),
    uploadImageLegacy: vi.fn()
}));

vi.mock('../../../shared/utils/imageUpload', () => ({
    readFileAsBase64: vi.fn(),
    withUploadTimeout: async (promise) => promise
}));

vi.mock('../../../api', () => ({
    avatarRequest: {
        getAvatars: vi.fn(),
        saveAvatar: vi.fn(),
        createImposter: vi.fn(),
        uploadAvatarImage: vi.fn()
    }
}));

vi.mock('../../../services/database', () => ({
    database: {
        getAllAvatarTags: (...args) => mocks.getAllAvatarTags(...args),
        getAvatarTimeSpent: (...args) => mocks.getAvatarTimeSpent(...args),
        addAvatarTag: vi.fn(),
        removeAvatarTag: vi.fn(),
        updateAvatarTagColor: vi.fn()
    }
}));

vi.mock('../columns.jsx', () => ({
    getColumns: () => []
}));

vi.mock('../../../shared/utils/avatar', () => ({
    getPlatformInfo: () => ({})
}));

vi.mock('../../../shared/constants', () => ({
    getTagColor: () => ({ bg: '#000', text: '#fff' })
}));

vi.mock('../../../services/request', () => ({
    processBulk: (...args) => mocks.processBulk(...args)
}));

vi.mock('../composables/useAvatarCardGrid.js', () => ({
    useAvatarCardGrid: () => ({
        cardScale: ref(0.6),
        cardSpacing: ref(1),
        cardScalePercent: ref(60),
        cardSpacingPercent: ref(100),
        cardScaleValue: ref([0.6]),
        cardSpacingValue: ref([1]),
        scaleSlider: { min: 0.3, max: 0.9, step: 0.05 },
        spacingSlider: { min: 0.5, max: 1.5, step: 0.05 },
        gridContainerRef: ref(null),
        gridStyle: ref(() => ({ '--avatar-grid-columns': '1' })),
        chunkIntoRows: (items, prefix = 'row') =>
            Array.isArray(items)
                ? items.map((item, index) => ({
                      key: `${prefix}:${index}`,
                      items: [item]
                  }))
                : [],
        estimateRowHeight: () => 80,
        updateContainerWidth: vi.fn()
    })
}));

vi.mock('../../../lib/table/useVrcxVueTable', () => ({
    useVrcxVueTable: () => ({
        table: {},
        pagination: ref({ pageIndex: 0, pageSize: 25 })
    })
}));

vi.mock('../../../services/config.js', () => ({
    default: {
        getString: (...args) => mocks.configGetString(...args),
        setString: (...args) => mocks.configSetString(...args)
    }
}));

vi.mock('../../../components/ui/context-menu', () => ({
    ContextMenuContent: { template: '<div><slot /></div>' },
    ContextMenuItem: { template: '<button><slot /></button>' },
    ContextMenuSeparator: { template: '<hr />' }
}));

vi.mock('../../../components/ui/dropdown-menu', () => ({
    DropdownMenu: { template: '<div><slot /></div>' },
    DropdownMenuContent: { template: '<div><slot /></div>' },
    DropdownMenuTrigger: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/ui/field', () => ({
    Field: { template: '<div><slot /></div>' },
    FieldContent: { template: '<div><slot /></div>' },
    FieldLabel: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/ui/popover', () => ({
    Popover: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' },
    PopoverTrigger: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/ui/data-table', () => ({
    DataTableEmpty: { template: '<div data-testid="empty">empty</div>' },
    DataTableLayout: { template: '<div data-testid="table-layout">table</div>' }
}));

vi.mock('../../../components/ui/toggle-group', () => ({
    ToggleGroup: {
        emits: ['update:model-value'],
        template:
            '<div data-testid="toggle-group">' +
            '<button data-testid="set-table" @click="$emit(\'update:model-value\', \'table\')">table</button>' +
            '<slot />' +
            '</div>'
    },
    ToggleGroupItem: { template: '<button><slot /></button>' }
}));

vi.mock('../../../components/ui/badge', () => ({
    Badge: { template: '<span><slot /></span>' }
}));

vi.mock('../../../components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="button" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('../../../components/ui/input', () => ({
    Input: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<input data-testid="search-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
    }
}));

vi.mock('../../../components/ui/slider', () => ({
    Slider: { template: '<div />' }
}));

vi.mock('../../../components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/dialogs/ImageCropDialog.vue', () => ({
    default: { template: '<div />' }
}));

vi.mock('../ManageTagsDialog.vue', () => ({
    default: { template: '<div />' }
}));

vi.mock('../components/MyAvatarCard.vue', () => ({
    default: {
        props: ['avatar'],
        emits: ['click', 'context-action'],
        template:
            '<button data-testid="avatar-card" @click="$emit(\'click\')">{{ avatar.name }}</button>'
    }
}));

vi.mock('lucide-vue-next', () => ({
    Check: { template: '<i />' },
    Eye: { template: '<i />' },
    Image: { template: '<i />' },
    LayoutGrid: { template: '<i />' },
    List: { template: '<i />' },
    ListFilter: { template: '<i />' },
    Pencil: { template: '<i />' },
    RefreshCw: { template: '<i />' },
    Settings: { template: '<i />' },
    Tag: { template: '<i />' },
    User: { template: '<i />' }
}));

import MyAvatars from '../MyAvatars.vue';

async function flushAll() {
    await flushPromises();
    await nextTick();
    await nextTick();
}

describe('MyAvatars.vue', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.currentUser.value = {
            currentAvatar: 'avtr_current',
            $previousAvatarSwapTime: 0
        };
        mocks.modalConfirm.mockResolvedValue({ ok: true });
        mocks.configGetString.mockImplementation((key, defaultValue) => {
            if (key === 'VRCX_MyAvatarsViewMode') {
                return Promise.resolve('grid');
            }
            return Promise.resolve(defaultValue ?? '');
        });
        mocks.getAllAvatarTags.mockResolvedValue(
            new Map([['avtr_1', [{ tag: 'fun', color: null }]]])
        );
        mocks.getAvatarTimeSpent.mockResolvedValue({ timeSpent: 1000 });
        mocks.processBulk.mockImplementation(async ({ handle, done }) => {
            handle({
                json: [
                    {
                        id: 'avtr_1',
                        name: 'Avatar One',
                        releaseStatus: 'public',
                        unityPackages: [],
                        updated_at: '2025-01-01T00:00:00.000Z',
                        created_at: '2024-01-01T00:00:00.000Z'
                    }
                ]
            });
            await done();
        });
    });

    test('loads table view mode from config', async () => {
        mocks.configGetString.mockImplementation((key, defaultValue) => {
            if (key === 'VRCX_MyAvatarsViewMode') {
                return Promise.resolve('table');
            }
            return Promise.resolve(defaultValue ?? '');
        });

        const wrapper = mount(MyAvatars);
        await flushAll();

        expect(wrapper.find('[data-testid="table-layout"]').exists()).toBe(
            true
        );
    });

    test('persists view mode when toggled', async () => {
        const wrapper = mount(MyAvatars);
        await flushAll();

        await wrapper.get('[data-testid="set-table"]').trigger('click');

        expect(mocks.configSetString).toHaveBeenCalledWith(
            'VRCX_MyAvatarsViewMode',
            'table'
        );
    });

    test('confirms and selects avatar when grid card is clicked', async () => {
        const wrapper = mount(MyAvatars);
        await flushAll();

        await wrapper.get('[data-testid="avatar-card"]').trigger('click');
        await flushAll();

        expect(mocks.modalConfirm).toHaveBeenCalled();
        expect(mocks.selectAvatarWithoutConfirmation).toHaveBeenCalledWith(
            'avtr_1'
        );
    });
});
