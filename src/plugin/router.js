import { createRouter, createWebHashHistory } from 'vue-router';

import Charts from './../views/Charts/Charts.vue';
import Favorites from './../views/Favorites/Favorites.vue';
import Feed from './../views/Feed/Feed.vue';
import FriendList from './../views/FriendList/FriendList.vue';
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
    { path: '/gamelog', name: 'gameLog', component: GameLog },
    { path: '/playerlist', name: 'playerList', component: PlayerList },
    { path: '/search', name: 'search', component: Search },
    { path: '/favorites', name: 'favorites', component: Favorites },
    { path: '/friendlog', name: 'friendLog', component: FriendLog },
    { path: '/moderation', name: 'moderation', component: Moderation },
    { path: '/notification', name: 'notification', component: Notification },
    {
        path: '/friendlist',
        name: 'friendList',
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
