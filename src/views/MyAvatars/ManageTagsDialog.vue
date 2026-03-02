<template>
    <Dialog v-model:open="dialogOpen">
        <DialogContent class="x-dialog sm:max-w-110">
            <DialogHeader>
                <DialogTitle>{{ t('dialog.avatar.actions.manage_tags') }}</DialogTitle>
                <DialogDescription>{{ avatarName }}</DialogDescription>
            </DialogHeader>

            <p class="text-xs text-muted-foreground">{{ t('dialog.avatar.actions.manage_tags_hint') }}</p>
            <TagsInput v-model="tagNames" :delimiter="','" add-on-blur class="mt-1">
                <template v-for="entry in tagEntries" :key="entry.tag">
                    <Popover>
                        <PopoverTrigger as-child>
                            <TagsInputItem
                                :value="entry.tag"
                                class="cursor-pointer"
                                :style="{
                                    backgroundColor: resolveColor(entry).bg,
                                    color: resolveColor(entry).text
                                }">
                                <TagsInputItemText />
                                <TagsInputItemDelete />
                            </TagsInputItem>
                        </PopoverTrigger>
                        <PopoverContent class="w-auto p-2" side="top" :side-offset="8">
                            <div class="flex items-center gap-1.5">
                                <button
                                    v-for="color in TAG_COLORS"
                                    :key="color.name"
                                    type="button"
                                    class="h-4 w-4 shrink-0 rounded-sm transition-transform hover:scale-125"
                                    :class="
                                        isColorSelected(entry, color)
                                            ? 'ring-1 ring-ring ring-offset-1 ring-offset-background'
                                            : ''
                                    "
                                    :style="{ backgroundColor: color.bg.replace('/ 0.2)', '/ 1)') }"
                                    :title="color.label"
                                    @click="setEntryColor(entry, color)" />
                            </div>
                        </PopoverContent>
                    </Popover>
                </template>

                <TagsInputInput :placeholder="t('dialog.avatar.actions.manage_tags_placeholder')" />
            </TagsInput>

            <DialogFooter>
                <Button variant="secondary" class="mr-2" @click="dialogOpen = false">
                    {{ t('prompt.rename_avatar.cancel') }}
                </Button>
                <Button @click="save">
                    {{ t('prompt.rename_avatar.ok') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import {
        TagsInput,
        TagsInputInput,
        TagsInputItem,
        TagsInputItemDelete,
        TagsInputItemText
    } from '@/components/ui/tags-input';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { computed, ref, watch } from 'vue';
    import { TAG_COLORS, getTagColor } from '@/shared/constants';
    import { Button } from '@/components/ui/button';
    import { useI18n } from 'vue-i18n';

    const props = defineProps({
        open: { type: Boolean, default: false },
        avatarName: { type: String, default: '' },
        avatarId: { type: String, default: '' },
        initialTags: { type: Array, default: () => [] }
    });

    const emit = defineEmits(['update:open', 'save']);

    const { t } = useI18n();

    const dialogOpen = computed({
        get: () => props.open,
        set: (val) => emit('update:open', val)
    });

    const tagEntries = ref([]);

    const tagNames = computed({
        get: () => tagEntries.value.map((e) => e.tag),
        set: (names) => {
            const existingMap = Object.fromEntries(tagEntries.value.map((e) => [e.tag, e]));
            tagEntries.value = names.map((name) => existingMap[name] || { tag: name, color: null });
        }
    });

    watch(
        () => props.open,
        (isOpen) => {
            if (isOpen) {
                tagEntries.value = props.initialTags.map((entry) => ({ ...entry }));
            }
        }
    );

    function resolveColor(entry) {
        if (entry.color) {
            return {
                bg: entry.color,
                text: typeof entry.color === 'string' ? entry.color.replace(/\/ [\d.]+\)$/, ')') : entry.color
            };
        }
        return getTagColor(entry.tag);
    }

    function isColorSelected(entry, color) {
        if (entry.color) {
            return entry.color === color.bg;
        }
        const hashColor = getTagColor(entry.tag);
        return hashColor.name === color.name;
    }

    function setEntryColor(entry, color) {
        const hashColor = getTagColor(entry.tag);
        entry.color = hashColor.name === color.name ? null : color.bg;
    }

    function save() {
        emit('save', {
            avatarId: props.avatarId,
            tags: tagEntries.value.map((e) => ({ tag: e.tag, color: e.color }))
        });
        dialogOpen.value = false;
    }
</script>
