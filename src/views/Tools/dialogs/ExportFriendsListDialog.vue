<template>
    <el-dialog :title="t('dialog.export_friends_list.header')" v-model="isVisible" width="650px">
        <TabsUnderline default-value="csv" :items="exportFriendsTabs" :unmount-on-hide="false" class="mt-2.5">
            <template #csv>
                <InputGroupTextareaField
                    v-model="exportFriendsListCsv"
                    :rows="15"
                    readonly
                    style="margin-top: 15px"
                    input-class="resize-none"
                    @click="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
            </template>
            <template #json>
                <InputGroupTextareaField
                    v-model="exportFriendsListJson"
                    :rows="15"
                    readonly
                    style="margin-top: 15px"
                    input-class="resize-none"
                    @click="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
            </template>
        </TabsUnderline>
    </el-dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useUserStore } from '../../../stores';

    const props = defineProps({
        friends: {
            type: Map,
            required: true
        },
        isExportFriendsListDialogVisible: {
            type: Boolean,
            required: true
        }
    });
    const emit = defineEmits(['update:isExportFriendsListDialogVisible']);

    const { currentUser } = storeToRefs(useUserStore());

    const { t } = useI18n();

    const exportFriendsListCsv = ref('');
    const exportFriendsListJson = ref('');
    const exportFriendsTabs = computed(() => [
        { value: 'csv', label: t('dialog.export_friends_list.csv') },
        { value: 'json', label: t('dialog.export_friends_list.json') }
    ]);

    const isVisible = computed({
        get() {
            return props.isExportFriendsListDialogVisible;
        },
        set(value) {
            emit('update:isExportFriendsListDialogVisible', value);
        }
    });

    watch(
        () => props.isExportFriendsListDialogVisible,
        (value) => {
            if (value) {
                initExportFriendsListDialog();
            }
        }
    );

    function initExportFriendsListDialog() {
        const { friends } = currentUser.value;
        if (Array.isArray(friends) === false) {
            return;
        }
        const lines = ['UserID,DisplayName,Memo'];
        const _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const friendsList = [];
        for (const userId of friends) {
            const ref = props.friends.get(userId);
            const name = (typeof ref !== 'undefined' && ref.name) || '';
            const memo = (typeof ref !== 'undefined' && ref.memo.replace(/\n/g, ' ')) || '';
            lines.push(`${_(userId)},${_(name)},${_(memo)}`);
            friendsList.push(userId);
        }
        exportFriendsListJson.value = JSON.stringify({ friends: friendsList }, null, 4);
        exportFriendsListCsv.value = lines.join('\n');
    }
</script>
