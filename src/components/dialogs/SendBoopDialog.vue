<template>
    <el-dialog
        class="x-dialog"
        v-model="sendBoopDialog.visible"
        :title="t('dialog.boop_dialog.header')"
        width="450px"
        @close="closeDialog">
        <el-select
            v-if="sendBoopDialog.visible"
            v-model="sendBoopDialog.userId"
            :placeholder="t('dialog.new_instance.instance_creator_placeholder')"
            filterable
            style="width: 100%">
            <el-option-group v-if="vipFriends.length" :label="t('side_panel.favorite')">
                <el-option
                    v-for="friend in vipFriends"
                    :key="friend.id"
                    :label="friend.name"
                    :value="friend.id"
                    style="height: auto"
                    class="x-friend-item">
                    <template v-if="friend.ref">
                        <div class="avatar" :class="userStatusClass(friend.ref)">
                            <img :src="userImage(friend.ref)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span
                                class="name"
                                :style="{ color: friend.ref.$userColour }"
                                v-text="friend.ref.displayName"></span>
                        </div>
                    </template>
                    <span v-else v-text="friend.id"></span>
                </el-option>
            </el-option-group>
            <el-option-group v-if="onlineFriends.length" :label="t('side_panel.online')">
                <el-option
                    v-for="friend in onlineFriends"
                    :key="friend.id"
                    :label="friend.name"
                    :value="friend.id"
                    style="height: auto"
                    class="x-friend-item">
                    <template v-if="friend.ref">
                        <div class="avatar" :class="userStatusClass(friend.ref)">
                            <img :src="userImage(friend.ref)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span
                                class="name"
                                :style="{ color: friend.ref.$userColour }"
                                v-text="friend.ref.displayName"></span>
                        </div>
                    </template>
                    <span v-else v-text="friend.id"></span>
                </el-option>
            </el-option-group>
            <el-option-group v-if="activeFriends.length" :label="t('side_panel.active')">
                <el-option
                    v-for="friend in activeFriends"
                    :key="friend.id"
                    :label="friend.name"
                    :value="friend.id"
                    style="height: auto"
                    class="x-friend-item">
                    <template v-if="friend.ref">
                        <div class="avatar">
                            <img :src="userImage(friend.ref)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span
                                class="name"
                                :style="{ color: friend.ref.$userColour }"
                                v-text="friend.ref.displayName"></span>
                        </div>
                    </template>
                    <span v-else v-text="friend.id"></span>
                </el-option>
            </el-option-group>
            <el-option-group v-if="offlineFriends.length" :label="t('side_panel.offline')">
                <el-option
                    v-for="friend in offlineFriends"
                    :key="friend.id"
                    :label="friend.name"
                    :value="friend.id"
                    style="height: auto"
                    class="x-friend-item">
                    <template v-if="friend.ref">
                        <div class="avatar">
                            <img :src="userImage(friend.ref)" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span
                                class="name"
                                :style="{ color: friend.ref.$userColour }"
                                v-text="friend.ref.displayName"></span>
                        </div>
                    </template>
                    <span v-else v-text="friend.id"></span>
                </el-option>
            </el-option-group>
        </el-select>

        <br />
        <br />

        <el-select
            v-if="sendBoopDialog.visible"
            v-model="fileId"
            clearable
            :placeholder="t('dialog.boop_dialog.select_emoji')"
            size="small"
            style="width: 100%">
            <el-option-group :label="t('dialog.boop_dialog.default_emojis')">
                <el-option
                    v-for="emojiName in photonEmojis"
                    :key="emojiName"
                    :value="getEmojiValue(emojiName)"
                    style="width: 100%; height: 100%">
                    <span v-text="emojiName"></span>
                </el-option>
            </el-option-group>
        </el-select>

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
            <el-card
                v-for="image in emojiTable"
                :key="image.id"
                :body-style="{ padding: '0' }"
                :class="image.id === fileId ? 'x-image-selected' : ''"
                style="cursor: pointer"
                @click="fileId = image.id"
                shadow="hover">
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
            </el-card>
        </div>

        <template #footer>
            <el-button
                size="small"
                @click="
                    redirectToToolsTab();
                    showGalleryDialog();
                "
                >{{ t('dialog.boop_dialog.emoji_manager') }}</el-button
            >
            <el-button size="small" @click="closeDialog">{{ t('dialog.boop_dialog.cancel') }}</el-button>
            <el-button size="small" :disabled="!sendBoopDialog.userId" @click="sendBoop">{{
                t('dialog.boop_dialog.send')
            }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { userImage, userStatusClass } from '../../shared/utils';
    import { miscRequest } from '../../api';
    import { notificationRequest } from '../../api';
    import { photonEmojis } from '../../shared/constants/photon.js';
    import { redirectToToolsTab } from '../../shared/utils/base/ui';
    import { useFriendStore } from '../../stores';
    import { useGalleryStore } from '../../stores';
    import { useNotificationStore } from '../../stores';
    import { useUserStore } from '../../stores/user.js';

    import Emoji from '../Emoji.vue';

    const { t } = useI18n();

    const { sendBoopDialog } = storeToRefs(useUserStore());
    const { notificationTable } = storeToRefs(useNotificationStore());
    const { showGalleryDialog, refreshEmojiTable } = useGalleryStore();
    const { emojiTable } = storeToRefs(useGalleryStore());
    const { vipFriends, onlineFriends, activeFriends, offlineFriends } = useFriendStore();
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const fileId = ref('');

    watch(
        () => sendBoopDialog.value.visible,
        (visible) => {
            if (visible && emojiTable.value.length === 0) {
                refreshEmojiTable();
            }
        }
    );

    function closeDialog() {
        sendBoopDialog.value.visible = false;
    }
    function getEmojiValue(emojiName) {
        if (!emojiName) {
            return '';
        }
        return `default_${emojiName.replace(/ /g, '_').toLowerCase()}`;
    }

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
