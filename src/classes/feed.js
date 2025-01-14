import { baseClass, $app, API, $t, $utils } from './baseClass.js';
import configRepository from '../repository/config.js';
import database from '../repository/database.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    _data = {
        feedTable: {
            data: [],
            search: '',
            vip: false,
            loading: false,
            filter: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'created_at',
                    order: 'descending'
                }
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },

        feedSessionTable: []
    };

    _methods = {
        feedSearch(row) {
            var value = this.feedTable.search.toUpperCase();
            if (!value) {
                return true;
            }
            if (
                value.startsWith('wrld_') &&
                String(row.location).toUpperCase().includes(value)
            ) {
                return true;
            }
            switch (row.type) {
                case 'GPS':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'Online':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'Offline':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'Status':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.status).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (
                        String(row.statusDescription)
                            .toUpperCase()
                            .includes(value)
                    ) {
                        return true;
                    }
                    return false;
                case 'Avatar':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.avatarName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'Bio':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.bio).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.previousBio).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
            }
            return true;
        },

        async feedTableLookup() {
            await configRepository.setString(
                'VRCX_feedTableFilters',
                JSON.stringify(this.feedTable.filter)
            );
            await configRepository.setBool(
                'VRCX_feedTableVIPFilter',
                this.feedTable.vip
            );
            this.feedTable.loading = true;
            var vipList = [];
            if (this.feedTable.vip) {
                vipList = Array.from(this.localFavoriteFriends.values());
            }
            this.feedTable.data = await database.lookupFeedDatabase(
                this.feedTable.search,
                this.feedTable.filter,
                vipList
            );
            this.feedTable.loading = false;
        },

        addFeed(feed) {
            this.queueFeedNoty(feed);
            this.feedSessionTable.push(feed);
            this.updateSharedFeed(false);
            if (
                this.feedTable.filter.length > 0 &&
                !this.feedTable.filter.includes(feed.type)
            ) {
                return;
            }
            if (
                this.feedTable.vip &&
                !this.localFavoriteFriends.has(feed.userId)
            ) {
                return;
            }
            if (!this.feedSearch(feed)) {
                return;
            }
            this.feedTable.data.push(feed);
            this.sweepFeed();
            this.notifyMenu('feed');
        },

        sweepFeed() {
            var { data } = this.feedTable;
            var j = data.length;
            if (j > this.maxTableSize) {
                data.splice(0, j - this.maxTableSize);
            }

            var date = new Date();
            date.setDate(date.getDate() - 1); // 24 hour limit
            var limit = date.toJSON();
            var i = 0;
            var k = this.feedSessionTable.length;
            while (i < k && this.feedSessionTable[i].created_at < limit) {
                ++i;
            }
            if (i === k) {
                this.feedSessionTable = [];
            } else if (i) {
                this.feedSessionTable.splice(0, i);
            }
        }
    };
}
