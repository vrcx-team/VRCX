<script setup>
    import { ListboxFilter, useForwardProps } from 'reka-ui';
    import { Search } from 'lucide-vue-next';
    import { cn } from '@/lib/utils';
    import { reactiveOmit } from '@vueuse/core';

    import { useCommand } from '.';

    defineOptions({
        inheritAttrs: false
    });

    const props = defineProps({
        modelValue: { type: String, required: false },
        autoFocus: { type: Boolean, required: false },
        disabled: { type: Boolean, required: false },
        asChild: { type: Boolean, required: false },
        as: { type: null, required: false },
        class: { type: null, required: false }
    });

    const delegatedProps = reactiveOmit(props, 'class');

    const forwardedProps = useForwardProps(delegatedProps);

    const { filterState } = useCommand();
</script>

<template>
    <div data-slot="command-input-wrapper" class="flex h-9 items-center gap-2 border-b px-3">
        <Search class="size-4 shrink-0 opacity-50" />
        <ListboxFilter
            v-bind="{ ...forwardedProps, ...$attrs }"
            v-model="filterState.search"
            data-slot="command-input"
            auto-focus
            :class="
                cn(
                    'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
                    props.class
                )
            " />
    </div>
</template>
