<script setup>
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { Button } from '@/components/ui/button';
    import { ColorPicker } from 'vue3-colorpicker';
    import 'vue3-colorpicker/style.css';

    const { t } = useI18n();

    const props = defineProps({
        modelValue: { type: String, required: true },
        label: { type: String, default: null },
        disableAlpha: { type: Boolean, default: true },
        presets: { type: Array, default: () => [] },
        clearable: { type: Boolean, default: false },
        emptyValue: {
            type: String,
            default: (e) => (Array.isArray(e.presets) && e.presets.length ? String(e.presets[0]) : '#000000')
        },
        cols: { type: Number, default: 6 },
        disabled: { type: Boolean, default: false }
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
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <slot name="trigger" :color="safeValue" :label="displayLabel">
                <Button variant="outline" class="flex items-center gap-2 px-2 size-sm" :disabled="disabled">
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

        <PopoverContent class="w-auto p-0 z-10000" align="start">
            <div ref="contentBodyRef" :class="[{ 'disable-alpha': disableAlpha }]">
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
                    :isWidget="true"
                    :disableAlpha="disableAlpha"
                    :pureColor="safeValue"
                    :format="props.disableAlpha ? 'hex' : 'hex8'"
                    :disabled="disabled"
                    @update:pureColor="onInput" />

                <slot name="footer" />
            </div>
        </PopoverContent>
    </Popover>
</template>

<style scoped>
    :deep(.vc-colorpicker) {
        box-shadow: none !important;
        background-color: var(--popover) !important;
    }

    :deep(.vc-display .vc-color-input input) {
        cursor: text !important;
    }

    :deep(.vc-input-toggle) {
        width: 4ch !important;
        padding-inline: 0 !important;
        font-family: monospace;
        text-transform: uppercase;
        text-align: center;
    }

    :global(html.dark :is(.vc-color-input input, .vc-input-toggle, .vc-alpha-input, .vc-alpha-input__inner)) {
        color: var(--muted-foreground) !important;
    }

    .disable-alpha {
        :deep(.vc-compact__row:last-child .vc-compact__color-cube--wrap:first-child),
        :deep(.vc-color-input:nth-child(4)) {
            display: none !important;
        }

        :deep(.vc-input-toggle) {
            width: 3ch !important;
            overflow: hidden !important;
        }

        :deep(.vc-compact__row:last-child > .vc-compact__color-cube--wrap:nth-child(2)) {
            width: 54px !important;
        }

        :deep(.vc-colorPicker__record .color-list) {
            cursor: not-allowed;
        }

        :deep(.color-item.transparent:has(.color-item__display[style*='rgba'])) {
            pointer-events: none !important;
            opacity: 0.5 !important;
        }
    }
</style>
