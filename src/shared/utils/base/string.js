/**
 *
 * @param {string} tag
 * @returns {string}
 */
function escapeTag(tag) {
    const s = String(tag);
    return s.replace(/["&'<>]/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 *
 * @param {object} obj
 * @returns {object}
 */
function escapeTagRecursive(obj) {
    if (typeof obj === 'string') {
        return escapeTag(obj);
    }
    if (typeof obj === 'object') {
        for (const key in obj) {
            obj[key] = escapeTagRecursive(obj[key]);
        }
    }
    return obj;
}

/**
 *
 * @param {string} text
 * @returns {string}
 */
function textToHex(text) {
    const s = String(text);
    return s
        .split('')
        .map((c) => c.charCodeAt(0).toString(16))
        .join(' ');
}

/**
 *
 * @param {number} num
 * @returns {string}
 */
function commaNumber(num) {
    if (!num) {
        return '0';
    }
    const numValue = Number(num);
    if (isNaN(numValue)) {
        return '0';
    }
    const s = String(numValue);
    return s.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

/**
 *
 * @param {string} str
 * @param {string} search
 * @param {object} comparer
 * @returns {boolean}
 */
function localeIncludes(str, search, comparer) {
    // These checks are stolen from https://stackoverflow.com/a/69623589/11030436
    if (search === '') {
        return true;
    } else if (!str || !search) {
        return false;
    }
    const strObj = String(str);
    const searchObj = String(search);

    if (strObj.length === 0) {
        return false;
    }

    if (searchObj.length > strObj.length) {
        return false;
    }

    // Now simply loop through each substring and compare them
    for (let i = 0; i < str.length - searchObj.length + 1; i++) {
        const substr = strObj.substring(i, i + searchObj.length);
        if (comparer.compare(substr, searchObj) === 0) {
            return true;
        }
    }
    return false;
}

/**
 *
 * @param {string} text
 * @returns {string}
 */
function changeLogRemoveLinks(text) {
    return text.replace(/([^!])\[[^\]]+\]\([^)]+\)/g, '$1');
}

export {
    escapeTag,
    escapeTagRecursive,
    textToHex,
    commaNumber,
    localeIncludes,
    changeLogRemoveLinks
};
