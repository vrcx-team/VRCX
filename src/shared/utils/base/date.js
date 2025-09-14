import dayjs from 'dayjs';
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

    const dt = dayjs(dateStr);
    if (!dt.isValid()) {
        return '-';
    }

    function toIsoLong(date) {
        return date.format('YYYY-MM-DD HH:mm:ss');
    }

    function toLocalShort(date) {
        // Use localized format for short date
        let fmt = 'MM/DD HH:mm';
        if (!isoFormat) {
            fmt = hour12 ? 'L LT' : 'L HH:mm';
        }
        let str = date.locale(currentCulture).format(fmt);
        // Lowercase AM/PM
        str = str.replace(' AM', 'am').replace(' PM', 'pm').replace(',', '');
        return str;
    }

    if (format === 'long') {
        if (isoFormat) {
            return toIsoLong(dt);
        }
        const fmt = hour12 ? 'L LTS' : 'L HH:mm:ss';
        return dt.locale(currentCulture).format(fmt);
    }
    if (format === 'short') {
        return toLocalShort(dt);
    }

    return '-';
}

export { formatDateFilter };
