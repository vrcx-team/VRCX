<template>
    <el-dialog
        class="x-dialog"
        v-model="pronounsDialog.visible"
        :title="t('dialog.pronouns.header')"
        width="600px"
        append-to-body>
        <div v-loading="pronounsDialog.loading">
            <el-input
                type="textarea"
                v-model="pronounsDialog.pronouns"
                size="small"
                maxlength="32"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 5 }"
                :placeholder="t('dialog.pronouns.pronouns_placeholder')">
            </el-input>
        </div>
        <template #footer>
            <el-button type="primary" :disabled="pronounsDialog.loading" @click="savePronouns">
                {{ t('dialog.pronouns.update') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ElMessage } from 'element-plus';
    import { useI18n } from 'vue-i18n';
    import { userRequest } from '../../../api';

    const { t } = useI18n();
    const props = defineProps({
        pronounsDialog: {
            type: Object,
            required: true
        }
    });

    function savePronouns() {
        const D = props.pronounsDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        userRequest
            .saveCurrentUser({
                pronouns: D.pronouns
            })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                ElMessage({
                    message: 'Pronouns updated',
                    type: 'success'
                });
                return args;
            });
    }
</script>
