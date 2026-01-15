import { ArrowUpDown, UserMinus } from 'lucide-vue-next';

import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { TooltipWrapper } from '../../components/ui/tooltip';
import { i18n } from '../../plugin';
import {
    formatDateFilter,
    getFaviconUrl,
    languageClass,
    openExternalLink,
    sortStatus,
    statusClass,
    timeToText,
    userImage
} from '../../shared/utils';

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

const compareNumbers = (a, b) => (a ?? 0) - (b ?? 0);

const sortAlphabetically = (a, b) => {
    if (!a || !b) {
        if (!a && !b) return 0;
        return !a ? -1 : 1;
    }
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
};

const sortLanguages = (a, b) => {
    const as = Array.isArray(a) ? a.map((i) => i.value).sort() : [];
    const bs = Array.isArray(b) ? b.map((i) => i.value).sort() : [];
    return JSON.stringify(as).localeCompare(JSON.stringify(bs));
};

const withFriendNumber = (rowA, rowB, result) => {
    if (result !== 0) {
        return result;
    }
    return compareNumbers(
        rowA.original?.$friendNumber,
        rowB.original?.$friendNumber
    );
};

const sortByNumber = (selector) => (rowA, rowB) =>
    withFriendNumber(
        rowA,
        rowB,
        compareNumbers(selector(rowA.original), selector(rowB.original))
    );

const sortByString = (selector) => (rowA, rowB) =>
    withFriendNumber(
        rowA,
        rowB,
        sortAlphabetically(selector(rowA.original), selector(rowB.original))
    );

const sortByStatus = (rowA, rowB) => {
    const a = rowA.original?.status ?? 'offline';
    const b = rowB.original?.status ?? 'offline';
    return withFriendNumber(rowA, rowB, sortStatus(a, b));
};

const sortByLanguages = (rowA, rowB) =>
    withFriendNumber(
        rowA,
        rowB,
        sortLanguages(rowA.original?.$languages, rowB.original?.$languages)
    );

export const createColumns = ({
    randomUserColours,
    bulkUnfriendMode,
    selectedFriends,
    onToggleFriendSelection,
    onConfirmDeleteFriend
}) => {
    /** @type {import('@tanstack/vue-table').ColumnDef<any, any>[]} */
    const cols = [];

    if (bulkUnfriendMode?.value) {
        cols.push({
            id: 'bulkSelect',
            header: () => null,
            size: 55,
            enableSorting: false,
            enableResizing: false,
            meta: {
                thClass: 'p-0',
                tdClass: 'p-0'
            },
            cell: ({ row }) => {
                const id = row.original?.id;
                const checked = selectedFriends?.value?.has?.(id);
                return (
                    <div
                        class="flex items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Checkbox
                            modelValue={checked}
                            onUpdate:modelValue={() =>
                                onToggleFriendSelection?.(id)
                            }
                        />
                    </div>
                );
            }
        });
    }

    cols.push(
        {
            id: 'leftSpacer',
            header: () => null,
            size: 20,
            enableSorting: false,
            enableResizing: false,
            meta: {
                thClass: 'p-0',
                tdClass: 'p-0'
            },
            cell: () => null
        },
        {
            id: 'friendNumber',
            accessorFn: (row) => row?.$friendNumber,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.no'),
                    descFirst: true
                }),
            size: 100,
            sortingFn: sortByNumber((row) => row?.$friendNumber ?? 0),
            cell: ({ row }) => <span>{row.original?.$friendNumber || ''}</span>
        },
        {
            id: 'avatar',
            accessorFn: (row) => row?.photo,
            header: () => t('table.friendList.avatar'),
            size: 90,
            enableSorting: false,
            cell: ({ row }) => {
                const src = userImage(row.original, true);
                return src ? (
                    <div class="flex items-center">
                        <img
                            src={src}
                            class="friends-list-avatar object-cover w-6! h-6"
                            loading="lazy"
                        />
                    </div>
                ) : null;
            }
        },
        {
            id: 'displayName',
            accessorFn: (row) => row?.displayName,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.displayName')
                }),
            size: 200,
            sortingFn: sortByString((row) => row?.displayName ?? ''),
            cell: ({ row }) => {
                const style = randomUserColours?.value
                    ? { color: row.original?.$userColour }
                    : null;
                return (
                    <span class="name" style={style}>
                        {row.original?.displayName ?? ''}
                    </span>
                );
            }
        },
        {
            id: 'rank',
            accessorFn: (row) => row?.$trustSortNum,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.rank')
                }),
            size: 140,
            sortingFn: sortByNumber((row) => row?.$trustSortNum ?? 0),
            cell: ({ row }) => {
                if (randomUserColours?.value) {
                    return (
                        <span class={row.original?.$trustClass}>
                            {row.original?.$trustLevel ?? ''}
                        </span>
                    );
                }
                return (
                    <span
                        class="name"
                        style={{ color: row.original?.$userColour }}
                    >
                        {row.original?.$trustLevel ?? ''}
                    </span>
                );
            }
        },
        {
            id: 'status',
            accessorFn: (row) => row?.status,
            header: ({ column }) =>
                sortButton({ column, label: t('table.friendList.status') }),
            minSize: 200,
            sortingFn: sortByStatus,
            meta: {
                stretch: true
            },
            cell: ({ row }) => {
                const status = row.original?.status;
                return (
                    <span class="flex items-center">
                        {status && status !== 'offline' ? (
                            <i
                                class={[
                                    'x-user-status',
                                    statusClass(status),
                                    'mr-1'
                                ]}
                            ></i>
                        ) : null}
                        <span>{row.original?.statusDescription ?? ''}</span>
                    </span>
                );
            }
        },
        {
            id: 'language',
            accessorFn: (row) => row?.$languages,
            header: ({ column }) =>
                sortButton({ column, label: t('table.friendList.language') }),
            size: 130,
            sortingFn: sortByLanguages,
            cell: ({ row }) => (
                <div class="flex items-center">
                    {(row.original?.$languages ?? []).map((item) => (
                        <TooltipWrapper
                            key={item.key}
                            side="top"
                            content={`${item.value} (${item.key})`}
                        >
                            <span
                                class={[
                                    'flags',
                                    'inline-block',
                                    'mr-1',
                                    languageClass(item.key)
                                ]}
                            ></span>
                        </TooltipWrapper>
                    ))}
                </div>
            )
        },
        {
            id: 'bioLink',
            header: () => t('table.friendList.bioLink'),
            size: 130,
            enableSorting: false,
            cell: ({ row }) => (
                <div class="flex items-center">
                    {(row.original?.bioLinks ?? [])
                        .filter(Boolean)
                        .map((link, index) => (
                            <TooltipWrapper key={index} content={String(link)}>
                                <img
                                    src={getFaviconUrl(link)}
                                    class="h-4 w-4 mr-1 align-middle cursor-pointer"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        openExternalLink(link);
                                    }}
                                    loading="lazy"
                                />
                            </TooltipWrapper>
                        ))}
                </div>
            )
        },
        {
            id: 'joinCount',
            accessorFn: (row) => row?.$joinCount,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.joinCount')
                }),
            size: 120,
            sortingFn: sortByNumber((row) => row?.$joinCount ?? 0),
            meta: {
                class: 'text-right'
            }
        },
        {
            id: 'timeTogether',
            accessorFn: (row) => row?.$timeSpent,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.timeTogether')
                }),
            size: 140,
            sortingFn: sortByNumber((row) => row?.$timeSpent ?? 0),
            meta: {
                class: 'text-right'
            },
            cell: ({ row }) => {
                const time = row.original?.$timeSpent;
                return time ? <span>{timeToText(time)}</span> : null;
            }
        },
        {
            id: 'lastSeen',
            accessorFn: (row) => row?.$lastSeen,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.lastSeen')
                }),
            size: 170,
            sortingFn: sortByString((row) => row?.$lastSeen ?? ''),
            cell: ({ row }) => {
                const text = formatDateFilter(row.original?.$lastSeen, 'long');
                return <span>{text === '-' ? '' : text}</span>;
            }
        },
        {
            id: 'mutualFriends',
            accessorFn: (row) => row?.$mutualCount,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.mutualFriends')
                }),
            size: 120,
            sortingFn: sortByNumber((row) => row?.$mutualCount ?? 0),
            meta: {
                class: 'text-right'
            },
            cell: ({ row }) => {
                const count = row.original?.$mutualCount;
                return count ? <span>{count}</span> : null;
            }
        },
        {
            id: 'lastActivity',
            accessorFn: (row) => row?.last_activity,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.lastActivity')
                }),
            size: 200,
            sortingFn: sortByString((row) => row?.last_activity ?? ''),
            cell: ({ row }) => (
                <span>
                    {formatDateFilter(row.original?.last_activity, 'long')}
                </span>
            )
        },
        {
            id: 'lastLogin',
            accessorFn: (row) => row?.last_login,
            header: ({ column }) =>
                sortButton({ column, label: t('table.friendList.lastLogin') }),
            size: 200,
            sortingFn: sortByString((row) => row?.last_login ?? ''),
            cell: ({ row }) => (
                <span>
                    {formatDateFilter(row.original?.last_login, 'long')}
                </span>
            )
        },
        {
            id: 'dateJoined',
            accessorFn: (row) => row?.date_joined,
            header: ({ column }) =>
                sortButton({
                    column,
                    label: t('table.friendList.dateJoined')
                }),
            size: 120,
            sortingFn: sortByString((row) => row?.date_joined ?? ''),
            cell: ({ row }) => <span>{row.original?.date_joined ?? ''}</span>
        },
        {
            id: 'unfriend',
            header: () => t('table.friendList.unfriend'),
            size: 100,
            enableSorting: false,
            meta: {
                class: 'text-center'
            },
            cell: ({ row }) => (
                // TODO(icon): verify unfollow icon replacement
                <UserMinus
                    class="h-4 w-4 text-destructive inline-block"
                    onClick={(event) => {
                        event.stopPropagation();
                        onConfirmDeleteFriend?.(row.original?.id);
                    }}
                />
            )
        }
    );

    return cols;
};
