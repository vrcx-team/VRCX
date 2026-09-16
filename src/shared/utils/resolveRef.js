/**
 * Generic resolver for user/world/group references.
 * Normalises the input, optionally fetches the display name if missing.
 *
 * @param {string | object | null | undefined} input
 * @param {object} opts
 * @param {object} opts.emptyDefault - Value to return when input is falsy
 * @param {string} opts.idAlias - Alternative id key on input (e.g. 'userId')
 * @param {string} opts.nameKey - Name property key (e.g. 'displayName' or 'name')
 * @param {(id: string) => Promise<{ ref: object }>} opts.fetchFn - Fetch function
 * @returns {Promise<object>}
 */
async function resolveRef(input, { emptyDefault, idAlias, nameKey, fetchFn }) {
    if (!input) {
        return emptyDefault;
    }
    if (typeof input === 'string') {
        input = { id: input, [nameKey]: '' };
    }
    const id = input.id || input[idAlias] || '';
    let name = input[nameKey] || '';
    if (id && !name) {
        try {
            const args = await fetchFn(id);
            name = args?.ref?.[nameKey] || name;
            return { ...args.ref, id, [nameKey]: name };
        } catch {
            return { ...input, id, [nameKey]: name };
        }
    }
    return { ...input, id, [nameKey]: name };
}

export { resolveRef };
