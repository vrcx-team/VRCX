<template>
    <TooltipWrapper v-if="categoryId || vibeIdList" side="top">
        <template #content>
            <div class="flex flex-col gap-1">
                <span v-if="categoryId">
                    {{ t('dialog.user.info.instance_category') }}
                    {{ instanceCategory?.name ?? categoryId }}
                </span>
                <span v-if="vibeIdList"> {{ t('dialog.user.info.instance_vibes') }} {{ instanceVibeTitles }} </span>
            </div>
        </template>
        <span class="flex shrink-0 items-center text-muted-foreground">
            <i :class="['text-base leading-none', instanceCategory?.icon ?? 'ri-apps-2-line']" />
        </span>
    </TooltipWrapper>
</template>

<script setup>
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { instanceCategoryIcons } from '../shared/constants';
    import { useInstanceStore } from '../stores';

    const props = defineProps({
        location: {
            type: String,
            default: ''
        }
    });

    const { t } = useI18n();

    const instanceStore = useInstanceStore();
    const { cachedInstances } = instanceStore;
    const { instanceCategories, instanceVibes, lastInstanceApplied } = storeToRefs(instanceStore);

    const categoryId = computed(() => {
        lastInstanceApplied.value;
        return cachedInstances.get(props.location)?.categoryId ?? '';
    });

    const vibeIdList = computed(() => {
        lastInstanceApplied.value;
        return (cachedInstances.get(props.location)?.vibeIds ?? []).join(',');
    });

    const instanceCategory = computed(() => {
        if (!categoryId.value) return null;
        const category = instanceCategories.value.find((category) => category.id === categoryId.value);
        if (!category) return null;
        return { name: category.name, icon: instanceCategoryIcons[category.iconUrl] };
    });

    const instanceVibeTitles = computed(() => {
        if (!vibeIdList.value) return '';
        const vibeById = new Map(instanceVibes.value.map((vibe) => [vibe.id, vibe.title]));
        return vibeIdList.value
            .split(',')
            .map((id) => vibeById.get(id) ?? id)
            .join(', ');
    });
</script>
