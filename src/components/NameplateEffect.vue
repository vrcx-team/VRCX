<template>
    <div v-if="displayVRCProfileCosmetics" v-bind="$attrs" class="absolute right-0 top-[105px] h-[50px] w-full">
        <div class="absolute inset-0 rounded-b-lg" :style="nameplateStyle"></div>
        <img
            v-if="mainUrl"
            v-show="!introActive"
            :src="mainUrl"
            class="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-100 transition-opacity rounded-b-lg" />
        <img
            v-if="introUrl"
            v-show="introActive"
            :src="introUrl"
            @load="startIntroTimer"
            class="absolute right-0 top-0 h-full w-auto object-contain object-right opacity-100 transition-opacity rounded-b-lg" />
    </div>
</template>

<script setup>
    import { onBeforeUnmount, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useAppearanceSettingsStore, useUserStore } from '../stores';

    defineOptions({ inheritAttrs: false });

    const props = defineProps({
        nameplateEffect: { type: String, default: '' }
    });

    const { cachedNameplateEffects } = storeToRefs(useUserStore());
    const { displayVRCProfileCosmetics } = storeToRefs(useAppearanceSettingsStore());

    const mainUrl = ref(null);
    const introUrl = ref(null);
    const introActive = ref(false);
    const introDuration = ref(null);
    const nameplateStyle = ref(null);
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
        () => [props.nameplateEffect, cachedNameplateEffects.value.get(props.nameplateEffect)],
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

            const gradientStart = effect?.metadata?.gradientStart;
            const gradientEnd = effect?.metadata?.gradientEnd;
            nameplateStyle.value =
                gradientStart && gradientEnd
                    ? { backgroundImage: `linear-gradient(90deg, #${gradientStart}, #${gradientEnd})` }
                    : null;
        },
        { immediate: true }
    );

    onBeforeUnmount(clearIntroTimer);
</script>
