import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { h, isVNode, render } from 'vue';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Turn a sth into a vnode (nonconsentually)
 * stolen from here: https://github.com/TanStack/table/blob/70dbd624e5866ec56e10ba0659749e9bb3de9a92/packages/vue-table/src/FlexRender.ts#L12
 */
function toVNode(renderable, props) {
  if (typeof renderable === 'function') {
    const rendered = renderable(props)

    if (isVNode(rendered)) {
      return rendered
    }

    if (typeof rendered === 'function' || typeof rendered === 'object') {
      return h(rendered, props)
    }

    return rendered
  }

  if (typeof renderable === 'object') {
    return h(renderable, props)
  }

  return renderable
}

/**
 * Renders sth into raw html. Could be a component, jsx, a primitive what ever `h` does not choke on
 */
export function renderToHtml(renderable, props) {
    const container = document.createElement('div');
    const vnode = toVNode(renderable, props);
    // if vnode is null, this whill clean up the container: https://github.com/vuejs/core/blob/cb3d01416c8bdcde5b8497937b87caf201704182/packages/runtime-core/src/renderer.ts#L2400-L2404
    render(vnode, container);
    return container.innerHTML;

}
