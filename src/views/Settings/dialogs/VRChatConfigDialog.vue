<template>
    <Dialog :open="isVRChatConfigDialogVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.config_json.header') }}</DialogTitle>
            </DialogHeader>
            <div>
                <div style="font-size: 12px; word-break: keep-all">
                    {{ t('dialog.config_json.description1') }} <br />
                    {{ t('dialog.config_json.description2') }}
                </div>
                <br />
                <span style="margin-right: 5px">{{ t('dialog.config_json.cache_size') }}</span>
                <span v-text="VRChatUsedCacheSize"></span>
                <span>/</span>
                <span v-text="totalCacheSize"></span>
                <span>GB</span>
                <TooltipWrapper side="top" :content="t('dialog.config_json.refresh')">
                    <Button
                        class="rounded-full"
                        variant="outline"
                        size="icon-sm"
                        :disabled="VRChatCacheSizeLoading"
                        style="margin-left: 5px"
                        @click="getVRChatCacheSize">
                        <Spinner v-if="VRChatCacheSizeLoading" />
                        <RefreshCw v-else />
                    </Button>
                </TooltipWrapper>

                <div style="margin-top: 10px">
                    <span style="margin-right: 5px">{{ t('dialog.config_json.delete_all_cache') }}</span>
                    <Button
                        size="sm"
                        variant="outline"
                        style="margin-left: 5px"
                        @click="showDeleteAllVRChatCacheConfirm"
                        >{{ t('dialog.config_json.delete_cache') }}</Button
                    >
                </div>

                <div style="margin-top: 10px">
                    <span style="margin-right: 5px">{{ t('dialog.config_json.delete_old_cache') }}</span>
                    <Button size="sm" variant="outline" style="margin-left: 5px" @click="sweepVRChatCache">{{
                        t('dialog.config_json.sweep_cache')
                    }}</Button>
                </div>

                <div v-for="(item, value) in VRChatConfigList" :key="value" style="display: block; margin-top: 10px">
                    <span style="word-break: keep-all">{{ item.name }}:</span>
                    <div style="display: flex">
                        <InputGroupAction
                            v-model="VRChatConfigFile[value]"
                            :placeholder="item.default"
                            size="sm"
                            :type="item.type ? item.type : 'text'"
                            :min="item.min"
                            :max="item.max"
                            @input="refreshDialogValues"
                            style="flex: 1; margin-top: 5px">
                            <template #actions>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    v-if="item.folderBrowser"
                                    @click="openConfigFolderBrowser(value)">
                                </Button>
                            </template>
                        </InputGroupAction>
                    </div>
                </div>

                <div style="display: inline-block; margin-top: 10px">
                    <span>{{ t('dialog.config_json.camera_resolution') }}</span>
                    <br />
                    <Select
                        :model-value="vrchatCameraResolutionKey"
                        @update:modelValue="(v) => (vrchatCameraResolutionKey = v)">
                        <SelectTrigger size="sm" style="margin-top: 5px">
                            <SelectValue :placeholder="getVRChatCameraResolution()" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="row in VRChatCameraResolutions"
                                    :key="row.name"
                                    :value="getVRChatResolutionKey(row)">
                                    {{ row.name }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <br />

                <div style="display: inline-block; margin-top: 10px">
                    <span>{{ t('dialog.config_json.spout_resolution') }}</span>
                    <br />
                    <Select
                        :model-value="vrchatSpoutResolutionKey"
                        @update:modelValue="(v) => (vrchatSpoutResolutionKey = v)">
                        <SelectTrigger size="sm" style="margin-top: 5px">
                            <SelectValue :placeholder="getVRChatSpoutResolution()" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="row in VRChatScreenshotResolutions"
                                    :key="row.name"
                                    :value="getVRChatResolutionKey(row)">
                                    {{ row.name }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <br />

                <div style="display: inline-block; margin-top: 10px">
                    <span>{{ t('dialog.config_json.screenshot_resolution') }}</span>
                    <br />
                    <Select
                        :model-value="vrchatScreenshotResolutionKey"
                        @update:modelValue="(v) => (vrchatScreenshotResolutionKey = v)">
                        <SelectTrigger size="sm" style="margin-top: 5px">
                            <SelectValue :placeholder="getVRChatScreenshotResolution()" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem
                                    v-for="row in VRChatScreenshotResolutions"
                                    :key="row.name"
                                    :value="getVRChatResolutionKey(row)">
                                    {{ row.name }}
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <br />

                <label class="inline-flex items-center gap-2" style="margin-top: 5px; display: block">
                    <Checkbox
                        v-model="VRChatConfigFile.picture_output_split_by_date"
                        @update:modelValue="refreshDialogValues" />
                    <span>{{ t('dialog.config_json.picture_sort_by_date') }}</span>
                </label>
                <label class="inline-flex items-center gap-2" style="margin-top: 5px; display: block">
                    <Checkbox v-model="VRChatConfigFile.disableRichPresence" @update:modelValue="refreshDialogValues" />
                    <span>{{ t('dialog.config_json.disable_discord_presence') }}</span>
                </label>
            </div>
            <DialogFooter>
                <div style="display: flex; align-items: center; justify-content: space-between">
                    <div>
                        <Button
                            variant="ghost"
                            @click="openExternalLink('https://docs.vrchat.com/docs/configuration-file')"
                            >{{ t('dialog.config_json.vrchat_docs') }}</Button
                        >
                    </div>
                    <div>
                        <Button variant="secondary" class="mr-2" @click="closeDialog">{{
                            t('dialog.config_json.cancel')
                        }}</Button>
                        <Button :disabled="loading" @click="saveVRChatConfigFile">{{
                            t('dialog.config_json.save')
                        }}</Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupAction } from '@/components/ui/input-group';
    import { RefreshCw } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useAdvancedSettingsStore, useGameStore, useModalStore } from '../../../stores';
    import { VRChatCameraResolutions, VRChatScreenshotResolutions } from '../../../shared/constants';
    import { getVRChatResolution, openExternalLink } from '../../../shared/utils';

    const { VRChatUsedCacheSize, VRChatTotalCacheSize, VRChatCacheSizeLoading } = storeToRefs(useGameStore());
    const { sweepVRChatCache, getVRChatCacheSize } = useGameStore();
    const { folderSelectorDialog } = useAdvancedSettingsStore();
    const { isVRChatConfigDialogVisible } = storeToRefs(useAdvancedSettingsStore());
    const modalStore = useModalStore();

    const { t } = useI18n();

    const VRChatConfigFile = ref(/** @type {Record<string, any>} */ ({}));
    // it's a object
    const VRChatConfigList = ref(
        /** @type {Record<string, any>} */ ({
            cache_size: {
                name: t('dialog.config_json.max_cache_size'),
                default: '30',
                type: 'number',
                min: 30
            },
            cache_expiry_delay: {
                name: t('dialog.config_json.cache_expiry_delay'),
                default: '30',
                type: 'number',
                min: 30
            },
            cache_directory: {
                name: t('dialog.config_json.cache_directory'),
                default: '%AppData%\\..\\LocalLow\\VRChat\\VRChat',
                folderBrowser: true
            },
            picture_output_folder: {
                name: t('dialog.config_json.picture_directory'),
                // my pictures folder
                default: `%UserProfile%\\Pictures\\VRChat`,
                folderBrowser: true
            },
            // dynamic_bone_max_affected_transform_count: {
            //     name: 'Dynamic Bones Limit Max Transforms (0 disable all transforms)',
            //     default: '32',
            //     type: 'number',
            //     min: 0
            // },
            // dynamic_bone_max_collider_check_count: {
            //     name: 'Dynamic Bones Limit Max Collider Collisions (0 disable all colliders)',
            //     default: '8',
            //     type: 'number',
            //     min: 0
            // },
            fpv_steadycam_fov: {
                name: t('dialog.config_json.fpv_steadycam_fov'),
                default: '50',
                type: 'number',
                min: 30,
                max: 110
            }
        })
    );

    const loading = ref(false);

    watch(
        () => isVRChatConfigDialogVisible.value,
        async (newValue) => {
            if (newValue) {
                loading.value = true;
                await readVRChatConfigFile();
                loading.value = false;
            }
        }
    );

    const totalCacheSize = computed(() => {
        return VRChatConfigFile.value.cache_size || VRChatTotalCacheSize.value;
    });

    const VRCHAT_RESOLUTION_DEFAULT_KEY = '__default__';

    function getVRChatResolutionKey(row) {
        const width = Number(row?.width);
        const height = Number(row?.height);
        if (width > 0 && height > 0) {
            return `${width}x${height}`;
        }
        return VRCHAT_RESOLUTION_DEFAULT_KEY;
    }

    const vrchatCameraResolutionKey = computed({
        get: () => {
            const width = Number(VRChatConfigFile.value.camera_res_width);
            const height = Number(VRChatConfigFile.value.camera_res_height);
            if (width > 0 && height > 0) {
                return `${width}x${height}`;
            }
            return VRCHAT_RESOLUTION_DEFAULT_KEY;
        },
        set: (value) => {
            const row = VRChatCameraResolutions.find((r) => getVRChatResolutionKey(r) === value);
            if (row) {
                setVRChatCameraResolution(row);
            }
        }
    });

    const vrchatSpoutResolutionKey = computed({
        get: () => {
            const width = Number(VRChatConfigFile.value.camera_spout_res_width);
            const height = Number(VRChatConfigFile.value.camera_spout_res_height);
            if (width > 0 && height > 0) {
                return `${width}x${height}`;
            }
            return VRCHAT_RESOLUTION_DEFAULT_KEY;
        },
        set: (value) => {
            const row = VRChatScreenshotResolutions.find((r) => getVRChatResolutionKey(r) === value);
            if (row) {
                setVRChatSpoutResolution(row);
            }
        }
    });

    const vrchatScreenshotResolutionKey = computed({
        get: () => {
            const width = Number(VRChatConfigFile.value.screenshot_res_width);
            const height = Number(VRChatConfigFile.value.screenshot_res_height);
            if (width > 0 && height > 0) {
                return `${width}x${height}`;
            }
            return VRCHAT_RESOLUTION_DEFAULT_KEY;
        },
        set: (value) => {
            const row = VRChatScreenshotResolutions.find((r) => getVRChatResolutionKey(r) === value);
            if (row) {
                setVRChatScreenshotResolution(row);
            }
        }
    });

    function showDeleteAllVRChatCacheConfirm() {
        modalStore
            .confirm({
                description: 'Continue? Trash2 all VRChat cache',
                title: 'Confirm'
            })
            .then(({ ok }) => {
                if (ok) {
                    deleteAllVRChatCache();
                }
            })
            .catch(() => {});
    }

    async function deleteAllVRChatCache() {
        try {
            await AssetBundleManager.DeleteAllCache();
            toast.success('All VRChat cache deleted');
        } catch (error) {
            toast.error(`Error deleting VRChat cache: ${error.message}`);
        }
        getVRChatCacheSize();
    }

    async function openConfigFolderBrowser(value) {
        const oldPath = VRChatConfigFile.value[value];
        const newPath = await folderSelectorDialog(oldPath);
        if (newPath) {
            VRChatConfigFile.value[value] = newPath;
            refreshDialogValues();
        }
    }

    function refreshDialogValues() {
        loading.value = true;
        loading.value = false;
    }

    function setVRChatSpoutResolution(res) {
        VRChatConfigFile.value.camera_spout_res_height = res.height;
        VRChatConfigFile.value.camera_spout_res_width = res.width;
        refreshDialogValues();
    }

    function setVRChatCameraResolution(res) {
        VRChatConfigFile.value.camera_res_height = res.height;
        VRChatConfigFile.value.camera_res_width = res.width;
        refreshDialogValues();
    }

    function setVRChatScreenshotResolution(res) {
        VRChatConfigFile.value.screenshot_res_height = res.height;
        VRChatConfigFile.value.screenshot_res_width = res.width;
        refreshDialogValues();
    }

    function getVRChatCameraResolution() {
        if (VRChatConfigFile.value.camera_res_height && VRChatConfigFile.value.camera_res_width) {
            const res = `${VRChatConfigFile.value.camera_res_width}x${VRChatConfigFile.value.camera_res_height}`;
            return getVRChatResolution(res);
        }
        return '1920x1080 (1080p)';
    }

    function getVRChatSpoutResolution() {
        if (VRChatConfigFile.value.camera_spout_res_height && VRChatConfigFile.value.camera_spout_res_width) {
            const res = `${VRChatConfigFile.value.camera_spout_res_width}x${VRChatConfigFile.value.camera_spout_res_height}`;
            return getVRChatResolution(res);
        }
        return '1920x1080 (1080p)';
    }

    function getVRChatScreenshotResolution() {
        if (VRChatConfigFile.value.screenshot_res_height && VRChatConfigFile.value.screenshot_res_width) {
            const res = `${VRChatConfigFile.value.screenshot_res_width}x${VRChatConfigFile.value.screenshot_res_height}`;
            return getVRChatResolution(res);
        }
        return '1920x1080 (1080p)';
    }

    function saveVRChatConfigFile() {
        for (const item in VRChatConfigFile.value) {
            if (item === 'picture_output_split_by_date') {
                // this one is default true, it's special
                if (VRChatConfigFile.value[item]) {
                    delete VRChatConfigFile.value[item];
                }
            } else if (VRChatConfigFile.value[item] === '') {
                delete VRChatConfigFile.value[item];
            } else if (typeof VRChatConfigFile.value[item] === 'boolean' && VRChatConfigFile.value[item] === false) {
                delete VRChatConfigFile.value[item];
            } else if (typeof VRChatConfigFile.value[item] === 'string') {
                const parsed = parseInt(VRChatConfigFile.value[item], 10);
                if (!Number.isNaN(parsed)) {
                    VRChatConfigFile.value[item] = parsed;
                }
            }
        }
        WriteVRChatConfigFile();
        closeDialog();
    }

    function WriteVRChatConfigFile() {
        const json = JSON.stringify(VRChatConfigFile.value, null, '\t');
        AppApi.WriteConfigFile(json);
    }

    async function readVRChatConfigFile() {
        const config = await AppApi.ReadConfigFileSafe();
        if (config) {
            try {
                const parsedConfig = JSON.parse(config);
                VRChatConfigFile.value = { ...VRChatConfigFile.value, ...parsedConfig };
            } catch {
                toast.error('Invalid JSON in config.json');
                throw new Error('Invalid JSON in config.json');
            }
        }
        if (typeof VRChatConfigFile.value.picture_output_split_by_date === 'undefined') {
            VRChatConfigFile.value.picture_output_split_by_date = true;
        }
    }

    function closeDialog() {
        isVRChatConfigDialogVisible.value = false;
    }
</script>
