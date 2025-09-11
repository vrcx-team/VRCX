import { ref } from 'vue';

export function useIntersectionObserver() {
    const intersectionObservers = ref([]);

    // intersection observer - start
    function clearIntersectionObservers() {
        intersectionObservers.value.forEach((observer) => {
            if (observer) {
                observer.disconnect();
            }
        });
        intersectionObservers.value = [];
    }

    function handleIntersectionObserver(activityDetailChartRef) {
        clearIntersectionObservers();

        activityDetailChartRef.value?.forEach((child, index) => {
            const observer = new IntersectionObserver((entries) =>
                handleIntersection(index, entries, activityDetailChartRef)
            );
            observer.observe(child.$el);
            intersectionObservers.value[index] = observer;
        });
    }
    function handleIntersection(index, entries, activityDetailChartRef) {
        if (!entries) {
            console.error('handleIntersection failed');
            return;
        }
        entries.forEach((entry) => {
            if (entry.isIntersecting && activityDetailChartRef.value[index]) {
                activityDetailChartRef.value[index].initEcharts();
                intersectionObservers.value[index].unobserve(entry.target);
            }
        });
    }
    // intersection observer - end

    return {
        handleIntersectionObserver
    };
}
