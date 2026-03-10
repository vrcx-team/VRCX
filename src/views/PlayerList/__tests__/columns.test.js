import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    openExternalLink: vi.fn(),
    userImage: vi.fn(),
    getFaviconUrl: vi.fn((link) => `https://icon/${encodeURIComponent(link)}`),
    sortAlphabetically: vi.fn(() => 123),
    onBlockChatbox: vi.fn(),
    onUnblockChatbox: vi.fn()
}));

vi.mock('../../../plugins', () => ({
    i18n: {
        global: {
            t: (key) => key
        }
    }
}));

vi.mock('../../../shared/utils', () => ({
    openExternalLink: (...args) => mocks.openExternalLink(...args),
    userImage: (...args) => mocks.userImage(...args),
    getFaviconUrl: (...args) => mocks.getFaviconUrl(...args),
    statusClass: () => 'status-online',
    languageClass: (lang) => `lang-${lang}`
}));

vi.mock('../../../components/Timer.vue', () => ({ default: 'Timer' }));
vi.mock('../../../components/ui/button', () => ({ Button: 'Button' }));
vi.mock('../../../components/ui/tooltip', () => ({ TooltipWrapper: 'TooltipWrapper' }));
vi.mock('lucide-vue-next', () => ({
    ArrowUpDown: 'ArrowUpDown',
    Monitor: 'Monitor',
    Smartphone: 'Smartphone',
    Apple: 'Apple',
    IdCard: 'IdCard'
}));

import { createColumns } from '../columns.jsx';

function createElement(type, props, ...children) {
    return {
        type,
        props: props ?? {},
        children: children.flat()
    };
}

function findNode(node, predicate) {
    if (!node) return null;
    if (Array.isArray(node)) {
        for (const item of node) {
            const result = findNode(item, predicate);
            if (result) return result;
        }
        return null;
    }
    if (predicate(node)) return node;
    if (!node.children) return null;
    return findNode(node.children, predicate);
}

function makeRow(overrides = {}) {
    const original = {
        displayName: 'Alice',
        photonId: 7,
        ref: {
            id: 'usr_1',
            displayName: 'Alice',
            $trustSortNum: 10,
            $trustLevel: 'Known',
            $trustClass: 'known',
            status: 'online',
            statusDescription: 'Online',
            $platform: 'standalonewindows',
            last_platform: 'standalonewindows',
            $languages: [],
            bioLinks: [],
            note: ''
        },
        ...overrides
    };
    return {
        original,
        getValue: (key) => original[key]
    };
}

describe('views/PlayerList/columns.jsx', () => {
    beforeEach(() => {
        globalThis.React = { createElement };
        mocks.openExternalLink.mockReset();
        mocks.userImage.mockReset();
        mocks.getFaviconUrl.mockClear();
        mocks.sortAlphabetically.mockClear();
        mocks.onBlockChatbox.mockReset();
        mocks.onUnblockChatbox.mockReset();
    });

    test('displayName sorting uses injected sortAlphabetically helper', () => {
        const cols = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            chatboxUserBlacklist: { value: new Map(), __v_isRef: true },
            onBlockChatbox: mocks.onBlockChatbox,
            onUnblockChatbox: mocks.onUnblockChatbox,
            sortAlphabetically: mocks.sortAlphabetically
        });
        const displayNameCol = cols.find((c) => c.id === 'displayName');

        const result = displayNameCol.sortingFn(
            { original: { displayName: 'Alice' } },
            { original: { displayName: 'Bob' } }
        );

        expect(result).toBe(123);
        expect(mocks.sortAlphabetically).toHaveBeenCalledWith(
            { displayName: 'Alice' },
            { displayName: 'Bob' },
            'displayName'
        );
    });

    test('photonId cell triggers block and unblock actions', () => {
        const row = makeRow();
        const cols = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            chatboxUserBlacklist: { value: new Map(), __v_isRef: true },
            onBlockChatbox: mocks.onBlockChatbox,
            onUnblockChatbox: mocks.onUnblockChatbox,
            sortAlphabetically: mocks.sortAlphabetically
        });
        const photonCol = cols.find((c) => c.id === 'photonId');
        const blockCell = photonCol.cell({ row });
        findNode(blockCell, (n) => n.type === 'button').props.onClick({ stopPropagation: vi.fn() });
        expect(mocks.onBlockChatbox).toHaveBeenCalledWith(row.original.ref);

        const blockedMap = new Map([[row.original.ref.id, row.original.ref.displayName]]);
        const colsBlocked = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            chatboxUserBlacklist: { value: blockedMap, __v_isRef: true },
            onBlockChatbox: mocks.onBlockChatbox,
            onUnblockChatbox: mocks.onUnblockChatbox,
            sortAlphabetically: mocks.sortAlphabetically
        });
        const photonBlocked = colsBlocked.find((c) => c.id === 'photonId');
        const unblockCell = photonBlocked.cell({ row });
        findNode(unblockCell, (n) => n.type === 'button').props.onClick({ stopPropagation: vi.fn() });
        expect(mocks.onUnblockChatbox).toHaveBeenCalledWith('usr_1');
    });

    test('icon sorting prefers higher weighted role flags', () => {
        const cols = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            chatboxUserBlacklist: { value: new Map(), __v_isRef: true },
            onBlockChatbox: mocks.onBlockChatbox,
            onUnblockChatbox: mocks.onUnblockChatbox,
            sortAlphabetically: mocks.sortAlphabetically
        });
        const iconCol = cols.find((c) => c.id === 'icon');

        const master = { original: { isMaster: true } };
        const friend = { original: { isFriend: true } };

        expect(iconCol.sortingFn(master, friend, 'icon')).toBeGreaterThan(0);
    });

    test('bioLink cell opens external link when favicon is clicked', () => {
        const row = makeRow({
            ref: {
                ...makeRow().original.ref,
                bioLinks: ['https://example.com']
            }
        });
        const cols = createColumns({
            randomUserColours: { value: false, __v_isRef: true },
            chatboxUserBlacklist: { value: new Map(), __v_isRef: true },
            onBlockChatbox: mocks.onBlockChatbox,
            onUnblockChatbox: mocks.onUnblockChatbox,
            sortAlphabetically: mocks.sortAlphabetically
        });
        const bioLinkCol = cols.find((c) => c.id === 'bioLink');
        const cell = bioLinkCol.cell({ row });
        findNode(cell, (n) => n.type === 'img').props.onClick({ stopPropagation: vi.fn() });

        expect(mocks.openExternalLink).toHaveBeenCalledWith('https://example.com');
    });
});
