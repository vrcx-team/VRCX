import { useAppearanceSettingsStore } from '../../../stores';

/**
 * @param {string} dateStr
 * @param {'long'|'short'} format
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

    function toLocalShort(date) {
        return date
            .toLocaleDateString(isoFormat ? 'en-nz' : currentCulture, {
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

    if (isoFormat) {
        if (format === 'long') {
            return toIsoLong(dt);
        }
        if (format === 'short') {
            return toLocalShort(dt);
        }
    } else {
        if (format === 'long') {
            return dt.toLocaleDateString(currentCulture, {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hourCycle: hour12 ? 'h12' : 'h23'
            });
        }
        if (format === 'short') {
            return toLocalShort(dt);
        }
    }

    return '-';
}

export { formatDateFilter };
