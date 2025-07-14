<template>
    <safe-dialog
        :visible.sync="isVisible"
        :title="t('dialog.set_world_tags.header')"
        width="400px"
        destroy-on-close
        append-to-body>
        <el-checkbox v-model="setWorldTagsDialog.avatarScalingDisabled">
            {{ t('dialog.set_world_tags.avatar_scaling_disabled') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.focusViewDisabled">
            {{ t('dialog.set_world_tags.focus_view_disabled') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.debugAllowed">
            {{ t('dialog.set_world_tags.enable_debugging') }}
        </el-checkbox>
        <div style="font-size: 12px; margin-top: 10px">{{ t('dialog.set_world_tags.author_tags') }}<br /></div>
        <el-input
            v-model="setWorldTagsDialog.authorTags"
            type="textarea"
            size="mini"
            show-word-limit
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder=""
            style="margin-top: 10px"></el-input>
        <div style="font-size: 12px; margin-top: 10px">{{ t('dialog.set_world_tags.content_tags') }}<br /></div>
        <el-checkbox v-model="setWorldTagsDialog.contentHorror">
            {{ t('dialog.set_world_tags.content_horror') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.contentGore">
            {{ t('dialog.set_world_tags.content_gore') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.contentViolence">
            {{ t('dialog.set_world_tags.content_violence') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.contentAdult">
            {{ t('dialog.set_world_tags.content_adult') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.contentSex">
            {{ t('dialog.set_world_tags.content_sex') }}
        </el-checkbox>
        <div style="font-size: 12px; margin-top: 10px">
            {{ t('dialog.set_world_tags.default_content_settings') }}<br />
        </div>
        <el-checkbox v-model="setWorldTagsDialog.emoji">
            {{ t('dialog.new_instance.content_emoji') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.stickers">
            {{ t('dialog.new_instance.content_stickers') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.pedestals">
            {{ t('dialog.new_instance.content_pedestals') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.prints">
            {{ t('dialog.new_instance.content_prints') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.drones">
            {{ t('dialog.new_instance.content_drones') }}
        </el-checkbox>
        <br />
        <el-checkbox v-model="setWorldTagsDialog.props">
            {{ t('dialog.new_instance.content_items') }}
        </el-checkbox>
        <template #footer>
            <div style="display: flex">
                <el-button size="small" @click="setWorldTagsDialog.visible = false">
                    {{ t('dialog.set_world_tags.cancel') }}
                </el-button>
                <el-button type="primary" size="small" @click="saveSetWorldTagsDialog">
                    {{ t('dialog.set_world_tags.save') }}
                </el-button>
            </div>
        </template>
    </safe-dialog>
</template>

<script setup>
    import { ref, computed, watch, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { worldRequest } from '../../../api';
    import { useWorldStore } from '../../../stores';

    const props = defineProps({
        oldTags: {
            type: Array,
            default: () => []
        },
        isSetWorldTagsDialogVisible: {
            type: Boolean,
            required: true
        },
        worldId: {
            type: String,
            required: true
        },
        isWorldDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:isSetWorldTagsDialogVisible']);

    const { showWorldDialog } = useWorldStore();

    const { t } = useI18n();

    const { proxy } = getCurrentInstance();

    const setWorldTagsDialog = ref({
        authorTags: '',
        contentTags: '',
        debugAllowed: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        contentHorror: false,
        contentGore: false,
        contentViolence: false,
        contentAdult: false,
        contentSex: false,
        emoji: true,
        stickers: true,
        pedestals: true,
        prints: true,
        drones: true,
        props: true
    });

    const isVisible = computed({
        get() {
            return props.isSetWorldTagsDialogVisible;
        },
        set(val) {
            emit('update:isSetWorldTagsDialogVisible', val);
        }
    });

    watch(
        () => props.isSetWorldTagsDialogVisible,
        (val) => {
            if (val) {
                showSetWorldTagsDialog();
            }
        }
    );

    function showSetWorldTagsDialog() {
        const D = setWorldTagsDialog.value;

        D.debugAllowed = false;
        D.avatarScalingDisabled = false;
        D.focusViewDisabled = false;
        D.contentHorror = false;
        D.contentGore = false;
        D.contentViolence = false;
        D.contentAdult = false;
        D.contentSex = false;
        const authorTags = [];
        const contentTags = [];
        props.oldTags.forEach((tag) => {
            if (tag.startsWith('author_tag_')) {
                authorTags.unshift(tag.substring(11));
            }
            if (tag.startsWith('content_')) {
                contentTags.unshift(tag.substring(8));
            }
            switch (tag) {
                case 'content_horror':
                    D.contentHorror = true;
                    break;
                case 'content_gore':
                    D.contentGore = true;
                    break;
                case 'content_violence':
                    D.contentViolence = true;
                    break;
                case 'content_adult':
                    D.contentAdult = true;
                    break;
                case 'content_sex':
                    D.contentSex = true;
                    break;
                case 'debug_allowed':
                    D.debugAllowed = true;
                    break;
                case 'feature_avatar_scaling_disabled':
                    D.avatarScalingDisabled = true;
                    break;
                case 'feature_focus_view_disabled':
                    D.focusViewDisabled = true;
                    break;
                case 'feature_emoji_disabled':
                    D.emoji = false;
                    break;
                case 'feature_stickers_disabled':
                    D.stickers = false;
                    break;
                case 'feature_pedestals_disabled':
                    D.pedestals = false;
                    break;
                case 'feature_prints_disabled':
                    D.prints = false;
                    break;
                case 'feature_drones_disabled':
                    D.drones = false;
                    break;
                case 'feature_props_disabled':
                    D.props = false;
                    break;
            }
        });
        D.authorTags = authorTags.toString();
        D.contentTags = contentTags.toString();
    }

    function saveSetWorldTagsDialog() {
        const D = setWorldTagsDialog.value;
        const authorTags = D.authorTags.trim().split(',');
        const contentTags = D.contentTags.trim().split(',');
        const tags = [];
        authorTags.forEach((tag) => {
            if (tag) {
                tags.unshift(`author_tag_${tag}`);
            }
        });
        // add back custom tags
        contentTags.forEach((tag) => {
            switch (tag) {
                case 'horror':
                case 'gore':
                case 'violence':
                case 'adult':
                case 'sex':
                case '':
                    break;
                default:
                    tags.unshift(`content_${tag}`);
                    break;
            }
        });
        if (D.contentHorror) {
            tags.unshift('content_horror');
        }
        if (D.contentGore) {
            tags.unshift('content_gore');
        }
        if (D.contentViolence) {
            tags.unshift('content_violence');
        }
        if (D.contentAdult) {
            tags.unshift('content_adult');
        }
        if (D.contentSex) {
            tags.unshift('content_sex');
        }
        if (D.debugAllowed) {
            tags.unshift('debug_allowed');
        }
        if (D.avatarScalingDisabled) {
            tags.unshift('feature_avatar_scaling_disabled');
        }
        if (D.focusViewDisabled) {
            tags.unshift('feature_focus_view_disabled');
        }
        if (!D.emoji) {
            tags.unshift('feature_emoji_disabled');
        }
        if (!D.stickers) {
            tags.unshift('feature_stickers_disabled');
        }
        if (!D.pedestals) {
            tags.unshift('feature_pedestals_disabled');
        }
        if (!D.prints) {
            tags.unshift('feature_prints_disabled');
        }
        if (!D.drones) {
            tags.unshift('feature_drones_disabled');
        }
        if (!D.props) {
            tags.unshift('feature_props_disabled');
        }
        worldRequest
            .saveWorld({
                id: props.worldId,
                tags
            })
            .then((args) => {
                proxy.$message({
                    message: 'Tags updated',
                    type: 'success'
                });
                emit('update:isSetWorldTagsDialogVisible', false);
                if (props.isWorldDialogVisible) {
                    showWorldDialog(args.json.id);
                }
                return args;
            });
    }
</script>
