<template>
    <safe-dialog
        ref="moderateGroupDialogRef"
        :visible.sync="moderateGroupDialog.visible"
        :title="$t('dialog.moderate_group.header')"
        width="450px"
        append-to-body>
        <div v-if="moderateGroupDialog.visible">
            <div class="x-friend-item" style="cursor: default">
                <div class="avatar">
                    <img v-lazy="userImage(moderateGroupDialog.userObject)" />
                </div>
                <div class="detail">
                    <span
                        v-if="moderateGroupDialog.userObject.id"
                        class="name"
                        :style="{ color: moderateGroupDialog.userObject.$userColour }"
                        v-text="moderateGroupDialog.userObject.displayName"></span>
                    <span v-else v-text="moderateGroupDialog.userId"></span>
                </div>
            </div>
            <el-select
                v-model="moderateGroupDialog.groupId"
                clearable
                :placeholder="$t('dialog.moderate_group.choose_group_placeholder')"
                filterable
                style="margin-top: 15px; width: 100%">
                <el-option-group
                    v-if="currentUserGroups.size"
                    :label="$t('dialog.moderate_group.groups_with_moderation_permission')">
                    <el-option
                        v-for="group in groupsWithModerationPermission"
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
                :disabled="!moderateGroupDialog.userId || !moderateGroupDialog.groupId"
                @click="
                    showGroupMemberModerationDialog(moderateGroupDialog.groupId, moderateGroupDialog.userId);
                    moderateGroupDialog.visible = false;
                ">
                {{ $t('dialog.moderate_group.moderation_tools') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, getCurrentInstance, nextTick, computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { groupRequest, userRequest } from '../../api';
    import {
        adjustDialogZ,
        hasGroupPermission,
        hasGroupModerationPermission,
        userImage,
        userStatusClass
    } from '../../shared/utils';
    import { useGroupStore } from '../../stores';

    const { currentUserGroups, moderateGroupDialog } = storeToRefs(useGroupStore());
    const { applyGroup, showGroupMemberModerationDialog } = useGroupStore();

    const { proxy } = getCurrentInstance();

    const groupsWithModerationPermission = computed(() => {
        return Array.from(currentUserGroups.value.values()).filter((group) => hasGroupModerationPermission(group));
    });

    watch(
        () => {
            return moderateGroupDialog.value.visible;
        },
        (value) => {
            if (value) {
                initDialog();
            }
        }
    );

    const moderateGroupDialogRef = ref(null);

    function initDialog() {
        nextTick(() => adjustDialogZ(moderateGroupDialogRef.value.$el));
        const D = moderateGroupDialog.value;
        if (D.groupId) {
            groupRequest
                .getCachedGroup({
                    groupId: D.groupId
                })
                .then((args) => {
                    D.groupName = args.ref.name;
                })
                .catch(() => {
                    D.groupId = '';
                });
        }

        if (D.userId) {
            userRequest.getCachedUser({ userId: D.userId }).then((args) => {
                D.userObject = args.ref;
            });
        }
    }
</script>
