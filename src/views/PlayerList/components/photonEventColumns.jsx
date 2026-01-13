import { ArrowRight, Download } from '@element-plus/icons-vue';

import Location from '@/components/Location.vue';
import { TooltipWrapper } from '@/components/ui/tooltip';
import { i18n } from '@/plugin';
import { formatDateFilter, statusClass } from '@/shared/utils';

const { t } = i18n.global;

const statusLabel = (key) => {
    if (key === 'active') return t('dialog.user.status.active');
    if (key === 'join me') return t('dialog.user.status.join_me');
    if (key === 'ask me') return t('dialog.user.status.ask_me');
    if (key === 'busy') return t('dialog.user.status.busy');
    return t('dialog.user.status.offline');
};

const avatarStatusLabel = (status) => {
    if (status === 'public') return t('dialog.avatar.labels.public');
    if (status === 'private') return t('dialog.avatar.labels.private');
    return '';
};

const avatarStatusClass = (status) => {
    if (status === 'public') return 'avatar-info-public';
    if (status === 'private') return 'avatar-info-own';
    return null;
};

function DetailCell({ row, isPrevious, onShowAvatar, onShowGroup, onShowWorld, onShowUser, onShowImage }) {
    const r = row;
    if (!r) return null;

    if (r.type === 'ChangeAvatar') {
        return (
            <>
                <span
                    class="x-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowAvatar?.(r.avatar?.id);
                    }}
                >
                    {r.avatar?.name}
                </span>
                &nbsp;
                {!r.inCache ? (
                    <span style="color: #aaa">
                        <el-icon>
                            <Download />
                        </el-icon>
                        &nbsp;
                    </span>
                ) : null}
                {r.avatar?.releaseStatus ? (
                    <span class={avatarStatusClass(r.avatar.releaseStatus)}>
                        {avatarStatusLabel(r.avatar.releaseStatus)}
                    </span>
                ) : null}
                {isPrevious &&
                r.avatar?.description &&
                r.avatar?.name !== r.avatar?.description ? (
                    <>
                        {' | - '}
                        {r.avatar.description}
                    </>
                ) : null}
            </>
        );
    }

    if (r.type === 'ChangeStatus') {
        return (
            <>
                {r.status !== r.previousStatus ? (
                    <>
                        <TooltipWrapper
                            side="top"
                            v-slots={{
                                content: () => (
                                    <span>{statusLabel(r.previousStatus)}</span>
                                )
                            }}
                        >
                            <i
                                class={[
                                    'x-user-status',
                                    statusClass(r.previousStatus)
                                ]}
                            ></i>
                        </TooltipWrapper>
                        <span>
                            <el-icon>
                                <ArrowRight />
                            </el-icon>
                        </span>
                        <TooltipWrapper
                            side="top"
                            v-slots={{
                                content: () => (
                                    <span>{statusLabel(r.status)}</span>
                                )
                            }}
                        >
                            <i
                                class={['x-user-status', statusClass(r.status)]}
                                style="margin-right: 5px"
                            ></i>
                        </TooltipWrapper>
                    </>
                ) : null}
                {r.statusDescription !== r.previousStatusDescription ? (
                    <span>{r.statusDescription}</span>
                ) : null}
            </>
        );
    }

    if (r.type === 'ChangeGroup') {
        return (
            <>
                <span
                    class="x-link"
                    style="margin-right: 5px"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowGroup?.(r.previousGroupId);
                    }}
                >
                    {r.previousGroupName || r.previousGroupId}
                </span>
                <span>
                    <el-icon>
                        <ArrowRight />
                    </el-icon>
                </span>
                <span
                    class="x-link"
                    style="margin-left: 5px"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowGroup?.(r.groupId);
                    }}
                >
                    {r.groupName || r.groupId}
                </span>
            </>
        );
    }

    if (r.type === 'PortalSpawn') {
        return (
            <span
                class="x-link"
                onClick={(e) => {
                    e.stopPropagation();
                    onShowWorld?.(r.location, r.shortName);
                }}
            >
                <Location
                    location={r.location}
                    hint={r.worldName}
                    grouphint={r.groupName}
                    link={false}
                />
            </span>
        );
    }

    if (r.type === 'ChatBoxMessage') {
        return <span>{r.text}</span>;
    }

    if (r.type === 'OnPlayerJoined') {
        return (
            <>
                {r.platform === 'Desktop' ? (
                    <span style="color: var(--el-color-primary)">
                        Desktop&nbsp;
                    </span>
                ) : r.platform === 'VR' ? (
                    <span style="color: var(--el-color-primary)">VR&nbsp;</span>
                ) : r.platform === 'Quest' ? (
                    <span style="color: var(--el-color-success)">
                        Android&nbsp;
                    </span>
                ) : null}

                <span
                    class="x-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowAvatar?.(r.avatar?.id);
                    }}
                >
                    {r.avatar?.name}
                </span>
                &nbsp;
                {!r.inCache ? (
                    <span style="color: #aaa">
                        <el-icon>
                            <Download />
                        </el-icon>
                        &nbsp;
                    </span>
                ) : null}
                {r.avatar?.releaseStatus ? (
                    <span class={avatarStatusClass(r.avatar.releaseStatus)}>
                        {avatarStatusLabel(r.avatar.releaseStatus)}
                    </span>
                ) : null}
            </>
        );
    }

    if (r.type === 'SpawnEmoji') {
        return r.imageUrl ? (
            <TooltipWrapper
                side="right"
                v-slots={{
                    content: () => (
                        <img
                            src={r.imageUrl}
                            class="friends-list-avatar"
                            style="height: 500px; cursor: pointer"
                            loading="lazy"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowImage?.(r.imageUrl);
                            }}
                        />
                    )
                }}
            >
                <span>{r.fileId}</span>
            </TooltipWrapper>
        ) : (
            <span>{r.text}</span>
        );
    }

    if (r.color === 'yellow') {
        return <span style="color: yellow">{r.text}</span>;
    }

    return <span>{r.text}</span>;
}

export const createColumns = ({ isPrevious, onShowUser, onShowAvatar, onShowGroup, onShowWorld, onShowImage }) => [
    {
        id: 'created_at',
        accessorFn: (row) => (row?.created_at ? Date.parse(row.created_at) : 0),
        header: () => t('table.playerList.date'),
        size: 130,
        cell: ({ row }) => (
            <TooltipWrapper
                side="right"
                v-slots={{
                    content: () => (
                        <span>
                            {formatDateFilter(row.original?.created_at, 'long')}
                        </span>
                    )
                }}
            >
                <span>{formatDateFilter(row.original?.created_at, 'short')}</span>
            </TooltipWrapper>
        )
    },
    {
        id: 'user',
        header: () => t('table.playerList.user'),
        size: 160,
        enableSorting: false,
        cell: ({ row }) => (
            <span
                class="x-link"
                style="padding-right: 10px"
                onClick={(e) => {
                    e.stopPropagation();
                    onShowUser?.(row.original);
                }}
            >
                {row.original?.displayName}
            </span>
        )
    },
    {
        id: 'type',
        accessorKey: 'type',
        header: () => t('table.playerList.type'),
        size: 140
    },
    {
        id: 'detail',
        accessorKey: 'text',
        header: () => t('table.playerList.detail'),
        enableSorting: false,
        meta: {
            stretch: true
        },
        cell: ({ row }) => (
            <DetailCell
                row={row.original}
                isPrevious={!!isPrevious}
                onShowAvatar={onShowAvatar}
                onShowGroup={onShowGroup}
                onShowWorld={onShowWorld}
                onShowImage={onShowImage}
            />
        )
    }
];
