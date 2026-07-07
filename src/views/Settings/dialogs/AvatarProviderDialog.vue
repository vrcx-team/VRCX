<template>
    <Dialog :open="isAvatarProviderDialogVisible" @update:open="(open) => (open ? null : closeDialog())">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.avatar_database_provider.header') }}</DialogTitle>
            </DialogHeader>
            <div class="flex flex-col gap-3 mt-2">
                <div
                    v-for="(provider, index) in avatarRemoteDatabaseProviderList"
                    :key="index"
                    class="flex flex-col gap-1.5 p-3 border rounded-md">
                    <InputGroupAction
                        v-model="provider.url"
                        size="sm"
                        placeholder="Provider URL"
                        @change="saveAvatarProviderList">
                        <template #actions>
                            <Trash2
                                class="cursor-pointer opacity-80 hover:opacity-100 text-destructive"
                                @click="removeAvatarProvider(provider.url)" />
                        </template>
                    </InputGroupAction>
                    <Input
                        v-model="provider.apiKey"
                        size="sm"
                        placeholder="API Key (Optional)"
                        @change="saveAvatarProviderList" />
                </div>

                <Button size="sm" @click="addProvider">
                    {{ t('dialog.avatar_database_provider.add_provider') }}
                </Button>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
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

    /**
     *
     */
    function closeDialog() {
        emit('update:isAvatarProviderDialogVisible', false);
    }

    /**
     *
     */
    function addProvider() {
        avatarRemoteDatabaseProviderList.value.push({ url: '', apiKey: '' });
    }
</script>
