<template>
    <div>
        <span v-if="!text" style="color: transparent">-</span>
        <span v-show="text">
            <span
                :class="{ 'x-link': link && location !== 'private' && location !== 'offline' }"
                @click="handleShowWorldDialog">
                <i v-if="isTraveling" class="el-icon el-icon-loading" style="display: inline-block"></i>
                <span>{{ text }}</span>
            </span>
            <span v-if="groupName" :class="{ 'x-link': link }" @click="handleShowGroupDialog">({{ groupName }})</span>
            <span v-if="region" class="flags" :class="region" style="display: inline-block; margin-left: 5px"></span>
            <i v-if="strict" class="el-icon el-icon-lock" style="display: inline-block; margin-left: 5px"></i>
        </span>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { ref, watch } from 'vue';
    import { getGroupName, getWorldName, parseLocation } from '../shared/utils';
    import { useGroupStore, useInstanceStore, useSearchStore, useWorldStore } from '../stores';

    const { cachedWorlds } = storeToRefs(useWorldStore());
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { verifyShortName } = useSearchStore();

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
        isOpenPreviousInstanceInfoDialog: Boolean
    });

    const text = ref('');
    const region = ref('');
    const strict = ref(false);
    const isTraveling = ref(false);
    const groupName = ref('');

    watch(
        () => props.location,
        () => {
            parse();
        }
    );

    parse();

    function parse() {
        isTraveling.value = false;
        groupName.value = '';
        let instanceId = props.location;
        if (typeof props.traveling !== 'undefined' && props.location === 'traveling') {
            instanceId = props.traveling;
            isTraveling.value = true;
        }
        const L = parseLocation(instanceId);
        if (L.isOffline) {
            text.value = 'Offline';
        } else if (L.isPrivate) {
            text.value = 'Private';
        } else if (L.isTraveling) {
            text.value = 'Traveling';
        } else if (typeof props.hint === 'string' && props.hint !== '') {
            if (L.instanceId) {
                text.value = `${props.hint} #${L.instanceName} ${L.accessTypeName}`;
            } else {
                text.value = props.hint;
            }
        } else if (L.worldId) {
            const ref = cachedWorlds.value.get(L.worldId);
            if (typeof ref === 'undefined') {
                getWorldName(L.worldId).then((worldName) => {
                    if (L.tag === instanceId) {
                        if (L.instanceId) {
                            text.value = `${worldName} #${L.instanceName} ${L.accessTypeName}`;
                        } else {
                            text.value = worldName;
                        }
                    }
                });
            } else if (L.instanceId) {
                text.value = `${ref.name} #${L.instanceName} ${L.accessTypeName}`;
            } else {
                text.value = ref.name;
            }
        }
        if (props.grouphint) {
            groupName.value = props.grouphint;
        } else if (L.groupId) {
            groupName.value = L.groupId;
            getGroupName(instanceId).then((name) => {
                if (L.tag === instanceId) {
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

    function handleShowWorldDialog() {
        if (props.link) {
            let instanceId = props.location;
            if (props.traveling && props.location === 'traveling') {
                instanceId = props.traveling;
            }
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
        let location = props.location;
        if (isTraveling.value) {
            location = props.traveling;
        }
        if (!location || !props.link) {
            return;
        }
        const L = parseLocation(location);
        if (!L.groupId) {
            return;
        }
        showGroupDialog(L.groupId);
    }
</script>
