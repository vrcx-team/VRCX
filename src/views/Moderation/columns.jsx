import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { ArrowUpDown, Trash2, X } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { formatDateFilter } from '../../shared/utils';
import { i18n } from '../../plugin';
import { useUiStore, useUserStore } from '../../stores';

const { t } = i18n.global;

export const createColumns = ({ onDelete, onDeletePrompt }) => {
    const { showUserDialog } = useUserStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

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
            accessorKey: 'created',
            size: 120,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('table.moderation.date')}
                    <ArrowUpDown class="ml-1 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const createdAt = row.getValue('created');
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
            size: 140,
            header: () => t('table.moderation.type'),
            cell: ({ row }) => {
                const type = row.getValue('type');
                return (
                    <Badge variant="outline" class="text-muted-foreground">
                        {t(`view.moderation.filters.${type}`)}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'sourceDisplayName',
            meta: {
                class: 'overflow-hidden'
            },
            size: 120,
            header: () => t('table.moderation.source'),
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <span
                        class="cursor-pointer block w-full min-w-0 truncate pr-2.5 cursor-pointer"
                        onClick={() => showUserDialog(original.sourceUserId)}
                    >
                        {original.sourceDisplayName}
                    </span>
                );
            }
        },
        {
            accessorKey: 'targetDisplayName',
            size: 200,
            minSize: 80,
            meta: {
                stretch: true
            },
            header: () => t('table.moderation.target'),
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <span
                        class="cursor-pointer block w-full whitespace-normal wrap-break-word pr-2.5 cursor-pointer"
                        onClick={() => showUserDialog(original.targetUserId)}
                    >
                        {original.targetDisplayName}
                    </span>
                );
            }
        },
        {
            id: 'action',
            meta: {
                class: 'text-right'
            },
            size: 80,
            minSize: 80,
            maxSize: 80,
            enableSorting: false,
            header: () => t('table.moderation.action'),
            cell: ({ row }) => {
                const original = row.original;
                if (original.sourceUserId !== currentUser.value?.id) {
                    return null;
                }

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
                            {shiftHeld.value ? (
                                <X class="h-4 w-4 text-red-600" />
                            ) : (
                                <Trash2 class="h-4 w-4" />
                            )}
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
