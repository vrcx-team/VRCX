/**
 * @param {typeof import('./index.js').database} database
 */

async function runDatabaseMigrations(database) {
    await database.initTables();
    await database.cleanLegendFromFriendLog(); // fix friendLog spammed with crap
    await database.fixGameLogTraveling(); // fix bug with gameLog location being set as traveling
    await database.fixNegativeGPS(); // fix GPS being a negative value due to VRCX bug with traveling
    await database.fixBrokenLeaveEntries(); // fix user instance timer being higher than current user location timer
    await database.fixBrokenGroupInvites(); // fix notification v2 in wrong table
    await database.fixBrokenNotifications(); // fix notifications being null
    await database.fixBrokenGroupChange(); // fix spam group left & name change
    await database.fixCancelFriendRequestTypo(); // fix CancelFriendRequst typo
    await database.fixBrokenGameLogDisplayNames(); // fix gameLog display names "DisplayName (userId)"
    await database.upgradeDatabaseVersion(); // update database version
}

export { runDatabaseMigrations };
