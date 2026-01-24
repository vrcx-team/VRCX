<template>
    <div class="w-223">
        <DialogHeader class="sr-only">
            <DialogTitle>{{ worldDialog.ref?.name || t('dialog.world.info.header') }}</DialogTitle>
            <DialogDescription>
                {{ worldDialog.ref?.description || worldDialog.ref?.name || t('dialog.world.info.header') }}
            </DialogDescription>
        </DialogHeader>
        <div>
            <div style="display: flex">
                <img
                    :src="worldDialog.ref.thumbnailImageUrl"
                    class="cursor-pointer"
                    style="flex: none; width: 160px; height: 120px; border-radius: 12px"
                    @click="showFullscreenImageDialog(worldDialog.ref.imageUrl)"
                    loading="lazy" />
                <div style="flex: 1; display: flex; align-items: center; margin-left: 15px">
                    <div style="flex: 1">
                        <div>
                            <span class="font-bold" style="margin-right: 5px; cursor: pointer" @click="copyWorldName">
                                <Home
                                    v-if="
                                        currentUser.$homeLocation &&
                                        currentUser.$homeLocation.worldId === worldDialog.id
                                    "
                                    class="inline-block" />
                                {{ worldDialog.ref.name }}
                            </span>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                class="cursor-pointer x-grey"
                                style="font-family: monospace"
                                @click="showUserDialog(worldDialog.ref.authorId)"
                                v-text="worldDialog.ref.authorName" />
                        </div>
                        <div>
                            <Badge
                                v-if="worldDialog.ref.$isLabs"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.labs') }}
                            </Badge>
                            <Badge
                                v-else-if="worldDialog.ref.releaseStatus === 'public'"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.public') }}
                            </Badge>
                            <Badge v-else variant="outline" style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.private') }}
                            </Badge>
                            <TooltipWrapper v-if="worldDialog.isPC" side="top" content="PC">
                                <Badge
                                    class="x-tag-platform-pc"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    <Monitor class="h-4 w-4 x-tag-platform-pc" />
                                    <span
                                        v-if="worldDialog.bundleSizes['standalonewindows']"
                                        :class="['x-grey', 'x-tag-platform-pc', 'x-tag-border-left']">
                                        {{ worldDialog.bundleSizes['standalonewindows'].fileSize }}
                                    </span>
                                </Badge>
                            </TooltipWrapper>

                            <TooltipWrapper v-if="worldDialog.isQuest" side="top" content="Quest">
                                <Badge
                                    class="x-tag-platform-quest"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    <Smartphone class="h-4 w-4 x-tag-platform-quest" />
                                    <span
                                        v-if="worldDialog.bundleSizes['android']"
                                        :class="['x-grey', 'x-tag-platform-quest', 'x-tag-border-left']">
                                        {{ worldDialog.bundleSizes['android'].fileSize }}
                                    </span>
                                </Badge>
                            </TooltipWrapper>

                            <TooltipWrapper v-if="worldDialog.isIos" side="top" content="iOS">
                                <Badge
                                    class="text-[#8e8e93] border-[#8e8e93]"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    <Apple class="h-4 w-4 text-[#8e8e93]" />
                                    <span
                                        v-if="worldDialog.bundleSizes['ios']"
                                        :class="['x-grey', 'x-tag-border-left', 'text-[#8e8e93]', 'border-[#8e8e93]']">
                                        {{ worldDialog.bundleSizes['ios'].fileSize }}
                                    </span>
                                </Badge>
                            </TooltipWrapper>

                            <Badge
                                v-if="worldDialog.avatarScalingDisabled"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.avatar_scaling_disabled') }}
                            </Badge>
                            <Badge
                                v-if="worldDialog.focusViewDisabled"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.focus_view_disabled') }}
                            </Badge>
                            <Badge
                                v-if="worldDialog.ref.unityPackageUrl"
                                variant="outline"
                                style="margin-right: 5px; margin-top: 5px">
                                {{ t('dialog.world.tags.future_proofing') }}
                            </Badge>
                            <Badge
                                v-if="worldDialog.inCache"
                                variant="outline"
                                class="cursor-pointer"
                                style="margin-right: 5px; margin-top: 5px"
                                @click="openFolderGeneric(worldDialog.cachePath)">
                                <span v-text="worldDialog.cacheSize" />
                                | {{ t('dialog.world.tags.cache') }}
                            </Badge>
                        </div>
                        <div>
                            <template v-for="tag in worldDialog.ref.tags" :key="tag">
                                <Badge
                                    v-if="tag.startsWith('content_')"
                                    variant="outline"
                                    style="margin-right: 5px; margin-top: 5px">
                                    <span v-if="tag === 'content_horror'">
                                        {{ t('dialog.world.tags.content_horror') }}
                                    </span>
                                    <span v-else-if="tag === 'content_gore'">
                                        {{ t('dialog.world.tags.content_gore') }}
                                    </span>
                                    <span v-else-if="tag === 'content_violence'">
                                        {{ t('dialog.world.tags.content_violence') }}
                                    </span>
                                    <span v-else-if="tag === 'content_adult'">
                                        {{ t('dialog.world.tags.content_adult') }}
                                    </span>
                                    <span v-else-if="tag === 'content_sex'">
                                        {{ t('dialog.world.tags.content_sex') }}
                                    </span>
                                    <span v-else>
                                        {{ tag.replace('content_', '') }}
                                    </span>
                                </Badge>
                            </template>
                        </div>
                        <div style="margin-top: 5px">
                            <span
                                v-show="worldDialog.ref.name !== worldDialog.ref.description"
                                style="font-size: 12px"
                                >{{ worldDialog.ref.description }}</span
                            >
                        </div>
                    </div>
                    <div style="flex: none; margin-left: 10px">
                        <TooltipWrapper
                            v-if="worldDialog.inCache"
                            side="top"
                            :content="t('dialog.world.actions.delete_cache_tooltip')">
                            <Button
                                class="rounded-full mr-2"
                                size="icon-lg"
                                variant="outline"
                                :disabled="isGameRunning && worldDialog.cacheLocked"
                                @click="deleteVRChatCache(worldDialog.ref)"
                                ><Trash2
                            /></Button>
                        </TooltipWrapper>
                        <TooltipWrapper
                            v-if="worldDialog.isFavorite"
                            side="top"
                            :content="t('dialog.world.actions.favorites_tooltip')">
                            <Button class="rounded-full" size="icon-lg" @click="worldDialogCommand('Add Favorite')"
                                ><Star
                            /></Button>
                        </TooltipWrapper>
                        <TooltipWrapper v-else side="top" :content="t('dialog.world.actions.favorites_tooltip')">
                            <Button
                                class="rounded-full"
                                size="icon-lg"
                                variant="outline"
                                @click="worldDialogCommand('Add Favorite')"
                                ><Star
                            /></Button>
                        </TooltipWrapper>
                        <DropdownMenu>
                            <DropdownMenuTrigger as-child>
                                <Button variant="outline" size="icon-lg" class="rounded-full ml-2">
                                    <Ellipsis />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem @click="worldDialogCommand('Refresh')">
                                    <RefreshCw class="size-4" />
                                    {{ t('dialog.world.actions.refresh') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="worldDialogCommand('Share')">
                                    <Share2 class="size-4" />
                                    {{ t('dialog.world.actions.share') }}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem @click="worldDialogCommand('New Instance')">
                                    <Flag class="size-4" />
                                    {{ t('dialog.world.actions.new_instance') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="worldDialogCommand('New Instance and Self Invite')">
                                    <MessageSquare class="size-4" />
                                    {{
                                        canOpenInstanceInGame
                                            ? t('dialog.world.actions.new_instance_and_open_ingame')
                                            : t('dialog.world.actions.new_instance_and_self_invite')
                                    }}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    v-if="
                                        currentUser.$homeLocation &&
                                        currentUser.$homeLocation.worldId === worldDialog.id
                                    "
                                    @click="worldDialogCommand('Reset Home')">
                                    <Wand2 class="size-4" />
                                    {{ t('dialog.world.actions.reset_home') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem v-else @click="worldDialogCommand('Make Home')">
                                    <Home class="size-4" />
                                    {{ t('dialog.world.actions.make_home') }}
                                </DropdownMenuItem>
                                <DropdownMenuItem @click="worldDialogCommand('Previous Instances')">
                                    <LineChart class="size-4" />
                                    {{ t('dialog.world.actions.show_previous_instances') }}
                                </DropdownMenuItem>
                                <template v-if="currentUser.id !== worldDialog.ref.authorId">
                                    <DropdownMenuItem
                                        :disabled="!worldDialog.hasPersistData"
                                        @click="worldDialogCommand('Delete Persistent Data')">
                                        <Upload class="size-4" />
                                        {{ t('dialog.world.actions.delete_persistent_data') }}
                                    </DropdownMenuItem>
                                </template>
                                <template v-else>
                                    <DropdownMenuItem @click="worldDialogCommand('Rename')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.rename') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="worldDialogCommand('Change Description')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.change_description') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="worldDialogCommand('Change Capacity')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.change_capacity') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="worldDialogCommand('Change Recommended Capacity')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.change_recommended_capacity') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="worldDialogCommand('Change YouTube Preview')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.change_preview') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="worldDialogCommand('Change Tags')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.change_warnings_settings_tags') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem @click="worldDialogCommand('Change Allowed Domains')">
                                        <Pencil class="size-4" />
                                        {{ t('dialog.world.actions.change_allowed_video_player_domains') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-if="isWindows" @click="worldDialogCommand('Change Image')">
                                        <Image class="size-4" />
                                        {{ t('dialog.world.actions.change_image') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        v-if="worldDialog.ref.unityPackageUrl"
                                        @click="worldDialogCommand('Download Unity Package')">
                                        <Download class="size-4" />
                                        {{ t('dialog.world.actions.download_package') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        v-if="
                                            worldDialog.ref?.tags?.includes('system_approved') ||
                                            worldDialog.ref?.tags?.includes('system_labs')
                                        "
                                        @click="worldDialogCommand('Unpublish')">
                                        <Eye class="size-4" />
                                        {{ t('dialog.world.actions.unpublish') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem v-else @click="worldDialogCommand('Publish')">
                                        <Eye class="size-4" />
                                        {{ t('dialog.world.actions.publish_to_labs') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        :disabled="!worldDialog.hasPersistData"
                                        @click="worldDialogCommand('Delete Persistent Data')">
                                        <Upload class="size-4" />
                                        {{ t('dialog.world.actions.delete_persistent_data') }}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive" @click="worldDialogCommand('Delete')">
                                        <Trash2 class="size-4" />
                                        {{ t('dialog.world.actions.delete') }}
                                    </DropdownMenuItem>
                                </template>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            <TabsUnderline
                v-model="worldDialog.activeTab"
                :items="worldDialogTabs"
                :unmount-on-hide="false"
                @update:modelValue="worldDialogTabClick">
                <template #Instances>
                    <div class="flex items-center text-sm">
                        <User />
                        {{ t('dialog.world.instances.public_count', { count: worldDialog.ref.publicOccupants }) }}
                        <User style="margin-left: 10px" />
                        {{
                            t('dialog.world.instances.private_count', {
                                count: worldDialog.ref.privateOccupants
                            })
                        }}
                        <Check style="margin-left: 10px" />
                        {{
                            t('dialog.world.instances.capacity_count', {
                                count: worldDialog.ref.recommendedCapacity,
                                max: worldDialog.ref.capacity
                            })
                        }}
                    </div>
                    <div v-for="room in worldDialog.rooms" :key="room.id">
                        <template
                            v-if="isAgeGatedInstancesVisible || !(room.ageGate || room.location?.includes('~ageGate'))">
                            <div style="margin: 5px 0">
                                <div class="flex-align-center">
                                    <LocationWorld
                                        class="text-sm"
                                        :locationobject="room.$location"
                                        :currentuserid="currentUser.id"
                                        :worlddialogshortname="worldDialog.$location.shortName" />
                                    <InstanceActionBar
                                        class="ml-1 text-sm"
                                        :location="room.$location.tag"
                                        :launch-location="room.tag"
                                        :instance-location="room.tag"
                                        :shortname="room.$location.shortName"
                                        :currentlocation="lastLocation.location"
                                        :instance="room.ref"
                                        :friendcount="room.friendCount"
                                        :refresh-tooltip="t('dialog.world.instances.refresh_instance_info')"
                                        :show-history="!!instanceJoinHistory.get(room.$location.tag)"
                                        :history-tooltip="t('dialog.previous_instances.info')"
                                        :on-refresh="() => refreshInstancePlayerCount(room.tag)"
                                        :on-history="() => showPreviousInstancesInfoDialog(room.location)" />
                                </div>
                                <div
                                    v-if="room.$location.userId || room.users.length"
                                    class="x-friend-list"
                                    style="margin: 10px 0; max-height: unset">
                                    <div
                                        v-if="room.$location.userId"
                                        class="x-friend-item x-friend-item-border"
                                        @click="showUserDialog(room.$location.userId)">
                                        <template v-if="room.$location.user">
                                            <div class="avatar" :class="userStatusClass(room.$location.user)">
                                                <img :src="userImage(room.$location.user, true)" loading="lazy" />
                                            </div>
                                            <div class="detail">
                                                <span
                                                    class="name"
                                                    :style="{ color: room.$location.user.$userColour }"
                                                    v-text="room.$location.user.displayName" />
                                                <span class="extra">
                                                    {{ t('dialog.world.instances.instance_creator') }}
                                                </span>
                                            </div>
                                        </template>
                                        <span v-else v-text="room.$location.userId" />
                                    </div>
                                    <div
                                        v-for="user in room.users"
                                        :key="user.id"
                                        class="x-friend-item x-friend-item-border"
                                        @click="showUserDialog(user.id)">
                                        <div class="avatar" :class="userStatusClass(user)">
                                            <img :src="userImage(user, true)" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: user.$userColour }"
                                                v-text="user.displayName" />
                                            <span v-if="user.location === 'traveling'" class="extra">
                                                <Spinner class="inline-block mr-1" />
                                                <Timer :epoch="user.$travelingToTime" />
                                            </span>
                                            <span v-else class="extra">
                                                <Timer :epoch="user.$location_at" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>
                <template #Info>
                    <div class="x-friend-list" style="max-height: none">
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.memo') }}
                                </span>
                                <InputGroupTextareaField
                                    v-model="memo"
                                    class="extra"
                                    :rows="2"
                                    :placeholder="t('dialog.world.info.memo_placeholder')"
                                    input-class="resize-none min-h-0"
                                    @change="onWorldMemoChange" />
                            </div>
                        </div>
                        <div style="width: 100%; display: flex">
                            <div class="x-friend-item" style="width: 100%; cursor: default">
                                <div class="detail">
                                    <span class="name">
                                        {{ t('dialog.world.info.id') }}
                                    </span>
                                    <span class="extra" style="display: inline">
                                        {{ worldDialog.id }}
                                    </span>
                                    <TooltipWrapper side="top" :content="t('dialog.world.info.id_tooltip')">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger as-child>
                                                <Button
                                                    class="rounded-full text-xs"
                                                    size="icon-sm"
                                                    variant="outline"
                                                    @click.stop
                                                    ><Copy class="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem @click="copyWorldId()">
                                                    {{ t('dialog.world.info.copy_id') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="copyWorldUrl()">
                                                    {{ t('dialog.world.info.copy_url') }}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem @click="copyWorldName()">
                                                    {{ t('dialog.world.info.copy_name') }}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TooltipWrapper>
                                </div>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.previewYoutubeId"
                            class="x-friend-item"
                            style="width: 350px"
                            @click="
                                openExternalLink(`https://www.youtube.com/watch?v=${worldDialog.ref.previewYoutubeId}`)
                            ">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.youtube_preview') }}
                                </span>
                                <span class="extra">
                                    https://www.youtube.com/watch?v={{ worldDialog.ref.previewYoutubeId }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.author_tags') }}
                                </span>
                                <span
                                    v-if="
                                        worldDialog.ref.tags?.filter((tag) => tag.startsWith('author_tag')).length > 0
                                    "
                                    class="extra">
                                    {{ worldTags }}
                                </span>
                                <span v-else class="extra"> - </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.players') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.occupants) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.favorites') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.favorites)
                                    }}<span
                                        v-if="worldDialog.ref?.favorites > 0 && worldDialog.ref?.visits > 0"
                                        class="extra">
                                        ({{ favoriteRate }}%)
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.visits') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.visits) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.capacity') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.recommendedCapacity) }} ({{
                                        commaNumber(worldDialog.ref.capacity)
                                    }})
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.created_at') }}
                                </span>
                                <span class="extra">
                                    {{ formatDateFilter(worldDialog.ref.created_at, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.last_updated') }}
                                </span>
                                <span v-if="worldDialog.lastUpdated" class="extra">
                                    {{ formatDateFilter(worldDialog.lastUpdated, 'long') }}
                                </span>
                                <span v-else class="extra">
                                    {{ formatDateFilter(worldDialog.ref.updated_at, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.labsPublicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.labs_publication_date') }}
                                </span>
                                <span class="extra">
                                    {{ formatDateFilter(worldDialog.ref.labsPublicationDate, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div
                            v-if="worldDialog.ref.publicationDate !== 'none'"
                            class="x-friend-item"
                            style="cursor: default">
                            <div class="detail">
                                <span class="name" style="display: inline">
                                    {{ t('dialog.world.info.publication_date') }}
                                </span>
                                <TooltipWrapper v-if="isTimeInLabVisible" side="top" style="margin-left: 5px">
                                    <template #content>
                                        <span>
                                            {{ t('dialog.world.info.time_in_labs') }}
                                            {{ timeInLab }}
                                        </span>
                                    </template>
                                    <ChevronDown class="inline-block" />
                                </TooltipWrapper>
                                <span class="extra">
                                    {{ formatDateFilter(worldDialog.ref.publicationDate, 'long') }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.version') }}
                                </span>
                                <span class="extra" v-text="worldDialog.ref.version" />
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.heat') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.heat) }} {{ '🔥'.repeat(worldDialog.ref.heat) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.popularity') }}
                                </span>
                                <span class="extra">
                                    {{ commaNumber(worldDialog.ref.popularity) }}
                                    {{ '💖'.repeat(worldDialog.ref.popularity) }}
                                </span>
                            </div>
                        </div>
                        <div class="x-friend-item" style="width: 100%; cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.platform') }}
                                </span>
                                <span class="extra" style="white-space: normal">{{ worldDialogPlatform }}</span>
                            </div>
                        </div>

                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.last_visited') }}
                                </span>
                                <span class="extra">{{ formatDateFilter(worldDialog.lastVisit, 'long') }}</span>
                            </div>
                        </div>

                        <div class="x-friend-item" @click="showPreviousInstancesListDialog(worldDialog.ref)">
                            <div class="detail">
                                <div
                                    class="name"
                                    style="display: flex; justify-content: space-between; align-items: center">
                                    <div>
                                        {{ t('dialog.world.info.visit_count') }}
                                    </div>

                                    <TooltipWrapper side="top" :content="t('dialog.user.info.open_previous_instance')">
                                        <MoreHorizontal style="margin-right: 16px" />
                                    </TooltipWrapper>
                                </div>
                                <span v-if="worldDialog.visitCount === 0" class="extra">-</span>
                                <span v-else class="extra" v-text="worldDialog.visitCount"></span>
                            </div>
                        </div>

                        <div class="x-friend-item" style="cursor: default">
                            <div class="detail">
                                <span class="name">
                                    {{ t('dialog.world.info.time_spent') }}
                                </span>
                                <span class="extra">
                                    {{ worldDialog.timeSpent === 0 ? ' - ' : timeSpent }}
                                </span>
                            </div>
                        </div>
                    </div>
                </template>
                <template #JSON>
                    <Button
                        class="rounded-full mr-2"
                        size="icon-sm"
                        variant="outline"
                        @click="refreshWorldDialogTreeData()">
                        <RefreshCw />
                    </Button>
                    <Button
                        class="rounded-full"
                        size="icon-sm"
                        variant="outline"
                        @click="downloadAndSaveJson(worldDialog.id, worldDialog.ref)">
                        <Download />
                    </Button>
                    <vue-json-pretty
                        :key="treeData?.id"
                        :data="treeData"
                        :deep="2"
                        :theme="isDarkMode ? 'dark' : 'light'"
                        show-icon />
                    <br />
                    <vue-json-pretty
                        v-if="Object.keys(worldDialog.fileAnalysis).length > 0"
                        :data="worldDialog.fileAnalysis"
                        :deep="2"
                        :theme="isDarkMode ? 'dark' : 'light'"
                        show-icon />
                </template>
            </TabsUnderline>
        </div>

        <template v-if="isDialogVisible">
            <WorldAllowedDomainsDialog :world-allowed-domains-dialog="worldAllowedDomainsDialog" />
            <SetWorldTagsDialog
                v-model:is-set-world-tags-dialog-visible="isSetWorldTagsDialogVisible"
                :old-tags="worldDialog.ref?.tags"
                :world-id="worldDialog.id"
                :is-world-dialog-visible="worldDialog.visible" />
            <NewInstanceDialog
                :new-instance-dialog-location-tag="newInstanceDialogLocationTag"
                :last-location="lastLocation" />
            <ChangeWorldImageDialog
                v-model:change-world-image-dialog-visible="changeWorldImageDialogVisible"
                v-model:previousImageUrl="previousImageUrl" />
        </template>
    </div>
</template>

<script setup>
    import {
        Apple,
        Check,
        ChevronDown,
        Copy,
        Download,
        Ellipsis,
        Eye,
        Flag,
        Home,
        Image,
        LineChart,
        MessageSquare,
        Monitor,
        MoreHorizontal,
        Pencil,
        RefreshCw,
        Share2,
        Smartphone,
        Star,
        Trash2,
        Upload,
        User,
        Wand2
    } from 'lucide-vue-next';
    import { computed, defineAsyncComponent, nextTick, ref, watch } from 'vue';
    import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { InputGroupTextareaField } from '@/components/ui/input-group';
    import { Spinner } from '@/components/ui/spinner';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import VueJsonPretty from 'vue-json-pretty';

    import {
        commaNumber,
        deleteVRChatCache,
        downloadAndSaveJson,
        formatDateFilter,
        openExternalLink,
        openFolderGeneric,
        refreshInstancePlayerCount,
        replaceVrcPackageUrl,
        timeToText,
        userImage,
        userStatusClass
    } from '../../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useFavoriteStore,
        useGalleryStore,
        useGameStore,
        useInstanceStore,
        useInviteStore,
        useLocationStore,
        useModalStore,
        useUserStore,
        useWorldStore
    } from '../../../stores';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../ui/dropdown-menu';
    import { favoriteRequest, miscRequest, userRequest, worldRequest } from '../../../api';
    import { Badge } from '../../ui/badge';
    import { database } from '../../../service/database.js';
    import { formatJsonVars } from '../../../shared/utils/base/ui';

    import InstanceActionBar from '../../InstanceActionBar.vue';

    const modalStore = useModalStore();

    const NewInstanceDialog = defineAsyncComponent(() => import('../NewInstanceDialog.vue'));
    const ChangeWorldImageDialog = defineAsyncComponent(() => import('./ChangeWorldImageDialog.vue'));
    const SetWorldTagsDialog = defineAsyncComponent(() => import('./SetWorldTagsDialog.vue'));
    const WorldAllowedDomainsDialog = defineAsyncComponent(() => import('./WorldAllowedDomainsDialog.vue'));

    const { isAgeGatedInstancesVisible, isDarkMode } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { currentUser, userDialog } = storeToRefs(useUserStore());
    const { worldDialog } = storeToRefs(useWorldStore());
    const { cachedWorlds, showWorldDialog } = useWorldStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { newInstanceSelfInvite, canOpenInstanceInGame } = useInviteStore();
    const { showFavoriteDialog } = useFavoriteStore();
    const { showPreviousInstancesInfoDialog, showPreviousInstancesListDialog: openPreviousInstancesListDialog } =
        useInstanceStore();
    const { instanceJoinHistory } = storeToRefs(useInstanceStore());
    const { isGameRunning } = storeToRefs(useGameStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { t } = useI18n();
    const worldDialogTabs = computed(() => [
        { value: 'Instances', label: t('dialog.world.instances.header') },
        { value: 'Info', label: t('dialog.world.info.header') },
        { value: 'JSON', label: t('dialog.world.json.header') }
    ]);

    const treeData = ref({});
    const worldAllowedDomainsDialog = ref({
        visible: false,
        worldId: '',
        urlList: []
    });
    const isSetWorldTagsDialogVisible = ref(false);
    const newInstanceDialogLocationTag = ref('');
    const changeWorldImageDialogVisible = ref(false);
    const previousImageUrl = ref('');

    const isDialogVisible = computed({
        get() {
            return worldDialog.value.visible;
        },
        set(value) {
            worldDialog.value.visible = value;
        }
    });

    const isWindows = computed(() => WINDOWS);

    const memo = computed({
        get() {
            return worldDialog.value.memo;
        },
        set(value) {
            worldDialog.value.memo = value;
        }
    });

    const isTimeInLabVisible = computed(() => {
        return (
            worldDialog.value.ref.publicationDate &&
            worldDialog.value.ref.publicationDate !== 'none' &&
            worldDialog.value.ref.labsPublicationDate &&
            worldDialog.value.ref.labsPublicationDate !== 'none'
        );
    });

    const timeInLab = computed(() => {
        return timeToText(
            new Date(worldDialog.value.ref.publicationDate).getTime() -
                new Date(worldDialog.value.ref.labsPublicationDate).getTime()
        );
    });

    const favoriteRate = computed(() => {
        return (
            Math.round(
                (((worldDialog.value.ref?.favorites - worldDialog.value.ref?.visits) / worldDialog.value.ref?.visits) *
                    100 +
                    100) *
                    100
            ) / 100
        );
    });

    const worldTags = computed(() => {
        return worldDialog.value.ref?.tags
            .filter((tag) => tag.startsWith('author_tag'))
            .map((tag) => tag.replace('author_tag_', ''))
            .join(', ');
    });

    const timeSpent = computed(() => {
        return timeToText(worldDialog.value.timeSpent);
    });

    const worldDialogPlatform = computed(() => {
        const { ref } = worldDialog.value;
        const platforms = [];
        if (ref.unityPackages) {
            for (const unityPackage of ref.unityPackages) {
                let platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Android';
                } else if (unityPackage.platform) {
                    ({ platform } = unityPackage);
                }
                platforms.unshift(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
    });

    watch(
        () => worldDialog.value.loading,
        () => {
            if (worldDialog.value.visible) {
                handleDialogOpen();
                !worldDialog.value.loading && loadLastActiveTab();
            }
        }
    );

    function handleWorldDialogTab(tabName) {
        worldDialog.value.lastActiveTab = tabName;
        if (tabName === 'JSON') {
            refreshWorldDialogTreeData();
        }
    }

    function loadLastActiveTab() {
        handleWorldDialogTab(worldDialog.value.lastActiveTab);
    }

    function worldDialogTabClick(tabName) {
        if (tabName === worldDialog.value.lastActiveTab) {
            if (tabName === 'JSON') {
                refreshWorldDialogTreeData();
            }
            return;
        }
        handleWorldDialogTab(tabName);
    }

    function handleDialogOpen() {
        treeData.value = {};
    }

    function showChangeWorldImageDialog() {
        const { imageUrl } = worldDialog.value.ref;
        previousImageUrl.value = imageUrl;
        changeWorldImageDialogVisible.value = true;
    }

    function showNewInstanceDialog(tag) {
        // trigger watcher
        newInstanceDialogLocationTag.value = '';
        nextTick(() => (newInstanceDialogLocationTag.value = tag));
    }

    function worldDialogCommand(command) {
        const D = worldDialog.value;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'Delete Favorite':
            case 'Make Home':
            case 'Reset Home':
            case 'Publish':
            case 'Unpublish':
            case 'Delete Persistent Data':
            case 'Delete':
                modalStore
                    .confirm({
                        description: t('confirm.command_question', {
                            command
                        }),
                        title: 'Confirm'
                    })
                    .then(({ ok }) => {
                        if (!ok) return;
                        switch (command) {
                            case 'Delete Favorite':
                                favoriteRequest.deleteFavorite({
                                    objectId: D.id
                                });
                                break;
                            case 'Make Home':
                                userRequest
                                    .saveCurrentUser({
                                        homeLocation: D.id
                                    })
                                    .then((args) => {
                                        toast.success('Home world updated');
                                        return args;
                                    });
                                break;
                            case 'Reset Home':
                                userRequest
                                    .saveCurrentUser({
                                        homeLocation: ''
                                    })
                                    .then((args) => {
                                        toast.success('Home world has been reset');
                                        return args;
                                    });
                                break;
                            case 'Publish':
                                worldRequest
                                    .publishWorld({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        toast.success('World has been published');
                                        return args;
                                    });
                                break;
                            case 'Unpublish':
                                worldRequest
                                    .unpublishWorld({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        toast.success('World has been unpublished');
                                        return args;
                                    });
                                break;
                            case 'Delete Persistent Data':
                                miscRequest
                                    .deleteWorldPersistData({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        if (args.params.worldId === worldDialog.value.id && worldDialog.value.visible) {
                                            worldDialog.value.hasPersistData = false;
                                        }
                                        toast.success('Persistent data has been deleted');
                                        return args;
                                    });
                                break;
                            case 'Delete':
                                worldRequest
                                    .deleteWorld({
                                        worldId: D.id
                                    })
                                    .then((args) => {
                                        const { json } = args;
                                        cachedWorlds.delete(json.id);
                                        if (worldDialog.value.ref.authorId === json.authorId) {
                                            const map = new Map();
                                            for (const ref of cachedWorlds.values()) {
                                                if (ref.authorId === json.authorId) {
                                                    map.set(ref.id, ref);
                                                }
                                            }
                                            const array = Array.from(map.values());
                                            userDialog.value.worlds = array;
                                        }
                                        toast.success('World has been deleted');
                                        D.visible = false;
                                        return args;
                                    });
                                break;
                        }
                    })
                    .catch(() => {});
                break;
            case 'Previous Instances':
                showPreviousInstancesListDialog(D.ref);
                break;
            case 'Share':
                copyWorldUrl();
                break;
            case 'Change Allowed Domains':
                showWorldAllowedDomainsDialog();
                break;
            case 'Change Tags':
                isSetWorldTagsDialogVisible.value = true;
                break;
            case 'Download Unity Package':
                openExternalLink(replaceVrcPackageUrl(worldDialog.value.ref.unityPackageUrl));
                break;
            case 'Change Image':
                showChangeWorldImageDialog();
                break;
            case 'Refresh':
                showWorldDialog(D.id);
                break;
            case 'New Instance':
                showNewInstanceDialog(D.$location.tag);
                break;
            case 'Add Favorite':
                showFavoriteDialog('world', D.id);
                break;
            case 'New Instance and Self Invite':
                newInstanceSelfInvite(D.id);
                break;
            case 'Rename':
                promptRenameWorld(D);
                break;
            case 'Change Description':
                promptChangeWorldDescription(D);
                break;
            case 'Change Capacity':
                promptChangeWorldCapacity(D);
                break;
            case 'Change Recommended Capacity':
                promptChangeWorldRecommendedCapacity(D);
                break;
            case 'Change YouTube Preview':
                promptChangeWorldYouTubePreview(D);
                break;
            default:
                break;
        }
    }

    function promptRenameWorld(world) {
        modalStore
            .prompt({
                title: t('prompt.rename_world.header'),
                description: t('prompt.rename_world.description'),
                confirmText: t('prompt.rename_world.ok'),
                cancelText: t('prompt.rename_world.cancel'),
                inputValue: world.ref.name,
                errorMessage: t('prompt.rename_world.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== world.ref.name) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            name: value
                        })
                        .then((args) => {
                            toast.success(t('prompt.rename_world.message.success'));
                            return args;
                        });
                }
            })
            .catch(() => {});
    }
    function promptChangeWorldDescription(world) {
        modalStore
            .prompt({
                title: t('prompt.change_world_description.header'),
                description: t('prompt.change_world_description.description'),
                confirmText: t('prompt.change_world_description.ok'),
                cancelText: t('prompt.change_world_description.cancel'),
                inputValue: world.ref.description,
                errorMessage: t('prompt.change_world_description.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== world.ref.description) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            description: value
                        })
                        .then((args) => {
                            toast.success(t('prompt.change_world_description.message.success'));
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    function promptChangeWorldCapacity(world) {
        modalStore
            .prompt({
                title: t('prompt.change_world_capacity.header'),
                description: t('prompt.change_world_capacity.description'),
                confirmText: t('prompt.change_world_capacity.ok'),
                cancelText: t('prompt.change_world_capacity.cancel'),
                inputValue: world.ref.capacity,
                pattern: /\d+$/,
                errorMessage: t('prompt.change_world_capacity.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== world.ref.capacity) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            capacity: Number(value)
                        })
                        .then((args) => {
                            toast.success(t('prompt.change_world_capacity.message.success'));
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    function promptChangeWorldRecommendedCapacity(world) {
        modalStore
            .prompt({
                title: t('prompt.change_world_recommended_capacity.header'),
                description: t('prompt.change_world_recommended_capacity.description'),
                confirmText: t('prompt.change_world_capacity.ok'),
                cancelText: t('prompt.change_world_capacity.cancel'),
                inputValue: world.ref.recommendedCapacity,
                pattern: /\d+$/,
                errorMessage: t('prompt.change_world_recommended_capacity.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== world.ref.recommendedCapacity) {
                    worldRequest
                        .saveWorld({
                            id: world.id,
                            recommendedCapacity: Number(value)
                        })
                        .then((args) => {
                            toast.success(t('prompt.change_world_recommended_capacity.message.success'));
                            return args;
                        });
                }
            })
            .catch(() => {});
    }

    function promptChangeWorldYouTubePreview(world) {
        modalStore
            .prompt({
                title: t('prompt.change_world_preview.header'),
                description: t('prompt.change_world_preview.description'),
                confirmText: t('prompt.change_world_preview.ok'),
                cancelText: t('prompt.change_world_preview.cancel'),
                inputValue: world.ref.previewYoutubeId,
                errorMessage: t('prompt.change_world_preview.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value && value !== world.ref.previewYoutubeId) {
                    let processedValue = value;
                    if (value.length > 11) {
                        try {
                            const url = new URL(value);
                            const id1 = url.pathname;
                            const id2 = url.searchParams.get('v');
                            if (id1 && id1.length === 12) {
                                processedValue = id1.substring(1, 12);
                            }
                            if (id2 && id2.length === 11) {
                                processedValue = id2;
                            }
                        } catch {
                            toast.error(t('prompt.change_world_preview.message.error'));
                            return;
                        }
                    }
                    if (processedValue !== world.ref.previewYoutubeId) {
                        worldRequest
                            .saveWorld({
                                id: world.id,
                                previewYoutubeId: processedValue
                            })
                            .then((args) => {
                                toast.success(t('prompt.change_world_preview.message.success'));
                                return args;
                            });
                    }
                }
            })
            .catch(() => {});
    }
    function onWorldMemoChange() {
        const worldId = worldDialog.value.id;
        const memo = worldDialog.value.memo;
        if (memo) {
            database.setWorldMemo({
                worldId,
                editedAt: new Date().toJSON(),
                memo
            });
        } else {
            database.deleteWorldMemo(worldId);
        }
    }
    function showPreviousInstancesListDialog(worldRef) {
        openPreviousInstancesListDialog('world', worldRef);
    }
    function refreshWorldDialogTreeData() {
        treeData.value = formatJsonVars(worldDialog.value.ref);
    }
    function copyWorldId() {
        navigator.clipboard
            .writeText(worldDialog.value.id)
            .then(() => {
                toast.success('World ID copied to clipboard');
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error('Copy failed');
            });
    }
    function copyWorldUrl() {
        navigator.clipboard
            .writeText(`https://vrchat.com/home/world/${worldDialog.value.id}`)
            .then(() => {
                toast.success('World URL copied to clipboard');
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error('Copy failed');
            });
    }
    function copyWorldName() {
        navigator.clipboard
            .writeText(worldDialog.value.ref.name)
            .then(() => {
                toast.success('World name copied to clipboard');
            })
            .catch((err) => {
                console.error('copy failed:', err);
                toast.error('Copy failed');
            });
    }
    function showWorldAllowedDomainsDialog() {
        const D = worldAllowedDomainsDialog.value;
        D.worldId = worldDialog.value.id;
        D.urlList = worldDialog.value.ref?.urlList ?? [];
        D.visible = true;
    }
</script>

<style scoped>
    .flex-align-center {
        display: flex;
        align-items: center;
    }
</style>
