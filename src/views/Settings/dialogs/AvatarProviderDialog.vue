<template>
    <safe-dialog
        class="x-dialog"
        :visible="isAvatarProviderDialogVisible"
        :title="t('dialog.avatar_database_provider.header')"
        width="600px"
        @close="closeDialog">
        <div>
            <el-input
                v-for="(provider, index) in avatarRemoteDatabaseProviderList"
                :key="index"
                v-model="avatarRemoteDatabaseProviderList[index]"
                size="small"
                style="margin-top: 5px"
                @change="saveAvatarProviderList">
                <el-button slot="append" icon="el-icon-delete" @click="removeAvatarProvider(provider)"></el-button>
            </el-input>

            <el-button size="mini" style="margin-top: 5px" @click="avatarRemoteDatabaseProviderList.push('')">
                {{ t('dialog.avatar_database_provider.add_provider') }}
            </el-button>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
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
