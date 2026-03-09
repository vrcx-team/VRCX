<script setup>
    import { Download, RefreshCw } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { storeToRefs } from 'pinia';

    import VueJsonPretty from 'vue-json-pretty';

    import { downloadAndSaveJson } from '../../shared/utils';
    import { useAppearanceSettingsStore } from '../../stores';

    defineProps({
        treeData: {
            type: Object,
            default: () => ({})
        },
        treeDataKey: {
            type: [String, Number, null],
            default: null
        },
        dialogId: {
            type: String,
            required: true
        },
        dialogRef: {
            type: Object,
            required: true
        },
        fileAnalysis: {
            type: Object,
            default: null
        }
    });

    const emit = defineEmits(['refresh']);
    const { isDarkMode } = storeToRefs(useAppearanceSettingsStore());
</script>

<template>
    <Button class="rounded-full mr-2" size="icon-sm" variant="ghost" @click="emit('refresh')">
        <RefreshCw />
    </Button>
    <Button class="rounded-full" size="icon-sm" variant="ghost" @click="downloadAndSaveJson(dialogId, dialogRef)">
        <Download />
    </Button>
    <vue-json-pretty :key="treeDataKey" :data="treeData" :deep="2" :theme="isDarkMode ? 'dark' : 'light'" show-icon />
    <template v-if="fileAnalysis && Object.keys(fileAnalysis).length">
        <br />
        <vue-json-pretty :data="fileAnalysis" :deep="2" :theme="isDarkMode ? 'dark' : 'light'" show-icon />
    </template>
</template>
