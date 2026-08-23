<template>
    <template v-if="typeof enabled !== 'undefined' ? enabled : displayVRCProfileCosmetics">
        <img
            v-if="mainUrl"
            v-show="!introActive"
            v-bind="$attrs"
            :src="mainUrl"
            class="absolute top-[-15%] left-[-15%] h-[130%] w-[130%] max-w-none pointer-events-none" />
        <img
            v-if="introUrl"
            v-show="introActive"
            v-bind="$attrs"
            :src="introUrl"
            @load="startIntroTimer"
            class="absolute top-[-15%] left-[-15%] h-[130%] w-[130%] max-w-none pointer-events-none" />
    </template>
</template>

<script setup>
    import { onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useUserStore, useAppearanceSettingsStore } from '../stores';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        iconFrame: { type: String, default: '' },
        enabled: { type: Boolean, default: undefined }
    });

    const { cachedIconFrames } = storeToRefs(useUserStore());
    const { displayVRCProfileCosmetics } = storeToRefs(useAppearanceSettingsStore());

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

    watch(
        () => [props.iconFrame, cachedIconFrames.value.get(props.iconFrame)],
        ([, frame]) => {
            clearIntroTimer();
            mainUrl.value = null;
            introUrl.value = null;
            introActive.value = false;
            introDuration.value = null;

            const introAsset = frame?.metadata?.assets.find((asset) => asset.type === 'introAnimation');
            const mainAsset = frame?.metadata?.assets.find((asset) => asset.type === 'mainAnimation');

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
