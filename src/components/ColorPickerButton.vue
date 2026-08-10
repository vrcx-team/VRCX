<script setup>
    import { computed, nextTick, ref } from 'vue';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Button } from '@/components/ui/button';
    import { ColorPicker } from 'vue3-colorpicker';
    import 'vue3-colorpicker/style.css';

    const props = defineProps({
        modelValue: { type: String, required: true },
        disabled: { type: Boolean, default: false },
        label: { type: String, default: null },
        size: { type: String, default: 'sm' },
        align: { type: String, default: 'start' },
        format: { type: String, default: 'hex' },
        disableAlpha: { type: Boolean, default: true },
        isWidget: { type: Boolean, default: true },
        shape: { type: String, default: undefined },
        useType: { type: String, default: undefined },
        pickerType: { type: String, default: undefined },
        buttonClass: { type: [String, Array, Object], default: '' },
        popoverClass: { type: [String, Array, Object], default: '' }
    });

    const emit = defineEmits(['update:modelValue', 'change']);

    const displayLabel = computed(() => props.label ?? props.modelValue);
    const contentBodyRef = ref(null);

    function onInput(color) {
        if (props.disabled) return;
        emit('update:modelValue', color);
        emit('change', color);
    }

    function onOpenAutoFocus(event) {
        event.preventDefault();
        nextTick(() => {
            const root = contentBodyRef.value;
            const input = root?.querySelector('.vc-color-input input, .vc-colorpicker input[type="text"]');
            if (input) {
                input.focus();
                input.select();
            }
        });
    }
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <slot name="trigger" :color="modelValue" :label="displayLabel">
                <Button
                    variant="outline"
                    :size="size"
                    class="flex items-center gap-2 px-2"
                    :class="buttonClass"
                    :disabled="disabled">
                    <span class="h-4 w-4 rounded shrink-0" :style="{ backgroundColor: modelValue }" />
                    <span class="text-xs opacity-80 uppercase">{{ displayLabel }}</span>
                    <slot name="trigger-suffix" />
                </Button>
            </slot>
        </PopoverTrigger>

        <PopoverContent
            class="w-auto p-0 z-10000 [&_.vc-colorpicker]:!shadow-none [&_.vc-colorpicker]:!bg-popover dark:[&_.vc-input-toggle,&_.vc-color-input_input]:!text-muted-foreground"
            :class="popoverClass"
            :align="align"
            @open-auto-focus="onOpenAutoFocus">
            <div ref="contentBodyRef">
                <slot name="presets" />

                <ColorPicker
                    :isWidget="isWidget"
                    :disableAlpha="disableAlpha"
                    :pureColor="modelValue"
                    :format="format"
                    :shape="shape"
                    :useType="useType"
                    :pickerType="pickerType"
                    :disabled="disabled"
                    @update:pureColor="onInput" />

                <slot name="footer" />
            </div>
        </PopoverContent>
    </Popover>
</template>
