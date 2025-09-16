<template>
    <el-dialog
        ref="setAvatarStylesDialog"
        class="x-dialog"
        :model-value="setAvatarStylesDialog.visible"
        @close="closeSetAvatarStylesDialog"
        :title="t('dialog.set_avatar_styles.header')"
        width="400px"
        append-to-body>
        <template v-if="setAvatarStylesDialog.visible">
            <div>
                <span>{{ t('dialog.set_avatar_styles.primary_style') }}</span>
                <el-select
                    v-model="setAvatarStylesDialog.primaryStyle"
                    :placeholder="t('dialog.set_avatar_styles.select_style')"
                    size="small"
                    clearable
                    style="display: inline-block">
                    <el-option
                        v-for="(style, index) in setAvatarStylesDialog.availableAvatarStyles"
                        :key="index"
                        :label="style"
                        :value="style"></el-option>
                </el-select>
            </div>
            <br />
            <div>
                <span>{{ t('dialog.set_avatar_styles.secondary_style') }}</span>
                <el-select
                    v-model="setAvatarStylesDialog.secondaryStyle"
                    :placeholder="t('dialog.set_avatar_styles.select_style')"
                    size="small"
                    clearable
                    style="display: inline-block">
                    <el-option
                        v-for="(style, index) in setAvatarStylesDialog.availableAvatarStyles"
                        :key="index"
                        :label="style"
                        :value="style"></el-option>
                </el-select>
            </div>
            <br />
            <div style="font-size: 12px; margin-top: 10px">{{ t('dialog.set_world_tags.author_tags') }}<br /></div>
            <el-input
                v-model="setAvatarStylesDialog.authorTags"
                type="textarea"
                size="small"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 5 }"
                placeholder=""
                style="margin-top: 10px"></el-input>
        </template>
        <template #footer>
            <el-button @click="closeSetAvatarStylesDialog">{{ t('dialog.set_avatar_styles.cancel') }}</el-button>
            <el-button type="primary" @click="saveSetAvatarStylesDialog">{{
                t('dialog.set_avatar_styles.save')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { watch, defineEmits } from 'vue';

    import { useI18n } from 'vue-i18n';
    import { arraysMatch } from '../../../shared/utils';
    import { avatarRequest } from '../../../api';
    import { useAvatarStore } from '../../../stores';
    import { ElMessage } from 'element-plus';

    const { t } = useI18n();
    const { applyAvatar } = useAvatarStore();

    const props = defineProps({
        setAvatarStylesDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['update:setAvatarStylesDialog']);

    watch(
        () => props.setAvatarStylesDialog.visible,
        (newVal) => {
            if (newVal) {
                getAvatarStyles();
            }
        }
    );

    async function getAvatarStyles() {
        const ref = await avatarRequest.getAvailableAvatarStyles();
        const styles = [];
        const stylesMap = new Map();
        for (const style of ref.json) {
            styles.push(style.styleName);
            stylesMap.set(style.styleName, style.id);
        }
        props.setAvatarStylesDialog.availableAvatarStyles = styles;
        props.setAvatarStylesDialog.availableAvatarStylesMap = stylesMap;
    }

    function closeSetAvatarStylesDialog() {
        emit('update:setAvatarStylesDialog', {
            ...props.setAvatarStylesDialog,
            visible: false
        });
    }

    function saveSetAvatarStylesDialog() {
        const primaryStyleId =
            props.setAvatarStylesDialog.availableAvatarStylesMap.get(props.setAvatarStylesDialog.primaryStyle) || '';
        const secondaryStyleId =
            props.setAvatarStylesDialog.availableAvatarStylesMap.get(props.setAvatarStylesDialog.secondaryStyle) || '';

        let tags = [];
        for (const tag of props.setAvatarStylesDialog.initialTags) {
            if (!tag.startsWith('author_tag_')) {
                tags.push(tag);
            }
        }
        const authorTagsArray = props.setAvatarStylesDialog.authorTags.split(',');
        for (const tag of authorTagsArray) {
            if (!tag.trim()) {
                continue;
            }
            let tagName = `author_tag_${tag}`;
            if (!tags.includes(tagName)) {
                tags.push(tagName);
            }
        }

        if (
            props.setAvatarStylesDialog.initialPrimaryStyle === props.setAvatarStylesDialog.primaryStyle &&
            props.setAvatarStylesDialog.initialSecondaryStyle === props.setAvatarStylesDialog.secondaryStyle &&
            arraysMatch(props.setAvatarStylesDialog.initialTags, tags)
        ) {
            closeSetAvatarStylesDialog();
            return;
        }

        const params = {
            id: props.setAvatarStylesDialog.avatarId,
            primaryStyle: primaryStyleId,
            secondaryStyle: secondaryStyleId,
            tags
        };
        avatarRequest
            .saveAvatar(params)
            .then((args) => {
                applyAvatar(args.json);
                ElMessage({ message: t('dialog.set_avatar_styles.save_success'), type: 'success' });
                closeSetAvatarStylesDialog();
            })
            .catch((error) => {
                ElMessage({ message: t('dialog.set_avatar_styles.save_failed'), type: 'error' });
                console.error('Error saving avatar styles:', error);
            });
    }
</script>

<style scoped></style>
