<template>
    <span
        v-if="provider === 'google'"
        class="inline-flex shrink-0"
        :style="{ width: `${size}px`, height: `${size}px` }"
        aria-hidden="true"
        v-html="googleMarkup" />
    <svg
        v-else-if="logo"
        :viewBox="logo.viewBox"
        :style="{ width: `${size}px`, height: `${size}px` }"
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg">
        <path v-for="(path, index) in logo.paths" :key="index" :d="path.d" :fill="path.fill" />
    </svg>
</template>

<script setup>
    import { computed, useId } from 'vue';
    import logos from './providerLogoPaths';
    import googleSvg from './assets/google-gradient.svg?raw';

    const props = defineProps({
        provider: { type: String, required: true },
        size: { type: Number, default: 28 }
    });
    const logo = computed(() => logos[props.provider]);
    const googleId = `google-${useId()}`;
    // This is the bundled official SVG, never provider/user-supplied markup.
    // Inline rendering preserves its conic gradient; unique IDs isolate masks/filters.
    const googleMarkup = computed(() =>
        googleSvg.replace(/id="([^"]+)"/g, `id="${googleId}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${googleId}-$1)`)
    );
</script>
