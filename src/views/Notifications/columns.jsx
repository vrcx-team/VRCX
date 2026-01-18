import Location from '../../components/Location.vue';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '../../components/ui/tooltip';
import {
    ArrowUpDown,
    Ban,
    BellOff,
    Check,
    Link,
    MessageCircle,
    Reply,
    Tag,
    Trash2,
    X
} from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { checkCanInvite, formatDateFilter } from '../../shared/utils';
import { i18n } from '../../plugin';
import {
    useGameStore,
    useGroupStore,
    useLocationStore,
    useUiStore,
    useUserStore,
    useWorldStore
} from '../../stores';

import Emoji from '../../components/Emoji.vue';

const { t } = i18n.global;

const isGroupId = (id) => typeof id === 'string' && id.startsWith('grp_');

export const createColumns = ({
    getNotificationCreatedAt,
    getNotificationCreatedAtTs,
    openNotificationLink,
    showFullscreenImageDialog,
    getSmallThumbnailUrl,
    acceptFriendRequestNotification,
    showSendInviteResponseDialog,
    showSendInviteRequestResponseDialog,
    acceptRequestInvite,
    sendNotificationResponse,
    hideNotification,
    hideNotificationPrompt,
    deleteNotificationLog,
    deleteNotificationLogPrompt
}) => {
    const { showUserDialog, showSendBoopDialog } = useUserStore();
    const { showWorldDialog } = useWorldStore();
    const { showGroupDialog } = useGroupStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());
    const { lastLocation } = storeToRefs(useLocationStore());
    const { isGameRunning } = storeToRefs(useGameStore());

    const canInvite = () => {
        const location = lastLocation.value?.location;
        return (
            Boolean(location) && isGameRunning.value && checkCanInvite(location)
        );
    };

    const getResponseIcon = (response, notificationType) => {
        if (response?.type === 'link') {
            return Link;
        }
        switch (response?.icon) {
            case 'check':
                return Check;
            case 'cancel':
                return X;
            case 'ban':
                return Ban;
            case 'bell-slash':
                return BellOff;
            case 'reply':
                return notificationType === 'boop' ? MessageCircle : Reply;
            default:
                return Tag;
        }
    };

    return [
        {
            accessorFn: (row) => getNotificationCreatedAtTs(row),
            id: 'created_at',
            size: 120,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('table.notification.date')}
                    <ArrowUpDown class="ml-1 h-4 w-4" />
                </Button>
            ),
            sortingFn: (rowA, rowB, columnId) => {
                const a = rowA.getValue(columnId) ?? 0;
                const b = rowB.getValue(columnId) ?? 0;
                if (a !== b) {
                    return a - b;
                }

                const aId =
                    typeof rowA.original?.id === 'string'
                        ? rowA.original.id
                        : '';
                const bId =
                    typeof rowB.original?.id === 'string'
                        ? rowB.original.id
                        : '';
                return aId.localeCompare(bId);
            },
            cell: ({ row }) => {
                const createdAt = getNotificationCreatedAt(row.original);
                const shortText = formatDateFilter(createdAt, 'short');
                const longText = formatDateFilter(createdAt, 'long');

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>{shortText}</span>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <span>{longText}</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        },
        {
            accessorKey: 'type',
            size: 180,
            header: () => t('table.notification.type'),
            cell: ({ row }) => {
                const original = row.original;
                const label = t(`view.notification.filters.${original.type}`);

                if (original.type === 'invite') {
                    return (
                        <Badge variant="outline" class="text-muted-foreground">
                            {label}
                        </Badge>
                    );
                }

                if (
                    original.type === 'group.queueReady' ||
                    original.type === 'instance.closed'
                ) {
                    return (
                        <Badge variant="outline" class="text-muted-foreground">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            class="x-link"
                                            onClick={() =>
                                                showWorldDialog(
                                                    original.location
                                                )
                                            }
                                        >
                                            {label}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {original.location ? (
                                            <Location
                                                location={original.location}
                                                hint={original.worldName}
                                                grouphint={original.groupName}
                                                link={false}
                                            />
                                        ) : null}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Badge>
                    );
                }

                if (original.link) {
                    return (
                        <Badge variant="outline" class="text-muted-foreground">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span
                                            class="x-link"
                                            onClick={() =>
                                                openNotificationLink(
                                                    original.link
                                                )
                                            }
                                        >
                                            {label}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <span>{original.linkText}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Badge>
                    );
                }

                return (
                    <Badge variant="outline" class="text-muted-foreground">
                        {label}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'senderUsername',
            meta: {
                class: 'overflow-hidden'
            },
            size: 150,
            header: () => t('table.notification.user'),
            cell: ({ row }) => {
                const original = row.original;
                if (
                    original.senderUserId &&
                    !isGroupId(original.senderUserId)
                ) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            <span
                                class="x-link block w-full min-w-0 truncate"
                                onClick={() =>
                                    showUserDialog(original.senderUserId)
                                }
                            >
                                {original.senderUsername}
                            </span>
                        </span>
                    );
                }

                if (original.link?.startsWith('user:')) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            <span
                                class="x-link block w-full min-w-0 truncate"
                                onClick={() =>
                                    openNotificationLink(original.link)
                                }
                            >
                                {original.linkText || original.senderUsername}
                            </span>
                        </span>
                    );
                }

                if (
                    original.senderUsername &&
                    !isGroupId(original.senderUserId)
                ) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            {original.senderUsername}
                        </span>
                    );
                }

                return null;
            }
        },
        {
            accessorKey: 'groupName',
            meta: {
                class: 'overflow-hidden'
            },
            size: 150,
            header: () => t('table.notification.group'),
            cell: ({ row }) => {
                const original = row.original;
                const label =
                    original.senderUsername ||
                    original.groupName ||
                    original.data?.groupName ||
                    original.details?.groupName ||
                    original.linkText;

                if (
                    original.senderUserId &&
                    (original.type === 'groupChange' ||
                        isGroupId(original.senderUserId))
                ) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            <span
                                class="x-link block w-full min-w-0 truncate"
                                onClick={() =>
                                    showGroupDialog(original.senderUserId)
                                }
                            >
                                {label}
                            </span>
                        </span>
                    );
                }

                if (
                    original.type === 'groupChange' &&
                    original.senderUsername
                ) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            {original.senderUsername}
                        </span>
                    );
                }

                if (original.link?.startsWith('group:')) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            <span
                                class="x-link block w-full min-w-0 truncate"
                                onClick={() =>
                                    openNotificationLink(original.link)
                                }
                            >
                                {original.data?.groupName || label}
                            </span>
                        </span>
                    );
                }

                if (original.link?.startsWith('event:')) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            <span
                                class="x-link block w-full min-w-0 truncate"
                                onClick={() =>
                                    openNotificationLink(original.link)
                                }
                            >
                                {original.data?.groupName ||
                                    original.groupName ||
                                    label}
                            </span>
                        </span>
                    );
                }

                if (original.data?.groupName) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            {original.data.groupName}
                        </span>
                    );
                }

                if (original.details?.groupName) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            {original.details.groupName}
                        </span>
                    );
                }

                if (original.groupName) {
                    return (
                        <span class="table-user-text block w-full min-w-0 truncate">
                            {original.groupName}
                        </span>
                    );
                }

                return null;
            }
        },
        {
            accessorKey: 'photo',
            size: 80,
            header: () => t('table.notification.photo'),
            cell: ({ row }) => {
                const original = row.original;
                if (original.type === 'boop') {
                    const imageUrl = original.details?.imageUrl;
                    if (!imageUrl || imageUrl.startsWith('default_')) {
                        return null;
                    }
                    return (
                        <Emoji
                            class="x-link h-7.5 w-7.5 rounded object-cover"
                            onClick={() => showFullscreenImageDialog(imageUrl)}
                            imageUrl={imageUrl}
                            size={30}
                        />
                    );
                }

                if (original.details?.imageUrl) {
                    return (
                        <img
                            class="x-link h-7.5 w-7.5 rounded object-cover"
                            src={getSmallThumbnailUrl(
                                original.details.imageUrl
                            )}
                            onClick={() =>
                                showFullscreenImageDialog(
                                    original.details.imageUrl
                                )
                            }
                            loading="lazy"
                        />
                    );
                }

                if (original.imageUrl) {
                    return (
                        <img
                            class="x-link h-7.5 w-7.5 rounded object-cover"
                            src={getSmallThumbnailUrl(original.imageUrl)}
                            onClick={() =>
                                showFullscreenImageDialog(original.imageUrl)
                            }
                            loading="lazy"
                        />
                    );
                }

                return null;
            }
        },
        {
            id: 'message',
            header: () => t('table.notification.message'),
            enableSorting: false,
            meta: {
                class: 'min-w-0 overflow-hidden',
                stretch: true
            },
            minSize: 100,
            cell: ({ row }) => {
                const original = row.original;
                return (
                    <div class="w-full min-w-0">
                        {original.type === 'invite' && original.details ? (
                            <div class="w-full min-w-0">
                                <Location
                                    location={original.details.worldId}
                                    hint={original.details.worldName}
                                    grouphint={original.details.groupName}
                                    link
                                />
                            </div>
                        ) : null}
                        {original.message &&
                        original.message !==
                            `This is a generated invite to ${original.details?.worldName}` ? (
                            <span class="block w-full min-w-0 truncate">
                                {original.message}
                            </span>
                        ) : null}
                        {!original.message &&
                        original.details?.inviteMessage ? (
                            <span class="block w-full min-w-0 truncate">
                                {original.details.inviteMessage}
                            </span>
                        ) : null}
                        {!original.message &&
                        original.details?.requestMessage ? (
                            <span class="block w-full min-w-0 truncate">
                                {original.details.requestMessage}
                            </span>
                        ) : null}
                        {!original.message &&
                        original.details?.responseMessage ? (
                            <span class="block w-full min-w-0 truncate">
                                {original.details.responseMessage}
                            </span>
                        ) : null}
                    </div>
                );
            }
        },
        {
            id: 'action',
            meta: {
                class: 'text-right'
            },
            size: 120,
            minSize: 120,
            maxSize: 120,
            header: () => t('table.notification.action'),
            enableSorting: false,
            cell: ({ row }) => {
                const original = row.original;
                const hasResponses = Array.isArray(original.responses);
                const showDecline =
                    original.type !== 'requestInviteResponse' &&
                    original.type !== 'inviteResponse' &&
                    original.type !== 'message' &&
                    original.type !== 'boop' &&
                    original.type !== 'groupChange' &&
                    !original.type?.includes('group.') &&
                    !original.type?.includes('moderation.') &&
                    !original.type?.includes('instance.');
                const showDeleteLog =
                    original.type !== 'friendRequest' &&
                    original.type !== 'ignoredFriendRequest' &&
                    !original.type?.includes('group.') &&
                    !original.type?.includes('moderation.');

                return (
                    <div class="flex items-center justify-end gap-2">
                        {original.senderUserId !== currentUser.value?.id &&
                        !original.$isExpired ? (
                            <span class="inline-flex items-center gap-2">
                                {original.type === 'friendRequest' ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        acceptFriendRequestNotification(
                                                            original
                                                        )
                                                    }
                                                >
                                                    <Check class="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <span>Accept</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}

                                {original.type === 'invite' ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        showSendInviteResponseDialog(
                                                            original
                                                        )
                                                    }
                                                >
                                                    <MessageCircle class="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <span>
                                                    Decline with message
                                                </span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}

                                {original.type === 'requestInvite' ? (
                                    <span class="inline-flex items-center">
                                        {canInvite() ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                            onClick={() =>
                                                                acceptRequestInvite(
                                                                    original
                                                                )
                                                            }
                                                        >
                                                            <Check class="h-4 w-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <span>Invite</span>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : null}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                        onClick={() =>
                                                            showSendInviteRequestResponseDialog(
                                                                original
                                                            )
                                                        }
                                                    >
                                                        <MessageCircle class="h-4 w-4" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <span>
                                                        Decline with message
                                                    </span>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </span>
                                ) : null}

                                {hasResponses
                                    ? original.responses.map((response) => {
                                          const onClick = () => {
                                              if (response.type === 'link') {
                                                  openNotificationLink(
                                                      response.data
                                                  );
                                                  return;
                                              }
                                              if (
                                                  response.icon === 'reply' &&
                                                  original.type === 'boop'
                                              ) {
                                                  showSendBoopDialog(
                                                      original.senderUserId
                                                  );
                                                  return;
                                              }
                                              sendNotificationResponse(
                                                  original.id,
                                                  original.responses,
                                                  response.type
                                              );
                                          };

                                          const ResponseIcon = getResponseIcon(
                                              response,
                                              original.type
                                          );

                                          return (
                                              <TooltipProvider
                                                  key={`${response.text}:${response.type}`}
                                              >
                                                  <Tooltip>
                                                      <TooltipTrigger asChild>
                                                          <button
                                                              type="button"
                                                              class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                              onClick={onClick}
                                                          >
                                                              <ResponseIcon class="h-4 w-4" />
                                                          </button>
                                                      </TooltipTrigger>
                                                      <TooltipContent side="top">
                                                          <span>
                                                              {response.text}
                                                          </span>
                                                      </TooltipContent>
                                                  </Tooltip>
                                              </TooltipProvider>
                                          );
                                      })
                                    : null}

                                {showDecline ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        shiftHeld.value
                                                            ? hideNotification(
                                                                  original
                                                              )
                                                            : hideNotificationPrompt(
                                                                  original
                                                              )
                                                    }
                                                >
                                                    <X
                                                        class={
                                                            shiftHeld.value
                                                                ? 'h-4 w-4 text-red-600'
                                                                : 'h-4 w-4'
                                                        }
                                                    />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <span>Decline</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}

                                {original.type === 'group.queueReady' ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        shiftHeld.value
                                                            ? deleteNotificationLog(
                                                                  original
                                                              )
                                                            : deleteNotificationLogPrompt(
                                                                  original
                                                              )
                                                    }
                                                >
                                                    {shiftHeld.value ? (
                                                        <X class="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <Trash2 class="h-4 w-4" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <span>Delete log</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}

                                {showDeleteLog ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    class="inline-flex h-6 ml-1 items-center justify-center text-muted-foreground hover:text-foreground"
                                                    onClick={() =>
                                                        shiftHeld.value
                                                            ? deleteNotificationLog(
                                                                  original
                                                              )
                                                            : deleteNotificationLogPrompt(
                                                                  original
                                                              )
                                                    }
                                                >
                                                    {shiftHeld.value ? (
                                                        <X class="h-4 w-4 text-red-600" />
                                                    ) : (
                                                        <Trash2 class="h-4 w-4" />
                                                    )}
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <span>Delete log</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : null}
                            </span>
                        ) : null}
                    </div>
                );
            }
        },
        {
            id: 'trailing',
            header: () => null,
            enableSorting: false,
            enableResizing: false,
            size: 5,
            cell: () => null
        }
    ];
};
