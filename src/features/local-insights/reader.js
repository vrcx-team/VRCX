import sqliteService from '../../services/sqlite.js';
import { dbVars } from '../../services/database';
import { readDatabase } from './readDatabase.mjs';

export function currentAccountId() {
    return dbVars.userId;
}
export async function loadLocalRecords(days = 7) {
    if (![1, 7, 30].includes(days)) throw new Error('Unsupported time range.');
    const observerId = dbVars.userId;
    const until = new Date().toISOString();
    const since = new Date(Date.now() - days * 86400000).toISOString();
    return readDatabase(sqliteService.execute.bind(sqliteService), {
        since, until, observerId, userPrefix: dbVars.userPrefix,
        isCurrent: () => dbVars.userId === observerId
    });
}
