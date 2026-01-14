<script setup>
    import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui';
    import { computed, ref, toRefs, watch } from 'vue';

    const props = defineProps({
        modelValue: String,
        defaultValue: String,
        items: {
            type: Array,
            required: true,
            validator: (value) =>
                Array.isArray(value) &&
                value.every(
                    (item) =>
                        item &&
                        (typeof item.value === 'string' || typeof item.value === 'number') &&
                        typeof item.label === 'string'
                )
        },
        ariaLabel: { type: String, default: '' },

        variant: { type: String, default: 'fit' },
        unmountOnHide: { type: Boolean, default: false }
    });

    const emit = defineEmits(['update:modelValue']);
    const { modelValue, defaultValue, items, ariaLabel, variant, unmountOnHide } = toRefs(props);

    const resolvedDefault = computed(() => {
        return defaultValue.value ?? items.value?.[0]?.value;
    });

    const isValueValid = (value) => items.value?.some((item) => item?.value === value);

    const innerValue = ref(isValueValid(modelValue.value) ? modelValue.value : resolvedDefault.value);

    watch(modelValue, (v) => {
        if (isValueValid(v)) {
            innerValue.value = v;
        }
    });

    watch([items, defaultValue], () => {
        if (!isValueValid(innerValue.value)) {
            innerValue.value = resolvedDefault.value;
            return;
        }
        if (!isValueValid(modelValue.value)) {
            innerValue.value = resolvedDefault.value;
        }
    });

    function onValueChange(v) {
        innerValue.value = v;
        emit('update:modelValue', v);
    }

    const triggerClass = computed(() => {
        return [
            'relative inline-flex h-10 items-center justify-center px-3 text-sm font-medium',
            'text-muted-foreground transition-colors hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background',
            'disabled:pointer-events-none disabled:opacity-50',
            'data-[state=active]:text-primary',
            variant.value === 'equal' ? 'flex-1' : '',
            variant.value === 'pill' ? 'rounded-full' : ''
        ].join(' ');
    });

    const listClass = computed(() => {
        return [
            'relative flex w-full items-center gap-1 border-b border-border',
            variant.value === 'pill' ? 'rounded-full bg-muted p-1' : ''
        ].join(' ');
    });
</script>

<template>
    <TabsRoot
        :model-value="innerValue"
        :default-value="resolvedDefault"
        class="w-full"
        :unmount-on-hide="unmountOnHide"
        @update:modelValue="onValueChange">
        <TabsList :class="listClass" :aria-label="ariaLabel || undefined">
            <TabsIndicator
                class="pointer-events-none absolute left-0 bottom-0 z-20 h-0.5 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) transition-[width,translate] duration-200 ease-out">
                <div class="h-full w-full rounded-full bg-primary" />
            </TabsIndicator>

            <TabsTrigger
                v-for="it in items"
                :key="it.value"
                :value="it.value"
                :disabled="it.disabled"
                :class="triggerClass">
                <slot :name="`label-${it.value}`">{{ it.label }}</slot>
            </TabsTrigger>
        </TabsList>

        <TabsContent
            v-for="it in items"
            :key="it.value"
            :value="it.value"
            class="pt-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background">
            <slot :name="it.value" />
        </TabsContent>
    </TabsRoot>
</template>
