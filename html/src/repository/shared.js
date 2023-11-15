// requires binding of SharedVariable

function transformKey(key) {
    return String(key).toLowerCase();
}

class SharedRepository {
    remove(key) {
        var _key = transformKey(key);
        return SharedVariable.Remove(_key);
    }

    async getString(key, defaultValue = null) {
        var _key = transformKey(key);
        var value = await SharedVariable.Get(_key);
        if (value === null) {
            return defaultValue;
        }
        return value;
    }

    async setString(key, value) {
        var _key = transformKey(key);
        var _value = String(value);
        await SharedVariable.Set(_key, _value);
    }

    async getBool(key, defaultValue = null) {
        var value = await this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        return value === 'true';
    }

    async setBool(key, value) {
        await this.setString(key, value ? 'true' : 'false');
    }

    async getInt(key, defaultValue = null) {
        var value = await this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        value = parseInt(value, 10);
        if (isNaN(value) === true) {
            return defaultValue;
        }
        return value;
    }

    async setInt(key, value) {
        await this.setString(key, value);
    }

    async getFloat(key, defaultValue = null) {
        var value = await this.getString(key, null);
        if (value === null) {
            return defaultValue;
        }
        value = parseFloat(value);
        if (isNaN(value) === true) {
            return defaultValue;
        }
        return value;
    }

    async setFloat(key, value) {
        await this.setString(key, value);
    }

    async getObject(key, defaultValue = null) {
        var value = await this.getString(key, null);
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

    async setObject(key, value) {
        await this.setString(key, JSON.stringify(value));
    }

    async getArray(key, defaultValue = null) {
        var value = await this.getObject(key, null);
        if (Array.isArray(value) === false) {
            return defaultValue;
        }
        return value;
    }

    async setArray(key, value) {
        await this.setObject(key, value);
    }
}

var self = new SharedRepository();
window.sharedRepository = self;

export { self as default, SharedRepository };
