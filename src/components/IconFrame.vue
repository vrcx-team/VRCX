<template>
    <template v-if="typeof enabled !== 'undefined' ? enabled : displayVRCProfileCosmetics">
        <img
            v-if="mainUrl"
            v-show="isBrowserFocused && !introActive"
            v-bind="$attrs"
            :src="mainUrl"
            class="absolute top-[-15%] left-[-15%] h-[130%] w-[130%] max-w-none pointer-events-none" />
        <img
            v-if="introUrl && isBrowserFocused"
            v-show="introActive"
            v-bind="$attrs"
            :src="introUrl"
            @load="startIntroTimer"
            class="absolute top-[-15%] left-[-15%] h-[130%] w-[130%] max-w-none pointer-events-none" />
        <img
            v-if="baseUrl"
            v-show="!isBrowserFocused"
            v-bind="$attrs"
            :src="baseUrl"
            class="absolute top-[-15%] left-[-15%] h-[130%] w-[130%] max-w-none pointer-events-none" />
    </template>
</template>

<script setup>
    import { onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useUserStore, useAppearanceSettingsStore, useVrcxStore } from '../stores';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        iconFrame: { type: String, default: '' },
        enabled: { type: Boolean, default: undefined }
    });

    const { cachedIconFrames } = storeToRefs(useUserStore());
    const { displayVRCProfileCosmetics } = storeToRefs(useAppearanceSettingsStore());
    const { isBrowserFocused } = storeToRefs(useVrcxStore());

    const baseUrl = ref(null);
    const mainUrl = ref(null);
    const introUrl = ref(null);
    const introActive = ref(false);
    const introDuration = ref(null);
    let introTimer;

    function clearIntroTimer() {
        clearTimeout(introTimer);
        introTimer = undefined;
    }

    function startIntroTimer() {
        clearIntroTimer();
        introTimer = setTimeout(() => {
            introActive.value = false;
        }, introDuration.value);
    }

    watch(isBrowserFocused, (focused) => {
        if (focused) {
            return;
        }
        clearIntroTimer();
        introActive.value = false;
    });

    watch(
        () => [props.iconFrame, cachedIconFrames.value.get(props.iconFrame)],
        ([, frame]) => {
            clearIntroTimer();
            baseUrl.value = null;
            mainUrl.value = null;
            introUrl.value = null;
            introActive.value = false;
            introDuration.value = null;

            const introAsset = frame?.metadata?.assets.find((asset) => asset.type === 'introAnimation');
            const mainAsset = frame?.metadata?.assets.find((asset) => asset.type === 'mainAnimation');
            const baseAsset = frame?.metadata?.assets.find((asset) => asset.type === 'base');

            baseUrl.value = baseAsset?.url ?? null;
            mainUrl.value = mainAsset?.url ?? null;
            if (introAsset) {
                introUrl.value = introAsset.url;
                introDuration.value = introAsset.totalDurationMs;
                introActive.value = true;
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(clearIntroTimer);
</script>
