<template>
    <div style="display: inline-block; margin-left: 5px">
        <TooltipWrapper v-if="state.isValidInstance" side="bottom">
            <template #content>
                <div>
                    <span v-if="props.instance.closedAt"
                        >Closed At: {{ formatDateFilter(props.instance.closedAt, 'long') }}<br
                    /></span>
                    <template v-if="state.canCloseInstance">
                        <Button
                            class="mt-1"
                            size="sm"
                            :disabled="!!props.instance.closedAt"
                            @click="closeInstance(props.location)">
                            {{ t('dialog.user.info.close_instance') }} </Button
                        ><br /><br />
                    </template>
                    <span
                        ><span class="x-tag-platform-pc">PC: </span
                        >{{ props.instance.platforms.standalonewindows }}</span
                    ><br />
                    <span
                        ><span class="x-tag-platform-quest">Android: </span>{{ props.instance.platforms.android }}</span
                    ><br />
                    <span><span>iOS: </span>{{ props.instance.platforms.ios }}</span
                    ><br />
                    <span>{{ t('dialog.user.info.instance_game_version') }} {{ props.instance.gameServerVersion }}</span
                    ><br />
                    <span v-if="props.instance.queueEnabled"
                        >{{ t('dialog.user.info.instance_queuing_enabled') }}<br
                    /></span>
                    <span v-if="state.disabledContentSettings"
                        >{{ t('dialog.user.info.instance_disabled_content') }} {{ state.disabledContentSettings }}<br
                    /></span>
                    <span v-if="props.instance.users.length">{{ t('dialog.user.info.instance_users') }}<br /></span>
                    <template v-for="user in props.instance.users" :key="user.id">
                        <span style="cursor: pointer; margin-right: 5px" @click="showUserDialog(user.id)">{{
                            user.displayName
                        }}</span>
                    </template>
                </div>
            </template>
            <el-icon><CaretBottom /></el-icon>
        </TooltipWrapper>
        <span v-if="props.location === locationStore.lastLocation.location" style="margin-left: 5px"
            >{{ locationStore.lastLocation.playerList.size }}/{{ props.instance.capacity }}</span
        >
        <span v-else-if="props.instance.userCount" style="margin-left: 5px"
            >{{ props.instance.userCount }}/{{ props.instance.capacity }}</span
        >
        <span v-if="props.friendcount" style="margin-left: 5px">({{ props.friendcount }})</span>
        <span
            v-if="state.isValidInstance && !props.instance.hasCapacityForYou"
            style="margin-left: 5px; color: var(--el-color-danger)"
            >{{ t('dialog.user.info.instance_full') }}</span
        >
        <span v-if="props.instance.queueSize" style="margin-left: 5px"
            >{{ t('dialog.user.info.instance_queue') }} {{ props.instance.queueSize }}</span
        >
        <span v-if="state.isAgeGated" style="margin-left: 5px; color: var(--el-color-danger)">{{
            t('dialog.user.info.instance_age_gated')
        }}</span>
    </div>
</template>

<script setup>
    import { reactive, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { CaretBottom } from '@element-plus/icons-vue';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useGroupStore, useInstanceStore, useLocationStore, useModalStore, useUserStore } from '../stores';
    import { formatDateFilter, hasGroupPermission } from '../shared/utils';
    import { miscRequest } from '../api';

    const { t } = useI18n();

    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();
    const modalStore = useModalStore();

    const props = defineProps({
        location: String,
        instance: Object,
        friendcount: Number
    });

    const state = reactive({
        isValidInstance: false,
        canCloseInstance: false,
        isAgeGated: false,
        disabledContentSettings: ''
    });

    function parse() {
        Object.assign(state, {
            isValidInstance: false,
            canCloseInstance: false,
            isAgeGated: false,
            disabledContentSettings: ''
        });

        if (!props.location || !props.instance || Object.keys(props.instance).length === 0) return;

        state.isValidInstance = true;
        if (props.instance.ownerId === userStore.currentUser.id) {
            state.canCloseInstance = true;
        } else if (props.instance.ownerId?.startsWith('grp_')) {
            const group = groupStore.cachedGroups.get(props.instance.ownerId);
            state.canCloseInstance = hasGroupPermission(group, 'group-instance-moderate');
        }
        state.isAgeGated = props.instance.ageGate === true;
        if (props.location?.includes('~ageGate')) state.isAgeGated = true;
        if (props.instance.$disabledContentSettings?.length) {
            state.disabledContentSettings = props.instance.$disabledContentSettings.join(', ');
        }
    }

    watch([() => props.location, () => props.instance, () => props.friendcount], parse, { immediate: true });

    function showUserDialog(userId) {
        userStore.showUserDialog(userId);
    }

    function closeInstance(location) {
        modalStore
            .confirm({
                description: 'Continue? Close Instance, nobody will be able to join',
                title: 'Confirm'
            })
            .then(async ({ ok }) => {
                if (!ok) return;
                const args = await miscRequest.closeInstance({ location, hardClose: false });
                if (args.json) {
                    toast.success(t('message.instance.closed'));
                    instanceStore.applyInstance(args.json);
                }
            })
            .catch(() => {});
    }
</script>
