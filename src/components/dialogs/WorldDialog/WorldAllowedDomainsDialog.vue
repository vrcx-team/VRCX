<template>
    <safe-dialog
        :visible.sync="isVisible"
        :title="$t('dialog.allowed_video_player_domains.header')"
        width="600px"
        destroy-on-close
        append-to-body>
        <div>
            <el-input
                v-for="(domain, index) in urlList"
                :key="index"
                v-model="urlList[index]"
                :value="domain"
                size="small"
                style="margin-top: 5px">
                <el-button slot="append" icon="el-icon-delete" @click="urlList.splice(index, 1)"></el-button>
            </el-input>
            <el-button size="mini" style="margin-top: 5px" @click="urlList.push('')">
                {{ $t('dialog.allowed_video_player_domains.add_domain') }}
            </el-button>
        </div>
        <template #footer>
            <el-button
                type="primary"
                size="small"
                :disabled="!worldAllowedDomainsDialog.worldId"
                @click="saveWorldAllowedDomains">
                {{ $t('dialog.allowed_video_player_domains.save') }}
            </el-button>
        </template>
    </safe-dialog>
</template>

<script>
    import { worldRequest } from '../../../api';

    export default {
        name: 'WorldAllowedDomainsDialog',
        props: {
            worldAllowedDomainsDialog: {
                type: Object,
                required: true
            }
        },
        data() {
            return {
                urlList: []
            };
        },
        computed: {
            isVisible: {
                get() {
                    return this.worldAllowedDomainsDialog.visible;
                },
                set(val) {
                    this.$emit('update:world-allowed-domains-dialog', {
                        ...this.worldAllowedDomainsDialog,
                        visible: val
                    });
                }
            }
        },
        watch: {
            'worldAllowedDomainsDialog.visible'(val) {
                if (val) {
                    this.urlList = this.worldAllowedDomainsDialog.urlList;
                }
            }
        },
        methods: {
            saveWorldAllowedDomains() {
                const D = this.worldAllowedDomainsDialog;
                worldRequest
                    .saveWorld({
                        id: D.worldId,
                        urlList: D.urlList
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Allowed Video Player Domains updated',
                            type: 'success'
                        });
                        return args;
                    });
                D.visible = false;
            }
        }
    };
</script>
