<template>
    <div class="flex items-center gap-2">
        <span v-if="region" :class="cn('flags inline-block shrink-0', region)"></span>
        <span @click="showLaunchDialog" class="cursor-pointer">
            <Unlock v-if="isUnlocked" :class="['inline-block', 'mr-1.25']" />
            <span> {{ accessTypeName }} #{{ instanceName }}</span>
        </span>
        <span v-if="groupName" @click="openLocationGroupDialog" class="cursor-pointer">({{ groupName }})</span>
        <div v-if="closedAt">
            <TooltipWrapper side="top">
                <template #content>
                    {{ t('dialog.user.info.instance_closed') }}:
                    {{ formatDateFilter(closedAt, 'long') }}
                </template>
                <AlertTriangle class="text-orange-500 my-auto" />
            </TooltipWrapper>
        </div>
        <Lock v-if="strict" class="text-muted-foreground" />
    </div>
</template>

<script setup>
    import { AlertTriangle, Lock, Unlock } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useInstanceStore, useLaunchStore } from '../stores';
    import { showGroupDialog } from '../coordinators/groupCoordinator';
    import { formatDateFilter, getGroupName, parseLocation } from '../shared/utils';
    import { accessTypeLocaleKeyMap } from '../shared/constants';
    import { cn } from '@/lib/utils';

    const { t } = useI18n();
    const { cachedInstances } = useInstanceStore();
    const { lastInstanceApplied } = storeToRefs(useInstanceStore());

    const launchStore = useLaunchStore();

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
    const closedAt = ref('');

    /**
     *
     */
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
        closedAt.value = '';

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
                closedAt.value = instanceRef.closedAt;
            }
        }

        if (props.grouphint) {
            groupName.value = props.grouphint;
        } else if (locObj.groupId) {
            groupName.value = locObj.groupId;
            getGroupName(locObj.groupId).then((name) => {
                if (name && props.locationobject.tag === locObj.tag) {
                    groupName.value = name;
                }
            });
        } else {
            groupName.value = '';
        }
    }

    /**
     *
     * @param accessTypeNameRaw
     */
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

    /**
     *
     */
    function showLaunchDialog() {
        launchStore.showLaunchDialog(location.value, shortName.value);
    }

    /**
     *
     */
    function openLocationGroupDialog() {
        if (!location.value) return;
        const L = parseLocation(location.value);
        if (!L.groupId) return;
        showGroupDialog(L.groupId);
    }
</script>
