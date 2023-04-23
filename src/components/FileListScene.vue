<script setup>
import { useFileList } from '@/lib/scene/file-list'
import { useUiStore } from '@/stores/ui'
const { rows, columns } = useUiStore()
import { onBeforeMount,onBeforeUnmount,onMounted } from 'vue'
import Cell from './Cell.vue'

const { buttons, loadFiles } = useFileList()
var myTimeout =null

function refreshList()
{
 //refreshWatchFolder()
 return
}

onBeforeMount(() => {
  
  loadFiles()
})

onMounted(() => {
  
  myTimeout = setInterval(refreshList,5000);
})

onBeforeUnmount(() =>
{
 clearInterval(myTimeout);
 //alert("byebey");
})
</script>

<template>
  <div class="scene">
    <template v-for="(row, r) in buttons">
      <template v-for="(cell, c) in row" :key="`${r}-${c}-${cell?.key || 0}`">
        <Cell :config="cell" :row="r" :column="c"></Cell>
      </template>
    </template>
  </div>
</template>

<style scoped></style>
