<template>
    <el-dialog
        ref="setAvatarStylesDialog"
        class="x-dialog"
        :model-value="setAvatarStylesDialog.visible"
        :title="t('dialog.set_avatar_styles.header')"
        width="400px"
        append-to-body
        @close="closeSetAvatarStylesDialog">
        <template v-if="setAvatarStylesDialog.visible">
            <div>
                <span>{{ t('dialog.set_avatar_styles.primary_style') }}</span>
                <Select
                    :model-value="setAvatarStylesDialog.primaryStyle"
                    @update:modelValue="(v) => updateDialog({ primaryStyle: v === SELECT_CLEAR_VALUE ? '' : v })">
                    <SelectTrigger size="sm" style="display: inline-flex">
                        <SelectValue :placeholder="t('dialog.set_avatar_styles.select_style')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem :value="SELECT_CLEAR_VALUE">{{ t('dialog.gallery_select.none') }}</SelectItem>
                        <SelectItem
                            v-for="(style, index) in setAvatarStylesDialog.availableAvatarStyles"
                            :key="index"
                            :value="style">
                            {{ style }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <br />

            <div>
                <span>{{ t('dialog.set_avatar_styles.secondary_style') }}</span>
                <Select
                    :model-value="setAvatarStylesDialog.secondaryStyle"
                    @update:modelValue="(v) => updateDialog({ secondaryStyle: v === SELECT_CLEAR_VALUE ? '' : v })">
                    <SelectTrigger size="sm" style="display: inline-flex">
                        <SelectValue :placeholder="t('dialog.set_avatar_styles.select_style')" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem :value="SELECT_CLEAR_VALUE">{{ t('dialog.gallery_select.none') }}</SelectItem>
                        <SelectItem
                            v-for="(style, index) in setAvatarStylesDialog.availableAvatarStyles"
                            :key="index"
                            :value="style">
                            {{ style }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <br />

            <div style="font-size: 12px; margin-top: 10px">{{ t('dialog.set_world_tags.author_tags') }}<br /></div>

            <el-input
                :model-value="setAvatarStylesDialog.authorTags"
                type="textarea"
                size="small"
                show-word-limit
                :autosize="{ minRows: 2, maxRows: 5 }"
                placeholder=""
                style="margin-top: 10px"
                @update:modelValue="(v) => updateDialog({ authorTags: v })" />
        </template>

        <template #footer>
            <el-button @click="closeSetAvatarStylesDialog">{{ t('dialog.set_avatar_styles.cancel') }}</el-button>
            <el-button type="primary" @click="saveSetAvatarStylesDialog">
                {{ t('dialog.set_avatar_styles.save') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { watch } from 'vue';

    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
    import { arraysMatch } from '../../../shared/utils';
    import { avatarRequest } from '../../../api';
    import { useAvatarStore } from '../../../stores';

    const props = defineProps({
        setAvatarStylesDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['update:setAvatarStylesDialog']);

    const { t } = useI18n();
    const { applyAvatar } = useAvatarStore();

    const SELECT_CLEAR_VALUE = '__clear__';

    watch(
        () => props.setAvatarStylesDialog.visible,
        (newVal) => {
            if (newVal) {
                getAvatarStyles();
            }
        }
    );

    function updateDialog(patch) {
        emit('update:setAvatarStylesDialog', {
            ...props.setAvatarStylesDialog,
            ...patch
        });
    }

    async function getAvatarStyles() {
        try {
            const ref = await avatarRequest.getAvailableAvatarStyles();
            const styles = [];
            const stylesMap = new Map();
            for (const style of ref.json) {
                styles.push(style.styleName);
                stylesMap.set(style.styleName, style.id);
            }

            updateDialog({
                availableAvatarStyles: styles,
                availableAvatarStylesMap: stylesMap
            });
        } catch (error) {
            console.error('Error loading avatar styles:', error);
        }
    }

    function closeSetAvatarStylesDialog() {
        updateDialog({ visible: false });
    }

    function saveSetAvatarStylesDialog() {
        const primaryStyleId =
            props.setAvatarStylesDialog.availableAvatarStylesMap.get(props.setAvatarStylesDialog.primaryStyle) || '';
        const secondaryStyleId =
            props.setAvatarStylesDialog.availableAvatarStylesMap.get(props.setAvatarStylesDialog.secondaryStyle) || '';

        const tags = [];
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
            const tagName = `author_tag_${tag}`;
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
                toast.success(t('dialog.set_avatar_styles.save_success'));
                closeSetAvatarStylesDialog();
            })
            .catch((error) => {
                toast.error(t('dialog.set_avatar_styles.save_failed'));
                console.error('Error saving avatar styles:', error);
            });
    }
</script>

<style scoped></style>
