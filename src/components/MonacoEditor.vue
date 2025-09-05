<template>
    <vue-monaco-editor :value="props.value" :options="props.options" :language="props.language"
        :theme="isDarkMode ? 'vs-dark' : 'vs'" />
</template>
<script setup>
import { useAppearanceSettingsStore } from '../stores';
import { storeToRefs } from 'pinia';

const { isDarkMode } = storeToRefs(useAppearanceSettingsStore())

const props = defineProps({
    value: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'json'
    },
    options: {
        type: Object,
        default: () => ({
            automaticLayout: true,
            formatOnType: true,
            formatOnPaste: true,
            readOnly: true
        })
    }
})

</script>