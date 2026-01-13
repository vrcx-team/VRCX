import Location from '@/components/Location.vue';
import { i18n } from '@/plugin';
import { formatDateFilter } from '@/shared/utils';

const { t } = i18n.global;

export const createColumns = ({ onShowUser }) => [
    {
        accessorKey: 'created_at',
        header: () => t('dialog.group_member_moderation.created_at'),
        size: 170,
        cell: ({ row }) => (
            <span>{formatDateFilter(row.original?.created_at, 'long')}</span>
        )
    },
    {
        accessorKey: 'eventType',
        header: () => t('dialog.group_member_moderation.type'),
        size: 190,
        cell: ({ row }) => <span>{row.original?.eventType}</span>
    },
    {
        accessorKey: 'actorDisplayName',
        header: () => t('dialog.group_member_moderation.display_name'),
        size: 160,
        cell: ({ row }) => {
            const original = row.original;
            return (
                <span
                    style="cursor: pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowUser?.(original?.actorId);
                    }}
                >
                    <span>{original?.actorDisplayName}</span>
                </span>
            );
        }
    },
    {
        id: 'description',
        accessorFn: (row) => row?.description ?? '',
        header: () => t('dialog.group_member_moderation.description'),
        meta: {
            stretch: true
        },
        cell: ({ row }) => {
            const original = row.original;
            const targetId = original?.targetId ?? '';
            return (
                <span>
                    {typeof targetId === 'string' && targetId.startsWith('wrld_') ? (
                        <Location location={targetId} />
                    ) : null}
                    <span>{original?.description}</span>
                </span>
            );
        }
    },
    {
        id: 'data',
        header: () => t('dialog.group_member_moderation.data'),
        enableSorting: false,
        cell: ({ row }) => {
            const original = row.original;
            const data = original?.data;
            const hasData = data && typeof data === 'object' && Object.keys(data).length;
            return <span>{hasData ? JSON.stringify(data) : ''}</span>;
        }
    }
];
