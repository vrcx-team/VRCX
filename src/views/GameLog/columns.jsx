import Location from '../../components/Location.vue';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { ArrowUpDown } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { formatDateFilter, openExternalLink } from '../../shared/utils';
import { i18n } from '../../plugin';
import {
    useGameLogStore,
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
    const { gameLogIsFriend, gameLogIsFavorite } = useGameLogStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    const handleDelete = (row) => {
        if (shiftHeld.value) {
            onDelete(row);
            return;
        }
        onDeletePrompt(row);
    };

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
            accessorFn: (row) => getCreatedAt(row),
            id: 'created_at',
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
            meta: {
                class: 'w-[150px]'
            },
            header: () => t('table.gameLog.type'),
            cell: ({ row }) => {
                const original = row.original;
                const label = t(`view.game_log.filters.${original.type}`);
                const isLink =
                    Boolean(original.location) && original.type !== 'Location';

                return (
                    <Badge variant="outline" class="text-muted-foreground">
                        <span
                            class={isLink ? 'x-link' : undefined}
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
            meta: {
                class: 'w-[200px]'
            },
            header: () => t('table.gameLog.user'),
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <span>
                        {original.displayName ? (
                            <span
                                class="x-link table-user pr-2.5"
                                onClick={() => lookupUser(original)}
                            >
                                {original.displayName}
                            </span>
                        ) : null}
                        {gameLogIsFriend(original) ? (
                            <span>
                                {gameLogIsFavorite(original) ? '⭐' : '💚'}
                            </span>
                        ) : null}
                    </span>
                );
            }
        },
        {
            id: 'detail',
            header: () => t('table.gameLog.detail'),
            enableSorting: false,
            meta: {
                class: 'min-w-0 overflow-hidden'
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
                        <span class="block w-full min-w-0 truncate">
                            {original.videoId ? (
                                <span class="mr-1.5">{original.videoId}:</span>
                            ) : null}
                            {showLink ? (
                                <span
                                    class="x-link"
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
                        <span class="block w-full min-w-0 truncate">
                            <span
                                class="x-link"
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
                    <span class="x-link block w-full min-w-0 truncate">
                        {original.data}
                    </span>
                );
            }
        },
        {
            id: 'action',
            meta: {
                class: 'w-[90px] max-w-[90px] text-right'
            },
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
                    <div class="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    class="h-7 px-2 text-xs"
                                >
                                    ...
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canDelete ? (
                                    <DropdownMenuItem
                                        onSelect={() => handleDelete(original)}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                ) : null}
                                {canShowPrevious ? (
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            showPreviousInstancesInfoDialog(
                                                original.location
                                            )
                                        }
                                    >
                                        {t('dialog.previous_instances.info')}
                                    </DropdownMenuItem>
                                ) : null}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            }
        }
    ];
};
