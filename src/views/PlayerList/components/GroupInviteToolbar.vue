<template>
    <div class="group-invite-toolbar space-y-3">
        <!-- ─── Header Row: Title + Cache ─── -->
        <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-foreground tracking-tight">Group Invite Toolkit</span>
            <div class="flex items-center gap-2">
                <Badge v-if="cacheSize > 0" variant="secondary" class="text-[11px] h-5 px-1.5">
                    {{ cacheSize }} cached
                </Badge>
                <TooltipWrapper side="top" content="Manage list of users to completely ignore">
                    <Button
                        size="xs"
                        variant="ghost"
                        class="text-muted-foreground hover:text-foreground h-6 px-2 text-[11px]"
                        @click="handleEditBlacklist">
                        <UserMinus class="h-3 w-3 mr-1" />
                        Blacklist{{ blacklist.length ? ` (${blacklist.length})` : '' }}
                    </Button>
                </TooltipWrapper>
                <TooltipWrapper side="top" content="Clear invite cache so everyone can be re-invited">
                    <Button
                        size="xs"
                        variant="ghost"
                        class="text-destructive hover:text-destructive h-6 px-2 text-[11px]"
                        :disabled="cacheSize === 0"
                        @click="handleClearCache">
                        <Trash2 class="h-3 w-3 mr-1" />
                        Clear Cache
                    </Button>
                </TooltipWrapper>
            </div>
        </div>

        <!-- ─── Settings Row: Group + Speed + Auto ─── -->
        <div class="flex items-center gap-2">
            <!-- Group selector -->
            <div class="flex-1 min-w-0">
                <Select v-model="selectedGroupId">
                    <SelectTrigger class="h-8 text-xs w-full">
                        <SelectValue placeholder="Select group..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem
                                v-for="group in groupsWithInvitePermission"
                                :key="group.id"
                                :value="group.id">
                                <div class="flex items-center gap-2">
                                    <img
                                        v-if="group.iconUrl"
                                        :src="group.iconUrl"
                                        class="size-4 rounded-full object-cover flex-none"
                                        loading="lazy" />
                                    <span class="truncate">{{ group.name }}</span>
                                </div>
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            <!-- Speed selector -->
            <Select v-model="delayPreset">
                <SelectTrigger class="h-8 text-xs w-[125px] flex-none">
                    <SelectValue placeholder="Speed" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="normal">
                        <div class="flex items-center gap-1.5">
                            <Zap class="h-3 w-3 text-blue-500" />
                            Normal (4s)
                        </div>
                    </SelectItem>
                    <SelectItem value="relaxed">
                        <div class="flex items-center gap-1.5">
                            <Timer class="h-3 w-3 text-cyan-500" />
                            Relaxed (6s)
                        </div>
                    </SelectItem>
                    <SelectItem value="cautious">
                        <div class="flex items-center gap-1.5">
                            <Timer class="h-3 w-3 text-yellow-500" />
                            Cautious (8s)
                        </div>
                    </SelectItem>
                    <SelectItem value="slow">
                        <div class="flex items-center gap-1.5">
                            <Shield class="h-3 w-3 text-orange-500" />
                            Slow (10s)
                        </div>
                    </SelectItem>
                    <SelectItem value="stealth">
                        <div class="flex items-center gap-1.5">
                            <Shield class="h-3 w-3 text-green-500" />
                            Stealth (15s)
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>

        <!-- ─── Action Cards ─── -->
        <div class="grid grid-cols-2 gap-2">
            <!-- Instance Invites Card -->
            <div class="rounded-md border border-border bg-muted/30 p-2.5">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                        Instance
                    </span>
                    <TooltipWrapper side="top" content="Mass invite everyone currently in your instance to the selected group above">
                        <Info class="size-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                    </TooltipWrapper>
                </div>
                <div class="flex gap-1.5">
                    <TooltipWrapper side="top" content="Invite everyone in the instance to the selected group">
                        <Button
                            size="sm"
                            variant="outline"
                            class="flex-1 h-7 text-xs flex gap-1.5 items-center"
                            :disabled="!selectedGroupId || isRunning"
                            @click="handleMassInvite(false)">
                            <Send class="size-3.5" />
                            All
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper side="top" content="Invite ONLY 18+ verified people in the instance to the selected group">
                        <Button
                            size="sm"
                            variant="outline"
                            class="flex-1 h-7 text-xs flex gap-1.5 items-center"
                            :disabled="!selectedGroupId || isRunning"
                            @click="handleMassInvite(true)">
                            <Send class="size-3.5" />
                            18+ Only
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>

            <!-- Friend Invites Card -->
            <div class="rounded-md border border-border bg-muted/30 p-2.5">
                <span class="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Friends
                </span>
                <div class="flex gap-1.5">
                    <TooltipWrapper side="top" content="Invite online (green) friends to your current instance">
                        <Button
                            size="sm"
                            variant="outline"
                            class="h-7 text-xs flex-1"
                            :disabled="isRunning"
                            @click="handleInviteFriends('public')">
                            <div class="size-2 rounded-full bg-green-500 mr-1.5 flex-none" />
                            Online
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper side="top" content="Invite online + active (orange) friends to your current instance">
                        <Button
                            size="sm"
                            variant="outline"
                            class="h-7 text-xs flex-1"
                            :disabled="isRunning"
                            @click="handleInviteFriends('all')">
                            <div class="flex gap-0.5 mr-1.5 flex-none">
                                <div class="size-2 rounded-full bg-green-500" />
                                <div class="size-2 rounded-full bg-orange-500" />
                            </div>
                            All
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
        </div>

        <!-- ─── Auto-Inviter Engine ─── -->
        <div class="rounded-md border border-border bg-muted/20 p-2.5 mt-2">
            <div class="flex items-center gap-2 mb-2">
                <Zap class="size-3.5 text-blue-400" />
                <span class="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Auto-Inviter Engine</span>
            </div>
            
            <div class="flex gap-2">
                <Button 
                    class="flex-1 transition-all duration-300 relative overflow-hidden" 
                    :class="autoInviteEnabled ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50' : 'bg-transparent text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50'"
                    :variant="'outline'"
                    :disabled="!selectedGroupId"
                    @click="autoInviteEnabled = !autoInviteEnabled"
                >
                    <div class="flex flex-col items-center justify-center">
                        <span class="font-bold tracking-wide">{{ autoInviteEnabled ? 'AUTO-INVITER: RUNNING' : 'AUTO-INVITER: OFFLINE' }}</span>
                    </div>
                </Button>
                
                <Select v-model="autoInvitePickupDelay" :disabled="!selectedGroupId">
                    <SelectTrigger class="w-[140px] bg-background/50 border-border">
                        <SelectValue placeholder="Pickup Delay" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem :value="0">Instant (0s)</SelectItem>
                            <SelectItem :value="5000">Fast (5s delay)</SelectItem>
                            <SelectItem :value="10000">Human (10s delay)</SelectItem>
                            <SelectItem :value="15000">Slow (15s delay)</SelectItem>
                            <SelectItem :value="30000">Very Slow (30s delay)</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            
            <div class="mt-2 text-center h-4 flex items-center justify-center">
                <span v-if="autoInviteQueue.length > 0 && autoInviteEnabled" class="text-[10px] animate-pulse text-green-400 font-medium tracking-wide">
                    Currently processing {{ autoInviteQueue.length }} invite(s) in background queue...
                </span>
                <span v-else-if="!autoInviteEnabled" class="text-[10px] text-muted-foreground/50 tracking-wide">
                    Will actively monitor lobby joins and invite automatically
                </span>
            </div>
        </div>

        <!-- ─── Running Status Bar ─── -->
        <div v-if="isRunning" class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5">
            <Loader2 class="h-3.5 w-3.5 animate-spin text-primary flex-none" />
            <span class="text-xs text-muted-foreground flex-1">
                Sending invites ({{ currentProgress }}/{{ totalProgress }})...
            </span>
            <Button
                size="xs"
                variant="destructive"
                class="h-6 text-[11px] px-2"
                @click="cancelOperation">
                <X class="h-3 w-3 mr-1" />
                Cancel
            </Button>
        </div>

        <!-- ─── Activity Log Section ─── -->
        <div v-if="inviteLog.length > 0" class="space-y-1.5">
            <!-- Stats Bar (Always Visible) -->
            <div class="flex items-center gap-3 px-1.5 py-1 text-[10px] bg-muted/20 border border-border/50 rounded-md">
                <span v-if="selectedGroup" class="text-blue-400 font-medium whitespace-nowrap">Members: {{ selectedGroup.memberCount }}</span>
                <span class="text-green-500 font-medium">✓ {{ logStats.sent }} sent</span>
                <span class="text-red-500 font-medium">✗ {{ logStats.error }} failed</span>
                <span class="text-muted-foreground">⊖ {{ logStats.cached }} cached</span>
                <span class="text-muted-foreground">↷ {{ logStats.skipped }} skipped</span>
                <span class="text-muted-foreground/50 ml-auto">{{ cacheSize }}/15000 ledger</span>
            </div>

            <!-- Log Collapsible -->
            <Collapsible>
                <CollapsibleTrigger as-child>
                    <Button
                        variant="ghost"
                        size="xs"
                        class="h-5 text-[11px] text-muted-foreground w-full justify-start px-1 hover:bg-transparent">
                        <ChevronRight class="h-3 w-3 mr-1 transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
                        Recent Activity ({{ inviteLog.length }})
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <!-- Log Controls -->
                    <div class="flex justify-end p-1">
                        <Select v-model="consoleSize">
                            <SelectTrigger class="h-5 text-[10px] bg-transparent border border-border/50 w-[70px] px-1 text-muted-foreground hover:text-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem :value="50" class="text-[10px]">Hist: 50</SelectItem>
                                    <SelectItem :value="100" class="text-[10px]">Hist: 100</SelectItem>
                                    <SelectItem :value="250" class="text-[10px]">Hist: 250</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <!-- Log Rows -->
                    <div class="max-h-28 overflow-y-auto space-y-px rounded-md bg-muted/40 p-1.5">
                    <div
                        v-for="(entry, idx) in inviteLog.slice(0, consoleSize)"
                        :key="idx"
                        class="flex items-center gap-1.5 text-[11px] leading-4 px-1 py-0.5 rounded hover:bg-muted/60">
                        <CheckCircle2 v-if="entry.status === 'sent'" class="h-3 w-3 text-green-500 flex-none" />
                        <MinusCircle v-else-if="entry.status === 'cached' || entry.status === 'skipped'" class="h-3 w-3 text-muted-foreground flex-none" />
                        <AlertCircle v-else-if="entry.status === 'error'" class="h-3 w-3 text-red-500 flex-none" />
                        <span
                            class="truncate font-medium w-[130px] flex-none cursor-pointer hover:text-primary hover:underline transition-colors"
                            @click="handleClickUser(entry.userId)">{{ entry.displayName }}</span>
                        <span
                            class="text-muted-foreground/60 truncate text-[10px] w-[90px] flex-none cursor-pointer hover:text-primary hover:underline transition-colors"
                            @click="handleClickGroup(entry.groupId)">{{ resolveGroupName(entry.groupId) }}</span>
                        <span v-if="entry.message" class="text-muted-foreground text-[10px] flex-none">{{ entry.message }}</span>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
        </div>

        <!-- ─── Blacklist UI Dialog ─── -->
        <Dialog :open="isBlacklistDialogOpen" @update:open="isBlacklistDialogOpen = $event">
            <DialogContent class="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Invite Blacklist</DialogTitle>
                    <DialogDescription>
                        Users on this list will automatically bypass mass invites.
                    </DialogDescription>
                </DialogHeader>
                
                <div class="flex items-center gap-2 mb-2">
                    <Input 
                        v-model="newBlacklistUser" 
                        placeholder="Enter exact Display Name or User ID..." 
                        class="h-8 flex-1 text-xs" 
                        @keydown.enter="addBlacklistUser" 
                    />
                    <Button size="sm" class="h-8" @click="addBlacklistUser">Add</Button>
                </div>
                
                <div class="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                    <div v-for="(user, index) in blacklist" :key="index" class="flex justify-between items-center bg-muted/50 px-2 py-1.5 rounded text-sm border border-border/50">
                        <span class="font-medium px-1">{{ user }}</span>
                        <Button variant="ghost" size="icon" class="h-6 w-6 text-muted-foreground hover:bg-destructive/20 hover:text-destructive shrink-0" @click="removeBlacklistUser(index)">
                            <X class="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div v-if="blacklist.length === 0" class="text-center text-muted-foreground text-xs py-5">
                        No users currently blacklisted.
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup>
    import {
        AlertCircle,
        CheckCircle2,
        ChevronRight,
        Info,
        Loader2,
        MinusCircle,
        Send,
        Shield,
        Timer,
        Trash2,
        UserMinus,
        X,
        Zap
    } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { ref } from 'vue';

    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectTrigger,
        SelectValue
    } from '@/components/ui/select';
    import { Switch } from '@/components/ui/switch';
    import TooltipWrapper from '@/components/ui/tooltip/TooltipWrapper.vue';

    import { showGroupDialog } from '../../../coordinators/groupCoordinator';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { useGroupInviteStore } from '../../../stores/groupInvite';
    import { useModalStore } from '../../../stores/modal';

    const groupInviteStore = useGroupInviteStore();
    const modalStore = useModalStore();

    const consoleSize = ref(50);

    const {
        selectedGroupId,
        autoInviteEnabled,
        autoInvitePickupDelay,
        autoInviteQueue,
        delayPreset,
        isRunning,
        inviteLog,
        groupsWithInvitePermission,
        selectedGroup,
        cacheSize,
        logStats,
        blacklist,
        currentProgress,
        totalProgress
    } = storeToRefs(groupInviteStore);

    const { massInviteAllInInstance, massInviteFriends, cancelOperation } = groupInviteStore;

    /**
     * Resolve a groupId to a short display name from the available groups.
     * Falls back to a truncated ID if the group isn't in the current list.
     */
    function resolveGroupName(groupId) {
        if (!groupId) return '';
        const group = groupsWithInvitePermission.value.find((g) => g.id === groupId);
        return group?.name || groupId.slice(0, 12);
    }

    function handleClickUser(userId) {
        if (userId) showUserDialog(userId);
    }

    function handleClickGroup(groupId) {
        if (groupId && groupId.startsWith('grp_')) showGroupDialog(groupId);
    }

    function handleMassInvite(only18Plus = false) {
        modalStore
            .confirm({
                description: `Invite ${only18Plus ? 'all 18+ verified' : 'all'} instance members to the selected group?`,
                title: 'Confirm Mass Invite'
            })
            .then(({ ok }) => {
                if (ok) massInviteAllInInstance(only18Plus);
            })
            .catch(() => {});
    }

    function handleInviteFriends(scope) {
        const label = scope === 'public' ? 'online' : 'online + active';
        modalStore
            .confirm({
                description: `Send instance invites to all your ${label} friends?`,
                title: 'Confirm Friend Invite'
            })
            .then(({ ok }) => {
                if (ok) massInviteFriends(scope);
            })
            .catch(() => {});
    }

    function handleClearCache() {
        modalStore
            .confirm({
                description: 'Clear the invite cache? This lets you re-invite everyone.',
                title: 'Clear Cache'
            })
            .then(({ ok }) => {
                if (ok) groupInviteStore.clearCache();
            })
            .catch(() => {});
    }

    const isBlacklistDialogOpen = ref(false);
    const newBlacklistUser = ref('');

    function handleEditBlacklist() {
        isBlacklistDialogOpen.value = true;
    }

    function addBlacklistUser() {
        const val = newBlacklistUser.value.trim();
        if (val) {
            blacklist.value.push(val);
            newBlacklistUser.value = '';
        }
    }

    function removeBlacklistUser(index) {
        blacklist.value.splice(index, 1);
    }
</script>
