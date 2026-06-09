<template>
    <Dialog :open="true" @update:open="(open) => !open && $emit('close')">
        <DialogContent class="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{{ t('view.tools.formula_search.formula_search_help') }}</DialogTitle>
            </DialogHeader>
            <div class="space-y-4 overflow-y-auto max-h-[68vh] pr-2">
                <section class="space-y-2">
                    <p class="text-sm text-muted-foreground">
                        {{ t('view.tools.formula_search.note_equals_prefix') }}
                    </p>
                </section>
                <section class="space-y-2">
                    <h3 class="text-lg font-bold border-b pb-1">{{ t('view.tools.formula_search.syntax') }}</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=name=Alice</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_field_value') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=name!=Bob</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_field_not_value') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=name=Alice &amp; type=GPS</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_and') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=name=Alice | name=Bob</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_or') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=type!=Offline &amp; (name=Alice | name=Bob)</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_grouping') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=name=[Alice,Bob,Charlie]</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_array') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=type!=Offline</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_not') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">="Hello World"</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.syntax_quoted') }}</div>
                        </div>
                    </div>
                </section>

                <section class="space-y-2">
                    <h3 class="text-lg font-bold border-b pb-1">{{ t('view.tools.formula_search.time_format_details') }}</h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=time=2026/01/23 12:34:56</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.time_full_format') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=time=2026/01/23 12</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.time_hour') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=time>2026/01</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.time_after_month', { month: '1', nextMonth: '2' }) }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=time&lt;=2026/01/23</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.time_le') }}</div>
                        </div>
                        <div class="flex gap-3 items-start">
                            <div class="font-mono bg-secondary p-1 rounded w-56 flex-shrink-0">=time=2026/01/01~2026/01/23</div>
                            <div class="text-muted-foreground">{{ t('view.tools.formula_search.example_time_range') }}</div>
                        </div>
                    </div>
                    <p class="text-xs text-muted-foreground mt-2">
                        {{ t('view.tools.formula_search.time_format_note') }}
                    </p>
                </section>

                <section class="space-y-2">
                    <h3 class="text-lg font-bold border-b pb-1">{{ t('view.tools.formula_search.practical_examples') }}</h3>
                    <div class="space-y-2 text-sm">
                        <div class="bg-secondary p-2 rounded">
                            <div class="font-mono">=type!=Offline &amp; (name=Alice | name=Bob)</div>
                            <p class="text-xs text-muted-foreground mt-1">
                                {{ t('view.tools.formula_search.example_alice_bob_online') }}
                            </p>
                        </div>
                        <div class="bg-secondary p-2 rounded">
                            <div class="font-mono">=world="Test World" &amp; time>2024/04/01</div>
                            <p class="text-xs text-muted-foreground mt-1">
                                {{ t('view.tools.formula_search.example_test_world_after') }}
                            </p>
                        </div>
                        <div class="bg-secondary p-2 rounded">
                            <div class="font-mono">=type!=GPS &amp; time=2024/04/20~2024/04/26</div>
                            <p class="text-xs text-muted-foreground mt-1">
                                {{ t('view.tools.formula_search.example_no_gps_range') }}
                            </p>
                        </div>
                        <div class="bg-secondary p-2 rounded">
                            <div class="font-mono">=name=[Alice,Bob,Charlie] &amp; type=Join</div>
                            <p class="text-xs text-muted-foreground mt-1">
                                {{ t('view.tools.formula_search.example_name_join') }}
                            </p>
                        </div>
                        <div class="bg-secondary p-2 rounded">
                            <div class="font-mono">=bio="Test bio" | avatar="TestAvatar"</div>
                            <p class="text-xs text-muted-foreground mt-1">
                                {{ t('view.tools.formula_search.example_bio_avatar') }}
                            </p>
                        </div>
                    </div>
                </section>

                <section class="space-y-2">
                    <h3 class="text-lg font-bold border-b pb-1">{{ t('view.tools.formula_search.special_queries') }}</h3>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>
                            <code class="bg-secondary px-1 rounded">wrld_xxx</code>:
                            {{ t('view.tools.formula_search.query_world') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">grp_xxx</code>:
                            {{ t('view.tools.formula_search.query_group') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">usr_xxx</code>:
                            {{ t('view.tools.formula_search.query_user') }}
                        </li>
                    </ul>
                </section>

                <section class="space-y-2">
                    <h3 class="text-lg font-bold border-b pb-1">{{ t('view.tools.formula_search.available_fields') }}</h3>
                    <ul class="list-disc list-inside space-y-1 text-sm">
                        <li>
                            <code class="bg-secondary px-1 rounded">name</code>:
                            {{ t('view.tools.formula_search.field_name') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">world</code>:
                            {{ t('view.tools.formula_search.field_world') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">location</code> /
                            <code class="bg-secondary px-1 rounded">wrld</code>:
                            {{ t('view.tools.formula_search.field_world_id') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">usr</code>:
                            {{ t('view.tools.formula_search.field_user_id') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">status</code>:
                            {{ t('view.tools.formula_search.field_status') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">avatar</code>:
                            {{ t('view.tools.formula_search.field_avatar') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">bio</code>:
                            {{ t('view.tools.formula_search.field_bio') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">group</code>:
                            {{ t('view.tools.formula_search.field_group') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">type</code>:
                            {{ t('view.tools.formula_search.field_type') }}
                        </li>
                        <li>
                            <code class="bg-secondary px-1 rounded">time</code>:
                            {{ t('view.tools.formula_search.field_time') }}
                        </li>
                    </ul>
                </section>
            </div>
            <DialogFooter>
                <Button @click="$emit('close')">
                    {{ t('common.actions.close') }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

<script setup>
    import { useI18n } from 'vue-i18n';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';

    const { t } = useI18n();

    defineEmits(['close']);
</script>
