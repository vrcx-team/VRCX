<template>
    <safe-dialog
        class="x-dialog"
        :visible="isVRChatConfigDialogVisible"
        :title="t('dialog.config_json.header')"
        width="420px"
        @close="closeDialog">
        <div v-loading="loading">
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
            <el-tooltip placement="top" :content="t('dialog.config_json.refresh')" :disabled="hideTooltips">
                <el-button
                    type="default"
                    :loading="VRChatCacheSizeLoading"
                    size="small"
                    icon="el-icon-refresh"
                    circle
                    style="margin-left: 5px"
                    @click="getVRChatCacheSize"></el-button>
            </el-tooltip>

            <div style="margin-top: 10px">
                <span style="margin-right: 5px">{{ t('dialog.config_json.delete_all_cache') }}</span>
                <el-button
                    size="small"
                    style="margin-left: 5px"
                    icon="el-icon-delete"
                    @click="showDeleteAllVRChatCacheConfirm"
                    >{{ t('dialog.config_json.delete_cache') }}</el-button
                >
            </div>

            <div style="margin-top: 10px">
                <span style="margin-right: 5px">{{ t('dialog.config_json.delete_old_cache') }}</span>
                <el-button
                    size="small"
                    style="margin-left: 5px"
                    icon="el-icon-folder-delete"
                    @click="sweepVRChatCache"
                    >{{ t('dialog.config_json.sweep_cache') }}</el-button
                >
            </div>

            <div v-for="(item, value) in VRChatConfigList" :key="value" style="display: block; margin-top: 10px">
                <span style="word-break: keep-all">{{ item.name }}:</span>
                <div style="display: flex">
                    <el-input
                        v-model="VRChatConfigFile[value]"
                        :placeholder="item.default"
                        size="mini"
                        :type="item.type ? item.type : 'text'"
                        :min="item.min"
                        :max="item.max"
                        @input="refreshDialogValues"
                        style="flex: 1; margin-top: 5px"
                        ><el-button
                            v-if="item.folderBrowser"
                            slot="append"
                            size="mini"
                            icon="el-icon-folder-opened"
                            @click="openConfigFolderBrowser(value)"></el-button
                    ></el-input>
                </div>
            </div>

            <div style="display: inline-block; margin-top: 10px">
                <span>{{ t('dialog.config_json.camera_resolution') }}</span>
                <br />
                <el-dropdown
                    size="small"
                    trigger="click"
                    style="margin-top: 5px"
                    @command="(command) => setVRChatCameraResolution(command)">
                    <el-button size="small">
                        <span>
                            <span v-text="getVRChatCameraResolution()"></span>
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item v-for="row in VRChatCameraResolutions" :key="row.index" :command="row">{{
                                row.name
                            }}</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
            <br />

            <div style="display: inline-block; margin-top: 10px">
                <span>{{ t('dialog.config_json.spout_resolution') }}</span>
                <br />
                <el-dropdown
                    size="small"
                    trigger="click"
                    style="margin-top: 5px"
                    @command="(command) => setVRChatSpoutResolution(command)">
                    <el-button size="small">
                        <span>
                            <span v-text="getVRChatSpoutResolution()"></span>
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item
                                v-for="row in VRChatScreenshotResolutions"
                                :key="row.index"
                                :command="row"
                                >{{ row.name }}</el-dropdown-item
                            >
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
            <br />

            <div style="display: inline-block; margin-top: 10px">
                <span>{{ t('dialog.config_json.screenshot_resolution') }}</span>
                <br />
                <el-dropdown
                    size="small"
                    trigger="click"
                    style="margin-top: 5px"
                    @command="(command) => setVRChatScreenshotResolution(command)">
                    <el-button size="small">
                        <span>
                            <span v-text="getVRChatScreenshotResolution()"></span>
                            <i class="el-icon-arrow-down el-icon--right"></i>
                        </span>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item
                                v-for="row in VRChatScreenshotResolutions"
                                :key="row.index"
                                :command="row"
                                >{{ row.name }}</el-dropdown-item
                            >
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
            <br />

            <el-checkbox
                v-model="VRChatConfigFile.picture_output_split_by_date"
                @change="refreshDialogValues"
                style="margin-top: 5px; display: block">
                {{ t('dialog.config_json.picture_sort_by_date') }}
            </el-checkbox>
            <el-checkbox
                v-model="VRChatConfigFile.disableRichPresence"
                @change="refreshDialogValues"
                style="margin-top: 5px; display: block">
                {{ t('dialog.config_json.disable_discord_presence') }}
            </el-checkbox>
        </div>
        <template #footer>
            <div style="display: flex; align-items: center; justify-content: space-between">
                <div>
                    <el-button
                        size="small"
                        @click="openExternalLink('https://docs.vrchat.com/docs/configuration-file')"
                        >{{ t('dialog.config_json.vrchat_docs') }}</el-button
                    >
                </div>
                <div>
                    <el-button size="small" @click="closeDialog">{{ t('dialog.config_json.cancel') }}</el-button>
                    <el-button size="small" type="primary" :disabled="loading" @click="saveVRChatConfigFile">{{
                        t('dialog.config_json.save')
                    }}</el-button>
                </div>
            </div>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, getCurrentInstance, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { VRChatCameraResolutions, VRChatScreenshotResolutions } from '../../../shared/constants';
    import { getVRChatResolution, openExternalLink } from '../../../shared/utils';
    import { useAdvancedSettingsStore, useAppearanceSettingsStore, useGameStore } from '../../../stores';

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { VRChatUsedCacheSize, VRChatTotalCacheSize, VRChatCacheSizeLoading } = storeToRefs(useGameStore());
    const { sweepVRChatCache, getVRChatCacheSize } = useGameStore();
    const { folderSelectorDialog } = useAdvancedSettingsStore();
    const { isVRChatConfigDialogVisible } = storeToRefs(useAdvancedSettingsStore());

    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $confirm = instance.proxy.$confirm;
    const $message = instance.proxy.$message;

    const VRChatConfigFile = ref({});
    // it's a object
    const VRChatConfigList = ref({
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
    });

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

    function showDeleteAllVRChatCacheConfirm() {
        $confirm(`Continue? Delete all VRChat cache`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    deleteAllVRChatCache();
                }
            }
        });
    }

    async function deleteAllVRChatCache() {
        await AssetBundleManager.DeleteAllCache();
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
            } else if (typeof VRChatConfigFile.value[item] === 'string' && !isNaN(VRChatConfigFile.value[item])) {
                VRChatConfigFile.value[item] = parseInt(VRChatConfigFile.value[item], 10);
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
                $message({
                    message: 'Invalid JSON in config.json',
                    type: 'error'
                });
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
