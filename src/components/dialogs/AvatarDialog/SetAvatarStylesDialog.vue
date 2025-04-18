<template>
    <el-dialog
        ref="setAvatarStylesDialog"
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible.sync="setAvatarStylesDialog.visible"
        :title="t('dialog.set_avatar_styles.header')"
        width="400px"
        append-to-body
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
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
        </template>
        <template #footer>
            <el-button size="small" @click="setAvatarStylesDialog.visible = false">{{
                t('dialog.set_avatar_styles.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="saveSetAvatarStylesDialog">{{
                t('dialog.set_avatar_styles.save')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { inject, watch, getCurrentInstance } from 'vue';

    import { useI18n } from 'vue-i18n-bridge';
    import { avatarRequest } from '../../../api';

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');

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
        if (
            props.setAvatarStylesDialog.initialPrimaryStyle === props.setAvatarStylesDialog.primaryStyle &&
            props.setAvatarStylesDialog.initialSecondaryStyle === props.setAvatarStylesDialog.secondaryStyle
        ) {
            props.setAvatarStylesDialog.visible = false;
            return;
        }

        const primaryStyleId =
            props.setAvatarStylesDialog.availableAvatarStylesMap.get(props.setAvatarStylesDialog.primaryStyle) || '';
        const secondaryStyleId =
            props.setAvatarStylesDialog.availableAvatarStylesMap.get(props.setAvatarStylesDialog.secondaryStyle) || '';

        const params = {
            id: props.setAvatarStylesDialog.avatarId,
            primaryStyle: primaryStyleId,
            secondaryStyle: secondaryStyleId
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
