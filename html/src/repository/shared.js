// requires binding of SharedVariable

function transformKey(key) {
    return String(key).toLowerCase();
}

class SharedRepository {
    remove(key) {
        var _key = transformKey(key);
        return SharedVariable.Remove(_key);
    }

    getString(key, defaultValue = null) {
        var _key = transformKey(key);
        // var get = SharedVariable.Get(_key);
        // var value = waitSynchronous(get);
        var value = SharedVariable.Get(_key);
        if (value === null) {
            return defaultValue;
        }
        return value;
    }

    setString(key, value) {
        var _key = transformKey(key);
        var _value = String(value);
        SharedVariable.Set(_key, _value);
    }

    getBool(key, defaultValue = null) {
        var value = this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        return value === 'true';
    }

    setBool(key, value) {
        this.setString(key, value ? 'true' : 'false');
    }

    getInt(key, defaultValue = null) {
        var value = this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        value = parseInt(value, 10);
        if (isNaN(value) === true) {
            return defaultValue;
        }
        return value;
    }

    setInt(key, value) {
        this.setString(key, value);
    }

    getFloat(key, defaultValue = null) {
        var value = this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        value = parseFloat(value);
        if (isNaN(value) === true) {
            return defaultValue;
        }
        return value;
    }

    setFloat(key, value) {
        this.setString(key, value);
    }

    getObject(key, defaultValue = null) {
        var value = this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        try {
            value = JSON.parse(value);
        } catch (err) {}
        if (value !== Object(value)) {
            return defaultValue;
        }
        return value;
    }

    setObject(key, value) {
        this.setString(key, JSON.stringify(value));
    }

    getArray(key, defaultValue = null) {
        var value = this.getObject(key, null);
        if (Array.isArray(value) === false) {
            return defaultValue;
        }
        return value;
    }

    setArray(key, value) {
        this.setObject(key, value);
    }
}

var self = new SharedRepository();
window.sharedRepository = self;

export {self as default, SharedRepository};
