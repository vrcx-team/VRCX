<template>
    <el-dialog
        :z-index="inviteGroupDialogIndex"
        v-model="inviteGroupDialog.visible"
        :title="t('dialog.invite_to_group.header')"
        width="450px"
        append-to-body>
        <div v-if="inviteGroupDialog.visible" v-loading="inviteGroupDialog.loading">
            <span>{{ t('dialog.invite_to_group.description') }}</span>
            <br />
            <el-select
                v-model="inviteGroupDialog.groupId"
                clearable
                :placeholder="t('dialog.invite_to_group.choose_group_placeholder')"
                filterable
                :disabled="inviteGroupDialog.loading"
                style="margin-top: 15px; width: 100%">
                <el-option-group
                    :label="t('dialog.invite_to_group.groups_with_invite_permission')"
                    style="width: 410px">
                    <el-option
                        v-for="group in groupsWithInvitePermission"
                        :key="group.id"
                        :label="group.name"
                        :value="group.id"
                        style="height: auto"
                        class="x-friend-item">
                        <div class="avatar">
                            <img :src="group.iconUrl" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="group.name"></span>
                        </div>
                    </el-option>
                </el-option-group>
            </el-select>
            <el-select
                v-model="inviteGroupDialog.userIds"
                multiple
                clearable
                :placeholder="t('dialog.invite_to_group.choose_friends_placeholder')"
                filterable
                :disabled="inviteGroupDialog.loading"
                style="width: 100%; margin-top: 15px">
                <el-option-group v-if="inviteGroupDialog.userId" :label="t('dialog.invite_to_group.selected_users')">
                    <el-option
                        :key="inviteGroupDialog.userObject.id"
                        :label="inviteGroupDialog.userObject.displayName"
                        :value="inviteGroupDialog.userObject.id"
                        class="x-friend-item">
                        <template v-if="inviteGroupDialog.userObject.id">
                            <div class="avatar" :class="userStatusClass(inviteGroupDialog.userObject)">
                                <img :src="userImage(inviteGroupDialog.userObject)" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span
                                    class="name"
                                    :style="{ color: inviteGroupDialog.userObject.$userColour }"
                                    v-text="inviteGroupDialog.userObject.displayName"></span>
                            </div>
                        </template>
                        <span v-else v-text="inviteGroupDialog.userId"></span>
                    </el-option>
                </el-option-group>
                <el-option-group v-if="vipFriends.length" :label="t('side_panel.favorite')">
                    <el-option
                        v-for="friend in vipFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto"
                        class="x-friend-item">
                        <template v-if="friend.ref">
                            <div class="avatar" :class="userStatusClass(friend.ref)">
                                <img :src="userImage(friend.ref)" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span
                                    class="name"
                                    :style="{ color: friend.ref.$userColour }"
                                    v-text="friend.ref.displayName"></span>
                            </div>
                        </template>
                        <span v-else v-text="friend.id"></span>
                    </el-option>
                </el-option-group>
                <el-option-group v-if="onlineFriends.length" :label="t('side_panel.online')">
                    <el-option
                        v-for="friend in onlineFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto"
                        class="x-friend-item">
                        <template v-if="friend.ref">
                            <div class="avatar" :class="userStatusClass(friend.ref)">
                                <img :src="userImage(friend.ref)" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span
                                    class="name"
                                    :style="{ color: friend.ref.$userColour }"
                                    v-text="friend.ref.displayName"></span>
                            </div>
                        </template>
                        <span v-else v-text="friend.id"></span>
                    </el-option>
                </el-option-group>
                <el-option-group v-if="activeFriends.length" :label="t('side_panel.active')">
                    <el-option
                        v-for="friend in activeFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto"
                        class="x-friend-item">
                        <template v-if="friend.ref">
                            <div class="avatar">
                                <img :src="userImage(friend.ref)" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span
                                    class="name"
                                    :style="{ color: friend.ref.$userColour }"
                                    v-text="friend.ref.displayName"></span>
                            </div>
                        </template>
                        <span v-else v-text="friend.id"></span>
                    </el-option>
                </el-option-group>
                <el-option-group v-if="offlineFriends.length" :label="t('side_panel.offline')">
                    <el-option
                        v-for="friend in offlineFriends"
                        :key="friend.id"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto"
                        class="x-friend-item">
                        <template v-if="friend.ref">
                            <div class="avatar">
                                <img :src="userImage(friend.ref)" loading="lazy" />
                            </div>
                            <div class="detail">
                                <span
                                    class="name"
                                    :style="{ color: friend.ref.$userColour }"
                                    v-text="friend.ref.displayName"></span>
                            </div>
                        </template>
                        <span v-else v-text="friend.id"></span>
                    </el-option>
                </el-option-group>
            </el-select>
        </div>
        <template #footer>
            <el-button
                type="primary"
                size="small"
                :disabled="inviteGroupDialog.loading || !inviteGroupDialog.userIds.length || !inviteGroupDialog.groupId"
                @click="sendGroupInvite">
                {{ t('dialog.invite_to_group.invite') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { ref, watch, nextTick, computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { groupRequest, userRequest } from '../../api';
    import { getNextDialogIndex, hasGroupPermission, userImage, userStatusClass } from '../../shared/utils';
    import { useFriendStore, useGroupStore } from '../../stores';

    const { vipFriends, onlineFriends, activeFriends, offlineFriends } = storeToRefs(useFriendStore());
    const { currentUserGroups, inviteGroupDialog } = storeToRefs(useGroupStore());
    const { applyGroup } = useGroupStore();
    const { t } = useI18n();

    watch(
        () => {
            return inviteGroupDialog.value.visible;
        },
        (value) => {
            if (value) {
                initDialog();
            }
        }
    );

    const inviteGroupDialogIndex = ref(2000);

    const groupsWithInvitePermission = computed(() => {
        return Array.from(currentUserGroups.value.values()).filter((group) =>
            hasGroupPermission(group, 'group-invites-manage')
        );
    });

    function initDialog() {
        nextTick(() => {
            inviteGroupDialogIndex.value = getNextDialogIndex();
        });
        const D = inviteGroupDialog.value;
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
            isAllowedToInviteToGroup();
        }

        if (D.userId) {
            userRequest.getCachedUser({ userId: D.userId }).then((args) => {
                D.userObject = args.ref;
                D.userIds = [D.userId];
            });
        }
    }
    function isAllowedToInviteToGroup() {
        const D = inviteGroupDialog.value;
        const groupId = D.groupId;
        if (!groupId) {
            return;
        }
        inviteGroupDialog.value.loading = true;
        groupRequest
            .getGroup({ groupId })
            .then((args) => {
                const ref = applyGroup(args.json);
                if (hasGroupPermission(ref, 'group-invites-manage')) {
                    return args;
                }
                // not allowed to invite
                inviteGroupDialog.value.groupId = '';
                ElMessage({
                    type: 'error',
                    message: 'You are not allowed to invite to this group'
                });
                return args;
            })
            .finally(() => {
                inviteGroupDialog.value.loading = false;
            });
    }
    function sendGroupInvite() {
        ElMessageBox.confirm('Continue? Invite User(s) To Group', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                const D = inviteGroupDialog.value;
                if (action !== 'confirm' || D.loading === true) {
                    return;
                }
                D.loading = true;
                const inviteLoop = () => {
                    if (D.userIds.length === 0) {
                        D.loading = false;
                        return;
                    }
                    const receiverUserId = D.userIds.shift();
                    groupRequest
                        .sendGroupInvite({
                            groupId: D.groupId,
                            userId: receiverUserId
                        })
                        .then(inviteLoop)
                        .catch(() => {
                            D.loading = false;
                        });
                };
                inviteLoop();
            })
            .catch(() => {});
    }
</script>
