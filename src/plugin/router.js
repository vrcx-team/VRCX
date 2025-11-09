import { createRouter, createWebHashHistory } from 'vue-router';

import Charts from './../views/Charts/Charts.vue';
import FavoritesAvatar from './../views/Favorites/FavoritesAvatar.vue';
import FavoritesFriend from './../views/Favorites/FavoritesFriend.vue';
import FavoritesWorld from './../views/Favorites/FavoritesWorld.vue';
import Feed from './../views/Feed/Feed.vue';
import FriendList from './../views/FriendList/FriendList.vue';
import FriendLocation from './../views/FriendLocation/FriendLocation.vue';
import FriendLog from './../views/FriendLog/FriendLog.vue';
import GameLog from './../views/GameLog/GameLog.vue';
import Moderation from './../views/Moderation/Moderation.vue';
import Notification from './../views/Notifications/Notification.vue';
import PlayerList from './../views/PlayerList/PlayerList.vue';
import Search from './../views/Search/Search.vue';
import Settings from './../views/Settings/Settings.vue';
import Tools from './../views/Tools/Tools.vue';

const routes = [
    { path: '/feed', name: 'feed', component: Feed },
    {
        path: '/friend-location',
        name: 'friend-location',
        component: FriendLocation
    },
    { path: '/game-log', name: 'game-log', component: GameLog },
    { path: '/player-list', name: 'player-list', component: PlayerList },
    { path: '/search', name: 'search', component: Search },
    {
        path: '/favorites/friends',
        name: 'favorite-friends',
        component: FavoritesFriend
    },
    {
        path: '/favorites/worlds',
        name: 'favorite-worlds',
        component: FavoritesWorld
    },
    {
        path: '/favorites/avatars',
        name: 'favorite-avatars',
        component: FavoritesAvatar
    },
    { path: '/social/friend-log', name: 'friend-log', component: FriendLog },
    { path: '/social/moderation', name: 'moderation', component: Moderation },
    { path: '/notification', name: 'notification', component: Notification },
    {
        path: '/social/friend-list',
        name: 'friend-list',
        component: FriendList
    },
    {
        path: '/charts',
        name: 'charts',
        component: Charts
    },
    { path: '/tools', name: 'tools', component: Tools },
    { path: '/settings', name: 'settings', component: Settings }
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export function initRouter(app) {
    app.use(router);
}

router.beforeEach((to, from) => {
    if (to.path == '/') {
        router.push({ name: 'feed' });
        return false;
    }
    if (to.path === '/social') {
        return false;
    }
    return true;
});
