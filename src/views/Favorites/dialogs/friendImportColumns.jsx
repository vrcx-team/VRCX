import { Trash2 } from 'lucide-vue-next';

import { Button } from '../../../components/ui/button';
import { i18n } from '../../../plugin';

const { t } = i18n.global;

export const createColumns = ({ userImage, userImageFull, onShowFullscreenImage, onShowUser, onDelete }) => [
    {
        id: 'image',
        header: () => t('table.import.image'),
        enableSorting: false,
        size: 70,
        cell: ({ row }) => {
            const original = row.original;
            const thumb = userImage?.(original);
            const full = userImageFull?.(original);

            return (
                <img
                    class="friends-list-avatar"
                    src={thumb}
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
        accessorKey: 'displayName',
        header: () => t('table.import.name'),
        meta: {
            stretch: true
        },
        cell: ({ row }) => {
            const original = row.original;
            return (
                <span
                    class="cursor-pointer"
                    title={original?.displayName}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowUser?.(original?.id);
                    }}
                >
                    {original?.displayName}
                </span>
            );
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
