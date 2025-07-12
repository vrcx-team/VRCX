<template>
    <safe-dialog
        ref="banGroupDialog"
        :visible.sync="banGroupDialog.visible"
        :title="$t('dialog.ban_from_group.header')"
        width="450px"
        append-to-body>
        <div v-if="banGroupDialog.visible" v-loading="banGroupDialog.loading">
            <span>{{ $t('dialog.ban_from_group.description') }}</span>
            <br />
            <el-select
                v-model="banGroupDialog.groupId"
                clearable
                :placeholder="$t('dialog.ban_from_group.choose_group_placeholder')"
                filterable
                :disabled="banGroupDialog.loading"
                style="margin-top: 15px">
                <el-option-group
                    v-if="eligibleGroups.length"
                    :label="$t('dialog.ban_from_group.groups')"
                    style="width: 410px">
                    <el-option
                        v-for="group in eligibleGroups"
                        :key="group.id"
                        :label="group.name"
                        :value="group.id"
                        style="height: auto"
                        class="x-friend-item">
                        <div class="avatar">
                            <img v-lazy="group.iconUrl" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="group.name"></span>
                        </div>
                    </el-option>
                </el-option-group>
            </el-select>
        </div>
        <template #footer>
            <el-button
                type="primary"
                size="small"
                :disabled="banGroupDialog.loading || !banGroupDialog.groupId"
                @click="banUser">
                Ban
            </el-button>
        </template>
    </safe-dialog>
</template>

<script>
import { groupRequest } from '../../api';
import { hasGroupPermission } from '../../composables/group/utils';

export default {
    name: 'BanGroupDialog',
    inject: ['API', 'adjustDialogZ', '$message', '$confirm'],
    props: {
        dialogData: {
            type: Object,
            required: true
        }
    },
    computed: {
        banGroupDialog: {
            get() {
                return this.dialogData;
            },
            set(value) {
                this.$emit('update:dialog-data', value);
            }
        },
        eligibleGroups() {
            const groups = [];
            for (const group of this.API.currentUserGroups.values()) {
                if (hasGroupPermission(group, 'group-bans-manage')) {
                    groups.push(group);
                }
            }
            return groups;
        }
    },
    watch: {
        'dialogData.visible'(value) {
            if (value) {
                this.initDialog();
            }
        }
    },
    methods: {
        initDialog() {
            this.$nextTick(() => this.adjustDialogZ(this.$refs.banGroupDialog.$el));
        },
        banUser() {
            this.$confirm('Continue? Ban User From Group', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'warning',
                callback: (action) => {
                    if (action !== 'confirm') return;
                    const D = this.banGroupDialog;
                    if (!D.groupId || !D.userId) return;
                    D.loading = true;
                    groupRequest
                        .banGroupMember({ groupId: D.groupId, userId: D.userId })
                        .then(() => {
                            this.$message({ type: 'success', message: 'User banned' });
                            this.banGroupDialog.visible = false;
                        })
                        .catch((err) => {
                            console.error(err);
                            this.$message({ type: 'error', message: 'Failed to ban user' });
                        })
                        .finally(() => {
                            D.loading = false;
                        });
                }
            });
        }
    }
};
</script>
