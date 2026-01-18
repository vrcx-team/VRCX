<template>
    <div class="cursor-pointer">
        <div v-if="!text" class="transparent">-</div>
        <div v-show="text" class="flex items-center">
            <div v-if="region" :class="['flags', 'mr-1.5', region]"></div>
            <template v-if="disableTooltip">
                <div
                    :class="['x-location', { 'x-link': link && location !== 'private' && location !== 'offline' }]"
                    class="inline-flex min-w-0 flex-nowrap items-center overflow-hidden"
                    @click="handleShowWorldDialog">
                    <Spinner v-if="isTraveling" class="mr-1" />
                    <span class="min-w-0 truncate">{{ text }}</span>
                    <span v-if="showInstanceIdInLocation && instanceName" class="ml-1 whitespace-nowrap">{{
                        ` · #${instanceName}`
                    }}</span>
                    <span v-if="groupName" class="ml-0.5 whitespace-nowrap x-link" @click.stop="handleShowGroupDialog">
                        ({{ groupName }})
                    </span>
                </div>

                <AlertTriangle v-if="isClosed" :class="['inline-block', 'ml-5']" style="color: lightcoral" />
            </template>

            <template v-else>
                <TooltipWrapper
                    :content="`${t('dialog.new_instance.instance_id')}: #${instanceName}`"
                    :disabled="!instanceName || showInstanceIdInLocation"
                    :delay-duration="300"
                    side="top">
                    <div
                        :class="['x-location', { 'x-link': link && location !== 'private' && location !== 'offline' }]"
                        class="inline-flex min-w-0 flex-nowrap items-center overflow-hidden"
                        @click="handleShowWorldDialog">
                        <Spinner v-if="isTraveling" class="mr-1" />
                        <span class="min-w-0 truncate">{{ text }}</span>
                        <span v-if="showInstanceIdInLocation && instanceName" class="ml-1 whitespace-nowrap">{{
                            ` · #${instanceName}`
                        }}</span>
                        <span
                            v-if="groupName"
                            class="ml-0.5 whitespace-nowrap x-link"
                            @click.stop="handleShowGroupDialog">
                            ({{ groupName }})
                        </span>
                    </div>
                </TooltipWrapper>
                <TooltipWrapper v-if="isClosed" :content="t('dialog.user.info.instance_closed')">
                    <AlertTriangle :class="['inline-block', 'ml-5']" style="color: lightcoral" />
                </TooltipWrapper>
            </template>
            <Lock v-if="strict" :class="['inline-block', 'ml-5']" />
        </div>
    </div>
</template>

<script setup>
    import { onBeforeUnmount, ref, watch } from 'vue';
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

    function parse() {
        if (isDisposed) {
            return;
        }
        text.value = '';
        region.value = '';
        strict.value = false;
        isTraveling.value = false;
        groupName.value = '';
        isClosed.value = false;

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

        const instanceRef = cachedInstances.get(L.tag);
        if (typeof instanceRef !== 'undefined') {
            if (instanceRef.displayName) {
                setText(L);
                instanceName.value = instanceRef.displayName;
            }
            if (instanceRef.closedAt) {
                isClosed.value = true;
            }
        }

        if (props.grouphint) {
            groupName.value = props.grouphint;
        } else if (L.groupId) {
            groupName.value = L.groupId;
            getGroupName(instanceId).then((name) => {
                if (!isDisposed && name && currentInstanceId() === L.tag) {
                    groupName.value = name;
                }
            });
        }
        region.value = '';
        if (!L.isOffline && !L.isPrivate && !L.isTraveling) {
            region.value = L.region;
            if (!L.region && L.instanceId) {
                region.value = 'us';
            }
        }
        strict.value = L.strict;
    }

    function setText(L) {
        const accessTypeLabel = translateAccessType(L.accessTypeName);

        if (L.isOffline) {
            text.value = 'Offline';
        } else if (L.isPrivate) {
            text.value = 'Private';
        } else if (L.isTraveling) {
            text.value = 'Traveling';
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
