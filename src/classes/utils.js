let echarts = null;

export default {
    removeFromArray(array, item) {
        var { length } = array;
        for (var i = 0; i < length; ++i) {
            if (array[i] === item) {
                array.splice(i, 1);
                return true;
            }
        }
        return false;
    },

    arraysMatch(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) {
            return false;
        }
        return (
            a.length === b.length &&
            a.every(
                (element, index) =>
                    JSON.stringify(element) === JSON.stringify(b[index])
            )
        );
    },

    escapeTag(tag) {
        var s = String(tag);
        return s.replace(/["&'<>]/g, (c) => `&#${c.charCodeAt(0)};`);
    },

    escapeTagRecursive(obj) {
        if (typeof obj === 'string') {
            return this.escapeTag(obj);
        }
        if (typeof obj === 'object') {
            for (var key in obj) {
                obj[key] = this.escapeTagRecursive(obj[key]);
            }
        }
        return obj;
    },

    timeToText(sec, isNeedSeconds = false) {
        let n = Number(sec);
        if (isNaN(n)) {
            return this.escapeTag(sec);
        }
        n = Math.floor(n / 1000);
        const arr = [];
        if (n < 0) {
            n = -n;
        }
        if (n >= 86400) {
            arr.push(`${Math.floor(n / 86400)}d`);
            n %= 86400;
        }
        if (n >= 3600) {
            arr.push(`${Math.floor(n / 3600)}h`);
            n %= 3600;
        }
        if (n >= 60) {
            arr.push(`${Math.floor(n / 60)}m`);
            n %= 60;
        }
        if (isNeedSeconds || (arr.length === 0 && n < 60)) {
            arr.push(`${n}s`);
        }
        return arr.join(' ');
    },

    textToHex(text) {
        var s = String(text);
        return s
            .split('')
            .map((c) => c.charCodeAt(0).toString(16))
            .join(' ');
    },

    commaNumber(num) {
        if (!num) {
            return '0';
        }
        var s = String(Number(num));
        return s.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    },

    isRealInstance(instanceId) {
        if (!instanceId) {
            return false;
        }
        switch (instanceId) {
            case ':':
            case 'offline':
            case 'offline:offline':
            case 'private':
            case 'private:private':
            case 'traveling':
            case 'traveling:traveling':
            case instanceId.startsWith('local'):
                return false;
        }
        return true;
    },

    parseLocation(tag) {
        var _tag = String(tag || '');
        var ctx = {
            tag: _tag,
            isOffline: false,
            isPrivate: false,
            isTraveling: false,
            isRealInstance: false,
            worldId: '',
            instanceId: '',
            instanceName: '',
            accessType: '',
            accessTypeName: '',
            region: '',
            shortName: '',
            userId: null,
            hiddenId: null,
            privateId: null,
            friendsId: null,
            groupId: null,
            groupAccessType: null,
            canRequestInvite: false,
            strict: false,
            ageGate: false
        };
        if (_tag === 'offline' || _tag === 'offline:offline') {
            ctx.isOffline = true;
        } else if (_tag === 'private' || _tag === 'private:private') {
            ctx.isPrivate = true;
        } else if (_tag === 'traveling' || _tag === 'traveling:traveling') {
            ctx.isTraveling = true;
        } else if (!_tag.startsWith('local')) {
            ctx.isRealInstance = true;
            var sep = _tag.indexOf(':');
            // technically not part of instance id, but might be there when coping id from url so why not support it
            var shortNameQualifier = '&shortName=';
            var shortNameIndex = _tag.indexOf(shortNameQualifier);
            if (shortNameIndex >= 0) {
                ctx.shortName = _tag.substr(
                    shortNameIndex + shortNameQualifier.length
                );
                _tag = _tag.substr(0, shortNameIndex);
            }
            if (sep >= 0) {
                ctx.worldId = _tag.substr(0, sep);
                ctx.instanceId = _tag.substr(sep + 1);
                ctx.instanceId.split('~').forEach((s, i) => {
                    if (i) {
                        var A = s.indexOf('(');
                        var Z = A >= 0 ? s.lastIndexOf(')') : -1;
                        var key = Z >= 0 ? s.substr(0, A) : s;
                        var value = A < Z ? s.substr(A + 1, Z - A - 1) : '';
                        if (key === 'hidden') {
                            ctx.hiddenId = value;
                        } else if (key === 'private') {
                            ctx.privateId = value;
                        } else if (key === 'friends') {
                            ctx.friendsId = value;
                        } else if (key === 'canRequestInvite') {
                            ctx.canRequestInvite = true;
                        } else if (key === 'region') {
                            ctx.region = value;
                        } else if (key === 'group') {
                            ctx.groupId = value;
                        } else if (key === 'groupAccessType') {
                            ctx.groupAccessType = value;
                        } else if (key === 'strict') {
                            ctx.strict = true;
                        } else if (key === 'ageGate') {
                            ctx.ageGate = true;
                        }
                    } else {
                        ctx.instanceName = s;
                    }
                });
                ctx.accessType = 'public';
                if (ctx.privateId !== null) {
                    if (ctx.canRequestInvite) {
                        // InvitePlus
                        ctx.accessType = 'invite+';
                    } else {
                        // InviteOnly
                        ctx.accessType = 'invite';
                    }
                    ctx.userId = ctx.privateId;
                } else if (ctx.friendsId !== null) {
                    // FriendsOnly
                    ctx.accessType = 'friends';
                    ctx.userId = ctx.friendsId;
                } else if (ctx.hiddenId !== null) {
                    // FriendsOfGuests
                    ctx.accessType = 'friends+';
                    ctx.userId = ctx.hiddenId;
                } else if (ctx.groupId !== null) {
                    // Group
                    ctx.accessType = 'group';
                }
                ctx.accessTypeName = ctx.accessType;
                if (ctx.groupAccessType !== null) {
                    if (ctx.groupAccessType === 'public') {
                        ctx.accessTypeName = 'groupPublic';
                    } else if (ctx.groupAccessType === 'plus') {
                        ctx.accessTypeName = 'groupPlus';
                    }
                }
            } else {
                ctx.worldId = _tag;
            }
        }
        return ctx;
    },

    displayLocation(location, worldName, groupName) {
        var text = worldName;
        var L = this.parseLocation(location);
        if (L.isOffline) {
            text = 'Offline';
        } else if (L.isPrivate) {
            text = 'Private';
        } else if (L.isTraveling) {
            text = 'Traveling';
        } else if (L.worldId) {
            if (groupName) {
                text = `${worldName} ${L.accessTypeName}(${groupName})`;
            } else if (L.instanceId) {
                text = `${worldName} ${L.accessTypeName}`;
            }
        }
        return text;
    },

    extractFileId(s) {
        var match = String(s).match(/file_[0-9A-Za-z-]+/);
        return match ? match[0] : '';
    },

    extractFileVersion(s) {
        var match = /(?:\/file_[0-9A-Za-z-]+\/)([0-9]+)/gi.exec(s);
        return match ? match[1] : '';
    },

    extractVariantVersion(url) {
        if (!url) {
            return '0';
        }
        try {
            const params = new URLSearchParams(new URL(url).search);
            const version = params.get('v');
            if (version) {
                return version;
            }
            return '0';
        } catch {
            return '0';
        }
    },

    buildTreeData(json) {
        var node = [];
        for (var key in json) {
            if (key[0] === '$') {
                continue;
            }
            var value = json[key];
            if (Array.isArray(value) && value.length === 0) {
                node.push({
                    key,
                    value: '[]'
                });
            } else if (
                value === Object(value) &&
                Object.keys(value).length === 0
            ) {
                node.push({
                    key,
                    value: '{}'
                });
            } else if (Array.isArray(value)) {
                node.push({
                    children: value.map((val, idx) => {
                        if (val === Object(val)) {
                            return {
                                children: this.buildTreeData(val),
                                key: idx
                            };
                        }
                        return {
                            key: idx,
                            value: val
                        };
                    }),
                    key
                });
            } else if (value === Object(value)) {
                node.push({
                    children: this.buildTreeData(value),
                    key
                });
            } else {
                node.push({
                    key,
                    value: String(value)
                });
            }
        }
        node.sort(function (a, b) {
            var A = String(a.key).toUpperCase();
            var B = String(b.key).toUpperCase();
            if (A < B) {
                return -1;
            }
            if (A > B) {
                return 1;
            }
            return 0;
        });
        return node;
    },

    // app.js 4900ln
    // descending
    compareByCreatedAt(a, b) {
        if (
            typeof a.created_at !== 'string' ||
            typeof b.created_at !== 'string'
        ) {
            return 0;
        }
        var A = a.created_at.toUpperCase();
        var B = b.created_at.toUpperCase();
        if (A < B) {
            return 1;
        }
        if (A > B) {
            return -1;
        }
        return 0;
    },
    // lazy load echarts
    loadEcharts() {
        if (echarts) {
            return Promise.resolve(echarts);
        }
        return import('echarts').then((module) => {
            echarts = module;
            return echarts;
        });
    },
    // CJK character in Japanese, Korean, Chinese are different
    // so change font-family order when users change language to display CJK character correctly
    changeCJKorder(lang) {
        const otherFonts = window
            .getComputedStyle(document.body)
            .fontFamily.split(',')
            .filter((item) => !item.includes('Noto Sans'))
            .join(', ');
        const notoSans = 'Noto Sans';

        const fontFamilies = {
            ja_JP: ['JP', 'KR', 'TC', 'SC'],
            ko: ['KR', 'JP', 'TC', 'SC'],
            zh_TW: ['TC', 'JP', 'KR', 'SC'],
            zh_CN: ['SC', 'JP', 'KR', 'TC']
        };

        if (fontFamilies[lang]) {
            const CJKFamily = fontFamilies[lang]
                .map((item) => `${notoSans} ${item}`)
                .join(', ');
            document.body.style.fontFamily = `${CJKFamily}, ${otherFonts}`;
        }
    },
    localeIncludes(str, search, comparer) {
        // These checks are stolen from https://stackoverflow.com/a/69623589/11030436
        if (search === '') {
            return true;
        } else if (!str || !search) {
            return false;
        }
        const strObj = String(str);
        const searchObj = String(search);

        if (strObj.length === 0) {
            return false;
        }

        if (searchObj.length > strObj.length) {
            return false;
        }

        // Now simply loop through each substring and compare them
        for (let i = 0; i < str.length - searchObj.length + 1; i++) {
            const substr = strObj.substring(i, i + searchObj.length);
            if (comparer.compare(substr, searchObj) === 0) {
                return true;
            }
        }
        return false;
    },
    convertFileUrlToImageUrl(url, resolution = 128) {
        if (!url) {
            return '';
        }
        /**
         * possible patterns?
         * /file/file_fileId/version
         * /file/file_fileId/version/
         * /file/file_fileId/version/file
         * /file/file_fileId/version/file/
         */
        const pattern = /file\/file_([a-f0-9-]+)\/(\d+)(\/file)?\/?$/;
        const match = url.match(pattern);

        if (match) {
            const fileId = match[1];
            const version = match[2];
            return `https://api.vrchat.cloud/api/1/image/file_${fileId}/${version}/${resolution}`;
        }
        // no match return origin url
        return url;
    },
    replaceVrcPackageUrl(url) {
        if (!url) {
            return '';
        }
        return url.replace('https://api.vrchat.cloud/', 'https://vrchat.com/');
    },
    getLaunchURL(instance) {
        var L = instance;
        if (L.instanceId) {
            if (L.shortName) {
                return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                    L.worldId
                )}&instanceId=${encodeURIComponent(
                    L.instanceId
                )}&shortName=${encodeURIComponent(L.shortName)}`;
            }
            return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                L.worldId
            )}&instanceId=${encodeURIComponent(L.instanceId)}`;
        }
        return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
            L.worldId
        )}`;
    },
    getFaviconUrl(resource) {
        try {
            const url = new URL(resource);
            return `https://icons.duckduckgo.com/ip2/${url.host}.ico`;
        } catch (err) {
            return '';
        }
    },
    copyToClipboard(text) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                window.$app.$message({
                    message: 'Copied successfully!',
                    type: 'success'
                });
            })
            .catch((err) => {
                console.error('Copy failed:', err);
                this.$message.error('Copy failed!');
            });
    },
    hasGroupPermission(ref, permission) {
        if (
            ref &&
            ref.myMember &&
            ref.myMember.permissions &&
            (ref.myMember.permissions.includes('*') ||
                ref.myMember.permissions.includes(permission))
        ) {
            return true;
        }
        return false;
    },
    getAuditLogTypeName(auditLogType) {
        if (!auditLogType) return '';
        return auditLogType
            .replace('group.', '')
            .replace(/\./g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    }
};
