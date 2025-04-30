<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="languageDialog.visible"
        :title="t('dialog.language.header')"
        width="400px"
        append-to-body>
        <div v-loading="languageDialog.loading">
            <div v-for="item in API.currentUser.$languages" :key="item.key" style="margin: 6px 0">
                <el-tag
                    size="small"
                    type="info"
                    effect="plain"
                    closable
                    style="margin-right: 5px"
                    @close="removeUserLanguage(item.key)">
                    <span
                        class="flags"
                        :class="languageClass(item.key)"
                        style="display: inline-block; margin-right: 5px"></span>
                    {{ item.value }} ({{ item.key.toUpperCase() }})
                </el-tag>
            </div>
            <el-select
                value=""
                :disabled="
                    languageDialog.loading || (API.currentUser.$languages && API.currentUser.$languages.length === 3)
                "
                :placeholder="t('dialog.language.select_language')"
                style="margin-top: 14px"
                @change="addUserLanguage">
                <el-option
                    v-for="item in languageDialog.languages"
                    :key="item.key"
                    :value="item.key"
                    :label="item.value">
                    <span
                        class="flags"
                        :class="languageClass(item.key)"
                        style="display: inline-block; margin-right: 5px"></span>
                    {{ item.value }} ({{ item.key.toUpperCase() }})
                </el-option>
            </el-select>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { inject } from 'vue';

    import { useI18n } from 'vue-i18n-bridge';
    import { userRequest } from '../../../api';

    import { languageClass } from '../../../composables/user/utils';

    const { t } = useI18n();

    const API = inject('API');

    const props = defineProps({
        languageDialog: {
            type: Object,
            required: true
        }
    });

    function removeUserLanguage(language) {
        if (language !== String(language)) {
            return;
        }
        const D = props.languageDialog;
        D.loading = true;
        userRequest
            .removeUserTags({
                tags: [`language_${language}`]
            })
            .finally(function () {
                D.loading = false;
            });
    }

    function addUserLanguage(language) {
        if (language !== String(language)) {
            return;
        }
        const D = props.languageDialog;
        D.loading = true;
        userRequest
            .addUserTags({
                tags: [`language_${language}`]
            })
            .finally(function () {
                D.loading = false;
            });
    }
</script>
