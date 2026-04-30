<template>
    <Empty>
        <EmptyHeader>
            <EmptyMedia variant="icon">
                <SearchAlert v-if="props.type === 'nomatch' || props.error" class="text-lg text-red-500" />
                <Inbox v-else class="text-lg" />
            </EmptyMedia>
            <EmptyDescription :class="(props.type === 'nomatch' || props.error) ? 'text-red-500' : ''">
                {{ props.error || emptyText }}
            </EmptyDescription>
        </EmptyHeader>
    </Empty>
</template>

<script setup>
    import { Inbox, SearchAlert } from 'lucide-vue-next';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '../empty';

    const props = defineProps({
        type: {
            type: String,
            default: 'nodata'
        },
        error: {
            type: String,
            default: null
        }
    });

    const { t } = useI18n();

    const emptyText = computed(() => {
        return props.type === 'nomatch' ? t('common.no_matching_records') : t('common.no_data');
    });
</script>
