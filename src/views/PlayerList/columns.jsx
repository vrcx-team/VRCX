import Timer from '../../components/Timer.vue';
import { Button } from '../../components/ui/button';
import { TooltipWrapper } from '../../components/ui/tooltip';
import {
    Apple,
    ArrowUpDown,
    IdCard,
    Monitor,
    Smartphone
} from 'lucide-vue-next';

import {
    getFaviconUrl,
    languageClass,
    openExternalLink,
    statusClass,
    userImage
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

const getInstanceIconWeight = (item) => {
    if (!item) return 0;
    let value = 0;
    if (item.isMaster) value += 1000;
    if (item.isModerator) value += 500;
    if (item.isFriend) value += 200;
    if (item.isBlocked) value -= 100;
    if (item.isMuted) value -= 50;
    if (item.isAvatarInteractionDisabled) value -= 20;
    if (item.isChatBoxMuted) value -= 10;
    if (item.ageVerified) value += 5;
    return value;
};

const sortInstanceIcon = (a, b) =>
    getInstanceIconWeight(b) - getInstanceIconWeight(a);

export const createColumns = ({
    randomUserColours,
    photonLoggingEnabled,
    chatboxUserBlacklist,
    onBlockChatbox,
    onUnblockChatbox,
    sortAlphabetically
}) => {
    /** @type {import('@tanstack/vue-table').ColumnDef<any, any>[]} */
    const cols = [
        {
            id: 'avatar',
            accessorFn: (row) => row?.photo,
            header: () => t('table.playerList.avatar'),
            size: 70,
            enableSorting: false,
            enableResizing: false,
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                const src = userImage(userRef);
                if (!src) return null;
                return (
                    <div class="flex items-center pl-2">
                        <img
                            src={src}
                            class="h-4 w-4 rounded-sm object-cover"
                            loading="lazy"
                        />
                    </div>
                );
            }
        },
        {
            id: 'timer',
            accessorFn: (row) => row?.timer,
            header: ({ column }) =>
                sortButton({ column, label: t('table.playerList.timer') }),
            size: 90,
            enableResizing: false,
            sortingFn: (rowA, rowB) =>
                (rowA.original?.timer ?? 0) - (rowB.original?.timer ?? 0),
            cell: ({ row }) => <Timer epoch={row.original?.timer} />
        },
        {
            id: 'displayName',
            accessorFn: (row) => row?.displayName,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.playerList.displayName')
                }),
            size: 200,
            sortingFn: (rowA, rowB) =>
                sortAlphabetically(rowA.original, rowB.original, 'displayName'),
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                const style = randomUserColours?.value
                    ? { color: userRef?.$userColour }
                    : null;
                return <span style={style}>{userRef?.displayName ?? ''}</span>;
            }
        },
        {
            id: 'rank',
            accessorFn: (row) => row?.ref?.$trustSortNum,
            header: ({ column }) =>
                sortButton({ column, label: t('table.playerList.rank') }),
            size: 110,
            sortingFn: (rowA, rowB) =>
                (rowA.original?.ref?.$trustSortNum ?? 0) -
                (rowB.original?.ref?.$trustSortNum ?? 0),
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                return (
                    <span
                        class={['name', userRef?.$trustClass]
                            .filter(Boolean)
                            .join(' ')}
                    >
                        {userRef?.$trustLevel ?? ''}
                    </span>
                );
            }
        },
        {
            id: 'status',
            accessorFn: (row) => row?.ref?.statusDescription,
            header: () => t('table.playerList.status'),
            minSize: 200,
            enableSorting: false,
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                const status = userRef?.status;
                return (
                    <span class="flex w-full min-w-0 items-center gap-2">
                        <i
                            class={[
                                'x-user-status',
                                'shrink-0',
                                'mr-1',
                                status ? statusClass(status) : null
                            ]}
                        ></i>
                        <span class="min-w-0 truncate">
                            {userRef?.statusDescription ?? ''}
                        </span>
                    </span>
                );
            }
        }
    ];

    if (photonLoggingEnabled?.value) {
        cols.push({
            id: 'photonId',
            accessorFn: (row) => row?.photonId,
            header: ({ column }) =>
                sortButton({ column, label: t('table.playerList.photonId') }),
            size: 110,
            sortingFn: (rowA, rowB) =>
                (rowA.original?.photonId ?? 0) - (rowB.original?.photonId ?? 0),
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                const userId = userRef?.id;
                const isBlocked =
                    userId && chatboxUserBlacklist?.value?.has?.(userId);

                return (
                    <div class="flex items-center">
                        {userId ? (
                            <button
                                class={
                                    isBlocked
                                        ? 'mr-1 text-xs underline text-destructive'
                                        : 'mr-1 text-xs underline'
                                }
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isBlocked) {
                                        onUnblockChatbox(userId);
                                    } else {
                                        onBlockChatbox(userRef);
                                    }
                                }}
                            >
                                {isBlocked ? 'Unblock' : 'Block'}
                            </button>
                        ) : null}
                        <span>{String(row.original?.photonId ?? '')}</span>
                    </div>
                );
            }
        });
    }

    cols.push(
        {
            id: 'icon',
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.playerList.icon'),
                    descFirst: true
                }),
            size: 90,
            accessorFn: (row) => getInstanceIconWeight(row),
            meta: {
                class: 'text-center'
            },
            sortingFn: (rowA, rowB, columnId) => {
                const a = rowA.original;
                const b = rowB.original;
                return -sortInstanceIcon(a, b);
            },
            cell: ({ row }) => {
                const r = row.original;
                return (
                    <div class="flex items-center justify-center gap-1">
                        {r?.isMaster ? (
                            <TooltipWrapper
                                side="left"
                                content="Instance Master"
                            >
                                <span>👑</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.isModerator ? (
                            <TooltipWrapper side="left" content="Moderator">
                                <span>⚔️</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.isFriend ? (
                            <TooltipWrapper side="left" content="Friend">
                                <span>💚</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.isBlocked ? (
                            <TooltipWrapper side="left" content="Blocked">
                                <span class="text-destructive">⛔</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.isMuted ? (
                            <TooltipWrapper side="left" content="Muted">
                                <span class="text-muted-foreground">🔇</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.isAvatarInteractionDisabled ? (
                            <TooltipWrapper
                                side="left"
                                content="Avatar Interaction Disabled"
                            >
                                <span class="text-muted-foreground">🚫</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.isChatBoxMuted ? (
                            <TooltipWrapper side="left" content="Chatbox Muted">
                                <span class="text-muted-foreground">💬</span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.timeoutTime ? (
                            <TooltipWrapper side="left" content="Timeout">
                                <span class="text-destructive">
                                    🔴{r.timeoutTime}s
                                </span>
                            </TooltipWrapper>
                        ) : null}
                        {r?.ageVerified ? (
                            <TooltipWrapper side="left" content="18+ Verified">
                                <IdCard class="h-4 w-4 x-tag-age-verification" />
                            </TooltipWrapper>
                        ) : null}
                    </div>
                );
            }
        },
        {
            id: 'platform',
            header: () => t('table.playerList.platform'),
            size: 90,
            enableSorting: false,
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                const platform = userRef?.$platform;
                const inVRMode = row.original?.inVRMode;

                const platformIcon =
                    platform === 'standalonewindows' ? (
                        <Monitor class="h-4 w-4 x-tag-platform-pc" />
                    ) : platform === 'android' ? (
                        <Smartphone class="h-4 w-4 x-tag-platform-quest" />
                    ) : platform === 'ios' ? (
                        <Apple class="h-4 w-4 x-tag-platform-ios" />
                    ) : platform ? (
                        <span>{String(platform)}</span>
                    ) : null;

                const mode =
                    inVRMode === null || inVRMode === undefined
                        ? null
                        : inVRMode
                          ? 'VR'
                          : userRef?.last_platform === 'android' ||
                              userRef?.last_platform === 'ios'
                            ? 'M'
                            : 'D';

                return (
                    <div class="flex items-center gap-1">
                        {platformIcon}
                        {mode ? <span>{mode}</span> : null}
                    </div>
                );
            }
        },
        {
            id: 'language',
            header: () => t('table.playerList.language'),
            size: 100,
            enableSorting: false,
            cell: ({ row }) => {
                const userRef = row.original?.ref;
                const langs = userRef?.$languages ?? [];
                return (
                    <div class="flex items-center gap-0.5">
                        {langs.map((item) => (
                            <TooltipWrapper
                                key={item.key}
                                side="top"
                                v-slots={{
                                    content: () => (
                                        <span>
                                            {item.value} ({item.key})
                                        </span>
                                    )
                                }}
                            >
                                <span
                                    class={[
                                        'flags',
                                        'inline-block',
                                        'mr-1',
                                        languageClass(item.key)
                                    ]}
                                />
                            </TooltipWrapper>
                        ))}
                    </div>
                );
            }
        },
        {
            id: 'bioLink',
            header: () => t('table.playerList.bioLink'),
            size: 100,
            enableSorting: false,
            cell: ({ row }) => {
                const links =
                    row.original?.ref?.bioLinks?.filter(Boolean) ?? [];
                return (
                    <div class="flex items-center">
                        {links.map((link, index) => (
                            <TooltipWrapper
                                key={index}
                                v-slots={{
                                    content: () => (
                                        <span>{String(link ?? '')}</span>
                                    )
                                }}
                            >
                                <img
                                    src={getFaviconUrl(link)}
                                    class="h-4 w-4 mr-1 align-middle cursor-pointer"
                                    loading="lazy"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openExternalLink(String(link));
                                    }}
                                />
                            </TooltipWrapper>
                        ))}
                    </div>
                );
            }
        },
        {
            id: 'note',
            accessorFn: (row) => row?.ref?.note,
            header: () => t('table.playerList.note'),
            size: 150,
            minSize: 40,
            meta: {
                stretch: true
            },
            enableSorting: false,
            cell: ({ row }) => {
                const note = row.original?.ref?.note;
                const text =
                    typeof note === 'string' || typeof note === 'number'
                        ? String(note)
                        : '';
                return <span>{text}</span>;
            }
        }
    );

    return cols;
};
