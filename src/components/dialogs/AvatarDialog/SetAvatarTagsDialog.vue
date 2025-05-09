<template>
    <safe-dialog
        ref="setAvatarTagsDialog"
        class="x-dialog"
        :visible.sync="setAvatarTagsDialog.visible"
        :title="t('dialog.set_avatar_tags.header')"
        width="770px"
        append-to-body>
        <template v-if="setAvatarTagsDialog.visible">
            <el-checkbox v-model="setAvatarTagsDialog.contentHorror" @change="updateSelectedAvatarTags">{{
                t('dialog.set_avatar_tags.content_horror')
            }}</el-checkbox>
            <br />
            <el-checkbox v-model="setAvatarTagsDialog.contentGore" @change="updateSelectedAvatarTags">{{
                t('dialog.set_avatar_tags.content_gore')
            }}</el-checkbox>
            <br />
            <el-checkbox v-model="setAvatarTagsDialog.contentViolence" @change="updateSelectedAvatarTags">{{
                t('dialog.set_avatar_tags.content_violence')
            }}</el-checkbox>
            <br />
            <el-checkbox v-model="setAvatarTagsDialog.contentAdult" @change="updateSelectedAvatarTags">{{
                t('dialog.set_avatar_tags.content_adult')
            }}</el-checkbox>
            <br />
            <el-checkbox v-model="setAvatarTagsDialog.contentSex" @change="updateSelectedAvatarTags">{{
                t('dialog.set_avatar_tags.content_sex')
            }}</el-checkbox>
            <br />
            <el-input
                v-model="setAvatarTagsDialog.selectedTagsCsv"
                size="mini"
                :autosize="{ minRows: 2, maxRows: 5 }"
                :placeholder="t('dialog.set_avatar_tags.custom_tags_placeholder')"
                style="margin-top: 10px"
                @input="updateInputAvatarTags"></el-input>
            <template v-if="setAvatarTagsDialog.ownAvatars.length === setAvatarTagsDialog.selectedCount">
                <el-button size="small" @click="setAvatarTagsSelectToggle">{{
                    t('dialog.set_avatar_tags.select_none')
                }}</el-button>
            </template>
            <template v-else>
                <el-button size="small" @click="setAvatarTagsSelectToggle">{{
                    t('dialog.set_avatar_tags.select_all')
                }}</el-button>
            </template>
            <span style="margin-left: 5px"
                >{{ setAvatarTagsDialog.selectedCount }} / {{ setAvatarTagsDialog.ownAvatars.length }}</span
            >
            <span v-if="setAvatarTagsDialog.loading" style="margin-left: 5px">
                <i class="el-icon-loading"></i>
            </span>
            <br />
            <div class="x-friend-list" style="margin-top: 10px; min-height: 60px; max-height: 280px">
                <div
                    v-for="avatar in setAvatarTagsDialog.ownAvatars"
                    :key="avatar.id"
                    class="x-friend-item x-friend-item-border"
                    style="width: 350px"
                    @click="showAvatarDialog(avatar.id)">
                    <div class="avatar">
                        <img v-if="avatar.thumbnailImageUrl" v-lazy="avatar.thumbnailImageUrl" />
                    </div>
                    <div class="detail">
                        <span class="name" v-text="avatar.name"></span>
                        <span
                            v-if="avatar.releaseStatus === 'public'"
                            class="extra"
                            style="color: #67c23a"
                            v-text="avatar.releaseStatus"></span>
                        <span
                            v-else-if="avatar.releaseStatus === 'private'"
                            class="extra"
                            style="color: #f56c6c"
                            v-text="avatar.releaseStatus"></span>
                        <span v-else class="extra" v-text="avatar.releaseStatus"></span>
                        <span class="extra" v-text="avatar.$tagString"></span>
                    </div>
                    <el-button type="text" size="mini" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="avatar.$selected" @change="updateAvatarTagsSelection"></el-checkbox>
                    </el-button>
                </div>
            </div>
        </template>
        <template #footer>
            <el-button size="small" @click="setAvatarTagsDialog.visible = false">{{
                t('dialog.set_avatar_tags.cancel')
            }}</el-button>
            <el-button type="primary" size="small" @click="saveSetAvatarTagsDialog">{{
                t('dialog.set_avatar_tags.save')
            }}</el-button>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { inject, watch, getCurrentInstance } from 'vue';

    import { useI18n } from 'vue-i18n-bridge';
    import { avatarRequest } from '../../../api';

    const showAvatarDialog = inject('showAvatarDialog');

    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const props = defineProps({
        setAvatarTagsDialog: {
            type: Object,
            required: true
        }
    });

    watch(
        () => props.setAvatarTagsDialog.visible,
        (newVal) => {
            if (newVal) {
                updateAvatarTagsSelection();
                updateSelectedAvatarTags();
                updateInputAvatarTags();
            }
        }
    );

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

    function updateAvatarTagsSelection() {
        const D = props.setAvatarTagsDialog;
        D.selectedCount = 0;
        for (const ref of D.ownAvatars) {
            if (ref.$selected) {
                D.selectedCount++;
            }
            ref.$tagString = '';
            const contentTags = [];
            ref.tags.forEach((tag) => {
                if (tag.startsWith('content_')) {
                    contentTags.push(tag.substring(8));
                }
            });
            for (let i = 0; i < contentTags.length; ++i) {
                const tag = contentTags[i];
                if (i < contentTags.length - 1) {
                    ref.$tagString += `${tag}, `;
                } else {
                    ref.$tagString += tag;
                }
            }
        }
        // props.setAvatarTagsDialog.forceUpdate++;
    }

    function setAvatarTagsSelectToggle() {
        const D = props.setAvatarTagsDialog;
        const allSelected = D.ownAvatars.length === D.selectedCount;
        for (const ref of D.ownAvatars) {
            ref.$selected = !allSelected;
        }
        updateAvatarTagsSelection();
    }

    async function saveSetAvatarTagsDialog() {
        const D = props.setAvatarTagsDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        try {
            for (let i = D.ownAvatars.length - 1; i >= 0; --i) {
                const ref = D.ownAvatars[i];
                if (!D.visible) {
                    break;
                }
                if (!ref.$selected) {
                    continue;
                }
                const tags = [...D.selectedTags];
                for (const tag of ref.tags) {
                    if (!tag.startsWith('content_')) {
                        tags.push(tag);
                    }
                }
                await avatarRequest.saveAvatar({
                    id: ref.id,
                    tags
                });
                D.selectedCount--;
            }
        } catch (err) {
            console.error(err);
            $message({
                message: 'Error saving avatar tags',
                type: 'error'
            });
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

    // useless
    // $app.data.avatarContentTags = [
    //     'content_horror',
    //     'content_gore',
    //     'content_violence',
    //     'content_adult',
    //     'content_sex'
    // ];
</script>

<style scoped></style>
