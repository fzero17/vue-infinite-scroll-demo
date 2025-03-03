<!-- InfiniteScroll.vue -->
<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { throttle } from 'lodash-es';

const props = defineProps({
  fetchData: {
    type: Function,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  },
  threshold: {
    type: Number,
    default: 100
  }
});

const containerRef = ref(null);
const items = ref([]);
const loading = ref(false);
const allLoaded = ref(false);
const pageNo = ref(1);
const total = ref(0);

// 数据获取函数
const loadMore = async () => {
  if (loading.value || allLoaded.value) return;

  loading.value = true;
  try {
    const { code, data } = await props.fetchData({
      pageNo: pageNo.value,
      pageSize: props.pageSize
    });

    if (code === 200) {
      if (pageNo.value === 1) {
        items.value = [...data.items];
      } else {
        items.value = [...items.value, ...data.items];
      }

      total.value = data.total;

      // 检查是否已加载全部数据
      if (data.items.length === 0 || items.value.length >= total.value) {
        allLoaded.value = true;
      }
    }
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;

    // 检查是否需要填满屏幕
    nextTick(() => {
      checkAndFillScreen();
    });
  }
};

// 检查是否需要填充屏幕
const checkAndFillScreen = () => {
  if (!containerRef.value || allLoaded.value) return;

  // 如果内容高度不足以填满容器，并且还有更多数据
  if (containerRef.value.scrollHeight <= containerRef.value.clientHeight
      && items.value.length < total.value) {
    pageNo.value++;
    loadMore();
  }
};

// 处理滚动事件
const handleScroll = (e) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target;
  const distanceToBottom = scrollHeight - scrollTop - clientHeight;

  if (distanceToBottom < props.threshold && !loading.value && !allLoaded.value) {
    pageNo.value++;
    loadMore();
  }
};

// 使用节流优化滚动处理
const throttledScroll = throttle(handleScroll, 300);

// 重置并重新加载
const reset = () => {
  pageNo.value = 1;
  allLoaded.value = false;
  items.value = [];
  loadMore();
};

// 监听挂载和卸载
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

// 暴露给父组件的方法
defineExpose({
  reset,
  loadMore
});
</script>

<template>
  <div class="infinite-scroll-container" ref="containerRef">
    <slot :items="items" />

    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
      <span>正在加载更多...</span>
    </div>

    <div v-if="allLoaded && items.length > 0" class="end-message">
      <slot name="end-message">已经到底了</slot>
    </div>

    <div v-if="items.length === 0 && !loading" class="empty-state">
      <slot name="empty">暂无数据</slot>
    </div>
  </div>
</template>

<style scoped>
.infinite-scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border: 2px solid #ccc;
  border-top-color: #0256FF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.end-message {
  text-align: center;
  padding: 20px;
  color: #999;
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #999;
}
</style>
