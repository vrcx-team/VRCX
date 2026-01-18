import { Checkbox } from '@/components/ui/checkbox';
import { i18n } from '@/plugin';
import { formatDateFilter } from '@/shared/utils';

const { t } = i18n.global;

export const createColumns = ({
    randomUserColours,
    rolesText,
    userImage,
    userImageFull,
    onShowFullscreenImage,
    onShowUser,
    onSelectionChange
}) => [
    {
        id: 'selected',
        header: () => null,
        size: 55,
        enableSorting: false,
        cell: ({ row }) => {
            const original = row.original;
            return (
                <div
                    class="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Checkbox
                        modelValue={!!original?.$selected}
                        onUpdate:modelValue={(value) => {
                            original.$selected = value;
                            onSelectionChange?.(original);
                        }}
                    />
                </div>
            );
        }
    },
    {
        id: 'avatar',
        header: () => t('dialog.group_member_moderation.avatar'),
        size: 70,
        enableSorting: false,
        cell: ({ row }) => {
            const original = row.original;
            const thumb = userImage?.(original?.user);
            const full = userImageFull?.(original?.user);

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
        id: 'displayName',
        accessorFn: (row) => row?.user?.displayName ?? '',
        header: () => t('dialog.group_member_moderation.display_name'),
        size: 160,
        cell: ({ row }) => {
            const original = row.original;
            const useColors = !!(randomUserColours?.value ?? randomUserColours);
            const colorStyle = useColors
                ? { color: original?.user?.$userColour }
                : null;

            return (
                <span
                    style="cursor: pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowUser?.(original?.userId);
                    }}
                >
                    <span style={colorStyle}>
                        {original?.user?.displayName}
                    </span>
                </span>
            );
        }
    },
    {
        id: 'roles',
        accessorFn: (row) => rolesText?.(row?.roleIds) ?? '',
        header: () => t('dialog.group_member_moderation.roles'),
        cell: ({ row }) => {
            const original = row.original;
            return <span>{rolesText?.(original?.roleIds) ?? ''}</span>;
        }
    },
    {
        accessorKey: 'managerNotes',
        header: () => t('dialog.group_member_moderation.notes'),
        cell: ({ row }) => (
            <span onClick={(e) => e.stopPropagation()}>
                {row.original?.managerNotes}
            </span>
        )
    },
    {
        accessorKey: 'joinedAt',
        header: () => t('dialog.group_member_moderation.joined_at'),
        size: 170,
        cell: ({ row }) => (
            <span>{formatDateFilter(row.original?.joinedAt, 'long')}</span>
        )
    },
    {
        accessorKey: 'visibility',
        header: () => t('dialog.group_member_moderation.visibility'),
        size: 120,
        cell: ({ row }) => <span>{row.original?.visibility}</span>
    }
];
