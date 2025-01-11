import * as workerTimers from 'worker-timers';
import configRepository from '../repository/config.js';
import database from '../repository/database.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {}

    _data = {};

    _methods = {
        async tryRestoreFriendNumber() {
            var lastUpdate = await configRepository.getString(
                `VRCX_lastStoreTime_${API.currentUser.id}`
            );
            if (lastUpdate == -4) {
                // this means the backup was already applied
                return;
            }
            var status = false;
            this.friendNumber = 0;
            for (var ref of this.friendLog.values()) {
                ref.friendNumber = 0;
            }
            try {
                if (lastUpdate) {
                    // backup ready to try apply
                    status = await this.restoreFriendNumber();
                }
                // needs to be in reverse because we don't know the starting number
                this.applyFriendLogFriendOrderInReverse();
            } catch (err) {
                console.error(err);
            }
            // if (status) {
            //     this.$message({
            //         message: 'Friend order restored from backup',
            //         type: 'success',
            //         duration: 0,
            //         showClose: true
            //     });
            // } else if (this.friendLogTable.data.length > 0) {
            //     this.$message({
            //         message:
            //             'No backup found, friend order partially restored from friendLog',
            //         type: 'success',
            //         duration: 0,
            //         showClose: true
            //     });
            // }
            await configRepository.setString(
                `VRCX_lastStoreTime_${API.currentUser.id}`,
                -4
            );
        },

        async restoreFriendNumber() {
            var storedData = null;
            try {
                var data = await configRepository.getString(
                    `VRCX_friendOrder_${API.currentUser.id}`
                );
                if (data) {
                    var storedData = JSON.parse(data);
                }
            } catch (err) {
                console.error(err);
            }
            if (!storedData || storedData.length === 0) {
                var message = 'whomp whomp, no friend order backup found';
                console.error(message);
                return false;
            }

            var friendLogTable = this.getFriendLogFriendOrder();

            // for storedData
            var machList = [];
            for (var i = 0; i < Object.keys(storedData).length; i++) {
                var key = Object.keys(storedData)[i];
                var value = storedData[key];
                var item = this.parseFriendOrderBackup(
                    friendLogTable,
                    key,
                    value
                );
                machList.push(item);
            }
            machList.sort((a, b) => b.matches - a.matches);
            console.log(
                `friendLog: ${friendLogTable.length} friendOrderBackups:`,
                machList
            );

            var bestBackup = machList[0];
            if (!bestBackup?.isValid) {
                var message = 'whomp whomp, no valid backup found';
                console.error(message);
                return false;
            }

            this.applyFriendOrderBackup(bestBackup.table);
            this.applyFriendLogFriendOrder();
            await configRepository.setInt(
                `VRCX_friendNumber_${API.currentUser.id}`,
                this.friendNumber
            );
            return true;
        },

        getFriendLogFriendOrder() {
            var friendLogTable = [];
            for (var i = 0; i < this.friendLogTable.data.length; i++) {
                var ref = this.friendLogTable.data[i];
                if (ref.type !== 'Friend') {
                    continue;
                }
                if (
                    friendLogTable.findIndex((x) => x.id === ref.userId) !== -1
                ) {
                    // console.log(
                    //     'ignoring duplicate friend',
                    //     ref.displayName,
                    //     ref.created_at
                    // );
                    continue;
                }
                friendLogTable.push({
                    id: ref.userId,
                    displayName: ref.displayName,
                    created_at: ref.created_at
                });
            }
            var compareByCreatedAt = function (a, b) {
                var A = a.created_at;
                var B = b.created_at;
                if (A < B) {
                    return -1;
                }
                if (A > B) {
                    return 1;
                }
                return 0;
            };
            friendLogTable.sort(compareByCreatedAt);
            return friendLogTable;
        },

        applyFriendLogFriendOrder() {
            var friendLogTable = this.getFriendLogFriendOrder();
            if (this.friendNumber === 0) {
                console.log(
                    'No backup applied, applying friend log in reverse'
                );
                // this means no FriendOrderBackup was applied
                // will need to apply in reverse order instead
                return;
            }
            for (var friendLog of friendLogTable) {
                var ref = this.friendLog.get(friendLog.id);
                if (!ref || ref.friendNumber) {
                    continue;
                }
                ref.friendNumber = ++this.friendNumber;
                this.friendLog.set(ref.userId, ref);
                database.setFriendLogCurrent(ref);
                var friendRef = this.friends.get(friendLog.id);
                if (friendRef?.ref) {
                    friendRef.ref.$friendNumber = ref.friendNumber;
                }
            }
        },

        applyFriendLogFriendOrderInReverse() {
            this.friendNumber = this.friends.size + 1;
            var friendLogTable = this.getFriendLogFriendOrder();
            for (var i = friendLogTable.length - 1; i > -1; i--) {
                var friendLog = friendLogTable[i];
                var ref = this.friendLog.get(friendLog.id);
                if (!ref) {
                    continue;
                }
                if (ref.friendNumber) {
                    break;
                }
                ref.friendNumber = --this.friendNumber;
                this.friendLog.set(ref.userId, ref);
                database.setFriendLogCurrent(ref);
                var friendRef = this.friends.get(friendLog.id);
                if (friendRef?.ref) {
                    friendRef.ref.$friendNumber = ref.friendNumber;
                }
            }
            this.friendNumber = this.friends.size;
            console.log('Applied friend order from friendLog');
        },

        parseFriendOrderBackup(friendLogTable, created_at, backupUserIds) {
            var backupTable = [];
            for (var i = 0; i < backupUserIds.length; i++) {
                var userId = backupUserIds[i];
                var ctx = this.friends.get(userId);
                if (ctx) {
                    backupTable.push({
                        id: ctx.id,
                        displayName: ctx.name
                    });
                }
            }

            // var compareTable = [];
            // compare 2 tables, find max amount of id's in same order
            var maxMatches = 0;
            var currentMatches = 0;
            var backupIndex = 0;
            for (var i = 0; i < friendLogTable.length; i++) {
                var isMatch = false;
                var ref = friendLogTable[i];
                if (backupIndex <= 0) {
                    backupIndex = backupTable.findIndex((x) => x.id === ref.id);
                    if (backupIndex !== -1) {
                        currentMatches = 1;
                    }
                } else if (backupTable[backupIndex].id === ref.id) {
                    currentMatches++;
                    isMatch = true;
                } else {
                    var backupIndex = backupTable.findIndex(
                        (x) => x.id === ref.id
                    );
                    if (backupIndex !== -1) {
                        currentMatches = 1;
                    }
                }
                if (backupIndex === backupTable.length - 1) {
                    backupIndex = 0;
                } else {
                    backupIndex++;
                }
                if (currentMatches > maxMatches) {
                    maxMatches = currentMatches;
                }
                // compareTable.push({
                //     id: ref.id,
                //     displayName: ref.displayName,
                //     match: isMatch
                // });
            }

            var lerp = (a, b, alpha) => {
                return a + alpha * (b - a);
            };
            return {
                matches: parseFloat(`${maxMatches}.${created_at}`),
                table: backupUserIds,
                isValid: maxMatches > lerp(4, 10, backupTable.length / 1000) // pls no collisions
            };
        },

        applyFriendOrderBackup(userIdOrder) {
            for (var i = 0; i < userIdOrder.length; i++) {
                var userId = userIdOrder[i];
                var ctx = this.friends.get(userId);
                var ref = ctx?.ref;
                if (!ref || ref.$friendNumber) {
                    continue;
                }
                var friendLogCurrent = {
                    userId,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: i + 1
                };
                this.friendLog.set(userId, friendLogCurrent);
                database.setFriendLogCurrent(friendLogCurrent);
                this.friendNumber = i + 1;
            }
        }
    };
}
