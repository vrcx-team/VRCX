<template>
    <safe-dialog
        class="x-dialog"
        :visible="changeLogDialog.visible"
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
            <vue-markdown
                :source="changeLogDialog.changeLog"
                :linkify="false"
                style="height: 62vh; overflow-y: auto; margin-top: 10px"></vue-markdown>
        </div>
        <template #footer>
            <el-button type="small" @click="openExternalLink('https://github.com/vrcx-team/VRCX/releases')">
                {{ t('dialog.change_log.github') }}
            </el-button>
            <el-button type="small" @click="openExternalLink('https://patreon.com/Natsumi_VRCX')">
                {{ t('dialog.change_log.donate') }}
            </el-button>
            <el-button type="small" @click="closeDialog">
                {{ t('dialog.change_log.close') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import { openExternalLink } from '../../../shared/utils';
    import { useVRCXUpdaterStore } from '../../../stores';

    const VueMarkdown = () => import('vue-markdown');

    const VRCXUpdaterStore = useVRCXUpdaterStore();

    const { changeLogDialog } = storeToRefs(VRCXUpdaterStore);

    const { t } = useI18n();

    function closeDialog() {
        changeLogDialog.value.visible = false;
    }
</script>

<style>
    .changelog-dialog img {
        width: 100%;
    }
</style>
