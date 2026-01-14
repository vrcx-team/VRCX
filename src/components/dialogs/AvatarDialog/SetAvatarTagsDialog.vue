<template>
    <el-dialog
        ref="setAvatarTagsDialog"
        class="x-dialog"
        :model-value="setAvatarTagsDialog.visible"
        @close="closeSetAvatarTagsDialog"
        :title="t('dialog.set_avatar_tags.header')"
        width="780px"
        append-to-body>
        <template v-if="setAvatarTagsDialog.visible">
            <label class="inline-flex items-center gap-2">
                <Checkbox v-model="setAvatarTagsDialog.contentHorror" @update:modelValue="updateSelectedAvatarTags" />
                <span>{{ t('dialog.set_avatar_tags.content_horror') }}</span>
            </label>
            <label class="inline-flex items-center gap-2">
                <Checkbox v-model="setAvatarTagsDialog.contentGore" @update:modelValue="updateSelectedAvatarTags" />
                <span>{{ t('dialog.set_avatar_tags.content_gore') }}</span>
            </label>
            <label class="inline-flex items-center gap-2">
                <Checkbox v-model="setAvatarTagsDialog.contentViolence" @update:modelValue="updateSelectedAvatarTags" />
                <span>{{ t('dialog.set_avatar_tags.content_violence') }}</span>
            </label>
            <label class="inline-flex items-center gap-2">
                <Checkbox v-model="setAvatarTagsDialog.contentAdult" @update:modelValue="updateSelectedAvatarTags" />
                <span>{{ t('dialog.set_avatar_tags.content_adult') }}</span>
            </label>
            <label class="inline-flex items-center gap-2">
                <Checkbox v-model="setAvatarTagsDialog.contentSex" @update:modelValue="updateSelectedAvatarTags" />
                <span>{{ t('dialog.set_avatar_tags.content_sex') }}</span>
            </label>
            <br />
            <InputGroupTextareaField
                v-model="setAvatarTagsDialog.selectedTagsCsv"
                :rows="2"
                :placeholder="t('dialog.set_avatar_tags.custom_tags_placeholder')"
                style="margin-top: 10px"
                input-class="resize-none"
                @input="updateInputAvatarTags" />
            <br />
            <br />
            <template
                v-if="setAvatarTagsDialog.ownAvatars.length === props.setAvatarTagsDialog.selectedAvatarIds.length">
                <Button size="sm" variant="outline" @click="setAvatarTagsSelectToggle">{{
                    t('dialog.set_avatar_tags.select_none')
                }}</Button>
            </template>
            <template v-else>
                <Button size="sm" variant="outline" @click="setAvatarTagsSelectToggle">{{
                    t('dialog.set_avatar_tags.select_all')
                }}</Button>
            </template>
            <span style="margin-left: 5px"
                >{{ props.setAvatarTagsDialog.selectedAvatarIds.length }} /
                {{ setAvatarTagsDialog.ownAvatars.length }}</span
            >
            <Loader2 v-if="setAvatarTagsDialog.loading" class="is-loading" style="margin-left: 5px" />
            <br />
            <div class="x-friend-list" style="margin-top: 10px; min-height: 60px; max-height: 280px">
                <div
                    v-for="avatar in setAvatarTagsDialog.ownAvatars"
                    :key="avatar.id"
                    :class="['item-width', 'x-friend-item', 'x-friend-item-border']"
                    @click="showAvatarDialog(avatar.id)">
                    <div class="avatar">
                        <img v-if="avatar.thumbnailImageUrl" :src="avatar.thumbnailImageUrl" loading="lazy" />
                    </div>
                    <div class="detail">
                        <span class="name" v-text="avatar.name"></span>
                        <span
                            v-if="avatar.releaseStatus === 'public'"
                            class="extra"
                            style="color: var(--el-color-success)"
                            v-text="avatar.releaseStatus"></span>
                        <span
                            v-else-if="avatar.releaseStatus === 'private'"
                            class="extra"
                            style="color: var(--el-color-danger)"
                            v-text="avatar.releaseStatus"></span>
                        <span v-else class="extra" v-text="avatar.releaseStatus"></span>
                        <span class="extra" v-text="avatarTagStrings.get(avatar.id)"></span>
                    </div>
                    <Button size="sm" variant="ghost" style="margin-left: 5px" @click.stop>
                        <Checkbox
                            :model-value="props.setAvatarTagsDialog.selectedAvatarIds.includes(avatar.id)"
                            @update:modelValue="(val) => toggleAvatarSelection(avatar.id, val)" />
                    </Button>
                </div>
            </div>
        </template>
        <template #footer>
            <Button variant="secondary" class="mr-2" @click="closeSetAvatarTagsDialog">{{
                t('dialog.set_avatar_tags.cancel')
            }}</Button>
            <Button @click="saveSetAvatarTagsDialog">{{ t('dialog.set_avatar_tags.save') }}</Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Loader2 } from 'lucide-vue-next';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { watch } from 'vue';

    import { avatarRequest } from '../../../api';
    import { removeFromArray } from '../../../shared/utils';
    import { useAvatarStore } from '../../../stores';

    const { showAvatarDialog, applyAvatar } = useAvatarStore();
    const { cachedAvatars } = useAvatarStore();

    const { t } = useI18n();
    const props = defineProps({
        setAvatarTagsDialog: {
            type: Object,
            required: true
        }
    });
    const avatarTagStrings = new Map();

    const emit = defineEmits(['update:setAvatarTagsDialog']);

    watch(
        () => props.setAvatarTagsDialog.visible,
        (newVal) => {
            if (newVal) {
                updateAvatarTagsString();
                updateSelectedAvatarTags();
                updateInputAvatarTags();
            }
        }
    );

    function closeSetAvatarTagsDialog() {
        emit('update:setAvatarTagsDialog', {
            ...props.setAvatarTagsDialog,
            visible: false
        });
    }

    function updateSelectedAvatarTags() {
        const D = props.setAvatarTagsDialog;
        if (D.contentHorror) {
            if (!D.selectedTags.includes('content_horror')) {
                D.selectedTags.push('content_horror');
            }
        } else if (D.selectedTags.includes('content_horror')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_horror'), 1);
        }
        if (D.contentGore) {
            if (!D.selectedTags.includes('content_gore')) {
                D.selectedTags.push('content_gore');
            }
        } else if (D.selectedTags.includes('content_gore')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_gore'), 1);
        }
        if (D.contentViolence) {
            if (!D.selectedTags.includes('content_violence')) {
                D.selectedTags.push('content_violence');
            }
        } else if (D.selectedTags.includes('content_violence')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_violence'), 1);
        }
        if (D.contentAdult) {
            if (!D.selectedTags.includes('content_adult')) {
                D.selectedTags.push('content_adult');
            }
        } else if (D.selectedTags.includes('content_adult')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_adult'), 1);
        }
        if (D.contentSex) {
            if (!D.selectedTags.includes('content_sex')) {
                D.selectedTags.push('content_sex');
            }
        } else if (D.selectedTags.includes('content_sex')) {
            D.selectedTags.splice(D.selectedTags.indexOf('content_sex'), 1);
        }

        D.selectedTagsCsv = D.selectedTags.join(',').replace(/content_/g, '');
    }

    function toggleAvatarSelection(avatarId, checked) {
        const D = props.setAvatarTagsDialog;
        const isSelected = D.selectedAvatarIds.includes(avatarId);
        const shouldSelect = typeof checked === 'boolean' ? checked : !isSelected;
        if (shouldSelect && !isSelected) {
            D.selectedAvatarIds.push(avatarId);
        } else if (!shouldSelect && isSelected) {
            removeFromArray(D.selectedAvatarIds, avatarId);
        }
    }

    function updateAvatarTagsString() {
        const D = props.setAvatarTagsDialog;
        for (const ref of D.ownAvatars) {
            if (!ref) {
                continue;
            }
            let tagString = '';
            const contentTags = [];
            ref.tags.forEach((tag) => {
                if (tag.startsWith('content_')) {
                    contentTags.push(tag.substring(8));
                }
            });
            for (let i = 0; i < contentTags.length; ++i) {
                const tag = contentTags[i];
                if (i < contentTags.length - 1) {
                    tagString += `${tag}, `;
                } else {
                    tagString += tag;
                }
            }
            avatarTagStrings.set(ref.id, tagString);
        }
    }

    function setAvatarTagsSelectToggle() {
        const D = props.setAvatarTagsDialog;
        const allSelected = D.ownAvatars.length === D.selectedAvatarIds.length;
        for (const ref of D.ownAvatars) {
            if (!allSelected) {
                if (!D.selectedAvatarIds.includes(ref.id)) {
                    D.selectedAvatarIds.push(ref.id);
                }
            } else {
                removeFromArray(D.selectedAvatarIds, ref.id);
            }
        }
    }

    async function saveSetAvatarTagsDialog() {
        const D = props.setAvatarTagsDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        try {
            for (const avatarId of D.selectedAvatarIds) {
                console.log('Saving tags for avatar', avatarId);
                const ref = cachedAvatars.get(avatarId);
                if (!D.visible || !ref) {
                    console.error('Aborting avatar tag save, dialog closed or avatar not found', avatarId);
                    break;
                }
                const tags = [...D.selectedTags];
                for (const tag of ref.tags) {
                    if (!tag.startsWith('content_')) {
                        tags.push(tag);
                    }
                }
                const args = await avatarRequest.saveAvatar({
                    id: ref.id,
                    tags
                });
                applyAvatar(args.json);
            }
        } catch (err) {
            console.error(err);
            toast.error('Error saving avatar tags');
        } finally {
            D.loading = false;
            D.visible = false;
        }
    }

    function updateInputAvatarTags() {
        const D = props.setAvatarTagsDialog;
        D.contentHorror = false;
        D.contentGore = false;
        D.contentViolence = false;
        D.contentAdult = false;
        D.contentSex = false;
        const tags = D.selectedTagsCsv.split(',');
        D.selectedTags = [];
        for (const tag of tags) {
            switch (tag) {
                case 'horror':
                    D.contentHorror = true;
                    break;
                case 'gore':
                    D.contentGore = true;
                    break;
                case 'violence':
                    D.contentViolence = true;
                    break;
                case 'adult':
                    D.contentAdult = true;
                    break;
                case 'sex':
                    D.contentSex = true;
                    break;
            }
            if (tag && !D.selectedTags.includes(`content_${tag}`)) {
                D.selectedTags.push(`content_${tag}`);
            }
        }
    }
</script>

<style scoped>
    .item-width {
        width: 335px;
    }
</style>
