<template>
    <template v-if="isFriendOnline(userDialog.friend) || currentUser.id === userDialog.id">
        <div class="flex flex-col gap-2.5 mb-2.5">
            <div class="rounded-xl bg-(--profile-card) p-3">
                <div class="flex items-center justify-between mb-2 pb-1 border-b border-muted-foreground/20">
                    <span
                        class="text-[10px] font-bold uppercase tracking-wide"
                        :style="{ color: userDialog.theme.subtextColor }">
                        {{ t('dialog.user.info.current_instance') }}
                    </span>
                    <span v-if="isRealInstance(userDialog.$location.tag)">
                        <InstanceActionBar
                            class="mb-1"
                            :showButtons="true"
                            :buttonStyle="{ color: userDialog.theme.iconColor }"
                            :showInstanceInfo="false"
                            :location="userDialog.$location.tag"
                            :shortname="userDialog.$location.shortName"
                            :currentlocation="lastLocation.location"
                            :instance="userDialog.instance.ref"
                            :friendcount="userDialog.instance.friendCount"
                            :refresh-tooltip="t('dialog.user.info.refresh_instance_info')"
                            :on-refresh="() => refreshInstancePlayerCount(userDialog.$location.tag)" />
                    </span>
                </div>
                <div v-if="userDialog.$location.isOffline">
                    <span class="text-sm text-muted-foreground">{{ t('location.offline') }}</span>
                </div>
                <div v-if="userDialog.$location.isPrivate">
                    <span class="text-sm text-muted-foreground">{{ t('location.private') }}</span>
                </div>
                <div class="flex flex-col">
                    <div v-if="isRealInstance(userDialog.$location.tag)" class="flex gap-1.5 justify-between">
                        <div class="flex flex-col justify-between">
                            <span
                                class="text-md text-foreground cursor-pointer"
                                @click="showWorldDialog(userDialog.$location.tag)"
                                >{{ userDialog.instance?.ref?.world?.name }}</span
                            >
                            <div class="flex flex-wrap gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                <LocationWorld
                                    class="text-sm inline-flex w-fit max-w-full border-muted-foreground/30"
                                    :locationobject="userDialog.$location"
                                    :currentuserid="currentUser.id" />
                                <InstanceActionBar
                                    class="text-sm inline-flex w-fit max-w-full border-muted-foreground/30"
                                    :showButtons="false"
                                    :showInstanceInfo="true"
                                    :location="userDialog.$location.tag"
                                    :shortname="userDialog.$location.shortName"
                                    :currentlocation="lastLocation.location"
                                    :instance="userDialog.instance.ref"
                                    :friendcount="userDialog.instance.friendCount"
                                    :refresh-tooltip="t('dialog.user.info.refresh_instance_info')"
                                    :on-refresh="() => refreshInstancePlayerCount(userDialog.$location.tag)" />
                            </div>
                        </div>
                        <img
                            v-if="!userDialog.loading"
                            :src="userDialog.instance?.ref?.world?.thumbnailImageUrl"
                            class="cursor-pointer"
                            style="width: 80px; height: 60px; border-radius: var(--radius-xl)"
                            @click="showFullscreenImageDialog(userDialog.instance?.ref?.world?.imageUrl)"
                            loading="lazy" />
                    </div>
                    <div
                        class="flex flex-wrap items-start"
                        style="flex: 1; margin-top: 8px; max-height: 150px; overflow: auto">
                        <div
                            v-if="userDialog.$location.userId"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                            @click="showUserDialog(userDialog.$location.userId)">
                            <template v-if="userDialog.$location.user">
                                <div
                                    class="relative inline-block flex-none size-9 mr-2.5"
                                    :class="userStatusClass(userDialog.$location.user)">
                                    <Avatar class="size-9">
                                        <AvatarImage
                                            :src="userImage(userDialog.$location.user, true)"
                                            class="object-cover" />
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
                                    <span class="block truncate text-xs">{{
                                        t('dialog.user.info.instance_creator')
                                    }}</span>
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
            </div>
        </div>
    </template>

    <div class="@container">
        <div class="grid gap-2.5 grid-cols-1 @[560px]:grid-cols-[minmax(0,1fr)_230px]" style="align-items: start">
            <div class="flex flex-col gap-2.5">
                <div class="rounded-xl bg-(--profile-card) p-3">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-muted-foreground/20">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wide"
                            :style="{ color: userDialog.theme.subtextColor }">
                            {{ t('dialog.user.info.bio') }}
                        </span>
                        <div class="flex items-center gap-1">
                            <Button
                                v-if="translationApi && userDialog.ref.bio"
                                class="h-5 w-5"
                                size="icon-sm"
                                variant="ghost"
                                @click="translateBio">
                                <Spinner v-if="translateLoading" class="size-3" />
                                <Languages v-else class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                            </Button>
                            <Button
                                v-if="userDialog.id === currentUser.id"
                                class="h-5 w-5"
                                size="icon-sm"
                                variant="ghost"
                                @click="showEditProfileDialog()">
                                <Pencil class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                            </Button>
                        </div>
                    </div>
                    <pre
                        class="text-xs font-[inherit]"
                        style="white-space: pre-wrap; max-height: 210px; overflow-y: auto"
                        >{{ bioCache.translated || userDialog.ref.bio || '—' }}</pre>
                    <div
                        v-if="userDialog.ref.bioLinks && userDialog.ref.bioLinks.length"
                        class="flex flex-wrap items-center gap-1.5 mt-2">
                        <TooltipWrapper v-for="(link, index) in userDialog.ref.bioLinks" :key="index">
                            <template #content>
                                <span v-text="link"></span>
                            </template>
                            <img
                                :src="getFaviconUrl(link)"
                                style="width: 16px; height: 16px; vertical-align: middle; cursor: pointer"
                                @click.stop="openExternalLink(link)"
                                loading="lazy" />
                        </TooltipWrapper>
                    </div>
                </div>

                <div
                    v-if="!hideUserNotes"
                    class="rounded-xl bg-(--profile-card) p-3 cursor-pointer"
                    @click="isEditNoteAndMemoDialogVisible = true">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-muted-foreground/20">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wide"
                            :style="{ color: userDialog.theme.subtextColor }">
                            {{ t('dialog.user.info.note') }}
                        </span>
                        <Button class="h-5 w-5" size="icon-sm" variant="ghost">
                            <Pencil class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                        </Button>
                    </div>
                    <pre
                        v-if="userDialog.note"
                        class="text-xs font-[inherit]"
                        style="white-space: pre-wrap; max-height: 210px; overflow-y: auto"
                        >{{ userDialog.note }}</pre>
                    <pre class="text-xs font-[inherit] text-muted-foreground" v-else>—</pre>
                </div>

                <div
                    v-if="!hideUserMemos"
                    class="rounded-xl bg-(--profile-card) p-3 cursor-pointer"
                    @click="isEditNoteAndMemoDialogVisible = true">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-muted-foreground/20">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wide"
                            :style="{ color: userDialog.theme.subtextColor }">
                            {{ t('dialog.user.info.memo') }}
                        </span>
                        <Button class="h-5 w-5" size="icon-sm" variant="ghost">
                            <Pencil class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                        </Button>
                    </div>
                    <pre
                        v-if="userDialog.memo"
                        class="text-xs font-[inherit]"
                        style="white-space: pre-wrap; max-height: 210px; overflow-y: auto"
                        >{{ userDialog.memo }}</pre>
                    <pre class="text-xs font-[inherit] text-muted-foreground" v-else>—</pre>
                </div>
            </div>

            <div class="flex flex-col gap-2.5">
                <div class="rounded-xl bg-(--profile-card) p-3">
                    <div class="flex items-center justify-between mb-2 pb-2 border-b border-muted-foreground/20">
                        <span
                            class="text-[10px] font-bold uppercase tracking-wide"
                            :style="{ color: userDialog.theme.subtextColor }">
                            {{ t('dialog.user.info.vrcx_info') }}
                            <span class="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                <TooltipWrapper side="top" :content="t('dialog.user.info.vrcx_info_tooltip')">
                                    <Info
                                        class="inline-block h-3 w-3 align-middle"
                                        :style="{ color: userDialog.theme.iconColor }" />
                                </TooltipWrapper>
                            </span>
                        </span>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <TooltipWrapper
                            :side="currentUser.id !== userDialog.id ? 'bottom' : 'top'"
                            :content="formatDateFilter(userOnlineForTimestamp(userDialog), 'long')"
                            :disabled="!userOnlineForTimestamp(userDialog)">
                            <template #content>
                                <span>{{ formatDateFilter(userOnlineForTimestamp(userDialog), 'short') }}</span>
                            </template>
                            <div class="flex justify-between items-start gap-2 text-xs">
                                <span class="text-muted-foreground shrink-0">
                                    {{
                                        userDialog.ref.state === 'online' && userDialog.ref.$online_for
                                            ? t('dialog.user.info.online_for')
                                            : t('dialog.user.info.offline_for')
                                    }}
                                </span>
                                <span class="text-right text-muted-foreground">{{
                                    timeAgo(userOnlineForTimestamp(userDialog))
                                }}</span>
                            </div>
                        </TooltipWrapper>

                        <template v-if="currentUser.id !== userDialog.id">
                            <TooltipWrapper
                                side="top"
                                :disabled="!userDialog.lastSeen"
                                :content="formatDateFilter(userDialog.lastSeen, 'long')">
                                <div class="flex justify-between items-start gap-2 text-xs">
                                    <span class="text-muted-foreground shrink-0">{{
                                        t('dialog.user.info.last_seen')
                                    }}</span>
                                    <span class="text-right text-muted-foreground">{{
                                        timeAgo(userDialog.lastSeen)
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                            <TooltipWrapper side="top" :disabled="userDialog.dateFriendedInfo.length === 0">
                                <template #content>
                                    <template v-if="userDialog.dateFriendedInfo.length === 1">
                                        {{ formatDateFilter(userDialog.dateFriended, 'long') }}
                                    </template>
                                    <template v-else>
                                        <template v-for="ref in userDialog.dateFriendedInfo" :key="ref.type">
                                            <span>{{ ref.type }}: {{ formatDateFilter(ref.created_at, 'long') }}</span
                                            ><br />
                                        </template>
                                    </template>
                                </template>
                                <div class="flex justify-between items-start gap-2 text-xs">
                                    <span class="text-muted-foreground shrink-0">
                                        {{
                                            userDialog.unFriended
                                                ? t('dialog.user.info.unfriended')
                                                : t('dialog.user.info.friended')
                                        }}
                                    </span>
                                    <span class="text-right text-muted-foreground">{{
                                        timeAgo(userDialog.dateFriended)
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                            <TooltipWrapper
                                side="top"
                                :content="timeToText(userDialog.timeSpent)"
                                :disabled="!userDialog.timeSpent">
                                <div class="flex justify-between items-start gap-2 text-xs">
                                    <span class="text-muted-foreground shrink-0">{{
                                        t('dialog.user.info.time_together')
                                    }}</span>
                                    <span class="text-right text-muted-foreground">{{
                                        timeAgo(Date.now() - userDialog.timeSpent * 1000)
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                            <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                                <div
                                    class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                                    @click="showPreviousInstancesListDialog(userDialog.ref)">
                                    <span class="text-muted-foreground shrink-0">{{
                                        t('dialog.user.info.join_count')
                                    }}</span>
                                    <span class="text-right text-muted-foreground">{{
                                        userDialog.joinCount || '—'
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                        </template>
                        <template v-else>
                            <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                                <div
                                    class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                                    @click="showPreviousInstancesListDialog(userDialog.ref)">
                                    <span class="text-muted-foreground shrink-0">{{
                                        t('dialog.user.info.play_time')
                                    }}</span>
                                    <span class="text-right text-muted-foreground">{{
                                        timeAgo(Date.now() - userDialog.timeSpent * 1000)
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                        </template>
                    </div>
                </div>

                <div class="rounded-xl bg-(--profile-card) p-3">
                    <div
                        class="text-[10px] font-bold uppercase tracking-wide mb-2 pb-2 border-b border-muted-foreground/20"
                        :style="{ color: userDialog.theme.subtextColor }">
                        {{ t('dialog.user.info.header') }}
                    </div>
                    <div class="flex flex-col gap-1.5">
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
                            <div class="flex justify-between items-start gap-2 text-xs">
                                <span class="text-muted-foreground shrink-0">{{
                                    t('dialog.user.info.last_activity')
                                }}</span>
                                <span class="text-right text-muted-foreground">
                                    {{ timeAgo(userDialog.ref.last_activity) }}
                                </span>
                            </div>
                        </TooltipWrapper>

                        <div class="flex justify-between items-start gap-2 text-xs">
                            <span class="text-muted-foreground shrink-0">{{ t('dialog.user.info.date_joined') }}</span>
                            <span
                                class="text-right text-muted-foreground"
                                v-text="formatDateFilter(userDialog.ref.date_joined, 'date')"></span>
                        </div>

                        <template v-if="currentUser.id === userDialog.id">
                            <TooltipWrapper side="top">
                                <template #content>
                                    <span>{{ t('view.profile.profile.refresh') }}</span>
                                </template>
                                <div
                                    class="flex justify-between items-start gap-2 text-xs cursor-pointer hover:text-foreground"
                                    @click="getVRChatCredits()">
                                    <span class="text-muted-foreground shrink-0">{{
                                        t('view.profile.profile.vrchat_credits')
                                    }}</span>
                                    <span class="text-right text-muted-foreground">{{
                                        vrchatCredit ?? t('view.profile.profile.refresh')
                                    }}</span>
                                </div>
                            </TooltipWrapper>
                        </template>

                        <div v-if="currentUser.id !== userDialog.id" class="flex justify-between items-center text-xs">
                            <span class="text-muted-foreground">{{ t('dialog.user.info.avatar_cloning') }}</span>
                            <span class="text-muted-foreground">{{
                                userDialog.ref.allowAvatarCopying
                                    ? t('dialog.user.info.avatar_cloning_allow')
                                    : t('dialog.user.info.avatar_cloning_deny')
                            }}</span>
                        </div>
                    </div>
                </div>

                <div
                    v-if="userDialog.ref.id === currentUser.id && currentUser.homeLocation"
                    class="rounded-xl bg-(--profile-card) p-3">
                    <div
                        class="text-[10px] font-bold uppercase tracking-wide mb-2 pb-2 border-b border-muted-foreground/20"
                        :style="{ color: userDialog.theme.subtextColor }">
                        {{ t('dialog.user.info.home_location') }}
                    </div>
                    <div
                        class="flex items-center justify-between gap-2 text-xs cursor-pointer"
                        @click="showWorldDialog(currentUser.homeLocation)">
                        <span class="truncate" v-text="userDialog.$homeLocationName"></span>
                        <Button
                            class="rounded-full h-5 w-5 flex-none"
                            size="icon-sm"
                            variant="ghost"
                            @click.stop="resetHome()">
                            <Trash2 class="h-3 w-3" :style="{ color: userDialog.theme.iconColor }" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <EditNoteAndMemoDialog v-model:visible="isEditNoteAndMemoDialogVisible" />
</template>

<script setup>
    import { Info, Languages, Pencil, Trash2, User } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        formatDateFilter,
        getFaviconUrl,
        isFriendOnline,
        isRealInstance,
        openExternalLink,
        timeToText,
        userOnlineForTimestamp,
        timeAgo
    } from '../../../shared/utils';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { refreshInstancePlayerCount } from '../../../coordinators/instanceCoordinator';
    import {
        useAdvancedSettingsStore,
        useAppearanceSettingsStore,
        useInstanceStore,
        useLocationStore,
        useModalStore,
        useUserStore,
        useGalleryStore
    } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { queryRequest, userRequest } from '../../../api';

    import InstanceActionBar from '../../InstanceActionBar.vue';
    import { showUserDialog } from '../../../coordinators/userCoordinator';

    import EditNoteAndMemoDialog from './EditNoteAndMemoDialog.vue';

    const { t } = useI18n();

    const modalStore = useModalStore();
    const instanceStore = useInstanceStore();

    const { hideUserNotes, hideUserMemos } = storeToRefs(useAppearanceSettingsStore());
    const { bioLanguage, translationApi, translationApiType } = storeToRefs(useAdvancedSettingsStore());
    const { translateText } = useAdvancedSettingsStore();
    const { userDialog, currentUser } = storeToRefs(useUserStore());
    const { showEditProfileDialog } = useUserStore();
    const { fullscreenImageDialog } = storeToRefs(useGalleryStore());

    const { lastLocation } = storeToRefs(useLocationStore());
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
     */
    function getVRChatCredits() {
        queryRequest.fetch('vrchatCredits').then((args) => (vrchatCredit.value = args.json?.balance));
    }

    /**
     *
     * @param imageUrl
     * @param fileName
     */
    function showFullscreenImageDialog(imageUrl, fileName) {
        if (!imageUrl) {
            return;
        }
        const D = fullscreenImageDialog.value;
        D.imageUrl = imageUrl;
        D.fileName = fileName;
        D.visible = true;
    }

    defineExpose({
        onTabActivated,
        showEditNoteAndMemoDialog,
        showFullscreenImageDialog
    });
</script>
