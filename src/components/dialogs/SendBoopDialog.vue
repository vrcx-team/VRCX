<template>
    <Dialog v-model:open="sendBoopDialog.visible">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{{ t('dialog.boop_dialog.header') }}</DialogTitle>
                <DialogDescription>{{ displayName }}</DialogDescription>
            </DialogHeader>

            <div v-if="sendBoopDialog.visible" class="w-full">
                <VirtualCombobox
                    v-model="emojiModel"
                    :groups="emojiPickerGroups"
                    :placeholder="t('dialog.boop_dialog.select_default_emoji')"
                    :search-placeholder="t('dialog.boop_dialog.select_default_emoji')"
                    :clearable="true"
                    :close-on-select="true"
                    :deselect-on-reselect="true"
                    :maxHeight="230">
                    <template #item="{ item, selected }">
                        <span v-text="item.label"></span>
                        <CheckIcon :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                    </template>
                </VirtualCombobox>
            </div>

            <div
                v-if="isLocalUserVrcPlusSupporter"
                class="grid max-h-[60vh] grid-cols-[repeat(auto-fill,minmax(88px,1fr))] -m-1 gap-2 overflow-y-auto p-1">
                <template v-for="image in emojiTable" :key="image.id">
                    <button
                        v-if="image.versions?.length && image.versions[image.versions.length - 1].file.url"
                        type="button"
                        class="flex aspect-square cursor-pointer items-center justify-center rounded-md border p-0.5 transition-colors"
                        :class="image.id === fileId ? 'border-primary' : 'border-transparent hover:bg-accent'"
                        :aria-pressed="image.id === fileId"
                        @click="fileId = image.id">
                        <Emoji :imageUrl="image.versions[image.versions.length - 1].file.url" class="size-full" />
                    </button>
                </template>
            </div>

            <DialogFooter>
                <Button size="sm" variant="outline" class="sm:mr-auto" @click="showGalleryPage">{{
                    t('dialog.boop_dialog.emoji_manager')
                }}</Button>
                <Button size="sm" variant="secondary" @click="closeDialog">{{ t('dialog.boop_dialog.cancel') }}</Button>
                <Button size="sm" :disabled="!sendBoopDialog.userId" @click="sendBoop">{{
                    t('dialog.boop_dialog.send')
                }}</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { computed, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Check as CheckIcon } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { miscRequest, notificationRequest, queryRequest } from '../../api';
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
    const { isNotificationExpired, handleNotificationV2Hide } = useNotificationStore();

    const fileId = ref('');
    const displayName = ref('');

    watch(
        () => sendBoopDialog.value.visible,
        (visible) => {
            if (visible) {
                displayName.value = '';
                queryRequest.fetch('user.dialog', { userId: sendBoopDialog.value.userId }).then((user) => {
                    displayName.value = user.ref.displayName;
                });
            }
            if (visible && isLocalUserVrcPlusSupporter.value && emojiTable.value.length === 0) {
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

    /**
     * @param emojiName
     */
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

    /**
     * @param userId
     */
    function dismissBoop(userId) {
        // JANK: This is a hack to remove boop notifications when responding
        const array = notificationTable.value.data;
        for (let i = array.length - 1; i >= 0; i--) {
            const ref = array[i];
            if (ref.type !== 'boop' || isNotificationExpired(ref) || ref.link !== `user:${userId}`) {
                continue;
            }
            console.log('Dismissing boop notification with id', ref.id);
            handleNotificationV2Hide(ref.id);
            notificationRequest.hideNotificationV2(ref.id);
        }
    }
</script>
