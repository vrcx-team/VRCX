class ActivityType {
    static _Playing = 0;
    static _Listening = 2;
    static _Watching = 3;
    static _Competing = 5;

    static get Playing() {
        return this._Playing;
    }
    static get Listening() {
        return this._Listening;
    }
    static get Watching() {
        return this._Watching;
    }
    static get Competing() {
        return this._Competing;
    }
}

class StatusDisplayType {
    static _Name = 0;
    static _State = 1;
    static _Details = 2;

    static get Name() {
        return this._Name;
    }
    static get State() {
        return this._State;
    }
    static get Details() {
        return this._Details;
    }
}

Object.freeze(ActivityType);
Object.freeze(StatusDisplayType);

Object.defineProperty(ActivityType, '_Playing', { writable: false });
Object.defineProperty(ActivityType, '_Listening', { writable: false });
Object.defineProperty(ActivityType, '_Watching', { writable: false });
Object.defineProperty(ActivityType, '_Competing', { writable: false });
Object.defineProperty(StatusDisplayType, '_Name', { writable: false });
Object.defineProperty(StatusDisplayType, '_State', { writable: false });
Object.defineProperty(StatusDisplayType, '_Details', { writable: false });

export { ActivityType, StatusDisplayType };
