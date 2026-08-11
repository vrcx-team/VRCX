<script setup>
    import { computed, nextTick, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Button } from '@/components/ui/button';
    import { ColorPicker } from 'vue3-colorpicker';
    import 'vue3-colorpicker/style.css';

    const { t } = useI18n();

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
        popoverClass: { type: [String, Array, Object], default: '' },
        presets: { type: Array, default: () => [] },
        clearable: { type: Boolean, default: false },
        emptyValue: {
            type: String,
            default: (e) => (Array.isArray(e.presets) && e.presets.length ? String(e.presets[0]) : '#000000')
        },
        cols: { type: Number, default: 6 }
    });

    const emit = defineEmits(['update:modelValue', 'change']);

    function normalizeHex(v) {
        const s = String(v || '')
            .trim()
            .toLowerCase();
        if (/^#[0-9a-f]{6}$/.test(s)) return s;
        return '#ffffff';
    }

    const safeValue = computed(() => normalizeHex(props.modelValue));
    const displayLabel = computed(() => {
        if (props.label !== null) return props.label;
        return props.modelValue ? props.modelValue : props.emptyValue;
    });
    const hasPresets = computed(() => Array.isArray(props.presets) && props.presets.length > 0);
    const gridStyle = computed(() => ({
        gridTemplateColumns: `repeat(${Math.max(1, props.cols)}, minmax(0, 1fr))`
    }));

    const contentBodyRef = ref(null);

    function setColor(color) {
        if (props.disabled) return;
        emit('update:modelValue', color);
        emit('change', color);
    }

    function onInput(val) {
        setColor(String(val || ''));
    }

    function clear() {
        if (props.disabled || !props.clearable) return;
        setColor(props.emptyValue);
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
            <slot name="trigger" :color="safeValue" :label="displayLabel">
                <Button
                    variant="outline"
                    :size="size"
                    class="flex items-center gap-2 px-2"
                    :class="buttonClass"
                    :disabled="disabled">
                    <span class="h-4 w-4 rounded shrink-0" :style="{ backgroundColor: safeValue }" />
                    <span class="text-xs opacity-80 uppercase">{{ displayLabel }}</span>
                    <span
                        v-if="clearable && modelValue"
                        role="button"
                        tabindex="0"
                        :aria-label="t('view.favorite.clear')"
                        class="opacity-60 hover:opacity-100"
                        :class="disabled ? 'pointer-events-none cursor-not-allowed' : 'cursor-pointer'"
                        @click.stop="clear">
                        ✕
                    </span>
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
                <div v-if="hasPresets" class="mt-3 pl-3 pb-3 grid gap-2 border-b" :style="gridStyle">
                    <button
                        v-for="color in presets"
                        :key="color"
                        type="button"
                        class="h-6 w-6 rounded border"
                        :style="{ backgroundColor: color }"
                        :disabled="disabled"
                        :aria-disabled="disabled ? 'true' : 'false'"
                        :class="[
                            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                            safeValue === String(color).toLowerCase() ? 'ring-[1.5px] ring-offset-[1.5px]' : ''
                        ]"
                        @click="setColor(color)" />
                </div>

                <ColorPicker
                    :isWidget="isWidget"
                    :disableAlpha="disableAlpha"
                    :pureColor="safeValue"
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
