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
                :value="provider"
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
    import { useI18n } from 'vue-i18n-bridge';
    const { t } = useI18n();

    defineProps({
        avatarRemoteDatabaseProviderList: {
            type: Array,
            required: true
        },
        isAvatarProviderDialogVisible: {
            type: Boolean,
            required: true
        }
    });

    const emit = defineEmits([
        'update:isAvatarProviderDialogVisible',
        'update:avatarRemoteDatabaseProviderList',
        'saveAvatarProviderList',
        'removeAvatarProvider'
    ]);

    function saveAvatarProviderList() {
        emit('saveAvatarProviderList');
    }

    function removeAvatarProvider(provider) {
        emit('removeAvatarProvider', provider);
    }

    function closeDialog() {
        emit('update:isAvatarProviderDialogVisible', false);
    }
</script>
