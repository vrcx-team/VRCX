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
                    <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">{{ t('view.friend_insight.preset_questions') }}</label>
                        <Button
                            size="sm"
                            variant="ghost"
                            class="h-6 w-6 p-0"
                            :disabled="editingPresetIndex >= 0 || isAddingPreset"
                            @click="startAddPreset">
                            <Plus class="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div class="mt-1 flex flex-col gap-1">
                        <template v-for="(preset, pi) in presets" :key="pi">
                            <!-- Editing form -->
                            <div v-if="editingPresetIndex === pi" class="flex flex-col gap-1 p-1.5 rounded border border-border">
                                <input
                                    v-model="editLabel"
                                    type="text"
                                    class="h-7 w-full rounded border border-input bg-transparent px-2 text-xs outline-none"
                                    :placeholder="t('view.friend_insight.preset_label_placeholder')" />
                                <textarea
                                    v-model="editQuestion"
                                    rows="2"
                                    class="w-full rounded border border-input bg-transparent px-2 py-1 text-xs outline-none resize-none"
                                    :placeholder="t('view.friend_insight.preset_question_placeholder')" />
                                <div class="flex gap-1">
                                    <Button size="sm" class="h-6 text-xs" @click="savePreset">{{ t('view.friend_insight.save') }}</Button>
                                    <Button size="sm" variant="ghost" class="h-6 text-xs" @click="cancelEditPreset">{{ t('view.friend_insight.cancel') }}</Button>
                                </div>
                            </div>
                            <!-- Preset row -->
                            <div
                                v-else
                                class="flex items-center gap-1 group/preset rounded hover:bg-accent/50 pr-0.5">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="justify-start text-left h-auto py-1.5 flex-1 min-w-0"
                                    :disabled="!selectedFriends.length || loading"
                                    @click="askQuestion(preset.question)">
                                    <span class="text-xs truncate">{{ preset.label }}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="h-5 w-5 p-0 opacity-0 group-hover/preset:opacity-50 hover:opacity-100! shrink-0"
                                    :disabled="loading"
                                    @click="startEditPreset(pi)">
                                    <Pencil class="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    class="h-5 w-5 p-0 opacity-0 group-hover/preset:opacity-50 hover:opacity-100! hover:text-destructive shrink-0"
                                    :disabled="loading"
                                    @click="deletePreset(pi)">
                                    <Trash2 class="h-3 w-3" />
                                </Button>
                            </div>
                        </template>
                        <!-- Add form -->
                        <div v-if="isAddingPreset" class="flex flex-col gap-1 p-1.5 rounded border border-border">
                            <input
                                v-model="editLabel"
                                type="text"
                                class="h-7 w-full rounded border border-input bg-transparent px-2 text-xs outline-none"
                                :placeholder="t('view.friend_insight.preset_label_placeholder')" />
                            <textarea
                                v-model="editQuestion"
                                rows="2"
                                class="w-full rounded border border-input bg-transparent px-2 py-1 text-xs outline-none resize-none"
                                :placeholder="t('view.friend_insight.preset_question_placeholder')" />
                            <div class="flex gap-1">
                                <Button size="sm" class="h-6 text-xs" @click="addPreset">{{ t('view.friend_insight.add') }}</Button>
                                <Button size="sm" variant="ghost" class="h-6 text-xs" @click="cancelAddPreset">{{ t('view.friend_insight.cancel') }}</Button>
                            </div>
                        </div>
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
                        :disabled="!currentQuestion.trim() || loading"
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
    import { i18n } from '@/plugins/i18n';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';
    import {
        Brain,
        Check,
        Eye,
        FileText,
        Loader2,
        Pencil,
        Plus,
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
    import configRepository from '@/services/config';

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

    const DEFAULT_PRESETS = {
        en: [
            { label: 'Weekly Activity', question: 'What has [friends] been up to this week?' },
            { label: 'Online Frequency', question: 'Compare the online frequency of [friends] over the last 30 days.' },
            { label: 'Status Patterns', question: 'What patterns are there in [friends]\'s status changes?' },
            { label: 'Friendship History', question: 'When did my friendship with [friends] begin? What changes have occurred?' },
            { label: 'Shared Worlds', question: 'Do [friends] often appear in the same worlds recently?' },
            { label: 'Frequent Peers', question: 'Based on [friends]\'s common worlds, mutual friends, and online time overlap, who are the people they most frequently spend time with? Use resolve_users to identify any unknown user IDs found in the data.' },
            { label: 'Deep Analysis', question: 'Please perform a deep mental state and behavioral pattern analysis for [friends]. Follow these steps:\n\nStep 1 — Bio Timeline Analysis:\nRetrieve all historical bio records and analyze how this individual\'s self-description has changed over time. Focus on: shifts in tone and content of self-description, changes in role positioning, signs of self-negation or exaggerated expression, and social intent reflected in bios.\n\nStep 2 — Behavioral Pattern & Personality Assessment:\nSynthesize all timeline data and analyze from these dimensions:\n- Emotional Fluctuation: Identify alternating active and low periods from online frequency and duration changes.\n- Habits & Regularity: Analyze consistency in active times and frequently visited worlds.\n- Stress & Change Signals: Whether major bio and status changes correlate with real-life events.\n- Mental State Stability: Synthesize all factors to assess stability vs fluctuation.\n\nGenerate a complete report with detailed timeline evidence and in-depth behavioral insights.' }
        ],
        'zh-CN': [
            { label: '本周动态', question: '[friends]这周都在做什么？' },
            { label: '上线频率', question: '[friends]最近30天的上线频率如何？' },
            { label: '状态变化规律', question: '[friends]最近的状态变化有什么规律？' },
            { label: '好友关系历史', question: '我和[friends]的好友关系是什么时候建立的？有哪些变化？' },
            { label: '共同世界', question: '[friends]最近是否常出现在相同世界？' },
            { label: '常一起玩的人', question: '根据[friends]的共同世界、共同好友和在线时间重叠情况，分析他们最常和哪些人一起玩？遇到未知用户ID请使用resolve_users查询。' },
            { label: '深度分析', question: '请对[friends]进行一次深度的精神状态和行为模式分析。按以下步骤进行：\n\n步骤1 — 自我介绍（bio）时间线解析：\n获取全部历史bio记录，按时间顺序分析个体在不同时间段的自我介绍变化。重点关注：自我描述的语气和内容转变、角色定位的变化、是否出现自我否定或过度夸大的表达、bio中透露的社交意图。\n\n步骤2 — 行为模式与性格评估：\n综合所有时间线数据，从以下维度进行深入分析：\n- 情感波动：从在线频率和时长变化中识别活跃期与低谷期的交替模式\n- 习惯与规律性：分析活跃时间和常去世界的一致性\n- 压力与变化信号：bio和状态的重大变化是否与现实生活事件相关\n- 精神状态的稳定性：综合以上因素评估稳定性或波动性\n\n请生成完整报告，包含详细的时间线证据和深入的行为洞察。' }
        ],
        ja: [
            { label: '今週のアクティビティ', question: '[friends]は今週何をしていましたか？' },
            { label: 'オンライン頻度', question: '[friends]の過去30日間のオンライン頻度を比較してください。' },
            { label: 'ステータスパターン', question: '[friends]のステータス変化にはどのようなパターンがありますか？' },
            { label: 'フレンド関係の履歴', question: '[friends]とのフレンド関係はいつ始まりましたか？どのような変化がありましたか？' },
            { label: '共通ワールド', question: '[friends]は最近同じワールドによく出現しますか？' },
            { label: 'よく遊ぶ人', question: '[friends]の共通ワールド、共通フレンド、オンライン時間の重なりから、最も頻繁に一緒に過ごしている人を分析してください。未知のユーザーIDはresolve_usersで調べてください。' },
            { label: '深層分析', question: '[friends]について深層的な精神状態と行動パターン分析を行ってください。以下の手順で進めてください：\n\n手順1 — 自己紹介（bio）タイムライン解析：\nすべての履歴bioレコードを取得し、時系列で個人の自己紹介の変化を分析します。注目ポイント：自己記述のトーンと内容の変化、役割定位の変化、自己否定や過度な誇張表現の有無、bioに表れる社会的意図。\n\n手順2 — 行動パターンと性格評価：\nすべてのタイムラインデータを総合し、以下の次元から深く分析します：\n- 感情の変動：オンライン頻度と時間の変化から、活発期と低調期の交互パターンを識別\n- 習慣と規則性：アクティブ時間とよく訪れるワールドの一貫性を分析\n- ストレスと変化のシグナル：bioとステータスの大きな変化が現実の生活イベントと関連しているか\n- 精神状態の安定性：上記の要因を総合して安定性を評価\n\n詳細なタイムラインの証拠と深い行動洞察を含む完全なレポートを生成してください。' }
        ]
    };

    const presets = ref([]);
    const editingPresetIndex = ref(-1);
    const isAddingPreset = ref(false);
    const editLabel = ref('');
    const editQuestion = ref('');
    const PRESETS_CONFIG_KEY = 'VRCX_friendInsightPresets';

    function currentLang() {
        return i18n.global.locale.value || 'en';
    }

    function getPresetsForLang(allPresets, lang) {
        return allPresets[lang] || allPresets.en || [];
    }

    async function loadPresets() {
        const saved = await configRepository.getObject(PRESETS_CONFIG_KEY, null);
        const lang = currentLang();
        if (saved && saved[lang] && saved[lang].length) {
            presets.value = saved[lang].map((p) => ({ label: p.label, question: p.question }));
        } else {
            presets.value = DEFAULT_PRESETS[lang]
                ? DEFAULT_PRESETS[lang].map((p) => ({ ...p }))
                : DEFAULT_PRESETS.en.map((p) => ({ ...p }));
        }
    }

    function resetToBuiltinPresets() {
        const lang = currentLang();
        presets.value = DEFAULT_PRESETS[lang]
            ? DEFAULT_PRESETS[lang].map((p) => ({ ...p }))
            : DEFAULT_PRESETS.en.map((p) => ({ ...p }));
    }

    async function savePresets() {
        const lang = currentLang();
        const allPresets = (await configRepository.getObject(PRESETS_CONFIG_KEY, null)) || {};
        allPresets[lang] = presets.value.map((p) => ({ label: p.label, question: p.question }));
        await configRepository.setObject(PRESETS_CONFIG_KEY, allPresets);
    }

    function startAddPreset() {
        isAddingPreset.value = true;
        editLabel.value = '';
        editQuestion.value = '';
    }

    function cancelAddPreset() {
        isAddingPreset.value = false;
        editLabel.value = '';
        editQuestion.value = '';
    }

    async function addPreset() {
        const label = editLabel.value.trim();
        const question = editQuestion.value.trim();
        if (!label || !question) return;
        presets.value = [...presets.value, { label, question }];
        isAddingPreset.value = false;
        editLabel.value = '';
        editQuestion.value = '';
        await savePresets();
    }

    function startEditPreset(index) {
        editingPresetIndex.value = index;
        editLabel.value = presets.value[index].label;
        editQuestion.value = presets.value[index].question;
    }

    function cancelEditPreset() {
        editingPresetIndex.value = -1;
        editLabel.value = '';
        editQuestion.value = '';
    }

    async function savePreset() {
        const label = editLabel.value.trim();
        const question = editQuestion.value.trim();
        if (!label || !question) return;
        const idx = editingPresetIndex.value;
        presets.value = presets.value.map((p, i) =>
            i === idx ? { label, question } : p
        );
        editingPresetIndex.value = -1;
        editLabel.value = '';
        editQuestion.value = '';
        await savePresets();
    }

    async function deletePreset(index) {
        presets.value = presets.value.filter((_, i) => i !== index);
        await savePresets();
    }

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
        resetThrottle();
        await loadPresets();
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
        return raw.replaceAll('[friends]', names || t('view.friend_insight.selected_friends'));
    }

    function scrollToBottom() {
        if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
    }

    let lastScrollTime = 0;
    function resetThrottle() {
        lastScrollTime = 0;
    }
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
        resetThrottle();
    }

    function goToSettings() {
        router.push({ name: 'settings', query: { tab: 'integrations' } });
    }

    function pushMessage(msg) {
        messages.value = [...messages.value, markRaw(msg)];
    }

    // ─── Ask question ───────────────────────────────────────────────
    async function askQuestion(raw) {
        const question = buildQuestion(raw || currentQuestion.value);
        if (!question.trim()) return;

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

            const contextParts = [];
            if (friendIds.length) {
                contextParts.push(`friend IDs = ${friendIds.join(', ')}`);
            }
            if (timeRangeISO.from) {
                contextParts.push(`from = ${timeRangeISO.from}`);
            }
            if (timeRangeISO.to) {
                contextParts.push(`to = ${timeRangeISO.to}`);
            }
            contextParts.push(`allowed data types = ${allowedTypes.join(', ')}`);
            const contextualQuestion = contextParts.length
                ? `${question} [Context: ${contextParts.join(', ')}]`
                : question;

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
                        // Push content placeholder so cursor blinks during tool execution
                        // (only once — subsequent onToken calls reuse this item)
                        if (!tl.some((t) => t.type === 'content' && !t._done)) {
                            tl.push({
                                type: 'content',
                                text: '',
                                _done: false
                            });
                        }
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
