<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="chatboxBlacklistDialog.visible"
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
                        icon="el-icon-delete"
                        @click="
                            chatboxBlacklist.splice(index, 1);
                            saveChatboxBlacklist();
                        ">
                    </el-button>
                </template>
            </el-input>
            <el-button size="mini" style="margin-top: 5px" @click="chatboxBlacklist.push('')">
                {{ t('dialog.chatbox_blacklist.add_item') }}
            </el-button>
            <br />
            <h2>{{ t('dialog.chatbox_blacklist.user_blacklist') }}</h2>
            <el-tag
                v-for="user in chatboxUserBlacklist"
                :key="user[0]"
                type="info"
                disable-transitions
                style="margin-right: 5px; margin-top: 5px"
                closable
                @close="deleteChatboxUserBlacklist(user[0])">
                <span>{{ user[1] }}</span>
            </el-tag>
        </div>
    </safe-dialog>
</template>

<script setup>
    import { ref } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import configRepository from '../../../service/config';
    const { t } = useI18n();

    defineProps({
        chatboxBlacklistDialog: {
            type: Object,
            required: true
        },
        chatboxUserBlacklist: {
            type: Map,
            required: true
        }
    });

    const chatboxBlacklist = ref([
        'NP: ',
        'Now Playing',
        'Now playing',
        "▶️ '",
        '( ▶️ ',
        "' - '",
        "' by '",
        '[Spotify] '
    ]);

    const emit = defineEmits(['deleteChatboxUserBlacklist']);

    initChatboxBlacklist();

    async function initChatboxBlacklist() {
        if (await configRepository.getString('VRCX_chatboxBlacklist')) {
            chatboxBlacklist.value = JSON.parse(await configRepository.getString('VRCX_chatboxBlacklist'));
        }
    }

    async function saveChatboxBlacklist() {
        await configRepository.setString('VRCX_chatboxBlacklist', JSON.stringify(chatboxBlacklist.value));
    }

    function deleteChatboxUserBlacklist(userId) {
        emit('deleteChatboxUserBlacklist', userId);
    }
</script>
