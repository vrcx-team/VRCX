import { defineAsyncComponent } from 'vue';

import Feed from '../../Feed/Feed.vue';
import FavoritesAvatar from '../../Favorites/FavoritesAvatar.vue';
import FavoritesFriend from '../../Favorites/FavoritesFriend.vue';
import FavoritesWorld from '../../Favorites/FavoritesWorld.vue';
import FriendList from '../../FriendList/FriendList.vue';
import FriendLog from '../../FriendLog/FriendLog.vue';
import FriendsLocations from '../../FriendsLocations/FriendsLocations.vue';
import GameLog from '../../GameLog/GameLog.vue';
import Moderation from '../../Moderation/Moderation.vue';
import MyAvatars from '../../MyAvatars/MyAvatars.vue';
import Notification from '../../Notifications/Notification.vue';
import PlayerList from '../../PlayerList/PlayerList.vue';
import Search from '../../Search/Search.vue';
import Tools from '../../Tools/Tools.vue';

export const panelComponentMap = {
    feed: Feed,
    'friends-locations': FriendsLocations,
    'game-log': GameLog,
    'player-list': PlayerList,
    search: Search,
    'favorite-friends': FavoritesFriend,
    'favorite-worlds': FavoritesWorld,
    'favorite-avatars': FavoritesAvatar,
    'friend-log': FriendLog,
    'friend-list': FriendList,
    moderation: Moderation,
    notification: Notification,
    'my-avatars': MyAvatars,
    'charts-instance': defineAsyncComponent(
        () => import('../../Charts/components/InstanceActivity.vue')
    ),
    'charts-mutual': defineAsyncComponent(
        () => import('../../Charts/components/MutualFriends.vue')
    ),
    tools: Tools,
    'widget:feed': defineAsyncComponent(
        () => import('../widgets/FeedWidget.vue')
    ),
    'widget:game-log': defineAsyncComponent(
        () => import('../widgets/GameLogWidget.vue')
    ),
    'widget:instance': defineAsyncComponent(
        () => import('../widgets/InstanceWidget.vue')
    )
};
