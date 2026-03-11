<template>
    <Dialog v-model:open="inviteGroupDialog.visible">
        <DialogContent class="sm:max-w-112.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.invite_to_group.header') }}</DialogTitle>
            </DialogHeader>

            <div v-if="inviteGroupDialog.visible">
                <span>{{ t('dialog.invite_to_group.description') }}</span>
                <br />

                <div class="mt-4" style="width: 100%">
                    <VirtualCombobox
                        v-model="inviteGroupDialog.groupId"
                        :groups="groupPickerGroups"
                        :disabled="inviteGroupDialog.loading"
                        :placeholder="t('dialog.invite_to_group.choose_group_placeholder')"
                        :search-placeholder="t('dialog.invite_to_group.choose_group_placeholder')"
                        :clearable="true"
                        :close-on-select="true"
                        :deselect-on-reselect="true">
                        <template #item="{ item, selected }">
                            <div class="flex w-full items-center p-1.5 text-[13px]">
                                <div class="relative inline-block flex-none size-9 mr-2.5">
                                    <img
                                        class="size-full rounded-full object-cover"
                                        :src="item.iconUrl"
                                        loading="lazy" />
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <span class="block truncate font-medium leading-[18px]" v-text="item.label"></span>
                                </div>
                                <CheckIcon :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                            </div>
                        </template>
                    </VirtualCombobox>
                </div>

                <div style="width: 100%; margin-top: 16px">
                    <VirtualCombobox
                        v-model="inviteGroupDialog.userIds"
                        :groups="friendPickerGroups"
                        multiple
                        :disabled="inviteGroupDialog.loading"
                        :placeholder="t('dialog.invite_to_group.choose_friends_placeholder')"
                        :search-placeholder="t('dialog.invite_to_group.choose_friends_placeholder')"
                        :clearable="true">
                        <template #item="{ item, selected }">
                            <div class="flex w-full items-center p-1.5 text-[13px]">
                                <template v-if="item.user">
                                    <div
                                        class="relative inline-block flex-none size-9 mr-2.5"
                                        :class="userStatusClass(item.user)">
                                        <img
                                            class="size-full rounded-full object-cover"
                                            :src="userImage(item.user)"
                                            loading="lazy" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span
                                            class="block truncate font-medium leading-[18px]"
                                            :style="{ color: item.user.$userColour }"
                                            v-text="item.user.displayName"></span>
                                    </div>
                                </template>
                                <template v-else>
                                    <span v-text="item.label"></span>
                                </template>

                                <CheckIcon :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                            </div>
                        </template>
                    </VirtualCombobox>
                </div>
            </div>

            <DialogFooter>
                <Button
                    :disabled="
                        inviteGroupDialog.loading || !inviteGroupDialog.userIds.length || !inviteGroupDialog.groupId
                    "
                    @click="sendGroupInvite">
                    {{ t('dialog.invite_to_group.invite') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Check as CheckIcon } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { hasGroupPermission } from '../../shared/utils';
    import { useUserDisplay } from '../../composables/useUserDisplay';
    import { useFriendStore, useGroupStore, useModalStore } from '../../stores';
    import { groupRequest, queryRequest } from '../../api';
    import { VirtualCombobox } from '../ui/virtual-combobox';

    import configRepository from '../../services/config';

    const { userImage, userStatusClass } = useUserDisplay();
    const { vipFriends, onlineFriends, activeFriends, offlineFriends } = storeToRefs(useFriendStore());
    const { currentUserGroups, inviteGroupDialog } = storeToRefs(useGroupStore());
    const { applyGroup } = useGroupStore();
    const { t } = useI18n();
    const modalStore = useModalStore();

    watch(
        () => inviteGroupDialog.value.visible,
        async (value) => {
            if (value) {
                inviteGroupDialog.value.groupId = await configRepository.getString('inviteGroupLastGroup', '');
                initDialog();
            } else {
                await configRepository.setString('inviteGroupLastGroup', inviteGroupDialog.value.groupId);
            }
        }
    );

    const groupsWithInvitePermission = computed(() => {
        return Array.from(currentUserGroups.value.values()).filter((group) =>
            hasGroupPermission(group, 'group-invites-manage')
        );
    });

    const groupPickerGroups = computed(() => [
        {
            key: 'groupsWithInvitePermission',
            label: t('dialog.invite_to_group.groups_with_invite_permission'),
            items: groupsWithInvitePermission.value.map((group) => ({
                value: String(group.id),
                label: group.name,
                search: group.name,
                iconUrl: group.iconUrl
            }))
        }
    ]);

    const friendById = computed(() => {
        const map = new Map();
        for (const friend of vipFriends.value) map.set(friend.id, friend);
        for (const friend of onlineFriends.value) map.set(friend.id, friend);
        for (const friend of activeFriends.value) map.set(friend.id, friend);
        for (const friend of offlineFriends.value) map.set(friend.id, friend);
        return map;
    });

    /**
     *
     * @param userId
     */
    function resolveUserDisplayName(userId) {
        const D = inviteGroupDialog.value;
        if (D?.userObject?.id && D.userObject.id === userId) {
            return D.userObject.displayName;
        }
        const friend = friendById.value.get(userId);
        return friend?.ref?.displayName ?? friend?.name ?? String(userId);
    }

    const friendPickerGroups = computed(() => {
        const D = inviteGroupDialog.value;

        const groups = [];

        if (D?.userId) {
            const selectedUser = D.userObject?.id
                ? {
                      value: String(D.userObject.id),
                      label: D.userObject.displayName,
                      search: D.userObject.displayName,
                      user: D.userObject
                  }
                : {
                      value: String(D.userId),
                      label: String(D.userId),
                      search: String(D.userId)
                  };

            groups.push({
                key: 'selectedUsers',
                label: t('dialog.invite_to_group.selected_users'),
                items: [selectedUser]
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

        addFriendGroup('vip', t('side_panel.favorite'), vipFriends.value);
        addFriendGroup('online', t('side_panel.online'), onlineFriends.value);
        addFriendGroup('active', t('side_panel.active'), activeFriends.value);
        addFriendGroup('offline', t('side_panel.offline'), offlineFriends.value);

        return groups;
    });

    watch(
        () => inviteGroupDialog.value.groupId,
        (groupId) => {
            if (!inviteGroupDialog.value.visible) {
                return;
            }
            if (!groupId) {
                inviteGroupDialog.value.groupName = '';
                return;
            }
            queryRequest
                .fetch('group', { groupId })
                .then((args) => {
                    inviteGroupDialog.value.groupName = args.ref.name;
                })
                .catch(() => {
                    inviteGroupDialog.value.groupId = '';
                });
            isAllowedToInviteToGroup();
        }
    );

    /**
     *
     */
    function initDialog() {
        const D = inviteGroupDialog.value;
        if (D.groupId) {
            queryRequest
                .fetch('group', {
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
            queryRequest.fetch('user.dialog', { userId: D.userId }).then((args) => {
                D.userObject = args.ref;
                D.userIds = [D.userId];
            });
        }
    }
    /**
     *
     */
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
                toast.error('You are not allowed to invite to this group');
                return args;
            })
            .finally(() => {
                inviteGroupDialog.value.loading = false;
            });
    }
    /**
     *
     */
    function sendGroupInvite() {
        modalStore
            .confirm({
                description: t('confirm.invite_group'),
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (!ok) return;
                const D = inviteGroupDialog.value;
                if (D.loading === true) {
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
