<template>
    <Dialog v-model:open="isOpen">
        <DialogContent
            class="border border-border bg-background/85 shadow-lg backdrop-blur-xl backdrop-saturate-[1.4] sm:max-w-3xl"
            :show-close-button="false"
            @escape-key-down="handleDismiss"
            @pointer-down-outside="handleDismiss"
            @interact-outside.prevent>
            <div class="pt-2 text-center">
                <div class="mb-2 flex justify-center">
                    <img :src="vrcxLogo" alt="VRCX" class="size-12 rounded-xl" />
                </div>
                <h2 class="m-0 text-[22px] font-bold tracking-tight">{{ t('onboarding.welcome.title') }}</h2>
                <p class="mt-1.5 text-sm text-muted-foreground">{{ t('onboarding.welcome.subtitle') }}</p>
            </div>

            <div class="my-4 grid auto-rows-fr grid-cols-4 gap-2.5">
                <div
                    v-for="(feature, index) in features"
                    :key="feature.key"
                    class="flex h-full animate-[featureAppear_0.4s_ease-out_both] cursor-default flex-col items-center rounded-[10px] border border-transparent bg-muted/50 px-2 py-3.5 pb-3 text-center transition-all duration-250 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/80 hover:shadow-[0_4px_16px_hsl(from_var(--primary)_h_s_l/0.08)]"
                    :style="{ animationDelay: `${0.1 + index * 0.1}s` }">
                    <div
                        class="mb-2.5 flex size-10 items-center justify-center rounded-[10px] transition-all duration-250"
                        :style="{
                            background: `hsl(${feature.hue} 60% 50% / 0.12)`,
                            color: `hsl(${feature.hue} 60% 55%)`
                        }">
                        <component :is="feature.icon" class="size-5" />
                    </div>
                    <div class="mb-1 w-full text-[13px] font-semibold leading-snug">
                        {{ t(`onboarding.welcome.features.${feature.key}.title`) }}
                    </div>
                    <div class="w-full text-[11.5px] leading-snug text-muted-foreground">
                        {{ t(`onboarding.welcome.features.${feature.key}.description`) }}
                    </div>
                </div>
            </div>

            <div class="flex flex-col items-center">
                <Button class="w-full text-sm font-semibold" size="lg" @click="handleDismiss">
                    {{ t('onboarding.welcome.cta') }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { markRaw, onMounted, ref } from 'vue';
    import { LayoutDashboard, MousePointerClick, Search, Sparkles, UserSearch } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { Dialog, DialogContent } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import configRepository from '../../services/config';
    import vrcxLogo from '../../../images/VRCX.png';

    const { t } = useI18n();

    const isOpen = ref(false);

    const features = [
        { key: 'user_profiles', icon: markRaw(UserSearch), hue: '280' },
        { key: 'right_click', icon: markRaw(MousePointerClick), hue: '200' },
        { key: 'dashboard', icon: markRaw(LayoutDashboard), hue: '45' },
        { key: 'quick_search', icon: markRaw(Search), hue: '142' }
    ];

    onMounted(async () => {
        const seen = await configRepository.getBool('VRCX_onboarding_welcome_seen', false);
        if (!seen) {
            setTimeout(() => {
                isOpen.value = true;
            }, 800);
        }
    });

    /**
     *
     */
    async function handleDismiss() {
        isOpen.value = false;
        await configRepository.setBool('VRCX_onboarding_welcome_seen', true);
    }
</script>

<style>
    @keyframes featureAppear {
        from {
            opacity: 0;
            transform: translateY(12px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>
