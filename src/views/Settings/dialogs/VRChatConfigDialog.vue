<template>
    <el-dialog
        class="x-dialog"
        :before-close="beforeDialogClose"
        :visible="isVRChatConfigDialogVisible"
        :title="t('dialog.config_json.header')"
        width="420px"
        top="10vh"
        @close="closeDialog"
        @mousedown.native="dialogMouseDown"
        @mouseup.native="dialogMouseUp">
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
                style="margin-top: 5px; display: block">
                {{ t('dialog.config_json.picture_sort_by_date') }}
            </el-checkbox>
            <el-checkbox v-model="VRChatConfigFile.disableRichPresence" style="margin-top: 5px; display: block">
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
    </el-dialog>
</template>

<script setup>
    import { ref, watch, inject, getCurrentInstance, computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import {
        getVRChatResolution,
        VRChatScreenshotResolutions,
        VRChatCameraResolutions
    } from '../../../composables/settings/constants/vrchatResolutions';
    const { t } = useI18n();

    const instance = getCurrentInstance();
    const $confirm = instance.proxy.$confirm;
    const $message = instance.proxy.$message;

    const beforeDialogClose = inject('beforeDialogClose');
    const dialogMouseDown = inject('dialogMouseDown');
    const dialogMouseUp = inject('dialogMouseUp');
    const openExternalLink = inject('openExternalLink');

    const props = defineProps({
        isVRChatConfigDialogVisible: {
            type: Boolean,
            required: true
        },
        VRChatUsedCacheSize: {
            type: [String, Number],
            required: true
        },
        VRChatTotalCacheSize: {
            type: [String, Number],
            required: true
        },
        VRChatCacheSizeLoading: {
            type: Boolean,
            required: true
        },
        folderSelectorDialog: {
            type: Function,
            required: true
        },
        hideTooltips: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['update:isVRChatConfigDialogVisible', 'getVRChatCacheSize', 'sweepVRChatCache']);

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
        () => props.isVRChatConfigDialogVisible,
        async (newValue) => {
            if (newValue) {
                loading.value = true;
                await readVRChatConfigFile();
                loading.value = false;
            }
        }
    );

    const totalCacheSize = computed(() => {
        return VRChatConfigFile.value.cache_size || props.VRChatTotalCacheSize;
    });

    function getVRChatCacheSize() {
        emit('getVRChatCacheSize');
    }

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

    function sweepVRChatCache() {
        emit('sweepVRChatCache');
    }

    async function openConfigFolderBrowser(value) {
        const oldPath = VRChatConfigFile.value[value];
        const newPath = await props.folderSelectorDialog(oldPath);
        if (newPath) {
            VRChatConfigFile.value[value] = newPath;
        }
    }

    function setVRChatSpoutResolution(res) {
        VRChatConfigFile.value.camera_spout_res_height = res.height;
        VRChatConfigFile.value.camera_spout_res_width = res.width;
    }

    function setVRChatCameraResolution(res) {
        VRChatConfigFile.value.camera_res_height = res.height;
        VRChatConfigFile.value.camera_res_width = res.width;
    }

    function setVRChatScreenshotResolution(res) {
        VRChatConfigFile.value.screenshot_res_height = res.height;
        VRChatConfigFile.value.screenshot_res_width = res.width;
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
        const config = await AppApi.ReadConfigFile();
        if (config) {
            try {
                const parsedConfig = JSON.parse(config);
                if (parsedConfig.picture_output_split_by_date === undefined) {
                    parsedConfig.picture_output_split_by_date = true;
                }
                VRChatConfigFile.value = { ...VRChatConfigFile.value, ...parsedConfig };
            } catch {
                $message({
                    message: 'Invalid JSON in config.json',
                    type: 'error'
                });
                throw new Error('Invalid JSON in config.json');
            }
        }
    }

    function closeDialog() {
        emit('update:isVRChatConfigDialogVisible', false);
    }
</script>
