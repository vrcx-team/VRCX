<template>
    <div style="display: flex">
        <img
            v-if="
                !userDialog.loading && (userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride)
            "
            class="x-link"
            :src="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
            style="flex: none; height: 120px; width: 213.33px; border-radius: 12px; object-fit: cover"
            @click="showFullscreenImageDialog(userDialog.ref.profilePicOverride)"
            loading="lazy" />
        <img
            v-else-if="!userDialog.loading"
            class="x-link"
            :src="userDialog.ref.currentAvatarThumbnailImageUrl"
            style="flex: none; height: 120px; width: 160px; border-radius: 12px; object-fit: cover"
            @click="showFullscreenImageDialog(userDialog.ref.currentAvatarImageUrl)"
            loading="lazy" />

        <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
            <div style="flex: 1">
                <div>
                    <TooltipWrapper v-if="userDialog.ref.status" side="top">
                        <template #content>
                            <span>{{ getUserStateText(userDialog.ref) }}</span>
                        </template>
                        <i class="x-user-status" :class="userStatusClass(userDialog.ref)"></i>
                    </TooltipWrapper>
                    <template v-if="userDialog.previousDisplayNames.length > 0">
                        <TooltipWrapper side="bottom">
                            <template #content>
                                <span>{{ t('dialog.user.previous_display_names') }}</span>
                                <div
                                    v-for="data in userDialog.previousDisplayNames"
                                    :key="data.displayName"
                                    placement="top">
                                    <span>{{ data.displayName }}</span>
                                    <span v-if="data.updated_at">
                                        &horbar; {{ formatDateFilter(data.updated_at, 'long') }}</span
                                    >
                                </div>
                            </template>
                            <el-icon><CaretBottom /></el-icon>
                        </TooltipWrapper>
                    </template>
                    <span
                        class="dialog-title"
                        style="margin-left: 5px; margin-right: 5px; cursor: pointer"
                        v-text="userDialog.ref.displayName"
                        @click="copyUserDisplayName(userDialog.ref.displayName)"></span>
                    <TooltipWrapper v-if="userDialog.ref.pronouns" side="top" :content="t('dialog.user.pronouns')">
                        <span
                            class="x-grey"
                            style="margin-right: 5px; font-family: monospace; font-size: 12px"
                            v-text="userDialog.ref.pronouns"></span>
                    </TooltipWrapper>
                    <TooltipWrapper v-for="item in userDialog.ref.$languages" :key="item.key" side="top">
                        <template #content>
                            <span>{{ item.value }} ({{ item.key }})</span>
                        </template>
                        <span
                            class="flags"
                            :class="languageClass(item.key)"
                            style="display: inline-block; margin-right: 5px"></span>
                    </TooltipWrapper>
                    <template v-if="userDialog.ref.id === currentUser.id">
                        <br />
                        <span
                            class="x-grey"
                            style="margin-right: 10px; font-family: monospace; font-size: 12px; cursor: pointer"
                            v-text="currentUser.username"
                            @click="copyUserDisplayName(currentUser.username)"></span>
                    </template>
                </div>
                <div style="margin-top: 5px" v-show="!userDialog.loading">
                    <TooltipWrapper side="top" :content="t('dialog.user.tags.trust_level')">
                        <Badge
                            variant="outline"
                            class="name"
                            :class="userDialog.ref.$trustClass"
                            style="margin-right: 5px; margin-top: 5px">
                            <i class="ri-shield-line"></i> {{ userDialog.ref.$trustLevel }}
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper
                        v-if="userDialog.ref.ageVerified && userDialog.ref.ageVerificationStatus"
                        side="top"
                        :content="t('dialog.user.tags.age_verified')">
                        <Badge
                            variant="outline"
                            class="x-tag-age-verification"
                            style="margin-right: 5px; margin-top: 5px">
                            <template v-if="userDialog.ref.ageVerificationStatus === '18+'">
                                <i class="ri-info-card-line"></i> 18+
                            </template>
                            <template v-else>
                                <i class="ri-info-card-line"></i>
                            </template>
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper
                        v-if="userDialog.isFriend && userDialog.friend"
                        side="top"
                        :content="t('dialog.user.tags.friend_number')">
                        <Badge variant="outline" class="x-tag-friend" style="margin-right: 5px; margin-top: 5px">
                            <i class="ri-user-add-line"></i>
                            {{ userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : '' }}
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper
                        v-if="userDialog.mutualFriendCount"
                        side="top"
                        :content="t('dialog.user.tags.mutual_friends')">
                        <Badge variant="outline" class="x-tag-mutual-friend" style="margin-right: 5px; margin-top: 5px">
                            <i class="ri-group-line"></i>
                            {{ userDialog.mutualFriendCount }}
                        </Badge>
                    </TooltipWrapper>
                    <Badge
                        v-if="userDialog.ref.$isTroll"
                        variant="outline"
                        class="x-tag-troll"
                        style="margin-right: 5px; margin-top: 5px">
                        Nuisance
                    </Badge>
                    <Badge
                        v-if="userDialog.ref.$isProbableTroll"
                        variant="outline"
                        class="x-tag-troll"
                        style="margin-right: 5px; margin-top: 5px">
                        Almost Nuisance
                    </Badge>
                    <Badge
                        v-if="userDialog.ref.$isModerator"
                        variant="outline"
                        class="x-tag-vip"
                        style="margin-right: 5px; margin-top: 5px">
                        {{ t('dialog.user.tags.vrchat_team') }}
                    </Badge>

                    <TooltipWrapper v-if="userDialog.ref.$platform === 'standalonewindows'" side="top" content="PC">
                        <Badge variant="outline" class="x-tag-platform-pc" style="margin-right: 5px; margin-top: 5px">
                            <i class="ri-computer-line"></i>
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper v-else-if="userDialog.ref.$platform === 'android'" side="top" content="Android">
                        <Badge
                            variant="outline"
                            class="x-tag-platform-quest"
                            style="margin-right: 5px; margin-top: 5px">
                            <i class="ri-android-line"></i>
                        </Badge>
                    </TooltipWrapper>
                    <TooltipWrapper v-else-if="userDialog.ref.$platform === 'ios'" side="top" content="iOS">
                        <Badge variant="outline" class="x-tag-platform-ios" style="margin-right: 5px; margin-top: 5px"
                            ><i class="ri-apple-line"></i
                        ></Badge>
                    </TooltipWrapper>
                    <Badge
                        v-else-if="userDialog.ref.$platform"
                        variant="outline"
                        class="x-tag-platform-other"
                        style="margin-right: 5px; margin-top: 5px">
                        {{ userDialog.ref.$platform }}
                    </Badge>

                    <Badge
                        v-if="userDialog.ref.$customTag"
                        variant="outline"
                        class="name"
                        :style="{
                            color: userDialog.ref.$customTagColour,
                            'border-color': userDialog.ref.$customTagColour
                        }"
                        style="margin-right: 5px; margin-top: 5px"
                        >{{ userDialog.ref.$customTag }}</Badge
                    >
                    <br />
                    <TooltipWrapper v-for="badge in userDialog.ref.badges" :key="badge.badgeId" side="top">
                        <template #content>
                            <span>{{ badge.badgeName }}</span>
                            <span v-if="badge.hidden">&nbsp;(Hidden)</span>
                        </template>
                        <div style="display: inline-block">
                            <el-popover placement="bottom" :width="300" trigger="click">
                                <template #reference>
                                    <img
                                        class="x-link x-user-badge"
                                        :src="badge.badgeImageUrl"
                                        style="
                                            flex: none;
                                            height: 32px;
                                            width: 32px;
                                            border-radius: 3px;
                                            object-fit: cover;
                                            margin-top: 5px;
                                            margin-right: 5px;
                                        "
                                        :class="{ 'x-user-badge-hidden': badge.hidden }"
                                        loading="lazy" />
                                </template>
                                <img
                                    :src="badge.badgeImageUrl"
                                    :class="['x-link', 'x-popover-image']"
                                    @click="showFullscreenImageDialog(badge.badgeImageUrl)"
                                    loading="lazy" />
                                <br />
                                <div style="display: block; width: 275px; word-break: normal">
                                    <span>{{ badge.badgeName }}</span>
                                    <br />
                                    <span class="x-grey" style="font-size: 12px">{{ badge.badgeDescription }}</span>
                                    <br />
                                    <span
                                        v-if="badge.assignedAt"
                                        class="x-grey"
                                        style="font-family: monospace; font-size: 12px">
                                        {{ t('dialog.user.badges.assigned') }}:
                                        {{ formatDateFilter(badge.assignedAt, 'long') }}
                                    </span>
                                    <template v-if="userDialog.id === currentUser.id">
                                        <br />
                                        <el-checkbox
                                            v-model="badge.hidden"
                                            style="margin-top: 5px"
                                            @change="toggleBadgeVisibility(badge)">
                                            {{ t('dialog.user.badges.hidden') }}
                                        </el-checkbox>
                                        <br />
                                        <el-checkbox v-model="badge.showcased" @change="toggleBadgeShowcased(badge)">
                                            {{ t('dialog.user.badges.showcased') }}
                                        </el-checkbox>
                                    </template>
                                </div>
                            </el-popover>
                        </div>
                    </TooltipWrapper>
                </div>
                <div style="margin-top: 5px">
                    <span style="font-size: 12px" v-text="userDialog.ref.statusDescription"></span>
                </div>
            </div>

            <div v-if="userDialog.ref.userIcon" style="flex: none; margin-right: 10px">
                <img
                    class="x-link"
                    :src="userImage(userDialog.ref, true, '256', true)"
                    style="flex: none; width: 120px; height: 120px; border-radius: 12px; object-fit: cover"
                    @click="showFullscreenImageDialog(userDialog.ref.userIcon)"
                    loading="lazy" />
            </div>

            <UserActionDropdown :user-dialog-command="userDialogCommand" />
        </div>
    </div>
</template>

<script setup>
    import { CaretBottom } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { formatDateFilter, languageClass, userImage, userStatusClass } from '../../../shared/utils';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { Badge } from '../../ui/badge';

    import UserActionDropdown from './UserActionDropdown.vue';

    const props = defineProps({
        getUserStateText: {
            type: Function,
            required: true
        },

        copyUserDisplayName: {
            type: Function,
            required: true
        },
        toggleBadgeVisibility: {
            type: Function,
            required: true
        },
        toggleBadgeShowcased: {
            type: Function,
            required: true
        },
        userDialogCommand: {
            type: Function,
            required: true
        }
    });

    const { t } = useI18n();

    const { userDialog, currentUser } = storeToRefs(useUserStore());

    const { showFullscreenImageDialog } = useGalleryStore();

    const getUserStateText = props.getUserStateText;
    const copyUserDisplayName = props.copyUserDisplayName;
    const toggleBadgeVisibility = props.toggleBadgeVisibility;
    const toggleBadgeShowcased = props.toggleBadgeShowcased;
    const userDialogCommand = props.userDialogCommand;
</script>
