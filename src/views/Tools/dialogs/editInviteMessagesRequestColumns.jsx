import CountdownTimer from '@/components/CountdownTimer.vue';
import { i18n } from '@/plugin';

const { t } = i18n.global;

export const columns = [
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
    }
];
