<template>
    <section class="li-page" aria-labelledby="li-title">
        <header class="li-header">
            <div><div class="li-eyebrow">VRCX INSIGHTS <span>{{ demoMode ? c.demo : c.local }}</span></div><h1 id="li-title">{{ c.title }}</h1><p>{{ c.subtitle }}</p></div>
            <div class="li-actions"><button type="button" @click="loadDemo">{{ c.loadDemo }}</button><button type="button" class="li-primary" :disabled="loading" @click="refresh">{{ demoMode ? c.live : c.refresh }}</button></div>
        </header>
        <p v-if="demoMode" class="li-notice" role="status">{{ c.demoNotice }}</p>
        <div class="li-controls">
            <label>{{ c.range }}<select v-model.number="days" :disabled="loading" @change="refresh"><option :value="1">{{ c.day1 }}</option><option :value="7">{{ c.day7 }}</option><option :value="30">{{ c.day30 }}</option></select></label>
            <label>{{ c.search }}<input v-model="search" type="search" :placeholder="c.search" /></label>
            <label class="li-person">{{ c.person }}<select v-model="selectedId" :disabled="loading || !people.length"><option value="">{{ c.choose }}</option><option v-for="person in people" :key="person.id" :value="person.id">{{ person.name }}</option></select></label>
            <label class="li-checkbox"><input v-model="friendsOnly" type="checkbox" />{{ c.friendsOnly }}</label>
        </div>
        <div v-if="loading" class="li-empty" role="status">{{ c.loading }}</div>
        <div v-else-if="error" class="li-empty li-error" role="alert"><h2>{{ c.error }}</h2><p>{{ error }}</p><p>{{ c.failureNote }}</p></div>
        <div v-else-if="!report" class="li-empty"><div class="li-empty-icon" aria-hidden="true">&#9678;</div><h2>{{ eligiblePeople.length ? c.choose : c.empty }}</h2><p>{{ c.chooseHint }}</p><button type="button" @click="loadDemo">{{ c.loadDemo }}</button></div>
        <template v-else>
            <div class="li-profile"><span class="li-avatar" aria-hidden="true">{{ report.target.name.slice(0, 1) }}</span><div><h2>{{ report.target.name }}</h2><p>{{ formatDate(report.since) }} - {{ formatDate(report.until) }}</p></div><button type="button" class="li-copy" @click="copySummary">{{ c.copy }}</button><button type="button" @click="clearView">{{ c.clear }}</button></div>
            <p v-if="copyNotice" role="status" class="li-notice">{{ copyNotice }}</p>
            <div class="li-grid">
                <article class="li-card li-timeline"><div class="li-card-heading"><h2>{{ c.timeline }}</h2><span>{{ report.timeline.length }} {{ c.events }}</span></div>
                    <ol><li v-for="event in report.timeline.slice(0, visibleCount)" :key="`${event.type}-${event.rowId}-${event.at}`"><span class="li-event-dot" :class="{ 'li-left': event.type === 'OnPlayerLeft' }" aria-hidden="true"></span>
                        <div class="li-event-body"><div class="li-event-top"><strong>{{ event.type === 'OnPlayerJoined' ? c.joined : c.left }}</strong><time :datetime="new Date(event.at).toISOString()">{{ formatDate(event.at) }}</time></div><div class="li-world">{{ event.worldName }}</div><details><summary>{{ c.source }}: {{ event.source }} #{{ event.rowId }}</summary><code>{{ event.location }}</code></details></div>
                    </li></ol><button v-if="report.timeline.length > visibleCount" type="button" @click="visibleCount += 100">{{ c.more }}</button>
                </article>
                <aside class="li-summary">
                    <div class="li-metrics"><div class="li-card"><span>{{ c.duration }}</span><strong>{{ duration(report.observedMs) }}</strong></div><div class="li-card"><span>{{ c.sessions }}</span><strong>{{ report.completeSessions }}</strong></div></div>
                    <p class="li-small">{{ c.notOnline }}<br />{{ c.incomplete }}: {{ report.incompleteSessions }}</p>
                    <article class="li-card"><h2>{{ c.daily }}</h2><p v-if="!report.days.length" class="li-small">{{ c.noDuration }}</p><div v-for="day in report.days" :key="day.day" class="li-bar-row"><div><span>{{ day.day }}</span><strong>{{ duration(day.observedMs) }}</strong></div><div class="li-bar-track" aria-hidden="true"><span :style="{ width: `${day.observedMs / maxDay * 100}%` }"></span></div></div></article>
                    <article class="li-card"><h2>{{ c.ranking }}</h2><p class="li-small">{{ c.rankingNote }}</p><p v-if="!report.companions.length" class="li-small">{{ c.noPeers }}</p><div v-for="(person, idx) in report.companions.slice(0, 30)" :key="person.id" class="li-bar-row"><div><span><b class="li-rank">{{ idx + 1 }}</b>{{ person.name }}</span><strong>{{ duration(person.observedMs) }}</strong></div><small>{{ person.isFriend ? c.friend : c.nonFriend }}</small><div class="li-bar-track" aria-hidden="true"><span :style="{ width: `${person.observedMs / maxPeer * 100}%` }"></span></div></div></article>
                </aside>
            </div>
        </template>
        <footer class="li-policy"><details><summary>{{ c.policy }}</summary><p>{{ c.evidence }}</p><p>{{ c.excluded }}</p><p>{{ c.privacy }}</p><p>{{ c.rangeNote }}</p></details></footer>
    </section>
</template>
<script setup>
import { computed, onMounted, onActivated, onDeactivated, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { indexRecords, listPeople, buildReport } from './analytics.mjs';
import { loadLocalRecords, currentAccountId } from './reader.js';
import { en, zh } from './copy.mjs';
import fixture from '../../../tests/local-insights/fixtures.json';

defineOptions({ name: 'LocalInsights' });
const { locale } = useI18n();
const c = computed(() => String(locale.value).startsWith('zh') ? zh : en);
const index = shallowRef(null);
const friendIds = shallowRef(new Set());
const selectedId = ref('');
const search = ref('');
const friendsOnly = ref(true);
const days = ref(7);
const loading = ref(false);
const error = ref('');
const demoMode = ref(false);
const copyNotice = ref('');
const visibleCount = ref(100);
let generation = 0;
const eligiblePeople = computed(() => index.value ? listPeople(index.value, friendsOnly.value ? friendIds.value : null) : []);
const people = computed(() => eligiblePeople.value.filter((p) => p.id === selectedId.value || p.name.toLocaleLowerCase().includes(search.value.toLocaleLowerCase())));
const report = computed(() => {
    if (!index.value || !selectedId.value || !eligiblePeople.value.some((p) => p.id === selectedId.value)) return null;
    try { return buildReport(index.value, selectedId.value, { friendIds: friendIds.value }); } catch { return null; }
});
const maxDay = computed(() => Math.max(1, ...(report.value?.days || []).map((d) => d.observedMs)));
const maxPeer = computed(() => Math.max(1, ...(report.value?.companions || []).map((p) => p.observedMs)));
function duration(ms) { return `${(Math.round(ms / 6000) / 10).toLocaleString()} ${c.value.minutes}`; }
function formatDate(value) {
    try { return new Date(value).toLocaleString(String(locale.value) || undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch { return new Date(value).toLocaleString(); }
}
function preferenceKey() { return `localInsights.person.${currentAccountId()}`; }
function savedPerson() { try { return localStorage.getItem(preferenceKey()) || ''; } catch { return ''; } }
watch(selectedId, (id) => {
    visibleCount.value = 100; copyNotice.value = '';
    if (!demoMode.value && id && currentAccountId()) { try { localStorage.setItem(preferenceKey(), id); } catch { /* optional preference */ } }
});
function clearView() {
    generation += 1; loading.value = false; index.value = null; friendIds.value = new Set(); selectedId.value = ''; error.value = ''; copyNotice.value = ''; demoMode.value = false;
    try { localStorage.removeItem(preferenceKey()); } catch { /* optional preference */ }
}
async function refresh() {
    const request = ++generation;
    loading.value = true; error.value = ''; demoMode.value = false; index.value = null; friendIds.value = new Set(); selectedId.value = ''; copyNotice.value = '';
    const account = currentAccountId();
    try {
        const data = await loadLocalRecords(days.value);
        if (request !== generation || account !== currentAccountId()) return;
        index.value = indexRecords(data.records, data); friendIds.value = data.friendIds;
        const saved = savedPerson(); selectedId.value = eligiblePeople.value.some((p) => p.id === saved) ? saved : '';
    } catch (e) { if (request === generation) error.value = e instanceof Error ? e.message : String(e); }
    finally { if (request === generation) loading.value = false; }
}
function loadDemo() {
    generation += 1; loading.value = false; error.value = ''; demoMode.value = true; search.value = ''; copyNotice.value = '';
    friendIds.value = new Set(fixture.friendIds); index.value = indexRecords(fixture.records, fixture); selectedId.value = fixture.targetId;
}
async function copySummary() {
    if (!report.value) return;
    try { await navigator.clipboard.writeText(JSON.stringify(report.value, null, 2)); copyNotice.value = c.value.copied; }
    catch { copyNotice.value = c.value.copyError; }
}
onMounted(refresh);
onActivated(() => { if (!loading.value && !demoMode.value) refresh(); });
onDeactivated(() => { generation += 1; loading.value = false; if (!demoMode.value) { index.value = null; friendIds.value = new Set(); selectedId.value = ''; } });
onBeforeUnmount(() => { generation += 1; index.value = null; friendIds.value = new Set(); });
</script>
<style scoped>
.li-page{height:100%;overflow:auto;padding:clamp(16px,2.3vw,32px);color:var(--foreground);background:var(--background);font-size:14px;line-height:1.55}.li-header{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:24px}.li-eyebrow{font-size:11px;font-weight:750;letter-spacing:.16em;color:var(--muted-foreground)}.li-eyebrow span{display:inline-block;margin-left:12px;letter-spacing:0;padding:2px 9px;border:1px solid var(--border);border-radius:20px}.li-page h1{font-size:clamp(23px,2.4vw,32px);font-weight:750;letter-spacing:-.03em;line-height:1.25;margin:8px 0}.li-page h2{font-size:15px;font-weight:700;margin:0 0 12px}.li-page p{color:var(--muted-foreground);margin:6px 0}.li-actions{display:flex;gap:8px;flex-shrink:0}.li-page button,.li-page input,.li-page select{font:inherit;border:1px solid var(--border);border-radius:9px;background:var(--background);color:var(--foreground);padding:8px 12px;min-height:38px}.li-page button{cursor:pointer}.li-page button:hover{background:var(--accent)}.li-page button:disabled{opacity:.55;cursor:wait}.li-page button.li-primary{background:var(--primary);color:var(--primary-foreground);border-color:var(--primary)}.li-page :is(button,input,select,summary):focus-visible{outline:2px solid var(--ring);outline-offset:3px}.li-controls{display:flex;flex-wrap:wrap;gap:14px;align-items:end;padding:18px;background:var(--card);border:1px solid var(--border);border-radius:14px;margin-bottom:20px}.li-controls label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--muted-foreground)}.li-controls .li-person{flex:1;min-width:180px}.li-controls .li-checkbox{flex-direction:row;align-items:center;min-height:38px}.li-checkbox input{min-height:auto;width:16px;height:16px}.li-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,1fr);gap:20px;align-items:start}.li-card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:20px;min-width:0}.li-profile{display:flex;align-items:center;gap:14px;margin:20px 0}.li-profile h2{font-size:20px;margin:0}.li-avatar{width:48px;height:48px;display:grid;place-items:center;border-radius:14px;background:var(--accent);color:var(--accent-foreground);font-size:22px;font-weight:750}.li-profile p{font-size:12px}.li-copy{margin-left:auto}.li-card-heading{display:flex;justify-content:space-between;gap:12px}.li-card-heading span{font-size:12px;color:var(--muted-foreground)}.li-timeline ol{list-style:none;margin:8px 0 0;padding:0}.li-timeline li{display:flex;gap:14px;padding:0 0 24px;position:relative}.li-timeline li:before{content:'';position:absolute;left:5px;top:14px;bottom:0;width:1px;background:var(--border)}.li-timeline li:last-child:before{display:none}.li-event-dot{flex-shrink:0;width:11px;height:11px;margin-top:6px;border-radius:50%;background:var(--primary);border:2px solid var(--primary)}.li-event-dot.li-left{background:var(--card);border-color:var(--muted-foreground)}.li-event-body{flex:1;min-width:0}.li-event-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.li-event-top strong{font-size:13px}.li-event-top time{color:var(--muted-foreground);font-size:11px;white-space:nowrap}.li-world{font-size:14px;margin:5px 0;overflow-wrap:anywhere}.li-event-body summary{font-size:11px;color:var(--muted-foreground);cursor:pointer}.li-event-body code{display:block;font-size:10px;overflow-wrap:anywhere;margin-top:6px}.li-summary{display:flex;flex-direction:column;gap:16px;min-width:0}.li-metrics{display:grid;grid-template-columns:1.4fr 1fr;gap:12px}.li-metrics span{display:block;color:var(--muted-foreground);font-size:11px}.li-metrics strong{display:block;font-size:clamp(18px,1.8vw,26px);letter-spacing:-.03em;margin-top:10px}.li-small{font-size:12px;color:var(--muted-foreground)}.li-bar-row{margin-top:18px}.li-bar-row>div:first-child{display:flex;justify-content:space-between;gap:12px;font-size:12px}.li-bar-row>div:first-child>span{overflow-wrap:anywhere}.li-bar-row strong{white-space:nowrap;font-size:11px}.li-bar-row small{font-size:10px;color:var(--muted-foreground)}.li-rank{display:inline-block;min-width:22px;color:var(--muted-foreground)}.li-bar-track{height:5px;background:var(--muted);border-radius:3px;overflow:hidden;margin-top:8px}.li-bar-track span{display:block;height:100%;background:var(--primary);border-radius:3px;min-width:1px}.li-empty{text-align:center;padding:64px 24px;border:1px dashed var(--border);border-radius:14px}.li-empty-icon{font-size:40px;color:var(--muted-foreground);margin-bottom:14px}.li-empty p{max-width:480px;margin:12px auto}.li-empty button{margin-top:12px}.li-error{border-color:var(--destructive)}.li-notice{padding:12px 16px;background:var(--accent);border-radius:9px;margin-bottom:16px!important;font-size:12px}.li-policy{border-top:1px solid var(--border);margin-top:24px;padding-top:16px;font-size:12px;color:var(--muted-foreground)}.li-policy summary{cursor:pointer}@media(max-width:950px){.li-grid{grid-template-columns:1fr}.li-summary{display:grid;grid-template-columns:1fr 1fr}.li-summary>.li-small{grid-column:1/-1}.li-metrics{grid-column:1/-1}}@media(max-width:600px){.li-header{align-items:flex-start;flex-direction:column}.li-summary{display:flex}.li-controls{flex-direction:column;align-items:stretch}.li-profile{flex-wrap:wrap}.li-copy{margin-left:0}}
</style>
