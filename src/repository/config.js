import sqliteService from '../service/sqlite.js';
import sharedRepository, { SharedRepository } from './shared.js';
import * as workerTimers from 'worker-timers';

var dirtyKeySet = new Set();

function transformKey(key) {
    return `config:${String(key).toLowerCase()}`;
}

async function syncLoop() {
    if (dirtyKeySet.size > 0) {
        try {
            await sqliteService.executeNonQuery('BEGIN');
            try {
                for (var key of dirtyKeySet) {
                    var value = await sharedRepository.getString(key);
                    if (value === null) {
                        await sqliteService.executeNonQuery(
                            'DELETE FROM configs WHERE `key` = @key',
                            {
                                '@key': key
                            }
                        );
                    } else {
                        await sqliteService.executeNonQuery(
                            'INSERT OR REPLACE INTO configs (`key`, `value`) VALUES (@key, @value)',
                            {
                                '@key': key,
                                '@value': value
                            }
                        );
                    }
                }
                dirtyKeySet.clear();
            } finally {
                await sqliteService.executeNonQuery('COMMIT');
            }
        } catch (err) {
            console.error(err);
        }
    }
    workerTimers.setTimeout(() => syncLoop(), 100);
}

class ConfigRepository extends SharedRepository {
    async init() {
        await sqliteService.executeNonQuery(
            'CREATE TABLE IF NOT EXISTS configs (`key` TEXT PRIMARY KEY, `value` TEXT)'
        );
        await sqliteService.execute(
            ([key, value]) => sharedRepository.setString(key, value),
            'SELECT `key`, `value` FROM configs'
        );
        syncLoop();
    }

    async remove(key) {
        var _key = transformKey(key);
        await sharedRepository.remove(_key);
        dirtyKeySet.add(_key);
    }

    getString(key, defaultValue = null) {
        var _key = transformKey(key);
        return sharedRepository.getString(_key, defaultValue);
    }

    async setString(key, value) {
        var _key = transformKey(key);
        var _value = String(value);
        await sharedRepository.setString(_key, _value);
        dirtyKeySet.add(_key);
    }
}

var self = new ConfigRepository();
window.configRepository = self;

export { self as default, ConfigRepository };
