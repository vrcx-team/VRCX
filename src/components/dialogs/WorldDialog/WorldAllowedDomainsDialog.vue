<template>
    <el-dialog
        v-model="isVisible"
        :title="t('dialog.allowed_video_player_domains.header')"
        width="600px"
        destroy-on-close
        append-to-body>
        <div>
            <el-input
                v-for="(domain, index) in urlList"
                :key="index"
                v-model="urlList[index]"
                size="small"
                style="margin-top: 5px">
                <el-button :icon="Delete" @click="urlList.splice(index, 1)"></el-button>
            </el-input>
            <el-button size="small" style="margin-top: 5px" @click="urlList.push('')">
                {{ t('dialog.allowed_video_player_domains.add_domain') }}
            </el-button>
        </div>
        <template #footer>
            <el-button type="primary" :disabled="!worldAllowedDomainsDialog.worldId" @click="saveWorldAllowedDomains">
                {{ t('dialog.allowed_video_player_domains.save') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Delete } from '@element-plus/icons-vue';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { worldRequest } from '../../../api';

    const props = defineProps({
        worldAllowedDomainsDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['update:worldAllowedDomainsDialog']);

    const { t } = useI18n();

    const urlList = ref([]);

    const isVisible = computed({
        get() {
            return props.worldAllowedDomainsDialog.visible;
        },
        set(val) {
            emit('update:worldAllowedDomainsDialog', {
                ...props.worldAllowedDomainsDialog,
                visible: val
            });
        }
    });

    watch(
        () => props.worldAllowedDomainsDialog.visible,
        (val) => {
            if (val) {
                urlList.value = props.worldAllowedDomainsDialog.urlList;
            }
        }
    );

    function saveWorldAllowedDomains() {
        const D = props.worldAllowedDomainsDialog;
        worldRequest
            .saveWorld({
                id: D.worldId,
                urlList: urlList.value
            })
            .then((args) => {
                toast.success('Allowed Video Player Domains updated');
                return args;
            });
        D.visible = false;
    }
</script>
