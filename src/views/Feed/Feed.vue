<template>
    <div v-show="menuActiveIndex === 'feed'" class="x-container feed">
        <div style="margin: 0 0 10px; display: flex; align-items: center">
            <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                <el-tooltip
                    placement="bottom"
                    :content="t('view.feed.favorites_only_tooltip')"
                    :disabled="hideTooltips">
                    <el-switch v-model="feedTable.vip" active-color="#13ce66" @change="feedTableLookup"></el-switch>
                </el-tooltip>
            </div>
            <el-select
                v-model="feedTable.filter"
                multiple
                clearable
                style="flex: 1"
                :placeholder="t('view.feed.filter_placeholder')"
                @change="feedTableLookup">
                <el-option
                    v-for="type in ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio']"
                    :key="type"
                    :label="t('view.feed.filters.' + type)"
                    :value="type"></el-option>
            </el-select>
            <el-input
                v-model="feedTable.search"
                :placeholder="t('view.feed.search_placeholder')"
                clearable
                style="flex: none; width: 150px; margin-left: 10px"
                @keyup.native.13="feedTableLookup"
                @change="feedTableLookup"></el-input>
        </div>

        <data-tables v-loading="feedTable.loading" v-bind="feedTable" lazy>
            <el-table-column type="expand" width="20">
                <template #default="scope">
                    <div style="position: relative; font-size: 14px">
                        <template v-if="scope.row.type === 'GPS'">
                            <Location
                                v-if="scope.row.previousLocation"
                                :location="scope.row.previousLocation"
                                style="display: inline-block" />
                            <el-tag type="info" effect="plain" size="mini" style="margin-left: 5px">{{
                                timeToText(scope.row.time)
                            }}</el-tag>
                            <br />
                            <span style="margin-right: 5px">
                                <i class="el-icon-right"></i>
                            </span>
                            <Location
                                v-if="scope.row.location"
                                :location="scope.row.location"
                                :hint="scope.row.worldName"
                                :grouphint="scope.row.groupName" />
                        </template>
                        <template v-else-if="scope.row.type === 'Offline'">
                            <template v-if="scope.row.location">
                                <Location
                                    :location="scope.row.location"
                                    :hint="scope.row.worldName"
                                    :grouphint="scope.row.groupName" />
                                <el-tag type="info" effect="plain" size="mini" style="margin-left: 5px">{{
                                    timeToText(scope.row.time)
                                }}</el-tag>
                            </template>
                        </template>
                        <template v-else-if="scope.row.type === 'Online'">
                            <Location
                                v-if="scope.row.location"
                                :location="scope.row.location"
                                :hint="scope.row.worldName"
                                :grouphint="scope.row.groupName" />
                        </template>
                        <template v-else-if="scope.row.type === 'Avatar'">
                            <div style="display: flex; align-items: center">
                                <el-popover placement="right" width="500px" trigger="click">
                                    <div
                                        slot="reference"
                                        style="display: inline-block; vertical-align: top; width: 160px">
                                        <template v-if="scope.row.previousCurrentAvatarThumbnailImageUrl">
                                            <img
                                                v-lazy="scope.row.previousCurrentAvatarThumbnailImageUrl"
                                                class="x-link"
                                                style="flex: none; width: 160px; height: 120px; border-radius: 4px" />
                                            <br />
                                            <AvatarInfo
                                                :imageurl="scope.row.previousCurrentAvatarThumbnailImageUrl"
                                                :userid="scope.row.userId"
                                                :hintownerid="scope.row.previousOwnerId"
                                                :hintavatarname="scope.row.previousAvatarName"
                                                :avatartags="scope.row.previousCurrentAvatarTags" />
                                        </template>
                                    </div>
                                    <img
                                        v-lazy="scope.row.previousCurrentAvatarImageUrl"
                                        class="x-link"
                                        style="width: 500px; height: 375px"
                                        @click="showFullscreenImageDialog(scope.row.previousCurrentAvatarImageUrl)" />
                                </el-popover>
                                <span style="position: relative; margin: 0 10px">
                                    <i class="el-icon-right"></i>
                                </span>
                                <el-popover placement="right" width="500px" trigger="click">
                                    <div
                                        slot="reference"
                                        style="display: inline-block; vertical-align: top; width: 160px">
                                        <template v-if="scope.row.currentAvatarThumbnailImageUrl">
                                            <img
                                                v-lazy="scope.row.currentAvatarThumbnailImageUrl"
                                                class="x-link"
                                                style="flex: none; width: 160px; height: 120px; border-radius: 4px" />
                                            <br />
                                            <AvatarInfo
                                                :imageurl="scope.row.currentAvatarThumbnailImageUrl"
                                                :userid="scope.row.userId"
                                                :hintownerid="scope.row.ownerId"
                                                :hintavatarname="scope.row.avatarName"
                                                :avatartags="scope.row.currentAvatarTags" />
                                        </template>
                                    </div>
                                    <img
                                        v-lazy="scope.row.currentAvatarImageUrl"
                                        class="x-link"
                                        style="width: 500px; height: 375px"
                                        @click="showFullscreenImageDialog(scope.row.currentAvatarImageUrl)" />
                                </el-popover>
                            </div>
                        </template>
                        <template v-else-if="scope.row.type === 'Status'">
                            <el-tooltip placement="top">
                                <template #content>
                                    <span v-if="scope.row.previousStatus === 'active'">{{
                                        t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="scope.row.previousStatus === 'join me'">{{
                                        t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="scope.row.previousStatus === 'ask me'">{{
                                        t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="scope.row.previousStatus === 'busy'">{{
                                        t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                </template>
                                <i class="x-user-status" :class="statusClass(scope.row.previousStatus)"></i>
                            </el-tooltip>
                            <span style="margin-left: 5px" v-text="scope.row.previousStatusDescription"></span>
                            <br />
                            <span>
                                <i class="el-icon-right"></i>
                            </span>
                            <el-tooltip placement="top">
                                <template #content>
                                    <span v-if="scope.row.status === 'active'">{{
                                        t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'join me'">{{
                                        t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'ask me'">{{
                                        t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'busy'">{{
                                        t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                </template>
                                <i
                                    class="x-user-status"
                                    :class="statusClass(scope.row.status)"
                                    style="margin: 0 5px"></i>
                            </el-tooltip>
                            <span v-text="scope.row.statusDescription"></span>
                        </template>
                        <template v-else-if="scope.row.type === 'Bio'">
                            <pre
                                style="font-family: inherit; font-size: 12px; white-space: pre-wrap; line-height: 22px"
                                v-html="formatDifference(scope.row.previousBio, scope.row.bio)"></pre>
                        </template>
                    </div>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.feed.date')" prop="created_at" sortable="custom" width="120">
                <template #default="scope">
                    <el-tooltip placement="right">
                        <template #content>
                            <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                        </template>
                        <span>{{ formatDateFilter(scope.row.created_at, 'short') }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.feed.type')" prop="type" width="80">
                <template #default="scope">
                    <span v-text="t('view.feed.filters.' + scope.row.type)"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.feed.user')" prop="displayName" width="180">
                <template #default="scope">
                    <span
                        class="x-link"
                        style="padding-right: 10px"
                        @click="showUserDialog(scope.row.userId)"
                        v-text="scope.row.displayName"></span>
                </template>
            </el-table-column>

            <el-table-column :label="t('table.feed.detail')">
                <template #default="scope">
                    <template v-if="scope.row.type === 'GPS'">
                        <Location
                            v-if="scope.row.location"
                            :location="scope.row.location"
                            :hint="scope.row.worldName"
                            :grouphint="scope.row.groupName" />
                    </template>
                    <template v-else-if="scope.row.type === 'Offline' || scope.row.type === 'Online'">
                        <Location
                            v-if="scope.row.location"
                            :location="scope.row.location"
                            :hint="scope.row.worldName"
                            :grouphint="scope.row.groupName" />
                    </template>
                    <template v-else-if="scope.row.type === 'Status'">
                        <template v-if="scope.row.statusDescription === scope.row.previousStatusDescription">
                            <el-tooltip placement="top">
                                <template #content>
                                    <span v-if="scope.row.previousStatus === 'active'">{{
                                        t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="scope.row.previousStatus === 'join me'">{{
                                        t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="scope.row.previousStatus === 'ask me'">{{
                                        t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="scope.row.previousStatus === 'busy'">{{
                                        t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                </template>
                                <i class="x-user-status" :class="statusClass(scope.row.previousStatus)"></i>
                            </el-tooltip>
                            <span style="margin: 0 5px">
                                <i class="el-icon-right"></i>
                            </span>
                            <el-tooltip placement="top">
                                <template #content>
                                    <span v-if="scope.row.status === 'active'">{{
                                        t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'join me'">{{
                                        t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'ask me'">{{
                                        t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'busy'">{{
                                        t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                </template>
                                <i class="x-user-status" :class="statusClass(scope.row.status)"></i>
                            </el-tooltip>
                        </template>
                        <template v-else>
                            <el-tooltip placement="top">
                                <template #content>
                                    <span v-if="scope.row.status === 'active'">{{
                                        t('dialog.user.status.active')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'join me'">{{
                                        t('dialog.user.status.join_me')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'ask me'">{{
                                        t('dialog.user.status.ask_me')
                                    }}</span>
                                    <span v-else-if="scope.row.status === 'busy'">{{
                                        t('dialog.user.status.busy')
                                    }}</span>
                                    <span v-else>{{ t('dialog.user.status.offline') }}</span>
                                </template>
                                <i
                                    class="x-user-status"
                                    :class="statusClass(scope.row.status)"
                                    style="margin-right: 3px"></i>
                            </el-tooltip>
                            <span v-text="scope.row.statusDescription"></span>
                        </template>
                    </template>
                    <template v-else-if="scope.row.type === 'Avatar'">
                        <AvatarInfo
                            :imageurl="scope.row.currentAvatarImageUrl"
                            :userid="scope.row.userId"
                            :hintownerid="scope.row.ownerId"
                            :hintavatarname="scope.row.avatarName"
                            :avatartags="scope.row.currentAvatarTags" />
                    </template>
                    <template v-else-if="scope.row.type === 'Bio'">
                        <span v-text="scope.row.bio"></span>
                    </template>
                </template>
            </el-table-column>
        </data-tables>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import { useGalleryStore, useAppearanceSettingsStore, useUserStore, useFeedStore, useUiStore } from '../../stores';
    import { timeToText, statusClass, formatDateFilter } from '../../shared/utils';

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { feedTable } = storeToRefs(useFeedStore());
    const { feedTableLookup } = useFeedStore();
    const { menuActiveIndex } = storeToRefs(useUiStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const { t } = useI18n();

    /**
     * Function that format the differences between two strings with HTML tags
     * markerStartTag and markerEndTag are optional, if emitted, the differences will be highlighted with yellow and underlined.
     * @param {*} s1
     * @param {*} s2
     * @param {*} markerStartTag
     * @param {*} markerEndTag
     * @returns An array that contains both the string 1 and string 2, which the differences are formatted with HTML tags
     */

    //function getWordDifferences
    function formatDifference(
        oldString,
        newString,
        markerAddition = '<span class="x-text-added">{{text}}</span>',
        markerDeletion = '<span class="x-text-removed">{{text}}</span>'
    ) {
        [oldString, newString] = [oldString, newString].map((s) =>
            s
                .replaceAll(/&/g, '&amp;')
                .replaceAll(/</g, '&lt;')
                .replaceAll(/>/g, '&gt;')
                .replaceAll(/"/g, '&quot;')
                .replaceAll(/'/g, '&#039;')
                .replaceAll(/\n/g, '<br>')
        );

        const oldWords = oldString.split(/\s+/).flatMap((word) => word.split(/(<br>)/));
        const newWords = newString.split(/\s+/).flatMap((word) => word.split(/(<br>)/));

        function findLongestMatch(oldStart, oldEnd, newStart, newEnd) {
            let bestOldStart = oldStart;
            let bestNewStart = newStart;
            let bestSize = 0;

            const lookup = new Map();
            for (let i = oldStart; i < oldEnd; i++) {
                const word = oldWords[i];
                if (!lookup.has(word)) lookup.set(word, []);
                lookup.get(word).push(i);
            }

            for (let j = newStart; j < newEnd; j++) {
                const word = newWords[j];
                if (!lookup.has(word)) continue;

                for (const i of lookup.get(word)) {
                    let size = 0;
                    while (i + size < oldEnd && j + size < newEnd && oldWords[i + size] === newWords[j + size]) {
                        size++;
                    }
                    if (size > bestSize) {
                        bestOldStart = i;
                        bestNewStart = j;
                        bestSize = size;
                    }
                }
            }

            return {
                oldStart: bestOldStart,
                newStart: bestNewStart,
                size: bestSize
            };
        }

        function buildDiff(oldStart, oldEnd, newStart, newEnd) {
            const result = [];
            const match = findLongestMatch(oldStart, oldEnd, newStart, newEnd);

            if (match.size > 0) {
                // Handle differences before the match
                if (oldStart < match.oldStart || newStart < match.newStart) {
                    result.push(...buildDiff(oldStart, match.oldStart, newStart, match.newStart));
                }

                // Add the matched words
                result.push(oldWords.slice(match.oldStart, match.oldStart + match.size).join(' '));

                // Handle differences after the match
                if (match.oldStart + match.size < oldEnd || match.newStart + match.size < newEnd) {
                    result.push(...buildDiff(match.oldStart + match.size, oldEnd, match.newStart + match.size, newEnd));
                }
            } else {
                function build(words, start, end, pattern) {
                    let r = [];
                    let ts = words
                        .slice(start, end)
                        .filter((w) => w.length > 0)
                        .join(' ')
                        .split('<br>');
                    for (let i = 0; i < ts.length; i++) {
                        if (i > 0) r.push('<br>');
                        if (ts[i].length < 1) continue;
                        r.push(pattern.replace('{{text}}', ts[i]));
                    }
                    return r;
                }

                // Add deletions
                if (oldStart < oldEnd) result.push(...build(oldWords, oldStart, oldEnd, markerDeletion));

                // Add insertions
                if (newStart < newEnd) result.push(...build(newWords, newStart, newEnd, markerAddition));
            }

            return result;
        }

        return buildDiff(0, oldWords.length, 0, newWords.length)
            .join(' ')
            .replace(/<br>[ ]+<br>/g, '<br><br>')
            .replace(/<br> /g, '<br>');
    }
</script>
