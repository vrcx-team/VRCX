import { createRouter, createWebHashHistory } from 'vue-router';

import { watchState } from './../service/watchState';

import FavoritesAvatar from './../views/Favorites/FavoritesAvatar.vue';
import FavoritesFriend from './../views/Favorites/FavoritesFriend.vue';
import FavoritesWorld from './../views/Favorites/FavoritesWorld.vue';
import Feed from './../views/Feed/Feed.vue';
import FriendList from './../views/FriendList/FriendList.vue';
import FriendLog from './../views/FriendLog/FriendLog.vue';
import FriendsLocations from './../views/FriendsLocations/FriendsLocations.vue';
import Gallery from './../views/Tools/Gallery.vue';
import GameLog from './../views/GameLog/GameLog.vue';
import Login from './../views/Login/Login.vue';
import MainLayout from '../views/Layout/MainLayout.vue';
import Moderation from './../views/Moderation/Moderation.vue';
import Notification from './../views/Notifications/Notification.vue';
import PlayerList from './../views/PlayerList/PlayerList.vue';
import ScreenshotMetadata from './../views/Tools/ScreenshotMetadata.vue';
import Search from './../views/Search/Search.vue';
import Settings from './../views/Settings/Settings.vue';
import Tools from './../views/Tools/Tools.vue';

const routes = [
    {
        path: '/login',
        name: 'login',
        component: Login,
        meta: { public: true }
    },
    {
        path: '/',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: { name: 'feed' } },
            { path: 'feed', name: 'feed', component: Feed },
            {
                path: 'friends-locations',
                name: 'friends-locations',
                component: FriendsLocations
            },
            { path: 'game-log', name: 'game-log', component: GameLog },
            { path: 'player-list', name: 'player-list', component: PlayerList },
            { path: 'search', name: 'search', component: Search },
            {
                path: 'favorites/friends',
                name: 'favorite-friends',
                component: FavoritesFriend
            },
            {
                path: 'favorites/worlds',
                name: 'favorite-worlds',
                component: FavoritesWorld
            },
            {
                path: 'favorites/avatars',
                name: 'favorite-avatars',
                component: FavoritesAvatar
            },
            {
                path: 'social/friend-log',
                name: 'friend-log',
                component: FriendLog
            },
            {
                path: 'social/moderation',
                name: 'moderation',
                component: Moderation
            },
            {
                path: 'notification',
                name: 'notification',
                component: Notification
            },
            {
                path: 'social/friend-list',
                name: 'friend-list',
                component: FriendList
            },
            {
                path: 'charts',
                name: 'charts',
                redirect: { name: 'charts-instance' }
            },
            {
                path: 'charts/instance',
                name: 'charts-instance',
                component: () =>
                    import('./../views/Charts/components/InstanceActivity.vue')
            },
            {
                path: 'charts/mutual',
                name: 'charts-mutual',
                component: () =>
                    import('./../views/Charts/components/MutualFriends.vue')
            },
            { path: 'tools', name: 'tools', component: Tools },
            {
                path: 'tools/gallery',
                name: 'gallery',
                component: Gallery,
                meta: { navKey: 'tools' }
            },
            {
                path: 'tools/screenshot-metadata',
                name: 'screenshot-metadata',
                component: ScreenshotMetadata,
                meta: { navKey: 'tools' }
            },
            { path: 'settings', name: 'settings', component: Settings }
        ]
    }
];

export const router = createRouter({
    history: createWebHashHistory(),
    // @ts-ignore
    routes
});

export function initRouter(app) {
    app.use(router);
}

router.beforeEach((to) => {
    if (to.path === '/social') {
        return false;
    }

    if (to.name === 'login' && watchState.isLoggedIn) {
        return { name: 'feed' };
    }

    const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
    if (requiresAuth && !watchState.isLoggedIn) {
        const redirect = to.fullPath;
        if (redirect && redirect !== '/feed') {
            return { name: 'login', query: { redirect } };
        }
        return { name: 'login' };
    }

    return true;
});
