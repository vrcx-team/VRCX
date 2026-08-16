import sqliteService from '../sqlite.js';

const printFavorites = {
    
    addPrintToFavorites(printId) {
        sqliteService.executeNonQuery(
            `INSERT OR REPLACE INTO favorite_print (print_id, created_at)
             VALUES (@print_id, @created_at)`,
            {
                '@print_id': printId,
                '@created_at': new Date().toJSON()
            }
        );
    },

    removePrintFromFavorites(printId) {
        sqliteService.executeNonQuery(
            `DELETE FROM favorite_print WHERE print_id = @print_id`,
            {
                '@print_id': printId
            }
        );
    },

    async getPrintFavorites() {
        const data = [];

        await sqliteService.execute((dbRow) => {
            data.push({
                printId: dbRow[1]
            });
        }, 'SELECT * FROM favorite_print');

        return data;
    }
};

export { printFavorites };