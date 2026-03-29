<template>
    <Dialog v-model:open="whatsNewDialog.visible">
        <DialogContent
            class="border border-border bg-background/88 p-5 shadow-lg backdrop-blur-xl backdrop-saturate-[1.4] sm:max-w-3xl"
            :show-close-button="false"
            @escape-key-down="handleDismiss"
            @pointer-down-outside="handleDismiss"
            @interact-outside.prevent>
            <!-- Title -->
            <div class="pt-1 text-center">
                <div class="mb-2 flex justify-center">
                    <img :src="vrcxLogo" alt="VRCX" class="size-12 rounded-xl" />
                </div>

                <h2 class="m-0 text-[23px] font-bold tracking-tight">
                    {{ t(whatsNewDialog.titleKey || 'onboarding.whatsnew.title') }}
                </h2>

                <p
                    v-if="whatsNewDialog.subtitleKey"
                    class="mt-1 text-[13px] text-muted-foreground">
                    {{ t(whatsNewDialog.subtitleKey) }}
                </p>
            </div>

            <!-- Feature Cards -->
            <div class="my-2 grid auto-rows-fr grid-cols-4 gap-2.5">
                <div
                    v-for="(feature, index) in whatsNewDialog.items"
                    :key="feature.key"
                    class="flex h-full animate-[featureAppear_0.4s_ease-out_both] cursor-default flex-col items-center rounded-[10px] border border-transparent bg-muted/50 px-2 py-3.5 pb-3 text-center transition-all duration-250 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/80 hover:shadow-[0_4px_16px_hsl(from_var(--primary)_h_s_l/0.08)]"
                    :style="{ animationDelay: `${0.1 + index * 0.1}s` }">
                    <div
                        class="mb-2.5 flex size-10 items-center justify-center rounded-[10px] transition-all duration-250"
                        :style="{
                            background: `hsl(${resolveHue(feature.icon)} 60% 50% / 0.12)`,
                            color: `hsl(${resolveHue(feature.icon)} 60% 55%)`
                        }">
                        <component :is="resolveIcon(feature.icon)" class="size-5" />
                    </div>

                    <div class="mb-1 w-full text-[13px] font-semibold leading-snug">
                        {{ t(feature.titleKey) }}
                    </div>

                    <div class="w-full text-[11.5px] leading-snug text-muted-foreground">
                        {{ t(feature.descriptionKey) }}
                    </div>
                </div>
            </div>

            <!-- Support (subdued footer-like) -->
            <div class="mx-auto mt-4 w-fit max-w-[340px]">
                <div class="mb-2 text-[11.5px] font-medium tracking-[0.02em] text-muted-foreground/75">
                    <span>{{ t('onboarding.whatsnew.common.support') }}</span>
                </div>

                <div class="flex flex-col gap-1 text-left">
                    <div
                        v-for="supporter in supporters"
                        :key="supporter.name"
                        class="flex flex-wrap items-center gap-1">
                        <span class="text-[13px] font-semibold text-foreground/90">
                            {{ supporter.name }}
                        </span>
                        <template v-for="link in supporter.links" :key="link.label">
                            <span class="text-[11px] text-muted-foreground/40">·</span>
                            <button
                                class="cursor-pointer border-0 bg-transparent p-0 text-[12px] font-medium text-muted-foreground/80 transition-colors duration-200 hover:text-foreground"
                                @click="openExternalLink(link.url)">
                                {{ link.label }}
                            </button>
                        </template>
                    </div>
                </div>
            </div>

            <!-- View Changelog -->
            <div class="mt-2 flex justify-center">
                <button
                    class="cursor-pointer border-0 bg-transparent text-xs text-muted-foreground/70 transition-colors duration-200 hover:text-foreground"
                    @click="handleViewChangelog">
                    {{ t('onboarding.whatsnew.common.view_changelog') }} →
                </button>
            </div>

            <!-- CTA -->
            <Button class="mt-1 h-11 w-full text-sm font-semibold" size="lg" @click="handleDismiss">
                {{ t('onboarding.whatsnew.common.got_it') }}
            </Button>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { markRaw } from 'vue';
    import { Search, FolderHeart, RefreshCw, MousePointerClick } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Dialog, DialogContent } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { openExternalLink } from '../../shared/utils';
    import { useVRCXUpdaterStore } from '../../stores';
    import vrcxLogo from '../../../images/VRCX.png';

    const { t } = useI18n();
    const vrcxUpdaterStore = useVRCXUpdaterStore();
    const { whatsNewDialog } = storeToRefs(vrcxUpdaterStore);
    const { closeWhatsNewDialog, openChangeLogDialogOnly } = vrcxUpdaterStore;

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
        'folder-heart': markRaw(FolderHeart),
        'refresh-cw': markRaw(RefreshCw),
        'mouse-pointer-click': markRaw(MousePointerClick)
    };

    const hueMap = {
        search: '142',
        'folder-heart': '340',
        'refresh-cw': '200',
        'mouse-pointer-click': '45'
    };

    function resolveIcon(iconName) {
        return iconMap[iconName] ?? Search;
    }

    function resolveHue(iconName) {
        return hueMap[iconName] ?? '210';
    }

    async function handleViewChangelog() {
        closeWhatsNewDialog();
        await openChangeLogDialogOnly();
    }

    function handleDismiss() {
        closeWhatsNewDialog();
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
