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
                    <SelectItem value="fast">
                        <div class="flex items-center gap-1.5">
                            <Zap class="h-3 w-3 text-yellow-500" />
                            Fast (2s)
                        </div>
                    </SelectItem>
                    <SelectItem value="normal">
                        <div class="flex items-center gap-1.5">
                            <Timer class="h-3 w-3 text-blue-500" />
                            Normal (4s)
                        </div>
                    </SelectItem>
                    <SelectItem value="slow">
                        <div class="flex items-center gap-1.5">
                            <Shield class="h-3 w-3 text-green-500" />
                            Safe (10s)
                        </div>
                    </SelectItem>
                </SelectContent>
            </Select>

            <!-- Auto-invite toggle -->
            <TooltipWrapper side="top" content="Auto-invite new players who join the instance">
                <div
                    class="flex items-center gap-1.5 border rounded-md px-2.5 h-8 transition-colors flex-none"
                    :class="autoInviteEnabled
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-border'">
                    <Switch
                        :checked="autoInviteEnabled"
                        :disabled="!selectedGroupId"
                        @update:checked="autoInviteEnabled = $event"
                        class="scale-75" />
                    <span
                        class="text-xs whitespace-nowrap"
                        :class="autoInviteEnabled ? 'text-green-500 font-medium' : 'text-muted-foreground'">
                        Auto
                    </span>
                </div>
            </TooltipWrapper>
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

        <!-- ─── Activity Log (collapsible) ─── -->
        <Collapsible v-if="inviteLog.length > 0">
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
                <div class="max-h-28 overflow-y-auto mt-1 space-y-px rounded-md bg-muted/40 p-1.5">
                    <div
                        v-for="(entry, idx) in inviteLog.slice(0, 50)"
                        :key="idx"
                        class="flex items-center gap-1.5 text-[11px] leading-4 px-1 py-0.5 rounded hover:bg-muted/60">
                        <CheckCircle2 v-if="entry.status === 'sent'" class="h-3 w-3 text-green-500 flex-none" />
                        <MinusCircle v-else-if="entry.status === 'cached' || entry.status === 'skipped'" class="h-3 w-3 text-muted-foreground flex-none" />
                        <AlertCircle v-else-if="entry.status === 'error'" class="h-3 w-3 text-red-500 flex-none" />
                        <span class="truncate font-medium">{{ entry.displayName }}</span>
                        <span v-if="entry.message" class="text-muted-foreground truncate ml-auto text-[10px]">{{ entry.message }}</span>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>

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
        Users,
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

    import { useGroupInviteStore } from '../../../stores/groupInvite';
    import { useModalStore } from '../../../stores/modal';

    const groupInviteStore = useGroupInviteStore();
    const modalStore = useModalStore();

    const {
        selectedGroupId,
        autoInviteEnabled,
        delayPreset,
        isRunning,
        inviteLog,
        groupsWithInvitePermission,
        cacheSize,
        blacklist,
        currentProgress,
        totalProgress
    } = storeToRefs(groupInviteStore);

    const { massInviteAllInInstance, massInviteFriends, cancelOperation } = groupInviteStore;

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
