import sqlite from '../sqlite.js';
import sharedRepository from './shared.js';

var dirtyKeySet = new Set();

async function init() {
    try {
        await sqlite.executeNonQuery('CREATE TABLE IF NOT EXISTS configs (`key` TEXT PRIMARY KEY, `value` TEXT)');
        await sqlite.execute(
            (key, value) => sharedRepository.set(key, value),
            'SELECT `key`, `value` FROM configs'
        );
    } catch (err) {
        console.error(err);
    }
    syncLoop();
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

function transformKey(key) {
    return `config:${String(key).toLowerCase()}`;
}

function get(key, defaultValue = null) {
    key = transformKey(key);
    return sharedRepository.get(key, defaultValue);
}

function set(key, value) {
    key = transformKey(key);
    value = String(value);
    sharedRepository.set(key, value);
    dirtyKeySet.add(key);
}

function getBool(key, defaultValue = null) {
    var value = get(key, null);
    if (value === null) {
        return defaultValue;
    }
    return value === 'true';
}

function setBool(key, value) {
    set(key, value ? 'true' : 'false');
}

function getInt(key, defaultValue = null) {
    var value = get(key, null);
    if (value === null) {
        return defaultValue;
    }
    value = parseInt(value, 10);
    if (isNaN(value) === true) {
        return defaultValue;
    }
    return value;
}

function setInt(key, value) {
    set(key, value);
}

function getFloat(key, defaultValue = null) {
    var value = get(key, null);
    if (value === null) {
        return defaultValue;
    }
    value = parseFloat(value);
    if (isNaN(value) === true) {
        return defaultValue;
    }
    return value;
}

function setFloat(key, value) {
    set(key, value);
}

function getObject(key, defaultValue = null) {
    var value = get(key, null);
    if (value === null) {
        return defaultValue;
    }
    try {
        value = JSON.parse(value);
    } catch (err) {
    }
    if (value !== Object(value)) {
        return defaultValue;
    }
    return value;
}

function setObject(key, value) {
    set(key, JSON.stringify(value));
}

function getArray(key, defaultValue = null) {
    var value = getObject(key, null);
    if (Array.isArray(value) === false) {
        return defaultValue;
    }
    return value;
}

function setArray(key, value) {
    setObject(key, value);
}

export default {
    init,
    get,
    set,
    getBool,
    setBool,
    getInt,
    setInt,
    getFloat,
    setFloat,
    getObject,
    setObject,
    getArray,
    setArray
};
