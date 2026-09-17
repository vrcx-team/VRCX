<template>
    <template v-if="displayVRCProfileCosmetics">
        <img
            v-if="mainUrl"
            v-show="!introActive"
            v-bind="$attrs"
            :src="mainUrl"
            class="absolute inset-0 block h-full w-full object-fit object-top pointer-events-none" />
        <img
            v-if="introUrl"
            v-show="introActive"
            v-bind="$attrs"
            :src="introUrl"
            @load="startIntroTimer"
            class="absolute inset-0 block h-full w-full object-fit object-top pointer-events-none" />
    </template>
</template>

<script setup>
    import { onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useAppearanceSettingsStore, useUserStore } from '../stores';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        profileEffect: { type: String, default: '' }
    });

    const { cachedProfileEffects } = storeToRefs(useUserStore());
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
        () => [props.profileEffect, cachedProfileEffects.value.get(props.profileEffect)],
        ([, effect]) => {
            clearIntroTimer();
            mainUrl.value = null;
            introUrl.value = null;
            introActive.value = false;
            introDuration.value = null;

            const introAsset = effect?.metadata?.assets.find((asset) => asset.type === 'introAnimation');
            const mainAsset = effect?.metadata?.assets.find((asset) => asset.type === 'mainAnimation');

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
