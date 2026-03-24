import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    shiftHeld: { value: false, __v_isRef: true },
    currentUser: { value: { id: 'usr_me' }, __v_isRef: true },
    showUserDialog: vi.fn(),
    t: vi.fn((key) => key),
    te: vi.fn((key) => key === 'view.moderation.filters.block')
}));

vi.mock('pinia', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        storeToRefs: (store) => store
    };
});

vi.mock('../../../plugins', () => ({
    i18n: {
        global: {
            t: (...args) => mocks.t(...args),
            te: (...args) => mocks.te(...args)
        }
    }
}));

vi.mock('../../../stores', () => ({
    useUiStore: () => ({
        shiftHeld: mocks.shiftHeld
    }),
    useUserStore: () => ({
        currentUser: mocks.currentUser
    })
}));

vi.mock('../../../coordinators/userCoordinator', () => ({
    showUserDialog: (...args) => mocks.showUserDialog(...args)
}));

vi.mock('../../../shared/utils', () => ({
    formatDateFilter: (value, format) => `${format}:${value}`
}));

vi.mock('../../../components/ui/badge', () => ({ Badge: 'Badge' }));
vi.mock('../../../components/ui/button', () => ({ Button: 'Button' }));
vi.mock('../../../components/ui/tooltip', () => ({
    Tooltip: 'Tooltip',
    TooltipContent: 'TooltipContent',
    TooltipTrigger: 'TooltipTrigger'
}));
vi.mock('lucide-vue-next', () => ({
    ArrowUpDown: 'ArrowUpDown',
    Trash2: 'Trash2',
    X: 'X'
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

describe('views/Moderation/columns.jsx', () => {
    beforeEach(() => {
        globalThis.React = { createElement };
        mocks.shiftHeld.value = false;
        mocks.currentUser.value = { id: 'usr_me' };
        mocks.showUserDialog.mockReset();
    });

    test('source and target cells open corresponding user dialog', () => {
        const cols = createColumns({
            onDelete: vi.fn(),
            onDeletePrompt: vi.fn()
        });
        const sourceCol = cols.find(
            (c) => c.accessorKey === 'sourceDisplayName'
        );
        const targetCol = cols.find(
            (c) => c.accessorKey === 'targetDisplayName'
        );
        const row = {
            original: {
                sourceUserId: 'usr_source',
                sourceDisplayName: 'Source',
                targetUserId: 'usr_target',
                targetDisplayName: 'Target'
            },
            getValue: vi.fn()
        };

        const sourceCell = sourceCol.cell({ row });
        const targetCell = targetCol.cell({ row });
        findNode(
            sourceCell,
            (n) => n.type === 'span' && typeof n.props?.onClick === 'function'
        ).props.onClick();
        findNode(
            targetCell,
            (n) => n.type === 'span' && typeof n.props?.onClick === 'function'
        ).props.onClick();

        expect(mocks.showUserDialog).toHaveBeenNthCalledWith(1, 'usr_source');
        expect(mocks.showUserDialog).toHaveBeenNthCalledWith(2, 'usr_target');
    });

    test('action cell hidden when source user is not current user', () => {
        const cols = createColumns({
            onDelete: vi.fn(),
            onDeletePrompt: vi.fn()
        });
        const actionCol = cols.find((c) => c.id === 'action');
        const vnode = actionCol.cell({
            row: {
                original: {
                    sourceUserId: 'usr_other'
                }
            }
        });

        expect(vnode).toBeNull();
    });

    test('action cell routes to onDeletePrompt or onDelete based on shift', () => {
        const onDelete = vi.fn();
        const onDeletePrompt = vi.fn();
        const cols = createColumns({ onDelete, onDeletePrompt });
        const actionCol = cols.find((c) => c.id === 'action');
        const row = {
            original: {
                sourceUserId: 'usr_me',
                targetUserId: 'usr_target',
                type: 'block'
            }
        };

        const promptCell = actionCol.cell({ row });
        findNode(promptCell, (n) => n.type === 'button').props.onClick();
        expect(onDeletePrompt).toHaveBeenCalledWith(row.original);
        expect(onDelete).not.toHaveBeenCalled();

        mocks.shiftHeld.value = true;
        const directCell = actionCol.cell({ row });
        findNode(directCell, (n) => n.type === 'button').props.onClick();
        expect(onDelete).toHaveBeenCalledWith(row.original);
    });
});
