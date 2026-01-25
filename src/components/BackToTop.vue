<script setup>
    import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
    import { ArrowUp } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';

    const props = defineProps({
        // scroll DOM ref
        target: { type: [String, Object], default: null },
        // @tanstack/virtual instance
        virtualizer: { type: [Object], default: null },

        bottom: { type: Number, default: 20 },
        right: { type: Number, default: 20 },

        visibilityHeight: { type: Number, default: 400 },

        behavior: {
            type: String,
            default: 'smooth',
            validator: (value) => value === 'auto' || value === 'smooth'
        },

        tooltip: { type: Boolean, default: true },
        tooltipText: { type: String, default: 'Back to top' },

        teleport: { type: Boolean, default: true },
        teleportTo: { type: [Boolean, String, Object], default: null }
    });

    const visible = ref(false);
    let containerEl = null;

    function resolveElement(target) {
        if (!target) return null;
        if (typeof target === 'string') return document.querySelector(target);
        if (typeof target === 'object') {
            if ('value' in target) return target.value;
            if ('$el' in target) return target.$el;
        }
        return target;
    }

    function getVirtualizer() {
        if (!props.virtualizer) return null;
        return 'value' in props.virtualizer ? props.virtualizer.value : props.virtualizer;
    }

    function getScrollTop() {
        if (!containerEl || typeof containerEl.scrollTop !== 'number') {
            return window.scrollY || document.documentElement.scrollTop || 0;
        }
        return containerEl.scrollTop || 0;
    }

    function handleScroll() {
        visible.value = getScrollTop() >= props.visibilityHeight;
    }

    function scrollToTop() {
        const behavior = props.behavior === 'auto' ? 'auto' : 'smooth';
        const v = getVirtualizer();
        if (v?.scrollToIndex) {
            v.scrollToIndex(0, { align: 'start', behavior: 'auto' });
            return;
        }
        const target = containerEl || resolveElement(props.target);
        if (target && typeof target.scrollTo === 'function') {
            target.scrollTo({ top: 0, behavior });
            return;
        }
        window.scrollTo({ top: 0, behavior });
    }

    function bind() {
        containerEl = resolveElement(props.target);

        const target = containerEl && typeof containerEl.addEventListener === 'function' ? containerEl : window;
        target.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    function unbind() {
        const target = containerEl || window;
        target.removeEventListener('scroll', handleScroll);
    }

    onMounted(() => {
        bind();
    });

    watch(
        () => props.target,
        () => {
            unbind();
            bind();
        }
    );

    onBeforeUnmount(() => {
        unbind();
    });

    const teleportTarget = computed(() => {
        if (props.teleportTo !== null && props.teleportTo !== undefined) {
            if (props.teleportTo === true) return 'body';
            if (props.teleportTo === false) return null;
            return resolveElement(props.teleportTo);
        }
        return props.teleport ? 'body' : null;
    });

    const isBodyTeleport = computed(() => teleportTarget.value === 'body' || teleportTarget.value === document.body);

    const wrapperStyle = computed(
        () =>
            `position:${isBodyTeleport.value ? 'fixed' : 'absolute'}; right:${props.right}px; bottom:${props.bottom}px; z-index:50;`
    );
</script>

<template>
    <Teleport v-if="teleportTarget" :to="teleportTarget">
        <Transition name="back-to-top">
            <div v-if="visible" :style="wrapperStyle">
                <TooltipProvider v-if="tooltip">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button
                                size="icon"
                                variant="secondary"
                                class="rounded-full shadow"
                                aria-label="Back to top"
                                @click="scrollToTop">
                                <ArrowUp class="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {{ tooltipText }}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Button
                    v-else
                    size="icon"
                    variant="secondary"
                    class="rounded-full shadow"
                    aria-label="Back to top"
                    @click="scrollToTop">
                    <ArrowUp class="h-4 w-4" />
                </Button>
            </div>
        </Transition>
    </Teleport>

    <Transition v-else name="back-to-top">
        <div v-if="visible" :style="wrapperStyle">
            <TooltipProvider v-if="tooltip">
                <Tooltip>
                    <TooltipTrigger as-child>
                        <Button
                            size="icon"
                            variant="secondary"
                            class="rounded-full shadow"
                            aria-label="Back to top"
                            @click="scrollToTop">
                            <ArrowUp class="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        {{ tooltipText }}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Button
                v-else
                size="icon"
                variant="secondary"
                class="rounded-full shadow"
                aria-label="Back to top"
                @click="scrollToTop">
                <ArrowUp class="h-4 w-4" />
            </Button>
        </div>
    </Transition>
</template>

<style scoped>
    .back-to-top-enter-active,
    .back-to-top-leave-active {
        transition:
            opacity 160ms ease,
            transform 160ms ease;
    }

    .back-to-top-enter-from,
    .back-to-top-leave-to {
        opacity: 0;
        transform: translateY(6px);
    }

    .back-to-top-enter-to,
    .back-to-top-leave-from {
        opacity: 1;
        transform: translateY(0);
    }

    @media (prefers-reduced-motion: reduce) {
        .back-to-top-enter-active,
        .back-to-top-leave-active {
            transition: none;
        }
    }
</style>
