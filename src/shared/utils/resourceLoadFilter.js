/**
 * Compile raw, case-sensitive JavaScript regex patterns; blank rows are ignored.
 *
 * @param {string[]} patterns
 */
export function compileResourceLoadFilters(patterns) {
    return patterns.map((pattern) => {
        if (!pattern.trim()) return { regex: null, error: '' };
        try {
            return { regex: new RegExp(pattern), error: '' };
        } catch (error) {
            return { regex: null, error: String(error.message) };
        }
    });
}

/**
 * Only resource-load URLs are eligible for exclusion.
 *
 * @param {{ type: string; resourceUrl?: string }} row
 * @param {{ regex: RegExp | null }[]} filters
 */
export function isResourceLoadExcluded(row, filters) {
    return (
        (row.type === 'StringLoad' || row.type === 'ImageLoad') &&
        typeof row.resourceUrl === 'string' &&
        filters.some(({ regex }) => regex?.test(row.resourceUrl))
    );
}
