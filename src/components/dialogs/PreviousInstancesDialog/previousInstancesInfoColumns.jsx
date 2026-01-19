import { ArrowUpDown } from 'lucide-vue-next';

import { Button } from '../../ui/button';
import { i18n } from '../../../plugin';
import { formatDateFilter } from '../../../shared/utils';

const { t } = i18n.global;

const sortButton = ({ column, label, descFirst = false }) => (
    <Button
        variant="ghost"
        size="sm"
        class="-ml-2 h-8 px-2"
        onClick={() => {
            const sorted = column.getIsSorted();
            if (!sorted && descFirst) {
                column.toggleSorting(true);
                return;
            }
            column.toggleSorting(sorted === 'asc');
        }}
    >
        {label}
        <ArrowUpDown class="ml-1 h-4 w-4" />
    </Button>
);

export const createColumns = ({ onLookupUser }) => [
    {
        id: 'created_at',
        accessorFn: (row) => (row?.created_at ? Date.parse(row.created_at) : 0),
        size: 170,
        header: ({ column }) =>
            sortButton({
                column,
                label: t('table.previous_instances.date'),
                descFirst: true
            }),
        cell: ({ row }) => {
            const createdAt = row.original?.created_at;
            const shortText = formatDateFilter(createdAt, 'short');
            const longText = formatDateFilter(createdAt, 'long');
            return <span title={longText}>{shortText}</span>;
        }
    },
    {
        id: 'friend',
        accessorFn: (row) => (row?.isFavorite ? 2 : row?.isFriend ? 1 : 0),
        size: 70,
        enableSorting: false,
        header: () => t('table.gameLog.icon'),
        meta: {
            thClass: 'text-center',
            tdClass: 'text-center'
        },
        cell: ({ row }) => {
            const original = row.original;
            if (original?.isFavorite) {
                return <span title="Favorite">⭐</span>;
            }
            if (original?.isFriend) {
                return <span title="Friend">💚</span>;
            }
            return null;
        }
    },
    {
        id: 'displayName',
        accessorFn: (row) => row?.displayName ?? '',
        header: ({ column }) =>
            sortButton({ column, label: t('table.previous_instances.display_name') }),
        meta: {
            stretch: true
        },
        cell: ({ row }) => {
            const original = row.original;
            return (
                <span
                    class=" cursor-pointer"
                    onClick={(event) => {
                        event.stopPropagation();
                        onLookupUser?.(original);
                    }}
                >
                    {original?.displayName ?? ''}
                </span>
            );
        }
    },
    {
        id: 'time',
        accessorFn: (row) => row?.time ?? 0,
        size: 100,
        header: ({ column }) => sortButton({ column, label: t('table.previous_instances.time') }),
        cell: ({ row }) => <span>{row.original?.timer ?? ''}</span>
    },
    {
        id: 'count',
        accessorFn: (row) => row?.count ?? 0,
        size: 100,
        header: ({ column }) => sortButton({ column, label: t('table.previous_instances.count') }),
        cell: ({ row }) => <span>{row.original?.count ?? ''}</span>
    }
];
