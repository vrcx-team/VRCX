<template>
    <div class="flex row-auto gap-2" v-bind="$attrs">
        <div id="standart-actions" class="flex row-auto gap-2">
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
            <div v-if="showInviteYourself" class="inline-block">
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
                    class="rounded-full w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
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
                    @click="handleHistory">
                    <History class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
        </div>

        <div v-if="showInstanceInfo" class="flex items-center gap-1.5 text-muted-foreground">
            <TooltipWrapper v-if="instanceInfoState.isValidInstance" side="top">
                <template #content>
                    <div class="flex flex-col flex-wrap items-center gap-x-6 gap-y-2">
                        <div class="flex gap-1">
                            <span>
                                <span class="text-platform-pc border-platform-pc!">PC: </span>
                                {{ instance?.platforms?.standalonewindows }}
                            </span>
                            <span>
                                <span class="text-platform-quest border-platform-quest!">Android: </span>
                                {{ instance?.platforms?.android }}
                            </span>
                            <span>
                                <span class="text-platform-ios border-platform-quest!">iOS: </span>
                                {{ instance?.platforms?.ios }}
                            </span>
                        </div>

                        <span>
                            {{ t('dialog.user.info.instance_game_version') }} {{ instance?.gameServerVersion }}
                        </span>

                        <span v-if="instance?.queueEnabled" class="text-yellow-500 font-medium">
                            {{ t('dialog.user.info.instance_queuing_enabled') }}
                        </span>

                        <span v-if="instanceInfoState.disabledContentSettings">
                            {{ t('dialog.user.info.instance_disabled_content') }}
                            {{ instanceInfoState.disabledContentSettings }}
                        </span>

                        <TooltipWrapper
                            v-if="instanceInfoState.canCloseInstance && !instance?.closedAt"
                            side="top"
                            :content="t('dialog.user.info.close_instance')">
                            <Button
                                class="w-12 h-6 text-xs hover:text-muted-foreground"
                                size="icon-sm"
                                variant="destructive"
                                @click="closeInstance(resolvedInstanceLocation)">
                                <PowerIcon class="h-4 w-4" />
                            </Button>
                        </TooltipWrapper>
                    </div>
                </template>
                <div :class="cn('flex items-center gap-0.5', !instance?.hasCapacityForYou ? 'text-red-500' : null)">
                    <UsersRound class="h-4 w-4" />
                    <span v-if="resolvedInstanceLocation === locationStore.lastLocation.location">
                        {{ locationStore.lastLocation.playerList.size }}/{{ instance?.capacity }}
                    </span>

                    <span v-else-if="instance?.userCount"> {{ instance.userCount }}/{{ instance?.capacity }} </span>
                </div>
            </TooltipWrapper>

            <TooltipWrapper v-if="friendcount" side="top" :content="t('dialog.user.info.instance_friends_tooltip')">
                <span class="flex items-center gap-0.5">
                    <UserPlus2 class="h-4 w-4" />
                    {{ friendcount }}
                </span>
            </TooltipWrapper>
            <span v-if="showLastJoinIndicator" class="inline-block">
                <TooltipWrapper side="top">
                    <template #content>
                        <span>{{ t('dialog.user.info.last_join') }} </span>
                    </template>
                    <span class="flex items-center gap-0.5">
                        <MapPin class="h-4 w-4" />
                        <Timer :epoch="lastJoin" />
                    </span>
                </TooltipWrapper>
            </span>
        </div>

        <div v-if="hasInstanceMetadata" class="flex items-center row-auto gap-2">
            <TooltipWrapper side="top" :content="t('dialog.user.info.instance_queue')">
                <span v-if="instance?.queueSize" class="flex items-center gap-0.5">
                    <SquareStack class="h-4 w-4" />
                    {{ instance.queueSize }}
                </span>
            </TooltipWrapper>
            <TooltipWrapper side="top" :content="t('dialog.user.info.instance_age_gated')">
                <span v-if="instanceInfoState.isAgeGated" class="flex items-center gap-0.5 text-red-500">
                    <IdCard class="h-4 w-4" />
                </span>
            </TooltipWrapper>
            <TooltipWrapper
                v-if="instance?.minimumAvatarPerformance && instance.minimumAvatarPerformance !== 'None'"
                side="top"
                :content="
                    t('dialog.user.info.instance_minimum_avatar_performance') + ': ' + instance.minimumAvatarPerformance
                ">
                <img :src="performanceIcon" class="h-4 w-4" />
            </TooltipWrapper>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import {
        History,
        Loader2,
        LogIn,
        Mail,
        MapPin,
        PowerIcon,
        RefreshCw,
        UsersRound,
        SquareStack,
        IdCard,
        UserPlus2
    } from 'lucide-vue-next';
    import { computed, reactive, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { cn } from '@/lib/utils';

    import {
        useGroupStore,
        useInstanceStore,
        useInviteStore,
        useLaunchStore,
        useLocationStore,
        useModalStore,
        useUserStore
    } from '../stores';
    import { hasGroupPermission, parseLocation } from '../shared/utils';
    import { useInviteChecks } from '../composables/useInviteChecks';
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
    const { checkCanInviteSelf } = useInviteChecks();

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

    const showRefreshButton = computed(() => props.showRefresh && typeof props.onRefresh === 'function');
    const showHistoryButton = computed(() => props.showHistory && typeof props.onHistory === 'function');

    const lastJoin = ref(null);
    const showLastJoinIndicator = computed(() => props.showLastJoin && lastJoin.value);
    const hasInstanceMetadata = computed(() => {
        return !!(
            props.instance.value?.queueSize ||
            instanceInfoState.isAgeGated ||
            (props.instance.minimumAvatarPerformance && props.instance.minimumAvatarPerformance !== 'None')
        );
    });

    const performanceIcon = computed(() => {
        const rank = props.instance.minimumAvatarPerformance?.toLowerCase();
        if (!rank || rank === 'none') return null;
        return `/images/performance_ranks/${rank}.png`;
    });

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

    const closeInstance = (location) => {
        modalStore
            .confirm({
                description: t('confirm.close_instance'),
                title: t('confirm.title')
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
