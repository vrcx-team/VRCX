import { ArrowUpDown } from 'lucide-vue-next';

import DisplayName from '../../DisplayName.vue';
import Location from '../../Location.vue';
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

const resolveBool = (maybeRef) => {
    if (maybeRef && typeof maybeRef === 'object' && 'value' in maybeRef) {
        return !!maybeRef.value;
    }
    return !!maybeRef;
};

export const createColumns = ({
    shiftHeld,
    onLaunch,
    onShowInfo,
    onDelete,
    onDeletePrompt
}) => [
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
        cell: ({ row }) => (
            <span>{formatDateFilter(row.original?.created_at, 'long')}</span>
        )
    },
    {
        id: 'world',
        accessorFn: (row) => row?.worldName ?? row?.name ?? '',
        header: ({ column }) =>
            sortButton({ column, label: t('table.previous_instances.world') }),
        meta: {
            stretch: true
        },
        cell: ({ row }) => (
            <Location
                location={row.original?.location}
                hint={row.original?.worldName}
                grouphint={row.original?.groupName}
            />
        )
    },
    {
        id: 'creator',
        accessorFn: (row) => row?.$location?.userId ?? '',
        size: 170,
        header: () => t('table.previous_instances.instance_creator'),
        cell: ({ row }) => (
            <DisplayName
                userid={row.original?.$location?.userId}
                location={row.original?.$location?.tag}
            />
        )
    },
    {
        id: 'time',
        accessorFn: (row) => row?.time ?? 0,
        size: 100,
        header: ({ column }) =>
            sortButton({ column, label: t('table.previous_instances.time') }),
        cell: ({ row }) => <span>{row.original?.timer ?? ''}</span>
    },
    {
        id: 'actions',
        enableSorting: false,
        size: 140,
        header: () => t('table.previous_instances.action'),
        meta: {
            thClass: 'text-right',
            tdClass: 'text-right'
        },
        cell: ({ row }) => {
            const original = row.original;
            const isShiftHeld = resolveBool(shiftHeld);

            return (
                <div class="inline-flex items-center justify-end gap-1">
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="w-6 h-6 text-xs"
                        onClick={(event) => {
                            event.stopPropagation();
                            onLaunch?.(original?.location);
                        }}
                    >
                        <i class="ri-door-open-line"></i>
                    </Button>

                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="w-6 h-6 text-xs"
                        onClick={(event) => {
                            event.stopPropagation();
                            onShowInfo?.(original?.location);
                        }}
                    >
                        <i class="ri-information-line"></i>
                    </Button>

                    <Button
                        size="icon-sm"
                        variant="ghost"
                        class="w-6 h-6 text-xs"
                        style={isShiftHeld ? { color: '#f56c6c' } : undefined}
                        onClick={(event) => {
                            event.stopPropagation();
                            if (isShiftHeld) {
                                onDelete?.(original);
                            } else {
                                onDeletePrompt?.(original);
                            }
                        }}
                    >
                        <i class="ri-delete-bin-line"></i>
                    </Button>
                </div>
            );
        }
    }
];
