<template>
    <el-dialog
        v-model="isVisible"
        :title="t('dialog.set_world_tags.header')"
        width="400px"
        destroy-on-close
        append-to-body>
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.avatarScalingDisabled" />
            <span>{{ t('dialog.set_world_tags.avatar_scaling_disabled') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.focusViewDisabled" />
            <span>{{ t('dialog.set_world_tags.focus_view_disabled') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.debugAllowed" />
            <span>{{ t('dialog.set_world_tags.enable_debugging') }}</span>
        </label>
        <div style="font-size: 12px; margin-top: 10px">{{ t('dialog.set_world_tags.author_tags') }}<br /></div>
        <InputGroupTextareaField
            v-model="setWorldTagsDialog.authorTags"
            :rows="2"
            placeholder=""
            style="margin-top: 10px"
            input-class="resize-none" />
        <div style="font-size: 12px; margin-top: 10px">{{ t('dialog.set_world_tags.content_tags') }}<br /></div>
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.contentHorror" />
            <span>{{ t('dialog.set_world_tags.content_horror') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.contentGore" />
            <span>{{ t('dialog.set_world_tags.content_gore') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.contentViolence" />
            <span>{{ t('dialog.set_world_tags.content_violence') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.contentAdult" />
            <span>{{ t('dialog.set_world_tags.content_adult') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.contentSex" />
            <span>{{ t('dialog.set_world_tags.content_sex') }}</span>
        </label>
        <div style="font-size: 12px; margin-top: 10px">
            {{ t('dialog.set_world_tags.default_content_settings') }}<br />
        </div>
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.emoji" />
            <span>{{ t('dialog.new_instance.content_emoji') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.stickers" />
            <span>{{ t('dialog.new_instance.content_stickers') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.pedestals" />
            <span>{{ t('dialog.new_instance.content_pedestals') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.prints" />
            <span>{{ t('dialog.new_instance.content_prints') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.drones" />
            <span>{{ t('dialog.new_instance.content_drones') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.props" />
            <span>{{ t('dialog.new_instance.content_items') }}</span>
        </label>
        <br />
        <label class="inline-flex items-center gap-2">
            <Checkbox v-model="setWorldTagsDialog.thirdPerson" />
            <span>{{ t('dialog.new_instance.content_third_person') }}</span>
        </label>
        <template #footer>
            <div class="flex gap-2">
                <Button variant="secondary" @click="isVisible = false">
                    {{ t('dialog.set_world_tags.cancel') }}
                </Button>
                <Button @click="saveSetWorldTagsDialog">
                    {{ t('dialog.set_world_tags.save') }}
                </Button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useWorldStore } from '../../../stores';
    import { worldRequest } from '../../../api';

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
        props: true,
        thirdPerson: true
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
            if (String(tag).startsWith('author_tag_')) {
                authorTags.unshift(String(tag).substring(11));
            }
            if (String(tag).startsWith('content_')) {
                contentTags.unshift(String(tag).substring(8));
            }
            switch (String(tag)) {
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
                case 'feature_third_person_view_disabled':
                    D.thirdPerson = false;
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
        if (!D.thirdPerson) {
            tags.unshift('feature_third_person_view_disabled');
        }
        worldRequest
            .saveWorld({
                id: props.worldId,
                tags
            })
            .then((args) => {
                toast.success('Tags updated');
                emit('update:isSetWorldTagsDialogVisible', false);
                if (props.isWorldDialogVisible) {
                    showWorldDialog(args.json.id);
                }
                return args;
            });
    }
</script>
