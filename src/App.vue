<script setup>
import {useInfiniteScroll} from './util/useInfiniteScroll.js';
import {onMounted, ref, watch} from "vue";

const devices = ref([]);

const mockData = Array.from({ length: 99 }, (_, index) => ({
  id: index + 1,
  name: `Device ${index + 1}`
}));

// 使用我们的无限滚动组合式函数
const {
  containerRef,
  items,
  loading,
  allLoaded,
  total: deviceTotal,
  reset
} = useInfiniteScroll({
  fetchFunction: ({ pageNo, pageSize }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const start = (pageNo - 1) * pageSize;
        const end = start + pageSize;
        const pageItems = mockData.slice(start, end);

        resolve({
          data: {
            items: pageItems,
            total: mockData.length,
            pageNo,
            pageSize
          }
        });
      }, 1000);
    });
  },
  pageSize: 10
});

watch(items, (newItems) => {
  devices.value = newItems;
});

</script>

<template>
  <!-- 数据列表 -->
  <div class="data-list" ref="containerRef">
    <template v-if="devices.length > 0">
      <div
          v-for="device in devices"
          :key="device.id"
      >
        index: {{ device.id }}
      </div>
    </template>
    <template v-else-if="!loading">
      <div class="empty"/>
    </template>

    <!-- 加载指示器 -->
    <div v-if="loading" class="loading-more">
      <div class="spinner"></div>
      <span>正在加载更多...</span>
    </div>

    <!-- 加载完毕提示 -->
    <div v-if="allLoaded && devices.length > 0" class="end-message">
      已经到底了
    </div>
  </div>
</template>

<style scoped>
.data-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  box-sizing: border-box;
  height: 800px;
}

.loading-more {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;

  .spinner {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    border: 2px solid #ccc;
    border-top-color: #0256FF;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.end-message {
  grid-column: 1 / -1;
  text-align: center;
  padding: 20px;
  color: #999;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
