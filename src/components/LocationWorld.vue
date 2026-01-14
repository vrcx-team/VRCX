<template>
    <span class="x-location-world">
        <span v-if="region" :class="['flags', 'inline-block', 'mr-1.25', region]"></span>
        <span @click="showLaunchDialog" class="x-link">
            <Unlock v-if="isUnlocked" :class="['inline-block', 'mr-1.25']" />
            <span> {{ accessTypeName }} #{{ instanceName }}</span>
        </span>
        <span v-if="groupName" @click="showGroupDialog" class="x-link">({{ groupName }})</span>
        <TooltipWrapper v-if="isClosed" :content="t('dialog.user.info.instance_closed')">
            <AlertTriangle :class="['inline-block', 'ml-5']" style="color: lightcoral" />
        </TooltipWrapper>
        <Lock v-if="strict" style="display: inline-block; margin-left: 5px" />
    </span>
</template>

<script setup>
    import { Lock, Unlock, AlertTriangle } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGroupStore, useInstanceStore, useLaunchStore } from '../stores';
    import { getGroupName, parseLocation } from '../shared/utils';
    import { accessTypeLocaleKeyMap } from '../shared/constants';

    const { t } = useI18n();
    const { cachedInstances } = useInstanceStore();
    const { lastInstanceApplied } = storeToRefs(useInstanceStore());

    const launchStore = useLaunchStore();
    const groupStore = useGroupStore();

    const props = defineProps({
        locationobject: Object,
        currentuserid: String,
        worlddialogshortname: String,
        grouphint: {
            type: String,
            default: ''
        }
    });

    const location = ref('');
    const instanceName = ref('');
    const accessTypeName = ref('');
    const region = ref('us');
    const shortName = ref('');
    const isUnlocked = ref(false);
    const strict = ref(false);
    const groupName = ref('');
    const isClosed = ref(false);

    function parse() {
        const locObj = props.locationobject;
        location.value = locObj.tag;
        accessTypeName.value = translateAccessType(locObj.accessTypeName);
        strict.value = locObj.strict;
        shortName.value = locObj.shortName;

        isUnlocked.value =
            (props.worlddialogshortname && locObj.shortName && props.worlddialogshortname === locObj.shortName) ||
            props.currentuserid === locObj.userId;

        region.value = locObj.region || 'us';

        instanceName.value = locObj.instanceName;

        const L = parseLocation(locObj.tag);
        if (!L.isRealInstance) {
            return;
        }

        const instanceRef = cachedInstances.get(L.tag);
        if (typeof instanceRef !== 'undefined') {
            if (instanceRef.displayName) {
                instanceName.value = instanceRef.displayName;
            }
            if (instanceRef.closedAt) {
                isClosed.value = true;
            }
        }

        if (props.grouphint) {
            groupName.value = props.grouphint;
        } else if (locObj.groupId) {
            groupName.value = locObj.groupId;
            getGroupName(locObj.groupId)
                .then((name) => {
                    if (name && props.locationobject.tag === locObj.tag) {
                        groupName.value = name;
                    }
                })
                .catch((e) => {
                    console.error(e);
                });
        } else {
            groupName.value = '';
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

    watch(() => props.locationobject, parse, { immediate: true });

    watch(
        () => lastInstanceApplied.value,
        (instanceId) => {
            if (instanceId === location.value) {
                parse();
            }
        },
        { immediate: true }
    );

    function showLaunchDialog() {
        launchStore.showLaunchDialog(location.value, shortName.value);
    }

    function showGroupDialog() {
        if (!location.value) return;
        const L = parseLocation(location.value);
        if (!L.groupId) return;
        groupStore.showGroupDialog(L.groupId);
    }
</script>

<style scoped>
    .inline-block {
        display: inline-block;
    }
</style>
