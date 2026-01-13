import { Trash2 } from 'lucide-vue-next';

import { Button } from '../../../components/ui/button';
import { i18n } from '../../../plugin';

const { t } = i18n.global;

export const createColumns = ({ onShowWorld, onShowUser, onDelete, onShowFullscreenImage }) => [
    {
        id: 'image',
        header: () => t('table.import.image'),
        enableSorting: false,
        size: 70,
        cell: ({ row }) => {
            const original = row.original;
            const thumb = original?.thumbnailImageUrl;
            const full = original?.imageUrl;

            return (
                <img
                    src={thumb}
                    class="friends-list-avatar"
                    loading="lazy"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (full) {
                            onShowFullscreenImage?.(full);
                        }
                    }}
                />
            );
        }
    },
    {
        id: 'name',
        accessorKey: 'name',
        header: () => t('table.import.name'),
        meta: {
            stretch: true
        },
        cell: ({ row }) => {
            const original = row.original;
            return (
                <span
                    class="x-link"
                    title={original?.name}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowWorld?.(original?.id);
                    }}
                >
                    {original?.name}
                </span>
            );
        }
    },
    {
        id: 'author',
        header: () => t('table.import.author'),
        size: 120,
        enableSorting: false,
        cell: ({ row }) => {
            const original = row.original;
            return (
                <span
                    class="x-link"
                    title={original?.authorName}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowUser?.(original?.authorId);
                    }}
                >
                    {original?.authorName}
                </span>
            );
        }
    },
    {
        id: 'status',
        header: () => t('table.import.status'),
        size: 70,
        enableSorting: false,
        cell: ({ row }) => {
            const status = String(row.original?.releaseStatus ?? '');
            const label = status
                ? status.charAt(0).toUpperCase() + status.slice(1)
                : '';
            const color =
                status === 'public'
                    ? '#67c23a'
                    : status === 'private'
                      ? '#f56c6c'
                      : undefined;
            return <span style={{ color }}>{label}</span>;
        }
    },
    {
        id: 'action',
        header: () => t('table.import.action'),
        size: 90,
        enableSorting: false,
        meta: {
            tdClass: 'text-right'
        },
        cell: ({ row }) => {
            const original = row.original;
            return (
                <Button
                    size="icon-sm"
                    variant="ghost"
                    class="w-6 h-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(original);
                    }}
                >
                    <Trash2 />
                </Button>
            );
        }
    }
];
