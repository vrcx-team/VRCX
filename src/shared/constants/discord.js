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

Object.freeze(ActivityType);

Object.defineProperty(ActivityType, '_Playing', { writable: false });
Object.defineProperty(ActivityType, '_Listening', { writable: false });
Object.defineProperty(ActivityType, '_Watching', { writable: false });
Object.defineProperty(ActivityType, '_Competing', { writable: false });

export { ActivityType };
