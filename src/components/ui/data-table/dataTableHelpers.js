/**
 * Pure helper functions for DataTableLayout.
 * Extracted for testability.
 */

/**
 * @param {object} col - TanStack column instance
 * @returns {boolean}
 */
export function isSpacer(col) {
    return col?.id === '__spacer';
}

/**
 * @param {object} col - TanStack column instance
 * @returns {boolean}
 */
export function isStretch(col) {
    return !!col?.columnDef?.meta?.stretch;
}

/**
 * Resolves a column's display label for the visibility menu.
 * Supports both string and function labels (for lazy i18n).
 * @param {object} col - TanStack column instance
 * @returns {string}
 */
export function resolveHeaderLabel(col) {
    const label = col?.columnDef?.meta?.label;
    if (typeof label === 'function') return label();
    return label ?? col?.id ?? '';
}

/**
 * Filters columns to determine which are toggleable in the visibility menu.
 * @param {Array} cols - Array of TanStack column instances
 * @returns {Array}
 */
export function getToggleableColumns(cols) {
    if (!Array.isArray(cols)) return [];
    return cols.filter((col) => {
        if (isSpacer(col)) return false;
        if (col.columnDef?.meta?.disableVisibilityToggle) return false;
        if (!col.columnDef?.meta?.label) return false;
        return true;
    });
}

/**
 * Computes the style object for a column's <col> element.
 * @param {object} col - TanStack column instance
 * @returns {object|null}
 */
export function getColStyle(col) {
    if (isSpacer(col)) return { width: '0px' };
    if (isStretch(col)) return null;

    const size = col?.getSize?.();
    if (!Number.isFinite(size)) return null;
    return { width: `${size}px` };
}

/**
 * Determines if a header can be reordered via drag-and-drop.
 * @param {object} header - TanStack header instance
 * @param {function} getPinnedState - function to check if column is pinned
 * @returns {boolean}
 */
export function isReorderable(header, getPinnedState) {
    const col = header?.column;
    if (!col) return false;
    if (isSpacer(col)) return false;
    if (!col.columnDef?.meta?.label) return false;
    if (getPinnedState?.(col)) return false;
    if (col.columnDef?.meta?.disableReorder) return false;
    return true;
}
