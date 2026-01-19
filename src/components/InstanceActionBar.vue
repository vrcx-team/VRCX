<template>
    <div class="flex items-center" v-bind="$attrs">
        <div v-if="showLaunchButton" class="inline-block">
            <TooltipWrapper side="top" :content="t('dialog.user.info.launch_invite_tooltip')">
                <Button
                    class="rounded-full w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
                    size="icon-sm"
                    variant="outline"
                    @click="confirmLaunch">
                    <LogIn />
                </Button>
            </TooltipWrapper>
        </div>
        <div v-if="showInviteYourself" class="inline-block" :style="inviteStyle">
            <TooltipWrapper
                v-if="!canOpenInstanceInGame"
                side="top"
                :content="t('dialog.user.info.self_invite_tooltip')">
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                    size="icon-sm"
                    variant="outline"
                    @click="confirmInvite">
                    <Mail class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper v-else side="top" :content="t('dialog.user.info.open_in_vrchat_tooltip')">
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                    size="icon-sm"
                    variant="outline"
                    v-if="isOpeningInstance">
                    <Loader2 class="h-4 w-4 animate-spin" />
                </Button>
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                    size="icon-sm"
                    variant="outline"
                    v-else
                    @click="openInstance">
                    <Mail class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
        </div>
        <TooltipWrapper v-if="showRefreshButton" side="top" :content="refreshTooltip">
            <Button
                class="rounded-full ml-1 w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
                size="icon"
                variant="outline"
                @click="handleRefresh">
                <RefreshCw class="h-4 w-4" />
            </Button>
        </TooltipWrapper>
        <TooltipWrapper v-if="showHistoryButton" side="top" :content="historyTooltip">
            <Button
                class="rounded-full w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
                size="icon-sm"
                variant="outline"
                style="margin-left: 5px"
                @click="handleHistory">
                <History class="h-4 w-4" />
            </Button>
        </TooltipWrapper>

        <div v-if="showInstanceInfo" class="flex items-center ml-2">
            <TooltipWrapper v-if="instanceInfoState.isValidInstance" side="top">
                <template #content>
                    <div>
                        <span v-if="instance?.closedAt">
                            Closed At: {{ formatDateFilter(instance.closedAt, 'long') }}<br />
                        </span>
                        <template v-if="instanceInfoState.canCloseInstance">
                            <Button
                                class="mt-1"
                                size="xs"
                                variant="outline"
                                :disabled="!!instance?.closedAt"
                                @click="closeInstance(resolvedInstanceLocation)">
                                {{ t('dialog.user.info.close_instance') }}
                            </Button>
                            <br /><br />
                        </template>
                        <span>
                            <span class="x-tag-platform-pc">PC: </span>{{ instance?.platforms?.standalonewindows }}
                        </span>
                        <br />
                        <span>
                            <span class="x-tag-platform-quest">Android: </span>{{ instance?.platforms?.android }}
                        </span>
                        <br />
                        <span><span>iOS: </span>{{ instance?.platforms?.ios }}</span>
                        <br />
                        <span>{{ t('dialog.user.info.instance_game_version') }} {{ instance?.gameServerVersion }}</span>
                        <br />
                        <span v-if="instance?.queueEnabled"
                            >{{ t('dialog.user.info.instance_queuing_enabled') }}<br
                        /></span>
                        <span v-if="instanceInfoState.disabledContentSettings">
                            {{ t('dialog.user.info.instance_disabled_content') }}
                            {{ instanceInfoState.disabledContentSettings }}<br />
                        </span>
                        <span v-if="instance?.users?.length">{{ t('dialog.user.info.instance_users') }}<br /></span>
                        <template v-for="user in instance?.users || []" :key="user.id">
                            <span style="cursor: pointer; margin-right: 5px" @click="showUserDialog(user.id)">
                                {{ user.displayName }}
                            </span>
                        </template>
                    </div>
                </template>
                <div class="mr-1 text-muted-foreground">
                    <span v-if="resolvedInstanceLocation === locationStore.lastLocation.location">
                        {{ locationStore.lastLocation.playerList.size }}/{{ instance?.capacity }}
                    </span>

                    <span v-else-if="instance?.userCount"> {{ instance.userCount }}/{{ instance?.capacity }} </span>
                </div>
            </TooltipWrapper>

            <TooltipWrapper v-if="friendcount" side="top" :content="t('dialog.user.info.instance_friends_tooltip')">
                <span class="ml-1 flex items-center text-muted-foreground"><UsersRound />{{ friendcount }}</span>
            </TooltipWrapper>
            <span v-if="showLastJoinIndicator" class="inline-block ml-1">
                <TooltipWrapper side="top">
                    <template #content>
                        <span>{{ t('dialog.user.info.last_join') }} </span>
                    </template>
                    <span class="flex items-center ml-1">
                        <MapPin class="h-4 w-4 text-muted-foreground" />
                        <Timer class="text-muted-foreground" :epoch="lastJoin" />
                    </span>
                </TooltipWrapper>
            </span>
            <span v-if="instanceInfoState.isValidInstance && !instance?.hasCapacityForYou" class="ml-1">
                {{ t('dialog.user.info.instance_full') }}
            </span>
            <span v-if="instance?.queueSize" class="ml-1">
                {{ t('dialog.user.info.instance_queue') }} {{ instance.queueSize }}
            </span>
            <span v-if="instanceInfoState.isAgeGated" class="ml-1">
                {{ t('dialog.user.info.instance_age_gated') }}
            </span>
        </div>
    </div>
</template>

<script setup>
    import { History, Loader2, LogIn, Mail, MapPin, RefreshCw, UsersRound } from 'lucide-vue-next';
    import { computed, reactive, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useGroupStore,
        useInstanceStore,
        useInviteStore,
        useLaunchStore,
        useLocationStore,
        useModalStore,
        useUserStore
    } from '../stores';
    import { checkCanInviteSelf, formatDateFilter, hasGroupPermission, parseLocation } from '../shared/utils';
    import { instanceRequest, miscRequest } from '../api';

    defineOptions({
        inheritAttrs: false
    });

    const { t } = useI18n();

    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();
    const modalStore = useModalStore();
    const launchStore = useLaunchStore();
    const inviteStore = useInviteStore();

    const { instanceJoinHistory } = storeToRefs(instanceStore);
    const { canOpenInstanceInGame } = storeToRefs(inviteStore);
    const { isOpeningInstance } = storeToRefs(launchStore);

    const props = defineProps({
        location: {
            type: String,
            default: ''
        },
        launchLocation: {
            type: String,
            default: ''
        },
        inviteLocation: {
            type: String,
            default: ''
        },
        lastJoinLocation: {
            type: String,
            default: ''
        },
        instanceLocation: {
            type: String,
            default: ''
        },
        shortname: {
            type: String,
            default: ''
        },
        instance: {
            type: Object,
            default: null
        },
        friendcount: {
            type: Number,
            default: undefined
        },
        currentlocation: {
            type: String,
            default: ''
        },
        showLaunch: {
            type: Boolean,
            default: true
        },
        showInvite: {
            type: Boolean,
            default: true
        },
        showRefresh: {
            type: Boolean,
            default: true
        },
        showHistory: {
            type: Boolean,
            default: false
        },
        showLastJoin: {
            type: Boolean,
            default: true
        },
        showInstanceInfo: {
            type: Boolean,
            default: true
        },
        refreshTooltip: {
            type: String,
            default: ''
        },
        historyTooltip: {
            type: String,
            default: ''
        },
        onRefresh: {
            type: Function,
            default: null
        },
        onHistory: {
            type: Function,
            default: null
        }
    });

    const resolvedLaunchLocation = computed(() => props.launchLocation || props.location);
    const resolvedInviteLocation = computed(() => props.inviteLocation || props.location);
    const resolvedLastJoinLocation = computed(() => props.lastJoinLocation || props.location);
    const resolvedInstanceLocation = computed(() => props.instanceLocation || props.location);

    const showLaunchButton = computed(() => props.showLaunch && checkCanInviteSelf(resolvedLaunchLocation.value));
    const showInviteYourself = computed(() => props.showInvite && checkCanInviteSelf(resolvedInviteLocation.value));

    const inviteStyle = computed(() => (showLaunchButton.value ? 'margin-left: 5px' : ''));
    const showRefreshButton = computed(() => props.showRefresh && typeof props.onRefresh === 'function');
    const showHistoryButton = computed(() => props.showHistory && typeof props.onHistory === 'function');

    const lastJoin = ref(null);
    const showLastJoinIndicator = computed(() => props.showLastJoin && lastJoin.value);

    const instanceInfoState = reactive({
        isValidInstance: false,
        canCloseInstance: false,
        isAgeGated: false,
        disabledContentSettings: ''
    });

    const handleRefresh = () => {
        if (typeof props.onRefresh === 'function') {
            props.onRefresh();
        }
    };

    const handleHistory = () => {
        if (typeof props.onHistory === 'function') {
            props.onHistory();
        }
    };

    const confirmLaunch = () => {
        launchStore.showLaunchDialog(resolvedLaunchLocation.value);
    };

    const confirmInvite = () => {
        const L = parseLocation(resolvedInviteLocation.value);
        if (!L.isRealInstance) {
            return;
        }

        instanceRequest
            .selfInvite({
                instanceId: L.instanceId,
                worldId: L.worldId,
                shortName: props.shortname
            })
            .then((args) => {
                toast.success(t('message.invite.self_sent'));
                return args;
            });
    };

    const openInstance = () => {
        const L = parseLocation(resolvedInviteLocation.value);
        if (!L.isRealInstance) {
            return;
        }

        launchStore.tryOpenInstanceInVrc(L.tag, props.shortname);
    };

    const parseLastJoin = () => {
        lastJoin.value = instanceJoinHistory.value.get(resolvedLastJoinLocation.value);
    };

    const parseInstanceInfo = () => {
        Object.assign(instanceInfoState, {
            isValidInstance: false,
            canCloseInstance: false,
            isAgeGated: false,
            disabledContentSettings: ''
        });

        if (!resolvedInstanceLocation.value || !props.instance || Object.keys(props.instance).length === 0) return;

        instanceInfoState.isValidInstance = true;
        if (props.instance.ownerId === userStore.currentUser.id) {
            instanceInfoState.canCloseInstance = true;
        } else if (props.instance.ownerId?.startsWith('grp_')) {
            const group = groupStore.cachedGroups.get(props.instance.ownerId);
            instanceInfoState.canCloseInstance = hasGroupPermission(group, 'group-instance-moderate');
        }
        instanceInfoState.isAgeGated = props.instance.ageGate === true;
        if (resolvedInstanceLocation.value?.includes('~ageGate')) instanceInfoState.isAgeGated = true;
        if (props.instance.$disabledContentSettings?.length) {
            instanceInfoState.disabledContentSettings = props.instance.$disabledContentSettings.join(', ');
        }
    };

    const showUserDialog = (userId) => {
        userStore.showUserDialog(userId);
    };

    const closeInstance = (location) => {
        modalStore
            .confirm({
                description: 'Continue? X Instance, nobody will be able to join',
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
    };

    watch(() => resolvedLastJoinLocation.value, parseLastJoin, { immediate: true });
    watch(() => props.currentlocation, parseLastJoin);
    watch([resolvedInstanceLocation, () => props.instance, () => props.friendcount], parseInstanceInfo, {
        immediate: true
    });
</script>

<style scoped>
    .inline-block {
        display: inline-block;
    }
    .ml-5 {
        margin-left: 5px;
    }
</style>
