<template>
    <div class="rounded-xl bg-muted/40 overflow-hidden flex flex-col">
        <!-- Profile image -->
        <div class="relative overflow-hidden" style="height: 168px">
            <img
                v-if="
                    !userDialog.loading &&
                    !profileImageError &&
                    (userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride)
                "
                class="w-full h-full object-cover cursor-pointer"
                :src="userDialog.ref.profilePicOverrideThumbnail || userDialog.ref.profilePicOverride"
                @click="showFullscreenImageDialog(userDialog.ref.profilePicOverride)"
                @error="profileImageError = true"
                loading="lazy" />
            <img
                v-else-if="!userDialog.loading && !profileImageError && userDialog.ref.currentAvatarThumbnailImageUrl"
                class="w-full h-full object-cover cursor-pointer"
                :src="userDialog.ref.currentAvatarThumbnailImageUrl"
                @click="showFullscreenImageDialog(userDialog.ref.currentAvatarImageUrl)"
                @error="profileImageError = true"
                loading="lazy" />
            <div v-else class="w-full h-full flex items-center justify-center bg-muted">
                <Image class="size-8 text-muted-foreground" />
            </div>
            <!-- User icon circle -->
            <div
                v-if="!userDialog.loading && userDialog.ref.userIcon && !userIconError"
                class="absolute bottom-2 left-2 overflow-hidden rounded-lg"
                style="width: 64px; height: 64px; border: 2px solid hsl(var(--background))">
                <img
                    class="w-full h-full object-cover cursor-pointer"
                    :src="userImage(userDialog.ref, true, '256', true)"
                    @click.stop="showFullscreenImageDialog(userDialog.ref.userIcon)"
                    @error="userIconError = true"
                    loading="lazy" />
            </div>
        </div>

        <!-- Card content with padding -->
        <div class="flex flex-col gap-2 p-3">
            <!-- Name pronound and stuff -->
            <div class="flex items-start gap-1.5">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-x-1 leading-snug">
                        <TooltipWrapper v-if="userDialog.ref.status" side="top">
                            <template #content>
                                <span>{{ getUserStateText(userDialog.ref) }}</span>
                            </template>
                            <i class="x-user-status flex-none" :class="userStatusClass(userDialog.ref)"></i>
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
                                <ChevronDown class="inline-block" />
                            </TooltipWrapper>
                        </template>
                        <span
                            class="font-bold cursor-pointer"
                            v-text="userDialog.ref.displayName"
                            @click="copyUserDisplayName(userDialog.ref.displayName)"></span>
                        <TooltipWrapper v-if="userDialog.ref.pronouns" side="top" :content="t('dialog.user.pronouns')">
                            <span class="x-grey font-mono text-xs" v-text="userDialog.ref.pronouns"></span>
                        </TooltipWrapper>
                    </div>
                    <template v-if="userDialog.ref.id === currentUser.id">
                        <span
                            class="x-grey font-mono text-xs cursor-pointer"
                            v-text="currentUser.username"
                            @click="copyUserDisplayName(currentUser.username)"></span>
                    </template>
                </div>
                <UserActionDropdown class="flex-none mt-0.5" :user-dialog-command="userDialogCommand" />
            </div>

            <!-- badges and trust and platform -->
            <div class="flex flex-wrap gap-1" v-show="!userDialog.loading">
                <TooltipWrapper side="top" :content="t('dialog.user.tags.trust_level')">
                    <Badge variant="outline" class="name" :class="userDialog.ref.$trustClass">
                        <Shield class="h-3 w-3" /> {{ userDialog.ref.$trustLevel }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.ref.ageVerified && userDialog.ref.ageVerificationStatus"
                    side="top"
                    :content="t('dialog.user.tags.age_verified')">
                    <Badge variant="outline" class="text-[#3b82f6] border-[#3b82f6]!">
                        <template v-if="userDialog.ref.ageVerificationStatus === '18+'">
                            <IdCard class="h-3 w-3" /> 18+
                        </template>
                        <template v-else>
                            <IdCard class="h-3 w-3" />
                        </template>
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.isFriend && userDialog.friend"
                    side="top"
                    :content="t('dialog.user.tags.friend_number')">
                    <Badge variant="outline" class="text-amber-400 border-amber-400!">
                        <UserPlus class="h-3 w-3" />
                        {{ userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : '' }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.mutualFriendCount"
                    side="top"
                    :content="t('dialog.user.tags.mutual_friends')">
                    <Badge variant="outline" class="border-zinc-500/50! dark:border-zinc-400!">
                        <Users class="h-3 w-3" />
                        {{ userDialog.mutualFriendCount }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.ref.discordId"
                    side="top"
                    :content="t('dialog.user.tags.open_in_discord')">
                    <Badge
                        variant="outline"
                        class="text-[#7289da] border-[#7289da]! cursor-pointer"
                        @click="openDiscordProfile(userDialog.ref.discordId)">
                        <i class="ri-discord-line text-xs"></i>
                        {{ t('dialog.user.tags.discord') }}
                    </Badge>
                </TooltipWrapper>
                <Badge v-if="userDialog.ref.$isTroll" variant="outline" class="x-tag-troll">
                    {{ t('view.settings.appearance.user_colors.trust_levels.nuisance') }}
                </Badge>
                <Badge v-if="userDialog.ref.$isProbableTroll" variant="outline" class="x-tag-troll">
                    {{ t('view.favorite.avatars.almost_nuisance') }}
                </Badge>
                <Badge v-if="userDialog.ref.$isModerator" variant="outline" class="x-tag-vip">
                    {{ t('dialog.user.tags.vrchat_team') }}
                </Badge>
                <TooltipWrapper v-if="userDialog.ref.$platform === 'standalonewindows'" side="top" content="PC">
                    <Badge variant="outline" class="text-platform-pc border-platform-pc!">
                        <Monitor class="m-0.5 text-platform-pc" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'android'" side="top" content="Android">
                    <Badge variant="outline" class="text-platform-quest border-platform-quest!">
                        <Smartphone class="m-0.5 text-platform-quest" />
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'ios'" side="top" content="iOS">
                    <Badge variant="outline" class="text-platform-ios border-platform-ios">
                        <Apple class="m-0.5 text-platform-ios" />
                    </Badge>
                </TooltipWrapper>
                <Badge v-else-if="userDialog.ref.$platform" variant="outline" class="text-muted-foreground">
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
                    >{{ userDialog.ref.$customTag }}</Badge
                >
            </div>

            <!-- Language text badges -->
            <div v-if="userDialog.ref.$languages && userDialog.ref.$languages.length" class="flex flex-wrap gap-1">
                <Badge v-for="item in userDialog.ref.$languages" :key="item.key" variant="outline" class="text-xs">
                    {{ item.value }} ({{ item.key }})
                </Badge>
            </div>

            <!-- VRC Badges -->
            <div v-if="userDialog.ref.badges && userDialog.ref.badges.length" class="flex flex-wrap gap-1.5">
                <TooltipWrapper v-for="badge in userDialog.ref.badges" :key="badge.badgeId" side="top">
                    <template #content>
                        <span>{{ badge.badgeName }}</span>
                        <span v-if="badge.hidden">&nbsp;(Hidden)</span>
                    </template>
                    <div style="display: inline-block">
                        <Popover>
                            <PopoverTrigger asChild>
                                <img
                                    class="cursor-pointer hover:grayscale-0"
                                    :src="badge.badgeImageUrl"
                                    style="
                                        height: 30px;
                                        width: 30px;
                                        border-radius: var(--radius-sm);
                                        object-fit: cover;
                                    "
                                    :class="{ grayscale: badge.hidden }"
                                    loading="lazy" />
                            </PopoverTrigger>
                            <PopoverContent side="right" class="w-75">
                                <img
                                    :src="badge.badgeImageUrl"
                                    :class="['cursor-pointer', 'max-w-full', 'max-h-full']"
                                    @click="showFullscreenImageDialog(badge.badgeImageUrl)"
                                    loading="lazy" />
                                <br />
                                <div style="display: block; width: 275px; word-break: normal">
                                    <span>{{ badge.badgeName }}</span>
                                    <br />
                                    <span class="x-grey text-xs">{{ badge.badgeDescription }}</span>
                                    <br />
                                    <span v-if="badge.assignedAt" class="x-grey font-mono text-xs">
                                        {{ t('dialog.user.badges.assigned') }}:
                                        {{ formatDateFilter(badge.assignedAt, 'long') }}
                                    </span>
                                    <template v-if="userDialog.id === currentUser.id">
                                        <br />
                                        <label class="inline-flex items-center gap-2" style="margin-top: 6px">
                                            <Checkbox
                                                v-model="badge.hidden"
                                                @update:modelValue="toggleBadgeVisibility(badge)" />
                                            <span>{{ t('dialog.user.badges.hidden') }}</span>
                                        </label>
                                        <br />
                                        <label class="inline-flex items-center gap-2">
                                            <Checkbox
                                                v-model="badge.showcased"
                                                @update:modelValue="toggleBadgeShowcased(badge)" />
                                            <span>{{ t('dialog.user.badges.showcased') }}</span>
                                        </label>
                                    </template>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </TooltipWrapper>
            </div>

            <!-- Status description -->
            <div
                v-if="userDialog.ref.statusDescription"
                class="flex items-center gap-1.5 text-xs text-muted-foreground"
                :class="{ 'cursor-pointer hover:text-foreground': userDialog.ref.id === currentUser.id }"
                @click="userDialog.ref.id === currentUser.id ? userDialogCommand('Edit Social Status') : undefined">
                <Pencil class="h-3 w-3 flex-none opacity-60" />
                <span class="break-all">{{ userDialog.ref.statusDescription }}</span>
            </div>

            <div class="border-t border-border"></div>

            <!-- Info / settings rows -->
            <div class="flex flex-col gap-1.5">
                <template v-if="currentUser.id === userDialog.id">
                    <div
                        class="flex justify-between items-center text-xs cursor-pointer hover:text-foreground"
                        @click="toggleAvatarCopying">
                        <span class="text-muted-foreground">{{ t('dialog.user.info.avatar_cloning') }}</span>
                        <span class="text-muted-foreground">{{
                            currentUser.allowAvatarCopying
                                ? t('dialog.user.info.avatar_cloning_allow')
                                : t('dialog.user.info.avatar_cloning_deny')
                        }}</span>
                    </div>
                    <div
                        class="flex justify-between items-center text-xs cursor-pointer hover:text-foreground"
                        @click="toggleAllowBooping">
                        <span class="text-muted-foreground">{{ t('dialog.user.info.booping') }}</span>
                        <span class="text-muted-foreground">{{
                            currentUser.isBoopingEnabled
                                ? t('dialog.user.info.avatar_cloning_allow')
                                : t('dialog.user.info.avatar_cloning_deny')
                        }}</span>
                    </div>
                    <div
                        class="flex justify-between items-center text-xs cursor-pointer hover:text-foreground"
                        @click="toggleSharedConnectionsOptOut">
                        <span class="text-muted-foreground">{{ t('dialog.user.info.show_mutual_friends') }}</span>
                        <span class="text-muted-foreground">{{
                            !currentUser.hasSharedConnectionsOptOut
                                ? t('dialog.user.info.avatar_cloning_allow')
                                : t('dialog.user.info.avatar_cloning_deny')
                        }}</span>
                    </div>
                    <div
                        class="flex justify-between items-center text-xs cursor-pointer hover:text-foreground"
                        @click="toggleDiscordFriendsOptOut">
                        <span class="text-muted-foreground">{{ t('dialog.user.info.show_discord_connections') }}</span>
                        <span class="text-muted-foreground">{{
                            !currentUser.hasDiscordFriendsOptOut
                                ? t('dialog.user.info.avatar_cloning_allow')
                                : t('dialog.user.info.avatar_cloning_deny')
                        }}</span>
                    </div>
                </template>
                <!-- Others -->
                <template v-else>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-muted-foreground">{{ t('dialog.user.info.avatar_cloning') }}</span>
                        <span class="text-muted-foreground">{{
                            userDialog.ref.allowAvatarCopying
                                ? t('dialog.user.info.avatar_cloning_allow')
                                : t('dialog.user.info.avatar_cloning_deny')
                        }}</span>
                    </div>
                </template>

                <!-- User ID -->
                <div class="flex items-center gap-1 text-xs">
                    <span class="text-muted-foreground shrink-0">{{ t('dialog.user.info.id') }}</span>
                    <span class="flex-1 truncate font-mono text-[10px] text-muted-foreground">{{ userDialog.id }}</span>
                    <TooltipWrapper side="top" :content="t('dialog.user.info.id_tooltip')">
                        <Button
                            class="h-4 w-4 flex-none rounded-full"
                            size="icon-sm"
                            variant="ghost"
                            @click.stop="copyUserId(userDialog.id)">
                            <Copy class="h-2.5 w-2.5" />
                        </Button>
                    </TooltipWrapper>
                </div>

                <!-- VRChat URL -->
                <div class="flex items-center gap-1 text-xs">
                    <span class="text-muted-foreground shrink-0">VRChat URL</span>
                    <span class="flex-1 truncate text-[10px] text-muted-foreground"
                        >vrchat.com/home/user/{{ userDialog.id }}</span
                    >
                    <TooltipWrapper side="top" :content="t('dialog.user.info.copy_url')">
                        <Button
                            class="h-4 w-4 flex-none rounded-full"
                            size="icon-sm"
                            variant="ghost"
                            @click.stop="openUserURL(userDialog.id)">
                            <ExternalLink class="h-2.5 w-2.5" />
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
        </div>
        <!-- the end of this crap card -->
    </div>
</template>

<script setup>
    import {
        Apple,
        ChevronDown,
        Copy,
        ExternalLink,
        IdCard,
        Image,
        Monitor,
        Pencil,
        Shield,
        Smartphone,
        UserPlus,
        Users
    } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { copyToClipboard, formatDateFilter, openDiscordProfile, openExternalLink } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { Badge } from '../../ui/badge';
    import { Button } from '../../ui/button';
    import { Checkbox } from '../../ui/checkbox';
    import { userRequest } from '../../../api';

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
    const { toggleSharedConnectionsOptOut, toggleDiscordFriendsOptOut } = useUserStore();

    const { showFullscreenImageDialog } = useGalleryStore();
    const { userImage, userStatusClass } = useUserDisplay();

    const profileImageError = ref(false);
    const userIconError = ref(false);

    watch(
        () => userDialog.value.id,
        () => {
            profileImageError.value = false;
            userIconError.value = false;
        }
    );

    const getUserStateText = props.getUserStateText;
    const copyUserDisplayName = props.copyUserDisplayName;
    const toggleBadgeVisibility = props.toggleBadgeVisibility;
    const toggleBadgeShowcased = props.toggleBadgeShowcased;
    const userDialogCommand = props.userDialogCommand;

    function toggleAvatarCopying() {
        userRequest.saveCurrentUser({ allowAvatarCopying: !currentUser.value.allowAvatarCopying });
    }

    function toggleAllowBooping() {
        userRequest.saveCurrentUser({ isBoopingEnabled: !currentUser.value.isBoopingEnabled });
    }

    function copyUserId(userId) {
        copyToClipboard(userId, t('message.user.id_copied'));
    }

    function openUserURL(userId) {
        openExternalLink(`https://vrchat.com/home/user/${userId}`);
    }
</script>

