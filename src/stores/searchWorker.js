/**
 * Web Worker for search operations.
 *
 * Offloads CPU-heavy confusable-character normalization and
 * locale-aware string search from the main thread.
 *
 * Protocol — Main → Worker:
 *   { type: 'updateIndex', payload: { friends, avatars, worlds, groups, favAvatars, favWorlds } }
 *   { type: 'search', payload: { seq, query, currentUserId, language } }
 *
 * Protocol — Worker → Main:
 *   { type: 'searchResult', payload: { seq, friends, ownAvatars, favAvatars, ownWorlds, favWorlds, ownGroups, joinedGroups } }
 */

// ── Confusables (inlined for Worker isolation) ──────────────────────
// We inline the minimal confusables logic to avoid importing from a
// module that might rely on non-Worker-safe globals.

const charToConfusables = new Map([
    [' ', ' '],
    ['0', '⓿'],
    ['1', '11⓵➊⑴¹𝟏𝟙１𝟷𝟣⒈𝟭1➀₁①❶⥠'],
    ['2', '⓶⒉⑵➋ƻ²ᒿ𝟚２𝟮𝟤ᒾ𝟸Ƨ𝟐②ᴤ₂➁❷ᘝƨ'],
    ['3', '³ȝჳⳌꞫ𝟑ℨ𝟛𝟯𝟥Ꝫ➌ЗȜ⓷ӠƷ３𝟹⑶⒊ʒʓǯǮƺ𝕴ᶾзᦡ➂③₃ᶚᴣᴟ❸ҘҙӬӡӭӟӞ'],
    ['4', '𝟰𝟺𝟦𝟒➍ҶᏎ𝟜ҷ⓸ҸҹӴӵᶣ４чㄩ⁴➃₄④❹Ӌ⑷⒋'],
    ['5', '𝟱⓹➎Ƽ𝟓𝟻𝟝𝟧５➄₅⑤⁵❺ƽ⑸⒌'],
    ['6', 'Ⳓ🄇𝟼Ꮾ𝟲𝟞𝟨𝟔➏⓺Ϭϭ⁶б６ᧈ⑥➅₆❻⑹⒍'],
    ['7', '𝟕𝟟𝟩𝟳𝟽🄈⓻𐓒➐７⁷⑦₇❼➆⑺⒎'],
    ['8', '𐌚🄉➑⓼８𝟠𝟪৪⁸₈𝟴➇⑧❽𝟾𝟖⑻⒏'],
    ['9', '൭Ꝯ𝝑𝞋𝟅🄊𝟡𝟵Ⳋ⓽➒੧৭୨９𝟫𝟿𝟗⁹₉Գ➈⑨❾⑼⒐'],
    ['a', '∂⍺ⓐ'],
    ['b', 'ꮟᏏ'],
    ['c', '🝌'],
    ['d', 'Ꮷ'],
    ['e', 'əәⅇꬲ'],
    ['f', 'ꬵꞙẝ'],
    ['g', 'ᶃᶢⓖ'],
    ['h', 'ꞕ৸'],
    ['i', '⍳ℹⅈ'],
    ['j', 'ꭻⅉⓙ'],
    ['k', 'ⓚꝁ'],
    ['l', 'ⓛ'],
    ['m', '₥ᵯ'],
    ['n', 'ոռח'],
    ['o', 'ంಂംං'],
    ['p', 'ⲣҏ℗ⓟ'],
    ['q', 'ꝗ'],
    ['r', 'ⓡ'],
    ['s', 'ᣵⓢꜱ'],
    ['t', 'ⓣ'],
    ['u', 'ⓤ'],
    ['v', '∨⌄⋁ⅴ'],
    ['w', 'ⓦ'],
    ['x', '᙮ⅹ'],
    ['y', 'ʏỿꭚ'],
    ['z', 'ⓩꮓ']
]);

const confusablesToChar = new Map();
for (const [char_, confusables] of charToConfusables) {
    for (const confusable of confusables) {
        confusablesToChar.set(confusable, char_);
    }
}

const nonConfusables = /^[!-~]*$/;
const regexLineBreakCombiningMarks =
    /[\0-\x08\x0E-\x1F\x7F-\x84\x86-\x9F\u0300-\u034E\u0350-\u035B\u0363-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u061C\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D4-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFB-\u1DFF\u200C\u200E\u200F\u202A-\u202E\u2066-\u206F\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3035\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFFF9-\uFFFB]/g;
const regexSymbolWithCombiningMarks =
    /([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g;

function removeConfusables(a) {
    if (nonConfusables.test(a)) {
        return a;
    }
    let ret = '';
    for (const char_ of a
        .normalize()
        .replace(regexLineBreakCombiningMarks, '')
        .replace(regexSymbolWithCombiningMarks, '$1')
        .replace(/\s/g, '')) {
        ret += confusablesToChar.get(char_) || char_;
    }
    return ret;
}

function removeWhitespace(a) {
    return a.replace(/\s/g, '');
}

// ── Locale-aware string search ──────────────────────────────────────

function localeIncludes(str, search, comparer) {
    if (search === '') return true;
    if (!str || !search) return false;
    const strObj = String(str);
    const searchObj = String(search);
    if (strObj.length === 0) return false;
    if (searchObj.length > strObj.length) return false;
    for (let i = 0; i < str.length - searchObj.length + 1; i++) {
        const substr = strObj.substring(i, i + searchObj.length);
        if (comparer.compare(substr, searchObj) === 0) return true;
    }
    return false;
}

function matchName(name, query, comparer) {
    if (!name || !query) return false;
    const cleanQuery = removeWhitespace(query);
    if (!cleanQuery) return false;
    const cleanName = removeConfusables(name);
    if (localeIncludes(cleanName, cleanQuery, comparer)) return true;
    return localeIncludes(name, cleanQuery, comparer);
}

function isPrefixMatch(name, query, comparer) {
    if (!name || !query) return false;
    const cleanQuery = removeWhitespace(query);
    if (!cleanQuery) return false;
    return (
        comparer.compare(name.substring(0, cleanQuery.length), cleanQuery) === 0
    );
}

// ── Index data (updated from main thread) ───────────────────────────

let indexedFriends = [];    // { id, name, memo, note, imageUrl }
let indexedAvatars = [];    // { id, name, authorId, imageUrl }
let indexedWorlds = [];     // { id, name, authorId, imageUrl }
let indexedGroups = [];     // { id, name, ownerId, imageUrl }
let indexedFavAvatars = []; // { id, name, imageUrl }
let indexedFavWorlds = [];  // { id, name, imageUrl }

/**
 * Update the search index with fresh data snapshots.
 */
function updateIndex(payload) {
    if (payload.friends) indexedFriends = payload.friends;
    if (payload.avatars) indexedAvatars = payload.avatars;
    if (payload.worlds) indexedWorlds = payload.worlds;
    if (payload.groups) indexedGroups = payload.groups;
    if (payload.favAvatars) indexedFavAvatars = payload.favAvatars;
    if (payload.favWorlds) indexedFavWorlds = payload.favWorlds;
}

// ── Search functions ────────────────────────────────────────────────

function searchFriends(query, comparer, limit = 10) {
    const results = [];
    for (const ctx of indexedFriends) {
        let match = matchName(ctx.name, query, comparer);
        let matchedField = match ? 'name' : null;
        if (!match && ctx.memo) {
            match = localeIncludes(ctx.memo, query, comparer);
            if (match) matchedField = 'memo';
        }
        if (!match && ctx.note) {
            match = localeIncludes(ctx.note, query, comparer);
            if (match) matchedField = 'note';
        }
        if (match) {
            results.push({
                id: ctx.id,
                name: ctx.name,
                type: 'friend',
                imageUrl: ctx.imageUrl,
                memo: ctx.memo || '',
                note: ctx.note || '',
                matchedField
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) results.length = limit;
    return results;
}

function searchItems(query, items, type, comparer, ownerKey, ownerId, limit = 10) {
    const results = [];
    for (const ref of items) {
        if (!ref || !ref.name) continue;
        if (ownerId && ref[ownerKey] !== ownerId) continue;
        if (matchName(ref.name, query, comparer)) {
            results.push({
                id: ref.id,
                name: ref.name,
                type,
                imageUrl: ref.imageUrl
            });
        }
    }
    results.sort((a, b) => {
        const aPrefix = isPrefixMatch(a.name, query, comparer);
        const bPrefix = isPrefixMatch(b.name, query, comparer);
        if (aPrefix && !bPrefix) return -1;
        if (bPrefix && !aPrefix) return 1;
        return comparer.compare(a.name, b.name);
    });
    if (results.length > limit) results.length = limit;
    return results;
}

function handleSearch(payload) {
    const { seq, query, currentUserId, language } = payload;

    if (!query || query.length < 2) {
        self.postMessage({
            type: 'searchResult',
            payload: {
                seq,
                friends: [],
                ownAvatars: [],
                favAvatars: [],
                ownWorlds: [],
                favWorlds: [],
                ownGroups: [],
                joinedGroups: []
            }
        });
        return;
    }

    const comparer = new Intl.Collator(
        (language || 'en').replace('_', '-'),
        { usage: 'search', sensitivity: 'base' }
    );

    const friends = searchFriends(query, comparer);
    const ownAvatars = searchItems(query, indexedAvatars, 'avatar', comparer, 'authorId', currentUserId);
    const favAvatars = searchItems(query, indexedFavAvatars, 'avatar', comparer, null, null);
    const ownWorlds = searchItems(query, indexedWorlds, 'world', comparer, 'authorId', currentUserId);
    const favWorlds = searchItems(query, indexedFavWorlds, 'world', comparer, null, null);
    const ownGroups = searchItems(query, indexedGroups, 'group', comparer, 'ownerId', currentUserId);
    const joinedGroups = searchItems(query, indexedGroups, 'group', comparer, null, null);

    // Deduplicate favorites against own
    const ownAvatarIds = new Set(ownAvatars.map((r) => r.id));
    const dedupedFavAvatars = favAvatars.filter((r) => !ownAvatarIds.has(r.id));
    const ownWorldIds = new Set(ownWorlds.map((r) => r.id));
    const dedupedFavWorlds = favWorlds.filter((r) => !ownWorldIds.has(r.id));
    const ownGroupIds = new Set(ownGroups.map((r) => r.id));
    const dedupedJoinedGroups = joinedGroups.filter((r) => !ownGroupIds.has(r.id));

    self.postMessage({
        type: 'searchResult',
        payload: {
            seq,
            friends,
            ownAvatars,
            favAvatars: dedupedFavAvatars,
            ownWorlds,
            favWorlds: dedupedFavWorlds,
            ownGroups,
            joinedGroups: dedupedJoinedGroups
        }
    });
}

// ── Message handler ─────────────────────────────────────────────────

self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'updateIndex':
            updateIndex(payload);
            break;
        case 'search':
            handleSearch(payload);
            break;
        default:
            console.warn('[SearchWorker] Unknown message type:', type);
    }
});
