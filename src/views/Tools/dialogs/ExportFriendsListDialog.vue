<template>
    <el-dialog :title="t('dialog.export_friends_list.header')" v-model="isVisible" width="650px">
        <el-tabs>
            <el-tab-pane :label="t('dialog.export_friends_list.csv')">
                <el-input
                    v-model="exportFriendsListCsv"
                    type="textarea"
                    size="small"
                    :rows="15"
                    resize="none"
                    readonly
                    style="margin-top: 15px"
                    @click="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
            </el-tab-pane>
            <el-tab-pane :label="t('dialog.export_friends_list.json')">
                <el-input
                    v-model="exportFriendsListJson"
                    type="textarea"
                    size="small"
                    :rows="15"
                    resize="none"
                    readonly
                    style="margin-top: 15px"
                    @click="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
            </el-tab-pane>
        </el-tabs>
    </el-dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
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
