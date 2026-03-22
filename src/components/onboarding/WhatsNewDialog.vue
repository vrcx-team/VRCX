<template>
    <Dialog v-model:open="whatsNewDialog.visible">
        <DialogContent
            class="border-none! bg-background/88 p-5 shadow-[0_0_0_1px_hsl(from_var(--border)_h_s_l/0.5),0_24px_48px_hsl(from_var(--background)_h_s_l/0.4)] backdrop-blur-xl backdrop-saturate-[1.4] sm:max-w-2xl"
            :show-close-button="false"
            @escape-key-down="handleDismiss"
            @pointer-down-outside="handleDismiss"
            @interact-outside.prevent>
            <div class="pt-1 text-center">
                <div class="mb-2 flex justify-center">
                    <img :src="vrcxLogo" alt="VRCX" class="size-12 rounded-xl" />
                </div>

                <div class="flex flex-col items-center gap-2">
                    <h2 class="m-0 text-[23px] font-bold tracking-tight">
                        {{ releaseTitle }}
                    </h2>
                    <Badge
                        v-if="releaseLabel"
                        variant="secondary"
                        class="rounded-full px-2.5 py-0.5 text-[11px] tracking-[0.08em]">
                        {{ releaseLabel }}
                    </Badge>
                </div>

                <Button
                    variant="link"
                    size="sm"
                    class="mt-2 h-auto gap-1 px-0 text-muted-foreground hover:text-foreground"
                    @click="handleViewDetails">
                    {{ t('onboarding.whatsnew.common.view_details') }}
                    <ChevronRight class="size-4" />
                </Button>
            </div>

            <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                    v-for="(feature, index) in whatsNewDialog.items"
                    :key="feature.key"
                    class="group flex animate-[whatsNewAppear_0.45s_ease-out_both] cursor-default flex-col rounded-[12px] border border-transparent bg-muted/55 px-3 py-3.5 text-left transition-all duration-250 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/80 hover:shadow-[0_4px_18px_hsl(from_var(--primary)_h_s_l/0.08)]"
                    :style="{ animationDelay: `${0.08 + index * 0.06}s` }">
                    <div
                        class="mb-3 flex size-10 items-center justify-center rounded-[10px] transition-all duration-250"
                        :style="{
                            background: `hsl(${resolveHue(feature.icon)} 60% 50% / 0.12)`,
                            color: `hsl(${resolveHue(feature.icon)} 60% 55%)`
                        }">
                        <component :is="resolveIcon(feature.icon)" class="size-5" />
                    </div>

                    <div class="mb-1 text-sm font-semibold">
                        {{ t(feature.titleKey) }}
                    </div>

                    <div class="text-[12.5px] leading-snug text-muted-foreground">
                        {{ t(feature.descriptionKey) }}
                    </div>
                </div>
            </div>

            <div class="mt-1 rounded-[12px] border border-border/60 bg-muted/30 px-3 py-3">
                <div class="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    <HeartHandshake class="size-4 text-muted-foreground" />
                    <span>{{ t('onboarding.whatsnew.common.support') }}</span>
                </div>

                <div class="flex flex-col gap-3">
                    <div
                        v-for="supporter in supporters"
                        :key="supporter.name"
                        class="flex flex-wrap items-center gap-2">
                        <span class="min-w-20 text-sm font-medium text-foreground">
                            {{ supporter.name }}
                        </span>

                        <Button
                            v-for="link in supporter.links"
                            :key="link.label"
                            variant="outline"
                            size="sm"
                            class="h-8 rounded-full px-3 text-xs font-medium"
                            @click="openExternalLink(link.url)">
                            {{ link.label }}
                            <ExternalLink class="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <Button class="mt-1 h-11 w-full text-sm font-semibold" size="lg" @click="handleDismiss">
                <Sparkles class="size-4" />
                {{ t('onboarding.whatsnew.common.got_it') }}
            </Button>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed, markRaw } from 'vue';
    import {
        ChevronRight,
        ExternalLink,
        HeartHandshake,
        LayoutDashboard,
        Search,
        Sparkles,
        Activity,
        Images
    } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Badge } from '@/components/ui/badge';
    import { Dialog, DialogContent } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { openExternalLink } from '../../shared/utils';
    import { useVRCXUpdaterStore } from '../../stores';
    import vrcxLogo from '../../../images/VRCX.png';

    const { t } = useI18n();
    const vrcxUpdaterStore = useVRCXUpdaterStore();
    const { whatsNewDialog } = storeToRefs(vrcxUpdaterStore);
    const { closeWhatsNewDialog, openChangeLogDialogOnly } = vrcxUpdaterStore;

    const releaseLabel = computed(() => whatsNewDialog.value.version || '');
    const releaseTitle = computed(() => {
        const releaseKey = whatsNewDialog.value.releaseKey;
        return releaseKey
            ? t(`onboarding.whatsnew.releases.${releaseKey}.title`)
            : t('onboarding.whatsnew.title');
    });

    const supporters = [
        {
            name: 'Map1en',
            links: [
                { label: 'Ko-fi', url: 'https://ko-fi.com/map1en_' },
                { label: '爱发电', url: 'https://ifdian.net/a/map1en_' }
            ]
        },
        {
            name: 'Natsumi',
            links: [
                { label: 'Ko-fi', url: 'https://ko-fi.com/natsumi_sama' },
                { label: 'Patreon', url: 'https://www.patreon.com/Natsumi_VRCX' }
            ]
        }
    ];

    const iconMap = {
        search: markRaw(Search),
        'layout-dashboard': markRaw(LayoutDashboard),
        activity: markRaw(Activity),
        images: markRaw(Images)
    };

    const hueMap = {
        search: '142',
        'layout-dashboard': '45',
        activity: '200',
        images: '280'
    };

    function resolveIcon(iconName) {
        return iconMap[iconName] ?? Search;
    }

    function resolveHue(iconName) {
        return hueMap[iconName] ?? '210';
    }

    async function handleViewDetails() {
        closeWhatsNewDialog();
        await openChangeLogDialogOnly();
    }

    function handleDismiss() {
        closeWhatsNewDialog();
    }
</script>

<style>
    @keyframes whatsNewAppear {
        from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>
