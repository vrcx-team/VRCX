<template>
    <Dialog v-model:open="chatboxBlacklistDialog.visible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.chatbox_blacklist.header') }}</DialogTitle>
            </DialogHeader>
            <div v-if="chatboxBlacklistDialog.visible" v-loading="chatboxBlacklistDialog.loading">
                <h2>{{ t('dialog.chatbox_blacklist.keyword_blacklist') }}</h2>
                <InputGroupAction
                    v-for="(item, index) in chatboxBlacklist"
                    :key="index"
                    v-model="chatboxBlacklist[index]"
                    size="sm"
                    style="margin-top: 5px"
                    @change="saveChatboxBlacklist">
                    <template #actions>
                        <Button
                            variant="outline"
                            @click="
                                chatboxBlacklist.splice(index, 1);
                                saveChatboxBlacklist();
                            ">
                        </Button>
                    </template>
                </InputGroupAction>
                <Button size="sm" variant="outline" style="margin-top: 5px" @click="chatboxBlacklist.push('')">
                    {{ t('dialog.chatbox_blacklist.add_item') }}
                </Button>
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
                        <X class="h-3 w-3" style="line-height: 1" />
                    </button>
                </Badge>
            </div>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupAction } from '@/components/ui/input-group';
    import { X } from 'lucide-vue-next';
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
