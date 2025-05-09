<template>
    <safe-dialog :visible.sync="isVisible" :title="$t('dialog.export_own_avatars.header')" width="650px">
        <el-input
            v-model="exportAvatarsListCsv"
            v-loading="loading"
            type="textarea"
            size="mini"
            rows="15"
            resize="none"
            readonly
            style="margin-top: 15px"
            @click.native="$event.target.tagName === 'TEXTAREA' && $event.target.select()" />
    </safe-dialog>
</template>

<script>
    import { avatarRequest } from '../../../api';

    export default {
        name: 'ExportAvatarsListDialog',
        inject: ['API'],
        props: {
            isExportAvatarsListDialogVisible: Boolean
        },
        data() {
            return {
                exportAvatarsListCsv: '',
                loading: false
            };
        },
        computed: {
            isVisible: {
                get() {
                    return this.isExportAvatarsListDialogVisible;
                },
                set(value) {
                    this.$emit('update:is-export-avatars-list-dialog-visible', value);
                }
            }
        },
        watch: {
            isExportAvatarsListDialogVisible(value) {
                if (value) {
                    this.initExportAvatarsListDialog();
                }
            }
        },
        methods: {
            initExportAvatarsListDialog() {
                this.loading = true;
                for (const ref of this.API.cachedAvatars.values()) {
                    if (ref.authorId === this.API.currentUser.id) {
                        this.API.cachedAvatars.delete(ref.id);
                    }
                }
                const params = {
                    n: 50,
                    offset: 0,
                    sort: 'updated',
                    order: 'descending',
                    releaseStatus: 'all',
                    user: 'me'
                };
                const map = new Map();
                this.API.bulk({
                    fn: avatarRequest.getAvatars,
                    N: -1,
                    params,
                    handle: (args) => {
                        for (const json of args.json) {
                            const $ref = this.API.cachedAvatars.get(json.id);
                            if (typeof $ref !== 'undefined') {
                                map.set($ref.id, $ref);
                            }
                        }
                    },
                    done: () => {
                        const avatars = Array.from(map.values());
                        if (Array.isArray(avatars) === false) {
                            return;
                        }
                        const lines = ['AvatarID,AvatarName'];
                        const _ = function (str) {
                            if (/[\x00-\x1f,"]/.test(str) === true) {
                                return `"${str.replace(/"/g, '""')}"`;
                            }
                            return str;
                        };
                        for (const avatar of avatars) {
                            lines.push(`${_(avatar.id)},${_(avatar.name)}`);
                        }
                        this.exportAvatarsListCsv = lines.join('\n');
                        this.loading = false;
                    }
                });
            }
        }
    };
</script>
