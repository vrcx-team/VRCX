/**
 * Feed search formula utility.
 * Ported from custom.js
 */

export function tokenize(input) {
    const tokens = [];
    let i = 0;
    const str = input.trim();

    while (i < str.length) {
        if (/\s/.test(str[i])) {
            i++;
            continue;
        }

        if (str[i] === '&') {
            tokens.push({ type: 'AND' });
            i++;
            continue;
        }

        if (str[i] === '|') {
            tokens.push({ type: 'OR' });
            i++;
            continue;
        }

        if (i + 1 < str.length && str[i] === '!' && str[i + 1] === '=') {
            tokens.push({ type: 'NOT' });
            tokens.push({ type: 'EQUALS' });
            i += 2;
            continue;
        }

        if (str[i] === '!') {
            tokens.push({ type: 'NOT' });
            i++;
            continue;
        }

        if (str[i] === '(') {
            tokens.push({ type: 'LPAREN' });
            i++;
            continue;
        }

        if (str[i] === ')') {
            tokens.push({ type: 'RPAREN' });
            i++;
            continue;
        }

        if (str[i] === '[') {
            tokens.push({ type: 'LBRACKET' });
            i++;
            continue;
        }

        if (str[i] === ']') {
            tokens.push({ type: 'RBRACKET' });
            i++;
            continue;
        }

        if (str[i] === ',') {
            tokens.push({ type: 'COMMA' });
            i++;
            continue;
        }

        if (i + 2 < str.length && str[i] === '>' && str[i + 1] === '=') {
            tokens.push({ type: 'GE' });
            i += 2;
            continue;
        }

        if (i + 2 < str.length && str[i] === '<' && str[i + 1] === '=') {
            tokens.push({ type: 'LE' });
            i += 2;
            continue;
        }

        if (str[i] === '>') {
            tokens.push({ type: 'GT' });
            i++;
            continue;
        }

        if (str[i] === '<') {
            tokens.push({ type: 'LT' });
            i++;
            continue;
        }

        if (str[i] === '=') {
            tokens.push({ type: 'EQUALS' });
            i++;
            continue;
        }

        if (str[i] === '"' || str[i] === "'") {
            const quote = str[i];
            i++;
            let value = '';
            while (i < str.length && str[i] !== quote) {
                if (str[i] === '\\' && i + 1 < str.length) {
                    value += str[i + 1];
                    i += 2;
                } else {
                    value += str[i];
                    i++;
                }
            }
            i++;
            tokens.push({ type: 'VALUE', value });
            continue;
        }

        let value = '';
        while (i < str.length && !/[\s()=<>|&![\],]/.test(str[i])) {
            value += str[i];
            i++;
        }
        // Special case for time values with spaces: time=2024/04/26 07:18
        // If we just parsed a value and the next character is a space, and we're in a field context
        if (value && str[i] === ' ' && i + 1 < str.length) {
            const _nextChar = str[i + 1];
            // If next part looks like time HH:mm or HH:mm:ss
            const remaining = str.slice(i + 1);
            const timeMatch = remaining.match(
                /^(\d{1,2}:\d{1,2}(?::\d{1,2})?)([\s()=<>|&![\],]|$)/
            );
            if (timeMatch) {
                value += ' ' + timeMatch[1];
                i += 1 + timeMatch[1].length;
            }
        }
        if (value) {
            tokens.push({ type: 'VALUE', value });
        }
    }

    return tokens;
}

export function parseExpression(tokens, _input) {
    let pos = 0;

    const validFields = [
        'name',
        'world',
        'location',
        'wrld',
        'usr',
        'status',
        'avatar',
        'bio',
        'group',
        'type',
        'time'
    ];

    function parseOr() {
        let left = parseAnd();
        while (pos < tokens.length && tokens[pos]?.type === 'OR') {
            pos++;
            const right = parseAnd();
            if (!right) {
                return null;
            }
            left = { type: 'OR', left, right };
        }
        return left;
    }

    function parseAnd() {
        let left = parsePrimary();
        if (!left) return null;
        while (pos < tokens.length && tokens[pos]?.type === 'AND') {
            pos++;
            const right = parsePrimary();
            if (!right) {
                return null;
            }
            left = { type: 'AND', left, right };
        }
        while (
            pos < tokens.length &&
            tokens[pos] &&
            !['OR', 'AND', 'RPAREN'].includes(tokens[pos].type)
        ) {
            const right = parsePrimary();
            if (!right) {
                return null;
            }
            left = { type: 'AND', left, right };
        }
        return left;
    }

    function parsePrimary() {
        const tok = tokens[pos];
        if (!tok) return null;

        if (tok.type === 'NOT') {
            pos++;
            if (tokens[pos]?.type === 'EQUALS') {
                pos++;
                const valueTok = tokens[pos];
                if (valueTok?.type === 'VALUE') {
                    pos++;
                    return {
                        type: 'NOT',
                        expr: { type: 'TEXT', value: valueTok.value }
                    };
                }
                return { type: 'NOT', expr: { type: 'TEXT', value: '' } };
            }
            return { type: 'NOT', expr: parsePrimary() };
        }

        if (tok.type === 'LPAREN') {
            pos++;
            const expr = parseOr();
            if (tokens[pos]?.type === 'RPAREN') {
                pos++;
            } else {
                throw { type: 'unclosed_parenthesis' };
            }
            return expr;
        }

        if (tok.type === 'LBRACKET') {
            const values = parseArray();
            if (values.length === 0) return { type: 'TEXT', value: '' };
            return /** @type {any} */ (
                values.slice(1).reduce(
                    (node, val) => ({
                        type: 'OR',
                        left: node,
                        right: { type: 'TEXT', value: val }
                    }),
                    { type: 'TEXT', value: values[0] }
                )
            );
        }

        if (tok.type === 'VALUE') {
            pos++;
            const nextTok = tokens[pos];
            if (
                nextTok &&
                ['EQUALS', 'GT', 'LT', 'GE', 'LE'].includes(nextTok.type)
            ) {
                pos++;
                const op = nextTok.type;
                if (tokens[pos]?.type === 'LBRACKET') {
                    const values = parseArray();
                    if (values.length === 0)
                        return {
                            type: 'FIELD',
                            field: tok.value.toLowerCase(),
                            op,
                            value: ''
                        };
                    return /** @type {any} */ (
                        values.slice(1).reduce(
                            (node, val) => ({
                                type: 'OR',
                                left: node,
                                right: {
                                    type: 'FIELD',
                                    field: tok.value.toLowerCase(),
                                    op,
                                    value: val
                                }
                            }),
                            {
                                type: 'FIELD',
                                field: tok.value.toLowerCase(),
                                op,
                                value: values[0]
                            }
                        )
                    );
                }
                const valueTok = tokens[pos];
                if (valueTok?.type === 'VALUE') {
                    pos++;
                    const fieldName = tok.value.toLowerCase();
                    if (!validFields.includes(fieldName)) {
                        throw {
                            type: 'invalid_field',
                            field: fieldName,
                            fields: validFields.join(', ')
                        };
                    }
                    return {
                        type: 'FIELD',
                        field: fieldName,
                        op,
                        value: valueTok.value
                    };
                }
                return {
                    type: 'FIELD',
                    field: tok.value.toLowerCase(),
                    op,
                    value: ''
                };
            } else if (
                tokens[pos]?.type === 'NOT' &&
                tokens[pos + 1]?.type === 'EQUALS'
            ) {
                pos += 2;
                const fieldValue = tokens[pos];
                if (fieldValue?.type === 'VALUE') {
                    pos++;
                }
                return {
                    type: 'NOT',
                    expr: {
                        type: 'FIELD',
                        field: tok.value.toLowerCase(),
                        value: fieldValue?.value || ''
                    }
                };
            }
            return { type: 'TEXT', value: tok.value };
        }

        if (tok.type === 'RPAREN') {
            throw { type: 'extra_right_parenthesis' };
        }

        pos++;
        return null;
    }

    function parseArray() {
        const values = [];
        pos++; // skip [
        while (pos < tokens.length && tokens[pos].type !== 'RBRACKET') {
            if (tokens[pos].type === 'VALUE') {
                values.push(tokens[pos].value);
                pos++;
            } else if (tokens[pos].type === 'COMMA') {
                pos++;
            } else {
                pos++; // skip unknown
            }
        }
        if (tokens[pos]?.type === 'RBRACKET') {
            pos++;
        } else {
            throw { type: 'unclosed_array' };
        }
        return values;
    }

    const result = parseOr();
    if (!result) {
        throw { type: 'invalid_expression', message: '无效的搜索表达式' };
    }
    return result;
}

export function extractKeywords(expr) {
    const keywords = new Set();
    function extractFromExpr(e) {
        if (!e) return;
        if (e.type === 'FIELD') {
            const skipFields = ['type', 'time', 'location', 'wrld', 'usr'];
            if (!skipFields.includes(e.field) && e.value && e.value.trim()) {
                keywords.add(e.value.trim());
            }
        } else if (e.type === 'TEXT') {
            if (e.value && e.value.trim()) {
                keywords.add(e.value.trim());
            }
        } else if (e.type === 'AND' || e.type === 'OR') {
            extractFromExpr(e.left);
            extractFromExpr(e.right);
        } else if (e.type === 'NOT') {
            extractFromExpr(e.expr);
        }
    }
    extractFromExpr(expr);
    return Array.from(keywords);
}

export function evaluateCondition(expr, row) {
    if (!expr || expr.type === 'MATCH_ALL') {
        return true;
    }

    const safeRow = row || {};

    if (expr.type === 'TEXT') {
        const v = expr.value.toUpperCase();
        const name = String(safeRow.displayName || '').toUpperCase();
        const world = String(safeRow.worldName || '').toUpperCase();
        const location = String(safeRow.location || '').toUpperCase();
        const status = String(safeRow.status || '').toUpperCase();
        const statusDesc = String(
            safeRow.statusDescription || ''
        ).toUpperCase();
        const avatar = String(safeRow.avatarName || '').toUpperCase();
        const bio = String(safeRow.bio || '').toUpperCase();
        const prevBio = String(safeRow.previousBio || '').toUpperCase();

        return (
            name.includes(v) ||
            world.includes(v) ||
            location.includes(v) ||
            status.includes(v) ||
            statusDesc.includes(v) ||
            avatar.includes(v) ||
            bio.includes(v) ||
            prevBio.includes(v)
        );
    }

    if (expr.type === 'FIELD') {
        const { field, value, op } = expr;

        const checkValue = (v, target) => {
            const t = String(target || '').toUpperCase();
            const val = String(v || '').toUpperCase();
            switch (op) {
                case 'GT':
                    return t > val;
                case 'LT':
                    return t < val;
                case 'GE':
                    return t >= val;
                case 'LE':
                    return t <= val;
                case 'EQUALS':
                default:
                    return t.includes(val);
            }
        };

        const checkExactValue = (v, target) => {
            const t = String(target || '').toUpperCase();
            const val = String(v || '').toUpperCase();
            switch (op) {
                case 'GT':
                    return t > val;
                case 'LT':
                    return t < val;
                case 'GE':
                    return t >= val;
                case 'LE':
                    return t <= val;
                case 'EQUALS':
                default:
                    return t === val;
            }
        };

        const checkTimeValue = (v, target) => {
            if (!target) return false;
            const targetMs = new Date(target).getTime();
            if (isNaN(targetMs)) return false;

            // Handle range if value contains ~
            if (String(v).includes('~')) {
                const [startStr, endStr] = String(v).split('~');
                const start = startStr.trim()
                    ? new Date(startStr.trim()).getTime()
                    : 0;
                const end = endStr.trim()
                    ? new Date(endStr.trim()).getTime()
                    : Infinity;
                return targetMs >= start && targetMs <= end;
            }

            const compareMs = new Date(v).getTime();

            if (isNaN(compareMs)) return false;

            // 对于比较运算符，处理年、月、日、时间格式
            if (op === 'GT' || op === 'LT' || op === 'GE' || op === 'LE') {
                // 匹配全年：2024
                if (String(v).match(/^\d{4}$/)) {
                    const year = parseInt(v);
                    const yearStart = Date.UTC(year, 0, 1);
                    const yearEnd = Date.UTC(year + 1, 0, 1) - 1;
                    if (op === 'GT') return targetMs > yearEnd;
                    if (op === 'LT') return targetMs < yearStart;
                    if (op === 'GE') return targetMs >= yearStart;
                    if (op === 'LE') return targetMs <= yearEnd;
                }
                // 匹配全月：2024/04
                if (String(v).match(/^\d{4}\/\d{1,2}$/)) {
                    const parts = String(v).split('/');
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const monthStart = Date.UTC(year, month, 1);
                    const monthEnd = Date.UTC(year, month + 1, 1) - 1;
                    if (op === 'GT') return targetMs > monthEnd;
                    if (op === 'LT') return targetMs < monthStart;
                    if (op === 'GE') return targetMs >= monthStart;
                    if (op === 'LE') return targetMs <= monthEnd;
                }
                // 匹配全天：2024/04/26
                if (String(v).match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
                    const parts = String(v).split('/');
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const day = parseInt(parts[2]);
                    const dayStart = Date.UTC(year, month, day);
                    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
                    if (op === 'GT') return targetMs > dayEnd;
                    if (op === 'LT') return targetMs < dayStart;
                    if (op === 'GE') return targetMs >= dayStart;
                    if (op === 'LE') return targetMs <= dayEnd;
                }
                // 匹配时间：2024/04/26 07、2024/04/26 07:18 或 2024/04/26 07:18:30
                const timeMatch = String(v).match(
                    /^(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/
                );
                if (timeMatch) {
                    const datePart = timeMatch[1];
                    const hour = parseInt(timeMatch[2]);
                    const minute = timeMatch[3] ? parseInt(timeMatch[3]) : null;
                    const second = timeMatch[4] ? parseInt(timeMatch[4]) : null;
                    const parts = datePart.split('/');
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const day = parseInt(parts[2]);

                    if (second !== null) {
                        const exactTimeStart = Date.UTC(
                            year,
                            month,
                            day,
                            hour,
                            minute,
                            second
                        );
                        const exactTimeEnd = exactTimeStart + 1000 - 1;
                        if (op === 'GT') return targetMs > exactTimeEnd;
                        if (op === 'LT') return targetMs < exactTimeStart;
                        if (op === 'GE') return targetMs >= exactTimeStart;
                        if (op === 'LE') return targetMs <= exactTimeEnd;
                    } else if (minute !== null) {
                        const minuteStart = Date.UTC(
                            year,
                            month,
                            day,
                            hour,
                            minute
                        );
                        const minuteEnd = minuteStart + 60 * 1000 - 1;
                        if (op === 'GT') return targetMs > minuteEnd;
                        if (op === 'LT') return targetMs < minuteStart;
                        if (op === 'GE') return targetMs >= minuteStart;
                        if (op === 'LE') return targetMs <= minuteEnd;
                    } else {
                        const hourStart = Date.UTC(year, month, day, hour);
                        const hourEnd = hourStart + 60 * 60 * 1000 - 1;
                        if (op === 'GT') return targetMs > hourEnd;
                        if (op === 'LT') return targetMs < hourStart;
                        if (op === 'GE') return targetMs >= hourStart;
                        if (op === 'LE') return targetMs <= hourEnd;
                    }
                }
            }

            switch (op) {
                case 'GT':
                    return targetMs > compareMs;
                case 'LT':
                    return targetMs < compareMs;
                case 'GE':
                    return targetMs >= compareMs;
                case 'LE':
                    return targetMs <= compareMs;
                case 'EQUALS':
                default:
                    // 匹配全年：2024
                    if (String(v).match(/^\d{4}$/)) {
                        const year = parseInt(v);
                        const yearStart = Date.UTC(year, 0, 1);
                        const yearEnd = Date.UTC(year + 1, 0, 1) - 1;
                        return targetMs >= yearStart && targetMs <= yearEnd;
                    }
                    // 匹配全月：2024/04
                    if (String(v).match(/^\d{4}\/\d{1,2}$/)) {
                        const parts = String(v).split('/');
                        const year = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const monthStart = Date.UTC(year, month, 1);
                        const monthEnd = Date.UTC(year, month + 1, 1) - 1;
                        return targetMs >= monthStart && targetMs <= monthEnd;
                    }
                    // 匹配全天：2024/04/26
                    if (String(v).match(/^\d{4}\/\d{1,2}\/\d{1,2}$/)) {
                        const parts = String(v).split('/');
                        const year = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const day = parseInt(parts[2]);
                        const dayStart = Date.UTC(year, month, day);
                        const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;
                        return targetMs >= dayStart && targetMs <= dayEnd;
                    }
                    // 匹配时间：2024/04/26 07、2024/04/26 07:18 或 2024/04/26 07:18:30
                    const timeMatch = String(v).match(
                        /^(\d{4}\/\d{1,2}\/\d{1,2})\s+(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?$/
                    );
                    if (timeMatch) {
                        const datePart = timeMatch[1];
                        const hour = parseInt(timeMatch[2]);
                        const minute = timeMatch[3]
                            ? parseInt(timeMatch[3])
                            : null;
                        const second = timeMatch[4]
                            ? parseInt(timeMatch[4])
                            : null;
                        const parts = datePart.split('/');
                        const year = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1;
                        const day = parseInt(parts[2]);

                        if (second !== null) {
                            const exactTimeStart = Date.UTC(
                                year,
                                month,
                                day,
                                hour,
                                minute,
                                second
                            );
                            const exactTimeEnd = exactTimeStart + 1000 - 1;
                            return (
                                targetMs >= exactTimeStart &&
                                targetMs <= exactTimeEnd
                            );
                        } else if (minute !== null) {
                            const minuteStart = Date.UTC(
                                year,
                                month,
                                day,
                                hour,
                                minute
                            );
                            const minuteEnd = minuteStart + 60 * 1000 - 1;
                            return (
                                targetMs >= minuteStart && targetMs <= minuteEnd
                            );
                        } else {
                            const hourStart = Date.UTC(year, month, day, hour);
                            const hourEnd = hourStart + 60 * 60 * 1000 - 1;
                            return targetMs >= hourStart && targetMs <= hourEnd;
                        }
                    }
                    return targetMs === compareMs;
            }
        };

        switch (field) {
            case 'time':
                return checkTimeValue(value, safeRow.created_at);
            case 'type':
                return checkExactValue(value, safeRow.type);
            case 'name':
                return checkValue(value, safeRow.displayName);
            case 'world':
                return checkValue(value, safeRow.worldName);
            case 'location':
            case 'wrld':
                return checkValue(value, safeRow.location);
            case 'usr':
                return checkValue(value, safeRow.userId);
            case 'status':
                return (
                    checkValue(value, safeRow.status) ||
                    checkValue(value, safeRow.statusDescription)
                );
            case 'avatar':
                return checkValue(value, safeRow.avatarName);
            case 'bio':
                return (
                    checkValue(value, safeRow.bio) ||
                    checkValue(value, safeRow.previousBio)
                );
            case 'group':
                return checkValue(value, safeRow.groupName);
            default:
                return false;
        }
    }

    if (expr.type === 'AND') {
        return (
            evaluateCondition(expr.left, row) &&
            evaluateCondition(expr.right, row)
        );
    }

    if (expr.type === 'OR') {
        return (
            evaluateCondition(expr.left, row) ||
            evaluateCondition(expr.right, row)
        );
    }

    if (expr.type === 'NOT') {
        return !evaluateCondition(expr.expr, row);
    }

    return true;
}
