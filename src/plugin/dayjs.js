import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';

export function initDayjs() {
    dayjs.extend(duration);
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(isSameOrAfter);
    dayjs.extend(localizedFormat);
    dayjs.extend(customParseFormat);
}
