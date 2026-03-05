/**
 * @param {string} text
 * @returns {boolean}
 */
export function needsCsvQuotes(text) {
    return /[\x00-\x1f,"]/.test(text);
}

/**
 * @param {*} value
 * @returns {string}
 */
export function formatCsvField(value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }
    const text = String(value);
    if (needsCsvQuotes(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

/**
 * @param {object} obj - The source object
 * @param {string[]} fields - Property names to include
 * @returns {string}
 */
export function formatCsvRow(obj, fields) {
    return fields.map((field) => formatCsvField(obj?.[field])).join(',');
}
