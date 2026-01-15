<template>
    <Dialog v-model:open="sendBoopDialog.visible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.boop_dialog.header') }}</DialogTitle>
            </DialogHeader>
        <span>{{ displayName }}</span>

        <br />
        <br />

        <div v-if="sendBoopDialog.visible" style="width: 100%">
            <VirtualCombobox
                v-model="emojiModel"
                :groups="emojiPickerGroups"
                :placeholder="t('dialog.boop_dialog.select_default_emoji')"
                :search-placeholder="t('dialog.boop_dialog.select_default_emoji')"
                :clearable="true"
                :close-on-select="true"
                :deselect-on-reselect="true">
                <template #item="{ item, selected }">
                    <span v-text="item.label"></span>
                    <CheckIcon :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                </template>
            </VirtualCombobox>
        </div>

        <br />
        <br />

        <div
            v-if="isLocalUserVrcPlusSupporter"
            style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                gap: 15px;
                margin-top: 10px;
                max-height: 600px;
                overflow-y: auto;
            ">
            <div
                v-for="image in emojiTable"
                :key="image.id"
                :class="image.id === fileId ? 'x-image-selected' : ''"
                style="cursor: pointer; border: 1px solid transparent; border-radius: 8px"
                @click="fileId = image.id">
                <div
                    v-if="
                        image.versions &&
                        image.versions.length > 0 &&
                        image.versions[image.versions.length - 1].file.url
                    "
                    class="x-popover-image"
                    style="padding: 8px">
                    <Emoji :imageUrl="image.versions[image.versions.length - 1].file.url" :size="100"></Emoji>
                </div>
            </div>
        </div>

            <DialogFooter>
            <Button size="sm" variant="outline" class="mr-2" @click="showGalleryPage">{{
                t('dialog.boop_dialog.emoji_manager')
            }}</Button>
            <Button size="sm" variant="secondary" class="mr-2" @click="closeDialog">{{
                t('dialog.boop_dialog.cancel')
            }}</Button>
            <Button size="sm" :disabled="!sendBoopDialog.userId" @click="sendBoop">{{
                t('dialog.boop_dialog.send')
            }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Check as CheckIcon } from 'lucide-vue-next';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { miscRequest, notificationRequest, userRequest } from '../../api';
    import { useGalleryStore, useNotificationStore, useUserStore } from '../../stores';
    import { VirtualCombobox } from '../ui/virtual-combobox';
    import { photonEmojis } from '../../shared/constants/photon.js';

    import Emoji from '../Emoji.vue';

    const { t } = useI18n();

    const { sendBoopDialog } = storeToRefs(useUserStore());
    const { notificationTable } = storeToRefs(useNotificationStore());
    const { showGalleryPage, refreshEmojiTable } = useGalleryStore();
    const { emojiTable } = storeToRefs(useGalleryStore());
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const fileId = ref('');
    const displayName = ref('');

    watch(
        () => sendBoopDialog.value.visible,
        (visible) => {
            if (visible) {
                displayName.value = '';
                userRequest.getCachedUser({ userId: sendBoopDialog.value.userId }).then((user) => {
                    displayName.value = user.ref.displayName;
                });
            }
            if (visible && isLocalUserVrcPlusSupporter && emojiTable.value.length === 0) {
                refreshEmojiTable();
            }
        }
    );

    function closeDialog() {
        sendBoopDialog.value.visible = false;
    }

    const emojiModel = computed({
        get: () => (fileId.value ? String(fileId.value) : null),
        set: (value) => {
            fileId.value = value ? String(value) : '';
        }
    });

    function getEmojiValue(emojiName) {
        if (!emojiName) {
            return '';
        }
        return `default_${emojiName.replace(/ /g, '_').toLowerCase()}`;
    }

    const emojiPickerGroups = computed(() => [
        {
            key: 'defaultEmojis',
            label: t('dialog.boop_dialog.default_emojis'),
            items: photonEmojis.map((emojiName) => ({
                value: getEmojiValue(emojiName),
                label: emojiName,
                search: emojiName
            }))
        }
    ]);

    function sendBoop() {
        const D = sendBoopDialog.value;
        dismissBoop(D.userId);
        const params = {
            userId: D.userId
        };
        if (fileId.value) {
            params.emojiId = fileId.value;
        }
        miscRequest.sendBoop(params);
        D.visible = false;
    }

    function dismissBoop(userId) {
        // JANK: This is a hack to remove boop notifications when responding
        const array = notificationTable.value.data;
        for (let i = array.length - 1; i >= 0; i--) {
            const ref = array[i];
            if (ref.type !== 'boop' || ref.$isExpired || ref.senderUserId !== userId) {
                continue;
            }
            notificationRequest.sendNotificationResponse({
                notificationId: ref.id,
                responseType: 'delete',
                responseData: ''
            });
        }
    }
</script>
