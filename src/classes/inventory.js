import * as workerTimers from 'worker-timers';
import configRepository from '../service/config.js';
import database from '../service/database.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';
import { inventoryRequest } from '../api';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.currentUserInventory = new Map();
        API.$on('LOGIN', function () {
            API.currentUserInventory.clear();
        });
    }

    _data = {
        inventoryTable: []
    };

    _methods = {
        async getInventory() {
            this.inventoryTable = [];
            API.currentUserInventory.clear();
            var params = {
                n: 100,
                offset: 0,
                order: 'newest'
            };
            this.galleryDialogInventoryLoading = true;
            try {
                for (let i = 0; i < 100; i++) {
                    params.offset = i * params.n;
                    const args =
                        await inventoryRequest.getInventoryItems(params);
                    for (const item of args.json.data) {
                        API.currentUserInventory.set(item.id, item);
                        if (!item.flags.includes('ugc')) {
                            this.inventoryTable.push(item);
                        }
                    }
                    if (args.json.data.length === 0) {
                        break;
                    }
                }
            } catch (error) {
                console.error('Error fetching inventory items:', error);
            } finally {
                this.galleryDialogInventoryLoading = false;
            }
        }
    };
}
