<template>
    <div class="flex row-auto gap-2" v-bind="$attrs">
        <div v-if="showButtons" class="flex row-auto gap-2">
            <div v-if="showLaunchButton" class="inline-block">
                <TooltipWrapper side="top" :content="t('dialog.user.info.launch_invite_tooltip')">
                    <Button
                        class="rounded-full w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
                        :style="buttonStyle"
                        size="icon-sm"
                        variant="outline"
                        :ariaLabel="t('dialog.user.info.launch_invite_tooltip')"
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
                        :style="buttonStyle"
                        size="icon-sm"
                        variant="outline"
                        :ariaLabel="t('dialog.user.info.self_invite_tooltip')"
                        @click="confirmInvite">
                        <Mail class="h-4 w-4" />
                    </Button>
                </TooltipWrapper>
                <TooltipWrapper v-else side="top" :content="t('dialog.user.info.open_in_vrchat_tooltip')">
                    <Button
                        class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                        :style="buttonStyle"
                        size="icon-sm"
                        variant="outline"
                        :ariaLabel="t('dialog.user.info.open_in_vrchat_tooltip')"
                        v-if="isOpeningInstance">
                        <Loader2 class="h-4 w-4 animate-spin" />
                    </Button>
                    <Button
                        class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                        :style="buttonStyle"
                        size="icon-sm"
                        variant="outline"
                        :ariaLabel="t('dialog.user.info.open_in_vrchat_tooltip')"
                        v-else
                        @click="openInstance">
                        <Mail class="h-4 w-4" />
                    </Button>
                </TooltipWrapper>
            </div>
            <TooltipWrapper
                v-if="instanceInfoState.canSendAnnouncement"
                side="top"
                :content="t('dialog.user.info.instance_announcement_tooltip')">
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                    :style="buttonStyle"
                    size="icon-sm"
                    variant="outline"
                    :ariaLabel="t('dialog.user.info.instance_announcement_tooltip')"
                    @click="instanceAnnouncementDialogVisible = true">
                    <Megaphone class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper
                v-if="instanceInfoState.canLinkCalendarEvent"
                side="top"
                :content="t('dialog.user.info.instance_calendar_link_tooltip')">
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                    :style="buttonStyle"
                    size="icon-sm"
                    variant="outline"
                    :ariaLabel="t('dialog.user.info.instance_calendar_link_tooltip')"
                    @click="instanceCalendarLinkDialogVisible = true">
                    <CalendarPlus class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper
                v-if="instanceInfoState.canRenameInstance"
                side="top"
                :content="t('dialog.user.info.rename_instance')">
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                    :style="buttonStyle"
                    size="icon-sm"
                    variant="outline"
                    :ariaLabel="t('dialog.user.info.rename_instance')"
                    @click="renameInstance(resolvedInstanceLocation)">
                    <Pencil class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper
                v-if="!instance?.closedAt && instanceInfoState.canCloseInstance"
                side="top"
                :content="t('dialog.user.info.close_instance')">
                <Button
                    class="rounded-full h-6 w-6 text-xs text-muted-foreground hover:text-red-500"
                    :style="buttonStyle"
                    size="icon-sm"
                    variant="outline"
                    :ariaLabel="t('dialog.user.info.close_instance')"
                    @click="closeInstance(resolvedInstanceLocation)">
                    <PowerIcon class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper v-if="showRefreshButton" side="top" :content="refreshTooltip">
                <Button
                    class="rounded-full w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
                    :style="buttonStyle"
                    size="icon"
                    variant="outline"
                    :ariaLabel="t('common.actions.refresh')"
                    @click="handleRefresh">
                    <RefreshCw class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
            <TooltipWrapper v-if="showHistoryButton" side="top" :content="historyTooltip">
                <Button
                    class="rounded-full w-6 h-6 text-xs text-muted-foreground hover:text-foreground"
                    :style="buttonStyle"
                    size="icon-sm"
                    variant="outline"
                    :ariaLabel="t('dialog.social_status.history')"
                    @click="handleHistory">
                    <History class="h-4 w-4" />
                </Button>
            </TooltipWrapper>
        </div>

        <div
            v-if="showInstanceInfo"
            :class="
                cn(
                    'flex items-center gap-1.5 text-muted-foreground rounded-full border border-muted-foreground/10 py-0.5 px-2',
                    props.class
                )
            ">
            <TooltipWrapper v-if="instanceInfoState.isValidInstance" side="top">
                <template #content>
                    <div class="flex flex-col flex-wrap gap-x-6 gap-y-2">
                        <div v-if="instanceDescription" class="flex flex-col gap-1">
                            <span>{{ t('dialog.user.info.instance_description') }}</span>
                            <span class="max-w-80 whitespace-pre-wrap break-words">{{ instanceDescription }}</span>
                        </div>

                        <div
                            v-if="
                                instance?.platforms?.standalonewindows ||
                                instance?.platforms?.android ||
                                instance?.platforms?.ios
                            "
                            class="flex flex-col gap-1">
                            <span v-if="instance.platforms.standalonewindows">
                                <span class="text-platform-pc border-platform-pc!">PC: </span>
                                {{ instance.platforms.standalonewindows }}
                            </span>
                            <span v-if="instance.platforms.android">
                                <span class="text-platform-quest border-platform-quest!">Android: </span>
                                {{ instance.platforms.android }}
                            </span>
                            <span v-if="instance.platforms.ios">
                                <span class="text-platform-ios border-platform-quest!">iOS: </span>
                                {{ instance.platforms.ios }}
                            </span>
                        </div>

                        <span v-if="instance?.categoryId" class="flex items-center gap-1">
                            {{ t('dialog.user.info.instance_category') }}
                            <i
                                v-if="instanceCategory?.icon"
                                :class="['leading-none translate-y-px', instanceCategory.icon]" />
                            {{ instanceCategory?.name ?? instance.categoryId }}
                        </span>

                        <span v-if="instance?.vibeIds?.length">
                            {{ t('dialog.user.info.instance_vibes') }} {{ instanceVibeTitles }}
                        </span>

                        <div v-if="instanceLanguages.length" class="flex flex-col gap-1">
                            <span>{{ t('dialog.user.info.instance_languages') }}</span>
                            <span v-for="lang in instanceLanguages" :key="lang.key" class="flex items-center gap-1.5">
                                <span :class="['flags', 'inline-block', languageClass(lang.flagKey)]"></span>
                                {{ lang.name }}
                                <span v-if="lang.percent !== null" class="text-muted-foreground">
                                    {{ lang.percent }}%
                                </span>
                                <Star
                                    v-if="lang.isCreationLanguage"
                                    class="h-3 w-3 text-yellow-500"
                                    :title="t('dialog.user.info.instance_creation_language')" />
                            </span>
                        </div>

                        <span v-if="instance?.gameServerVersion">
                            {{ t('dialog.user.info.instance_game_version') }} {{ instance?.gameServerVersion }}
                        </span>

                        <span v-if="instance?.queueEnabled" class="text-yellow-500 font-medium">
                            {{ t('dialog.user.info.instance_queuing_enabled') }}
                        </span>

                        <span v-if="instanceInfoState.disabledContentSettings">
                            {{ t('dialog.user.info.instance_disabled_content') }}
                            {{ instanceInfoState.disabledContentSettings }}
                        </span>
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

            <template v-if="hasInstanceMetadata">
                <TooltipWrapper v-if="instance?.queueSize" side="top" :content="t('dialog.user.info.instance_queue')">
                    <span class="flex items-center gap-0.5">
                        <SquareStack class="h-4 w-4" />
                        {{ instance.queueSize }}
                    </span>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="instanceInfoState.isAgeGated"
                    side="top"
                    :content="t('dialog.user.info.instance_age_gated')">
                    <span class="flex items-center gap-0.5 text-red-500">
                        <IdCard class="h-4 w-4" />
                    </span>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="instanceInfoState.isRoleRestricted"
                    side="top"
                    :content="t('dialog.user.info.instance_role_restricted')">
                    <span class="flex items-center gap-0.5 text-red-500">
                        <UserLock class="h-4 w-4" />
                    </span>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="instance?.calendarEntryId && !isInGroup"
                    side="top"
                    :content="t('dialog.user.info.instance_calendar_event')">
                    <span class="flex items-center gap-0.5">
                        <CalendarDays class="h-4 w-4" />
                    </span>
                </TooltipWrapper>
                <Popover v-else-if="instance?.calendarEntryId" :open="calendarPopoverOpen">
                    <PopoverTrigger as-child>
                        <span
                            class="flex items-center gap-0.5"
                            @mouseenter="openCalendarPopover"
                            @mouseleave="scheduleCloseCalendarPopover">
                            <CalendarDays class="h-4 w-4" />
                        </span>
                    </PopoverTrigger>
                    <PopoverContent
                        side="top"
                        class="w-125 p-3"
                        @mouseenter="openCalendarPopover"
                        @mouseleave="scheduleCloseCalendarPopover">
                        <GroupCalendarEventDetails v-if="calendarEvent" :event="calendarEvent" relative-time />
                        <span v-else-if="calendarEventFailed" class="text-xs">
                            {{ t('dialog.user.info.instance_calendar_event') }}
                        </span>
                        <div v-else class="flex justify-center">
                            <Loader2 class="h-4 w-4 animate-spin" />
                        </div>
                    </PopoverContent>
                </Popover>
                <TooltipWrapper v-if="currentHypeTrain" side="top">
                    <template #content>
                        <div class="flex flex-col gap-1">
                            <span class="font-medium">{{ t('dialog.user.info.instance_hype_train') }}</span>
                            <span>
                                {{ t('dialog.user.info.instance_hype_train_gifts') }}
                                {{ currentHypeTrain.currentGiftCount }}/{{ currentHypeTrain.totalGiftGoal }}
                            </span>
                            <span>
                                {{ t('dialog.user.info.instance_hype_train_contributors') }}
                                {{ currentHypeTrain.totalGiftContributors }}
                            </span>
                            <span v-if="hypeTrainTimeRemaining">
                                {{ t('dialog.user.info.instance_hype_train_time_remaining') }}
                                {{ hypeTrainTimeRemaining }}
                            </span>
                            <span v-if="hypeTrainStartEpoch">
                                {{ t('dialog.user.info.instance_hype_train_started') }}
                                <Timer :epoch="hypeTrainStartEpoch" />
                            </span>
                        </div>
                    </template>
                    <span class="flex items-center gap-0.5">
                        <TrainFront class="h-4 w-4" />
                    </span>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="instance?.minimumAvatarPerformance && instance.minimumAvatarPerformance !== 'None'"
                    side="top"
                    :content="
                        t('dialog.user.info.instance_minimum_avatar_performance') +
                        ': ' +
                        instance.minimumAvatarPerformance
                    ">
                    <img :src="performanceIcon" class="h-4 w-4" />
                </TooltipWrapper>
            </template>
        </div>
        <InstanceAnnouncementDialog
            v-if="instanceAnnouncementDialogVisible"
            v-model:open="instanceAnnouncementDialogVisible"
            :location="resolvedInstanceLocation" />
        <InstanceCalendarLinkDialog
            v-if="instanceCalendarLinkDialogVisible"
            v-model:open="instanceCalendarLinkDialogVisible"
            :location="resolvedInstanceLocation"
            :current-event-id="instance?.calendarEntryId ?? ''" />
    </div>
</template>

<script lang="ts" setup>
    import {
        CalendarDays,
        CalendarPlus,
        History,
        Loader2,
        LogIn,
        Mail,
        MapPin,
        Megaphone,
        Pencil,
        PowerIcon,
        RefreshCw,
        UsersRound,
        SquareStack,
        Star,
        IdCard,
        TrainFront,
        UserLock,
        UserPlus2
    } from 'lucide-vue-next';
    import { computed, reactive, ref, watch } from 'vue';
    import { useIntervalFn } from '@vueuse/core';
    import { Button } from '@/components/ui/button';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    import {
        formatSeconds,
        hasGroupPermission,
        languageClass,
        parseLocation,
        replaceBioSymbols
    } from '../shared/utils';
    import { instanceCategoryIcons } from '../shared/constants';
    import { useInviteChecks } from '../composables/useInviteChecks';
    import { instanceRequest, miscRequest, queryRequest } from '../api';
    import InstanceAnnouncementDialog from './dialogs/InstanceAnnouncementDialog.vue';
    import InstanceCalendarLinkDialog from './dialogs/InstanceCalendarLinkDialog.vue';
    import GroupCalendarEventDetails from '../views/Tools/components/GroupCalendarEventDetails.vue';

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

    const { instanceJoinHistory, instanceCategories, instanceVibes } = storeToRefs(instanceStore);
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
        showButtons: {
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
        },
        buttonStyle: {
            type: Object,
            default: () => ({})
        },
        class: { type: null, required: false }
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
    const instanceAnnouncementDialogVisible = ref(false);
    const instanceCalendarLinkDialogVisible = ref(false);
    const showLastJoinIndicator = computed(() => props.showLastJoin && lastJoin.value);
    const hasInstanceMetadata = computed(() => {
        return !!(
            props.instance?.queueSize ||
            instanceInfoState.isAgeGated ||
            instanceInfoState.isRoleRestricted ||
            props.instance?.calendarEntryId ||
            props.instance?.hypeTrain?.current ||
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
        canRenameInstance: false,
        canSendAnnouncement: false,
        canLinkCalendarEvent: false,
        isAgeGated: false,
        isRoleRestricted: false,
        disabledContentSettings: ''
    });

    const instanceLanguages = computed(() => {
        const languages = Array.isArray(props.instance?.languages) ? props.instance.languages : [];
        const iso639 = props.instance?.languagesIso639 ?? [];
        const ratio = props.instance?.languageRatio ?? {};
        const creationLanguages = new Set<string>(props.instance?.creationLanguages ?? []);
        const baseOf = (code) => code.split('-')[0];
        const uniqueBases = [...new Set(languages.map(baseOf))];
        const iso639ByBase = Object.fromEntries(uniqueBases.map((base, i) => [base, iso639[i]]));
        const list = languages.map((code) => {
            const key = iso639ByBase[baseOf(code)] ?? code;
            const region = code.split('-')[1];
            const name = userStore.subsetOfLanguages?.[key] ?? code;
            return {
                key: code,
                flagKey: key,
                name: region ? `${name} (${region.toUpperCase()})` : name,
                percent: Math.round((ratio[code] ?? 0) * 100),
                isCreationLanguage: creationLanguages.has(key) || creationLanguages.has(code)
            };
        });
        const listedKeys = new Set(list.flatMap((lang) => [lang.key, lang.flagKey]));
        for (const key of creationLanguages) {
            if (listedKeys.has(key)) continue;
            list.push({
                key,
                flagKey: key,
                name: userStore.subsetOfLanguages?.[key] ?? key,
                percent: null,
                isCreationLanguage: true
            });
        }
        return list.sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));
    });

    const instanceDescription = computed(() => {
        const description = props.instance?.description?.trim();
        const worldDescription = props.instance?.world?.description?.trim();
        if (!description || worldDescription?.startsWith(description)) return '';
        return description;
    });

    const instanceCategory = computed(() => {
        const category = instanceCategories.value.find((category) => category.id === props.instance?.categoryId);
        if (!category) return null;
        return { name: category.name, icon: instanceCategoryIcons[category.iconUrl] };
    });

    const instanceVibeTitles = computed(() => {
        const vibeById = new Map(instanceVibes.value.map((vibe) => [vibe.id, vibe.title]));
        return (props.instance?.vibeIds ?? []).map((id) => vibeById.get(id) ?? id).join(', ');
    });

    const currentHypeTrain = computed(() => props.instance?.hypeTrain?.current ?? null);
    const hypeTrainStartEpoch = computed(() => {
        const startDate = currentHypeTrain.value?.startDate;
        return startDate ? Date.parse(startDate) || 0 : 0;
    });
    const now = ref(Date.now());
    const { pause: pauseNow, resume: resumeNow } = useIntervalFn(() => (now.value = Date.now()), 1000, {
        immediate: false,
        immediateCallback: true
    });
    watch(currentHypeTrain, (train) => (train ? resumeNow() : pauseNow()), { immediate: true });
    const hypeTrainTimeRemaining = computed(() => {
        const endEpoch = Date.parse(currentHypeTrain.value?.endDate);
        if (!endEpoch) return '';
        return formatSeconds(Math.max(0, (endEpoch - now.value) / 1000));
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
            canRenameInstance: false,
            canSendAnnouncement: false,
            canLinkCalendarEvent: false,
            isAgeGated: false,
            isRoleRestricted: false,
            disabledContentSettings: ''
        });

        if (!resolvedInstanceLocation.value || !props.instance || Object.keys(props.instance).length === 0) return;

        instanceInfoState.isValidInstance = true;
        if (props.instance.ownerId === userStore.currentUser.id) {
            instanceInfoState.canCloseInstance = true;
            instanceInfoState.canRenameInstance = true;
        } else if (props.instance.ownerId?.startsWith('grp_')) {
            const group = groupStore.cachedGroups.get(props.instance.ownerId);
            instanceInfoState.canCloseInstance = hasGroupPermission(group, 'group-instance-moderate');
            instanceInfoState.canRenameInstance = hasGroupPermission(group, 'group-instance-manage');
            instanceInfoState.canSendAnnouncement =
                hasGroupPermission(group, 'group-instance-announcement-create') &&
                resolvedInstanceLocation.value === locationStore.lastLocation.location;
            instanceInfoState.canLinkCalendarEvent =
                hasGroupPermission(group, 'group-instance-manage') &&
                hasGroupPermission(group, 'group-instance-calendar-link');
        }
        instanceInfoState.isAgeGated = props.instance.ageGate === true;
        if (resolvedInstanceLocation.value?.includes('~ageGate')) instanceInfoState.isAgeGated = true;
        instanceInfoState.isRoleRestricted = props.instance.roleRestricted === true;
        if (props.instance.$disabledContentSettings?.length) {
            instanceInfoState.disabledContentSettings = props.instance.$disabledContentSettings.join(', ');
        }
    };

    const refreshInstance = (location) => {
        const L = parseLocation(location);
        return instanceRequest.getInstance({ worldId: L.worldId, instanceId: L.instanceId });
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
                    await refreshInstance(location);
                }
            })
            .catch(() => {});
    };

    const renameInstance = (location) => {
        modalStore
            .prompt({
                title: t('prompt.rename_instance.header'),
                description: t('prompt.rename_instance.description'),
                inputValue: props.instance?.displayName ?? ''
            })
            .then(async ({ ok, value }) => {
                if (!ok) return;
                const displayName = value.trim() || null;
                if (displayName === (props.instance?.displayName ?? null)) return;
                await instanceRequest.updateInstance({ location, displayName });
                toast.success(t('message.instance.renamed'));
                await refreshInstance(location);
            })
            .catch(() => {});
    };

    const calendarPopoverOpen = ref(false);
    const calendarEvent = ref(null);
    const calendarEventFailed = ref(false);
    let calendarPopoverCloseTimer = null;

    const isInGroup = computed(() => groupStore.currentUserGroups.has(props.instance?.ownerId));

    const fetchCalendarEvent = async () => {
        const groupId = props.instance?.ownerId;
        const eventId = props.instance?.calendarEntryId;
        if (!groupId || !eventId || !isInGroup.value || calendarEvent.value?.id === eventId) return;
        try {
            const args = await queryRequest.fetch<{ json: any }>('groupCalendarEvent', { groupId, eventId });
            if (props.instance?.calendarEntryId === eventId) {
                calendarEvent.value = groupStore.applyGroupEvent(args.json);
            }
        } catch (error) {
            console.error('Failed to load calendar event:', error);
            calendarEventFailed.value = true;
        }
    };

    const openCalendarPopover = () => {
        clearTimeout(calendarPopoverCloseTimer);
        calendarPopoverOpen.value = true;
        fetchCalendarEvent();
    };

    const scheduleCloseCalendarPopover = () => {
        clearTimeout(calendarPopoverCloseTimer);
        calendarPopoverCloseTimer = setTimeout(() => {
            calendarPopoverOpen.value = false;
        }, 100);
    };

    watch(
        () => props.instance?.calendarEntryId,
        () => {
            calendarEvent.value = null;
            calendarEventFailed.value = false;
        }
    );

    watch(() => resolvedLastJoinLocation.value, parseLastJoin, { immediate: true });
    watch(() => props.currentlocation, parseLastJoin);
    watch([resolvedInstanceLocation, () => props.instance, () => props.friendcount], parseInstanceInfo, {
        immediate: true
    });
</script>
