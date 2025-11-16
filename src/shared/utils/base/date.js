import { useAppearanceSettingsStore } from '../../../stores';

function padZero(num) {
    return String(num).padStart(2, '0');
}

function toIsoLong(date) {
    const y = date.getFullYear();
    const m = padZero(date.getMonth() + 1);
    const d = padZero(date.getDate());
    const hh = padZero(date.getHours());
    const mm = padZero(date.getMinutes());
    const ss = padZero(date.getSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function toLocalShort(date, dateFormat, hour12) {
    return date
        .toLocaleDateString(dateFormat, {
            month: '2-digit',
            day: '2-digit',
            hour: 'numeric',
            minute: 'numeric',
            hourCycle: hour12 ? 'h12' : 'h23'
        })
        .replace(' AM', 'am')
        .replace(' PM', 'pm')
        .replace(',', '');
}

function toLocalLong(date, dateFormat, hour12) {
    return date.toLocaleDateString(dateFormat, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: hour12 ? 'h12' : 'h23'
    });
}

function toLocalTime(date, dateFormat, hour12) {
    return date.toLocaleTimeString(dateFormat, {
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: hour12 ? 'h12' : 'h23'
    });
}

function toLocalDate(date, dateFormat) {
    return date.toLocaleDateString(dateFormat, {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

/**
 * @param {string} dateStr
 * @param {'long'|'short'|'time'|'date'} format
 * @returns {string}
 */
function formatDateFilter(dateStr, format) {
    const appearance = useAppearanceSettingsStore();
    const {
        dtIsoFormat: isoFormat,
        dtHour12: hour12,
        currentCulture
    } = appearance;

    if (!dateStr) {
        return '-';
    }

    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) {
        return '-';
    }

    let dateFormat = 'en-gb';
    if (!isoFormat && currentCulture) {
        dateFormat = currentCulture;
    }
    if (dateFormat.length > 4 && dateFormat[4] === '_') {
        dateFormat = dateFormat.slice(0, 4);
    }

    if (isoFormat && format === 'long') {
        return toIsoLong(dt);
    } else if (format === 'long') {
        return toLocalLong(dt, dateFormat, hour12);
    } else if (format === 'short') {
        return toLocalShort(dt, dateFormat, hour12);
    } else if (format === 'time') {
        return toLocalTime(dt, dateFormat, hour12);
    } else if (format === 'date') {
        return toLocalDate(dt, dateFormat);
    } else {
        console.warn(`Unknown date format: ${format}`);
    }

    return '-';
}

export { formatDateFilter };
