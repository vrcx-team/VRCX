import { Trash2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { InputGroupTextareaField } from '@/components/ui/input-group';
import { i18n } from '@/plugin';

const { t } = i18n.global;

export const createColumns = ({ userImage, userImageFull, onShowFullscreenImage, onShowUser, onRemove }) => [
    {
        id: 'image',
        header: () => t('table.import.image'),
        enableSorting: false,
        size: 70,
        cell: ({ row }) => {
            const original = row.original;
            const ref = original?.ref;
            const thumb = userImage?.(ref);
            const full = userImageFull?.(ref);

            return (
                <el-popover
                    placement="right"
                    width={500}
                    trigger="hover"
                    v-slots={{
                        reference: () => (
                            <img
                                src={thumb}
                                class="friends-list-avatar"
                                loading="lazy"
                            />
                        )
                    }}
                >
                    <img
                        src={full}
                        class={['friends-list-avatar', 'x-popover-image']}
                        style="cursor: pointer"
                        loading="lazy"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (full) {
                                onShowFullscreenImage?.(full);
                            }
                        }}
                    />
                </el-popover>
            );
        }
    },
    {
        id: 'name',
        header: () => t('table.import.name'),
        size: 170,
        cell: ({ row }) => {
            const original = row.original;
            return (
                <span
                    class="x-link"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowUser?.(original?.id);
                    }}
                >
                    {original?.name}
                </span>
            );
        }
    },
    {
        id: 'memo',
        accessorKey: 'memo',
        header: () => t('table.import.note'),
        enableSorting: false,
        meta: {
            stretch: true
        },
        cell: ({ row }) => {
            const original = row.original;
            return (
                <InputGroupTextareaField
                    modelValue={original?.memo ?? ''}
                    onUpdate:modelValue={(value) => {
                        original.memo = value;
                    }}
                    maxlength={256}
                    rows={2}
                    input-class="min-h-0 py-1 resize-none"
                    show-count
                />
            );
        }
    },
    {
        id: 'skip',
        header: () => t('table.import.skip_export'),
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
                        onRemove?.(original);
                    }}
                >
                    <Trash2 />
                </Button>
            );
        }
    }
];
