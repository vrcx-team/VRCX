<script setup>
    import { ErrorMessage } from 'vee-validate';
    import { cn } from '@/lib/utils';
    import { toValue } from 'vue';

    import { useFormField } from './useFormField';

    const props = defineProps({
        class: { type: null, required: false }
    });

    const { name, formMessageId } = useFormField();
</script>

<template>
    <ErrorMessage
        :id="formMessageId"
        data-slot="form-message"
        as="p"
        :name="toValue(name)"
        :class="cn('text-destructive text-sm', props.class)" />
</template>
