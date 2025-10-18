<template>
    <el-dialog
        v-model="groupPostEditDialog.visible"
        :title="t('dialog.group_post_edit.header')"
        width="650px"
        append-to-body>
        <div v-if="groupPostEditDialog.visible">
            <h3 v-text="groupPostEditDialog.groupRef.name"></h3>
            <el-form :model="groupPostEditDialog" label-width="150px">
                <el-form-item :label="t('dialog.group_post_edit.title')">
                    <el-input v-model="groupPostEditDialog.title" size="small"></el-input>
                </el-form-item>
                <el-form-item :label="t('dialog.group_post_edit.message')">
                    <el-input
                        v-model="groupPostEditDialog.text"
                        type="textarea"
                        :rows="4"
                        :autosize="{ minRows: 4, maxRows: 20 }"
                        style="margin-top: 10px"
                        resize="none"></el-input>
                </el-form-item>
                <el-form-item>
                    <el-checkbox
                        v-if="!groupPostEditDialog.postId"
                        v-model="groupPostEditDialog.sendNotification"
                        size="small">
                        {{ t('dialog.group_post_edit.send_notification') }}
                    </el-checkbox>
                </el-form-item>
                <el-form-item :label="t('dialog.group_post_edit.post_visibility')">
                    <el-radio-group v-model="groupPostEditDialog.visibility" size="small">
                        <el-radio label="public">
                            {{ t('dialog.group_post_edit.visibility_public') }}
                        </el-radio>
                        <el-radio label="group">
                            {{ t('dialog.group_post_edit.visibility_group') }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="groupPostEditDialog.visibility === 'group'" :label="t('dialog.new_instance.roles')">
                    <el-select
                        v-model="groupPostEditDialog.roleIds"
                        multiple
                        clearable
                        :placeholder="t('dialog.new_instance.role_placeholder')"
                        style="width: 100%">
                        <el-option-group :label="t('dialog.new_instance.role_placeholder')">
                            <el-option
                                v-for="role in groupPostEditDialog.groupRef?.roles"
                                :key="role.id"
                                :label="role.name"
                                :value="role.id"
                                style="height: auto; width: 478px">
                                <div class="detail">
                                    <span class="name" v-text="role.name"></span>
                                </div>
                            </el-option>
                        </el-option-group>
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('dialog.group_post_edit.image')">
                    <template v-if="gallerySelectDialog.selectedFileId">
                        <div style="display: inline-block; flex: none; margin-right: 5px">
                            <img
                                :src="gallerySelectDialog.selectedImageUrl"
                                style="flex: none; width: 60px; height: 60px; border-radius: 4px; object-fit: cover"
                                @click="showFullscreenImageDialog(gallerySelectDialog.selectedImageUrl)"
                                loading="lazy" />
                            <el-button size="small" style="vertical-align: top" @click="clearImageGallerySelect">
                                {{ t('dialog.invite_message.clear_selected_image') }}
                            </el-button>
                        </div>
                    </template>
                    <template v-else>
                        <el-button size="small" style="margin-right: 5px" @click="showGallerySelectDialog">
                            {{ t('dialog.invite_message.select_image') }}
                        </el-button>
                    </template>
                </el-form-item>
            </el-form>
        </div>
        <template #footer>
            <el-button @click="groupPostEditDialog.visible = false">
                {{ t('dialog.group_post_edit.cancel') }}
            </el-button>
            <el-button v-if="groupPostEditDialog.postId" @click="editGroupPost">
                {{ t('dialog.group_post_edit.edit_post') }}
            </el-button>
            <el-button v-else @click="createGroupPost">
                {{ t('dialog.group_post_edit.create_post') }}
            </el-button>
        </template>
        <GallerySelectDialog
            :gallery-select-dialog="gallerySelectDialog"
            :gallery-table="galleryTable"
            @refresh-gallery-table="refreshGalleryTable" />
    </el-dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { ElMessage } from 'element-plus';
    import { useI18n } from 'vue-i18n';

    import { groupRequest, vrcPlusIconRequest } from '../../../api';
    import { useGalleryStore, useGroupStore } from '../../../stores';

    import GallerySelectDialog from './GallerySelectDialog.vue';

    const props = defineProps({
        dialogData: {
            type: Object,
            required: true
        },
        selectedGalleryFile: { type: Object, default: () => ({}) }
    });

    const emit = defineEmits(['update:dialogData']);

    const { t } = useI18n();

    const { showFullscreenImageDialog, handleFilesList } = useGalleryStore();
    const { handleGroupPost } = useGroupStore();

    const gallerySelectDialog = ref({
        visible: false,
        selectedFileId: '',
        selectedImageUrl: ''
    });
    const galleryTable = ref([]);

    const groupPostEditDialog = computed({
        get() {
            return props.dialogData;
        },
        set(value) {
            emit('update:dialogData', value);
        }
    });

    function showGallerySelectDialog() {
        const D = gallerySelectDialog.value;
        D.visible = true;
        refreshGalleryTable();
    }
    async function refreshGalleryTable() {
        const params = {
            n: 100,
            tag: 'gallery'
        };
        const args = await vrcPlusIconRequest.getFileList(params);
        handleFilesList(args);
        if (args.params.tag === 'gallery') {
            galleryTable.value = args.json.reverse();
        }
    }
    function editGroupPost() {
        const D = groupPostEditDialog.value;
        if (!D.groupId || !D.postId) {
            return;
        }
        if (!D.title || !D.text) {
            ElMessage({
                message: 'Title and text are required',
                type: 'warning'
            });
            return;
        }
        const params = {
            groupId: D.groupId,
            postId: D.postId,
            title: D.title,
            text: D.text,
            roleIds: D.roleIds,
            visibility: D.visibility,
            imageId: null
        };
        if (gallerySelectDialog.value.selectedFileId) {
            params.imageId = gallerySelectDialog.value.selectedFileId;
        }
        groupRequest.editGroupPost(params).then((args) => {
            handleGroupPost(args);
            ElMessage({
                message: 'Group post edited',
                type: 'success'
            });
            return args;
        });
        D.visible = false;
    }
    function createGroupPost() {
        const D = groupPostEditDialog.value;
        if (!D.title || !D.text) {
            ElMessage({
                message: 'Title and text are required',
                type: 'warning'
            });
            return;
        }
        const params = {
            groupId: D.groupId,
            title: D.title,
            text: D.text,
            roleIds: D.roleIds,
            visibility: D.visibility,
            sendNotification: D.sendNotification,
            imageId: null
        };
        if (gallerySelectDialog.value.selectedFileId) {
            params.imageId = gallerySelectDialog.value.selectedFileId;
        }
        groupRequest.createGroupPost(params).then((args) => {
            handleGroupPost();
            ElMessage({
                message: 'Group post created',
                type: 'success'
            });
            return args;
        });
        D.visible = false;
    }
    function clearImageGallerySelect() {
        const D = gallerySelectDialog.value;
        D.selectedFileId = '';
        D.selectedImageUrl = '';
    }
</script>
