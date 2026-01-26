<template>
    <Dialog v-model:open="changeLogDialog.visible" class="p-4!">
        <DialogContent class="sm:max-w-4xl">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.change_log.header') }}</DialogTitle>
            </DialogHeader>
            <div class="changelog-dialog">
                <h2 v-text="changeLogDialog.buildName"></h2>
                <span>
                    {{ t('dialog.change_log.description') }}
                    <br />
                    Map1en:
                    <a class="cursor-pointer" @click="openExternalLink('https://ko-fi.com/map1en_')">Ko-fi</a>.
                    <br />
                    Natsumi:
                    <a class="cursor-pointer" @click="openExternalLink('https://ko-fi.com/natsumi_sama')">Ko-fi</a>,
                    <a class="cursor-pointer" @click="openExternalLink('https://www.patreon.com/Natsumi_VRCX')"
                        >Patreon</a
                    >.
                </span>
                <VueShowdown
                    class="changelog-markdown"
                    :markdown="changeLogDialog.changeLog"
                    flavor="github"
                    :options="showdownOptions"
                    @click="handleLinkClick"
                    style="height: 62vh; overflow-y: auto; margin-top: 10px" />
            </div>
            <DialogFooter>
                <Button
                    variant="ghost"
                    class="mr-2"
                    @click="openExternalLink('https://github.com/vrcx-team/VRCX/releases')">
                    {{ t('dialog.change_log.github') }}
                </Button>
                <!-- <Button variant="outline" class="mr-2" @click="openExternalLink('https://patreon.com/Natsumi_VRCX')">
                    {{ t('dialog.change_log.donate') }}
                </Button> -->
                <Button @click="closeDialog">
                    {{ t('dialog.change_log.close') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { defineAsyncComponent } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { openExternalLink } from '../../../shared/utils';
    import { useVRCXUpdaterStore } from '../../../stores';

    const VueShowdown = defineAsyncComponent(() => import('vue-showdown').then((module) => module.VueShowdown));

    const VRCXUpdaterStore = useVRCXUpdaterStore();

    const { changeLogDialog } = storeToRefs(VRCXUpdaterStore);

    const { t } = useI18n();

    const showdownOptions = {
        emoji: true,
        openLinksInNewWindow: false,
        simplifiedAutoLink: true,
        excludeTrailingPunctuationFromURLs: true,
        literalMidWordUnderscores: true,
        strikethrough: true,
        tables: true,
        tablesHeaderId: false,
        ghCodeBlocks: true,
        tasklists: true
    };

    function closeDialog() {
        changeLogDialog.value.visible = false;
    }

    function handleLinkClick(event) {
        const target = event.target.closest('a');
        if (target && target.href) {
            event.preventDefault();
            event.stopPropagation();

            openExternalLink(target.href);
        }
    }
</script>

<style>
    .changelog-dialog img {
        width: 100%;
    }

    .changelog-markdown ul,
    .changelog-markdown ol {
        padding-left: 1.5rem;
        margin: 0.5rem 0 1rem;
        list-style-position: outside;
    }

    .changelog-markdown ul {
        list-style-type: disc;
    }

    .changelog-markdown ol {
        list-style-type: decimal;
    }

    .changelog-markdown li {
        margin: 0.25rem 0;
    }

    .changelog-markdown h1,
    .changelog-markdown h2,
    .changelog-markdown h3,
    .changelog-markdown h4,
    .changelog-markdown h5,
    .changelog-markdown h6 {
        font-weight: 600;
        line-height: 1.25;
        margin: 1.25rem 0 0.5rem;
    }

    .changelog-markdown h1 {
        font-size: 1.5rem;
    }

    .changelog-markdown h2 {
        font-size: 1.25rem;
    }

    .changelog-markdown h3 {
        font-size: 1.125rem;
    }

    .changelog-markdown h4 {
        font-size: 1rem;
    }

    .changelog-markdown h5 {
        font-size: 0.95rem;
    }

    .changelog-markdown h6 {
        font-size: 0.9rem;
    }
</style>
