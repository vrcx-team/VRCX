<template>
    <safe-dialog
        class="x-dialog"
        :visible.sync="groupMemberModeration.visible"
        :title="t('dialog.group_member_moderation.header')"
        append-to-body
        width="90vw">
        <div>
            <h3>{{ groupMemberModeration.groupRef.name }}</h3>
            <el-tabs type="card" style="height: 100%">
                <el-tab-pane :label="t('dialog.group_member_moderation.members')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="loadAllGroupMembers" />
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">
                            {{ groupMemberModerationTable.data.length }}/{{
                                groupMemberModeration.groupRef.memberCount
                            }}
                        </span>
                        <div style="float: right; margin-top: 5px">
                            <span style="margin-right: 5px">{{ t('dialog.group.members.sort_by') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="
                                    Boolean(
                                        isGroupMembersLoading ||
                                            memberSearch.length ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                    )
                                "
                                @click.native.stop>
                                <el-button size="mini">
                                    <span
                                        >{{ t(memberSortOrder.name) }} <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="item in groupDialogSortingOptions"
                                        :key="item.name"
                                        @click.native="setGroupMemberSortOrder(item)">
                                        {{ t(item.name) }}
                                    </el-dropdown-item>
                                </el-dropdown-menu>
                            </el-dropdown>
                            <span style="margin-right: 5px">{{ t('dialog.group.members.filter') }}</span>
                            <el-dropdown
                                trigger="click"
                                size="small"
                                style="margin-right: 5px"
                                :disabled="
                                    Boolean(
                                        isGroupMembersLoading ||
                                            memberSearch.length ||
                                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')
                                    )
                                "
                                @click.native.stop>
                                <el-button size="mini">
                                    <span
                                        >{{ t(memberFilter.name) }} <i class="el-icon-arrow-down el-icon--right"></i
                                    ></span>
                                </el-button>
                                <el-dropdown-menu slot="dropdown">
                                    <el-dropdown-item
                                        v-for="item in groupDialogFilterOptions"
                                        :key="item.name"
                                        @click.native="setGroupMemberFilter(item)"
                                        v-text="t(item.name)"></el-dropdown-item>
                                    <el-dropdown-item
                                        v-for="item in groupMemberModeration.groupRef.roles"
                                        :key="item.name"
                                        @click.native="setGroupMemberFilter(item)"
                                        ><span v-if="!item.defaultRole">{{ t(item.name) }}</span></el-dropdown-item
                                    >
                                </el-dropdown-menu>
                            </el-dropdown>
                        </div>
                        <el-input
                            v-model="memberSearch"
                            :disabled="!hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')"
                            clearable
                            size="mini"
                            :placeholder="t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px"
                            @input="groupMembersSearch"></el-input>
                        <br />
                        <el-button size="small" @click="selectAllGroupMembers">{{
                            t('dialog.group_member_moderation.select_all')
                        }}</el-button>
                        <data-tables
                            v-if="groupMemberModerationTable.data.length"
                            v-bind="groupMemberModerationTable"
                            style="margin-top: 10px">
                            <el-table-column width="55" prop="$selected">
                                <template #default="scope">
                                    <el-button type="text" size="mini" @click.stop>
                                        <el-checkbox
                                            v-model="scope.row.$selected"
                                            @change="
                                                groupMemberModerationTableSelectionChange(scope.row)
                                            "></el-checkbox>
                                    </el-button>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.avatar')"
                                width="70"
                                prop="photo">
                                <template #default="scope">
                                    <el-popover placement="right" height="500px" trigger="hover">
                                        <img
                                            slot="reference"
                                            v-lazy="userImage(scope.row.user)"
                                            class="friends-list-avatar" />
                                        <img
                                            v-lazy="userImageFull(scope.row.user)"
                                            class="friends-list-avatar"
                                            style="height: 500px; cursor: pointer"
                                            @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                    </el-popover>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.display_name')"
                                width="160"
                                prop="$displayName"
                                sortable>
                                <template #default="scope">
                                    <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                        <span
                                            v-if="randomUserColours"
                                            :style="{ color: scope.row.user.$userColour }"
                                            v-text="scope.row.user.displayName"></span>
                                        <span v-else v-text="scope.row.user.displayName"></span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('dialog.group_member_moderation.roles')" prop="roleIds" sortable>
                                <template #default="scope">
                                    <template v-for="(roleId, index) in scope.row.roleIds">
                                        <template v-for="(role, rIndex) in groupMemberModeration.groupRef.roles">
                                            <span v-if="role?.id === roleId" :key="roleId + rIndex"
                                                >{{ role.name
                                                }}<span v-if="index < scope.row.roleIds.length - 1">, </span></span
                                            ></template
                                        >
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.notes')"
                                prop="managerNotes"
                                sortable>
                                <template #default="scope">
                                    <span @click.stop v-text="scope.row.managerNotes"></span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.joined_at')"
                                width="170"
                                prop="joinedAt"
                                sortable>
                                <template #default="scope">
                                    <span>{{ formatDateFilter(scope.row.joinedAt, 'long') }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.visibility')"
                                width="120"
                                prop="visibility"
                                sortable>
                                <template #default="scope">
                                    <span v-text="scope.row.visibility"></span>
                                </template>
                            </el-table-column>
                        </data-tables>
                    </div>
                </el-tab-pane>

                <el-tab-pane
                    :label="t('dialog.group_member_moderation.bans')"
                    :disabled="!hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="getAllGroupBans(groupMemberModeration.id)"></el-button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            groupBansModerationTable.data.length
                        }}</span>
                        <br />
                        <el-input
                            v-model="groupBansModerationTable.filters[0].value"
                            clearable
                            size="mini"
                            :placeholder="t('dialog.group.members.search')"
                            style="margin-top: 10px; margin-bottom: 10px"></el-input>
                        <br />
                        <el-button size="small" @click="selectAllGroupBans">{{
                            t('dialog.group_member_moderation.select_all')
                        }}</el-button>
                        <data-tables v-bind="groupBansModerationTable" style="margin-top: 10px">
                            <el-table-column width="55" prop="$selected">
                                <template #default="scope">
                                    <el-button type="text" size="mini" @click.stop>
                                        <el-checkbox
                                            v-model="scope.row.$selected"
                                            @change="
                                                groupMemberModerationTableSelectionChange(scope.row)
                                            "></el-checkbox>
                                    </el-button>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.avatar')"
                                width="70"
                                prop="photo">
                                <template #default="scope">
                                    <el-popover placement="right" height="500px" trigger="hover">
                                        <img
                                            slot="reference"
                                            v-lazy="userImage(scope.row.user)"
                                            class="friends-list-avatar" />
                                        <img
                                            v-lazy="userImageFull(scope.row.user)"
                                            class="friends-list-avatar"
                                            style="height: 500px; cursor: pointer"
                                            @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                    </el-popover>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.display_name')"
                                width="160"
                                prop="$displayName"
                                sortable>
                                <template #default="scope">
                                    <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                        <span
                                            v-if="randomUserColours"
                                            :style="{ color: scope.row.user.$userColour }"
                                            v-text="scope.row.user.displayName"></span>
                                        <span v-else v-text="scope.row.user.displayName"></span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('dialog.group_member_moderation.roles')" prop="roleIds" sortable>
                                <template #default="scope">
                                    <template v-for="(roleId, index) in scope.row.roleIds">
                                        <span
                                            v-for="(role, rIndex) in groupMemberModeration.groupRef.roles"
                                            v-if="role.id === roleId"
                                            :key="rIndex + roleId"
                                            >{{ role.name }}</span
                                        >
                                        <span v-if="index < scope.row.roleIds.length - 1" :key="index + roleId"
                                            >,
                                        </span>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.notes')"
                                prop="managerNotes"
                                sortable>
                                <template #default="scope">
                                    <span @click.stop v-text="scope.row.managerNotes"></span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.joined_at')"
                                width="170"
                                prop="joinedAt"
                                sortable>
                                <template #default="scope">
                                    <span>{{ formatDateFilter(scope.row.joinedAt, 'long') }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.banned_at')"
                                width="170"
                                prop="bannedAt"
                                sortable>
                                <template #default="scope">
                                    <span>{{ formatDateFilter(scope.row.bannedAt, 'long') }}</span>
                                </template>
                            </el-table-column>
                        </data-tables>
                    </div>
                </el-tab-pane>

                <el-tab-pane
                    :label="t('dialog.group_member_moderation.invites')"
                    :disabled="!hasGroupPermission(groupMemberModeration.groupRef, 'group-invites-manage')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="getAllGroupInvitesAndJoinRequests(groupMemberModeration.id)"></el-button>
                        <br />
                        <el-tabs>
                            <el-tab-pane>
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        t('dialog.group_member_moderation.sent_invites')
                                    }}</span>
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupInvitesModerationTable.data.length
                                    }}</span>
                                </span>
                                <el-button size="small" @click="selectAllGroupInvites">{{
                                    t('dialog.group_member_moderation.select_all')
                                }}</el-button>
                                <data-tables v-bind="groupInvitesModerationTable" style="margin-top: 10px">
                                    <el-table-column width="55" prop="$selected">
                                        <template #default="scope">
                                            <el-button type="text" size="mini" @click.stop>
                                                <el-checkbox
                                                    v-model="scope.row.$selected"
                                                    @change="
                                                        groupMemberModerationTableSelectionChange(scope.row)
                                                    "></el-checkbox>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.avatar')"
                                        width="70"
                                        prop="photo">
                                        <template #default="scope">
                                            <el-popover placement="right" height="500px" trigger="hover">
                                                <img
                                                    slot="reference"
                                                    v-lazy="userImage(scope.row.user)"
                                                    class="friends-list-avatar" />
                                                <img
                                                    v-lazy="userImageFull(scope.row.user)"
                                                    class="friends-list-avatar"
                                                    style="height: 500px; cursor: pointer"
                                                    @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.display_name')"
                                        width="160"
                                        prop="$displayName"
                                        sortable>
                                        <template #default="scope">
                                            <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                                <span
                                                    v-if="randomUserColours"
                                                    :style="{ color: scope.row.user.$userColour }"
                                                    v-text="scope.row.user.displayName"></span>
                                                <span v-else v-text="scope.row.user.displayName"></span>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.notes')"
                                        prop="managerNotes"
                                        sortable>
                                        <template #default="scope">
                                            <span @click.stop v-text="scope.row.managerNotes"></span>
                                        </template>
                                    </el-table-column>
                                </data-tables>
                                <br />
                                <el-button
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                        )
                                    "
                                    @click="groupMembersDeleteSentInvite"
                                    >{{ t('dialog.group_member_moderation.delete_sent_invite') }}</el-button
                                >
                            </el-tab-pane>

                            <el-tab-pane>
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        t('dialog.group_member_moderation.join_requests')
                                    }}</span>
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupJoinRequestsModerationTable.data.length
                                    }}</span>
                                </span>
                                <el-button size="small" @click="selectAllGroupJoinRequests">{{
                                    t('dialog.group_member_moderation.select_all')
                                }}</el-button>
                                <data-tables v-bind="groupJoinRequestsModerationTable" style="margin-top: 10px">
                                    <el-table-column width="55" prop="$selected">
                                        <template #default="scope">
                                            <el-button type="text" size="mini" @click.stop>
                                                <el-checkbox
                                                    v-model="scope.row.$selected"
                                                    @change="
                                                        groupMemberModerationTableSelectionChange(scope.row)
                                                    "></el-checkbox>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.avatar')"
                                        width="70"
                                        prop="photo">
                                        <template #default="scope">
                                            <el-popover placement="right" height="500px" trigger="hover">
                                                <img
                                                    slot="reference"
                                                    v-lazy="userImage(scope.row.user)"
                                                    class="friends-list-avatar" />
                                                <img
                                                    v-lazy="userImageFull(scope.row.user)"
                                                    class="friends-list-avatar"
                                                    style="height: 500px; cursor: pointer"
                                                    @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.display_name')"
                                        width="160"
                                        prop="$displayName"
                                        sortable>
                                        <template #default="scope">
                                            <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                                <span
                                                    v-if="randomUserColours"
                                                    :style="{ color: scope.row.user.$userColour }"
                                                    v-text="scope.row.user.displayName"></span>
                                                <span v-else v-text="scope.row.user.displayName"></span>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.notes')"
                                        prop="managerNotes"
                                        sortable>
                                        <template #default="scope">
                                            <span @click.stop v-text="scope.row.managerNotes"></span>
                                        </template>
                                    </el-table-column>
                                </data-tables>
                                <br />
                                <el-button
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                        )
                                    "
                                    @click="groupMembersAcceptInviteRequest"
                                    >{{ t('dialog.group_member_moderation.accept_join_requests') }}</el-button
                                >
                                <el-button
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                        )
                                    "
                                    @click="groupMembersRejectInviteRequest"
                                    >{{ t('dialog.group_member_moderation.reject_join_requests') }}</el-button
                                >
                                <el-button
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                        )
                                    "
                                    @click="groupMembersBlockJoinRequest"
                                    >{{ t('dialog.group_member_moderation.block_join_requests') }}</el-button
                                >
                            </el-tab-pane>

                            <el-tab-pane>
                                <span slot="label">
                                    <span style="font-weight: bold; font-size: 16px">{{
                                        t('dialog.group_member_moderation.blocked_requests')
                                    }}</span>
                                    <span style="color: #909399; font-size: 12px; margin-left: 5px">{{
                                        groupBlockedModerationTable.data.length
                                    }}</span>
                                </span>
                                <el-button size="small" @click="selectAllGroupBlocked">{{
                                    t('dialog.group_member_moderation.select_all')
                                }}</el-button>
                                <data-tables v-bind="groupBlockedModerationTable" style="margin-top: 10px">
                                    <el-table-column width="55" prop="$selected">
                                        <template #default="scope">
                                            <el-button type="text" size="mini" @click.stop>
                                                <el-checkbox
                                                    v-model="scope.row.$selected"
                                                    @change="
                                                        groupMemberModerationTableSelectionChange(scope.row)
                                                    "></el-checkbox>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.avatar')"
                                        width="70"
                                        prop="photo">
                                        <template #default="scope">
                                            <el-popover placement="right" height="500px" trigger="hover">
                                                <img
                                                    slot="reference"
                                                    v-lazy="userImage(scope.row.user)"
                                                    class="friends-list-avatar" />
                                                <img
                                                    v-lazy="userImageFull(scope.row.user)"
                                                    class="friends-list-avatar"
                                                    style="height: 500px; cursor: pointer"
                                                    @click="showFullscreenImageDialog(userImageFull(scope.row.user))" />
                                            </el-popover>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.display_name')"
                                        width="160"
                                        prop="$displayName"
                                        sortable>
                                        <template #default="scope">
                                            <span style="cursor: pointer" @click="showUserDialog(scope.row.userId)">
                                                <span
                                                    v-if="randomUserColours"
                                                    :style="{ color: scope.row.user.$userColour }"
                                                    v-text="scope.row.user.displayName"></span>
                                                <span v-else v-text="scope.row.user.displayName"></span>
                                            </span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        :label="t('dialog.group_member_moderation.notes')"
                                        prop="managerNotes"
                                        sortable>
                                        <template #default="scope">
                                            <span @click.stop v-text="scope.row.managerNotes"></span>
                                        </template>
                                    </el-table-column>
                                </data-tables>
                                <br />
                                <el-button
                                    :disabled="
                                        Boolean(
                                            progressCurrent ||
                                                !hasGroupPermission(
                                                    groupMemberModeration.groupRef,
                                                    'group-invites-manage'
                                                )
                                        )
                                    "
                                    @click="groupMembersDeleteBlockedRequest"
                                    >{{ t('dialog.group_member_moderation.delete_blocked_requests') }}</el-button
                                >
                            </el-tab-pane>
                        </el-tabs>
                    </div>
                </el-tab-pane>

                <el-tab-pane
                    :label="t('dialog.group_member_moderation.logs')"
                    :disabled="!hasGroupPermission(groupMemberModeration.groupRef, 'group-audit-view')">
                    <div style="margin-top: 10px">
                        <el-button
                            type="default"
                            size="mini"
                            icon="el-icon-refresh"
                            :loading="isGroupMembersLoading"
                            circle
                            @click="getAllGroupLogs(groupMemberModeration.id)"></el-button>
                        <span style="font-size: 14px; margin-left: 5px; margin-right: 5px">{{
                            groupLogsModerationTable.data.length
                        }}</span>
                        <br />
                        <div style="display: flex; justify-content: space-between; align-items: center">
                            <div>
                                <el-select
                                    v-model="selectedAuditLogTypes"
                                    multiple
                                    collapse-tags
                                    :placeholder="t('dialog.group_member_moderation.filter_type')"
                                    style="margin: 10px 0; width: 250px">
                                    <el-option-group :label="t('dialog.group_member_moderation.select_type')">
                                        <el-option
                                            v-for="type in groupMemberModeration.auditLogTypes"
                                            :key="type"
                                            class="x-friend-item"
                                            :label="getAuditLogTypeName(type)"
                                            :value="type">
                                            <div class="detail">
                                                <span class="name" v-text="getAuditLogTypeName(type)"></span>
                                            </div>
                                        </el-option>
                                    </el-option-group>
                                </el-select>
                                <el-input
                                    v-model="groupLogsModerationTable.filters[0].value"
                                    :placeholder="t('dialog.group_member_moderation.search_placeholder')"
                                    style="display: inline-block; width: 150px; margin: 10px"
                                    clearable></el-input>
                            </div>
                            <div>
                                <el-button @click="showGroupLogsExportDialog">{{
                                    t('dialog.group_member_moderation.export_logs')
                                }}</el-button>
                            </div>
                        </div>
                        <br />
                        <data-tables v-bind="groupLogsModerationTable" style="margin-top: 10px">
                            <el-table-column
                                :label="t('dialog.group_member_moderation.created_at')"
                                width="170"
                                prop="created_at"
                                sortable>
                                <template #default="scope">
                                    <span>{{ formatDateFilter(scope.row.created_at, 'long') }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.type')"
                                width="190"
                                prop="eventType"
                                sortable>
                                <template #default="scope">
                                    <span v-text="scope.row.eventType"></span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.display_name')"
                                width="160"
                                prop="actorDisplayName"
                                sortable>
                                <template #default="scope">
                                    <span style="cursor: pointer" @click="showUserDialog(scope.row.actorId)">
                                        <span v-text="scope.row.actorDisplayName"></span>
                                    </span>
                                </template>
                            </el-table-column>
                            <el-table-column
                                :label="t('dialog.group_member_moderation.description')"
                                prop="description">
                                <template #default="scope">
                                    <Location
                                        v-if="scope.row?.targetId.startsWith('wrld_')"
                                        :location="scope.row.targetId" />
                                    <span v-text="scope.row.description"></span>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('dialog.group_member_moderation.data')" prop="data">
                                <template #default="scope">
                                    <span
                                        v-if="Object.keys(scope.row.data).length"
                                        v-text="JSON.stringify(scope.row.data)"></span>
                                </template>
                            </el-table-column>
                        </data-tables>
                    </div>
                </el-tab-pane>
            </el-tabs>

            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.user_id') }}</span>
            <br />
            <el-input
                v-model="selectUserId"
                size="mini"
                style="margin-top: 5px; width: 340px"
                :placeholder="t('dialog.group_member_moderation.user_id_placeholder')"
                clearable></el-input>
            <el-button size="small" :disabled="!selectUserId" @click="selectGroupMemberUserId">{{
                t('dialog.group_member_moderation.select_user')
            }}</el-button>
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.selected_users') }}</span>
            <el-button
                type="default"
                size="mini"
                icon="el-icon-delete"
                circle
                style="margin-left: 5px"
                @click="clearSelectedGroupMembers"></el-button>
            <br />
            <el-tag
                v-for="user in selectedUsersArray"
                :key="user.id"
                type="info"
                :disable-transitions="true"
                style="margin-right: 5px; margin-top: 5px"
                closable
                @close="deleteSelectedGroupMember(user)">
                <el-tooltip v-if="user.membershipStatus !== 'member'" placement="top">
                    <template #content>
                        <span>{{ t('dialog.group_member_moderation.user_isnt_in_group') }}</span>
                    </template>
                    <i class="el-icon el-icon-warning" style="display: inline-block" />
                </el-tooltip>
                <span v-text="user.user?.displayName || user.userId" style="font-weight: bold; margin-left: 5px"></span>
            </el-tag>
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.notes') }}</span>
            <el-input
                v-model="note"
                class="extra"
                type="textarea"
                :rows="2"
                :autosize="{ minRows: 1, maxRows: 20 }"
                :placeholder="t('dialog.group_member_moderation.note_placeholder')"
                size="mini"
                resize="none"
                style="margin-top: 5px"></el-input>
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.selected_roles') }}</span>
            <br />
            <el-select
                v-model="selectedRoles"
                clearable
                multiple
                :placeholder="t('dialog.group_member_moderation.choose_roles_placeholder')"
                filterable
                style="margin-top: 5px">
                <el-option-group :label="t('dialog.group_member_moderation.roles')">
                    <el-option
                        v-for="role in groupMemberModeration.groupRef.roles"
                        :key="role.id"
                        class="x-friend-item"
                        :label="role.name"
                        :value="role.id"
                        style="height: auto">
                        <div class="detail">
                            <span class="name" v-text="role.name"></span>
                        </div>
                    </el-option>
                </el-option-group>
            </el-select>
            <br />
            <br />
            <span class="name">{{ t('dialog.group_member_moderation.actions') }}</span>
            <br />
            <el-button
                :disabled="
                    Boolean(
                        !selectedRoles.length ||
                            progressCurrent ||
                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-roles-assign')
                    )
                "
                @click="groupMembersAddRoles"
                >{{ t('dialog.group_member_moderation.add_roles') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        !selectedRoles.length ||
                            progressCurrent ||
                            !hasGroupPermission(groupMemberModeration.groupRef, 'group-roles-assign')
                    )
                "
                @click="groupMembersRemoveRoles"
                >{{ t('dialog.group_member_moderation.remove_roles') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        progressCurrent || !hasGroupPermission(groupMemberModeration.groupRef, 'group-members-manage')
                    )
                "
                @click="groupMembersSaveNote"
                >{{ t('dialog.group_member_moderation.save_note') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(
                        progressCurrent || !hasGroupPermission(groupMemberModeration.groupRef, 'group-members-remove')
                    )
                "
                @click="groupMembersKick"
                >{{ t('dialog.group_member_moderation.kick') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(progressCurrent || !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage'))
                "
                @click="groupMembersBan"
                >{{ t('dialog.group_member_moderation.ban') }}</el-button
            >
            <el-button
                :disabled="
                    Boolean(progressCurrent || !hasGroupPermission(groupMemberModeration.groupRef, 'group-bans-manage'))
                "
                @click="groupMembersUnban"
                >{{ t('dialog.group_member_moderation.unban') }}</el-button
            >
            <span v-if="progressCurrent" style="margin-top: 10px">
                <i class="el-icon-loading" style="margin-left: 5px; margin-right: 5px"></i>
                {{ t('dialog.group_member_moderation.progress') }} {{ progressCurrent }}/{{ progressTotal }}
            </span>
            <el-button v-if="progressCurrent" style="margin-left: 5px" @click="progressTotal = 0">{{
                t('dialog.group_member_moderation.cancel')
            }}</el-button>
        </div>
        <group-member-moderation-export-dialog
            :is-group-logs-export-dialog-visible.sync="isGroupLogsExportDialogVisible"
            :group-logs-moderation-table="groupLogsModerationTable" />
    </safe-dialog>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import * as workerTimers from 'worker-timers';
    import { groupRequest, userRequest } from '../../../api';
    import { groupDialogFilterOptions, groupDialogSortingOptions } from '../../../shared/constants';
    import { hasGroupPermission, userImage, userImageFull, formatDateFilter, debounce } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useGalleryStore, useGroupStore, useUserStore } from '../../../stores';
    import GroupMemberModerationExportDialog from './GroupMemberModerationExportDialog.vue';

    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { groupDialog, groupMemberModeration } = storeToRefs(useGroupStore());
    const { applyGroupMember, handleGroupMember, handleGroupMemberProps } = useGroupStore();
    const { showFullscreenImageDialog } = useGalleryStore();
    const { t } = useI18n();
    const instance = getCurrentInstance();
    const $message = instance.proxy.$message;

    const selectedUsers = reactive({});
    const selectedUsersArray = ref([]);
    const isGroupMembersLoading = ref(false);
    const isGroupMembersDone = ref(false);
    const memberFilter = ref({
        id: null,
        name: 'dialog.group.members.filters.everyone'
    });
    const memberSortOrder = ref({
        id: '',
        name: 'dialog.group.members.sorting.joined_at_desc',
        value: 'joinedAt:desc'
    });
    const members = ref([]);
    const memberSearch = ref('');

    let loadMoreGroupMembersParams = ref({
        n: 100,
        offset: 0,
        groupId: '',
        sort: '',
        roleId: ''
    });

    function setSelectedUsers(usersId, user) {
        if (!user) {
            return;
        }
        selectedUsers[usersId] = user;
        selectedUsersArray.value = Object.values(selectedUsers);
    }

    function deselectedUsers(userId, isAll = false) {
        if (isAll) {
            for (const id in selectedUsers) {
                if (Object.prototype.hasOwnProperty.call(selectedUsers, id)) {
                    delete selectedUsers[id];
                }
            }
        } else {
            if (Object.prototype.hasOwnProperty.call(selectedUsers, userId)) {
                delete selectedUsers[userId];
            }
        }
        selectedUsersArray.value = Object.values(selectedUsers);
    }

    function groupMemberModerationTableSelectionChange(row) {
        if (row.$selected && !selectedUsers[row.userId]) {
            setSelectedUsers(row.userId, row);
        } else if (!row.$selected && selectedUsers[row.userId]) {
            deselectedUsers(row.userId);
        }
    }

    const groupInvitesModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });
    const groupJoinRequestsModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });
    const groupBlockedModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });
    const groupLogsModerationTable = reactive({
        data: [],
        filters: [{ prop: ['description'], value: '' }],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });
    const groupBansModerationTable = reactive({
        data: [],
        filters: [{ prop: ['$displayName'], value: '' }],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });
    const groupMemberModerationTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini' },
        pageSize: 15,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    });

    async function initializePageSize() {
        try {
            const { tablePageSize } = storeToRefs(useAppearanceSettingsStore());

            groupMemberModerationTable.pageSize = tablePageSize.value;
            groupBansModerationTable.pageSize = tablePageSize.value;
            groupLogsModerationTable.pageSize = tablePageSize.value;
            groupInvitesModerationTable.pageSize = tablePageSize.value;
            groupJoinRequestsModerationTable.pageSize = tablePageSize.value;
            groupBlockedModerationTable.pageSize = tablePageSize.value;
        } catch (error) {
            console.error('Failed to initialize table page size:', error);
        }
    }

    function deselectGroupMember(userId) {
        const deselectInTable = (tableData) => {
            if (userId) {
                const row = tableData.find((item) => item.userId === userId);
                if (row) {
                    row.$selected = false;
                }
            } else {
                tableData.forEach((row) => {
                    if (row.$selected) {
                        row.$selected = false;
                    }
                });
            }
        };

        deselectInTable(groupMemberModerationTable.data);
        deselectInTable(groupBansModerationTable.data);
        deselectInTable(groupInvitesModerationTable.data);
        deselectInTable(groupJoinRequestsModerationTable.data);
        deselectInTable(groupBlockedModerationTable.data);
    }

    const selectUserId = ref('');
    const progressCurrent = ref(0);
    const progressTotal = ref(0);
    const selectedRoles = ref([]);
    const selectedAuditLogTypes = ref([]);
    const note = ref('');
    const isGroupLogsExportDialogVisible = ref(false);

    watch(
        () => groupMemberModeration.value.visible,
        (newVal) => {
            if (newVal) {
                groupMemberModerationTable.data = [];
                groupBansModerationTable.data = [];
                groupInvitesModerationTable.data = [];
                groupJoinRequestsModerationTable.data = [];
                groupBlockedModerationTable.data = [];
                groupLogsModerationTable.data = [];
                Object.assign(selectedUsers, {});
                selectedUsersArray.value = [];
                selectUserId.value = '';
                selectedRoles.value = [];
                note.value = '';

                if (groupMemberModeration.value.openWithUserId) {
                    addGroupMemberToSelection(groupMemberModeration.value.openWithUserId);
                }
            }
        }
    );

    // created()
    initializePageSize();

    function handleGroupMemberRoleChange(args) {
        if (groupDialog.value.id === args.params.groupId) {
            groupDialog.value.members.forEach((member) => {
                if (member.userId === args.params.userId) {
                    member.roleIds = args.json;
                    return true;
                }
            });
        }
    }

    async function groupMembersDeleteSentInvite() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) {
                break;
            }
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) {
                continue;
            }
            console.log(`Deleting group invite ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.deleteSentGroupInvite({
                    groupId: D.id,
                    userId: user.userId
                });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to delete group invites: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({
                message: `Deleted ${memberCount} group invites`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvites(D.id);
    }

    function selectAllGroupMembers() {
        groupMemberModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    async function getAllGroupBans(groupId) {
        groupBansModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0 };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        const fetchedBans = [];
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupBans(params);
                if (args && args.json) {
                    if (groupMemberModeration.value.id !== args.params.groupId) {
                        continue;
                    }
                    args.json.forEach((json) => {
                        const ref = applyGroupMember(json);
                        fetchedBans.push(ref);
                    });
                    if (args.json.length < params.n) {
                        break;
                    }
                    params.offset += params.n;
                } else {
                    break;
                }
            }
            groupBansModerationTable.data = fetchedBans;
        } catch {
            $message({
                message: 'Failed to get group bans',
                type: 'error'
            });
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    function selectAllGroupBans() {
        groupBansModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    async function groupMembersBan() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;
            console.log(`Banning ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.banGroupMember({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to ban group member: ${err}`,
                    type: 'error'
                });
            }
        }
        $message({ message: `Banned ${memberCount} group members`, type: 'success' });
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupBans(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersUnban() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;
            console.log(`Unbanning ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.unbanGroupMember({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to unban group member: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }

        if (allSuccess) {
            $message({ message: `Unbanned ${memberCount} group members`, type: 'success' });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupBans(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersKick() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Kicking ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.kickGroupMember({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to kick group member: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({ message: `Kicked ${memberCount} group members`, type: 'success' });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
        loadAllGroupMembers();
    }

    async function groupMembersSaveNote() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        const noteToSave = note.value;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.managerNotes === noteToSave) {
                continue;
            }
            console.log(`Setting note ${noteToSave} for ${user.userId} ${i + 1}/${memberCount}`);
            try {
                const args = await groupRequest.setGroupMemberProps(user.userId, D.id, { managerNotes: noteToSave });
                handleGroupMemberProps(args);
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to set group member note for ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({ message: `Saved notes for ${memberCount} group members`, type: 'success' });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
    }

    async function groupMembersRemoveRoles() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const rolesToRemoveSet = new Set(selectedRoles.value);
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            const currentRoles = new Set(user.roleIds || []);
            const rolesToRemoveForUser = [];
            rolesToRemoveSet.forEach((roleId) => {
                if (currentRoles.has(roleId)) {
                    rolesToRemoveForUser.push(roleId);
                }
            });

            if (!rolesToRemoveForUser.length) continue;

            for (const roleId of rolesToRemoveForUser) {
                console.log(`Removing role ${roleId} from ${user.userId} ${i + 1}/${memberCount}`);

                try {
                    const args = await groupRequest.removeGroupMemberRole({
                        groupId: D.id,
                        userId: user.userId,
                        roleId
                    });
                    handleGroupMemberRoleChange(args);
                } catch (err) {
                    console.error(err);
                    $message({
                        message: `Failed to remove group member roles: ${err}`,
                        type: 'error'
                    });
                    allSuccess = false;
                }
            }
        }
        if (allSuccess) {
            $message({
                message: `Roles removed`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
    }

    async function groupMembersAddRoles() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const rolesToAddSet = new Set(selectedRoles.value);
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;

            const currentRoles = new Set(user.roleIds || []);
            const rolesToAddForUser = [];
            rolesToAddSet.forEach((roleId) => {
                if (!currentRoles.has(roleId)) {
                    rolesToAddForUser.push(roleId);
                }
            });

            if (!rolesToAddForUser.length) continue;

            for (const roleId of rolesToAddForUser) {
                console.log(`Adding role: ${roleId} to ${user.userId} ${i + 1}/${memberCount}`);
                try {
                    const args = await groupRequest.addGroupMemberRole({ groupId: D.id, userId: user.userId, roleId });
                    handleGroupMemberRoleChange(args);
                } catch (err) {
                    console.error(err);
                    $message({
                        message: `Failed to add group member roles: ${err}`,
                        type: 'error'
                    });
                    allSuccess = false;
                }
            }
        }
        if (allSuccess) {
            $message({
                message: `Added group member roles`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        deselectedUsers(null, true);
    }

    function deleteSelectedGroupMember(user) {
        deselectedUsers(user.userId);
        deselectGroupMember(user.userId);
    }

    function clearSelectedGroupMembers() {
        deselectedUsers(null, true);
        deselectGroupMember();
    }

    async function selectGroupMemberUserId() {
        const userIdInput = selectUserId.value;
        if (!userIdInput) return;

        const regexUserId = /usr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
        let match;
        const userIdList = new Set();
        while ((match = regexUserId.exec(userIdInput)) !== null) {
            userIdList.add(match[0]);
        }

        if (userIdList.size === 0) {
            // for those users missing the usr_ prefix
            userIdList.add(userIdInput);
        }
        const promises = [];
        userIdList.forEach((userId) => {
            promises.push(addGroupMemberToSelection(userId));
        });
        await Promise.allSettled(promises);
        selectUserId.value = '';
    }

    async function addGroupMemberToSelection(userId) {
        const D = groupMemberModeration.value;
        // fetch member if there is one
        // banned members don't have a user object
        let member = {};
        const memberArgs = await groupRequest.getGroupMember({ groupId: D.id, userId });
        if (memberArgs && memberArgs.json) {
            member = applyGroupMember(memberArgs.json);
        }
        if (member && member.user) {
            setSelectedUsers(member.userId, member);
            return;
        }
        const userArgs = await userRequest.getCachedUser({
            userId
        });
        member.userId = userArgs.json.id;
        member.user = userArgs.json;
        member.displayName = userArgs.json.displayName;
        setSelectedUsers(member.userId, member);
    }

    async function getAllGroupLogs(groupId) {
        groupLogsModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0 };
        if (selectedAuditLogTypes.value.length) {
            params.eventTypes = selectedAuditLogTypes.value;
        }
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupLogs(params);
                if (args) {
                    if (groupMemberModeration.value.id !== args.params.groupId) {
                        continue;
                    }

                    for (const json of args.json.results) {
                        const existsInData = groupLogsModerationTable.data.some((dataItem) => dataItem.id === json.id);
                        if (!existsInData) {
                            groupLogsModerationTable.data.push(json);
                        }
                    }
                }
                params.offset += params.n;
                if (!args.json.hasNext) {
                    break;
                }
            }
        } catch {
            $message({
                message: 'Failed to get group logs',
                type: 'error'
            });
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    async function groupMembersDeleteBlockedRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;

        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;

            if (user.userId === currentUser.value.id) {
                continue;
            }

            console.log(`Deleting blocked group request for ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.deleteBlockedGroupRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to delete blocked group requests: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({
                message: `Deleted ${memberCount} blocked group requests`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersBlockJoinRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Blocking group join request from ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.blockGroupInviteRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to block group join requests: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({
                message: `Blocked ${memberCount} group join requests`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersRejectInviteRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;

        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Rejecting group join request from ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.rejectGroupInviteRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to reject group join requests: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({
                message: `Rejected ${memberCount} group join requests`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function groupMembersAcceptInviteRequest() {
        const D = groupMemberModeration.value;
        const users = [...selectedUsersArray.value];
        const memberCount = users.length;
        progressTotal.value = memberCount;
        let allSuccess = true;
        for (let i = 0; i < memberCount; i++) {
            if (!progressTotal.value) break;
            const user = users[i];
            progressCurrent.value = i + 1;
            if (user.userId === currentUser.value.id) continue;

            console.log(`Accepting group join request from ${user.userId} ${i + 1}/${memberCount}`);
            try {
                await groupRequest.acceptGroupInviteRequest({ groupId: D.id, userId: user.userId });
            } catch (err) {
                console.error(err);
                $message({
                    message: `Failed to accept group join requests: ${err}`,
                    type: 'error'
                });
                allSuccess = false;
            }
        }
        if (allSuccess) {
            $message({
                message: `Accepted ${memberCount} group join requests`,
                type: 'success'
            });
        }
        progressCurrent.value = 0;
        progressTotal.value = 0;
        getAllGroupInvitesAndJoinRequests(D.id);
        deselectedUsers(null, true);
    }

    async function getAllGroupInvitesAndJoinRequests(groupId) {
        try {
            await Promise.all([
                getAllGroupInvites(groupId),
                getAllGroupJoinRequests(groupId),
                getAllGroupBlockedRequests(groupId)
            ]);
        } catch (error) {
            console.error('Error fetching group invites/requests:', error);
        }
    }

    async function getAllGroupBlockedRequests(groupId) {
        groupBlockedModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0, blocked: true };
        const count = 50; // 5000
        isGroupMembersLoading.value = true;

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupJoinRequests(params);
                if (groupMemberModeration.value.id !== args.params.groupId) {
                    return;
                }
                const targetTable = args.params.blocked
                    ? groupBlockedModerationTable
                    : groupJoinRequestsModerationTable;
                for (const json of args.json) {
                    const ref = applyGroupMember(json);
                    targetTable.data.push(ref);
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
            }
        } catch {
            $message({
                message: 'Failed to get group join requests',
                type: 'error'
            });
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    async function getAllGroupJoinRequests(groupId) {
        groupJoinRequestsModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0, blocked: false };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;
        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupJoinRequests(params);
                if (groupMemberModeration.value.id !== args.params.groupId) {
                    return;
                }
                const targetTable = args.params.blocked
                    ? groupBlockedModerationTable
                    : groupJoinRequestsModerationTable;
                for (const json of args.json) {
                    const ref = applyGroupMember(json);
                    targetTable.data.push(ref);
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
            }
        } catch {
            $message({
                message: 'Failed to get group join requests',
                type: 'error'
            });
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    async function getAllGroupInvites(groupId) {
        groupInvitesModerationTable.data = [];
        const params = { groupId, n: 100, offset: 0 };
        const count = 50; // 5000 max
        isGroupMembersLoading.value = true;

        try {
            for (let i = 0; i < count; i++) {
                const args = await groupRequest.getGroupInvites(params);
                if (args) {
                    if (groupMemberModeration.value.id !== args.params.groupId) {
                        return;
                    }

                    for (const json of args.json) {
                        const ref = applyGroupMember(json);
                        groupInvitesModerationTable.data.push(ref);
                    }
                }
                params.offset += params.n;
                if (args.json.length < params.n) {
                    break;
                }
                if (!groupMemberModeration.value.visible) {
                    break;
                }
            }
        } catch {
            $message({
                message: 'Failed to get group invites',
                type: 'error'
            });
        } finally {
            isGroupMembersLoading.value = false;
        }
    }

    function selectAllGroupInvites() {
        groupInvitesModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    function selectAllGroupJoinRequests() {
        groupJoinRequestsModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    function selectAllGroupBlocked() {
        groupBlockedModerationTable.data.forEach((row) => {
            row.$selected = true;
            setSelectedUsers(row.userId, row);
        });
    }

    function showGroupLogsExportDialog() {
        isGroupLogsExportDialogVisible.value = true;
    }

    function getAuditLogTypeName(auditLogType) {
        if (!auditLogType) return '';
        return auditLogType
            .replace('group.', '')
            .replace(/\./g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }

    function groupMembersSearch() {
        if (memberSearch.value.length < 3) {
            groupMemberModerationTable.data = [];
            isGroupMembersLoading.value = false;
            return;
        }
        isGroupMembersLoading.value = true;
        debounce(groupMembersSearchDebounced, 200)();
    }

    function groupMembersSearchDebounced() {
        const groupId = groupMemberModeration.value.id;
        const search = memberSearch.value;
        groupMemberModerationTable.data = [];
        if (memberSearch.value.length < 3) {
            return;
        }
        isGroupMembersLoading.value = true;
        groupRequest
            .getGroupMembersSearch({
                groupId,
                query: search,
                n: 100,
                offset: 0
            })
            .then((args) => {
                for (const json of args.json.results) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                if (groupId === args.params.groupId) {
                    groupMemberModerationTable.data = args.json.results.map((member) => ({
                        ...member,
                        $selected: Boolean(selectedUsers[member.userId])
                    }));
                }
            })
            .finally(() => {
                isGroupMembersLoading.value = false;
            });
    }

    async function getGroupMembers() {
        members.value = [];
        isGroupMembersDone.value = false;
        loadMoreGroupMembersParams.value = {
            sort: '',
            roleId: '',
            n: 100,
            offset: 0,
            groupId: groupMemberModeration.value.id
        };
        if (memberSortOrder.value.value) {
            loadMoreGroupMembersParams.value.sort = memberSortOrder.value.value;
        }
        if (memberFilter.value.id !== null) {
            loadMoreGroupMembersParams.value.roleId = memberFilter.value.id;
        }
        await groupRequest
            .getGroupMember({
                groupId: groupMemberModeration.value.id,
                userId: currentUser.value.id
            })
            .then((args) => {
                args.ref = applyGroupMember(args.json);
                if (args.json) {
                    args.json.user = currentUser.value;
                    if (memberFilter.value.id === null) {
                        // when filtered by role don't include self
                        members.value.push(args.json);
                    }
                }
                return args;
            });
        await loadMoreGroupMembers();
    }

    async function loadMoreGroupMembers() {
        if (isGroupMembersDone.value || isGroupMembersLoading.value) {
            return;
        }
        const params = loadMoreGroupMembersParams.value;
        if (params.roleId === '') {
            delete params.roleId;
        }
        memberSearch.value = '';
        isGroupMembersLoading.value = true;
        await groupRequest
            .getGroupMembers(params)
            .finally(() => {
                isGroupMembersLoading.value = false;
            })
            .then((args) => {
                for (const json of args.json) {
                    handleGroupMember({
                        json,
                        params: {
                            groupId: args.params.groupId
                        }
                    });
                }
                for (let i = 0; i < args.json.length; i++) {
                    const member = args.json[i];
                    if (member.userId === currentUser.value.id) {
                        if (members.value.length > 0 && members.value[0].userId === currentUser.value.id) {
                            // remove duplicate and keep sort order
                            members.value.splice(0, 1);
                        }
                        break;
                    }
                }
                if (args.json.length < params.n) {
                    isGroupMembersDone.value = true;
                }
                members.value = [...members.value, ...args.json];
                groupMemberModerationTable.data = members.value.map((member) => ({
                    ...member,
                    $selected: Boolean(selectedUsers[member.userId])
                }));

                params.offset += params.n;
                return args;
            })
            .catch((err) => {
                isGroupMembersDone.value = true;
                throw err;
            });
    }

    async function setGroupMemberSortOrder(sortOrder) {
        if (memberSortOrder.value === sortOrder) {
            return;
        }
        memberSortOrder.value = sortOrder;
        await getGroupMembers();
    }

    async function loadAllGroupMembers() {
        if (isGroupMembersLoading.value) {
            return;
        }
        await getGroupMembers();
        while (groupMemberModeration.value.visible && !isGroupMembersDone.value) {
            isGroupMembersLoading.value = true;
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
            isGroupMembersLoading.value = false;
            await loadMoreGroupMembers();
        }
    }

    async function setGroupMemberFilter(filter) {
        if (memberFilter.value === filter) {
            return;
        }
        memberFilter.value = filter;
        await getGroupMembers();
    }
</script>
