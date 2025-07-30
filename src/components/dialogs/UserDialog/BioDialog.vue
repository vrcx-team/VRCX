<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="bioDialog.visible"
        :title="t('dialog.bio.header')"
        width="600px"
        append-to-body>
        <div v-loading="bioDialog.loading">
            <el-input
                v-model="bioDialog.bio"
                type="textarea"
                size="mini"
                maxlength="512"
                show-word-limit
                :autosize="{ minRows: 5, maxRows: 20 }"
                :placeholder="t('dialog.bio.bio_placeholder')"
                style="margin-bottom: 10px">
            </el-input>

            <el-input
                v-for="(link, index) in bioDialog.bioLinks"
                :key="index"
                v-model="bioDialog.bioLinks[index]"
                size="small"
                style="margin-top: 5px">
                <img
                    slot="prepend"
                    :src="getFaviconUrl(link)"
                    style="width: 16px; height: 16px; vertical-align: middle" />
                <el-button slot="append" icon="el-icon-delete" @click="bioDialog.bioLinks.splice(index, 1)" />
            </el-input>

            <el-button
                :disabled="bioDialog.bioLinks.length >= 3"
                size="mini"
                style="margin-top: 5px"
                @click="bioDialog.bioLinks.push('')">
                {{ t('dialog.bio.add_link') }}
            </el-button>
        </div>

        <template #footer>
            <el-button type="primary" size="small" :disabled="bioDialog.loading" @click="saveBio">
                {{ t('dialog.bio.update') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { userRequest } from '../../../api';
    import { getFaviconUrl } from '../../../shared/utils';

    const { t } = useI18n();
    const { $message } = getCurrentInstance().proxy;

    const props = defineProps({
        bioDialog: {
            type: Object,
            required: true
        }
    });

    function saveBio() {
        const D = props.bioDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        userRequest
            .saveCurrentUser({
                bio: D.bio,
                bioLinks: D.bioLinks
            })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                $message({
                    message: 'Bio updated',
                    type: 'success'
                });
                return args;
            });
    }
</script>
