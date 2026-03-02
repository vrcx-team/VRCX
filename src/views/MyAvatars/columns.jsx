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
import { i18n } from '../../plugin';

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
                                    : 'text-muted-foreground/0 group-hover/row:text-muted-foreground/40'
                            ]}
                        />
                    </div>
                );
            }
        },
        {
            id: 'index',
            accessorFn: (_row, index) => index + 1,
            header: ({ column }) =>
                sortButton({ column, label: 'No.', descFirst: true }),
            size: 60,
            enableResizing: false,
            meta: {
                class: 'text-right'
            },
            cell: ({ row }) => (
                <span class="text-muted-foreground">{row.index + 1}</span>
            )
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
                        class="cursor-pointer rounded-sm object-cover"
                        style="width: 36px; height: 24px;"
                        loading="lazy"
                        onClick={() => onShowAvatarDialog(ref.id)}
                    />
                );
            }
        },
        {
            id: 'name',
            accessorKey: 'name',
            header: ({ column }) => sortButton({ column, label: 'Name' }),
            size: 200,
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <span
                        class="cursor-pointer font-medium"
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
            id: 'platforms',
            header: () => 'Platforms',
            size: 120,
            enableSorting: false,
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
                                class="text-[#8e8e93] border-[#8e8e93]"
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
            id: 'customTags',
            accessorFn: (row) => (row.$tags || []).map((t) => t.tag).join(', '),
            header: () => t('dialog.avatar.info.tags'),
            size: 150,
            enableSorting: false,
            cell: ({ row }) => {
                const tags = row.original.$tags || [];
                if (!tags.length) return null;
                return (
                    <div class="flex flex-wrap gap-1">
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
            id: 'releaseStatus',
            accessorKey: 'releaseStatus',
            header: () => t('dialog.avatar.tags.public'),
            size: 120,
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
                    label: t('dialog.avatar.info.time_spent'),
                    descFirst: true
                }),
            size: 140,
            meta: {
                class: 'text-right'
            },
            cell: ({ row }) => {
                const time = row.original?.$timeSpent;
                return time ? (
                    <span class=" text-sm">{timeToText(time)}</span>
                ) : (
                    <span class=" text-sm">-</span>
                );
            }
        },
        {
            id: 'version',
            accessorKey: 'version',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('dialog.avatar.info.version'),
                    descFirst: true
                }),
            size: 90,
            meta: {
                class: 'text-right'
            },
            cell: ({ row }) => (
                <span class=" text-sm">{row.original.version ?? '-'}</span>
            )
        },
        {
            id: 'pcPerf',
            accessorFn: (row) =>
                getPlatformInfo(row.unityPackages)?.pc?.performanceRating ?? '',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('dialog.avatar.info.pc_performance')
                }),
            size: 140,
            cell: ({ row }) => {
                const perf = getPlatformInfo(row.original.unityPackages)?.pc
                    ?.performanceRating;
                return perf ? (
                    <span class="text-sm">{perf}</span>
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
                    label: t('dialog.avatar.info.android_performance')
                }),
            size: 140,
            cell: ({ row }) => {
                const perf = getPlatformInfo(row.original.unityPackages)
                    ?.android?.performanceRating;
                return perf ? (
                    <span class="text-sm">{perf}</span>
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
                    label: t('dialog.avatar.info.ios_performance')
                }),
            size: 140,
            cell: ({ row }) => {
                const perf = getPlatformInfo(row.original.unityPackages)?.ios
                    ?.performanceRating;
                return perf ? (
                    <span class="text-sm">{perf}</span>
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
                    label: t('dialog.avatar.info.last_updated'),
                    descFirst: true
                }),
            size: 160,
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <span class=" text-sm">
                        {formatDateFilter(ref.updated_at, 'long')}
                    </span>
                );
            }
        },
        {
            id: 'created_at',
            accessorKey: 'created_at',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('dialog.avatar.info.created_at'),
                    descFirst: true
                }),
            size: 160,
            cell: ({ row }) => {
                const ref = row.original;
                return (
                    <span class=" text-sm">
                        {formatDateFilter(ref.created_at, 'long')}
                    </span>
                );
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
                                    class="rounded-full"
                                    size="icon-sm"
                                    variant="ghost"
                                >
                                    <Ellipsis class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
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
