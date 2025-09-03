<!--<template>-->
<!--    <el-dialog-->
<!--        class="x-dialog"-->
<!--        :model-value="sendBoopDialog.visible"-->
<!--        :title="t('dialog.boop_dialog.header')"-->
<!--        width="450px"-->
<!--        @close="closeDialog">-->
<!--        <el-select-->
<!--            v-model="sendBoopDialog.userId"-->
<!--            :placeholder="t('dialog.new_instance.instance_creator_placeholder')"-->
<!--            filterable-->
<!--            style="width: 100%">-->
<!--            <el-option-group v-if="vipFriends.length" :label="t('side_panel.favorite')">-->
<!--                <el-option-->
<!--                    v-for="friend in vipFriends"-->
<!--                    :key="friend.id"-->
<!--                    class="x-friend-item"-->
<!--                    :label="friend.name"-->
<!--                    :value="friend.id"-->
<!--                    style="height: auto">-->
<!--                    <template v-if="friend.ref">-->
<!--                        <div class="avatar" :class="userStatusClass(friend.ref)">-->
<!--                            <img :src="userImage(friend.ref)" loading="lazy">-->
<!--                        </div>-->
<!--                        <div class="detail">-->
<!--                            <span-->
<!--                                class="name"-->
<!--                                :style="{ color: friend.ref.$userColour }"-->
<!--                                v-text="friend.ref.displayName"></span>-->
<!--                        </div>-->
<!--                    </template>-->
<!--                    <span v-else v-text="friend.id"></span>-->
<!--                </el-option>-->
<!--            </el-option-group>-->
<!--            <el-option-group v-if="onlineFriends.length" :label="t('side_panel.online')">-->
<!--                <el-option-->
<!--                    v-for="friend in onlineFriends"-->
<!--                    :key="friend.id"-->
<!--                    class="x-friend-item"-->
<!--                    :label="friend.name"-->
<!--                    :value="friend.id"-->
<!--                    style="height: auto">-->
<!--                    <template v-if="friend.ref">-->
<!--                        <div class="avatar" :class="userStatusClass(friend.ref)">-->
<!--                            <img :src="userImage(friend.ref)" loading="lazy">-->
<!--                        </div>-->
<!--                        <div class="detail">-->
<!--                            <span-->
<!--                                class="name"-->
<!--                                :style="{ color: friend.ref.$userColour }"-->
<!--                                v-text="friend.ref.displayName"></span>-->
<!--                        </div>-->
<!--                    </template>-->
<!--                    <span v-else v-text="friend.id"></span>-->
<!--                </el-option>-->
<!--            </el-option-group>-->
<!--            <el-option-group v-if="activeFriends.length" :label="t('side_panel.active')">-->
<!--                <el-option-->
<!--                    v-for="friend in activeFriends"-->
<!--                    :key="friend.id"-->
<!--                    class="x-friend-item"-->
<!--                    :label="friend.name"-->
<!--                    :value="friend.id"-->
<!--                    style="height: auto">-->
<!--                    <template v-if="friend.ref">-->
<!--                        <div class="avatar">-->
<!--                            <img :src="userImage(friend.ref)" loading="lazy">-->
<!--                        </div>-->
<!--                        <div class="detail">-->
<!--                            <span-->
<!--                                class="name"-->
<!--                                :style="{ color: friend.ref.$userColour }"-->
<!--                                v-text="friend.ref.displayName"></span>-->
<!--                        </div>-->
<!--                    </template>-->
<!--                    <span v-else v-text="friend.id"></span>-->
<!--                </el-option>-->
<!--            </el-option-group>-->
<!--            <el-option-group v-if="offlineFriends.length" :label="t('side_panel.offline')">-->
<!--                <el-option-->
<!--                    v-for="friend in offlineFriends"-->
<!--                    :key="friend.id"-->
<!--                    class="x-friend-item"-->
<!--                    :label="friend.name"-->
<!--                    :value="friend.id"-->
<!--                    style="height: auto">-->
<!--                    <template v-if="friend.ref">-->
<!--                        <div class="avatar">-->
<!--                            <img :src="userImage(friend.ref)" loading="lazy">-->
<!--                        </div>-->
<!--                        <div class="detail">-->
<!--                            <span-->
<!--                                class="name"-->
<!--                                :style="{ color: friend.ref.$userColour }"-->
<!--                                v-text="friend.ref.displayName"></span>-->
<!--                        </div>-->
<!--                    </template>-->
<!--                    <span v-else v-text="friend.id"></span>-->
<!--                </el-option>-->
<!--            </el-option-group>-->
<!--        </el-select>-->

<!--        <br />-->
<!--        <br />-->

<!--        <el-select-->
<!--            v-model="fileId"-->
<!--            clearable-->
<!--            :placeholder="t('dialog.boop_dialog.select_emoji')"-->
<!--            size="small"-->
<!--            style="width: 100%"-->
<!--            popper-class="max-height-el-select">-->
<!--            <el-option-group :label="t('dialog.boop_dialog.my_emojis')">-->
<!--                <el-option-->
<!--                    v-for="image in emojiTable"-->
<!--                    v-if="image.versions && image.versions.length > 0"-->
<!--                    :key="image.id"-->
<!--                    :value="image.id"-->
<!--                    style="width: 100%; height: 100%">-->
<!--                    <div-->
<!--                        v-if="image.versions[image.versions.length - 1].file.url"-->
<!--                        class="vrcplus-icon"-->
<!--                        style="overflow: hidden; width: 200px; height: 200px; padding: 10px">-->
<!--                        <template v-if="image.frames">-->
<!--                            <div-->
<!--                                class="avatar"-->
<!--                                :style="-->
<!--                                    generateEmojiStyle(-->
<!--                                        image.versions[image.versions.length - 1].file.url,-->
<!--                                        image.framesOverTime,-->
<!--                                        image.frames,-->
<!--                                        image.loopStyle-->
<!--                                    )-->
<!--                                "></div>-->
<!--                        </template>-->
<!--                        <template v-else>-->
<!--                            <img-->
<!--                                :src="image.versions[image.versions.length - 1].file.url"-->
<!--                                class="avatar"-->
<!--                                style="width: 200px; height: 200px" />-->
<!--                        </template>-->
<!--                    </div>-->
<!--                </el-option>-->
<!--            </el-option-group>-->
<!--            <el-option-group :label="t('dialog.boop_dialog.default_emojis')">-->
<!--                <el-option-->
<!--                    v-for="emojiName in photonEmojis"-->
<!--                    :key="emojiName"-->
<!--                    :value="getEmojiValue(emojiName)"-->
<!--                    style="width: 100%; height: 100%">-->
<!--                    <span v-text="emojiName"></span>-->
<!--                </el-option>-->
<!--            </el-option-group>-->
<!--        </el-select>-->

<!--        <template #footer>-->
<!--            <el-button size="small" @click="showGalleryDialog(2)">{{-->
<!--                t('dialog.boop_dialog.emoji_manager')-->
<!--            }}</el-button>-->
<!--            <el-button size="small" @click="closeDialog">{{ t('dialog.boop_dialog.cancel') }}</el-button>-->
<!--            <el-button size="small" :disabled="!sendBoopDialog.userId" @click="sendBoop">{{-->
<!--                t('dialog.boop_dialog.send')-->
<!--            }}</el-button>-->
<!--        </template>-->
<!--    </el-dialog>-->
<!--</template>-->

<!--<script setup>-->
<!--    import { inject, ref } from 'vue';-->
<!--    import { useI18n } from 'vue-i18n-bridge';-->
<!--    import { photonEmojis } from '../../composables/shared/constants/photon.js';-->
<!--    import { notificationRequest } from '../../api';-->
<!--    // import { miscRequest } from '../../api';-->

<!--    const { t } = useI18n();-->

<!--    const userStatusClass = inject('userStatusClass');-->
<!--    const userImage = inject('userImage');-->
<!--    const showGalleryDialog = inject('showGalleryDialog');-->

<!--    const props = defineProps({-->
<!--        sendBoopDialog: {-->
<!--            type: Object,-->
<!--            required: true-->
<!--        },-->
<!--        emojiTable: {-->
<!--            type: Array,-->
<!--            required: true-->
<!--        },-->
<!--        vipFriends: {-->
<!--            type: Array,-->
<!--            required: true-->
<!--        },-->
<!--        onlineFriends: {-->
<!--            type: Array,-->
<!--            required: true-->
<!--        },-->
<!--        activeFriends: {-->
<!--            type: Array,-->
<!--            required: true-->
<!--        },-->
<!--        offlineFriends: {-->
<!--            type: Array,-->
<!--            required: true-->
<!--        },-->
<!--        generateEmojiStyle: {-->
<!--            type: Function,-->
<!--            required: true-->
<!--        },-->
<!--        notificationTable: {-->
<!--            type: Object,-->
<!--            required: true-->
<!--        }-->
<!--    });-->

<!--    const emit = defineEmits(['update:sendBoopDialog']);-->

<!--    const fileId = ref('');-->

<!--    // $app.data.sendBoopDialog = {-->
<!--    //     visible: false,-->
<!--    //     userId: ''-->
<!--    // };-->
<!--    // $app.methods.showSendBoopDialog = function (userId) {-->
<!--    //     this.$nextTick(() =>-->
<!--    //         $app.adjustDialogZ(this.$refs.sendBoopDialog.$el)-->
<!--    //     );-->
<!--    //     const D = this.sendBoopDialog;-->
<!--    //     D.userId = userId;-->
<!--    //     D.visible = true;-->
<!--    //     if (this.emojiTable.length === 0 && API.currentUser.$isVRCPlus) {-->
<!--    //         this.refreshEmojiTable();-->
<!--    //     }-->
<!--    // };-->

<!--    function closeDialog() {-->
<!--        emit('update:sendBoopDialog', {-->
<!--            ...props.sendBoopDialog,-->
<!--            visible: false-->
<!--        });-->
<!--    }-->
<!--    function getEmojiValue(emojiName) {-->
<!--        if (!emojiName) {-->
<!--            return '';-->
<!--        }-->
<!--        return `vrchat_${emojiName.replace(/ /g, '_').toLowerCase()}`;-->
<!--    }-->

<!--    function sendBoop() {-->
<!--        const D = props.sendBoopDialog;-->
<!--        dismissBoop(D.userId);-->
<!--        const params = {-->
<!--            userId: D.userId-->
<!--        };-->
<!--        if (fileId.value) {-->
<!--            params.emojiId = fileId.value;-->
<!--        }-->
<!--        // miscRequest.sendBoop(params);-->
<!--        D.visible = false;-->
<!--    }-->

<!--    function dismissBoop(userId) {-->
<!--        // JANK: This is a hack to remove boop notifications when responding-->
<!--        const array = props.notificationTable.data;-->
<!--        for (let i = array.length - 1; i >= 0; i&#45;&#45;) {-->
<!--            const ref = array[i];-->
<!--            if (ref.type !== 'boop' || ref.$isExpired || ref.senderUserId !== userId) {-->
<!--                continue;-->
<!--            }-->
<!--            notificationRequest.sendNotificationResponse({-->
<!--                notificationId: ref.id,-->
<!--                responseType: 'delete',-->
<!--                responseData: ''-->
<!--            });-->
<!--        }-->
<!--    }-->
<!--</script>-->
