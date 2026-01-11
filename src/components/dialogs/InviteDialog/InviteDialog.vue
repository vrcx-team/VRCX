<template>
    <el-dialog
        class="x-dialog"
        :model-value="inviteDialog.visible"
        @close="closeInviteDialog"
        :title="t('dialog.invite.header')"
        width="500px"
        append-to-body>
        <div v-if="inviteDialog.visible" v-loading="inviteDialog.loading">
            <Location :location="inviteDialog.worldId" :link="false" />
            <br />
            <Button size="sm" class="mr-2" variant="outline" style="margin-top: 10px" @click="addSelfToInvite">{{
                t('dialog.invite.add_self')
            }}</Button>
            <Button
                size="sm"
                class="mr-2"
                variant="outline"
                :disabled="inviteDialog.friendsInInstance.length === 0"
                style="margin-top: 10px"
                @click="addFriendsInInstanceToInvite"
                >{{ t('dialog.invite.add_friends_in_instance') }}</Button
            >
            <Button
                size="sm"
                variant="outline"
                :disabled="vipFriends.length === 0"
                style="margin-top: 10px"
                @click="addFavoriteFriendsToInvite"
                >{{ t('dialog.invite.add_favorite_friends') }}</Button
            >

            <div style="width: 100%; margin-top: 15px">
                <VirtualCombobox
                    :model-value="Array.isArray(inviteDialog.userIds) ? inviteDialog.userIds : []"
                    @update:modelValue="setInviteUserIds"
                    :groups="userPickerGroups"
                    multiple
                    :disabled="inviteDialog.loading"
                    :placeholder="t('dialog.invite.select_placeholder')"
                    :search-placeholder="t('dialog.invite.select_placeholder')"
                    :clearable="true">
                    <template #item="{ item, selected }">
                        <div class="x-friend-item flex w-full items-center">
                            <template v-if="item.user">
                                <div :class="['avatar', userStatusClass(item.user)]">
                                    <img :src="userImage(item.user)" loading="lazy" />
                                </div>
                                <div class="detail">
                                    <span class="name" :style="{ color: item.user.$userColour }">{{
                                        item.user.displayName
                                    }}</span>
                                </div>
                            </template>
                            <template v-else>
                                <span>{{ item.label }}</span>
                            </template>

                            <CheckIcon :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                        </div>
                    </template>
                </VirtualCombobox>
            </div>
        </div>

        <template #footer>
            <Button
                variant="secondary"
                class="mr-2"
                :disabled="inviteDialog.loading || !inviteDialog.userIds.length"
                @click="showSendInviteDialog"
                >{{ t('dialog.invite.invite_with_message') }}</Button
            >
            <Button :disabled="inviteDialog.loading || !inviteDialog.userIds.length" @click="sendInvite">{{
                t('dialog.invite.invite')
            }}</Button>
        </template>
        <SendInviteDialog
            v-model:sendInviteDialogVisible="sendInviteDialogVisible"
            v-model:sendInviteDialog="sendInviteDialog"
            :invite-dialog="inviteDialog"
            @closeInviteDialog="closeInviteDialog" />
    </el-dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Check as CheckIcon } from 'lucide-vue-next';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useFriendStore, useGalleryStore, useInviteStore, useUserStore } from '../../../stores';
    import { parseLocation, userImage, userStatusClass } from '../../../shared/utils';
    import { instanceRequest, notificationRequest } from '../../../api';
    import { VirtualCombobox } from '../../ui/virtual-combobox';

    import SendInviteDialog from './SendInviteDialog.vue';

    const { vipFriends, onlineFriends, activeFriends } = storeToRefs(useFriendStore());
    const { refreshInviteMessageTableData } = useInviteStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { clearInviteImageUpload } = useGalleryStore();

    const { t } = useI18n();
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

    const userPickerGroups = computed(() => {
        const groups = [];

        if (currentUser.value) {
            groups.push({
                key: 'me',
                label: t('side_panel.me'),
                items: [
                    {
                        value: String(currentUser.value.id),
                        label: currentUser.value.displayName,
                        search: currentUser.value.displayName,
                        user: currentUser.value
                    }
                ]
            });
        }

        const addFriendGroup = (key, label, friends) => {
            if (!friends?.length) return;
            groups.push({
                key,
                label,
                items: friends.map((friend) => {
                    const user = friend?.ref ?? null;
                    const displayName = resolveUserDisplayName(friend.id);
                    return {
                        value: String(friend.id),
                        label: displayName,
                        search: displayName,
                        user
                    };
                })
            });
        };

        addFriendGroup(
            'friendsInInstance',
            t('dialog.invite.friends_in_instance'),
            props.inviteDialog?.friendsInInstance
        );
        addFriendGroup('vip', t('side_panel.favorite'), vipFriends.value);
        addFriendGroup('online', t('side_panel.online'), onlineFriends.value);
        addFriendGroup('active', t('side_panel.active'), activeFriends.value);

        return groups;
    });

    function setInviteUserIds(value) {
        const next = Array.isArray(value) ? value.map((v) => String(v ?? '')).filter(Boolean) : [];
        const ids = Array.isArray(props.inviteDialog.userIds) ? props.inviteDialog.userIds : [];
        ids.splice(0, ids.length, ...next);
    }

    const friendById = computed(() => {
        const map = new Map();
        for (const friend of props.inviteDialog?.friendsInInstance ?? []) map.set(friend.id, friend);
        for (const friend of vipFriends.value) map.set(friend.id, friend);
        for (const friend of onlineFriends.value) map.set(friend.id, friend);
        for (const friend of activeFriends.value) map.set(friend.id, friend);
        return map;
    });

    function resolveUserDisplayName(userId) {
        if (currentUser.value?.id && currentUser.value.id === userId) {
            return currentUser.value.displayName;
        }
        const friend = friendById.value.get(userId);
        return friend?.ref?.displayName ?? friend?.name ?? String(userId);
    }

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
        for (const friend of vipFriends.value) {
            if (!D.userIds.includes(friend.id)) {
                D.userIds.push(friend.id);
            }
        }
    }

    function sendInvite() {
        ElMessageBox.confirm('Continue? Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
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
                        toast.success('Invite sent');
                    }
                };
                inviteLoop();
            })
            .catch(() => {});
    }
</script>
