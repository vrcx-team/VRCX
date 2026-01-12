<template>
    <el-dialog
        v-model="isDialogVisible"
        class="x-dialog"
        :title="t('dialog.friend_export.header')"
        width="650px"
        destroy-on-close>
        <Select :model-value="friendExportFavoriteGroupSelection" @update:modelValue="handleFriendExportGroupSelect">
            <SelectTrigger size="sm">
                <SelectValue placeholder="All Favorites" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem :value="FRIEND_EXPORT_ALL_VALUE">All Favorites</SelectItem>
                    <SelectItem v-for="groupAPI in favoriteFriendGroups" :key="groupAPI.name" :value="groupAPI.name">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }}/{{ groupAPI.capacity }})
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>

        <br />

        <InputGroupTextareaField
            v-model="friendExportContent"
            :rows="15"
            readonly
            style="margin-top: 15px"
            input-class="resize-none"
            @click="handleCopyFriendExportData" />
    </el-dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore } from '../../../stores';

    const { t } = useI18n();

    const props = defineProps({
        friendExportDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:friendExportDialogVisible']);

    const { favoriteFriends, favoriteFriendGroups } = storeToRefs(useFavoriteStore());

    const friendExportFavoriteGroup = ref(null);
    const FRIEND_EXPORT_ALL_VALUE = '__all__';
    const friendExportFavoriteGroupSelection = ref(FRIEND_EXPORT_ALL_VALUE);
    const friendExportContent = ref('');

    const isDialogVisible = computed({
        get() {
            return props.friendExportDialogVisible;
        },
        set(value) {
            emit('update:friendExportDialogVisible', value);
        }
    });

    watch(
        () => props.friendExportDialogVisible,
        (value) => {
            if (value) {
                showFriendExportDialog();
            }
        }
    );

    function showFriendExportDialog() {
        friendExportFavoriteGroup.value = null;
        friendExportFavoriteGroupSelection.value = FRIEND_EXPORT_ALL_VALUE;
        updateFriendExportDialog();
    }

    function handleFriendExportGroupSelect(value) {
        friendExportFavoriteGroupSelection.value = value;
        if (value === FRIEND_EXPORT_ALL_VALUE) {
            selectFriendExportGroup(null);
            return;
        }
        const group = favoriteFriendGroups.value.find((g) => g.name === value) || null;
        selectFriendExportGroup(group);
    }

    function handleCopyFriendExportData(event) {
        if (event.target.tagName === 'TEXTAREA') {
            event.target.select();
        }
        navigator.clipboard
            .writeText(friendExportContent.value)
            .then(() => {
                toast.success('Copied successfully!', { duration: 2000 });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                toast.error('Copy failed!');
            });
    }

    function updateFriendExportDialog() {
        const needsCsvQuotes = (text) => {
            for (let i = 0; i < text.length; i++) {
                if (text.charCodeAt(i) < 0x20) {
                    return true;
                }
            }
            return text.includes(',') || text.includes('"');
        };

        const formatter = function (value) {
            if (value === null || typeof value === 'undefined') {
                return '';
            }
            const text = String(value);
            if (needsCsvQuotes(text)) {
                return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
        };
        const lines = ['UserID,Name'];
        favoriteFriendGroups.value.forEach((group) => {
            if (!friendExportFavoriteGroup.value || friendExportFavoriteGroup.value === group) {
                favoriteFriends.value.forEach((ref) => {
                    if (group.key === ref.groupKey) {
                        lines.push(`${formatter(ref.id)},${formatter(ref.name)}`);
                    }
                });
            }
        });
        friendExportContent.value = lines.join('\n');
    }

    function selectFriendExportGroup(group) {
        friendExportFavoriteGroup.value = group;
        friendExportFavoriteGroupSelection.value = group?.name ?? FRIEND_EXPORT_ALL_VALUE;
        updateFriendExportDialog();
    }
</script>
