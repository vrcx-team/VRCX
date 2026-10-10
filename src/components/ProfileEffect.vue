<template>
    <template v-if="displayVRCProfileCosmetics">
        <img
            v-if="mainUrl"
            v-show="isAnimated && !introActive"
            v-bind="$attrs"
            :src="mainUrl"
            class="absolute inset-0 block h-full w-full object-fit object-top pointer-events-none" />
        <img
            v-if="introUrl && isAnimated"
            v-show="introActive"
            v-bind="$attrs"
            :src="introUrl"
            @load="startIntroTimer"
            class="absolute inset-0 block h-full w-full object-fit object-top pointer-events-none" />
        <img
            v-if="baseUrl"
            v-show="!isAnimated"
            v-bind="$attrs"
            :src="baseUrl"
            class="absolute inset-0 block h-full w-full object-fit object-top pointer-events-none" />
    </template>
</template>

<script setup>
    import { computed, onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useAppearanceSettingsStore, useUserStore, useVrcxStore } from '../stores';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        profileEffect: { type: String, default: '' }
    });

    const { cachedProfileEffects, currentUserClientConfig } = storeToRefs(useUserStore());
    const { displayVRCProfileCosmetics } = storeToRefs(useAppearanceSettingsStore());
    const { isBrowserFocused } = storeToRefs(useVrcxStore());

    const isAnimated = computed(() => isBrowserFocused.value && !currentUserClientConfig.value.accessReduceDecorAnim);

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

    watch(isAnimated, (animated) => {
        if (animated) {
            return;
        }
        clearIntroTimer();
        introActive.value = false;
    });

    watch(
        () => [props.profileEffect, cachedProfileEffects.value.get(props.profileEffect)],
        ([, effect]) => {
            clearIntroTimer();
            baseUrl.value = null;
            mainUrl.value = null;
            introUrl.value = null;
            introActive.value = false;
            introDuration.value = null;

            const introAsset = effect?.metadata?.assets.find((asset) => asset.type === 'introAnimation');
            const mainAsset = effect?.metadata?.assets.find((asset) => asset.type === 'mainAnimation');
            const baseAsset = effect?.metadata?.assets.find((asset) => asset.type === 'base');

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
