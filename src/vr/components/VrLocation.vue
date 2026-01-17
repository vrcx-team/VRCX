<template>
    <span>
        <span>{{ text }}</span>
        <span v-if="groupName">({{ groupName }})</span>
        <span
            v-if="region"
            class="flags"
            :class="region"
            style="display: inline-block; margin-bottom: 2px; margin-left: 5px">
        </span>

        <Lock v-if="strict" class="h-4 w-4" style="display: inline-block; margin-left: 5px" />
    </span>
</template>

<script setup>
    import { onMounted, ref, watch } from 'vue';
    import { Lock } from 'lucide-vue-next';

    import { parseLocation } from '../../shared/utils/location';

    const props = defineProps({
        location: String,
        hint: {
            type: String,
            default: ''
        },
        grouphint: {
            type: String,
            default: ''
        },
        instancedisplayname: {
            type: String,
            default: ''
        }
    });

    const text = ref('');
    const region = ref('');
    const strict = ref(false);
    const groupName = ref('');

    function parse() {
        text.value = props.location;
        const L = parseLocation(props.location);

        let instanceName = L.instanceName;
        if (props.instancedisplayname) {
            instanceName = props.instancedisplayname;
        }

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
                text.value = ` #${instanceName} ${L.accessTypeName}`;
            } else {
                text.value = props.location;
            }
        }

        region.value = '';
        if (props.location !== '' && L.instanceId && !L.isOffline && !L.isPrivate) {
            region.value = L.region;
            if (!L.region) {
                region.value = 'us';
            }
        }

        strict.value = L.strict;
        groupName.value = props.grouphint;
    }

    watch(() => props.location, parse);

    onMounted(parse);
</script>
