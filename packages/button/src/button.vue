<!--
 * @Author: saber
 * @Date: 2022-03-01 15:58:09
 * @LastEditTime: 2022-08-30 21:58:25
 * @LastEditors: saber
 * @Description: 
-->
<script lang="ts">
import {
  computed,
  defineComponent,
  h,
  ref,
  useAttrs,
  useSlots,
  watch,
} from "vue";
import { Table, TableColumn } from "@arco-design/web-vue";
import type { TableColumnData as TableColumnType } from "@arco-design/web-vue/es/table/interface";
import type { PaginationProps } from "@arco-design/web-vue/es/pagination/interface";
import { RequestFn } from "./types";

export default defineComponent({
  name: "AQueryTable",
});
</script>
<script lang="ts" setup>
// todo: any
interface PropsI {
  /**
   * @zh 请求参数 一个reactive对象
   */
  params: any;
  /**
   * @zh 表格columns, 增加自定义slotRenderName属性
   * @type TableColumn[]
   * @defaultValue []
   */
  columns?: (TableColumnType & { slotRenderName?: string })[];
  /**
   * @zh 分页的属性配置
   * @type PaginationProps
   * @defaultValue []
   */
  pagination?: PaginationProps;
  /**
   * @zh 当只有一页的时候，是否隐藏分页器
   * @type boolean
   * @defaultValue true
   */
  hideOnePage: boolean;

  /**
   * @zh 请求数据
   */
  request: RequestFn;
}
const props = withDefaults(defineProps<PropsI>(), {
  columns: () => [] as (TableColumnType & { slotRenderName: string })[],
  pagination: () => ({}),
  hideOnePage: true,
});
const slots = useSlots();
// 表格数据
const tableData = ref<any[]>([]);
// 当前页数
const pageNum = ref(1);
// 当前条数
const pageSize = ref(10);
// 总条数
const totalRef = ref(0);

// @ts-ignore
const hasSlotRenderName = computed(() => {
  return props.columns.some((colum) => colum.slotRenderName);
});
/** 总数小于第一个页码数的话，不显示分页 */
const pagination = computed(() =>
  (props.pagination.pageSizeOptions?.[0] || 10) >= totalRef.value &&
  props.hideOnePage
    ? false
    : ({
        total: totalRef.value,
        showJumper: true,
        // showMore: true,
        showPageSize: true,
        showTotal: true,
        current: pageNum.value,
        pageSizeOptions: [10, 20, 30, 40, 50],
        // 'v-slots': {
        //   'page-item': (value) => {
        //     debugger;
        //     return h('1')
        //   }
        // }
      } as PaginationProps)
);
const fetchData = async () => {
  // 后面要判断是否是函数
  if (props.request) {
    const { data, success, total } = await props.request.call(null, {
      ...props.params,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
    });
    if (success) {
      tableData.value = data;
      totalRef.value = total;
    }
  }
};
fetchData();
watch(
  () => props.params,
  () => {
    if (pageNum.value === 1) {
      fetchData();
    } else {
      pageNum.value = 1;
    }
    // pageSize.value = 10
    // fetchData()
  },
  { deep: true }
);
watch([pageNum, pageSize], (newVal, oldVal) => {
  fetchData();
});
const onPageSizeChange = (size: number) => {
  pageSize.value = size;
};

const onPageChange = (page: number) => {
  pageNum.value = page;
};

// reload
// 只是刷新 不修改任何
const reload = () => {
  fetchData();
};
// 重置刷新的话就是 到第一页
const reloadAndRest = () => {
  if (pageNum.value === 1) {
    fetchData();
  } else {
    pageNum.value = 1;
  }
};
// 删除完之后，调用 reload 方法
const removeReload = (number: number = 1) => {
  if (tableData.value.length <= number && pageNum.value > 1) {
    pageNum.value--;
  } else {
    reload();
  }
};
const reset = () => {};
// 导出所有功能
defineExpose({
  reload,
  reloadAndRest,
  removeReload,
  reset,
});
const attrs = useAttrs();
</script>

<template>
  <Table
    v-if="slots.columns"
    :data="tableData"
    :pagination="pagination"
    @page-size-change="onPageSizeChange"
    @page-change="onPageChange"
    :bordered="false"
    v-bind="attrs"
  >
    <template #columns>
      <slot name="columns"></slot>
    </template>
  </Table>

  <Table
    :columns="props.columns"
    :data="tableData"
    :pagination="pagination"
    @page-size-change="onPageSizeChange"
    @page-change="onPageChange"
    :bordered="false"
    v-bind="attrs"
    v-if="!slots.columns && !hasSlotRenderName"
  >
  </Table>
  <!-- 没有 hasSlotRenderName 只有columns 好像也可以在下面正常显示， (为了防止下面出现不明的bug，上面两种正常写法是可以保证的)   -->
  <Table
    :data="tableData"
    :pagination="pagination"
    @page-size-change="onPageSizeChange"
    @page-change="onPageChange"
    v-bind="attrs"
    :bordered="false"
    v-if="!slots.columns && hasSlotRenderName"
  >
    <template #columns>
      <TableColumn
        v-for="(columns , index) in (props.columns as any[])"
        v-bind="columns"
        :key="columns.title as string || columns.dataIndex || index "
      >
        <template #cell="scope" v-if="columns.slotRenderName">
          <slot :name="columns.slotRenderName" v-bind="scope"></slot>
        </template>
        <template #cell="scope" v-if="typeof columns.render === 'function'">
          {{ columns?.render?.(scope) }}
        </template>
      </TableColumn>
    </template>
  </Table>
</template>
