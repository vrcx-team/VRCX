import { escapeTag } from './string';
import { i18n } from '../../../plugins/i18n';

const TIME_UNIT_KEYS = {
    y: 'common.time_units.y',
    d: 'common.time_units.d',
    h: 'common.time_units.h',
    m: 'common.time_units.m',
    s: 'common.time_units.s',
    year: 'common.time_units.year',
    month: 'common.time_units.month',
    day: 'common.time_units.day',
    hour: 'common.time_units.hour',
    min: 'common.time_units.min',
    sec: 'common.time_units.sec',
    years: 'common.time_units.years',
    months: 'common.time_units.months',
    days: 'common.time_units.days',
    hours: 'common.time_units.hours',
    mins: 'common.time_units.mins',
    secs: 'common.time_units.secs'
};

function getTimeUnitLabel(unit) {
    const key = TIME_UNIT_KEYS[unit];
    if (!key) {
        return unit;
    }
    const t = i18n?.global?.t;
    return typeof t === 'function' ? t(key) : unit;
}

function formatTimeUnit(value, unit) {
    return `${value} ${getTimeUnitLabel(value === 1 ? unit : `${unit}s`)}`;
}

/**
 *
 * @param {number} sec
 * @param {boolean} isNeedSeconds
 * @returns {string}
 */
function timeToText(sec, isNeedSeconds = false) {
    let n = Number(sec);
    if (isNaN(n)) {
        return escapeTag(sec);
    }
    n = Math.floor(n / 1000);
    const arr = [];
    if (n < 0) {
        n = -n;
    }
    if (n >= 31536000) {
        arr.push(`${Math.floor(n / 31536000)}${getTimeUnitLabel('y')}`);
        n %= 31536000;
    }
    if (n >= 86400) {
        arr.push(`${Math.floor(n / 86400)}${getTimeUnitLabel('d')}`);
        n %= 86400;
    }
    if (n >= 3600) {
        arr.push(`${Math.floor(n / 3600)}${getTimeUnitLabel('h')}`);
        n %= 3600;
    }
    if (n >= 60) {
        arr.push(`${Math.floor(n / 60)}${getTimeUnitLabel('m')}`);
        n %= 60;
    }
    if (isNeedSeconds || (arr.length === 0 && n < 60)) {
        // round to 5 seconds
        n = Math.floor((n + 2.5) / 5) * 5;
        arr.push(`${n}${getTimeUnitLabel('s')}`);
    }
    return arr.join(' ');
}

function timeAgo(datetime) {
    if (!datetime) {
        return '—';
    }
    let n;
    if (typeof datetime === 'number') {
        n = Date.now() - datetime;
    } else {
        n = Date.now() - Date.parse(datetime);
    }
    if (isNaN(n)) {
        return escapeTag(datetime);
    }
    n = Math.floor(n / 1000);
    if (n < 0) {
        n = -n;
    }
    if (n == 0) {
        return '—';
    }
    if (n >= 31536000) {
        const years = Math.floor(n / 31536000);
        const months = Math.floor((n % 31536000) / 2592000);
        const result = [formatTimeUnit(years, 'year')];
        if (months > 0) {
            result.push(formatTimeUnit(months, 'month'));
        }
        return result.join(', ');
    }
    if (n >= 2592000) {
        const months = Math.floor(n / 2592000);
        const days = Math.floor((n % 2592000) / 86400);
        const result = [formatTimeUnit(months, 'month')];
        if (days > 0) {
            result.push(formatTimeUnit(days, 'day'));
        }
        return result.join(', ');
    }
    if (n >= 86400) {
        const days = Math.floor(n / 86400);
        const hours = Math.floor((n % 86400) / 3600);
        const result = [formatTimeUnit(days, 'day')];
        if (hours > 0) {
            result.push(formatTimeUnit(hours, 'hour'));
        }
        return result.join(', ');
    }
    if (n >= 3600) {
        const hours = Math.floor(n / 3600);
        const minutes = Math.floor((n % 3600) / 60);
        const result = [formatTimeUnit(hours, 'hour')];
        if (minutes > 0) {
            result.push(formatTimeUnit(minutes, 'min'));
        }
        return result.join(', ');
    }
    if (n >= 60) {
        const value = Math.floor(n / 60);
        return `${value} ${getTimeUnitLabel(value === 1 ? 'min' : 'mins')}`;
    }
    if (n < 60) {
        // round to 5 seconds
        n = Math.floor((n + 2.5) / 5) * 5;
        return `${n} ${getTimeUnitLabel(n === 1 ? 'sec' : 'secs')}`;
    }
}

/**
 *
 * @param {number} duration
 * @returns {string}
 */
function formatSeconds(duration) {
    const pad = function (num, size) {
            return `000${num}`.slice(size * -1);
        },
        time = parseFloat(duration).toFixed(3),
        hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);
    let hoursOut = '';
    if (hours > '0') {
        hoursOut = `${pad(hours, 2)}:`;
    }
    return `${hoursOut + pad(minutes, 2)}:${pad(seconds, 2)}`;
}

/**
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 *
 * @param {string} duration
 * @returns {number}
 */
function convertYoutubeTime(duration) {
    let a = duration.match(/\d+/g);
    if (duration.indexOf('M') >= 0 && duration.indexOf('H') === -1 && duration.indexOf('S') === -1) {
        a = [0, a[0], 0];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') === -1) {
        a = [a[0], 0, a[1]];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') === -1 && duration.indexOf('S') === -1) {
        a = [a[0], 0, 0];
    }
    let length = 0;
    if (a.length === 3) {
        length += parseInt(a[0], 10) * 3600;
        length += parseInt(a[1], 10) * 60;
        length += parseInt(a[2], 10);
    }
    if (a.length === 2) {
        length += parseInt(a[0], 10) * 60;
        length += parseInt(a[1], 10);
    }
    if (a.length === 1) {
        length += parseInt(a[0], 10);
    }
    return length;
}

export { timeToText, timeAgo, formatSeconds, formatFileSize, convertYoutubeTime };
