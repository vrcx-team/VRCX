<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible="changeLogDialog.visible"
        :title="t('dialog.change_log.header')"
        width="800px"
        top="5vh"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp"
        @close="closeDialog">
        <div v-if="changeLogDialog.visible" class="changelog-dialog">
            <h2 v-text="changeLogDialog.buildName"></h2>
            <span>
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
    </el-dialog>
</template>

<script setup>
    import { inject } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';

    const { t } = useI18n();
    const openExternalLink = inject('openExternalLink');
    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

    const props = defineProps({
        changeLogDialog: {
            type: Object,
            required: true
        }
    });
    const emit = defineEmits(['update:changeLogDialog']);

    function closeDialog() {
        emit('update:changeLogDialog', { ...props.changeLogDialog, visible: false });
    }
</script>

<style>
    .changelog-dialog img {
        width: 100%;
    }
</style>
