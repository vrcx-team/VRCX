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
                <Button variant="outline" @click="urlList.splice(index, 1)"></Button>
            </el-input>
            <Button size="sm" variant="outline" style="margin-top: 5px" @click="urlList.push('')">
                {{ t('dialog.allowed_video_player_domains.add_domain') }}
            </Button>
        </div>
        <template #footer>
            <Button :disabled="!worldAllowedDomainsDialog.worldId" @click="saveWorldAllowedDomains">
                {{ t('dialog.allowed_video_player_domains.save') }}
            </Button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
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
