<template>
  <div class="float-ball" @click="onBallClick"></div>
  <el-radio-group
    v-if="showScreens"
    v-model="currentScreenId"
    class="screen-btn"
    @change="(id) => emit('screenChange', id)"
  >
    <el-radio-button
      v-for="item in allScreen"
      :key="item.stream_id"
      :label="item.name"
      :value="item.stream_id"
    />
  </el-radio-group>
</template>

<script setup lang="ts">
import { ScreenItem } from './type'

defineProps<{
  allScreen: ScreenItem[]
}>()
const currentScreenId = defineModel('currentScreenId', { type: String, required: true })
const emit = defineEmits(['screenChange'])

const showScreens = ref(false)
let isDragging = false

const onBallClick = () => {
  if (isDragging) return
  showScreens.value = !showScreens.value
}

let floatBall: HTMLElement
onMounted(() => {
  floatBall = document.querySelector('.float-ball')!
  let relativeX: number, relativeY: number
  floatBall.addEventListener('mousedown', (event) => {
    isDragging = false
    relativeX = event.clientX - floatBall.offsetLeft
    relativeY = event.clientY - floatBall.offsetTop
    window.addEventListener('mousemove', mousemove)
    window.addEventListener('mouseup', mouseup)
  })

  function mousemove(event) {
    isDragging = true
    let realX = event.clientX - relativeX < 0 ? 0 : event.clientX - relativeX
    let realY = event.clientY - relativeY < 0 ? 0 : event.clientY - relativeY
    if (realX + floatBall.offsetWidth > document.body.offsetWidth) {
      realX = document.body.offsetWidth - floatBall.offsetWidth
    }
    if (realY + floatBall.offsetHeight > document.body.offsetHeight) {
      realY = document.body.offsetHeight - floatBall.offsetHeight
    }
    floatBall.style.left = realX + 'px'
    floatBall.style.top = realY + 'px'
  }

  function mouseup() {
    window.removeEventListener('mousemove', mousemove)
    window.removeEventListener('mouseup', mouseup)
  }

  window.addEventListener('resize', resetPosition)
})

const resetPosition = () => {
  if (floatBall.offsetLeft < 0) floatBall.style.left = 0 + 'px'
  if (floatBall.offsetTop < 0) floatBall.style.top = 0 + 'px'
  if (floatBall.offsetLeft + floatBall.offsetWidth > document.body.offsetWidth) {
    floatBall.style.left = document.body.offsetWidth - floatBall.offsetWidth + 'px'
  }
  if (floatBall.offsetTop + floatBall.offsetHeight > document.body.offsetHeight) {
    floatBall.style.top = document.body.offsetHeight - floatBall.offsetHeight + 'px'
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', resetPosition)
})
</script>

<style scoped lang="less">
.float-ball {
  z-index: 1000;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  position: absolute;
  bottom: 20px;
  right: 20px;
  border: 2px solid darkturquoise;
  cursor: pointer;
  overflow: hidden;
}

.float-ball::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  width: 80px;
  height: 80px;
  background-color: darkturquoise;
  opacity: 0.8;
  border-radius: 30% 35% 40% 35%;
  transform: translate(-50%, 35%);
  animation: mave 5s linear infinite;
}

.float-ball::after {
  content: '悬浮球';
  position: absolute;
  top: 15px;
  left: 50%;
  font-size: 8px;
  font-weight: 700;
  transform: translate(-50%, 0);
}

@keyframes mave {
  100% {
    transform: translate(-50%, 35%) rotate(360deg);
  }
}

.screen-btn {
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translate(-50%);
}
</style>
