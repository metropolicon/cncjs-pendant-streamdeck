<script>
import { renderToolpath } from '@/lib/gcode-renderer'

import { useGcodeStore } from '@/stores/gcode'
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import debounce from 'lodash/debounce'
</script>
<script setup>
const gcode = useGcodeStore()
const canvas = ref(null)
const instance = ref(null)
const dimensions = ref({})

const { geometry } = storeToRefs(gcode)

let mounted = false

const props = defineProps({
  animated: {
    type: Boolean,
    default: false,
  },
})

watch(geometry, (current) => {
  if (current) {
    updateRender()
  }
})

const updateRender = (animate = false) => {
  instance.value = Date.now()

  if (!(geometry.value && mounted)) {
    return
  }

  const parent = canvas.value.parentNode
  dimensions.value = {
    width: parent.clientWidth,
    height: parent.clientHeight,
  }
  nextTick(() => {
    renderGcode(animate)
  })
}

const renderGcode = (animate) => {
  const canvasEl = canvas.value
  if (!canvasEl) {
    return
  }
  canvasEl.getContext('2d').clearRect(0, 0, canvasEl.width, canvasEl.height)
  const toAnimate = animate ?? false
  renderToolpath(canvasEl, geometry.value, { animate: toAnimate })
  
}

const debouncedUpdate = debounce(() => {
  updateRender(false)
}, 250)

onMounted(() => {
  window.addEventListener('resize', debouncedUpdate)
  nextTick(() => {
    mounted = true
    updateRender(props.animated)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedUpdate)
})
</script>

<template>
  <canvas
    class="gcode-preview"
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
.gcode-preview {
  object-fit: contain;
}
.canvasposition {
  object-fit: contain;
  z-index:3;
  pointer-events:none;
 
}
</style>
<style scoped>
.image {
  background: url("icons/circle_small.png") no-repeat center
    center;
  background-size: contain;
  height:100%;
  width:100%;
}
</style>
