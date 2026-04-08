import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { h, render } from 'vue';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Renders a Vue component to a static HTML string.
 */
export function vueToHtml(component, props = {}, children = null) {
    const container = document.createElement('div');
    const vnode = h(component, props, children);
    render(vnode, container);
    return container.innerHTML;
}
