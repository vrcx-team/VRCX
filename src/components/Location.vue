<template>
    <div class="cursor-pointer">
        <div v-if="!text" class="transparent">-</div>
        <div v-show="text" class="flex items-center">
            <div v-if="region" :class="['flags', 'mr-1.5', 'shrink-0', region]"></div>
            <TooltipWrapper :content="tooltipContent" :disabled="tooltipDisabled" :delay-duration="300" side="top">
                <div
                    :class="locationClasses"
                    class="inline-flex min-w-0 flex-nowrap items-center overflow-hidden"
                    @click="handleShowWorldDialog">
                    <Spinner v-if="isTraveling" class="mr-1 shrink-0" />
                    <span class="min-w-0 truncate">{{ text }}</span>
                    <span v-if="showInstanceIdInLocation && instanceName" class="ml-1 whitespace-nowrap">{{
                        ` · #${instanceName}`
                    }}</span>
                    <span
                        v-if="groupName"
                        class="ml-0.5 whitespace-nowrap cursor-pointer"
                        @click.stop="handleShowGroupDialog">
                        ({{ groupName }})
                    </span>
                </div>
            </TooltipWrapper>

            <TooltipWrapper v-if="isClosed" :content="closedTooltip" :disabled="disableTooltip">
                <AlertTriangle class="inline-block ml-2 text-muted-foreground shrink-0" />
            </TooltipWrapper>
            <Lock v-if="strict" class="inline-block ml-2 text-muted-foreground shrink-0" />
        </div>
    </div>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { AlertTriangle, Lock } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAppearanceSettingsStore,
        useGroupStore,
        useInstanceStore,
        useSearchStore,
        useWorldStore
    } from '../stores';
    import { getGroupName, getWorldName, parseLocation } from '../shared/utils';
    import { Spinner } from './ui/spinner';
    import { accessTypeLocaleKeyMap } from '../shared/constants';

    const { t } = useI18n();

    const { cachedWorlds, showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { verifyShortName } = useSearchStore();
    const { cachedInstances } = useInstanceStore();
    const { lastInstanceApplied } = storeToRefs(useInstanceStore());
    const { showInstanceIdInLocation } = storeToRefs(useAppearanceSettingsStore());

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
        }
    });

    const text = ref('');
    const region = ref('');
    const strict = ref(false);
    const isTraveling = ref(false);
    const groupName = ref('');
    const isClosed = ref(false);
    const instanceName = ref('');

    const isLocationLink = computed(() => props.link && props.location !== 'private' && props.location !== 'offline');
    const locationClasses = computed(() => [
        'x-location',
        {
            'cursor-pointer': isLocationLink.value
        }
    ]);
    const tooltipContent = computed(() => `${t('dialog.new_instance.instance_id')}: #${instanceName.value}`);
    const tooltipDisabled = computed(
        () => props.disableTooltip || !instanceName.value || showInstanceIdInLocation.value
    );
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

    function currentInstanceId() {
        if (typeof props.traveling !== 'undefined' && props.location === 'traveling') {
            return props.traveling;
        }
        return props.location;
    }

    function resetState() {
        text.value = '';
        region.value = '';
        strict.value = false;
        isTraveling.value = false;
        groupName.value = '';
        isClosed.value = false;
        instanceName.value = '';
    }

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
        setText(L);
        instanceName.value = L.instanceName;
        if (!L.isRealInstance) {
            return;
        }

        applyInstanceRef(L);
        updateGroupName(L, instanceId);
        updateRegion(L);
        strict.value = L.strict;
    }

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

    function updateRegion(L) {
        region.value = '';
        if (!L.isOffline && !L.isPrivate && !L.isTraveling) {
            region.value = L.region;
            if (!L.region && L.instanceId) {
                region.value = 'us';
            }
        }
    }

    function setText(L) {
        const accessTypeLabel = translateAccessType(L.accessTypeName);

        if (L.isOffline) {
            text.value = t('location.offline');
        } else if (L.isPrivate) {
            text.value = t('location.private');
        } else if (L.isTraveling) {
            text.value = t('location.traveling');
        } else if (typeof props.hint === 'string' && props.hint !== '') {
            if (L.instanceId) {
                text.value = `${props.hint} · ${accessTypeLabel}`;
            } else {
                text.value = props.hint;
            }
        } else if (L.worldId) {
            if (L.instanceId) {
                text.value = `${L.worldId} · ${accessTypeLabel}`;
            } else {
                text.value = L.worldId;
            }
            const ref = cachedWorlds.get(L.worldId);
            if (typeof ref === 'undefined') {
                getWorldName(L.worldId).then((name) => {
                    if (!isDisposed && name && currentInstanceId() === L.tag) {
                        if (L.instanceId) {
                            text.value = `${name} · ${translateAccessType(L.accessTypeName)}`;
                        } else {
                            text.value = name;
                        }
                    }
                });
            } else if (L.instanceId) {
                text.value = `${ref.name} · ${accessTypeLabel}`;
            } else {
                text.value = ref.name;
            }
        }
    }

    function translateAccessType(accessTypeNameRaw) {
        const key = accessTypeLocaleKeyMap[accessTypeNameRaw];
        if (!key) {
            return accessTypeNameRaw;
        }
        if (accessTypeNameRaw === 'groupPublic' || accessTypeNameRaw === 'groupPlus') {
            const groupKey = accessTypeLocaleKeyMap['group'];
            return t(groupKey) + ' ' + t(key);
        }
        return t(key);
    }

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
</script>

<style scoped>
    .transparent {
        color: transparent;
    }
</style>
