/**
 * Predefined color palette for user-defined avatar tags.
 * Colors are derived from the app's theme primary colors (oklch).
 * - `bg`: low-opacity background for badge display
 * - `text`: foreground text color for readability
 */
export const TAG_COLORS = Object.freeze([
    {
        name: 'default',
        label: 'Default',
        bg: 'oklch(0.4 0 0 / 0.2)',
        text: 'oklch(0.7 0 0)'
    },
    {
        name: 'blue',
        label: 'Blue',
        bg: 'oklch(0.488 0.243 264 / 0.2)',
        text: 'oklch(0.65 0.2 264)'
    },
    {
        name: 'green',
        label: 'Green',
        bg: 'oklch(0.648 0.2 132 / 0.2)',
        text: 'oklch(0.7 0.18 132)'
    },
    {
        name: 'orange',
        label: 'Orange',
        bg: 'oklch(0.646 0.222 41 / 0.2)',
        text: 'oklch(0.72 0.19 41)'
    },
    {
        name: 'red',
        label: 'Red',
        bg: 'oklch(0.577 0.245 27 / 0.2)',
        text: 'oklch(0.68 0.2 27)'
    },
    {
        name: 'rose',
        label: 'Rose',
        bg: 'oklch(0.586 0.253 18 / 0.2)',
        text: 'oklch(0.7 0.2 18)'
    },
    {
        name: 'violet',
        label: 'Violet',
        bg: 'oklch(0.541 0.281 293 / 0.2)',
        text: 'oklch(0.68 0.22 293)'
    },
    {
        name: 'yellow',
        label: 'Yellow',
        bg: 'oklch(0.852 0.199 92 / 0.2)',
        text: 'oklch(0.82 0.17 92)'
    }
]);

/**
 * Deterministically map a tag name to a color from the palette.
 * Uses djb2 hash so the same tag always gets the same color.
 */
export function getTagColor(tagName) {
    let hash = 5381;
    for (let i = 0; i < tagName.length; i++) {
        hash = ((hash << 5) + hash + tagName.charCodeAt(i)) >>> 0;
    }
    // skip index 0 (default gray), use indices 1..length-1
    const index = (hash % (TAG_COLORS.length - 1)) + 1;
    return TAG_COLORS[index];
}
