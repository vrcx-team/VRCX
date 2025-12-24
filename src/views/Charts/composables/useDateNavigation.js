import { computed, ref } from 'vue';

import dayjs from 'dayjs';

export function useDateNavigation(allDateOfActivity, reloadData) {
    const selectedDate = ref(dayjs().toDate());

    const allDateOfActivityArray = computed(() => {
        return allDateOfActivity.value
            ? Array.from(allDateOfActivity.value)
                  .map((item) => dayjs(item))
                  .sort((a, b) => b.valueOf() - a.valueOf())
            : [];
    });

    const isNextDayBtnDisabled = computed(() => {
        return dayjs(selectedDate.value).isSameOrAfter(
            allDateOfActivityArray.value[0],
            'day'
        );
    });

    const isPrevDayBtnDisabled = computed(() => {
        return dayjs(selectedDate.value).isSame(
            allDateOfActivityArray.value[
                allDateOfActivityArray.value.length - 1
            ],
            'day'
        );
    });

    function changeSelectedDateFromBtn(isNext = false) {
        if (
            !allDateOfActivityArray.value ||
            allDateOfActivityArray.value.length === 0
        ) {
            return;
        }

        const idx = allDateOfActivityArray.value.findIndex((date) =>
            date.isSame(selectedDate.value, 'day')
        );

        // when invalid date is selected, find the next closest date
        if (idx === -1 && !isNext) {
            const newIdx = allDateOfActivityArray.value.findIndex((date) =>
                date.isBefore(selectedDate.value, 'day')
            );
            selectedDate.value = allDateOfActivityArray.value[newIdx].toDate();
            reloadData();
            return;
        }

        if (idx !== -1) {
            const newIdx = isNext ? idx - 1 : idx + 1;
            if (newIdx >= 0 && newIdx < allDateOfActivityArray.value.length) {
                selectedDate.value =
                    allDateOfActivityArray.value[newIdx].toDate();
                reloadData();
                return;
            }
        }

        // Fallback to the first/last date
        selectedDate.value = isNext
            ? allDateOfActivityArray.value[0].toDate()
            : allDateOfActivityArray.value[
                  allDateOfActivityArray.value.length - 1
              ].toDate();
        reloadData();
    }

    function getDatePickerDisabledDate(time) {
        if (
            time > Date.now() ||
            allDateOfActivityArray.value[
                allDateOfActivityArray.value.length - 1
            ]
                ?.add(-1, 'day')
                .isAfter(time, 'day') ||
            !allDateOfActivity.value
        ) {
            return true;
        }
        return !allDateOfActivity.value.has(dayjs(time).format('YYYY-MM-DD'));
    }

    return {
        selectedDate,
        isNextDayBtnDisabled,
        isPrevDayBtnDisabled,
        changeSelectedDateFromBtn,
        getDatePickerDisabledDate
    };
}
