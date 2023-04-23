<script>

import { renderClicmove } from '@/lib/gcode-renderer'
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import debounce from 'lodash/debounce'




</script>
<script setup>

const canvas = ref(null)
const instance = ref(null)
const dimensions = ref({})
const MessageBox = (message,timeout=500) => {
    
    Swal.fire({  title: message,  icon: 'info',  timer:timeout,showConfirmButton:false, showCloseButton:false,backdrop:false,background:'#777',color:'#cc0'})
    
  }
let MyCanvas = null



let mounted = false

const props = defineProps({
  animated: {
    type: Boolean,
    default: false,
  },
})

const updateRenderMove = () => {
  instance.value = Date.now()
  if (!(mounted)) {
    return
  }
  const parent = canvas.value.parentNode
  dimensions.value = {
    width: parent.clientWidth,
    height: parent.clientHeight,
  }
  nextTick(() => {
    RenderMove()
  })
}

updateRenderMove()
 
const RenderMove = () => {
  const canvasEl = canvas.value
  if (!canvasEl) {
    return
  }
  MyCanvas=canvasEl
  canvasEl.getContext('2d').clearRect(0, 0, canvasEl.width, canvasEl.height)
  renderClicmove(canvasEl)
  
}

const debouncedUpdate = debounce(() => {
  updateRenderMove()
}, 250)




onMounted(() => {
  window.addEventListener('resize', debouncedUpdate)
  nextTick(() => {
    mounted = true
    updateRenderMove()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedUpdate)
})
</script>

<template>

  <canvas
    class="clickmove"
    ref="canvas"
    :key="instance"
    :width="dimensions.width"
    :height="dimensions.height"
  ></canvas>
  
  <canvas
    class="canvasposition"
    ref="canvasposition"
    :key="instance"
    :width="dimensions.width"
    :height="dimensions.height"
  ></canvas>
</template>

<style>
.clickmove {
  object-fit: contain;
  
}


.canvasposition {
  object-fit: contain;
  z-index:3;
  pointer-events:none;
 
}
</style>
