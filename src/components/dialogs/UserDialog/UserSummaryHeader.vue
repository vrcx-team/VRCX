<template>
    <div class="rounded-xl bg-(--profile-card) overflow-hidden flex flex-col">
        <div class="relative aspect-17/6">
            <div
                v-if="
                    userDialog.loading ||
                    profileImageError ||
                    userDialog.ref.bannerType === 'color' ||
                    !userDialog.ref.bannerUrl
                "
                class="absolute inset-0"
                :style="{
                    backgroundColor: userDialog.ref.bannerColor ? `#${userDialog.ref.bannerColor}` : 'hsl(var(--muted))'
                }"></div>
            <img
                v-else
                class="absolute inset-0 block h-full w-full cursor-pointer object-cover"
                :src="userDialog.ref.bannerUrl"
                @click="showFullscreenImageDialog(userDialog.ref.bannerUrl)"
                @error="profileImageError = true"
                loading="lazy" />
            <div
                class="absolute bottom-0 left-3 z-10 translate-y-1/2 overflow-hidden rounded-lg"
                style="
                    width: 96px;
                    height: 96px;
                    filter: drop-shadow(0 0 1px rgb(0 0 0 / 0.95)) drop-shadow(0 0 4px rgb(0 0 0 / 0.75))
                        drop-shadow(0 2px 8px rgb(0 0 0 / 0.55));
                ">
                <Image
                    v-if="userDialog.loading || userIconError"
                    class="w-full! h-full! object-cover text-muted-foreground bg-accent" />
                <img
                    v-else
                    class="w-full h-full object-cover cursor-pointer"
                    :src="userImage(userDialog.ref, true, '256', true)"
                    @click.stop="
                        showFullscreenImageDialog(userDialog.ref.userIcon || userDialog.ref.currentAvatarImageUrl)
                    "
                    @error="userIconError = true"
                    loading="lazy" />
            </div>
        </div>

        <div class="flex flex-col gap-2 px-3 pb-3 pt-15">
            <div class="flex items-start gap-1.5">
                <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-x-1 leading-snug">
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
                            class="font-bold cursor-pointer wrap-anywhere"
                            v-text="userDialog.ref.displayName"
                            @click="copyUserDisplayName(userDialog.ref.displayName)"></span>
                        <TooltipWrapper
                            v-if="userDialog.publicProfileRef?.isEconomyCreator"
                            side="top"
                            :content="t('dialog.user.info.economy_creator')">
                            <BadgeCheck class="h-3.5 w-3.5 text-[#3b82f6]" />
                        </TooltipWrapper>
                        <TooltipWrapper v-if="userDialog.ref.pronouns" side="top" :content="t('dialog.user.pronouns')">
                            <span class="x-grey font-mono text-xs" v-text="userDialog.ref.pronouns"></span>
                        </TooltipWrapper>
                    </div>
                    <template v-if="userDialog.ref.id === currentUser.id">
                        <span
                            class="x-grey font-mono text-xs cursor-pointer"
                            v-text="currentUser.username"
                            @click="copyToClipboard(currentUser.username)"></span>
                    </template>
                    <div
                        v-if="userDialog.ref.status || userDialog.ref.statusDescription"
                        class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
                        :class="{ 'cursor-pointer hover:text-foreground': userDialog.ref.id === currentUser.id }"
                        @click="userDialog.ref.id === currentUser.id ? showEditProfileDialog() : undefined">
                        <TooltipWrapper v-if="userDialog.ref.status" side="top">
                            <template #content>
                                <span>{{ getUserStateText(userDialog.ref) }}</span>
                            </template>
                            <i class="x-user-status mt-0.5 flex-none" :class="userStatusClass(userDialog.ref)"></i>
                        </TooltipWrapper>
                        <div class="min-w-0">
                            <span v-if="!userDialog.ref.statusDescription" class="block wrap-anywhere">{{
                                getUserStateText(userDialog.ref)
                            }}</span>
                            <span v-if="userDialog.ref.statusDescription" class="block wrap-anywhere">{{
                                userDialog.ref.statusDescription
                            }}</span>
                        </div>
                    </div>
                </div>
                <UserActionDropdown class="flex-none mt-0.5" :user-dialog-command="userDialogCommand" />
            </div>

            <div class="flex flex-wrap gap-1 text-[11px]" v-show="!userDialog.loading">
                <TooltipWrapper side="top" :content="t('dialog.user.tags.trust_level')">
                    <Badge
                        variant="outline"
                        class="name h-5 px-1.5 text-[11px] leading-none"
                        :class="userDialog.ref.$trustClass">
                        <Shield class="h-2.5 w-2.5" /> {{ userDialog.ref.$trustLevel }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.ref.ageVerified && userDialog.ref.ageVerificationStatus"
                    side="top"
                    :content="t('dialog.user.tags.age_verified')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none text-[#3b82f6] border-[#3b82f6]!">
                        <template v-if="userDialog.ref.ageVerificationStatus === '18+'">
                            <IdCard class="h-2.5 w-2.5" /> 18+
                        </template>
                        <template v-else>
                            <IdCard class="h-2.5 w-2.5" />
                        </template>
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.isFriend && userDialog.friend"
                    side="top"
                    :content="t('dialog.user.tags.friend_number')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none text-amber-400 border-amber-400!">
                        <UserPlus class="h-2.5 w-2.5" />
                        {{ userDialog.ref.$friendNumber ? userDialog.ref.$friendNumber : '' }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.mutualFriendCount"
                    side="top"
                    :content="t('dialog.user.tags.mutual_friends')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none border-zinc-500/50! dark:border-zinc-400!">
                        <Users class="h-2.5 w-2.5" />
                        {{ userDialog.mutualFriendCount }}
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="userDialog.ref.discordId"
                    side="top"
                    :content="t('dialog.user.tags.open_in_discord')">
                    <Badge
                        variant="outline"
                        class="h-5 px-1.5 text-[11px] leading-none text-[#7289da] border-[#7289da]! cursor-pointer"
                        @click="openDiscordProfile(userDialog.ref.discordId)">
                        <i
                            class="ri-discord-line inline-flex mt-0.5 h-2.5 w-2.5 items-center justify-center text-[10px] leading-none before:block before:leading-none"></i>
                        {{ t('dialog.user.tags.discord') }}
                    </Badge>
                </TooltipWrapper>
                <Badge
                    v-if="userDialog.ref.$isTroll"
                    variant="outline"
                    class="x-tag-troll h-5 px-1.5 text-[11px] leading-none">
                    {{ t('view.settings.appearance.user_colors.trust_levels.nuisance') }}
                </Badge>
                <Badge
                    v-if="userDialog.ref.$isProbableTroll"
                    variant="outline"
                    class="x-tag-troll h-5 px-1.5 text-[11px] leading-none">
                    {{ t('view.favorite.avatars.almost_nuisance') }}
                </Badge>
                <Badge
                    v-if="userDialog.ref.$isModerator"
                    variant="outline"
                    class="x-tag-vip h-5 px-1.5 text-[11px] leading-none">
                    {{ t('dialog.user.tags.vrchat_team') }}
                </Badge>
                <TooltipWrapper v-if="userDialog.ref.$platform === 'standalonewindows'" side="top" content="PC">
                    <Badge variant="outline" class="h-5 px-1.5 text-[11px] text-platform-pc border-platform-pc!">
                        <Monitor class="h-3 w-3 text-platform-pc" />
                        PC
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'android'" side="top" content="Android">
                    <Badge variant="outline" class="h-5 px-1.5 text-[11px] text-platform-quest border-platform-quest!">
                        <Smartphone class="h-3 w-3 text-platform-quest" />
                        Android
                    </Badge>
                </TooltipWrapper>
                <TooltipWrapper v-else-if="userDialog.ref.$platform === 'ios'" side="top" content="iOS">
                    <Badge variant="outline" class="h-5 px-1.5 text-[11px] text-platform-ios border-platform-ios">
                        <Apple class="h-3 w-3 text-platform-ios" />
                        iOS
                    </Badge>
                </TooltipWrapper>
                <Badge
                    v-else-if="userDialog.ref.$platform"
                    variant="outline"
                    class="h-5 px-1.5 text-[11px] leading-none text-muted-foreground">
                    {{ userDialog.ref.$platform }}
                </Badge>
                <Badge
                    v-if="userDialog.ref.$customTag"
                    variant="outline"
                    class="name h-5 px-1.5 text-[11px] leading-none"
                    :style="{
                        color: userDialog.ref.$customTagColour,
                        'border-color': userDialog.ref.$customTagColour
                    }"
                    >{{ userDialog.ref.$customTag }}</Badge
                >
            </div>

            <div v-if="userDialog.ref.$languages && userDialog.ref.$languages.length" class="flex flex-wrap gap-1">
                <Badge
                    v-for="item in userDialog.ref.$languages"
                    :key="item.key"
                    variant="outline"
                    class="h-5 px-1.5 inline-flex items-center gap-1 text-[11px] leading-none border-muted-foreground/30">
                    <span class="flags inline-block shrink-0 self-center" :class="languageClass(item.key)"></span>
                    <span class="inline-flex items-center leading-none">{{ item.value }} ({{ item.key }})</span>
                </Badge>
            </div>

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

            <div
                v-if="currentUser.id === userDialog.id"
                class="border-t border-muted-foreground/20 flex flex-col gap-1.5">
                <div
                    class="flex justify-between items-center text-xs cursor-pointer hover:text-foreground mt-1.5"
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
            </div>
        </div>
    </div>

    <div class="rounded-xl bg-(--profile-card) p-3 flex flex-col mt-2">
        <div
            class="text-[10px] font-bold uppercase tracking-wide mb-2 pb-2 border-b border-muted-foreground/20"
            :style="{ color: userDialog.theme.subtextColor }">
            {{
                userDialog.id !== currentUser.id &&
                userDialog.ref.profilePicOverride &&
                userDialog.ref.currentAvatarImageUrl
                    ? t('dialog.user.info.avatar_info_last_seen')
                    : t('dialog.user.info.avatar_info')
            }}
            <span class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                <TooltipWrapper
                    v-if="userDialog.ref.profilePicOverride && !userDialog.ref.currentAvatarImageUrl"
                    side="top"
                    :content="t('dialog.user.info.vrcplus_hides_avatar')">
                    <Info class="inline-block h-3 w-3 align-middle" :style="{ color: userDialog.theme.iconColor }" />
                </TooltipWrapper>
            </span>
        </div>
        <div class="text-xs flex justify-between gap-2">
            <AvatarInfo
                :key="userDialog.id"
                :imageurl="userDialog.ref.currentAvatarImageUrl"
                :userid="userDialog.id"
                :avatartags="userDialog.ref.currentAvatarTags"
                style="display: inline-block" />
            <img
                v-if="userDialog.ref.currentAvatarThumbnailImageUrl"
                class="h-12 w-16 rounded-lg object-cover cursor-pointer flex-none"
                :src="userDialog.ref.currentAvatarThumbnailImageUrl"
                @click="
                    showFullscreenImageDialog(
                        userDialog.ref.currentAvatarImageUrl || userDialog.ref.currentAvatarThumbnailImageUrl
                    )
                "
                loading="lazy" />
        </div>
    </div>

    <div class="rounded-xl bg-(--profile-card) p-3 flex flex-col mt-2">
        <div
            class="text-[10px] font-bold uppercase tracking-wide mb-2 pb-2 border-b border-muted-foreground/20"
            :style="{ color: userDialog.theme.subtextColor }">
            {{ t('dialog.user.info.represented_group') }}
        </div>
        <div
            v-if="
                userDialog.isRepresentedGroupLoading ||
                (userDialog.representedGroup && userDialog.representedGroup.isRepresenting)
            "
            class="flex items-center gap-2.5 cursor-pointer"
            @click="showGroupDialog(userDialog.representedGroup.groupId)">
            <div class="flex-1 min-w-0">
                <div class="text-xs font-medium truncate">
                    <span v-if="userDialog.representedGroup.ownerId === userDialog.id" class="mr-1">👑</span>
                    <span v-text="userDialog.representedGroup.name"></span>
                </div>
                <div class="text-xs text-muted-foreground">({{ userDialog.representedGroup.memberCount }})</div>
            </div>
            <div style="display: inline-block; flex: none; margin-right: 0">
                <Avatar
                    class="cursor-pointer size-10! rounded-lg!"
                    :style="{ background: userDialog.isRepresentedGroupLoading ? 'var(--muted)' : '' }"
                    @click.stop="showFullscreenImageDialog(userDialog.representedGroup.iconUrl)">
                    <AvatarImage
                        :src="userDialog.representedGroup.$thumbnailUrl"
                        @load="userDialog.isRepresentedGroupLoading = false"
                        @error="userDialog.isRepresentedGroupLoading = false" />
                    <AvatarFallback class="rounded-lg!">
                        <Image class="size-4 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
        <div v-else class="text-xs text-muted-foreground">—</div>

        <div class="mt-2">
            <img
                v-if="userDialog.representedGroup.bannerUrl"
                class="w-full rounded-lg object-cover cursor-pointer h-[80px] aspect-6/1"
                :src="userDialog.representedGroup.bannerUrl"
                @click="showFullscreenImageDialog(userDialog.representedGroup.bannerUrl)"
                loading="lazy" />
        </div>
    </div>
</template>

<script setup>
    import {
        Apple,
        BadgeCheck,
        ChevronDown,
        IdCard,
        Image,
        Info,
        Monitor,
        Shield,
        Smartphone,
        UserPlus,
        Users
    } from 'lucide-vue-next';
    import { ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { copyToClipboard, formatDateFilter, languageClass, openDiscordProfile } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
    import { useGalleryStore, useUserStore } from '../../../stores';
    import { Badge } from '../../ui/badge';
    import { Checkbox } from '../../ui/checkbox';

    import UserActionDropdown from './UserActionDropdown.vue';
    import { showGroupDialog } from '@/coordinators/groupCoordinator';

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
    const { toggleSharedConnectionsOptOut, toggleDiscordFriendsOptOut, toggleAvatarCopying, toggleAllowBooping } =
        useUserStore();

    const { showFullscreenImageDialog } = useGalleryStore();
    const { userImage, userStatusClass } = useUserDisplay();
    const { showEditProfileDialog } = useUserStore();

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
</script>
