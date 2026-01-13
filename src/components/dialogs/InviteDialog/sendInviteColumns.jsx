import CountdownTimer from '@/components/CountdownTimer.vue';
import { Button } from '@/components/ui/button';
import { i18n } from '@/plugin';
import { SquarePen } from 'lucide-vue-next';

const { t } = i18n.global;

export const createColumns = ({ onEdit }) => [
    {
        accessorKey: 'slot',
        header: () => t('table.profile.invite_messages.slot'),
        size: 70
    },
    {
        accessorKey: 'message',
        header: () => t('table.profile.invite_messages.message'),
        meta: {
            stretch: true
        }
    },
    {
        accessorKey: 'updatedAt',
        header: () => t('table.profile.invite_messages.cool_down'),
        size: 110,
        meta: {
            tdClass: 'text-right'
        },
        cell: ({ row }) => (
            <CountdownTimer datetime={row.original?.updatedAt} hours={1} />
        )
    },
    {
        id: 'action',
        header: () => t('table.profile.invite_messages.action'),
        size: 70,
        enableSorting: false,
        meta: {
            tdClass: 'text-right'
        },
        cell: ({ row }) => (
            <Button
                size="icon-sm"
                class="w-6 h-6"
                variant="ghost"
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(row.original);
                }}
            >
                <SquarePen />
            </Button>
        )
    }
];
