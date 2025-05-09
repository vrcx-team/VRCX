<template>
    <safe-dialog :title="$t('dialog.export_friends_list.header')" :visible.sync="isVisible" width="650px">
        <el-tabs type="card">
            <el-tab-pane :label="$t('dialog.export_friends_list.csv')">
                <el-input
                    v-model="exportFriendsListCsv"
                    type="textarea"
                    size="mini"
                    rows="15"
                    resize="none"
                    readonly
                    style="margin-top: 15px"
                    @click.native="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
            </el-tab-pane>
            <el-tab-pane :label="$t('dialog.export_friends_list.json')">
                <el-input
                    v-model="exportFriendsListJson"
                    type="textarea"
                    size="mini"
                    rows="15"
                    resize="none"
                    readonly
                    style="margin-top: 15px"
                    @click.native="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
            </el-tab-pane>
        </el-tabs>
    </safe-dialog>
</template>

<script>
    export default {
        name: 'ExportFriendsListDialog',
        inject: ['API'],
        props: {
            friends: Map,
            isExportFriendsListDialogVisible: Boolean
        },
        data() {
            return {
                exportFriendsListCsv: '',
                exportFriendsListJson: ''
            };
        },
        computed: {
            isVisible: {
                get() {
                    return this.isExportFriendsListDialogVisible;
                },
                set(value) {
                    this.$emit('update:is-export-friends-list-dialog-visible', value);
                }
            }
        },
        watch: {
            isExportFriendsListDialogVisible(value) {
                if (value) {
                    this.initExportFriendsListDialog();
                }
            }
        },
        methods: {
            initExportFriendsListDialog() {
                const { friends } = this.API.currentUser;
                if (Array.isArray(friends) === false) {
                    return;
                }
                const lines = ['UserID,DisplayName,Memo'];
                const _ = function (str) {
                    if (/[\x00-\x1f,"]/.test(str) === true) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };
                const friendsList = [];
                for (const userId of friends) {
                    const ref = this.friends.get(userId);
                    const name = (typeof ref !== 'undefined' && ref.name) || '';
                    const memo = (typeof ref !== 'undefined' && ref.memo.replace(/\n/g, ' ')) || '';
                    lines.push(`${_(userId)},${_(name)},${_(memo)}`);
                    friendsList.push(userId);
                }
                this.exportFriendsListJson = JSON.stringify({ friends: friendsList }, null, 4);
                this.exportFriendsListCsv = lines.join('\n');
            }
        }
    };
</script>
