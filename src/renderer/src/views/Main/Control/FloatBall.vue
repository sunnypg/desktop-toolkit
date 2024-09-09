<template>
  <div
    class="float-ball"
    :style="{ width: showMenu ? '150px' : '40px', height: showMenu ? '150px' : '40px' }"
  >
    <div class="float-ball-wrapper">
      <div class="float-ball-btn" @click="onBallClick"></div>
    </div>
    <div
      v-for="(item, index) in menuList"
      :key="item.label"
      class="menu-item"
      :style="`transform: rotate(${index * degree - 126}deg) skew(${90 - degree}deg)`"
    >
      <el-tooltip :content="item.label" :placement="item.placement">
        <div
          :class="['item-icon', item.id ? 'icon-active' : '']"
          :style="`transform: skew(${-(90 - degree)}deg)`"
          @click="item.click"
        >
          <el-icon>
            <svg-icon v-if="item.isCustom" :icon-name="item.icon"></svg-icon>
            <Component :is="item.icon" v-else></Component>
          </el-icon>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EpPropMergeType } from 'element-plus/es/utils'
import { ScreenItem } from './type'
import { Placement } from 'element-plus'

const props = defineProps<{
  allScreen: ScreenItem[]
}>()
const currentScreenId = defineModel('currentScreenId', { type: String, required: true })
const emit = defineEmits(['screenChange', 'autoResize'])
const showMenu = ref(false)
let isDragging = false

interface MenuItem {
  label: string
  isCustom?: boolean
  icon: string
  placement: EpPropMergeType<StringConstructor, Placement, unknown>
  id?: string
  click: () => void
}
const menuList = ref<MenuItem[]>([
  {
    label: '全屏',
    isCustom: true,
    icon: 'icon-quanping',
    placement: 'top',
    click: () => {
      const item = menuList.value[0]
      if (item.label === '全屏') {
        item.label = '自适应'
        item.icon = 'icon-zishiying'
        emit('autoResize', false)
      } else {
        item.label = '全屏'
        item.icon = 'icon-quanping'
        emit('autoResize', true)
      }
    }
  },
  {
    label: 'menu-item',
    icon: 'Monitor',
    placement: 'right',
    click: () => {}
  },
  {
    label: 'menu-item',
    icon: 'Monitor',
    placement: 'right',
    click: () => {}
  },
  {
    label: 'menu-item',
    icon: 'Monitor',
    placement: 'left',
    click: () => {}
  },
  {
    label: 'menu-item',
    icon: 'Monitor',
    placement: 'left',
    click: () => {}
  }
])

const degree = 360 / menuList.value.length

watch(
  () => props.allScreen,
  (newValue) => {
    for (const screen of newValue) {
      const item = menuList.value.find((item) => item.label === 'menu-item')
      if (item) {
        item.label = screen.name
        item.id = screen.stream_id
        item.click = () => {
          currentScreenId.value = screen.stream_id
          emit('screenChange', screen.stream_id)
        }
      }
    }
  }
)

const onBallClick = () => {
  if (isDragging) return
  showMenu.value = !showMenu.value
}

let start = 40
const handleResize = (entries) => {
  entries.forEach((entry) => {
    const offsetX = (entry.contentRect.width - start) / 2
    const offsetY = (entry.contentRect.height - start) / 2
    if (offsetX !== 0 && offsetY !== 0) {
      floatBall.style.top = floatBall.offsetTop - offsetY + 'px'
      floatBall.style.left = floatBall.offsetLeft - offsetX + 'px'
    }
    start = entry.contentRect.width

    if (floatBall.offsetLeft < 0) floatBall.style.left = 0 + 'px'
    if (floatBall.offsetTop < 0) floatBall.style.top = 0 + 'px'
    if (floatBall.offsetLeft + entry.contentRect.width > document.body.offsetWidth) {
      floatBall.style.left = document.body.offsetWidth - entry.contentRect.width + 'px'
    }
    if (floatBall.offsetTop + entry.contentRect.height > document.body.offsetHeight) {
      floatBall.style.top = document.body.offsetHeight - entry.contentRect.height + 'px'
    }
  })
}
const resizeObserver = new ResizeObserver(handleResize)

let floatBall: HTMLElement
let floatBallBtn: HTMLElement
let mousedownX: number, mousedownY: number
onMounted(() => {
  floatBall = document.querySelector('.float-ball')!
  floatBallBtn = document.querySelector('.float-ball-btn')!
  resizeObserver.observe(floatBall)
  let relativeX: number, relativeY: number
  floatBallBtn.addEventListener('mousedown', (event) => {
    mousedownX = event.clientX
    mousedownY = event.clientY

    relativeX = event.clientX - floatBall.offsetLeft
    relativeY = event.clientY - floatBall.offsetTop
    window.addEventListener('mousemove', mousemove)
    window.addEventListener('mouseup', mouseup)
  })

  function mousemove(event) {
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

  function mouseup(event) {
    isDragging = event.clientX !== mousedownX || event.clientY !== mousedownY ? true : false
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
  border-radius: 50%;
  background-color: #1c212b;
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition:
    width 0.8s ease,
    height 0.8s ease;

  .float-ball-wrapper {
    z-index: 1000;
    background-color: #1c212b;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;

    .float-ball-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #f4f4f4;
      border: 3px solid #8f9192;
      box-sizing: border-box;
      cursor: pointer;
    }
  }

  .menu-item {
    width: 150px;
    height: 150px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: top left;

    .item-icon {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 13px;
      left: 16px;
      cursor: pointer;
      transform-origin: center;
    }

    .icon-active {
      background-color: #409eff;
      color: #fff;
    }
  }

  .menu-item:hover {
    background-color: rgba(249, 249, 249, 0.1);
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
