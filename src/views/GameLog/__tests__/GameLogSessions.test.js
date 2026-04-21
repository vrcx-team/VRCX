import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({
    makeRef: (value) => ({ value, __v_isRef: true }),
    handleSessionsEventFilterChange: vi.fn(),
    toggleSessionsVipFilter: vi.fn(),
    setSessionsSearch: vi.fn(),
    setSessionsDateRange: vi.fn(),
    clearSessionsDateRange: vi.fn(),
    loadMoreSessionsSegments: vi.fn()
}));

const sessionsSegments = mocks.makeRef([]);
const sessionsLoading = mocks.makeRef(false);
const sessionsHasMore = mocks.makeRef(false);
const sessionsVipFilter = mocks.makeRef(false);
const sessionsSearch = mocks.makeRef('');
const sessionsDateFrom = mocks.makeRef('');
const sessionsDateTo = mocks.makeRef('');
const sessionsEventFilterSelection = mocks.makeRef(['All']);
const sessionsEventFilterTypes = mocks.makeRef([
    'OnPlayerJoined',
    'OnPlayerLeft',
    'VideoPlay'
]);
const sessionsDateRangeMaxDays = mocks.makeRef(7);
const weekStartsOn = mocks.makeRef(0);

vi.mock('pinia', () => ({
    storeToRefs: (store) => store
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key) => key,
        locale: 'en-US'
    })
}));

vi.mock('@internationalized/date', () => ({
    getLocalTimeZone: () => 'UTC',
    today: () => ({}),
    fromDate: (date) => date,
    toDate: (date) => date
}));

vi.mock('../../../stores', () => ({
    useGameLogStore: () => ({
        sessionsSegments,
        sessionsLoading,
        sessionsHasMore,
        sessionsVipFilter,
        sessionsSearch,
        sessionsDateFrom,
        sessionsDateTo,
        sessionsEventFilterSelection,
        sessionsEventFilterTypes,
        sessionsDateRangeMaxDays,
        toggleSessionsVipFilter: (...args) =>
            mocks.toggleSessionsVipFilter(...args),
        handleSessionsEventFilterChange: (...args) =>
            mocks.handleSessionsEventFilterChange(...args),
        setSessionsSearch: (...args) => mocks.setSessionsSearch(...args),
        setSessionsDateRange: (...args) => mocks.setSessionsDateRange(...args),
        clearSessionsDateRange: (...args) =>
            mocks.clearSessionsDateRange(...args),
        loadMoreSessionsSegments: (...args) =>
            mocks.loadMoreSessionsSegments(...args)
    }),
    useAppearanceSettingsStore: () => ({
        weekStartsOn
    })
}));

vi.mock('../../../components/ui/toggle', () => ({
    Toggle: {
        props: ['modelValue'],
        emits: ['update:modelValue'],
        template:
            '<button data-testid="vip-toggle" @click="$emit(\'update:modelValue\', !modelValue)"><slot /></button>'
    }
}));

vi.mock('../../../components/ui/toggle-group', () => ({
    ToggleGroup: {
        emits: ['update:model-value'],
        template:
            '<div data-testid="toggle-group">' +
            '<button data-testid="select-join" @click="$emit(\'update:model-value\', [\'OnPlayerJoined\'])">join</button>' +
            '<slot />' +
            '</div>'
    },
    ToggleGroupItem: {
        props: ['value'],
        template: '<button :data-value="value"><slot /></button>'
    }
}));

vi.mock('../../../components/ui/popover', () => ({
    Popover: {
        template: '<div><slot /></div>'
    },
    PopoverTrigger: { template: '<div><slot /></div>' },
    PopoverContent: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/ui/range-calendar', () => ({
    RangeCalendar: {
        emits: ['update:modelValue'],
        template:
            "<button data-testid=\"set-date-range\" @click=\"$emit('update:modelValue', { start: { toDate: () => new Date('2026-04-01T00:00:00.000Z') }, end: { toDate: () => new Date('2026-04-02T00:00:00.000Z') } })\">range</button>"
    }
}));

vi.mock('../../../components/ui/input-group', () => ({
    InputGroupField: {
        props: ['modelValue'],
        emits: ['update:modelValue', 'change', 'keyup.enter'],
        template:
            '<input data-testid="sessions-search" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @change="$emit(\'change\')" />'
    }
}));

vi.mock('../../../components/ui/button', () => ({
    Button: {
        emits: ['click'],
        template: '<button @click="$emit(\'click\')"><slot /></button>'
    }
}));

vi.mock('../../../components/ui/data-table/DataTableEmpty.vue', () => ({
    default: { template: '<div data-testid="data-table-empty" />' }
}));

vi.mock('../../../components/ui/badge', () => ({
    Badge: { template: '<span><slot /></span>' }
}));

vi.mock('../../../components/ui/tooltip', () => ({
    TooltipWrapper: { template: '<div><slot /></div>' }
}));

vi.mock('../../../components/ui/skeleton', () => ({
    Skeleton: { template: '<div />' }
}));

vi.mock('../../../components/ui/spinner', () => ({
    Spinner: { template: '<div />' }
}));

vi.mock('../components/GameLogSessionsSegment.vue', () => ({
    default: { template: '<div />' }
}));

vi.mock('lucide-vue-next', () => ({
    CalendarRange: { template: '<span />' },
    Star: { template: '<span />' },
    Inbox: { template: '<span />' },
    SearchAlert: { template: '<span />' }
}));

import GameLogSessions from '../components/GameLogSessions.vue';

function clickButtonByText(wrapper, text) {
    const button = wrapper
        .findAll('button')
        .find((node) => node.text().includes(text));
    if (!button) {
        throw new Error(`Cannot find button with text: ${text}`);
    }
    return button.trigger('click');
}

describe('GameLogSessions.vue', () => {
    beforeEach(() => {
        sessionsSearch.value = '';
        sessionsDateFrom.value = '';
        sessionsDateTo.value = '';
        sessionsEventFilterSelection.value = ['All'];
        mocks.handleSessionsEventFilterChange.mockReset();
        mocks.toggleSessionsVipFilter.mockReset();
        mocks.setSessionsSearch.mockReset();
        mocks.setSessionsDateRange.mockReset();
        mocks.clearSessionsDateRange.mockReset();
        mocks.loadMoreSessionsSegments.mockReset();
        global.IntersectionObserver = class {
            disconnect() {}
            observe() {}
        };
    });

    test('updates event filters via toggle group', async () => {
        const wrapper = mount(GameLogSessions);

        await wrapper.get('[data-testid="select-join"]').trigger('click');

        expect(mocks.handleSessionsEventFilterChange).toHaveBeenCalledWith([
            'OnPlayerJoined'
        ]);
    });

    test('applies sessions search on change', async () => {
        const wrapper = mount(GameLogSessions);
        const input = wrapper.get('[data-testid="sessions-search"]');

        await input.setValue('alice');
        await input.trigger('change');

        expect(mocks.setSessionsSearch).toHaveBeenCalledWith('alice');
    });

    test('applies date range from calendar', async () => {
        const wrapper = mount(GameLogSessions);

        await wrapper.get('[data-testid="set-date-range"]').trigger('click');
        await clickButtonByText(wrapper, 'common.actions.confirm');

        expect(mocks.setSessionsDateRange).toHaveBeenCalledTimes(1);
        expect(mocks.setSessionsDateRange.mock.calls[0][0]).toContain('T');
        expect(mocks.setSessionsDateRange.mock.calls[0][1]).toContain('T');
    });
});
