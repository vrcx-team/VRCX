// requires binding of SharedVariable

function transformKey(key) {
    return String(key).toLowerCase();
}

function get(key, defaultValue = null) {
    key = transformKey(key);
    var value = SharedVariable.Get(key);
    if (value === undefined) {
        return defaultValue;
    }
    return value;
}

function set(key, value) {
    key = transformKey(key);
    value = String(value);
    SharedVariable.Set(key, value);
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
