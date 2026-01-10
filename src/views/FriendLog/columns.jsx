import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { ArrowRight, ArrowUpDown } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { formatDateFilter } from '../../shared/utils';
import { i18n } from '../../plugin';
import { useUiStore, useUserStore } from '../../stores';

const { t } = i18n.global;

export const createColumns = ({ onDelete, onDeletePrompt }) => {
    const { showUserDialog } = useUserStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    return [
        {
            id: 'spacer',
            header: () => null,
            enableSorting: false,
            size: 20,
            minSize: 0,
            maxSize: 20,
            cell: () => null
        },
        {
            accessorKey: 'created_at',
            size: 90,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('table.friendLog.date')}
                    <ArrowUpDown class="ml-1 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const createdAt = row.getValue('created_at');
                const shortText = formatDateFilter(createdAt, 'short');
                const longText = formatDateFilter(createdAt, 'long');

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>{shortText}</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <span>{longText}</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        },
        {
            accessorKey: 'type',

            size: 110,
            header: () => t('table.friendLog.type'),
            cell: ({ row }) => {
                const type = row.getValue('type');
                return (
                    <Badge variant="outline" class="text-muted-foreground">
                        {t(`view.friend_log.filters.${type}`)}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'displayName',
            size: 260,
            minSize: 80,
            header: () => t('table.friendLog.user'),
            meta: {
                stretch: true
            },
            cell: ({ row }) => {
                const original = row.original;
                const displayName =
                    original.displayName || original.userId || '';
                return (
                    <span class="block w-full whitespace-normal break-words">
                        {original.type === 'DisplayName' ? (
                            <span class="mr-1">
                                {original.previousDisplayName}
                                <ArrowRight class="mx-1 inline h-3 w-3" />
                            </span>
                        ) : null}
                        <span
                            class="x-link pr-2.5"
                            onClick={() => showUserDialog(original.userId)}
                        >
                            {displayName}
                        </span>
                        {original.type === 'TrustLevel' ? (
                            <span class="text-muted-foreground">
                                ({original.previousTrustLevel}
                                <ArrowRight class="mx-1 inline h-3 w-3" />
                                {original.trustLevel})
                            </span>
                        ) : null}
                    </span>
                );
            }
        },
        {
            id: 'action',
            meta: {
                class: 'w-[80px] max-w-[80px] text-right'
            },
            enableResizing: false,
            size: 80,
            maxSize: 80,
            header: () => t('table.friendLog.action'),
            enableSorting: false,
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <div class="flex justify-end">
                        <button
                            type="button"
                            class="inline-flex h-6 items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() =>
                                shiftHeld.value
                                    ? onDelete(original)
                                    : onDeletePrompt(original)
                            }
                        >
                            <i
                                class={
                                    shiftHeld.value
                                        ? 'ri-close-line text-red-600'
                                        : 'ri-delete-bin-line'
                                }
                            />
                        </button>
                    </div>
                );
            }
        },
        {
            id: 'trailing',
            header: () => null,
            enableSorting: false,
            enableResizing: false,
            size: 5,
            cell: () => null
        }
    ];
};
