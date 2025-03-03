// useInfiniteScroll.js
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { throttle } from 'lodash-es';

export function useInfiniteScroll(options) {
    const {
        fetchFunction,
        pageSize = 10,
        threshold = 100,
        throttleWait = 300
    } = options;

    const containerRef = ref(null);
    const items = ref([]);
    const loading = ref(false);
    const allLoaded = ref(false);
    const pageNo = ref(1);
    const total = ref(0);

    // 加载数据
    const loadMore = async () => {
        if (loading.value || allLoaded.value) return;

        loading.value = true;
        try {
            const response = await fetchFunction({
                pageNo: pageNo.value,
                pageSize
            });

            const responseItems = response?.data?.items || [];
            const responseTotal = response?.data?.total || 0;

            if (pageNo.value === 1) {
                items.value = [...responseItems];
            } else {
                items.value = [...items.value, ...responseItems];
            }

            total.value = responseTotal;

            // 检查是否全部加载完毕
            if (responseItems.length === 0 || items.value.length >= total.value) {
                allLoaded.value = true;
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            loading.value = false;

            // 检查内容是否填满容器
            nextTick(checkAndFillScreen);
        }
    };

    // 检查内容是否填满容器
    const checkAndFillScreen = () => {
        if (!containerRef.value || allLoaded.value) return;

        if (containerRef.value.scrollHeight <= containerRef.value.clientHeight
            && items.value.length < total.value) {
            pageNo.value++;
            loadMore();
        }
    };

    // 滚动事件处理
    const handleScroll = (e) => {
        if (loading.value || allLoaded.value) return;

        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;

        if (distanceToBottom < threshold) {
            pageNo.value++;
            loadMore();
        }
    };

    const throttledScroll = throttle(handleScroll, throttleWait);

    // 重置列表
    const reset = () => {
        pageNo.value = 1;
        items.value = [];
        allLoaded.value = false;
        loadMore();
    };

    onMounted(() => {
        loadMore();

        nextTick(() => {
            if (containerRef.value) {
                containerRef.value.addEventListener('scroll', throttledScroll);
            }
        });
    });

    onUnmounted(() => {
        if (containerRef.value) {
            containerRef.value.removeEventListener('scroll', throttledScroll);
        }
    });

    return {
        containerRef,
        items,
        loading,
        allLoaded,
        total,
        reset,
        loadMore
    };
}
