import sqlite from '../sqlite.js';
import sharedRepository, { SharedRepository } from './shared.js';

var dirtyKeySet = new Set();

class ConfigRepository extends SharedRepository {
    async init() {
        try {
            await sqlite.executeNonQuery('CREATE TABLE IF NOT EXISTS configs (`key` TEXT PRIMARY KEY, `value` TEXT)');
            await sqlite.execute(
                (key, value) => sharedRepository.setString(key, value),
                'SELECT `key`, `value` FROM configs'
            );
        } catch (err) {
            console.error(err);
        }
        syncLoop();
    }

    getString(key, defaultValue = null) {
        key = transformKey(key);
        return sharedRepository.getString(key, defaultValue);
    }

    setString(key, value) {
        key = transformKey(key);
        value = String(value);
        sharedRepository.setString(key, value);
        dirtyKeySet.add(key);
    }
}

function transformKey(key) {
    return `config:${String(key).toLowerCase()}`;
}

async function syncLoop() {
    if (dirtyKeySet.size > 0) {
        try {
            await sqlite.executeNonQuery('BEGIN');
            try {
                for (var key of dirtyKeySet) {
                    await sqlite.executeNonQuery(
                        'INSERT OR REPLACE INTO configs (`key`, `value`) VALUES (@key, @value)',
                        {
                            '@key': key,
                            '@value': sharedRepository.get(key)
                        }
                    );
                }
                dirtyKeySet.clear();
            } finally {
                await sqlite.executeNonQuery('COMMIT');
            }
        } catch (err) {
            console.error(err);
        }
    }
    setTimeout(syncLoop, 100);
}

var self = new ConfigRepository();

export {
    self as default,
    ConfigRepository
};
