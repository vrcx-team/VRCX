<template>
    <component :is="enableContextMenu ? ContextMenu : Passthrough">
        <component :is="enableContextMenu ? ContextMenuTrigger : Passthrough" as-child>
            <div class="cursor-pointer">
                <div v-if="!text" class="text-transparent">-</div>
                <div v-show="text" class="flex items-center">
                    <template v-if="isAgeRestricted">
                        <TooltipWrapper :content="t('dialog.user.info.instance_age_restricted_tooltip')" :delay-duration="300" side="top">
                            <div class="inline-flex items-center gap-1 text-muted-foreground">
                                <Lock class="size-3.5 shrink-0" />
                                <span>{{ t('dialog.user.info.instance_age_restricted') }}</span>
                            </div>
                        </TooltipWrapper>
                    </template>
                    <template v-else>
                        <div v-if="region" :class="['flags', 'mr-1.5', 'shrink-0', region]"></div>
                        <TooltipWrapper :content="tooltipContent" :disabled="tooltipDisabled" :delay-duration="300" side="top">
                            <div
                                :class="locationClasses"
                                class="inline-flex min-w-0 flex-nowrap items-center overflow-hidden truncate"
                                @click="handleShowWorldDialog">
                                <Spinner v-if="isTraveling" class="mr-1 shrink-0" />
                                <span class="min-w-0 flex-1 truncate">
                                    <span>{{ text }}</span>
                                    <span v-if="showInstanceIdInLocation && instanceName" class="ml-1">{{
                                        ` · #${instanceName}`
                                    }}</span>
                                    <span v-if="groupName" class="ml-0.5 cursor-pointer" @click.stop="handleShowGroupDialog">
                                        ({{ groupName }})
                                    </span>
                                </span>
                            </div>
                        </TooltipWrapper>

                        <TooltipWrapper v-if="isClosed" :content="closedTooltip" :disabled="disableTooltip">
                            <AlertTriangle class="inline-block ml-2 text-muted-foreground shrink-0" />
                        </TooltipWrapper>
                        <Lock v-if="strict" class="inline-block ml-2 text-muted-foreground shrink-0" />
                    </template>
                </div>
            </div>
        </component>
        <ContextMenuContent v-if="enableContextMenu && parsedLocation.isRealInstance && parsedLocation.worldId">
            <WorldActionMenuItems
                :can-open-instance-in-game="canOpenInstanceInGame"
                :show-share="true"
                :show-previous-instances="true"
                @view-details="handleShowWorldDialog"
                @share="handleShareLocation"
                @new-instance="handleNewInstance"
                @self-invite="handleNewInstanceSelfInvite"
                @show-previous-instances="handleShowPreviousInstances" />
        </ContextMenuContent>
    </component>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { AlertTriangle, Lock } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuTrigger
    } from './ui/context-menu';

    import {
        getGroupName,
        getLocationText,
        getWorldName,
        copyToClipboard,
        parseLocation,
        resolveRegion,
        translateAccessType
    } from '../shared/utils';
    import { useAppearanceSettingsStore, useInstanceStore, useInviteStore, useSearchStore, useWorldStore } from '../stores';
    import { showGroupDialog } from '../coordinators/groupCoordinator';
    import { showWorldDialog } from '../coordinators/worldCoordinator';
    import { runNewInstanceSelfInviteFlow } from '../coordinators/inviteCoordinator';
    import { Spinner } from './ui/spinner';
    import WorldActionMenuItems from './WorldActionMenuItems.vue';
    import { accessTypeLocaleKeyMap } from '../shared/constants';

    const Passthrough = (_, { slots }) => slots.default?.();

    const { t } = useI18n();

    const { cachedWorlds } = useWorldStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { verifyShortName } = useSearchStore();
    const { cachedInstances } = useInstanceStore();
    const { lastInstanceApplied } = storeToRefs(useInstanceStore());
    const { canOpenInstanceInGame } = useInviteStore();
    const { showInstanceIdInLocation, isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());

    const props = defineProps({
        location: String,
        traveling: String,
        hint: {
            type: String,
            default: ''
        },
        grouphint: {
            type: String,
            default: ''
        },
        link: {
            type: Boolean,
            default: true
        },
        disableTooltip: {
            type: Boolean,
            default: false
        },
        isOpenPreviousInstanceInfoDialog: {
            type: Boolean,
            default: false
        },
        enableContextMenu: {
            type: Boolean,
            default: false
        }
    });

    const text = ref('');
    const region = ref('');
    const strict = ref(false);
    const ageGate = ref(false);
    const isTraveling = ref(false);
    const parsedLocation = ref({ isRealInstance: false, worldId: '', tag: '', shortName: '' });
    const groupName = ref('');
    const isClosed = ref(false);
    const instanceName = ref('');

    const isAgeRestricted = computed(() => !isAgeGatedInstancesVisible.value && ageGate.value);
    const isLocationLink = computed(() => props.link && props.location !== 'private' && props.location !== 'offline');
    const locationClasses = computed(() => [
        'x-location',
        {
            'cursor-pointer': isLocationLink.value
        }
    ]);
    const tooltipContent = computed(() => `${t('dialog.new_instance.instance_id')}: #${instanceName.value}`);
    const tooltipDisabled = computed(() => props.disableTooltip || !instanceName.value || showInstanceIdInLocation.value);
    const closedTooltip = computed(() => t('dialog.user.info.instance_closed'));

    let isDisposed = false;
    onBeforeUnmount(() => {
        isDisposed = true;
    });

    watch(() => [props.location, props.traveling, props.hint, props.grouphint], parse, { immediate: true });

    watch(
        () => lastInstanceApplied.value,
        (instanceId) => {
            if (instanceId === currentInstanceId()) {
                parse();
            }
        }
    );

    /**
     *
     */
    function currentInstanceId() {
        if (typeof props.traveling !== 'undefined' && props.location === 'traveling') {
            return props.traveling;
        }
        return props.location;
    }

    /**
     *
     */
    function resetState() {
        text.value = '';
        region.value = '';
        strict.value = false;
        ageGate.value = false;
        isTraveling.value = false;
        groupName.value = '';
        isClosed.value = false;
        instanceName.value = '';
    }

    /**
     *
     */
    function parse() {
        if (isDisposed) {
            return;
        }
        resetState();

        let instanceId = props.location;
        if (typeof props.traveling !== 'undefined' && props.location === 'traveling') {
            instanceId = props.traveling;
            isTraveling.value = true;
        }
        const L = parseLocation(instanceId);
        parsedLocation.value = L;
        setText(L);
        instanceName.value = L.instanceName;
        if (!L.isRealInstance) {
            return;
        }

        applyInstanceRef(L);
        updateGroupName(L, instanceId);
        updateRegion(L);
        strict.value = L.strict;
        ageGate.value = L.ageGate;
    }

    /**
     *
     * @param L
     */
    function applyInstanceRef(L) {
        const instanceRef = cachedInstances.get(L.tag);
        if (typeof instanceRef === 'undefined') {
            return;
        }
        if (instanceRef.displayName) {
            setText(L);
            instanceName.value = instanceRef.displayName;
        }
        if (instanceRef.closedAt) {
            isClosed.value = true;
        }
    }

    /**
     *
     * @param L
     * @param instanceId
     */
    function updateGroupName(L, instanceId) {
        if (props.grouphint) {
            groupName.value = props.grouphint;
            return;
        }
        if (!L.groupId) {
            return;
        }
        groupName.value = L.groupId;
        getGroupName(instanceId).then((name) => {
            if (!isDisposed && name && currentInstanceId() === L.tag) {
                groupName.value = name;
            }
        });
    }

    /**
     *
     * @param L
     */
    function updateRegion(L) {
        region.value = resolveRegion(L);
    }

    /**
     *
     * @param accessTypeName
     */
    function getAccessTypeLabel(accessTypeName) {
        return translateAccessType(accessTypeName, t, accessTypeLocaleKeyMap);
    }

    /**
     *
     * @param L
     */
    function setText(L) {
        const accessTypeLabel = getAccessTypeLabel(L.accessTypeName);
        const cachedRef = L.worldId ? cachedWorlds.get(L.worldId) : undefined;
        const worldName = typeof cachedRef !== 'undefined' ? cachedRef.name : undefined;

        text.value = getLocationText(L, {
            hint: props.hint,
            worldName,
            accessTypeLabel,
            t
        });

        if (L.worldId && typeof cachedRef === 'undefined') {
            getWorldName(L.worldId).then((name) => {
                if (!isDisposed && name && currentInstanceId() === L.tag) {
                    text.value = getLocationText(L, {
                        hint: props.hint,
                        worldName: name,
                        accessTypeLabel: getAccessTypeLabel(L.accessTypeName),
                        t
                    });
                }
            });
        }
    }

    /**
     *
     */
    function handleShowWorldDialog() {
        if (props.link) {
            let instanceId = currentInstanceId();
            if (!instanceId && props.hint.length === 8) {
                verifyShortName('', props.hint);
                return;
            }
            if (props.isOpenPreviousInstanceInfoDialog) {
                showPreviousInstancesInfoDialog(instanceId);
            } else {
                showWorldDialog(instanceId);
            }
        }
    }

    /**
     *
     */
    function handleShowGroupDialog() {
        let location = currentInstanceId();
        if (!location) {
            return;
        }
        const L = parseLocation(location);
        if (!L.groupId) {
            return;
        }
        showGroupDialog(L.groupId);
    }

    /**
     *
     */
    function handleShareLocation() {
        const L = parsedLocation.value;
        if (!L.worldId) return;
        copyToClipboard(
            `https://vrchat.com/home/world/${L.worldId}`,
            t('message.world.url_copied')
        );
    }

    /**
     *
     */
    function handleNewInstance() {
        const L = parsedLocation.value;
        if (!L.worldId) return;
        showWorldDialog(L.tag, L.shortName);
    }

    /**
     *
     */
    function handleNewInstanceSelfInvite() {
        const L = parsedLocation.value;
        if (!L.worldId) return;
        runNewInstanceSelfInviteFlow(L.worldId);
    }

    /**
     *
     */
    function handleShowPreviousInstances() {
        const instanceId = currentInstanceId();
        if (!instanceId) return;
        showPreviousInstancesInfoDialog(instanceId);
    }
</script>
