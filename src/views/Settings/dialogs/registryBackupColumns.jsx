import { Download, RotateCcw, Trash2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { TooltipWrapper } from '@/components/ui/tooltip';
import { i18n } from '@/plugin';
import { formatDateFilter } from '@/shared/utils';

const { t } = i18n.global;

export const createColumns = ({ onRestore, onSaveToFile, onDelete }) => [
    {
        id: 'name',
        accessorKey: 'name',
        header: () => t('dialog.registry_backup.name'),
        meta: {
            stretch: true
        },
        cell: ({ row }) => <span>{row.original?.name}</span>
    },
    {
        id: 'date',
        accessorFn: (row) => {
            const v = row?.date;
            if (typeof v === 'number') return v;
            const ts = Date.parse(String(v ?? ''));
            return Number.isFinite(ts) ? ts : 0;
        },
        header: ({ column }) => (
            <button
                class="inline-flex items-center"
                onClick={() => {
                    const sorted = column.getIsSorted();
                    column.toggleSorting(sorted === 'asc');
                }}
            >
                {t('dialog.registry_backup.date')}
            </button>
        ),
        size: 170,
        cell: ({ row }) => (
            <span>{formatDateFilter(row.original?.date, 'long')}</span>
        )
    },
    {
        id: 'action',
        header: () => t('dialog.registry_backup.action'),
        enableSorting: false,
        size: 120,
        meta: {
            tdClass: 'text-right'
        },
        cell: ({ row }) => {
            const original = row.original;
            return (
                <div class="inline-flex items-center justify-end gap-1">
                    <TooltipWrapper
                        side="top"
                        content={t('dialog.registry_backup.restore')}
                    >
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="button-pd-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRestore?.(original);
                            }}
                        >
                            <RotateCcw />
                        </Button>
                    </TooltipWrapper>

                    <TooltipWrapper
                        side="top"
                        content={t('dialog.registry_backup.save_to_file')}
                    >
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="button-pd-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSaveToFile?.(original);
                            }}
                        >
                            <Download />
                        </Button>
                    </TooltipWrapper>

                    <TooltipWrapper
                        side="top"
                        content={t('dialog.registry_backup.delete')}
                    >
                        <Button
                            size="icon-sm"
                            variant="ghost"
                            class="button-pd-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(original);
                            }}
                        >
                            <Trash2 />
                        </Button>
                    </TooltipWrapper>
                </div>
            );
        }
    }
];
