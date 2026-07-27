<template>
    <div class="x-container" style="height: 100%; display: flex; flex-direction: column">
        <!-- Header -->
        <div class="mb-4">
            <h2 class="text-lg font-semibold mb-2">{{ t('view.friend_insight.header') }}</h2>
            <p class="text-sm text-muted-foreground">{{ t('view.friend_insight.description') }}</p>
        </div>

        <div class="flex gap-4 flex-1" style="min-height: 0">
            <!-- Left sidebar -->
            <div class="w-72 shrink-0 flex flex-col gap-4">
                <!-- Friend search -->
                <div class="relative" ref="searchContainer">
                    <label class="text-sm font-medium">{{ t('view.friend_insight.select_friends') }}</label>
                    <div class="mt-1 relative">
                        <Search class="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                            ref="searchInput"
                            v-model="searchQuery"
                            type="text"
                            class="flex h-8 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
                            :placeholder="t('view.friend_insight.select_friends_placeholder')"
                            @focus="showDropdown = true"
                            @blur="handleSearchBlur" />
                    </div>

                    <!-- Dropdown -->
                    <div
                        v-if="showDropdown && (searchQuery || filteredFriends.length)"
                        class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                        <div
                            v-if="!filteredFriends.length"
                            class="px-3 py-2 text-xs text-muted-foreground">
                            {{ t('view.friend_insight.no_friends_found') }}
                        </div>
                        <div
                            v-for="friend in filteredFriends"
                            :key="friend.userId"
                            class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent text-sm"
                            @mousedown.prevent="toggleFriend(friend.userId)">
                            <div
                                class="h-4 w-4 shrink-0 rounded border border-primary/40 flex items-center justify-center"
                                :class="{ 'bg-primary border-primary': selectedFriendIds.includes(friend.userId) }">
                                <Check v-if="selectedFriendIds.includes(friend.userId)" class="h-3 w-3 text-primary-foreground" />
                            </div>
                            <span class="truncate">{{ friend.displayName }}</span>
                            <span class="text-xs text-muted-foreground ml-auto shrink-0">{{ friend.trustLevel }}</span>
                        </div>
                    </div>

                    <!-- Selected count -->
                    <div v-if="selectedFriends.length" class="mt-1 text-xs text-muted-foreground">
                        {{ t('view.friend_insight.selected_count', { count: selectedFriends.length }) }}
                    </div>
                </div>

                <!-- Selected friend chips -->
                <div v-if="selectedFriends.length" class="flex flex-wrap gap-1">
                    <span
                        v-for="friend in selectedFriends"
                        :key="friend.userId"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-primary/10 text-primary group">
                        {{ friend.displayName }}
                        <button
                            class="h-3.5 w-3.5 rounded-full hover:bg-primary/30 inline-flex items-center justify-center"
                            @click="removeFriend(friend.userId)">
                            <X class="h-3 w-3" />
                        </button>
                    </span>
                </div>

                <div>
                    <label class="text-sm font-medium">{{ t('view.friend_insight.time_range') }}</label>
                    <Select :model-value="timeRange" @update:modelValue="handleTimeRangeChange">
                        <SelectTrigger class="mt-1 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="7d">{{ t('view.friend_insight.last_7_days') }}</SelectItem>
                                <SelectItem value="30d">{{ t('view.friend_insight.last_30_days') }}</SelectItem>
                                <SelectItem value="90d">{{ t('view.friend_insight.last_90_days') }}</SelectItem>
                                <SelectItem value="all">{{ t('view.friend_insight.all_time') }}</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label class="text-sm font-medium">{{ t('view.friend_insight.preset_questions') }}</label>
                    <div class="mt-1 flex flex-col gap-1">
                        <Button
                            v-for="preset in presets"
                            :key="preset.question"
                            size="sm"
                            variant="ghost"
                            class="justify-start text-left h-auto py-2"
                            :disabled="!selectedFriends.length || loading"
                            @click="askQuestion(preset.question)">
                            {{ preset.label }}
                        </Button>
                    </div>
                </div>

                <div class="mt-auto">
                    <Button
                        size="sm"
                        variant="outline"
                        class="w-full"
                        @click="showDataPreview = !showDataPreview">
                        <Eye class="h-3.5 w-3.5 mr-1.5" />
                        {{ showDataPreview ? t('view.friend_insight.hide_data_preview') : t('view.friend_insight.show_data_preview') }}
                    </Button>
                </div>
            </div>

            <!-- Main chat area -->
            <div class="flex-1 flex flex-col" style="min-height: 0">
                <div v-if="messages.length" class="flex items-center justify-between mb-2">
                    <span class="text-xs text-muted-foreground">{{ t('view.friend_insight.message_count', { count: messages.length }) }}</span>
                    <Button
                        size="sm"
                        variant="ghost"
                        class="text-xs text-muted-foreground hover:text-destructive"
                        :disabled="loading"
                        @click="clearConversation">
                        <Trash2 class="h-3.5 w-3.5 mr-1" />
                        {{ t('view.friend_insight.clear') }}
                    </Button>
                </div>
                <div ref="chatContainer" class="flex-1 overflow-y-auto mb-3 space-y-3 pr-2">
                    <!-- Not configured prompt -->
                    <div v-if="!isConfigured && !messages.length && !loading" class="text-center py-12">
                        <Settings2 class="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p class="text-sm text-muted-foreground mb-4">{{ t('view.friend_insight.not_configured') }}</p>
                        <Button variant="outline" size="sm" @click="goToSettings">
                            <Settings2 class="h-4 w-4 mr-1.5" />
                            {{ t('view.friend_insight.go_to_settings') }}
                        </Button>
                    </div>

                    <!-- Normal empty state -->
                    <div v-else-if="!messages.length && !loading" class="text-center text-muted-foreground py-12">
                        <Brain class="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>{{ t('view.friend_insight.empty_state') }}</p>
                    </div>

                    <template v-for="(msg, i) in messages" :key="i">
                        <!-- User message -->
                        <div
                            v-if="msg.role === 'user'"
                            class="rounded-lg p-3 max-w-[85%] bg-primary text-primary-foreground ml-auto">
                            <div class="text-sm whitespace-pre-wrap">{{ msg.content }}</div>
                        </div>

                        <!-- Assistant message with timeline -->
                        <div
                            v-else-if="msg.role === 'assistant'"
                            class="rounded-lg p-3 max-w-[85%] bg-muted"
                            style="content-visibility: auto; contain-intrinsic-size: auto 200px">
                            <template v-for="(item, ti) in msg.timeline" :key="ti">
                                <!-- Thinking block -->
                                <details v-if="item.type === 'thinking'" class="mb-2">
                                    <summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                        <Brain class="h-3 w-3 inline mr-1" />
                                        {{ t('view.friend_insight.thinking_title') }}
                                    </summary>
                                    <div
                                        class="mt-2 p-2 rounded bg-muted-foreground/10 text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto"
                                        :ref="(el) => { if (el && item._scrollTo) { el.scrollTop = el.scrollHeight; item._scrollTo = false; } }">
                                        {{ item.text }}
                                    </div>
                                </details>

                                <!-- Pre-tool draft -->
                                <details v-else-if="item.type === 'draft'" class="mb-2">
                                    <summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors opacity-70">
                                        <FileText class="h-3 w-3 inline mr-1" />
                                        {{ t('view.friend_insight.draft') }}
                                    </summary>
                                    <div class="mt-2 p-2 rounded bg-muted-foreground/10 text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto opacity-70">
                                        {{ item.text }}
                                    </div>
                                </details>

                                <!-- Tool call -->
                                <div v-else-if="item.type === 'tool'" class="rounded bg-muted-foreground/10 p-2 mb-2">
                                    <details>
                                        <summary class="text-xs cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                                            <Wrench v-if="item._done" class="h-3 w-3 text-green-500" />
                                            <Loader2 v-else class="h-3 w-3 animate-spin" />
                                            <span class="font-mono">{{ item.name }}</span>
                                            <span v-if="item._done" class="text-green-500">✓</span>
                                        </summary>
                                        <div class="mt-1 text-xs text-muted-foreground">
                                            <div v-if="item._args" class="mb-1">
                                                <span class="font-semibold">{{ t('view.friend_insight.tool_args') }}:</span>
                                                <pre class="mt-0.5 text-xs overflow-x-auto">{{ JSON.stringify(item._args, null, 2) }}</pre>
                                            </div>
                                            <div v-if="item._result">
                                                <span class="font-semibold">{{ t('view.friend_insight.tool_result') }}:</span>
                                                <pre class="mt-0.5 text-xs overflow-x-auto max-h-32">{{ JSON.stringify(item._result, null, 2) }}</pre>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                                <!-- Content -->
                                <div
                                    v-else-if="item.type === 'content' && msg.html"
                                    class="markdown-body text-sm"
                                    v-html="msg.html"
                                    @click="handleMarkdownClick" />
                            </template>

                            <!-- Fallback: no timeline (legacy) -->
                            <div
                                v-if="!msg.timeline?.length && msg.html"
                                class="markdown-body text-sm"
                                v-html="msg.html"
                                @click="handleMarkdownClick" />
                            <div
                                v-else-if="!msg.timeline?.length && msg.content"
                                class="text-sm whitespace-pre-wrap">
                                {{ msg.content }}
                            </div>
                        </div>
                    </template>

                    <!-- Streaming timeline -->
                    <div v-if="streamingMsg" class="rounded-lg p-3 max-w-[85%] bg-muted">
                        <template v-for="(item, ti) in streamingMsg.timeline" :key="ti">
                            <!-- Thinking block -->
                            <details v-if="item.type === 'thinking'" class="mb-2" :open="!item._done">
                                <summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                    <Brain class="h-3 w-3 inline mr-1" />
                                    {{ t('view.friend_insight.thinking_title') }}
                                </summary>
                                <div
                                    class="mt-2 p-2 rounded bg-muted-foreground/10 text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto"
                                    :ref="(el) => { if (el && item._scrollTo) { el.scrollTop = el.scrollHeight; item._scrollTo = false; } }">
                                    {{ item.text }}
                                </div>
                            </details>

                            <!-- Pre-tool draft -->
                            <details v-else-if="item.type === 'draft'" class="mb-2">
                                <summary class="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors opacity-70">
                                    <FileText class="h-3 w-3 inline mr-1" />
                                    {{ t('view.friend_insight.draft') }}
                                </summary>
                                <div class="mt-2 p-2 rounded bg-muted-foreground/10 text-xs text-muted-foreground whitespace-pre-wrap max-h-60 overflow-y-auto opacity-70">
                                    {{ item.text }}
                                </div>
                            </details>

                            <!-- Tool call -->
                            <div v-else-if="item.type === 'tool'" class="rounded bg-muted-foreground/10 p-2 mb-2">
                                <details :open="!item._done">
                                    <summary class="text-xs cursor-pointer hover:text-foreground transition-colors flex items-center gap-1">
                                        <Loader2 v-if="!item._done" class="h-3 w-3 animate-spin" />
                                        <Wrench v-else class="h-3 w-3 text-green-500" />
                                        <span class="font-mono">{{ item.name }}</span>
                                        <span v-if="item._done" class="text-green-500">✓</span>
                                    </summary>
                                    <div class="mt-1 text-xs text-muted-foreground">
                                        <pre class="mt-0.5 text-xs overflow-x-auto max-h-32">{{ JSON.stringify(item._result || item._args, null, 2) }}</pre>
                                    </div>
                                </details>
                            </div>

                            <!-- Content (DOM-ref for performance) -->
                            <div
                                v-else-if="item.type === 'content'"
                                :ref="(el) => { streamContentDom = el }"
                                class="text-sm whitespace-pre-wrap streaming-cursor"></div>
                        </template>

                        <!-- Loading spinner if no timeline items yet -->
                        <div v-if="!streamingMsg.timeline?.length" class="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 class="h-4 w-4 animate-spin" />
                            {{ t('view.friend_insight.thinking') }}
                        </div>
                    </div>

                    <!-- Error -->
                    <div v-if="error" class="rounded-lg p-3 bg-destructive/10 text-destructive">
                        <p class="text-sm">{{ error }}</p>
                    </div>
                </div>

                <!-- Data preview -->
                <div v-if="showDataPreview" class="mb-3 p-3 rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
                    <pre class="text-xs text-muted-foreground">{{ dataPreviewText }}</pre>
                </div>

                <!-- Input area -->
                <div class="flex gap-2">
                    <div class="flex-1">
                        <InputGroupField
                            v-model="currentQuestion"
                            :placeholder="t('view.friend_insight.question_placeholder')"
                            :disabled="loading"
                            @keydown.enter="askQuestion(currentQuestion)" />
                    </div>
                    <Button
                        :disabled="!currentQuestion.trim() || !selectedFriends.length || loading"
                        @click="askQuestion(currentQuestion)">
                        <Send class="h-4 w-4 mr-1.5" />
                        {{ t('view.friend_insight.ask') }}
                    </Button>
                    <Button
                        v-if="loading"
                        variant="outline"
                        @click="cancelRequest">
                        {{ t('view.friend_insight.stop') }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, markRaw, nextTick, onMounted, reactive, ref, shallowRef } from 'vue';
    import { useRouter } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import {
        Brain,
        Check,
        Eye,
        FileText,
        Loader2,
        Search,
        Send,
        Settings2,
        Trash2,
        Wrench,
        X
    } from 'lucide-vue-next';

    import { Button } from '@/components/ui/button';
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectTrigger,
        SelectValue
    } from '@/components/ui/select';
    import { InputGroupField } from '@/components/ui/input-group';
    import { useAdvancedSettingsStore } from '@/stores';
    import { database } from '@/services/database';

    const { t } = useI18n();
    const router = useRouter();
    const advancedSettingsStore = useAdvancedSettingsStore();

    const {
        friendInsightEnabled,
        friendInsightEndpoint,
        friendInsightApiKey,
        friendInsightModel,
        friendInsightAllowedDataTypes
    } = storeToRefs(advancedSettingsStore);

    // Friends
    const friends = ref([]);
    const selectedFriendIds = ref([]);
    const searchQuery = ref('');
    const showDropdown = ref(false);
    const timeRange = ref('30d');
    const showDataPreview = ref(false);
    const searchInput = ref(null);
    const searchContainer = ref(null);

    const filteredFriends = computed(() => {
        const query = searchQuery.value.toLowerCase().trim();
        if (!query) return friends.value.slice(0, 50);
        return friends.value.filter(
            (f) =>
                f.displayName.toLowerCase().includes(query) ||
                f.userId.toLowerCase().includes(query)
        ).slice(0, 50);
    });

    const isConfigured = computed(
        () =>
            friendInsightEnabled.value &&
            friendInsightEndpoint.value &&
            friendInsightModel.value
    );

    const selectedFriends = computed(() =>
        friends.value.filter((f) => selectedFriendIds.value.includes(f.userId))
    );

    // Chat state — shallowRef to avoid deep reactivity on large message objects
    const messages = shallowRef([]);
    const streamingMsg = ref(null);
    const currentQuestion = ref('');
    const loading = ref(false);
    const error = ref('');
    const chatContainer = ref(null);
    let streamContentDom = null;

    let abortController = null;

    const presets = [
        { label: t('view.friend_insight.preset_what_doing'), question: '{{friends}}这周都在做什么？' },
        { label: t('view.friend_insight.preset_online_frequency'), question: '{{friends}}最近30天的上线频率如何？' },
        { label: t('view.friend_insight.preset_status_changes'), question: '{{friends}}最近的状态变化有什么规律？' },
        { label: t('view.friend_insight.preset_relationship'), question: '我和{{friends}}的好友关系是什么时候建立的？' },
        { label: t('view.friend_insight.preset_same_world'), question: '{{friends}}最近是否常出现在相同世界？' }
    ];

    const dataPreviewText = computed(() => {
        if (!selectedFriends.value.length) {
            return t('view.friend_insight.no_data_selected');
        }
        const types = friendInsightAllowedDataTypes.value;
        return [
            t('view.friend_insight.data_preview_friends', { count: selectedFriends.value.length }),
            t('view.friend_insight.data_preview_types', { types: types.join(', ') }),
            t('view.friend_insight.data_preview_time', { range: timeRange.value })
        ].join('\n');
    });

    // ─── Markdown setup ─────────────────────────────────────────────
    marked.setOptions({
        gfm: true,
        breaks: true
    });

    function renderMarkdown(text) {
        if (!text) return '';
        try {
            const raw = marked.parse(text);
            return DOMPurify.sanitize(raw, {
                ALLOWED_TAGS: [
                    'p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol',
                    'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a',
                    'table', 'thead', 'tbody', 'tr', 'th', 'td',
                    'blockquote', 'hr', 'img', 'span', 'div'
                ],
                ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt']
            });
        } catch {
            return text;
        }
    }

    function handleMarkdownClick(event) {
        const link = event.target.closest('a');
        if (link?.href) {
            event.preventDefault();
            window.open(link.href, '_blank', 'noopener,noreferrer');
        }
    }

    // ─── Lifecycle ──────────────────────────────────────────────────
    onMounted(async () => {
        try {
            friends.value = await database.getFriendLogCurrent();
        } catch (err) {
            console.error('Failed to load friends list', err);
        }
    });

    // ─── Helpers ────────────────────────────────────────────────────
    function toggleFriend(userId) {
        const idx = selectedFriendIds.value.indexOf(userId);
        if (idx === -1) {
            selectedFriendIds.value.push(userId);
        } else {
            selectedFriendIds.value.splice(idx, 1);
        }
        // Clear search but keep focus and dropdown open
        searchQuery.value = '';
        searchInput.value?.focus();
    }

    function removeFriend(userId) {
        const idx = selectedFriendIds.value.indexOf(userId);
        if (idx !== -1) {
            selectedFriendIds.value.splice(idx, 1);
        }
    }

    function handleSearchBlur() {
        // Delay so mousedown on dropdown item fires before hiding
        setTimeout(() => {
            showDropdown.value = false;
        }, 150);
    }

    function handleTimeRangeChange(value) {
        timeRange.value = value;
    }

    function getTimeRangeISO() {
        if (timeRange.value === 'all') {
            return { from: undefined, to: undefined };
        }
        const days = parseInt(timeRange.value, 10);
        const to = new Date().toISOString();
        const from = new Date(Date.now() - days * 86400000).toISOString();
        return { from, to };
    }

    function buildQuestion(raw) {
        const names = selectedFriends.value.map((f) => f.displayName).join('、');
        return raw.replaceAll('{{friends}}', names || t('view.friend_insight.selected_friends'));
    }

    function scrollToBottom() {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    }

    let lastScrollTime = 0;
    function throttledScroll() {
        const now = performance.now();
        if (now - lastScrollTime > 80) {
            lastScrollTime = now;
            scrollToBottom();
        }
    }

    function cancelRequest() {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        loading.value = false;
        streamingMsg.value = null;
    }

    function clearConversation() {
        cancelRequest();
        messages.value = [];
        error.value = '';
    }

    function goToSettings() {
        router.push({ name: 'settings' });
    }

    function pushMessage(msg) {
        messages.value = [...messages.value, markRaw(msg)];
    }

    // ─── Ask question ───────────────────────────────────────────────
    async function askQuestion(raw) {
        const question = buildQuestion(raw || currentQuestion.value);
        if (!question.trim() || !selectedFriends.value.length) return;

        currentQuestion.value = '';
        error.value = '';
        loading.value = true;

        // Add user message
        pushMessage({
            role: 'user',
            content: question
        });

        // Initialize streaming placeholder
        let finalContent = '';
        let toolsStarted = false;
        streamingMsg.value = reactive({ timeline: [], _draftText: '' });

        await nextTick();
        scrollToBottom();

        const friendIds = selectedFriends.value.map((f) => f.userId);
        const timeRangeISO = getTimeRangeISO();
        abortController = new AbortController();

        // ── Direct-DOM content updates (performance) ────────────────
        let domDirty = false;
        function flushDOM() {
            if (!domDirty) return;
            domDirty = false;
            if (streamContentDom && finalContent) {
                streamContentDom.textContent = finalContent;
            }
            throttledScroll();
        }
        let flushRAF = 0;
        function scheduleFlush() {
            domDirty = true;
            if (!flushRAF) {
                flushRAF = requestAnimationFrame(() => {
                    flushRAF = 0;
                    flushDOM();
                });
            }
        }

        try {
            const { createFriendInsightAgent, createFriendInsightToolExecutor } =
                await import('@/services/friendInsightAgent');

            const allowedTypes = friendInsightAllowedDataTypes.value;

            const agent = createFriendInsightAgent({
                executeTool: createFriendInsightToolExecutor({
                    database,
                    allowedDataTypes: allowedTypes
                })
            });

            const contextualQuestion = [
                question,
                '',
                `[Context: friend IDs = ${friendIds.join(', ')}`,
                timeRangeISO.from ? `from = ${timeRangeISO.from}` : '',
                timeRangeISO.to ? `to = ${timeRangeISO.to}` : '',
                `allowed data types = ${allowedTypes.join(', ')}]`
            ].join(' ');

            await agent.askStream(
                {
                    config: {
                        endpoint: friendInsightEndpoint.value,
                        apiKey: friendInsightApiKey.value || undefined,
                        model: friendInsightModel.value
                    },
                    question: contextualQuestion,
                    history: buildConversationHistory()
                },
                {
                    onThinking(txt) {
                        if (!streamingMsg.value || toolsStarted) return;
                        const tl = streamingMsg.value.timeline;
                        const last = tl[tl.length - 1];
                        if (last?.type === 'thinking' && !last._done) {
                            last.text += txt;
                            last._scrollTo = true;
                        } else {
                            tl.push({
                                type: 'thinking',
                                text: txt,
                                _done: false,
                                _scrollTo: true
                            });
                        }
                        scheduleFlush();
                    },
                    onToken(txt) {
                        if (!streamingMsg.value) return;
                        finalContent += txt;
                        const tl = streamingMsg.value.timeline;
                        const last = tl[tl.length - 1];
                        if (!(last?.type === 'content' && !last._done)) {
                            const prev = tl[tl.length - 1];
                            if (prev?.type === 'thinking') prev._done = true;
                            // At most one unfinished content item — remove stale ones
                            for (let i = tl.length - 1; i >= 0; i--) {
                                if (
                                    tl[i].type === 'content' &&
                                    !tl[i]._done
                                ) {
                                    tl.splice(i, 1);
                                }
                            }
                            tl.push({
                                type: 'content',
                                text: '',
                                _done: false
                            });
                        }
                        if (!toolsStarted) {
                            streamingMsg.value._draftText += txt;
                        }
                        scheduleFlush();
                    },
                    onToolStart(name, args) {
                        if (!streamingMsg.value) return;
                        toolsStarted = true;
                        const tl = streamingMsg.value.timeline;
                        const last = tl[tl.length - 1];
                        if (last?.type === 'thinking') last._done = true;
                        // Move any in-progress content to draft
                        for (let i = tl.length - 1; i >= 0; i--) {
                            if (
                                tl[i].type === 'content' &&
                                !tl[i]._done
                            ) {
                                tl.splice(i, 1);
                            }
                        }
                        if (
                            streamingMsg.value._draftText &&
                            !tl.some((t) => t.type === 'draft')
                        ) {
                            tl.push({
                                type: 'draft',
                                text: streamingMsg.value._draftText,
                                _done: true
                            });
                            streamingMsg.value._draftText = '';
                        }
                        finalContent = '';
                        tl.push({ type: 'tool', name, _done: false, _args: args });
                        scheduleFlush();
                    },
                    onToolDone(name, result) {
                        if (!streamingMsg.value) return;
                        const tl = streamingMsg.value.timeline;
                        const tc = tl.find(
                            (t) =>
                                t.type === 'tool' &&
                                t.name === name &&
                                !t._done
                        );
                        if (tc) {
                            tc._done = true;
                            tc._result = result;
                        }
                        scheduleFlush();
                    },
                    onError(errMsg) {
                        error.value = errMsg;
                        loading.value = false;
                        streamingMsg.value = null;
                    },
                    onDone(answer, _toolTrace) {
                        if (!streamingMsg.value) return;
                        for (const item of streamingMsg.value.timeline) {
                            item._done = true;
                        }
                        cancelAnimationFrame(flushRAF);
                        flushDOM();
                        const displayContent =
                            finalContent ||
                            streamingMsg.value._draftText ||
                            answer;
                        const finalHtml = renderMarkdown(displayContent);
                        const finalMsg = {
                            role: 'assistant',
                            content: displayContent,
                            html: finalHtml,
                            timeline: [
                                ...streamingMsg.value.timeline.map(
                                    (item) => ({ ...item })
                                )
                            ]
                        };
                        pushMessage(finalMsg);
                        streamingMsg.value = null;
                        loading.value = false;
                        streamContentDom = null;
                        scrollToBottom();
                    }
                }
            );
        } catch (err) {
            if (
                err?.name === 'AbortError' ||
                err?.message?.includes('cancel')
            ) {
                error.value = '';
            } else {
                console.error('Friend Insight error', err);
                error.value = t('view.friend_insight.error', {
                    message: err.message || 'Unknown error'
                });
            }
            streamingMsg.value = null;
            loading.value = false;
        }
    }

    function buildConversationHistory() {
        const history = [];
        for (const msg of messages.value) {
            if (
                (msg.role === 'user' || msg.role === 'assistant') &&
                msg.content
            ) {
                history.push({ role: msg.role, content: msg.content });
            }
        }
        return history;
    }
</script>

<style>
.markdown-body {
    background: transparent !important;
    color: inherit;
    font-size: inherit;
    line-height: 1.6;
}
.markdown-body p {
    margin: 0.5em 0;
}
.markdown-body pre {
    background: hsl(var(--muted) / 0.5);
    padding: 12px 16px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 0.85em;
    line-height: 1.5;
}
.markdown-body code {
    background: hsl(var(--muted) / 0.3);
    padding: 0.15em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
}
.markdown-body pre code {
    background: transparent;
    padding: 0;
}
.markdown-body a {
    color: hsl(var(--primary));
}
.markdown-body table {
    display: block;
    overflow-x: auto;
    max-width: 100%;
}
.markdown-body th,
.markdown-body td {
    padding: 6px 12px;
    border: 1px solid hsl(var(--border));
}
.markdown-body th {
    background: hsl(var(--muted) / 0.3);
}
.markdown-body blockquote {
    border-left: 3px solid hsl(var(--primary) / 0.5);
    padding-left: 12px;
    color: hsl(var(--muted-foreground));
    margin: 0.5em 0;
}
.markdown-body ul,
.markdown-body ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
}
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
    margin: 1em 0 0.5em;
    font-weight: 600;
}
.markdown-body h1 { font-size: 1.4em; }
.markdown-body h2 { font-size: 1.2em; }
.markdown-body h3 { font-size: 1.1em; }
.markdown-body hr {
    border: none;
    border-top: 1px solid hsl(var(--border));
    margin: 1em 0;
}

.streaming-cursor::after {
    content: '█';
    animation: cursor-blink 1s step-end infinite;
}

@keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}
</style>
