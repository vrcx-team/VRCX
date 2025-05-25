<template>
    <safe-dialog
        ref="setAvatarStylesDialog"
        class="x-dialog"
        :visible.sync="setAvatarStylesDialog.visible"
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
            <div style="font-size: 12px; margin-top: 10px">{{ $t('dialog.set_world_tags.author_tags') }}<br /></div>
            <el-input
                v-model="setAvatarStylesDialog.authorTags"
                type="textarea"
                size="mini"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 5 }"
                placeholder=""
                style="margin-top: 10px"></el-input>
        </template>
        <template #footer>
            <el-button size="small" @click="setAvatarStylesDialog.visible = false">{{
                t('dialog.set_avatar_styles.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="saveSetAvatarStylesDialog">{{
                t('dialog.set_avatar_styles.save')
            }}</el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { watch, getCurrentInstance } from 'vue';

    import { useI18n } from 'vue-i18n-bridge';
    import utils from '../../../classes/utils';
    import { avatarRequest } from '../../../api';

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const props = defineProps({
        setAvatarStylesDialog: {
            type: Object,
            required: true
        }
    });

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
            utils.arraysMatch(props.setAvatarStylesDialog.initialTags, tags)
        ) {
            props.setAvatarStylesDialog.visible = false;
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
            .then(() => {
                $message.success(t('dialog.set_avatar_styles.save_success'));
                props.setAvatarStylesDialog.visible = false;
            })
            .catch((error) => {
                $message.error(t('dialog.set_avatar_styles.save_failed'));
                console.error('Error saving avatar styles:', error);
            });
    }
</script>

<style scoped></style>
