<template>
    <span>
        <span @click="showLaunchDialog" class="x-link">
            <el-icon v-if="isUnlocked" :class="['inline-block', 'mr-5']"><Unlock /></el-icon>
            <span>#{{ instanceName }} {{ accessTypeName }}</span>
        </span>
        <span v-if="groupName" @click="showGroupDialog" class="x-link">({{ groupName }})</span>
        <span v-if="region" :class="['flags', 'inline-block', 'ml-5', region]"></span>
        <el-tooltip v-if="isClosed" :content="t('dialog.user.info.instance_closed')">
            <el-icon :class="['inline-block', 'ml-5']" style="color: lightcoral"><WarnTriangleFilled /></el-icon>
        </el-tooltip>
        <el-icon v-if="strict" style="display: inline-block; margin-left: 5px"><Lock /></el-icon>
    </span>
</template>

<script setup>
    import { Lock, Unlock, WarnTriangleFilled } from '@element-plus/icons-vue';
    import { ref, watch } from 'vue';
    import { getGroupName, parseLocation } from '../shared/utils';
    import { useGroupStore, useLaunchStore, useInstanceStore } from '../stores';
    import { useI18n } from 'vue-i18n';
    const { t } = useI18n();
    const { cachedInstances } = useInstanceStore();

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
        accessTypeName.value = locObj.accessTypeName;
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

    watch(() => props.locationobject, parse, { immediate: true });

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

    .ml-5 {
        margin-left: 5px;
    }

    .mr-5 {
        margin-right: 5px;
    }
</style>
