/**
 * @capacitor-community/sqlite stub for iOS.
 *
 * This package has no Package.swift / SPM support, so its native plugin is
 * never registered on iOS. Attempting to call Capacitor.registerPlugin() for
 * an unregistered plugin returns a proxy where every method throws a plain
 * object `{}` (not an Error), which crashes the entire app.
 *
 * This shim exports the same API surface but every operation is a safe no-op
 * that returns empty results, preventing the crash while allowing the rest of
 * the app to function.
 */

export class SQLiteConnection {
    constructor(_plugin) {}
    async createConnection(_db, _encrypted, _mode, _version, _readonly) {
        return new SQLiteDBConnection();
    }
    async closeConnection(_db, _readonly) {}
    async checkConnectionsConsistency(_openModes, _closeMode) { return { result: false }; }
    async isDatabase(_db) { return { result: false }; }
    async getDatabaseList() { return { values: [] }; }
    async addUpgradeStatement(_db, _statements) {}
    async importFromJson(_jsonString) { return { changes: { changes: 0 } }; }
    async isJsonValid(_jsonString) { return { result: false }; }
    async copyFromAssets(_overwrite) {}
    async getFromHTTPRequest(_url, _overwrite) {}
}

export class SQLiteDBConnection {
    async open() {}
    async close() {}
    async execute(_statements, _transaction) { return { changes: { changes: 0 } }; }
    async run(_statement, _values, _transaction) { return { changes: { changes: 0, lastId: -1 } }; }
    async query(_statement, _values) { return { values: [] }; }
    async isExists() { return { result: false }; }
    async isDBOpen() { return { result: false }; }
    async isTable(_table) { return { result: false }; }
    async getTableList() { return { values: [] }; }
    async createSyncTable() { return { changes: { changes: 0 } }; }
    async setSyncDate(_syncDate) {}
    async getSyncDate() { return { syncDate: '' }; }
    async exportToJson(_mode, _encrypted) { return { export: {} }; }
    async deleteTable(_table) {}
    async beginTransaction() { return { changes: { changes: 0 } }; }
    async commitTransaction() { return { changes: { changes: 0 } }; }
    async rollbackTransaction() { return { changes: { changes: 0 } }; }
    async getVersion() { return { version: 1 }; }
    async getUrl() { return { url: '' }; }
    async setEncryptionSecret(_passphrase) {}
    async changeEncryptionSecret(_passphrase, _oldPassphrase) {}
}

// Named export expected by @capacitor-community/sqlite consumers
export const CapacitorSQLite = {};
export default { SQLiteConnection, SQLiteDBConnection, CapacitorSQLite };
