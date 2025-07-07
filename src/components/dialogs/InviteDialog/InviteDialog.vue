<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="inviteDialog.visible"
        :title="t('dialog.invite.header')"
        width="500px"
        append-to-body>
        <div v-if="inviteDialog.visible" v-loading="inviteDialog.loading">
            <Location :location="inviteDialog.worldId" :link="false" />
            <br />
            <el-button size="mini" style="margin-top: 10px" @click="addSelfToInvite">{{
                t('dialog.invite.add_self')
            }}</el-button>
            <el-button
                size="mini"
                :disabled="inviteDialog.friendsInInstance.length === 0"
                style="margin-top: 10px"
                @click="addFriendsInInstanceToInvite"
                >{{ t('dialog.invite.add_friends_in_instance') }}</el-button
            >
            <el-button
                size="mini"
                :disabled="vipFriends.length === 0"
                style="margin-top: 10px"
                @click="addFavoriteFriendsToInvite"
                >{{ t('dialog.invite.add_favorite_friends') }}</el-button
            >

            <el-select
                v-model="inviteDialog.userIds"
                multiple
                clearable
                :placeholder="t('dialog.invite.select_placeholder')"
                filterable
                :disabled="inviteDialog.loading"
                style="width: 100%; margin-top: 15px">
                <el-option-group v-if="currentUser" :label="t('side_panel.me')">
                    <el-option
                        class="x-friend-item"
                        :label="currentUser.displayName"
                        :value="currentUser.id"
                        style="height: auto">
                        <div :class="['avatar', userStatusClass(currentUser)]">
                            <img v-lazy="userImage(currentUser)" />
                        </div>
                        <div class="detail">
                            <span class="name">{{ currentUser.displayName }}</span>
                        </div>
                    </el-option>
                </el-option-group>

                <el-option-group
                    v-if="inviteDialog.friendsInInstance.length"
                    :label="t('dialog.invite.friends_in_instance')">
                    <el-option
                        v-for="friend in inviteDialog.friendsInInstance"
                        :key="friend.id"
                        class="x-friend-item"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div :class="['avatar', userStatusClass(friend.ref)]">
                                <img v-lazy="userImage(friend.ref)" />
                            </div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>

                <el-option-group v-if="vipFriends.length" :label="t('side_panel.favorite')">
                    <el-option
                        v-for="friend in vipFriends"
                        :key="friend.id"
                        class="x-friend-item"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div :class="['avatar', userStatusClass(friend.ref)]">
                                <img v-lazy="userImage(friend.ref)" />
                            </div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>

                <el-option-group v-if="onlineFriends.length" :label="t('side_panel.online')">
                    <el-option
                        v-for="friend in onlineFriends"
                        :key="friend.id"
                        class="x-friend-item"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div :class="['avatar', userStatusClass(friend.ref)]">
                                <img v-lazy="userImage(friend.ref)" />
                            </div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>

                <el-option-group v-if="activeFriends.length" :label="t('side_panel.active')">
                    <el-option
                        v-for="friend in activeFriends"
                        :key="friend.id"
                        class="x-friend-item"
                        :label="friend.name"
                        :value="friend.id"
                        style="height: auto">
                        <template v-if="friend.ref">
                            <div class="avatar"><img v-lazy="userImage(friend.ref)" /></div>
                            <div class="detail">
                                <span class="name" :style="{ color: friend.ref.$userColour }">{{
                                    friend.ref.displayName
                                }}</span>
                            </div>
                        </template>
                        <span v-else>{{ friend.id }}</span>
                    </el-option>
                </el-option-group>
            </el-select>
        </div>

        <template #footer>
            <el-button
                size="small"
                :disabled="inviteDialog.loading || !inviteDialog.userIds.length"
                @click="showSendInviteDialog"
                >{{ t('dialog.invite.invite_with_message') }}</el-button
            >
            <el-button
                type="primary"
                size="small"
                :disabled="inviteDialog.loading || !inviteDialog.userIds.length"
                @click="sendInvite"
                >{{ t('dialog.invite.invite') }}</el-button
            >
        </template>
        <SendInviteDialog
            :send-invite-dialog-visible.sync="sendInviteDialogVisible"
            :send-invite-dialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { instanceRequest, notificationRequest } from '../../../api';
    import { parseLocation, userImage, userStatusClass } from '../../../shared/utils';
    import { useFriendStore, useGalleryStore, useInviteStore, useUserStore } from '../../../stores';
    import SendInviteDialog from './SendInviteDialog.vue';

    const { vipFriends, onlineFriends, activeFriends } = storeToRefs(useFriendStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { clearInviteImageUpload } = useGalleryStore();

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;
    const $confirm = instance.proxy.$confirm;

    const props = defineProps({
        inviteDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['closeInviteDialog']);

    const sendInviteDialogVisible = ref(false);
    const sendInviteDialog = ref({
        messageSlot: {},
        userId: '',
        params: {}
    });

    function closeInviteDialog() {
        emit('closeInviteDialog');
    }

    function showSendInviteDialog(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageSlot: {}
        };
        refreshInviteMessageTableData('message');
        clearInviteImageUpload();
        sendInviteDialogVisible.value = true;
    }

    function addSelfToInvite() {
        const D = props.inviteDialog;
        if (!D.userIds.includes(currentUser.value.id)) {
            D.userIds.push(currentUser.value.id);
        }
    }

    function addFriendsInInstanceToInvite() {
        const D = props.inviteDialog;
        for (const friend of D.friendsInInstance) {
            if (!D.userIds.includes(friend.id)) {
                D.userIds.push(friend.id);
            }
        }
    }

    function addFavoriteFriendsToInvite() {
        const D = props.inviteDialog;
        for (const friend of props.vipFriends) {
            if (!D.userIds.includes(friend.id)) {
                D.userIds.push(friend.id);
            }
        }
    }

    function sendInvite() {
        $confirm('Continue? Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                const D = props.inviteDialog;
                if (action !== 'confirm' || D.loading === true) {
                    return;
                }
                D.loading = true;
                const inviteLoop = () => {
                    if (D.userIds.length > 0) {
                        const receiverUserId = D.userIds.shift();
                        if (receiverUserId === currentUser.value.id) {
                            // can't invite self!?
                            const L = parseLocation(D.worldId);
                            instanceRequest
                                .selfInvite({
                                    instanceId: L.instanceId,
                                    worldId: L.worldId
                                })
                                .finally(inviteLoop);
                        } else {
                            notificationRequest
                                .sendInvite(
                                    {
                                        instanceId: D.worldId,
                                        worldId: D.worldId,
                                        worldName: D.worldName
                                    },
                                    receiverUserId
                                )
                                .finally(inviteLoop);
                        }
                    } else {
                        D.loading = false;
                        D.visible = false;
                        $message({
                            message: 'Invite sent',
                            type: 'success'
                        });
                    }
                };
                inviteLoop();
            }
        });
    }
</script>
