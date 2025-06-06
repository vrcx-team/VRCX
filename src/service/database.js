import cloudDatabase from './cloudDatabase.js';
import localDatabase from './localDatabase.js';

var database = localDatabase;
export function enableCloudDatabase(bool) {
    if (bool) {
        database = cloudDatabase;
    } else {
        database = localDatabase;
    }
}
export default function () {
    return database;
}
