<template>
    <el-dialog
        class="x-dialog"
        :model-value="changeLogDialog.visible"
        :title="t('dialog.change_log.header')"
        width="800px"
        append-to-body
        @close="closeDialog">
        <div v-loading="!changeLogDialog.changeLog" class="changelog-dialog">
            <h2 v-text="changeLogDialog.buildName"></h2>
            <span v-show="changeLogDialog.buildName">
                {{ t('dialog.change_log.description') }}
                <a class="x-link" @click="openExternalLink('https://www.patreon.com/Natsumi_VRCX')">Patreon</a>,
                <a class="x-link" @click="openExternalLink('https://ko-fi.com/natsumi_sama')">Ko-fi</a>.
            </span>
            <VueShowdown
                :markdown="changeLogDialog.changeLog"
                flavor="github"
                :options="showdownOptions"
                @click="handleLinkClick"
                style="height: 62vh; overflow-y: auto; margin-top: 10px" />
        </div>
        <template #footer>
            <el-button @click="openExternalLink('https://github.com/vrcx-team/VRCX/releases')">
                {{ t('dialog.change_log.github') }}
            </el-button>
            <el-button @click="openExternalLink('https://patreon.com/Natsumi_VRCX')">
                {{ t('dialog.change_log.donate') }}
            </el-button>
            <el-button @click="closeDialog">
                {{ t('dialog.change_log.close') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
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
</style>
