<template>
    <Dialog v-model:open="moderateGroupDialog.visible">
        <DialogContent class="sm:max-w-112.5">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.moderate_group.header') }}</DialogTitle>
            </DialogHeader>

            <div v-if="moderateGroupDialog.visible">
                <div class="box-border flex items-center p-1.5 text-[13px] cursor-default">
                    <div class="relative inline-block flex-none size-9 mr-2.5">
                        <img
                            class="size-full rounded-full object-cover"
                            :src="userImage(moderateGroupDialog.userObject)"
                            loading="lazy" />
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <span
                            v-if="moderateGroupDialog.userObject.id"
                            class="block truncate font-medium leading-[18px]"
                            :style="{ color: moderateGroupDialog.userObject.$userColour }"
                            v-text="moderateGroupDialog.userObject.displayName"></span>
                        <span v-else v-text="moderateGroupDialog.userId"></span>
                    </div>
                </div>

                <div class="mt-4" style="width: 100%">
                    <VirtualCombobox
                        :model-value="moderateGroupDialog.groupId"
                        @update:modelValue="setGroupId"
                        :groups="groupPickerGroups"
                        :placeholder="t('dialog.moderate_group.choose_group_placeholder')"
                        :search-placeholder="t('dialog.moderate_group.choose_group_placeholder')"
                        :close-on-select="true">
                        <template #item="{ item, selected }">
                            <div class="flex w-full items-center gap-2">
                                <img :src="item.iconUrl" loading="lazy" class="size-5 rounded-sm" />
                                <span class="truncate text-sm" v-text="item.label"></span>
                                <span v-if="selected" class="ml-auto opacity-70">✓</span>
                            </div>
                        </template>
                    </VirtualCombobox>
                </div>
            </div>

            <DialogFooter>
                <Button
                    :disabled="!moderateGroupDialog.userId || !moderateGroupDialog.groupId"
                    @click="
                        showGroupMemberModerationDialog(moderateGroupDialog.groupId, moderateGroupDialog.userId);
                        moderateGroupDialog.visible = false;
                    ">
                    {{ t('dialog.moderate_group.moderation_tools') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { hasGroupModerationPermission } from '../../shared/utils';
    import { useUserDisplay } from '../../composables/useUserDisplay';
    import { VirtualCombobox } from '../ui/virtual-combobox';
    import { queryRequest } from '../../api';
    import { useGroupStore } from '../../stores';

    const { userImage } = useUserDisplay();
    const { currentUserGroups, moderateGroupDialog } = storeToRefs(useGroupStore());
    const { showGroupMemberModerationDialog } = useGroupStore();
    const { t } = useI18n();

    const groupsWithModerationPermission = computed(() => {
        return Array.from(currentUserGroups.value.values()).filter((group) => hasGroupModerationPermission(group));
    });

    const groupPickerGroups = computed(() => [
        {
            key: 'groups',
            label: t('dialog.moderate_group.header'),
            items: groupsWithModerationPermission.value.map((group) => ({
                value: group.id,
                label: group.name,
                search: group.name,
                iconUrl: group.iconUrl
            }))
        }
    ]);

    /**
     *
     * @param value
     */
    function setGroupId(value) {
        moderateGroupDialog.value.groupId = String(value ?? '');
    }

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

    /**
     *
     */
    function initDialog() {
        const D = moderateGroupDialog.value;
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
        }

        if (D.userId) {
            queryRequest.fetch('user.dialog', { userId: D.userId }).then((args) => {
                D.userObject = args.ref;
            });
        }
    }
</script>
