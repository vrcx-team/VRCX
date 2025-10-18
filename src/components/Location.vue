<template>
    <div>
        <span v-if="!text" class="transparent">-</span>
        <span v-show="text">
            <span
                :class="{ 'x-link': link && location !== 'private' && location !== 'offline' }"
                @click="handleShowWorldDialog">
                <el-icon :class="['is-loading', 'inline-block']" style="margin-right: 3px" v-if="isTraveling"
                    ><Loading
                /></el-icon>
                <span>{{ text }}</span>
            </span>
            <span v-if="groupName" :class="{ 'x-link': link }" @click="handleShowGroupDialog">({{ groupName }})</span>
            <span v-if="region" :class="['flags', 'inline-block', 'ml-5', region]"></span>
            <el-tooltip v-if="isClosed" :content="t('dialog.user.info.instance_closed')">
                <el-icon :class="['inline-block', 'ml-5']" style="color: lightcoral"><WarnTriangleFilled /></el-icon>
            </el-tooltip>
            <el-icon v-if="strict" :class="['inline-block', 'ml-5']"><Lock /></el-icon>
        </span>
    </div>
</template>

<script setup>
    import { Loading, Lock, WarnTriangleFilled } from '@element-plus/icons-vue';
    import { ref, watch, watchEffect } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useGroupStore, useInstanceStore, useSearchStore, useWorldStore } from '../stores';
    import { getGroupName, getWorldName, parseLocation } from '../shared/utils';

    const { t } = useI18n();

    const { cachedWorlds, showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { showPreviousInstancesInfoDialog } = useInstanceStore();
    const { verifyShortName } = useSearchStore();
    const { cachedInstances } = useInstanceStore();
    const { lastInstanceApplied } = storeToRefs(useInstanceStore());

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
    const isClosed = ref(false);

    watchEffect(() => {
        parse();
    });

    watch(
        () => lastInstanceApplied.value,
        (instanceId) => {
            if (instanceId === currentInstanceId()) {
                parse();
            }
        },
        { immediate: true }
    );

    function currentInstanceId() {
        if (typeof props.traveling !== 'undefined' && props.location === 'traveling') {
            return props.traveling;
        }
        return props.location;
    }

    function parse() {
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
        setText(L, L.instanceName);
        if (!L.isRealInstance) {
            return;
        }

        const instanceRef = cachedInstances.get(L.tag);
        if (typeof instanceRef !== 'undefined') {
            if (instanceRef.displayName) {
                setText(L, instanceRef.displayName);
            }
            if (instanceRef.closedAt) {
                isClosed.value = true;
            }
        }

        if (props.grouphint) {
            groupName.value = props.grouphint;
        } else if (L.groupId) {
            groupName.value = L.groupId;
            getGroupName(instanceId)
                .then((name) => {
                    if (name && currentInstanceId() === L.tag) {
                        groupName.value = name;
                    }
                })
                .catch((e) => {
                    console.error(e);
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

    function setText(L, instanceName) {
        if (L.isOffline) {
            text.value = 'Offline';
        } else if (L.isPrivate) {
            text.value = 'Private';
        } else if (L.isTraveling) {
            text.value = 'Traveling';
        } else if (typeof props.hint === 'string' && props.hint !== '') {
            if (L.instanceId) {
                text.value = `${props.hint} #${instanceName} ${L.accessTypeName}`;
            } else {
                text.value = props.hint;
            }
        } else if (L.worldId) {
            if (L.instanceId) {
                text.value = `${L.worldId} #${instanceName} ${L.accessTypeName}`;
            } else {
                text.value = L.worldId;
            }
            const ref = cachedWorlds.get(L.worldId);
            if (typeof ref === 'undefined') {
                getWorldName(L.worldId)
                    .then((name) => {
                        if (name && currentInstanceId() === L.tag) {
                            if (L.instanceId) {
                                text.value = `${name} #${instanceName} ${L.accessTypeName}`;
                            } else {
                                text.value = name;
                            }
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                    });
            } else if (L.instanceId) {
                text.value = `${ref.name} #${instanceName} ${L.accessTypeName}`;
            } else {
                text.value = ref.name;
            }
        }
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

<style scoped>
    .inline-block {
        display: inline-block;
    }

    .ml-5 {
        margin-left: 5px;
    }

    .transparent {
        color: transparent;
    }
</style>
