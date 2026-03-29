<template>
    <template v-if="isFriendOnline(userDialog.friend) || currentUser.id === userDialog.id">
        <div
            class="mb-2 pb-2 border-b border-border"
            v-if="userDialog.ref.location"
            style="display: flex; flex-direction: column">
            <div style="flex: none">
                <template v-if="isRealInstance(userDialog.$location.tag)">
                    <InstanceActionBar
                        class="mb-1"
                        :location="userDialog.$location.tag"
                        :shortname="userDialog.$location.shortName"
                        :currentlocation="lastLocation.location"
                        :instance="userDialog.instance.ref"
                        :friendcount="userDialog.instance.friendCount"
                        :refresh-tooltip="t('dialog.user.info.refresh_instance_info')"
                        :on-refresh="() => refreshInstancePlayerCount(userDialog.$location.tag)" />
                </template>
                <Location
                    class="text-sm"
                    :location="userDialog.ref.location"
                    :traveling="userDialog.ref.travelingToLocation" />
            </div>
            <div class="flex flex-wrap items-start" style="flex: 1; margin-top: 8px; max-height: 150px; overflow: auto">
                <div
                    v-if="userDialog.$location.userId"
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                    @click="showUserDialog(userDialog.$location.userId)">
                    <template v-if="userDialog.$location.user">
                        <div
                            class="relative inline-block flex-none size-9 mr-2.5"
                            :class="userStatusClass(userDialog.$location.user)">
                            <Avatar class="size-9">
                                <AvatarImage :src="userImage(userDialog.$location.user, true)" class="object-cover" />
                                <AvatarFallback>
                                    <User class="size-4 text-muted-foreground" />
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <span
                                class="block truncate font-medium leading-[18px]"
                                :style="{ color: userDialog.$location.user.$userColour }"
                                v-text="userDialog.$location.user.displayName"></span>
                            <span class="block truncate text-xs">{{ t('dialog.user.info.instance_creator') }}</span>
                        </div>
                    </template>
                    <span v-else v-text="userDialog.$location.userId"></span>
                </div>
                <div
                    v-for="user in userDialog.users"
                    :key="user.id"
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                    @click="showUserDialog(user.id)">
                    <div class="relative inline-block flex-none size-9 mr-2.5" :class="userStatusClass(user)">
                        <Avatar class="size-9">
                            <AvatarImage :src="userImage(user, true)" class="object-cover" />
                            <AvatarFallback>
                                <User class="size-4 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div class="flex-1 overflow-hidden">
                        <span
                            class="block truncate font-medium leading-[18px]"
                            :style="{ color: user.$userColour }"
                            v-text="user.displayName"></span>
                        <span v-if="user.location === 'traveling'" class="block truncate text-xs">
                            <Spinner class="inline-block mr-1" />
                            <Timer :epoch="user.$travelingToTime" />
                        </span>
                        <span v-else class="block truncate text-xs">
                            <Timer :epoch="user.$location_at" />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </template>

    <div class="flex flex-wrap items-start px-2.5" style="max-height: none">
        <div
            v-if="userDialog.note && !hideUserNotes"
            class="box-border flex items-center p-1.5 text-[13px] w-full cursor-pointer">
            <div class="flex-1 overflow-hidden" @click="isEditNoteAndMemoDialogVisible = true">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.note') }}</span>
                <pre
                    class="text-xs font-[inherit]"
                    style="white-space: pre-wrap; margin: 0 0.5em 0 0; max-height: 210px; overflow-y: auto"
                    >{{ userDialog.note }}</pre
                >
            </div>
        </div>
        <div
            v-if="userDialog.memo && !hideUserMemos"
            class="box-border flex items-center p-1.5 text-[13px] w-full cursor-pointer">
            <div class="flex-1 overflow-hidden" @click="isEditNoteAndMemoDialogVisible = true">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.memo') }}</span>
                <pre
                    class="text-xs font-[inherit]"
                    style="white-space: pre-wrap; margin: 0 0.5em 0 0; max-height: 210px; overflow-y: auto"
                    >{{ userDialog.memo }}</pre
                >
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">
                    {{
                        userDialog.id !== currentUser.id &&
                        userDialog.ref.profilePicOverride &&
                        userDialog.ref.currentAvatarImageUrl
                            ? t('dialog.user.info.avatar_info_last_seen')
                            : t('dialog.user.info.avatar_info')
                    }}
                    <TooltipWrapper
                        v-if="userDialog.ref.profilePicOverride && !userDialog.ref.currentAvatarImageUrl"
                        side="top"
                        :content="t('dialog.user.info.vrcplus_hides_avatar')">
                        <Info class="inline-block" />
                    </TooltipWrapper>
                </span>
                <div class="text-xs">
                    <AvatarInfo
                        :key="userDialog.id"
                        :imageurl="userDialog.ref.currentAvatarImageUrl"
                        :userid="userDialog.id"
                        :avatartags="userDialog.ref.currentAvatarTags"
                        style="display: inline-block" />
                </div>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]" style="margin-bottom: 6px">{{
                    t('dialog.user.info.represented_group')
                }}</span>
                <div
                    v-if="
                        userDialog.isRepresentedGroupLoading ||
                        (userDialog.representedGroup && userDialog.representedGroup.isRepresenting)
                    "
                    class="text-xs">
                    <div style="display: inline-block; flex: none; margin-right: 6px">
                        <Avatar
                            class="cursor-pointer size-15! rounded-lg!"
                            :style="{
                                background: userDialog.isRepresentedGroupLoading ? 'var(--muted)' : ''
                            }"
                            @click="showFullscreenImageDialog(userDialog.representedGroup.iconUrl)">
                            <AvatarImage
                                :src="userDialog.representedGroup.$thumbnailUrl"
                                @load="userDialog.isRepresentedGroupLoading = false"
                                @error="userDialog.isRepresentedGroupLoading = false" />
                            <AvatarFallback class="rounded-lg!">
                                <Image class="size-5 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <span
                        v-if="userDialog.representedGroup.isRepresenting"
                        style="vertical-align: top; cursor: pointer"
                        @click="showGroupDialog(userDialog.representedGroup.groupId)">
                        <span v-if="userDialog.representedGroup.ownerId === userDialog.id" style="margin-right: 6px"
                            >👑</span
                        >
                        <span style="margin-right: 6px" v-text="userDialog.representedGroup.name"></span>
                        <span>({{ userDialog.representedGroup.memberCount }})</span>
                    </span>
                </div>
                <div v-else class="text-xs">-</div>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.bio') }}</span>
                <pre
                    class="text-xs truncate font-[inherit]"
                    style="white-space: pre-wrap; margin: 0 0.5em 0 0; max-height: 210px; overflow-y: auto"
                    >{{ bioCache.translated || userDialog.ref.bio || '-' }}</pre
                >
                <div style="float: right">
                    <Button
                        v-if="translationApi && userDialog.ref.bio"
                        class="w-3 h-6 text-xs mr-0.5"
                        size="icon-sm"
                        variant="ghost"
                        @click="translateBio">
                        <Spinner v-if="translateLoading" class="size-1" />
                        <Languages v-else class="h-3 w-3" />
                    </Button>
                    <Button
                        class="w-3 h-6 text-xs"
                        size="icon-sm"
                        variant="ghost"
                        v-if="userDialog.id === currentUser.id"
                        style="margin-left: 6px; padding: 0"
                        @click="$emit('showBioDialog')"
                        ><Pencil class="h-3 w-3" />
                    </Button>
                </div>
                <div style="margin-top: 6px" class="flex items-center">
                    <TooltipWrapper v-for="(link, index) in userDialog.ref.bioLinks" :key="index">
                        <template #content>
                            <span v-text="link"></span>
                        </template>
                        <!-- onerror="this.onerror=null;this.class='icon-error'" -->
                        <img
                            :src="getFaviconUrl(link)"
                            style="
                                width: 16px;
                                height: 16px;
                                vertical-align: middle;
                                margin-right: 6px;
                                cursor: pointer;
                            "
                            @click.stop="openExternalLink(link)"
                            loading="lazy" />
                    </TooltipWrapper>
                </div>
            </div>
        </div>
        <template v-if="currentUser.id !== userDialog.id">
            <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.user.info.last_seen') }}
                    </span>
                    <span class="block truncate text-xs">{{ formatDateFilter(userDialog.lastSeen, 'long') }}</span>
                </div>
            </div>

            <div
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                @click="showPreviousInstancesListDialog(userDialog.ref)">
                <div class="flex-1 overflow-hidden">
                    <div
                        class="block truncate font-medium leading-[18px]"
                        style="display: flex; justify-content: space-between; align-items: center">
                        <div>
                            {{ t('dialog.user.info.join_count') }}
                        </div>

                        <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                            <MoreHorizontal style="margin-right: 16px" />
                        </TooltipWrapper>
                    </div>
                    <span v-if="userDialog.joinCount === 0" class="block truncate text-xs">-</span>
                    <span v-else class="block truncate text-xs" v-text="userDialog.joinCount"></span>
                </div>
            </div>

            <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.user.info.time_together') }}
                    </span>
                    <span v-if="userDialog.timeSpent === 0" class="block truncate text-xs">-</span>
                    <span v-else class="block truncate text-xs">{{ timeToText(userDialog.timeSpent) }}</span>
                </div>
            </div>
        </template>
        <template v-else>
            <TooltipWrapper
                :disabled="currentUser.id !== userDialog.id"
                side="top"
                :content="t('dialog.user.info.open_previous_instance')">
                <div
                    class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                    @click="showPreviousInstancesListDialog(userDialog.ref)">
                    <div class="flex-1 overflow-hidden">
                        <span class="block truncate font-medium leading-[18px]">
                            {{ t('dialog.user.info.play_time') }}
                        </span>
                        <span v-if="userDialog.timeSpent === 0" class="block truncate text-xs">-</span>
                        <span v-else class="block truncate text-xs">{{ timeToText(userDialog.timeSpent) }}</span>
                    </div>
                </div>
            </TooltipWrapper>
        </template>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <TooltipWrapper :side="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                <template #content>
                    <span>{{ formatDateFilter(userOnlineForTimestamp(userDialog), 'short') }}</span>
                </template>
                <div class="flex-1 overflow-hidden">
                    <span
                        v-if="userDialog.ref.state === 'online' && userDialog.ref.$online_for"
                        class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.user.info.online_for') }}
                    </span>
                    <span v-else class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.user.info.offline_for') }}
                    </span>
                    <span class="block truncate text-xs">{{ userOnlineFor(userDialog.ref) }}</span>
                </div>
            </TooltipWrapper>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <TooltipWrapper :side="currentUser.id !== userDialog.id ? 'bottom' : 'top'">
                <template #content>
                    <span
                        >{{ t('dialog.user.info.last_login') }}
                        {{ formatDateFilter(userDialog.ref.last_login, 'long') }}</span
                    >
                    <br />
                    <span
                        >{{ t('dialog.user.info.last_activity') }}
                        {{ formatDateFilter(userDialog.ref.last_activity, 'long') }}</span
                    >
                </template>
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{
                        t('dialog.user.info.last_activity')
                    }}</span>
                    <span v-if="userDialog.ref.last_activity" class="block truncate text-xs">{{
                        timeToText(Date.now() - Date.parse(userDialog.ref.last_activity))
                    }}</span>
                    <span v-else class="block truncate text-xs">-</span>
                </div>
            </TooltipWrapper>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.date_joined') }}</span>
                <span class="block truncate text-xs" v-text="userDialog.ref.date_joined"></span>
            </div>
        </div>
        <div
            v-if="currentUser.id !== userDialog.id"
            class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
            <TooltipWrapper side="top" :disabled="userDialog.dateFriendedInfo.length < 2">
                <template #content>
                    <template v-for="ref in userDialog.dateFriendedInfo" :key="ref.type">
                        <span>{{ ref.type }}: {{ formatDateFilter(ref.created_at, 'long') }}</span
                        ><br />
                    </template>
                </template>
                <div class="flex-1 overflow-hidden">
                    <span v-if="userDialog.unFriended" class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.user.info.unfriended') }}
                    </span>
                    <span v-else class="block truncate font-medium leading-[18px]">
                        {{ t('dialog.user.info.friended') }}
                    </span>
                    <span class="block truncate text-xs">{{ formatDateFilter(userDialog.dateFriended, 'long') }}</span>
                </div>
            </TooltipWrapper>
        </div>
        <template v-if="currentUser.id === userDialog.id">
            <div
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                @click="toggleAvatarCopying">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{
                        t('dialog.user.info.avatar_cloning')
                    }}</span>
                    <span v-if="currentUser.allowAvatarCopying" class="block truncate text-xs">{{
                        t('dialog.user.info.avatar_cloning_allow')
                    }}</span>
                    <span v-else class="block truncate text-xs">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                </div>
            </div>
            <div
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                @click="toggleAllowBooping">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.booping') }}</span>
                    <span v-if="currentUser.isBoopingEnabled" class="block truncate text-xs">{{
                        t('dialog.user.info.avatar_cloning_allow')
                    }}</span>
                    <span v-else class="block truncate text-xs">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                </div>
            </div>
            <div
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                @click="toggleSharedConnectionsOptOut">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{
                        t('dialog.user.info.show_mutual_friends')
                    }}</span>
                    <span v-if="!currentUser.hasSharedConnectionsOptOut" class="block truncate text-xs">{{
                        t('dialog.user.info.avatar_cloning_allow')
                    }}</span>
                    <span v-else class="block truncate text-xs">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                </div>
            </div>
            <div
                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
                @click="toggleDiscordFriendsOptOut">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{
                        t('dialog.user.info.show_discord_connections')
                    }}</span>
                    <span v-if="!currentUser.hasDiscordFriendsOptOut" class="block truncate text-xs">{{
                        t('dialog.user.info.avatar_cloning_allow')
                    }}</span>
                    <span v-else class="block truncate text-xs">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                </div>
            </div>
        </template>
        <template v-else>
            <div class="box-border flex items-center p-1.5 text-[13px] cursor-default w-[167px]">
                <div class="flex-1 overflow-hidden">
                    <span class="block truncate font-medium leading-[18px]">{{
                        t('dialog.user.info.avatar_cloning')
                    }}</span>
                    <span v-if="userDialog.ref.allowAvatarCopying" class="block truncate text-xs">{{
                        t('dialog.user.info.avatar_cloning_allow')
                    }}</span>
                    <span v-else class="block truncate text-xs">{{ t('dialog.user.info.avatar_cloning_deny') }}</span>
                </div>
            </div>
        </template>
        <div
            v-if="userDialog.ref.id === currentUser.id"
            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px]"
            @click="getVRChatCredits()">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{
                    t('view.profile.profile.vrchat_credits')
                }}</span>
                <span class="block truncate text-xs">{{ vrchatCredit ?? t('view.profile.profile.refresh') }}</span>
            </div>
        </div>
        <div
            v-if="userDialog.ref.id === currentUser.id && currentUser.homeLocation"
            class="box-border flex items-center p-1.5 text-[13px] w-full cursor-pointer"
            @click="showWorldDialog(currentUser.homeLocation)">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.home_location') }}</span>
                <span class="block truncate text-xs">
                    <span v-text="userDialog.$homeLocationName"></span>
                    <Button class="rounded-full ml-1 text-xs" size="icon-sm" variant="ghost" @click.stop="resetHome()"
                        ><Trash2 class="h-4 w-4" />
                    </Button>
                </span>
            </div>
        </div>
        <div class="box-border flex items-center p-1.5 text-[13px] w-full cursor-default">
            <div class="flex-1 overflow-hidden">
                <span class="block truncate font-medium leading-[18px]">{{ t('dialog.user.info.id') }}</span>
                <span class="block truncate text-xs">
                    {{ userDialog.id }}
                    <TooltipWrapper side="top" :content="t('dialog.user.info.id_tooltip')">
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button class="rounded-full ml-1 text-xs" size="icon-sm" variant="ghost" @click.stop
                                    ><Copy class="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem @click="copyUserId(userDialog.id)">
                                    {{ t('dialog.user.info.copy_id') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="copyUserURL(userDialog.id)">
                                    {{ t('dialog.user.info.copy_url') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="copyUserDisplayName(userDialog.ref.displayName)">
                                    {{ t('dialog.user.info.copy_display_name') }}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TooltipWrapper>
                </span>
            </div>
        </div>
    </div>
    <EditNoteAndMemoDialog v-model:visible="isEditNoteAndMemoDialogVisible" />
</template>

<script setup>
    import { Copy, Image, Info, Languages, MoreHorizontal, Pencil, Trash2, User } from 'lucide-vue-next';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        copyToClipboard,
        formatDateFilter,
        getFaviconUrl,
        isFriendOnline,
        isRealInstance,
        openExternalLink,
        timeToText,
        userOnlineFor,
        userOnlineForTimestamp
    } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useGalleryStore,
        useInstanceStore,
        useLocationStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { queryRequest, userRequest } from '../../../api';

    import InstanceActionBar from '../../InstanceActionBar.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { showGroupDialog } from '../../../coordinators/groupCoordinator';

    import EditNoteAndMemoDialog from './EditNoteAndMemoDialog.vue';

    defineEmits(['showBioDialog']);

    const { t } = useI18n();

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { hideUserNotes, hideUserMemos } = storeToRefs(useAppearanceSettingsStore());
    const { bioLanguage, translationApi, translationApiType } = storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { toggleSharedConnectionsOptOut, toggleDiscordFriendsOptOut } = useUserStore();

    const { lastLocation } = storeToRefs(useLocationStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { userImage, userStatusClass } = useUserDisplay();

    const bioCache = ref({
        userId: null,
        translated: null
    });

    const isEditNoteAndMemoDialogVisible = ref(false);
    const vrchatCredit = ref(null);
    const translateLoading = ref(false);

    watch(
        () => userDialog.value.loading,
        () => {
            if (userDialog.value.visible) {
                if (userDialog.value.id !== bioCache.value.userId) {
                    bioCache.value = {
                        userId: null,
                        translated: null
                    };
                }
            }
        }
    );

    /**
     *
     */
    function onTabActivated() {
        if (currentUser.value.id === userDialog.value.id && vrchatCredit.value === null) {
            getVRChatCredits();
        }
    }

    /**
     *
     */
    function showEditNoteAndMemoDialog() {
        isEditNoteAndMemoDialogVisible.value = true;
    }

    /**
     *
     */
    async function translateBio() {
        if (translateLoading.value) {
            return;
        }
        const bio = userDialog.value.ref.bio;
        if (!bio) {
            return;
        }

        const targetLang = bioLanguage.value;

        if (bioCache.value.userId !== userDialog.value.id) {
            bioCache.value.userId = userDialog.value.id;
            bioCache.value.translated = null;
        }

        if (bioCache.value.translated) {
            bioCache.value.translated = null;
            return;
        }

        translateLoading.value = true;
        try {
            const providerLabel = translationApiType.value === 'openai' ? 'OpenAI' : 'Google';
            const translated = await translateText(`${bio}\n\nTranslated by ${providerLabel}`, targetLang);
            if (!translated) {
                throw new Error('No translation returned');
            }

            bioCache.value.translated = translated;
        } catch (err) {
            console.error('Translation failed:', err);
        } finally {
            translateLoading.value = false;
        }
    }

    /**
     *
     * @param userRef
     */
    function showPreviousInstancesListDialog(userRef) {
        instanceStore.showPreviousInstancesListDialog('user', userRef);
    }

    /**
     *
     */
    function toggleAvatarCopying() {
        userRequest.saveCurrentUser({
            allowAvatarCopying: !currentUser.value.allowAvatarCopying
        });
    }

    /**
     *
     */
    function toggleAllowBooping() {
        userRequest.saveCurrentUser({
            isBoopingEnabled: !currentUser.value.isBoopingEnabled
        });
    }

    /**
     *
     */
    function resetHome() {
        modalStore
            .confirm({
                description: t('confirm.command_question', {
                    command: t('dialog.user.actions.reset_home')
                }),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (!ok) return;
                userRequest
                    .saveCurrentUser({
                        homeLocation: ''
                    })
                    .then((args) => {
                        toast.success(t('message.user.home_reset'));
                        return args;
                    });
            })
            .catch(() => {});
    }

    /**
     *
     * @param userId
     */
    function copyUserId(userId) {
        copyToClipboard(userId, t('message.user.id_copied'));
    }

    /**
     *
     * @param userId
     */
    function copyUserURL(userId) {
        copyToClipboard(`https://vrchat.com/home/user/${userId}`, t('message.user.url_copied'));
    }

    /**
     *
     * @param displayName
     */
    function copyUserDisplayName(displayName) {
        copyToClipboard(displayName, t('message.user.display_name_copied'));
    }

    /**
     *
     */
    function getVRChatCredits() {
        queryRequest.fetch('vrchatCredits').then((args) => (vrchatCredit.value = args.json?.balance));
    }

    defineExpose({
        onTabActivated,
        showEditNoteAndMemoDialog
    });
</script>
