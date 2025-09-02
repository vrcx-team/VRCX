<template>
    <span>
        <span @click="showLaunchDialog" class="x-link">
            <el-icon v-if="isUnlocked" style="display: inline-block; margin-right: 5px"><Unlock /></el-icon>
            <span>#{{ instanceName }} {{ accessTypeName }}</span>
        </span>
        <span v-if="groupName" @click="showGroupDialog" class="x-link">({{ groupName }})</span>
        <span class="flags" :class="region" style="display: inline-block; margin-left: 5px"></span>
        <el-icon v-if="strict" style="display: inline-block; margin-left: 5px"><Lock /></el-icon>
    </span>
</template>

<script setup>
    import { Lock, Unlock } from '@element-plus/icons-vue';
    import { ref, watch } from 'vue';
    import { getGroupName, parseLocation } from '../shared/utils';
    import { useGroupStore, useLaunchStore } from '../stores';

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

    function parse() {
        const locObj = props.locationobject;
        location.value = locObj.tag;
        instanceName.value = locObj.instanceName;
        accessTypeName.value = locObj.accessTypeName;
        strict.value = locObj.strict;
        shortName.value = locObj.shortName;

        isUnlocked.value =
            (props.worlddialogshortname && locObj.shortName && props.worlddialogshortname === locObj.shortName) ||
            props.currentuserid === locObj.userId;

        region.value = locObj.region || 'us';

        if (props.grouphint) {
            groupName.value = props.grouphint;
        } else if (locObj.groupId) {
            groupName.value = locObj.groupId;
            getGroupName(locObj.groupId)
                .then((name) => {
                    groupName.value = name;
                })
                .catch((error) => {
                    console.error('Failed to get group name:', error);
                    groupName.value = '';
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
