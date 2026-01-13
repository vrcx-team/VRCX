import { Checkbox } from '@/components/ui/checkbox';
import { i18n } from '@/plugin';

const { t } = i18n.global;

export const createColumns = ({
    randomUserColours,
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
        enableResizing: false,
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
        id: 'displayName',
        accessorFn: (row) => row?.user?.displayName ?? row?.$displayName ?? '',
        header: () => t('dialog.group_member_moderation.display_name'),
        size: 160,
        cell: ({ row }) => {
            const original = row.original;
            const useColors = !!(randomUserColours?.value ?? randomUserColours);
            const colorStyle = useColors ? { color: original?.user?.$userColour } : null;

            return (
                <span
                    style="cursor: pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowUser?.(original?.userId);
                    }}
                >
                    <span style={colorStyle}>{original?.user?.displayName}</span>
                </span>
            );
        }
    },
    {
        accessorKey: 'managerNotes',
        header: () => t('dialog.group_member_moderation.notes'),
        cell: ({ row }) => (
            <span onClick={(e) => e.stopPropagation()}>{row.original?.managerNotes}</span>
        )
    }
];
