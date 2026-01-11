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
                    <label v-if="!groupPostEditDialog.postId" class="inline-flex items-center gap-2">
                        <Checkbox v-model="groupPostEditDialog.sendNotification" />
                        <span>{{ t('dialog.group_post_edit.send_notification') }}</span>
                    </label>
                </el-form-item>
                <el-form-item :label="t('dialog.group_post_edit.post_visibility')">
                    <RadioGroup v-model="groupPostEditDialog.visibility" class="flex items-center gap-4">
                        <div class="flex items-center space-x-2">
                            <RadioGroupItem id="groupPostVisibility-public" value="public" />
                            <label for="groupPostVisibility-public">
                                {{ t('dialog.group_post_edit.visibility_public') }}
                            </label>
                        </div>
                        <div class="flex items-center space-x-2">
                            <RadioGroupItem id="groupPostVisibility-group" value="group" />
                            <label for="groupPostVisibility-group">
                                {{ t('dialog.group_post_edit.visibility_group') }}
                            </label>
                        </div>
                    </RadioGroup>
                </el-form-item>
                <el-form-item v-if="groupPostEditDialog.visibility === 'group'" :label="t('dialog.new_instance.roles')">
                    <Select
                        multiple
                        :model-value="Array.isArray(groupPostEditDialog.roleIds) ? groupPostEditDialog.roleIds : []"
                        @update:modelValue="handleRoleIdsChange">
                        <SelectTrigger size="sm" class="w-full">
                            <SelectValue>
                                <span class="truncate">
                                    {{ selectedRoleSummary || t('dialog.new_instance.role_placeholder') }}
                                </span>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="role in groupPostEditDialog.groupRef?.roles ?? []"
                                    :key="role.id"
                                    :value="role.id">
                                    {{ role.name }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </el-form-item>
                <el-form-item :label="t('dialog.group_post_edit.image')">
                    <template v-if="gallerySelectDialog.selectedFileId">
                        <div style="display: inline-block; flex: none; margin-right: 5px">
                            <img
                                :src="gallerySelectDialog.selectedImageUrl"
                                style="flex: none; width: 60px; height: 60px; border-radius: 4px; object-fit: cover"
                                @click="showFullscreenImageDialog(gallerySelectDialog.selectedImageUrl)"
                                loading="lazy" />
                            <Button
                                size="sm"
                                variant="outline"
                                style="vertical-align: top"
                                @click="clearImageGallerySelect">
                                {{ t('dialog.invite_message.clear_selected_image') }}
                            </Button>
                        </div>
                    </template>
                    <template v-else>
                        <Button size="sm" variant="outline" @click="showGallerySelectDialog">
                            {{ t('dialog.invite_message.select_image') }}
                        </Button>
                    </template>
                </el-form-item>
            </el-form>
        </div>
        <template #footer>
            <Button variant="secondary" @click="groupPostEditDialog.visible = false">
                {{ t('dialog.group_post_edit.cancel') }}
            </Button>
            <Button v-if="groupPostEditDialog.postId" @click="editGroupPost">
                {{ t('dialog.group_post_edit.edit_post') }}
            </Button>
            <Button v-else @click="createGroupPost">
                {{ t('dialog.group_post_edit.create_post') }}
            </Button>
        </template>
        <GallerySelectDialog
            :gallery-select-dialog="gallerySelectDialog"
            :gallery-table="galleryTable"
            @refresh-gallery-table="refreshGalleryTable" />
    </el-dialog>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
    import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
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

    const selectedRoleSummary = computed(() => {
        const ids = groupPostEditDialog.value.roleIds ?? [];
        if (!Array.isArray(ids) || ids.length === 0) {
            return '';
        }
        const roleById = new Map((groupPostEditDialog.value.groupRef?.roles ?? []).map((r) => [r.id, r.name]));
        const names = ids.map((id) => roleById.get(id) ?? String(id));
        return names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '');
    });

    function handleRoleIdsChange(value) {
        const next = Array.isArray(value) ? value.map((v) => String(v ?? '')).filter(Boolean) : [];
        groupPostEditDialog.value.roleIds = next;
    }

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
            toast.warning('Title and text are required');
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
            toast.success('Group post edited');
        });
        D.visible = false;
    }
    function createGroupPost() {
        const D = groupPostEditDialog.value;
        if (!D.title || !D.text) {
            toast.warning('Title and text are required');
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
            handleGroupPost(args);
            toast.success('Group post created');
        });
        D.visible = false;
    }
    function clearImageGallerySelect() {
        const D = gallerySelectDialog.value;
        D.selectedFileId = '';
        D.selectedImageUrl = '';
    }
</script>
