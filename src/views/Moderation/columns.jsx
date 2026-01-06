import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { ArrowUpDown, X } from 'lucide-vue-next';
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
            meta: {
                class: 'w-[20px]'
            },
            cell: () => null
        },
        {
            accessorKey: 'created',
            meta: {
                class: 'w-[140px]'
            },
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
            meta: {
                class: 'w-[160px]'
            },
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
                class: 'w-[200px] min-w-0 overflow-hidden'
            },
            header: () => t('table.moderation.source'),
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <span
                        class="x-link block w-full min-w-0 truncate pr-2.5"
                        onClick={() => showUserDialog(original.sourceUserId)}
                    >
                        {original.sourceDisplayName}
                    </span>
                );
            }
        },
        {
            accessorKey: 'targetDisplayName',
            meta: {
                class: 'min-w-0 overflow-hidden'
            },
            header: () => t('table.moderation.target'),
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <span
                        class="x-link block w-full min-w-0 truncate pr-2.5"
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
                class: 'w-[80px] max-w-[80px] text-right'
            },
            header: () => t('table.moderation.action'),
            enableSorting: false,
            cell: ({ row }) => {
                const original = row.original;
                if (original.sourceUserId !== currentUser.value?.id) {
                    return null;
                }

                if (shiftHeld.value) {
                    return (
                        <div class="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-6 text-destructive"
                                onClick={() => onDelete(original)}
                            >
                                <X />
                            </Button>
                        </div>
                    );
                }

                return (
                    <div class="flex justify-end">
                        <button
                            type="button"
                            class="inline-flex h-6 items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={() => onDeletePrompt(original)}
                        >
                            <i class="ri-delete-bin-line" />
                        </button>
                    </div>
                );
            }
        },
        {
            id: 'trailing',
            header: () => null,
            enableSorting: false,
            meta: {
                class: 'w-[5px]'
            },
            cell: () => null
        }
    ];
};
