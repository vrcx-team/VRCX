<template>
    <el-dialog
        :z-index="moderateGroupDialogIndex"
        v-model="moderateGroupDialog.visible"
        :title="t('dialog.moderate_group.header')"
        width="450px"
        append-to-body>
        <div v-if="moderateGroupDialog.visible">
            <div class="x-friend-item" style="cursor: default">
                <div class="avatar">
                    <img :src="userImage(moderateGroupDialog.userObject)" loading="lazy" />
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

            <div style="margin-top: 15px; width: 100%">
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
        <template #footer>
            <el-button
                type="primary"
                :disabled="!moderateGroupDialog.userId || !moderateGroupDialog.groupId"
                @click="
                    showGroupMemberModerationDialog(moderateGroupDialog.groupId, moderateGroupDialog.userId);
                    moderateGroupDialog.visible = false;
                ">
                {{ t('dialog.moderate_group.moderation_tools') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { groupRequest, userRequest } from '../../api';
    import { hasGroupModerationPermission, userImage } from '../../shared/utils';
    import { VirtualCombobox } from '../ui/virtual-combobox';
    import { getNextDialogIndex } from '../../shared/utils/base/ui';
    import { useGroupStore } from '../../stores';

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

    const moderateGroupDialogIndex = ref(2000);

    function initDialog() {
        nextTick(() => {
            moderateGroupDialogIndex.value = getNextDialogIndex();
        });
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
