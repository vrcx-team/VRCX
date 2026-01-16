<script setup>
    import { defaultDocument, useEventListener, useMediaQuery, useVModel } from '@vueuse/core';
    import { computed, ref } from 'vue';
    import { TooltipProvider } from 'reka-ui';
    import { cn } from '@/lib/utils';

    import {
        SIDEBAR_COOKIE_MAX_AGE,
        SIDEBAR_COOKIE_NAME,
        SIDEBAR_KEYBOARD_SHORTCUT,
        SIDEBAR_WIDTH,
        SIDEBAR_WIDTH_ICON,
        provideSidebarContext
    } from './utils';

    const props = defineProps({
        defaultOpen: {
            type: Boolean,
            default: () => !defaultDocument?.cookie.includes(`${SIDEBAR_COOKIE_NAME}=false`)
        },
        open: {
            type: Boolean,
            default: undefined
        },
        width: {
            type: [String, Number],
            default: undefined
        },
        widthIcon: {
            type: [String, Number],
            default: undefined
        },
        class: {
            type: [String, Array, Object],
            default: undefined
        }
    });

    const emits = defineEmits(['update:open']);

    const isMobile = useMediaQuery('(max-width: 768px)');
    const openMobile = ref(false);

    let open;
    if (props.open === undefined) {
        open = useVModel(props, 'open', emits, {
            defaultValue: props.defaultOpen ?? false,
            passive: true
        });
    } else {
        open = useVModel(props, 'open', emits, {
            defaultValue: props.defaultOpen ?? false,
            passive: false
        });
    }

    function setOpen(value) {
        open.value = value; // emits('update:open', value)

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    }

    function setOpenMobile(value) {
        openMobile.value = value;
    }

    // Helper to toggle the sidebar.
    function toggleSidebar() {
        return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value);
    }

    useEventListener('keydown', (event) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            toggleSidebar();
        }
    });

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = computed(() => (open.value ? 'expanded' : 'collapsed'));

    const normalizeCssSize = (value) => {
        if (value === null || value === undefined) {
            return undefined;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            return `${value}px`;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            return trimmed || undefined;
        }
        return undefined;
    };

    const cssSidebarWidth = computed(() => normalizeCssSize(props.width) ?? SIDEBAR_WIDTH);
    const cssSidebarWidthIcon = computed(() => normalizeCssSize(props.widthIcon) ?? SIDEBAR_WIDTH_ICON);

    provideSidebarContext({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar
    });
</script>

<template>
    <TooltipProvider :delay-duration="0">
        <div
            data-slot="sidebar-wrapper"
            :style="{
                '--sidebar-width': cssSidebarWidth,
                '--sidebar-width-icon': cssSidebarWidthIcon
            }"
            :class="cn('group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full', props.class)"
            v-bind="$attrs">
            <slot />
        </div>
    </TooltipProvider>
</template>
