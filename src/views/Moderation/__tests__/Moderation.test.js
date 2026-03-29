import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const mocks = vi.hoisted(() => ({
    makeRef: (value) => ({ value, __v_isRef: true }),
    playerModerationTable: null,
    refreshPlayerModerations: vi.fn(),
    handlePlayerModerationDelete: vi.fn(),
    modalConfirm: vi.fn(),
    configGetString: vi.fn(),
    configSetString: vi.fn(),
    deletePlayerModeration: vi.fn(),
    pagination: null,
    columnHandlers: null
}));

mocks.playerModerationTable = mocks.makeRef({
    loading: false,
    data: [],
    filters: [{ value: [] }, { value: '' }]
});
mocks.pagination = mocks.makeRef({
    pageIndex: 2,
    pageSize: 10
});

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: require('vue').ref('en')
    })
}));

vi.mock('../../../stores', () => ({
    useModerationStore: () => ({
        playerModerationTable: mocks.playerModerationTable,
        refreshPlayerModerations: (...args) =>
            mocks.refreshPlayerModerations(...args),
        handlePlayerModerationDelete: (...args) =>
            mocks.handlePlayerModerationDelete(...args)
    }),
    useAppearanceSettingsStore: () => ({
        tablePageSizes: [10, 25, 50],
        tablePageSize: 25
    }),
    useModalStore: () => ({
        confirm: (...args) => mocks.modalConfirm(...args)
    }),
    useVrcxStore: () => ({
        maxTableSize: 100
    })
}));

vi.mock('../../../services/config.js', () => ({
    default: {
        getString: (...args) => mocks.configGetString(...args),
        setString: (...args) => mocks.configSetString(...args)
    }
}));

vi.mock('../../../api', () => ({
    playerModerationRequest: {
        deletePlayerModeration: (...args) =>
            mocks.deletePlayerModeration(...args)
    }
}));

vi.mock('../../../coordinators/moderationCoordinator', () => ({
    runRefreshPlayerModerationsFlow: (...args) =>
        mocks.refreshPlayerModerations(...args)
}));

vi.mock('../../../shared/constants', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        moderationTypes: ['block', 'mute', 'unmute']
    };
});

vi.mock('../columns.jsx', () => ({
    createColumns: (handlers) => {
        mocks.columnHandlers = handlers;
        return [];
    }
}));

vi.mock('../../../lib/table/useVrcxVueTable', () => ({
    useVrcxVueTable: (options) => ({
        table: {
            getFilteredRowModel: () => ({ rows: options.data })
        },
        pagination: mocks.pagination
    })
}));

vi.mock('@/components/ui/select', () => ({
    Select: {
        template: '<div><slot /></div>'
    },
    SelectContent: { template: '<div><slot /></div>' },
    SelectGroup: { template: '<div><slot /></div>' },
    SelectItem: { template: '<div><slot /></div>' },
    SelectTrigger: { template: '<div><slot /></div>' },
    SelectValue: { template: '<div><slot /></div>' }
}));

vi.mock('@/components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template:
            '<button data-testid="moderation-button" @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('@/components/ui/input-group', () => ({
    InputGroupField: {
        template: '<input />'
    }
}));

vi.mock('@/components/ui/spinner', () => ({
    Spinner: { template: '<span />' }
}));

vi.mock('lucide-vue-next', () => ({
    RefreshCw: { template: '<span />' }
}));

vi.mock('@/components/ui/data-table', () => ({
    DataTableLayout: {
        props: ['totalItems'],
        template:
            '<div data-testid="moderation-layout">' +
            '<span data-testid="total-items">{{ totalItems }}</span>' +
            '</div>'
    }
}));

vi.mock('@/components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));

import Moderation from '../Moderation.vue';

function mountModeration() {
    return mount(Moderation, {
        global: {
            stubs: {
                TooltipWrapper: { template: '<div><slot /></div>' }
            }
        }
    });
}

async function flushAsync() {
    await Promise.resolve();
    await Promise.resolve();
    await nextTick();
}

describe('Moderation.vue', () => {
    beforeEach(() => {
        mocks.playerModerationTable.value = {
            loading: false,
            data: [],
            filters: [{ value: [] }, { value: '' }]
        };
        mocks.pagination.value = { pageIndex: 2, pageSize: 10 };
        mocks.columnHandlers = null;

        mocks.refreshPlayerModerations.mockReset();
        mocks.handlePlayerModerationDelete.mockReset();
        mocks.modalConfirm.mockReset();
        mocks.configGetString.mockReset();
        mocks.configSetString.mockReset();
        mocks.deletePlayerModeration.mockReset();

        mocks.configGetString.mockResolvedValue('["block"]');
        mocks.modalConfirm.mockResolvedValue({ ok: true });
        mocks.deletePlayerModeration.mockResolvedValue({
            ok: true,
            id: 'pm_1'
        });
    });

    test('loads persisted moderation filter on init', async () => {
        mountModeration();
        await flushAsync();

        expect(mocks.configGetString).toHaveBeenCalledWith(
            'VRCX_playerModerationTableFilters',
            '[]'
        );
        expect(mocks.playerModerationTable.value.filters[0].value).toEqual([
            'block'
        ]);
    });

    test('updates moderation filter and persists value', async () => {
        mocks.configGetString.mockResolvedValueOnce('[]');
        const wrapper = mountModeration();
        await flushAsync();
        wrapper.vm.handleModerationFilterChange(['mute']);
        await nextTick();

        expect(mocks.playerModerationTable.value.filters[0].value).toEqual([
            'mute'
        ]);
        expect(mocks.configSetString).toHaveBeenCalledWith(
            'VRCX_playerModerationTableFilters',
            JSON.stringify(['mute'])
        );
    });

    test('filters table rows by type and search text', async () => {
        mocks.playerModerationTable.value.data = [
            {
                type: 'block',
                sourceDisplayName: 'Alpha',
                targetDisplayName: 'Beta'
            },
            {
                type: 'mute',
                sourceDisplayName: 'Gamma',
                targetDisplayName: 'Delta'
            },
            { type: 'mute', sourceDisplayName: 'X', targetDisplayName: 'Alice' }
        ];
        mocks.playerModerationTable.value.filters = [
            { value: ['mute'] },
            { value: 'ali' }
        ];

        const wrapper = mountModeration();
        await flushAsync();

        expect(wrapper.get('[data-testid="total-items"]').text()).toBe('1');
    });

    test('refresh button triggers moderation refresh', async () => {
        const wrapper = mountModeration();

        await wrapper.get('[data-testid="moderation-button"]').trigger('click');

        expect(mocks.refreshPlayerModerations).toHaveBeenCalledTimes(1);
    });

    test('delete handler calls API then store handler', async () => {
        mountModeration();
        const row = { targetUserId: 'usr_1', type: 'mute' };

        await mocks.columnHandlers.onDelete(row);

        expect(mocks.deletePlayerModeration).toHaveBeenCalledWith({
            moderated: 'usr_1',
            type: 'mute'
        });
        expect(mocks.handlePlayerModerationDelete).toHaveBeenCalledWith({
            ok: true,
            id: 'pm_1'
        });
    });

    test('delete prompt confirms before deletion', async () => {
        mountModeration();
        const row = { targetUserId: 'usr_2', type: 'block' };

        mocks.modalConfirm.mockResolvedValueOnce({ ok: true });
        await mocks.columnHandlers.onDeletePrompt(row);
        await flushAsync();

        expect(mocks.modalConfirm).toHaveBeenCalled();
        expect(mocks.deletePlayerModeration).toHaveBeenCalledWith({
            moderated: 'usr_2',
            type: 'block'
        });
    });

    test('resets page index when page size changes', async () => {
        const wrapper = mountModeration();
        wrapper.vm.handlePageSizeChange(50);
        await nextTick();

        expect(mocks.pagination.value).toEqual({
            pageIndex: 0,
            pageSize: 50
        });
    });
});
