export const NAV_LAYOUT_UPDATED_EVENT = 'vrcx:nav-layout-updated';

export function dispatchNavLayoutUpdated() {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new CustomEvent(NAV_LAYOUT_UPDATED_EVENT));
}
