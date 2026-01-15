<template>
    <div id="x-app" class="x-app x-app-type">
        <div class="wrist" :class="{ background: config && config.backgroundEnabled }">
            <div class="x-container" style="flex: 1">
                <div class="x-friend-list" ref="list" style="color: #aaa">
                    <template v-if="config && config.minimalFeed">
                        <template
                            v-for="(feed, index) in wristFeed"
                            :key="`minimal-${index}-${feed.type}-${feed.created_at}`">
                            <div
                                v-if="feed.type === 'GPS'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span>
                                        <Loader2 v-if="feed.isTraveling" class="is-loading ml-5 h-4 w-4" />
                                        <VrLocation
                                            :location="feed.location"
                                            :hint="feed.worldName"
                                            :grouphint="feed.groupName"
                                            :instancedisplayname="feed.instanceDisplayName"
                                            style="margin-left: 5px"></VrLocation>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Offline'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span>
                                        <X class="h-5 w-5" />
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Online'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span>
                                        <Check class="h-5 w-5" />
                                        <template v-if="feed.worldName">
                                            <Loader2 v-if="feed.isTraveling" class="is-loading ml-5 h-4 w-4" />
                                            <VrLocation
                                                :location="feed.location"
                                                :hint="feed.worldName"
                                                :grouphint="feed.groupName"
                                                :instancedisplayname="feed.instanceDisplayName"
                                                style="margin-left: 5px"></VrLocation>
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Status'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName" style="margin-right: 5px"></span>
                                        <template v-if="feed.statusDescription === feed.previousStatusDescription">
                                            <i class="x-user-status" :class="statusClass(feed.previousStatus)"></i>
                                            <ArrowRight class="mx-1 h-4 w-4 inline-block" />
                                            <i class="x-user-status" :class="statusClass(feed.status)"></i>
                                        </template>
                                        <template v-else>
                                            <i class="x-user-status" :class="statusClass(feed.status)"></i>
                                            {{ feed.statusDescription }}
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'OnPlayerJoined'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="mr-5 h-5 w-5" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'OnPlayerLeft'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="mr-5 h-5 w-5 rotate-180" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'OnPlayerJoining'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="h-5 w-5" />
                                        <Loader2 class="is-loading mr-5 h-4 w-4" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Location'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <VrLocation
                                            :location="feed.location"
                                            :hint="feed.worldName"
                                            :grouphint="feed.groupName"
                                            :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'VideoPlay'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Youtube class="mr-5 h-5 w-5" />
                                        <span
                                            v-if="feed.displayName"
                                            class="name"
                                            v-text="feed.displayName"
                                            style="margin-right: 5px"
                                            :style="{ color: feed.tagColour }"></span>
                                        <template v-if="feed.videoName">
                                            <span v-text="feed.videoName"></span>
                                        </template>
                                        <template v-else>
                                            <span v-text="feed.videoUrl"></span>
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'invite'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Send class="mr-5 h-5 w-5" />
                                        <span class="name mr-5" v-text="feed.senderUsername"></span>
                                        <VrLocation
                                            :location="feed.details.worldId"
                                            :hint="feed.details.worldName"
                                            :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                        <span v-text="feed.details.inviteMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'requestInvite'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Send class="mr-5 h-5 w-5" />
                                        <span class="name mr-5" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.details.requestMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'inviteResponse'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Send class="mr-5 h-5 w-5" />
                                        <span class="name mr-5" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.details.responseMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'requestInviteResponse'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Send class="mr-5 h-5 w-5" />
                                        <span class="name mr-5" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.details.responseMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'friendRequest'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <HeartPlus class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.senderUsername"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Friend'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Heart class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Unfriend'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <ThumbsDown class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'DisplayName'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Pencil class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.previousDisplayName"></span>
                                        <ArrowRight class="mr-5 h-4 w-4 inline-block" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'TrustLevel'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <GraduationCap class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                        {{ feed.previousTrustLevel }}
                                        <ArrowRight class="mx-1 inline-block h-4 w-4" />
                                        {{ feed.trustLevel }}
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'boop'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <HeartHandshake class="mr-5 h-5 w-5" />
                                        <span class="name mr-5" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'groupChange'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Tag class="mr-5 h-5 w-5" />
                                        <span class="name mr-5" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.announcement'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Megaphone class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.informative'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Megaphone class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.invite'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Tag class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.joinRequest'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Tag class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.transfer'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Tag class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.queueReady'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Send class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'instance.closed'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <XCircle class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'PortalSpawn'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <template v-if="feed.displayName">
                                            <Music class="mr-5 h-5 w-5" />
                                            <span
                                                class="name mr-5"
                                                v-text="feed.displayName"
                                                :style="{ color: feed.tagColour }"></span>
                                            <VrLocation
                                                :location="feed.instanceId"
                                                :hint="feed.worldName"
                                                :grouphint="feed.groupName"></VrLocation>
                                        </template>
                                        <template v-else>
                                            <Music class="mr-1 h-5 w-5 inline-block" /> User has spawned a portal
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'AvatarChange'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Footprints class="mr-5 h-5 w-5" />
                                        <span
                                            class="name mr-5"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        <template v-if="feed.releaseStatus === 'public'">
                                            <i class="x-user-status online"></i>&nbsp;
                                        </template>
                                        <template v-else-if="feed.releaseStatus === 'private'">
                                            <i class="x-user-status askme"></i>&nbsp;
                                        </template>
                                        {{ feed.name }}
                                        <template v-if="feed.description && feed.description !== feed.name">
                                            - {{ feed.description }}
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'ChatBoxMessage'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <MessageSquare class="mr-5 h-5 w-5" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        <span v-text="feed.text"></span>
                                    </span>
                                </div>
                            </div>
                            <div v-else-if="feed.type === 'Event'" class="x-friend-item">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <AlertTriangle class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.data"></span>
                                    </span>
                                </div>
                            </div>
                            <div v-else-if="feed.type === 'External'" class="x-friend-item">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Info class="mr-5 h-5 w-5" />
                                        <span
                                            class="name mr-5"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'BlockedOnPlayerJoined'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="mr-1 h-5 w-5 inline-block" /><Ban class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'BlockedOnPlayerLeft'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="mr-1 inline-block h-5 w-5 rotate-180" /><Ban
                                            class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'MutedOnPlayerJoined'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="mr-1 h-5 w-5 inline-block" /><VolumeX class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'MutedOnPlayerLeft'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Play class="mr-1 inline-block h-5 w-5 rotate-180" /><VolumeX
                                            class="mr-5 h-5 w-5" />
                                        <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Blocked'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Ban class="mr-5 h-5 w-5" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Unblocked'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Circle class="mr-5 h-5 w-5" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Muted'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <VolumeX class="mr-5 h-5 w-5" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Unmuted'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <Volume2 class="mr-5 h-5 w-5" />
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                    </span>
                                </div>
                            </div>
                        </template>
                    </template>
                    <template v-else>
                        <template
                            v-for="(feed, index) in wristFeed"
                            :key="`full-${index}-${feed.type}-${feed.created_at}`">
                            <div
                                v-if="feed.type === 'GPS'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <template v-if="feed.isTraveling">
                                            <span class="name" v-text="feed.displayName"></span> is traveling to
                                            <VrLocation
                                                :location="feed.location"
                                                :hint="feed.worldName"
                                                :grouphint="feed.groupName"
                                                :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                        </template>
                                        <template v-else>
                                            <span class="name" v-text="feed.displayName"></span> is in
                                            <VrLocation
                                                :location="feed.location"
                                                :hint="feed.worldName"
                                                :grouphint="feed.groupName"
                                                :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Offline'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span> has logged out
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Online'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span>
                                        <span style="margin-left: 5px; margin-right: 5px">has logged in</span>
                                        <template v-if="feed.worldName">
                                            to
                                            <Loader2
                                                v-if="feed.isTraveling"
                                                class="is-loading ml-5 inline-block h-4 w-4" />
                                            <VrLocation
                                                :location="feed.location"
                                                :hint="feed.worldName"
                                                :grouphint="feed.groupName"
                                                :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Status'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName" style="margin-right: 5px"></span>
                                        <template v-if="feed.statusDescription === feed.previousStatusDescription">
                                            <i class="x-user-status" :class="statusClass(feed.previousStatus)"></i>
                                            <ArrowRight class="mx-1 inline-block h-4 w-4" />
                                            <i class="x-user-status" :class="statusClass(feed.status)"></i>
                                        </template>
                                        <template v-else>
                                            <i class="x-user-status" :class="statusClass(feed.status)"></i>
                                            {{ feed.statusDescription }}
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'OnPlayerJoined'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        has joined
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'OnPlayerLeft'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        has left
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'OnPlayerJoining'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span> is joining
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Location'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <VrLocation
                                            :location="feed.location"
                                            :hint="feed.worldName"
                                            :grouphint="feed.groupName"
                                            :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'VideoPlay'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        <span style="margin-left: 5px; margin-right: 5px">changed video to</span>
                                        <template v-if="feed.videoName">
                                            <span v-text="feed.videoName"></span>
                                        </template>
                                        <template v-else>
                                            <span v-text="feed.videoUrl"></span>
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'invite'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span> has invited you to
                                        <VrLocation
                                            :location="feed.details.worldId"
                                            :hint="feed.details.worldName"
                                            :instancedisplayname="feed.instanceDisplayName"></VrLocation>
                                        <span v-text="feed.details.inviteMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'requestInvite'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span> has requested an invite
                                        <span v-text="feed.details.requestMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'inviteResponse'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span> has responded to your
                                        invite <span v-text="feed.details.responseMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'requestInviteResponse'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span> has responded to your
                                        invite request <span v-text="feed.details.responseMessage"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'friendRequest'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span> has sent you a friend
                                        request
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Friend'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span> is now your friend
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Unfriend'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span> is no longer your friend
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'DisplayName'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.previousDisplayName"></span> changed their name
                                        to <span class="name" v-text="feed.displayName"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'TrustLevel'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.displayName"></span> trust level is now
                                        {{ feed.trustLevel }}
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'boop'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'groupChange'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.senderUsername"></span>
                                        <span v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.announcement'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.informative'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.invite'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.joinRequest'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.transfer'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'group.queueReady'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'instance.closed'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'PortalSpawn'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <template v-if="feed.displayName">
                                            <span
                                                class="name"
                                                v-text="feed.displayName"
                                                :style="{ color: feed.tagColour }"></span>
                                            has spawned a portal to
                                            <VrLocation
                                                :location="feed.instanceId"
                                                :hint="feed.worldName"
                                                :grouphint="feed.groupName"
                                                style="margin-left: 5px"></VrLocation>
                                        </template>
                                        <template v-else> User has spawned a portal </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'AvatarChange'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        <span style="margin-left: 5px; margin-right: 5px">changed into avatar</span>
                                        <template v-if="feed.releaseStatus === 'public'">
                                            <i class="x-user-status online"></i>
                                        </template>
                                        <template v-else>
                                            <i class="x-user-status askme"></i>
                                        </template>
                                        {{ feed.name }}
                                        <template v-if="feed.description && feed.description !== feed.name">
                                            - {{ feed.description }}
                                        </template>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'ChatBoxMessage'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        said <span v-text="feed.text"></span>
                                    </span>
                                </div>
                            </div>
                            <div v-else-if="feed.type === 'Event'" class="x-friend-item">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        Event: <span class="name" v-text="feed.data"></span>
                                    </span>
                                </div>
                            </div>
                            <div v-else-if="feed.type === 'External'" class="x-friend-item">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        External:
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        <span class="name" v-text="feed.message"></span>
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'BlockedOnPlayerJoined'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        Blocked user <span class="name" v-text="feed.displayName"></span> has joined
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'BlockedOnPlayerLeft'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        Blocked user <span class="name" v-text="feed.displayName"></span> has left
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'MutedOnPlayerJoined'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        Muted user <span class="name" v-text="feed.displayName"></span> has joined
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'MutedOnPlayerLeft'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        Muted user <span class="name" v-text="feed.displayName"></span> has left
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Blocked'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        has blocked you
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Unblocked'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        has unblocked you
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Muted'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        has muted you
                                    </span>
                                </div>
                            </div>
                            <div
                                v-else-if="feed.type === 'Unmuted'"
                                class="x-friend-item"
                                :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                                <div class="detail">
                                    <span class="extra">
                                        <span class="time">{{ formatDate(feed.created_at) }}</span>
                                        <span
                                            class="name"
                                            v-text="feed.displayName"
                                            :style="{ color: feed.tagColour }"></span>
                                        has unmuted you
                                    </span>
                                </div>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
            <div class="x-containerbottom">
                <div style="display: flex; flex-direction: row; flex-wrap: wrap">
                    <div
                        class="tracker-container"
                        v-for="(device, index) in devices"
                        :key="`device-${index}-${device[0]}`">
                        <div
                            v-if="device[0] === 'headset'"
                            class="tracker-device"
                            :class="trackingResultToClass(device[4])">
                            <img
                                v-if="device[1] !== 'connected'"
                                class="tracker-device"
                                src="/images/vr/headset_quest_status_off.png"
                                :class="trackingResultToClass(device[4])" />
                            <img
                                v-else-if="device[2] === 'charging'"
                                src="/images/vr/headset_quest_status_ready_charging.png" />
                            <img v-else-if="device[3] < 20" src="/images/vr/headset_quest_status_ready_low.png" />
                            <img v-else src="/images/vr/headset_quest_status_ready.png" />
                            <span>{{ device[3] }}%</span>
                        </div>
                        <div
                            v-if="device[0] === 'leftController'"
                            class="tracker-device"
                            :class="trackingResultToClass(device[4])">
                            <img
                                v-if="device[1] !== 'connected'"
                                class="tracker-device"
                                src="/images/vr/left_controller_status_off.png"
                                :class="trackingResultToClass(device[4])" />
                            <img
                                v-else-if="device[2] === 'charging'"
                                src="/images/vr/left_controller_status_ready_charging.png" />
                            <img v-else-if="device[3] < 20" src="/images/vr/left_controller_status_ready_low.png" />
                            <img v-else src="/images/vr/left_controller_status_ready.png" />
                            <span>{{ device[3] }}%</span>
                        </div>
                        <div
                            v-else-if="device[0] === 'rightController'"
                            class="tracker-device"
                            :class="trackingResultToClass(device[4])">
                            <img v-if="device[1] !== 'connected'" src="/images/vr/right_controller_status_off.png" />
                            <img
                                v-else-if="device[2] === 'charging'"
                                src="/images/vr/right_controller_status_ready_charging.png" />
                            <img v-else-if="device[3] < 20" src="/images/vr/right_controller_status_ready_low.png" />
                            <img v-else src="/images/vr/right_controller_status_ready.png" />
                            <span>{{ device[3] }}%</span>
                        </div>
                        <div
                            v-else-if="device[0] === 'controller'"
                            class="tracker-device"
                            :class="trackingResultToClass(device[4])">
                            <img v-if="device[1] !== 'connected'" src="/images/vr/controller_status_off.png" />
                            <img
                                v-else-if="device[2] === 'charging'"
                                src="/images/vr/controller_status_ready_charging.png" />
                            <img v-else-if="device[3] < 20" src="/images/vr/controller_status_ready_low.png" />
                            <img v-else src="/images/vr/controller_status_ready.png" />
                            <span>{{ device[3] }}%</span>
                        </div>
                        <div
                            v-else-if="device[0] === 'tracker'"
                            class="tracker-device"
                            :class="trackingResultToClass(device[4])">
                            <img v-if="device[1] !== 'connected'" src="/images/vr/tracker_status_off.png" />
                            <img
                                v-else-if="device[2] === 'charging'"
                                src="/images/vr/tracker_status_ready_charging.png" />
                            <img v-else-if="device[3] < 20" src="/images/vr/tracker_status_ready_low.png" />
                            <img v-else src="/images/vr/tracker_status_ready.png" />
                            <span>{{ device[3] }}%</span>
                        </div>
                        <div
                            v-else-if="device[0] === 'base'"
                            class="tracker-device"
                            :class="trackingResultToClass(device[4])">
                            <img v-if="device[1] !== 'connected'" src="/images/vr/base_status_off.png" />
                            <img v-else src="/images/vr/base_status_ready.png" />
                            <span v-if="device[3] !== 100">{{ device[3] }}x</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="x-containerbottom">
                <template v-if="nowPlaying.playing">
                    <span style="float: right; padding-left: 10px">{{ nowPlaying.remainingText }}</span>
                    <MarqueeText>{{ nowPlaying.name }}</MarqueeText>
                    <div
                        class="np-progress-bar"
                        style="margin-left: 5px"
                        :style="{ width: nowPlaying.percentage + '%' }"></div>
                </template>
                <div style="float: right">
                    <span v-if="!config?.minimalFeed" style="display: inline-block; margin-right: 5px">{{
                        t('vr.status.timer')
                    }}</span>
                    <span v-if="lastLocationTimer" style="display: inline-block; margin-right: 5px">{{
                        lastLocationTimer
                    }}</span>
                    <span v-if="lastLocationTimer && (onlineForTimer || pcUptime)" style="display: inline-block">
                        |
                    </span>
                    <span v-if="onlineForTimer" style="display: inline-block; margin-left: 5px">{{
                        onlineForTimer
                    }}</span>
                    <span v-if="pcUptime && onlineForTimer" style="display: inline-block; margin-left: 5px"> | </span>
                    <span v-if="pcUptime" style="display: inline-block; margin-left: 5px">{{ pcUptime }}</span>
                </div>
                <template v-if="lastLocation.playerList.length">
                    <span v-if="!config?.minimalFeed" style="display: inline-block; margin-right: 5px">{{
                        t('vr.status.players')
                    }}</span>
                    <span style="display: inline-block">{{ lastLocation.playerList.length }}</span>
                </template>
                <span
                    v-if="lastLocation.friendList.length"
                    style="display: inline-block; font-weight: bold; margin-left: 5px"
                    >({{ lastLocation.friendList.length }})</span
                >
                <!-- Bottom row -->
                <br />
                <span style="position: absolute; right: 10px">{{ currentTime }}</span>
                <span v-if="config && cpuUsageEnabled" style="display: inline-block; margin-right: 5px"
                    >{{ t('vr.status.cpu') }} {{ cpuUsage }}%</span
                >
                <span style="display: inline-block">{{ t('vr.status.online') }} {{ onlineFriendCount }}</span>
                <span style="display: inline-block; margin-left: 5px">{{ customInfo }}</span>
            </div>
        </div>
        <!-- HMD Overlay -->
        <div class="hmd">
            <svg class="np-progress-circle">
                <circle
                    class="np-progress-circle-stroke"
                    cx="60"
                    cy="60"
                    stroke="white"
                    r="30"
                    fill="transparent"
                    stroke-width="60"></circle>
            </svg>
            <div class="hud-feed">
                <div v-for="(feed, index) in hudFeed" :key="`hud-${index}-${feed.displayName}-${feed.time}`">
                    <div class="item" :class="{ friend: feed.isFriend, favorite: feed.isFavorite }">
                        <span v-if="feed.isMaster">👑</span><span v-if="feed.isModerator">⚔️</span
                        ><strong class="name" v-text="feed.displayName" :style="{ color: feed.colour }"></strong>
                        <template v-if="feed.type === 'ChangeAvatar'">
                            <span style="margin-left: 10px; color: #a3a3a3">ChangeAvatar</span>
                            <span v-if="!feed.inCache" style="color: #aaa; margin-left: 10px"
                                ><Loader2 class="is-loading inline-block h-4 w-4" />
                            </span>
                            <span v-text="feed.avatar.name" style="margin-left: 10px"></span>
                            <span
                                v-if="feed.avatar.releaseStatus === 'public'"
                                style="margin-left: 10px; color: #67c23a"
                                >(Public)</span
                            >
                            <span
                                v-else-if="feed.avatar.releaseStatus === 'private'"
                                style="margin-left: 10px; color: #e6a23c"
                                >(Private)</span
                            >
                        </template>
                        <template v-else-if="feed.type === 'ChangeStatus'">
                            <span style="margin-left: 10px; color: #a3a3a3">ChangeStatus</span>
                            <span v-if="feed.status !== feed.previousStatus">
                                <i
                                    class="x-user-status"
                                    :class="statusClass(feed.previousStatus)"
                                    style="margin-left: 10px; width: 20px; height: 20px"></i>
                                <span>
                                    <ArrowRight class="mx-1 inline-block h-4 w-4" />
                                </span>
                                <i
                                    class="x-user-status"
                                    :class="statusClass(feed.status)"
                                    style="width: 20px; height: 20px"></i>
                            </span>
                            <span
                                v-if="feed.statusDescription !== feed.previousStatusDescription"
                                v-text="feed.statusDescription"
                                style="margin-left: 10px"></span>
                        </template>
                        <template v-else-if="feed.type === 'ChangeGroup'">
                            <span style="margin-left: 10px; color: #a3a3a3">ChangeGroup</span>
                            <span v-text="feed.groupName" style="margin-left: 10px"></span>
                        </template>
                        <template v-else-if="feed.type === 'ChatBoxMessage'">
                            <span style="margin-left: 10px; color: #a3a3a3">ChatBox</span>
                            <span v-text="feed.text" style="margin-left: 10px; white-space: normal"></span>
                        </template>
                        <template v-else-if="feed.type === 'PortalSpawn'">
                            <span style="margin-left: 10px; color: #a3a3a3">PortalSpawn</span>
                            <VrLocation
                                :location="feed.location"
                                :hint="feed.worldName"
                                :grouphint="feed.groupName"
                                :link="false"
                                style="margin-left: 10px"></VrLocation>
                        </template>
                        <template v-else-if="feed.type === 'OnPlayerJoined'">
                            <span style="margin-left: 10px; color: #a3a3a3">has joined</span>
                            <span v-if="feed.platform === 'Desktop'" style="color: #409eff; margin-left: 10px"
                                >Desktop</span
                            >
                            <span v-else-if="feed.platform === 'VR'" style="color: #409eff; margin-left: 10px">VR</span>
                            <span v-else-if="feed.platform === 'Quest'" style="color: #67c23a; margin-left: 10px"
                                >Android</span
                            >
                            <span v-else-if="feed.platform === 'iOS'" style="color: #c7c7ce; margin-left: 10px"
                                >iOS</span
                            >
                            <span v-if="!feed.inCache" style="color: #aaa; margin-left: 10px"
                                ><Download class="inline-block h-4 w-4" />
                            </span>
                            <span v-text="feed.avatar.name" style="margin-left: 10px"></span>
                        </template>
                        <template v-else-if="feed.type === 'SpawnEmoji'">
                            <span style="margin-left: 10px; color: #a3a3a3">SpawnEmoji</span>
                            <span v-text="feed.text" style="margin-left: 10px"></span>
                        </template>
                        <span
                            v-else-if="feed.color === 'yellow'"
                            v-text="feed.text"
                            style="color: yellow; margin-left: 10px"></span>
                        <span v-else style="margin-left: 10px; color: #a3a3a3" v-text="feed.text"></span>
                        <template v-if="feed.combo > 1">
                            <span class="combo" style="margin-left: 10px">x{{ feed.combo }}</span>
                        </template>
                    </div>
                </div>
            </div>
            <div class="hud-timeout" v-if="hudTimeout.length > 0">
                <div class="hud-timeout-feed">
                    <div v-for="(feed, index) in hudTimeout" :key="`timeout-${index}-${feed.displayName}-${feed.time}`">
                        <p class="item">({{ feed.time }}s) {{ feed.displayName }}</p>
                    </div>
                </div>
                <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    xml:space="preserve">
                    <path
                        fill="#ED1B24"
                        d="M68.6,96.5L87,78.1c1.6-1.6,1.6-4.1,0-5.7s-4.1-1.6-5.7,0L62.9,90.9L44.5,72.5l18.4-18.4c1.6-1.6,1.6-4.1,0-5.7c-1.6-1.6-4.1-1.6-5.7,0L38.9,66.8l-6.4-6.4L21.2,71.8C11,82,9.7,97.9,17.4,109.5L0,126.9l8.5,8.5L25.9,118c11.6,7.7,27.5,6.4,37.8-3.8L75,102.9C75,102.9,68.6,96.5,68.6,96.5z"></path>
                    <path
                        fill="#ED1B24"
                        d="M102.9,75l11.3-11.3c10.3-10.3,11.5-26.1,3.8-37.8l17.4-17.4L126.9,0l-17.4,17.4C97.9,9.7,82,11,71.8,21.2L60.5,32.5C102,74,60.8,32.9,102.9,75z"></path>
                </svg>
            </div>
        </div>
    </div>
</template>

<script setup>
    import {
        AlertTriangle,
        ArrowRight,
        Ban,
        Check,
        Circle,
        Download,
        Footprints,
        GraduationCap,
        Heart,
        HeartHandshake,
        HeartPlus,
        Info,
        Loader2,
        Megaphone,
        MessageSquare,
        Music,
        Pencil,
        Play,
        Send,
        ThumbsDown,
        VolumeX,
        Volume2,
        X,
        XCircle,
        Youtube
    } from 'lucide-vue-next';
    import { nextTick, onBeforeUnmount, onMounted, reactive, toRefs } from 'vue';
    import { useI18n } from 'vue-i18n';

    import MarqueeText from 'vue-marquee-text-component';
    import Noty from 'noty';

    import { escapeTag, escapeTagRecursive } from '../shared/utils/base/string';
    import { changeHtmlLangAttribute } from '../shared/utils/base/ui';
    import { displayLocation } from '../shared/utils/location';
    import { loadLocalizedStrings } from '../plugin/i18n';
    import { removeFromArray } from '../shared/utils/base/array';
    import { timeToText } from '../shared/utils/base/format';

    import VrLocation from './components/VrLocation.vue';

    import * as workerTimers from 'worker-timers';

    import './vr.css';

    defineOptions({
        name: 'vr'
    });

    const { t, locale } = useI18n();

    const vrState = reactive({
        appLanguage: 'en',
        currentCulture: 'en-gb',
        currentTime: new Date().toJSON(),
        cpuUsageEnabled: false,
        cpuUsage: '0',
        pcUptimeEnabled: false,
        pcUptime: '',
        customInfo: '',
        config: {},
        onlineFriendCount: 0,
        nowPlaying: {
            url: '',
            name: '',
            length: 0,
            startTime: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false
        },
        lastLocation: {
            date: 0,
            location: '',
            name: '',
            playerList: [],
            friendList: [],
            progressPie: false,
            onlineFor: 0
        },
        lastLocationTimer: '',
        onlineForTimer: '',
        wristFeed: [],
        devices: [],
        deviceCount: 0,
        notificationOpacity: 100,
        hudFeed: [],
        hudTimeout: [],
        cleanHudFeedLoopStatus: false,
        isHmdDisabled: false,
        isWristDisabled: false
    });

    let isUnmounted = false;
    let updateStatsLoopTimeoutId = null;
    let updateVrElectronLoopTimeoutId = null;
    let cleanHudFeedLoopTimeoutId = null;

    onMounted(() => {
        window.$vr = {};
        window.$vr.configUpdate = configUpdate;
        window.$vr.updateOnlineFriendCount = updateOnlineFriendCount;
        window.$vr.nowPlayingUpdate = nowPlayingUpdate;
        window.$vr.lastLocationUpdate = lastLocationUpdate;
        window.$vr.wristFeedUpdate = wristFeedUpdate;
        window.$vr.refreshCustomScript = refreshCustomScript;
        window.$vr.playNoty = playNoty;
        window.$vr.statusClass = statusClass;
        window.$vr.notyClear = notyClear;
        window.$vr.addEntryHudFeed = addEntryHudFeed;
        window.$vr.updateHudFeedTag = updateHudFeedTag;
        window.$vr.updateHudTimeout = updateHudTimeout;
        window.$vr.setDatetimeFormat = setDatetimeFormat;
        window.$vr.setAppLanguage = setAppLanguage;
        window.$vr.trackingResultToClass = trackingResultToClass;
        window.$vr.updateFeedLength = updateFeedLength;
        window.$vr.updateStatsLoop = updateStatsLoop;
        window.$vr.updateVrElectronLoop = updateVrElectronLoop;
        window.$vr.cleanHudFeedLoop = cleanHudFeedLoop;
        window.$vr.cleanHudFeed = cleanHudFeed;

        window.$vr.vrState = vrState;

        if (LINUX) {
            updateVrElectronLoop();
        }
        refreshCustomScript();
        updateStatsLoop();
        setDatetimeFormat();

        nextTick(() => {
            AppApiVr.VrInit();
        });
    });

    onBeforeUnmount(() => {
        isUnmounted = true;

        if (updateStatsLoopTimeoutId !== null) {
            workerTimers.clearTimeout(updateStatsLoopTimeoutId);
            updateStatsLoopTimeoutId = null;
        }
        if (updateVrElectronLoopTimeoutId !== null) {
            workerTimers.clearTimeout(updateVrElectronLoopTimeoutId);
            updateVrElectronLoopTimeoutId = null;
        }
        if (cleanHudFeedLoopTimeoutId !== null) {
            workerTimers.clearTimeout(cleanHudFeedLoopTimeoutId);
            cleanHudFeedLoopTimeoutId = null;
        }

        try {
            Noty.closeAll();
        } catch (err) {
            console.error('Error closing Noty notifications:', err);
        }

        if (typeof window.$vr === 'object' && window.$vr) {
            for (const key of Object.keys(window.$vr)) {
                delete window.$vr[key];
            }
        }
        try {
            delete window.$vr;
        } catch {
            window.$vr = undefined;
        }
    });

    /**
     * VR overlay config payload (passed as JSON string).
     * @typedef {Object} VrConfigVarsPayload
     * @property {boolean} overlayNotifications
     * @property {boolean} hideDevicesFromFeed
     * @property {boolean} vrOverlayCpuUsage
     * @property {boolean} minimalFeed
     * @property {string} notificationPosition
     * @property {number} notificationTimeout
     * @property {number} photonOverlayMessageTimeout
     * @property {string} notificationTheme
     * @property {boolean} backgroundEnabled
     * @property {boolean} dtHour12
     * @property {boolean} pcUptimeOnFeed
     * @property {string} appLanguage
     * @property {number} notificationOpacity
     * @property {boolean} isWristDisabled
     */

    /**
     * @param {string} json
     * @returns {void}
     */
    function configUpdate(json) {
        vrState.config = JSON.parse(json);
        if (vrState.config.isWristDisabled) {
            vrState.isWristDisabled = true;
        }
        if (!vrState.config.overlayNotifications) {
            vrState.isHmdDisabled = false;
        }
        vrState.hudFeed = [];
        vrState.hudTimeout = [];
        setDatetimeFormat();
        setAppLanguage(vrState.config.appLanguage);
        updateFeedLength();
        if (
            vrState.config.vrOverlayCpuUsage !== vrState.cpuUsageEnabled ||
            vrState.config.pcUptimeOnFeed !== vrState.pcUptimeEnabled
        ) {
            vrState.cpuUsageEnabled = vrState.config.vrOverlayCpuUsage;
            vrState.pcUptimeEnabled = vrState.config.pcUptimeOnFeed;
            AppApiVr.ToggleSystemMonitor(vrState.cpuUsageEnabled || vrState.pcUptimeEnabled);
        }
        if (vrState.config.notificationOpacity !== vrState.notificationOpacity) {
            vrState.notificationOpacity = vrState.config.notificationOpacity;
            setNotyOpacity(vrState.notificationOpacity);
        }
    }

    function updateOnlineFriendCount(count) {
        vrState.onlineFriendCount = parseInt(count, 10);
    }

    function nowPlayingUpdate(json) {
        vrState.nowPlaying = JSON.parse(json);
        const circle = /** @type {SVGCircleElement} */ (document.querySelector('.np-progress-circle-stroke'));

        if (vrState.lastLocation.progressPie && vrState.nowPlaying.percentage !== 0) {
            circle.style.opacity = (0.5).toString();
            const circumference = circle.getTotalLength();
            circle.style.strokeDashoffset = (
                circumference -
                (vrState.nowPlaying.percentage / 100) * circumference
            ).toString();
        } else {
            circle.style.opacity = '0';
        }
        updateFeedLength();
    }

    function lastLocationUpdate(json) {
        vrState.lastLocation = JSON.parse(json);
    }

    function wristFeedUpdate(json) {
        vrState.wristFeed = JSON.parse(json);
        updateFeedLength();
    }

    function updateFeedLength() {
        if (vrState.wristFeed.length === 0) {
            return;
        }
        let length = 16;
        if (!vrState.config.hideDevicesFromFeed) {
            length -= 2;
            if (vrState.deviceCount > 8) {
                length -= 1;
            }
        }
        if (vrState.nowPlaying.playing) {
            length -= 1;
        }
        if (length < vrState.wristFeed.length) {
            vrState.wristFeed.length = length;
        }
    }

    async function refreshCustomScript() {
        if (document.contains(document.getElementById('vr-custom-script'))) {
            document.getElementById('vr-custom-script').remove();
        }
        const customScript = await AppApiVr.CustomVrScript();
        if (customScript) {
            const head = document.head;
            const $vrCustomScript = document.createElement('script');
            $vrCustomScript.setAttribute('id', 'vr-custom-script');
            $vrCustomScript.type = 'text/javascript';
            $vrCustomScript.textContent = customScript;
            head.appendChild($vrCustomScript);
        }
    }

    function setNotyOpacity(value) {
        const opacity = (value / 100).toFixed(2);
        let element = document.getElementById('noty-opacity');
        if (!element) {
            document.body.insertAdjacentHTML(
                'beforeend',
                `<style id="noty-opacity">.noty_layout { opacity: ${opacity}; }</style>`
            );
            element = document.getElementById('noty-opacity');
        }
        element.innerHTML = `.noty_layout { opacity: ${opacity}; }`;
    }

    async function updateStatsLoop() {
        try {
            vrState.currentTime = new Date()
                .toLocaleDateString(vrState.currentCulture, {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hourCycle: vrState.config.dtHour12 ? 'h12' : 'h23'
                })
                .replace(' AM', ' am')
                .replace(' PM', ' pm')
                .replace(',', '');

            if (vrState.cpuUsageEnabled) {
                const cpuUsage = await AppApiVr.CpuUsage();
                vrState.cpuUsage = cpuUsage.toFixed(0);
            }
            if (vrState.lastLocation.date) {
                vrState.lastLocationTimer = timeToText(Date.now() - vrState.lastLocation.date);
            } else {
                vrState.lastLocationTimer = '';
            }
            if (vrState.lastLocation.onlineFor) {
                vrState.onlineForTimer = timeToText(Date.now() - vrState.lastLocation.onlineFor);
            } else {
                vrState.onlineForTimer = '';
            }

            if (!vrState.config.hideDevicesFromFeed) {
                AppApiVr.GetVRDevices().then((devices) => {
                    let deviceList = [];
                    let baseStations = 0;
                    devices.forEach((device) => {
                        device[3] = parseInt(device[3], 10).toString();
                        if (device[0] === 'base' && device[1] === 'connected') {
                            baseStations++;
                        } else {
                            deviceList.push(device);
                        }
                    });
                    vrState.deviceCount = deviceList.length;
                    const deviceValue = (dev) => {
                        if (dev[0] === 'headset') return 0;
                        if (dev[0] === 'leftController') return 1;
                        if (dev[0] === 'rightController') return 2;
                        if (dev[0].toLowerCase().includes('controller')) return 3;
                        if (dev[0] === 'tracker' || dev[0] === 'base') return 4;
                        return 5;
                    };
                    deviceList.sort((a, b) => deviceValue(a) - deviceValue(b));
                    deviceList.sort((a, b) => {
                        if (a[1] === b[1]) {
                            return 0;
                        }
                        if (a[1] === 'connected') {
                            return -1;
                        }
                        if (a[1] === 'disconnected') {
                            return 1;
                        }
                        return 0;
                    });
                    if (baseStations > 0) {
                        deviceList.push(['base', 'connected', '', baseStations]);
                        vrState.deviceCount += 1;
                    }
                    vrState.devices = deviceList;
                });
            } else {
                vrState.devices = [];
            }
            if (vrState.config.pcUptimeOnFeed) {
                AppApiVr.GetUptime().then((uptime) => {
                    if (uptime) {
                        vrState.pcUptime = timeToText(uptime);
                    }
                });
            } else {
                vrState.pcUptime = '';
            }
        } catch (err) {
            console.error(err);
        }
        if (isUnmounted) {
            return;
        }
        updateStatsLoopTimeoutId = workerTimers.setTimeout(() => updateStatsLoop(), 500);
    }

    async function updateVrElectronLoop() {
        try {
            const overlayQueue = await AppApiVr.GetExecuteVrOverlayFunctionQueue();
            if (overlayQueue) {
                overlayQueue.forEach((item) => {
                    // item[0] is the function name, item[1] is already an object
                    const fullFunctionName = item[0];
                    const jsonArg = item[1];

                    if (typeof window.$vr === 'object' && typeof window.$vr[fullFunctionName] === 'function') {
                        window.$vr[fullFunctionName](jsonArg);
                    } else {
                        console.error(`$vr.${fullFunctionName} is not defined or is not a function`);
                    }
                });
            }
        } catch (err) {
            console.error(err);
        }
        if (isUnmounted) {
            return;
        }
        updateVrElectronLoopTimeoutId = workerTimers.setTimeout(() => updateVrElectronLoop(), 500);
    }

    function playNoty(json) {
        let { noty, message, image } = JSON.parse(json);
        if (typeof noty === 'undefined') {
            console.error('noty is undefined');
            return;
        }
        noty = escapeTagRecursive(noty);
        message = escapeTag(message) || '';
        let text = '';
        let img = '';
        if (image) {
            img = `<img class="noty-img" src="${image}"></img>`;
        }
        switch (noty.type) {
            case 'OnPlayerJoined':
                text = `<strong>${noty.displayName}</strong> has joined`;
                break;
            case 'OnPlayerLeft':
                text = `<strong>${noty.displayName}</strong> has left`;
                break;
            case 'OnPlayerJoining':
                text = `<strong>${noty.displayName}</strong> is joining`;
                break;
            case 'GPS':
                text = `<strong>${noty.displayName}</strong> is in ${displayLocation(
                    noty.location,
                    noty.worldName,
                    noty.groupName
                )}`;
                break;
            case 'Online':
                let locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${displayLocation(noty.location, noty.worldName, noty.groupName)}`;
                }
                text = `<strong>${noty.displayName}</strong> has logged in${locationName}`;
                break;
            case 'Offline':
                text = `<strong>${noty.displayName}</strong> has logged out`;
                break;
            case 'Status':
                text = `<strong>${noty.displayName}</strong> status is now <i>${noty.status}</i> ${noty.statusDescription}`;
                break;
            case 'invite':
                text = `<strong>${noty.senderUsername}</strong> has invited you to ${displayLocation(
                    noty.details.worldId,
                    noty.details.worldName,
                    ''
                )}${message}`;
                break;
            case 'requestInvite':
                text = `<strong>${noty.senderUsername}</strong> has requested an invite ${message}`;
                break;
            case 'inviteResponse':
                text = `<strong>${noty.senderUsername}</strong> has responded to your invite ${message}`;
                break;
            case 'requestInviteResponse':
                text = `<strong>${noty.senderUsername}</strong> has responded to your invite request ${message}`;
                break;
            case 'friendRequest':
                text = `<strong>${noty.senderUsername}</strong> has sent you a friend request`;
                break;
            case 'Friend':
                text = `<strong>${noty.displayName}</strong> is now your friend`;
                break;
            case 'Unfriend':
                text = `<strong>${noty.displayName}</strong> is no longer your friend`;
                break;
            case 'TrustLevel':
                text = `<strong>${noty.displayName}</strong> trust level is now ${noty.trustLevel}`;
                break;
            case 'DisplayName':
                text = `<strong>${noty.previousDisplayName}</strong> changed their name to ${noty.displayName}`;
                break;
            case 'boop':
                text = noty.message;
                break;
            case 'groupChange':
                text = `<strong>${noty.senderUsername}</strong> ${noty.message}`;
                break;
            case 'group.announcement':
                text = noty.message;
                break;
            case 'group.informative':
                text = noty.message;
                break;
            case 'group.invite':
                text = noty.message;
                break;
            case 'group.joinRequest':
                text = noty.message;
                break;
            case 'group.transfer':
                text = noty.message;
                break;
            case 'group.queueReady':
                text = noty.message;
                break;
            case 'instance.closed':
                text = noty.message;
                break;
            case 'PortalSpawn':
                if (noty.displayName) {
                    text = `<strong>${noty.displayName}</strong> has spawned a portal to ${displayLocation(
                        noty.instanceId,
                        noty.worldName,
                        noty.groupName
                    )}`;
                } else {
                    text = 'User has spawned a portal';
                }
                break;
            case 'AvatarChange':
                text = `<strong>${noty.displayName}</strong> changed into avatar ${noty.name}`;
                break;
            case 'ChatBoxMessage':
                text = `<strong>${noty.displayName}</strong> said ${noty.text}`;
                break;
            case 'Event':
                text = noty.data;
                break;
            case 'External':
                text = noty.message;
                break;
            case 'VideoPlay':
                text = `<strong>Now playing:</strong> ${noty.notyName}`;
                break;
            case 'BlockedOnPlayerJoined':
                text = `Blocked user <strong>${noty.displayName}</strong> has joined`;
                break;
            case 'BlockedOnPlayerLeft':
                text = `Blocked user <strong>${noty.displayName}</strong> has left`;
                break;
            case 'MutedOnPlayerJoined':
                text = `Muted user <strong>${noty.displayName}</strong> has joined`;
                break;
            case 'MutedOnPlayerLeft':
                text = `Muted user <strong>${noty.displayName}</strong> has left`;
                break;
            case 'Blocked':
                text = `<strong>${noty.displayName}</strong> has blocked you`;
                break;
            case 'Unblocked':
                text = `<strong>${noty.displayName}</strong> has unblocked you`;
                break;
            case 'Muted':
                text = `<strong>${noty.displayName}</strong> has muted you`;
                break;
            case 'Unmuted':
                text = `<strong>${noty.displayName}</strong> has unmuted you`;
                break;
            default:
                break;
        }
        if (text) {
            new Noty({
                type: 'alert',
                theme: vrState.config.notificationTheme,
                timeout: vrState.config.notificationTimeout,
                layout: vrState.config.notificationPosition,
                text: `${img}<div class="noty-text">${text}</div>`
            }).show();
        }
    }

    function statusClass(status) {
        let style = {};
        if (typeof status === 'undefined') {
            return style;
        }
        if (status === 'active') {
            // Online
            style.online = true;
        } else if (status === 'join me') {
            // Join Me
            style.joinme = true;
        } else if (status === 'ask me') {
            // Ask Me
            style.askme = true;
        } else if (status === 'busy') {
            // Do Not Disturb
            style.busy = true;
        }
        return style;
    }

    function notyClear() {
        Noty.closeAll();
    }

    function cleanHudFeedLoop() {
        if (!vrState.cleanHudFeedLoopStatus) {
            return;
        }
        cleanHudFeed();
        if (vrState.hudFeed.length === 0) {
            vrState.cleanHudFeedLoopStatus = false;
            return;
        }
        if (isUnmounted) {
            return;
        }
        cleanHudFeedLoopTimeoutId = workerTimers.setTimeout(() => cleanHudFeedLoop(), 500);
    }

    function cleanHudFeed() {
        const dt = Date.now();
        vrState.hudFeed.forEach((item) => {
            if (item.time + vrState.config.photonOverlayMessageTimeout < dt) {
                removeFromArray(vrState.hudFeed, item);
            }
        });
        if (vrState.hudFeed.length > 10) {
            vrState.hudFeed.length = 10;
        }
        if (!vrState.cleanHudFeedLoopStatus) {
            vrState.cleanHudFeedLoopStatus = true;
            cleanHudFeedLoop();
        }
    }

    function addEntryHudFeed(json) {
        const data = JSON.parse(json);
        let combo = 1;
        vrState.hudFeed.forEach((item) => {
            if (item.displayName === data.displayName && item.text === data.text) {
                combo = item.combo + 1;
                removeFromArray(vrState.hudFeed, item);
            }
        });
        vrState.hudFeed.unshift({
            time: Date.now(),
            combo,
            ...data
        });
        cleanHudFeed();
    }

    function updateHudFeedTag(json) {
        const ref = JSON.parse(json);
        vrState.hudFeed.forEach((item) => {
            if (item.userId === ref.userId) {
                item.colour = ref.colour;
            }
        });
    }

    function updateHudTimeout(json) {
        vrState.hudTimeout = JSON.parse(json);
    }

    async function setDatetimeFormat() {
        vrState.currentCulture = await AppApiVr.CurrentCulture();
    }

    const formatDate = (date) => {
        if (!date) {
            return '';
        }
        const dt = new Date(date);
        return dt
            .toLocaleTimeString(vrState.currentCulture, {
                hour: '2-digit',
                minute: 'numeric',
                hourCycle: vrState.config.dtHour12 ? 'h12' : 'h23'
            })
            .replace(' am', '')
            .replace(' pm', '');
    };

    async function setAppLanguage(appLanguage) {
        if (!appLanguage) {
            return;
        }
        vrState.appLanguage = appLanguage;

        await loadLocalizedStrings(appLanguage);
        changeHtmlLangAttribute(vrState.appLanguage);
        locale.value = vrState.appLanguage;
    }

    function trackingResultToClass(deviceStatus) {
        switch (deviceStatus) {
            case 'Uninitialized':
            case 'Calibrating_OutOfRange':
            case 'Fallback_RotationOnly':
                return 'tracker-error';

            case 'Calibrating_InProgress':
            case 'Running_OutOfRange':
                return 'tracker-warning';

            case 'Running_OK':
            default:
                return '';
        }
    }

    const {
        config,
        wristFeed,
        devices,
        nowPlaying,
        lastLocation,
        lastLocationTimer,
        onlineForTimer,
        pcUptime,
        currentTime,
        cpuUsageEnabled,
        cpuUsage,
        onlineFriendCount,
        customInfo,
        hudFeed,
        hudTimeout
    } = toRefs(vrState);
</script>

<style scoped>
    .ml-5 {
        margin-left: 5px;
    }

    .mr-5 {
        margin-right: 5px;
    }
</style>
