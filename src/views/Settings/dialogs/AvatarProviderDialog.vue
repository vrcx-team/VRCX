<template>
    <el-dialog
        class="x-dialog"
        :model-value="isAvatarProviderDialogVisible"
        :title="t('dialog.avatar_database_provider.header')"
        width="600px"
        @close="closeDialog">
        <div>
            <InputGroupAction
                v-for="(provider, index) in avatarRemoteDatabaseProviderList"
                :key="index"
                v-model="avatarRemoteDatabaseProviderList[index]"
                size="sm"
                style="margin-top: 5px"
                @change="saveAvatarProviderList">
                <template #actions>
                    <Button variant="outline" size="icon" @click="removeAvatarProvider(provider)">
                        <Trash2 />
                    </Button>
                </template>
            </InputGroupAction>

            <Button size="sm" style="margin-top: 5px" @click="avatarRemoteDatabaseProviderList.push('')">
                {{ t('dialog.avatar_database_provider.add_provider') }}
            </Button>
        </div>
    </el-dialog>
</template>

<script setup>
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
