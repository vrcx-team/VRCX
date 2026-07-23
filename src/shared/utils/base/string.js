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
    return [...s]
        .map((c) => {
            const code = c.codePointAt(0);
            return code.toString(16).toUpperCase();
        })
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
 * Locale-aware case-insensitive includes check.
 * Drop-in replacement for str.toLowerCase().includes(query.toLowerCase()).
 * Uses Intl.Collator for proper Unicode/Arabic support.
 *
 * @param {string} str - The string to search in
 * @param {string} query - The search query
 * @param {string} [locale] - The locale for comparison
 * @returns {boolean}
 */
const searchCollators = new Map();

function localeIncludesCI(str, query, locale) {
    if (
        str === null ||
        str === undefined ||
        query === null ||
        query === undefined
    )
        return false;
    const s = String(str);
    const q = String(query);
    if (q.length === 0) return true;
    if (q.length > s.length) return false;
    const resolvedLocale =
        locale ||
        (typeof document === 'undefined'
            ? 'en'
            : document.documentElement.lang || 'en');
    let comparer = searchCollators.get(resolvedLocale);
    if (!comparer) {
        comparer = new Intl.Collator(resolvedLocale, {
            usage: 'search',
            sensitivity: 'base'
        });
        searchCollators.set(resolvedLocale, comparer);
    }
    return localeIncludes(s, q, comparer);
}

/**
 *
 * @param {string} text
 * @returns {string}
 */
function changeLogRemoveLinks(text) {
    return text.replace(/([^!])\[[^\]]+\]\([^)]+\)/g, '$1');
}

/**
 *
 * @param {string} text
 * @returns {string}
 */
function replaceBioSymbols(text) {
    if (typeof text !== 'string') {
        return '';
    }
    const symbolList = {
        '@': '＠',
        '#': '＃',
        $: '＄',
        '%': '％',
        '&': '＆',
        '=': '＝',
        '+': '＋',
        '/': '⁄',
        '\\': '＼',
        ';': ';',
        ':': '˸',
        ',': '‚',
        '?': '？',
        '!': 'ǃ',
        '"': '＂',
        '<': '≺',
        '>': '≻',
        '.': '․',
        '^': '＾',
        '{': '｛',
        '}': '｝',
        '[': '［',
        ']': '］',
        '(': '（',
        ')': '）',
        '|': '｜',
        '*': '∗'
    };
    let newText = text;
    for (const key in symbolList) {
        const regex = new RegExp(symbolList[key], 'g');
        newText = newText.replace(regex, key);
    }
    return newText.replace(/ {1,}/g, ' ').trimRight();
}

/**
 * @param {string} text
 * @returns {string}
 */
function removeEmojis(text) {
    if (!text) {
        return '';
    }
    return text
        .replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
            ''
        )
        .replace(/\s+/g, ' ')
        .trim();
}

export {
    escapeTag,
    escapeTagRecursive,
    textToHex,
    commaNumber,
    localeIncludes,
    localeIncludesCI,
    changeLogRemoveLinks,
    replaceBioSymbols,
    removeEmojis
};
