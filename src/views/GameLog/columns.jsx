import Location from '../../components/Location.vue';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { ArrowUpDown, FileText, Trash2, X } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { formatDateFilter, openExternalLink } from '../../shared/utils';
import { i18n } from '../../plugin';
import {
    useInstanceStore,
    useUiStore,
    useUserStore,
    useWorldStore
} from '../../stores';

const { t } = i18n.global;

const UNACTIONABLE_TYPES = new Set([
    'OnPlayerJoined',
    'OnPlayerLeft',
    'Location',
    'PortalSpawn'
]);

export const createColumns = ({ getCreatedAt, onDelete, onDeletePrompt }) => {
    const { showWorldDialog } = useWorldStore();
    const { lookupUser } = useUserStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
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
            accessorFn: (row) => getCreatedAt(row),
            id: 'created_at',
            size: 140,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('table.gameLog.date')}
                    <ArrowUpDown class="ml-1 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const createdAt = getCreatedAt(row.original);
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
            size: 150,
            header: () => t('table.gameLog.type'),
            cell: ({ row }) => {
                const original = row.original;
                const label = t(`view.game_log.filters.${original.type}`);
                const isLink =
                    Boolean(original.location) && original.type !== 'Location';

                return (
                    <Badge variant="outline" class="text-muted-foreground">
                        <span
                            class={isLink ? 'cursor-pointer' : undefined}
                            onClick={() =>
                                isLink && showWorldDialog(original.location)
                            }
                        >
                            {label}
                        </span>
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'displayName',
            size: 200,
            header: () => t('table.gameLog.user'),
            cell: ({ row }) => {
                const original = row.original;
                const isFriend = original.isFriend;
                const isFavorite = original.isFavorite;
                return (
                    <span class="cursor-pointer">
                        {original.displayName ? (
                            <span
                                class="cursor-pointer table-user mr-1"
                                onClick={() => lookupUser(original)}
                            >
                                {original.displayName}
                            </span>
                        ) : null}
                        {isFriend ? (
                            <span>{isFavorite ? '⭐' : '💚'}</span>
                        ) : null}
                    </span>
                );
            }
        },
        {
            id: 'detail',
            header: () => t('table.gameLog.detail'),
            enableSorting: false,
            minSize: 150,
            meta: {
                stretch: true
            },
            cell: ({ row }) => {
                const original = row.original;
                if (original.type === 'Location') {
                    return (
                        <div class="w-full min-w-0 truncate">
                            <Location
                                location={original.location}
                                hint={original.worldName}
                                grouphint={original.groupName}
                            />
                        </div>
                    );
                }

                if (original.type === 'PortalSpawn') {
                    return (
                        <div class="w-full min-w-0 truncate">
                            <Location
                                location={original.instanceId}
                                hint={original.worldName}
                                grouphint={original.groupName}
                            />
                        </div>
                    );
                }

                if (original.type === 'Event') {
                    return (
                        <span class="block w-full min-w-0 truncate">
                            {original.data}
                        </span>
                    );
                }

                if (original.type === 'External') {
                    return (
                        <span class="block w-full min-w-0 truncate">
                            {original.message}
                        </span>
                    );
                }

                if (original.type === 'VideoPlay') {
                    const showLink =
                        original.videoId !== 'LSMedia' &&
                        original.videoId !== 'PopcornPalace';
                    const label = original.videoName || original.videoUrl;
                    return (
                        <span class="block w-full min-w-0 truncate cursor-pointer">
                            {original.videoId ? (
                                <span class="mr-1.5">{original.videoId}:</span>
                            ) : null}
                            {showLink ? (
                                <span
                                    class="cursor-pointer"
                                    onClick={() =>
                                        openExternalLink(original.videoUrl)
                                    }
                                >
                                    {label}
                                </span>
                            ) : (
                                <span>{original.videoName}</span>
                            )}
                        </span>
                    );
                }

                if (
                    original.type === 'ImageLoad' ||
                    original.type === 'StringLoad'
                ) {
                    return (
                        <span class="block w-full min-w-0 truncate cursor-pointer">
                            <span
                                class="cursor-pointer"
                                onClick={() =>
                                    openExternalLink(original.resourceUrl)
                                }
                            >
                                {original.resourceUrl}
                            </span>
                        </span>
                    );
                }

                if (
                    original.type === 'Notification' ||
                    original.type === 'OnPlayerJoined' ||
                    original.type === 'OnPlayerLeft'
                ) {
                    return null;
                }

                return (
                    <span class="block w-full min-w-0 truncate">
                        {original.data}
                    </span>
                );
            }
        },
        {
            id: 'action',
            meta: {
                class: 'text-right'
            },
            size: 90,
            minSize: 90,
            maxSize: 90,
            header: () => t('table.gameLog.action'),
            enableSorting: false,
            cell: ({ row }) => {
                const original = row.original;
                const canDelete = !UNACTIONABLE_TYPES.has(original.type);
                const canShowPrevious = original.type === 'Location';

                if (!canDelete && !canShowPrevious) {
                    return null;
                }

                return (
                    <div class="flex items-center justify-end gap-2">
                        {canDelete ? (
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
                        ) : null}
                        {canShowPrevious ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            type="button"
                                            class="inline-flex h-6 items-center justify-center text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                showPreviousInstancesInfoDialog(
                                                    original.location
                                                )
                                            }
                                        >
                                            <FileText class="h-4 w-4" />
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <span>
                                            {t(
                                                'dialog.previous_instances.info'
                                            )}
                                        </span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : null}
                    </div>
                );
            }
        }
    ];
};
