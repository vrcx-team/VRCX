import { ElTag } from 'element-plus';
import { resolveComponent } from 'vue';

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import { formatDateFilter, statusClass } from '../../shared/utils';
import { i18n } from '../../plugin';
import { useUserStore } from '../../stores';

const { t } = i18n.global;

export const columns = [
    {
        accessorKey: 'created_at',
        header: () => t('table.feed.date'),
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
        header: () => t('table.feed.type'),
        cell: ({ row }) => {
            const type = row.getValue('type');
            return (
                <ElTag type="info" effect="plain" size="small">
                    {t(`view.feed.filters.${type}`)}
                </ElTag>
            );
        }
    },
    {
        accessorKey: 'displayName',
        header: () => t('table.feed.user'),
        cell: ({ row }) => {
            const { showUserDialog } = useUserStore();
            const original = row.original;
            return (
                <span
                    class="x-link table-user"
                    style="padding-right: 10px"
                    onClick={() => showUserDialog(original.userId)}
                >
                    {original.displayName}
                </span>
            );
        }
    },
    {
        id: 'detail',
        header: () => t('table.feed.detail'),
        cell: ({ row }) => {
            const original = row.original;
            const type = original.type;
            const Location = resolveComponent('Location');
            const AvatarInfo = resolveComponent('AvatarInfo');

            if (type === 'GPS') {
                return original.location ? (
                    <Location
                        location={original.location}
                        hint={original.worldName}
                        grouphint={original.groupName}
                    />
                ) : null;
            }

            if (type === 'Offline' || type === 'Online') {
                return original.location ? (
                    <Location
                        location={original.location}
                        hint={original.worldName}
                        grouphint={original.groupName}
                    />
                ) : null;
            }

            if (type === 'Status') {
                if (
                    original.statusDescription ===
                    original.previousStatusDescription
                ) {
                    return (
                        <span>
                            <i
                                class={[
                                    'x-user-status',
                                    statusClass(original.previousStatus)
                                ]}
                            ></i>
                            <span class="mx-2"> Ўъ </span>
                            <i
                                class={[
                                    'x-user-status',
                                    statusClass(original.status)
                                ]}
                            ></i>
                        </span>
                    );
                }

                return (
                    <span>
                        <i
                            class={[
                                'x-user-status',
                                'mr-2',
                                statusClass(original.status)
                            ]}
                        ></i>
                        <span>{original.statusDescription}</span>
                    </span>
                );
            }

            if (type === 'Avatar') {
                return (
                    <AvatarInfo
                        imageurl={original.currentAvatarImageUrl}
                        userid={original.userId}
                        hintownerid={original.ownerId}
                        hintavatarname={original.avatarName}
                        avatartags={original.currentAvatarTags}
                    />
                );
            }

            if (type === 'Bio') {
                return <span>{original.bio}</span>;
            }

            return null;
        }
    }
];
