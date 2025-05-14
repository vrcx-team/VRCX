let echarts = null;

const _utils = {
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
    compareByName(a, b) {
        if (typeof a.name !== 'string' || typeof b.name !== 'string') {
            return 0;
        }
        return a.name.localeCompare(b.name);
    },
    replaceBioSymbols(text) {
        if (!text) {
            return '';
        }
        var symbolList = {
            '@': '＠',
            '#': '＃',
            $: '＄',
            '%': '％',
            '&': '＆',
            '=': '＝',
            '+': '＋',
            '/': '⁄',
            '\\': '＼',
            ';': ';',
            ':': '˸',
            ',': '‚',
            '?': '？',
            '!': 'ǃ',
            '"': '＂',
            '<': '≺',
            '>': '≻',
            '.': '․',
            '^': '＾',
            '{': '｛',
            '}': '｝',
            '[': '［',
            ']': '］',
            '(': '（',
            ')': '）',
            '|': '｜',
            '*': '∗'
        };
        var newText = text;
        for (var key in symbolList) {
            var regex = new RegExp(symbolList[key], 'g');
            newText = newText.replace(regex, key);
        }
        return newText.replace(/ {1,}/g, ' ').trimRight();
    },
    // descending
    compareByUpdatedAt(a, b) {
        if (
            typeof a.updated_at !== 'string' ||
            typeof b.updated_at !== 'string'
        ) {
            return 0;
        }
        var A = a.updated_at.toUpperCase();
        var B = b.updated_at.toUpperCase();
        if (A < B) {
            return 1;
        }
        if (A > B) {
            return -1;
        }
        return 0;
    }
};

export default _utils;
