<template>
    <div class="theme-picker">
        <div class="theme-picker__header">
            <div>
                <span class="header">{{ t('view.settings.appearance.theme_color.header') }}</span>
            </div>
            <div class="theme-picker__current ml-25">
                <span class="theme-picker__chip" :style="{ backgroundColor: currentPrimary }"></span>
                <button type="button" class="theme-picker__toggle" @click="isOpen = !isOpen">
                    {{ isOpen ? 'Collapse' : 'Expand' }}
                </button>
            </div>
        </div>

        <div v-show="isOpen" class="theme-picker__panel">
            <div class="theme-picker__grid">
                <button
                    v-for="color in colorFamilies"
                    :key="color.name"
                    type="button"
                    class="theme-picker__item"
                    :class="{ 'is-active': color.base === currentPrimary }"
                    :disabled="isApplying"
                    @click="selectColor(color)">
                    <span class="theme-picker__swatch" :style="{ backgroundColor: color.base }"></span>
                    <span class="theme-picker__badge">{{ color.name }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted, ref } from 'vue';
    import { useI18n } from 'vue-i18n';

    import colors from 'tailwindcss/colors';

    import { useElementTheme } from '../../../composables/useElementTheme';

    // Tailwind indigo-500
    const defaultPrimary = 'oklch(58.5% 0.233 277.117)';
    const { currentPrimary, isApplying, applyPrimaryColor, initPrimaryColor } = useElementTheme(defaultPrimary);
    const { t } = useI18n();

    const invalidKeys = new Set([
        'inherit',
        'current',
        'transparent',
        'black',
        'white',
        'lightBlue',
        'warmGray',
        'trueGray',
        'coolGray',
        'blueGray'
    ]);

    const isOpen = ref(false);

    const colorFamilies = computed(() =>
        Object.entries(colors)
            .filter(([name, palette]) => {
                return !invalidKeys.has(name) && palette && typeof palette === 'object' && palette['500'];
            })
            .map(([name, palette]) => {
                const base = palette['500'];
                const light = palette['300'];
                const vivid = palette['600'];
                const dark = palette['700'];
                return {
                    name,
                    base,
                    light,
                    vivid,
                    dark,
                    palette
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name))
    );

    const selectColor = async (color) => {
        await applyPrimaryColor(color.base, color.palette);
    };

    onMounted(async () => {
        await initPrimaryColor(defaultPrimary);
    });
</script>

<style>
    .theme-picker {
        padding: 6px 0;
        background: transparent;
    }

    .theme-picker__header {
        display: flex;
        justify-content: flex-start;
        gap: 12px;
        align-items: center;
        margin-bottom: 10px;
    }

    .theme-picker__current {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        color: var(--el-text-color-primary);
        padding: 0;
        border-radius: 0;
        border: none;
    }

    .theme-picker__toggle {
        border: none;
        background: transparent;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        cursor: pointer;
        padding: 0;
    }

    .theme-picker__toggle:hover {
        color: var(--el-text-color-primary);
    }

    .theme-picker__chip {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 1px solid var(--color-zinc-100);
    }

    .theme-picker__panel {
        max-width: 400px;
    }

    .theme-picker__grid {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        max-height: 360px;
        gap: 10px 18px;
    }

    .theme-picker__item {
        all: unset;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        justify-content: space-between;
        width: calc(50% - 9px);
        min-width: 0;
        cursor: pointer;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 10px;
        padding: 8px 12px;
        background: var(--el-bg-color);
        transition: border-color 0.15s ease;
    }

    .theme-picker__item:hover {
        border-color: var(--el-color-primary);
    }

    .theme-picker__item.is-active {
        border-color: var(--el-color-primary);
    }

    .theme-picker__item:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .theme-picker__swatch {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 1px solid var(--color-zinc-100);
        flex: none;
    }

    .theme-picker__badge {
        font-size: 12px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        text-transform: capitalize;
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    @media (max-width: 768px) {
        .theme-picker__header {
            flex-direction: column;
            align-items: flex-start;
        }
        .theme-picker__current {
            align-self: flex-start;
        }
    }
</style>
