import { escapeTag } from './string';

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
        arr.push(`${Math.floor(n / 31536000)}y`);
        n %= 31536000;
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
 *
 * @param {string} duration
 * @returns {number}
 */
function convertYoutubeTime(duration) {
    let a = duration.match(/\d+/g);
    if (
        duration.indexOf('M') >= 0 &&
        duration.indexOf('H') === -1 &&
        duration.indexOf('S') === -1
    ) {
        a = [0, a[0], 0];
    }
    if (duration.indexOf('H') >= 0 && duration.indexOf('M') === -1) {
        a = [a[0], 0, a[1]];
    }
    if (
        duration.indexOf('H') >= 0 &&
        duration.indexOf('M') === -1 &&
        duration.indexOf('S') === -1
    ) {
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

export { timeToText, formatSeconds, convertYoutubeTime };
