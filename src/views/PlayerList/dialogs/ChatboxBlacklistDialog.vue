<template>
    <el-dialog
        class="x-dialog"
        v-model="chatboxBlacklistDialog.visible"
        :title="t('dialog.chatbox_blacklist.header')"
        width="600px">
        <div v-if="chatboxBlacklistDialog.visible" v-loading="chatboxBlacklistDialog.loading">
            <h2>{{ t('dialog.chatbox_blacklist.keyword_blacklist') }}</h2>
            <el-input
                v-for="(item, index) in chatboxBlacklist"
                :key="index"
                v-model="chatboxBlacklist[index]"
                size="small"
                style="margin-top: 5px"
                @change="saveChatboxBlacklist">
                <template #append>
                    <el-button
                        :icon="Delete"
                        @click="
                            chatboxBlacklist.splice(index, 1);
                            saveChatboxBlacklist();
                        ">
                    </el-button>
                </template>
            </el-input>
            <el-button size="small" style="margin-top: 5px" @click="chatboxBlacklist.push('')">
                {{ t('dialog.chatbox_blacklist.add_item') }}
            </el-button>
            <br />
            <h2>{{ t('dialog.chatbox_blacklist.user_blacklist') }}</h2>
            <Badge
                v-for="user in chatboxUserBlacklist"
                :key="user[0]"
                variant="outline"
                style="margin-right: 5px; margin-top: 5px">
                <span>{{ user[1] }}</span>
                <button
                    type="button"
                    style="
                        margin-left: 6px;
                        border: none;
                        background: transparent;
                        padding: 0;
                        display: inline-flex;
                        align-items: center;
                        color: inherit;
                        cursor: pointer;
                    "
                    @click="deleteChatboxUserBlacklist(user[0])">
                    <i class="ri-close-line" style="font-size: 12px; line-height: 1"></i>
                </button>
            </Badge>
        </div>
    </el-dialog>
</template>

<script setup>
    import { Delete } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Badge } from '../../../components/ui/badge';
    import { usePhotonStore } from '../../../stores';

    const { t } = useI18n();

    const photonStore = usePhotonStore();
    const { chatboxUserBlacklist, chatboxBlacklist } = storeToRefs(photonStore);
    const { saveChatboxBlacklist } = photonStore;

    defineProps({
        chatboxBlacklistDialog: {
            type: Object,
            required: true
        }
    });

    const emit = defineEmits(['deleteChatboxUserBlacklist']);

    function deleteChatboxUserBlacklist(userId) {
        emit('deleteChatboxUserBlacklist', userId);
    }
</script>
