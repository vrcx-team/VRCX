<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="socialStatusDialog.visible"
        :title="t('dialog.social_status.header')"
        append-to-body
        width="400px">
        <div v-loading="socialStatusDialog.loading">
            <el-collapse style="border: 0">
                <el-collapse-item>
                    <template #title>
                        <span style="font-size: 16px">{{ t('dialog.social_status.history') }}</span>
                    </template>
                    <data-tables
                        v-bind="socialStatusHistoryTable"
                        style="cursor: pointer"
                        @row-click="setSocialStatusFromHistory">
                        <el-table-column :label="t('table.social_status.no')" prop="no" width="50"></el-table-column>
                        <el-table-column :label="t('table.social_status.status')" prop="status"></el-table-column>
                    </data-tables>
                </el-collapse-item>
            </el-collapse>

            <el-select v-model="socialStatusDialog.status" style="display: block; margin-top: 10px">
                <el-option :label="t('dialog.user.status.join_me')" value="join me">
                    <i class="x-user-status joinme"></i> {{ t('dialog.user.status.join_me') }}
                </el-option>
                <el-option :label="t('dialog.user.status.online')" value="active">
                    <i class="x-user-status online"></i> {{ t('dialog.user.status.online') }}
                </el-option>
                <el-option :label="t('dialog.user.status.ask_me')" value="ask me">
                    <i class="x-user-status askme"></i> {{ t('dialog.user.status.ask_me') }}
                </el-option>
                <el-option :label="t('dialog.user.status.busy')" value="busy">
                    <i class="x-user-status busy"></i> {{ t('dialog.user.status.busy') }}
                </el-option>
                <el-option v-if="currentUser.$isModerator" :label="t('dialog.user.status.offline')" value="offline">
                    <i class="x-user-status offline"></i> {{ t('dialog.user.status.offline') }}
                </el-option>
            </el-select>

            <el-input
                v-model="socialStatusDialog.statusDescription"
                :placeholder="t('dialog.social_status.status_placeholder')"
                maxlength="32"
                show-word-limit
                clearable
                style="display: block; margin-top: 10px"></el-input>
        </div>

        <template #footer>
            <el-button type="primary" size="small" :disabled="socialStatusDialog.loading" @click="saveSocialStatus">
                {{ t('dialog.social_status.update') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { userRequest } from '../../../api';
    import { useUserStore } from '../../../stores';

    const { t } = useI18n();
    const { $message } = getCurrentInstance().proxy;

    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        socialStatusDialog: {
            type: Object,
            required: true
        },
        socialStatusHistoryTable: {
            type: Object,
            required: true
        }
    });

    function setSocialStatusFromHistory(val) {
        if (val === null) {
            return;
        }
        const D = props.socialStatusDialog;
        D.statusDescription = val.status;
    }

    function saveSocialStatus() {
        const D = props.socialStatusDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        userRequest
            .saveCurrentUser({
                status: D.status,
                statusDescription: D.statusDescription
            })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                $message({
                    message: 'Status updated',
                    type: 'success'
                });
                return args;
            });
    }
</script>
