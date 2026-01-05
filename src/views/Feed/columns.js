import { ElTag, ElTooltip } from 'element-plus';
import { h, resolveComponent } from 'vue';

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
            return h(
                ElTooltip,
                { placement: 'right' },
                {
                    content: () =>
                        h('span', formatDateFilter(createdAt, 'long')),
                    default: () =>
                        h('span', formatDateFilter(createdAt, 'short'))
                }
            );
        }
    },
    {
        accessorKey: 'type',
        header: () => t('table.feed.type'),
        cell: ({ row }) => {
            const type = row.getValue('type');
            return h(
                ElTag,
                { type: 'info', effect: 'plain', size: 'small' },
                () => t(`view.feed.filters.${type}`)
            );
        }
    },
    {
        accessorKey: 'displayName',
        header: () => t('table.feed.user'),
        cell: ({ row }) => {
            const { showUserDialog } = useUserStore();
            const original = row.original;
            return h(
                'span',
                {
                    class: 'x-link table-user',
                    style: 'padding-right: 10px',
                    onClick: () => showUserDialog(original.userId)
                },
                original.displayName
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
                return original.location
                    ? h(Location, {
                          location: original.location,
                          hint: original.worldName,
                          grouphint: original.groupName
                      })
                    : null;
            }

            if (type === 'Offline' || type === 'Online') {
                return original.location
                    ? h(Location, {
                          location: original.location,
                          hint: original.worldName,
                          grouphint: original.groupName
                      })
                    : null;
            }

            if (type === 'Status') {
                if (
                    original.statusDescription ===
                    original.previousStatusDescription
                ) {
                    return h('span', [
                        h('i', {
                            class: [
                                'x-user-status',
                                statusClass(original.previousStatus)
                            ]
                        }),
                        h('span', { class: 'mx-2' }, ' → '),
                        h('i', {
                            class: [
                                'x-user-status',
                                statusClass(original.status)
                            ]
                        })
                    ]);
                }

                return h('span', [
                    h('i', {
                        class: [
                            'x-user-status',
                            'mr-2',
                            statusClass(original.status)
                        ]
                    }),
                    h('span', original.statusDescription)
                ]);
            }

            if (type === 'Avatar') {
                return h(AvatarInfo, {
                    imageurl: original.currentAvatarImageUrl,
                    userid: original.userId,
                    hintownerid: original.ownerId,
                    hintavatarname: original.avatarName,
                    avatartags: original.currentAvatarTags
                });
            }

            if (type === 'Bio') {
                return h('span', original.bio);
            }

            return null;
        }
    }
];
