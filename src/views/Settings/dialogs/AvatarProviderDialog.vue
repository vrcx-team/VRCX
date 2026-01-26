<template>
    <Dialog :open="isAvatarProviderDialogVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.avatar_database_provider.header') }}</DialogTitle>
            </DialogHeader>
            <div>
                <InputGroupAction
                    v-for="(provider, index) in avatarRemoteDatabaseProviderList"
                    :key="index"
                    v-model="avatarRemoteDatabaseProviderList[index]"
                    size="sm"
                    style="margin-top: 5px"
                    @change="saveAvatarProviderList">
                    <template #actions>
                        <Trash2 class="cursor-pointer opacity-80 hover:opacity-100" @click="removeAvatarProvider(provider)" />
                    </template>
                </InputGroupAction>

                <Button size="sm" style="margin-top: 5px" @click="avatarRemoteDatabaseProviderList.push('')">
                    {{ t('dialog.avatar_database_provider.add_provider') }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupAction } from '@/components/ui/input-group';
    import { Trash2 } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarProviderStore } from '../../../stores';

    const { t } = useI18n();

    const avatarProviderStore = useAvatarProviderStore();

    const { avatarRemoteDatabaseProviderList } = storeToRefs(avatarProviderStore);
    const { saveAvatarProviderList, removeAvatarProvider } = avatarProviderStore;

    defineProps({
        isAvatarProviderDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits(['update:isAvatarProviderDialogVisible']);

    function closeDialog() {
        emit('update:isAvatarProviderDialogVisible', false);
    }
</script>
