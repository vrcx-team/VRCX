<template>
    <Dialog v-model:open="isVisible">
        <DialogContent class="sm:max-w-150">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.allowed_video_player_domains.header') }}</DialogTitle>
            </DialogHeader>

            <div>
                <InputGroupAction
                    v-for="(domain, index) in urlList"
                    :key="index"
                    v-model="urlList[index]"
                    size="sm"
                    style="margin-top: 5px">
                    <template #actions>
                        <Button variant="ghost" @click="urlList.splice(index, 1)"><Trash2 /></Button>
                    </template>
                </InputGroupAction>
                <Button size="sm" variant="outline" style="margin-top: 5px" @click="urlList.push('')">
                    {{ t('dialog.allowed_video_player_domains.add_domain') }}
                </Button>
            </div>

            <DialogFooter>
                <Button :disabled="!worldAllowedDomainsDialog.worldId" @click="saveWorldAllowedDomains">
                    {{ t('dialog.allowed_video_player_domains.save') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupAction } from '@/components/ui/input-group';
    import { Trash2 } from 'lucide-vue-next';
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
