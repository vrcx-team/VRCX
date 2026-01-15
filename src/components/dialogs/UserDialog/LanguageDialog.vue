<template>
    <el-dialog
        class="x-dialog"
        v-model="languageDialog.visible"
        :title="t('dialog.language.header')"
        width="400px"
        append-to-body>
        <div v-loading="languageDialog.loading">
            <div v-for="item in currentUser.$languages" :key="item.key" style="margin: 6px 0">
                <Badge variant="outline" style="margin-right: 5px">
                    <span
                        class="flags"
                        :class="languageClass(item.key)"
                        style="display: inline-block; margin-right: 5px"></span>
                    {{ item.value }} ({{ item.key.toUpperCase() }})
                    <button
                        type="button"
                        style="
                            margin-left: 6px;
                            border: none;
                            background: transparent;
                            padding: 0;
                            display: inline-flex;
                            align-items: center;
                            color: inherit;
                            cursor: pointer;
                        "
                        @click="removeUserLanguage(item.key)">
                        <X class="h-3 w-3" />
                    </button>
                </Badge>
            </div>
            <Select
                :model-value="selectedLanguageToAdd"
                :disabled="languageDialog.loading || (currentUser.$languages && currentUser.$languages.length === 3)"
                @update:modelValue="handleAddUserLanguage">
                <SelectTrigger size="sm" style="margin-top: 14px">
                    <SelectValue :placeholder="t('dialog.language.select_language')" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem
                            v-for="item in languageDialog.languages"
                            :key="item.key"
                            :value="item.key"
                            :text-value="item.value">
                            <span
                                class="flags"
                                :class="languageClass(item.key)"
                                style="display: inline-block; margin-right: 5px"></span>
                            {{ item.value }} ({{ item.key.toUpperCase() }})
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    </el-dialog>
</template>

<script setup>
    import { X } from 'lucide-vue-next';
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
    import { Badge } from '../../ui/badge';
    import { languageClass } from '../../../shared/utils';
    import { useUserStore } from '../../../stores';
    import { userRequest } from '../../../api';

    const { t } = useI18n();

    const { languageDialog, currentUser } = storeToRefs(useUserStore());

    const selectedLanguageToAdd = ref('');

    function handleAddUserLanguage(language) {
        addUserLanguage(language);
        selectedLanguageToAdd.value = '';
    }

    function removeUserLanguage(language) {
        if (language !== String(language)) {
            return;
        }
        const D = languageDialog.value;
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
        const D = languageDialog.value;
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
