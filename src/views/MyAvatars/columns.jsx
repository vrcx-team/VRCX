import { getTagColor } from '../../shared/constants';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import {
    Apple,
    ArrowUpDown,
    Check,
    Ellipsis,
    Eye,
    Image,
    Monitor,
    Pencil,
    RefreshCw,
    Smartphone,
    Tag,
    User
} from 'lucide-vue-next';
import {
    formatDateFilter,
    getAvailablePlatforms,
    getPlatformInfo,
    timeToText
} from '../../shared/utils';
import { i18n } from '../../plugins';

const { t } = i18n.global;

const sortButton = ({ column, label, descFirst = false }) => {
    const resolvedLabel = typeof label === 'function' ? label() : label;
    return (
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
            {resolvedLabel}
            <ArrowUpDown class="ml-1 h-4 w-4" />
        </Button>
    );
};

export function getColumns({
    onShowAvatarDialog,
    onContextMenuAction,
    currentAvatarId
}) {
    return [
        {
            id: 'active',
            header: () => null,
            size: 40,
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => {
                const ref = row.original;
                const isActive = ref.id === currentAvatarId.value;
                return (
                    <div class="flex items-center justify-center">
                        <Check
                            class={[
                                'h-4 w-4',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground/0'
                            ]}
                        />
                    </div>
                );
            }
        },
        {
            id: 'thumbnail',
            header: () => null,
            size: 64,
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <img
                        src={ref.thumbnailImageUrl}
                        class="avatar-table-thumbnail cursor-pointer rounded-sm object-cover"
                        style="width: 34px; height: 22px;"
                        loading="lazy"
                        onClick={() => onShowAvatarDialog(ref.id)}
                    />
                );
            }
        },
        {
            id: 'name',
            accessorKey: 'Name',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.name')
                }),
            size: 200,
            meta: { label: () => t('dialog.avatar.info.name') },
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <span
                        class="cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowAvatarDialog(ref.id);
                        }}
                    >
                        {ref.name}
                    </span>
                );
            }
        },
        {
            id: 'customTags',
            accessorFn: (row) => (row.$tags || []).map((t) => t.tag).join(', '),
            header: () => t('dialog.avatar.info.tags'),
            size: 150,
            enableSorting: false,
            meta: { label: () => t('dialog.avatar.info.tags') },
            cell: ({ row }) => {
                const tags = row.original.$tags || [];
                if (!tags.length) return null;
                return (
                    <div class="flex flex-nowrap gap-1 overflow-hidden">
                        {tags.map((entry) => {
                            const hashColor = getTagColor(entry.tag);
                            const storedColor =
                                typeof entry.color === 'string'
                                    ? entry.color
                                    : null;
                            const bg = storedColor || hashColor.bg;
                            const text = storedColor
                                ? storedColor.replace(/\/ [\d.]+\)$/, ')')
                                : hashColor.text;
                            return (
                                <Badge
                                    key={entry.tag}
                                    variant="secondary"
                                    class="text-xs"
                                    style={{
                                        backgroundColor: bg,
                                        color: text
                                    }}
                                >
                                    {entry.tag}
                                </Badge>
                            );
                        })}
                    </div>
                );
            }
        },
        {
            id: 'platforms',
            header: () => t('dialog.avatar.info.platform'),
            size: 120,
            enableSorting: false,
            meta: { label: () => t('dialog.avatar.info.platform') },
            cell: ({ row }) => {
                const ref = row.original;
                const platforms = getAvailablePlatforms(ref.unityPackages);
                return (
                    <div class="flex items-center gap-1">
                        {platforms.isPC && (
                            <Badge class="x-tag-platform-pc" variant="outline">
                                <Monitor class="h-3.5 w-3.5" />
                            </Badge>
                        )}
                        {platforms.isQuest && (
                            <Badge
                                class="x-tag-platform-quest"
                                variant="outline"
                            >
                                <Smartphone class="h-3.5 w-3.5" />
                            </Badge>
                        )}
                        {platforms.isIos && (
                            <Badge
                                class="text-platform-ios border-platform-ios"
                                variant="outline"
                            >
                                <Apple class="h-3.5 w-3.5" />
                            </Badge>
                        )}
                    </div>
                );
            }
        },
        {
            id: 'visibility',
            accessorKey: 'releaseStatus',
            header: () => t('dialog.avatar.info.visibility'),
            size: 120,
            meta: { label: () => t('dialog.avatar.info.visibility') },
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <Badge variant="outline">
                        {ref.releaseStatus === 'public'
                            ? t('dialog.avatar.tags.public')
                            : t('dialog.avatar.tags.private')}
                    </Badge>
                );
            }
        },
        {
            id: 'timeSpent',
            accessorFn: (row) => row?.$timeSpent ?? 0,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.time_spent'),
                    descFirst: true
                }),
            size: 140,
            meta: {
                class: 'text-right',
                label: () => t('dialog.avatar.info.time_spent')
            },
            cell: ({ row }) => {
                const time = row.original?.$timeSpent;
                return time ? <span>{timeToText(time)}</span> : <span>-</span>;
            }
        },
        {
            id: 'version',
            accessorKey: 'version',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.version'),
                    descFirst: true
                }),
            size: 90,
            meta: {
                class: 'text-right',
                label: () => t('dialog.avatar.info.version')
            },
            cell: ({ row }) => <span>{row.original.version ?? '-'}</span>
        },
        {
            id: 'pcPerf',
            accessorFn: (row) =>
                getPlatformInfo(row.unityPackages)?.pc?.performanceRating ?? '',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.pc_performance')
                }),
            size: 140,
            meta: { label: () => t('dialog.avatar.info.pc_performance') },
            cell: ({ row }) => {
                const perf = getPlatformInfo(row.original.unityPackages)?.pc
                    ?.performanceRating;
                return perf ? (
                    <span>{perf}</span>
                ) : (
                    <span class="text-muted-foreground">-</span>
                );
            }
        },
        {
            id: 'androidPerf',
            accessorFn: (row) =>
                getPlatformInfo(row.unityPackages)?.android
                    ?.performanceRating ?? '',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.android_performance')
                }),
            size: 140,
            meta: { label: () => t('dialog.avatar.info.android_performance') },
            cell: ({ row }) => {
                const perf = getPlatformInfo(row.original.unityPackages)
                    ?.android?.performanceRating;
                return perf ? (
                    <span>{perf}</span>
                ) : (
                    <span class="text-muted-foreground">-</span>
                );
            }
        },
        {
            id: 'iosPerf',
            accessorFn: (row) =>
                getPlatformInfo(row.unityPackages)?.ios?.performanceRating ??
                '',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.ios_performance')
                }),
            size: 140,
            meta: { label: () => t('dialog.avatar.info.ios_performance') },
            cell: ({ row }) => {
                const perf = getPlatformInfo(row.original.unityPackages)?.ios
                    ?.performanceRating;
                return perf ? (
                    <span>{perf}</span>
                ) : (
                    <span class="text-muted-foreground">-</span>
                );
            }
        },
        {
            id: 'updated_at',
            accessorKey: 'updated_at',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.last_updated'),
                    descFirst: true
                }),
            size: 160,
            meta: { label: () => t('dialog.avatar.info.last_updated') },
            cell: ({ row }) => {
                const ref = row.original;
                return <span>{formatDateFilter(ref.updated_at, 'long')}</span>;
            }
        },
        {
            id: 'created_at',
            accessorKey: 'created_at',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: () => t('dialog.avatar.info.created_at'),
                    descFirst: true
                }),
            size: 160,
            meta: { label: () => t('dialog.avatar.info.created_at') },
            cell: ({ row }) => {
                const ref = row.original;
                return <span>{formatDateFilter(ref.created_at, 'long')}</span>;
            }
        },
        {
            id: 'actions',
            header: () => null,
            size: 100,
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <div
                        class="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    class="rounded-full h-6 w-6"
                                    size="icon"
                                    variant="ghost"
                                >
                                    <Ellipsis class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={() => onShowAvatarDialog(ref.id)}
                                >
                                    <Eye class="size-4" />
                                    {t('dialog.avatar.actions.view_details')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction('manageTags', ref)
                                    }
                                >
                                    <Tag class="size-4" />
                                    {t('dialog.avatar.actions.manage_tags')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {ref.releaseStatus === 'public' ? (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onContextMenuAction(
                                                'makePrivate',
                                                ref
                                            )
                                        }
                                    >
                                        <User class="size-4" />
                                        {t(
                                            'dialog.avatar.actions.make_private'
                                        )}
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            onContextMenuAction(
                                                'makePublic',
                                                ref
                                            )
                                        }
                                    >
                                        <User class="size-4" />
                                        {t('dialog.avatar.actions.make_public')}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction('rename', ref)
                                    }
                                >
                                    <Pencil class="size-4" />
                                    {t('dialog.avatar.actions.rename')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction(
                                            'changeDescription',
                                            ref
                                        )
                                    }
                                >
                                    <Pencil class="size-4" />
                                    {t(
                                        'dialog.avatar.actions.change_description'
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction('changeTags', ref)
                                    }
                                >
                                    <Pencil class="size-4" />
                                    {t(
                                        'dialog.avatar.actions.change_content_tags'
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction('changeStyles', ref)
                                    }
                                >
                                    <Pencil class="size-4" />
                                    {t(
                                        'dialog.avatar.actions.change_styles_author_tags'
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction('changeImage', ref)
                                    }
                                >
                                    <Image class="size-4" />
                                    {t('dialog.avatar.actions.change_image')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        onContextMenuAction(
                                            'createImpostor',
                                            ref
                                        )
                                    }
                                >
                                    <RefreshCw class="size-4" />
                                    {t('dialog.avatar.actions.create_impostor')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            }
        }
    ];
}
