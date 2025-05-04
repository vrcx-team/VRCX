<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="inviteDialog.visible"
        :title="t('dialog.invite.header')"
        width="500px"
        append-to-body>
        <div v-if="inviteDialog.visible" v-loading="inviteDialog.loading">
            <location :location="inviteDialog.worldId" :link="false"></location>
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
                <el-option-group v-if="API.currentUser" :label="t('side_panel.me')">
                    <el-option
                        class="x-friend-item"
                        :label="API.currentUser.displayName"
                        :value="API.currentUser.id"
                        style="height: auto">
                        <div :class="['avatar', userStatusClass(API.currentUser)]">
                            <img v-lazy="userImage(API.currentUser)" />
                        </div>
                        <div class="detail">
                            <span class="name">{{ API.currentUser.displayName }}</span>
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
            :invite-message-table="inviteMessageTable"
            :send-invite-dialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            :upload-image="uploadImage"
            @close-invite-dialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance, inject, ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { instanceRequest, inviteMessagesRequest, notificationRequest } from '../../../api';
    import { parseLocation } from '../../../composables/instance/utils';
    import Location from '../../Location.vue';
    import SendInviteDialog from './SendInviteDialog.vue';

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;
    const $confirm = instance.proxy.$confirm;

    const userStatusClass = inject('userStatusClass');
    const userImage = inject('userImage');
    const API = inject('API');

    const props = defineProps({
        inviteDialog: {
            type: Object,
            required: true
        },
        vipFriends: {
            type: Array,
            required: true
        },
        onlineFriends: {
            type: Array,
            required: true
        },
        activeFriends: {
            type: Array,
            required: true
        },
        // SendInviteDialog
        inviteMessageTable: {
            type: Object,
            default: () => ({})
        },
        uploadImage: {
            type: String,
            default: ''
        }
    });

    const emit = defineEmits(['clearInviteImageUpload', 'inviteImageUpload', 'closeInviteDialog']);

    const sendInviteDialogVisible = ref(false);
    const sendInviteDialog = ref({ message: '', messageSlot: 0, userId: '', messageType: '', params: {} });

    function closeInviteDialog() {
        emit('closeInviteDialog');
    }

    function showSendInviteDialog(params, userId) {
        sendInviteDialog.value = {
            params,
            userId,
            messageType: 'invite'
        };
        inviteMessagesRequest.refreshInviteMessageTableData('message');
        clearInviteImageUpload();
        sendInviteDialogVisible.value = true;
    }

    function clearInviteImageUpload() {
        emit('clearInviteImageUpload');
    }

    function addSelfToInvite() {
        const D = props.inviteDialog;
        if (!D.userIds.includes(API.currentUser.id)) {
            D.userIds.push(API.currentUser.id);
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
                        if (receiverUserId === API.currentUser.id) {
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
