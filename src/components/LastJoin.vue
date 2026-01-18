<template>
    <span v-if="lastJoin" :class="['inline-block', 'ml-5']">
        <TooltipWrapper side="top" class="ml-5">
            <template #content>
                <span>{{ t('dialog.user.info.last_join') }} <Timer :epoch="lastJoin" /></span>
            </template>
            <MapPin class="h-4 w-4 text-muted-foreground" />
        </TooltipWrapper>
    </span>
</template>

<script setup>
    // TODO(icon): time aspect lost (map pin with time)
    import { ref, watch } from 'vue';
    import { MapPin } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useInstanceStore } from '../stores';

    const { instanceJoinHistory } = storeToRefs(useInstanceStore());
    const { t } = useI18n();

    const props = defineProps({
        location: String,
        currentlocation: String
    });

    const lastJoin = ref(null);

    function parse() {
        lastJoin.value = instanceJoinHistory.value.get(props.location);
    }

    watch(() => props.location, parse, { immediate: true });
    watch(() => props.currentlocation, parse);
</script>

<style scoped>
    .ml-5 {
        margin-left: 5px;
    }
    .inline-block {
        display: inline-block;
    }
</style>
