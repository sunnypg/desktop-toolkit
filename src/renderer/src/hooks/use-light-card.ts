import { onMounted, onUnmounted, ref } from 'vue'

interface IOptions {
  light?: {
    width?: number // 宽
    height?: number // 高
    color?: string // 颜色
    blur?: number // filter: blur()
  }
  rotate?: boolean // 是否旋转
}

export const useLightCard = (option: IOptions = {}) => {
  // 获取卡片的dom节点
  const cardRef = ref<HTMLDivElement | null>(null)
  let cardOverflow = ''
  // 光的dom节点
  const lightRef = ref<HTMLDivElement>(document.createElement('div'))
  // 设置光源的样式

  const setLightStyle = () => {
    const { width = 60, height = 60, color = '#ff4132', blur = 40 } = option.light ?? {}
    const lightDom = lightRef.value
    lightDom.style.position = 'absolute'
    lightDom.style.width = `${width}px`
    lightDom.style.height = `${height}px`
    lightDom.style.background = color
    lightDom.style.filter = `blur(${blur}px)`
  }

  // 设置卡片的 overflow 为 hidden
  const setCardOverflowHidden = () => {
    const cardDom = cardRef.value
    if (cardDom) {
      cardOverflow = cardDom.style.overflow
      cardDom.style.overflow = 'hidden'
    }
  }
  // 还原卡片的 overflow
  const restoreCardOverflow = () => {
    const cardDom = cardRef.value
    if (cardDom) {
      cardDom.style.overflow = cardOverflow
    }
  }

  // 往卡片添加光源
  const addLight = () => {
    const cardDom = cardRef.value
    if (cardDom) {
      cardDom.appendChild(lightRef.value)
    }
  }
  // 删除光源
  const removeLight = () => {
    const cardDom = cardRef.value
    if (cardDom) {
      cardDom.removeChild(lightRef.value)
    }
  }

  // 监听卡片的鼠标移入
  const onMouseEnter = () => {
    // 添加光源
    addLight()
    setCardOverflowHidden()
  }

  // use-light-card.ts

  // 监听卡片的鼠标移动
  const onMouseMove = (e: MouseEvent) => {
    // 获取鼠标的坐标
    const { clientX, clientY } = e
    // 让光跟随鼠标
    const cardDom = cardRef.value
    const lightDom = lightRef.value
    if (cardDom) {
      // 获取卡片相对于窗口的x和y坐标
      const { x, y } = cardDom.getBoundingClientRect()
      // 获取光的宽高
      const { width, height } = lightDom.getBoundingClientRect()
      lightDom.style.left = `${clientX - x - width / 2}px`
      lightDom.style.top = `${clientY - y - height / 2}px`

      //   设置动画效果
      const maxXRotation = 10 // X 轴旋转角度
      const maxYRotation = 10 // Y 轴旋转角度

      const rangeX = 200 / 2 // X 轴旋转的范围
      const rangeY = 200 / 2 // Y 轴旋转的范围

      const rotateX = ((clientX - x - rangeY) / rangeY) * maxXRotation // 根据鼠标在 Y 轴上的位置计算绕 X 轴的旋转角度
      const rotateY = -1 * ((clientY - y - rangeX) / rangeX) * maxYRotation // 根据鼠标在 X 轴上的位置计算绕 Y 轴的旋转角度

      cardDom.style.transform = `perspective(1000px) ${option.rotate ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : ''} ` //设置 3D 透视
    }
  }
  // 监听卡片鼠标移出
  const onMouseLeave = () => {
    // 鼠标离开移出光源
    removeLight()
    restoreCardOverflow()
  }

  onMounted(() => {
    // 设置光源样式
    setLightStyle()
    // 绑定事件
    cardRef.value?.addEventListener('mouseenter', onMouseEnter)
    cardRef.value?.addEventListener('mousemove', onMouseMove)
    cardRef.value?.addEventListener('mouseleave', onMouseLeave)
  })

  onUnmounted(() => {
    // 解绑事件
    cardRef.value?.removeEventListener('mouseenter', onMouseEnter)
    cardRef.value?.removeEventListener('mousemove', onMouseMove)
    cardRef.value?.removeEventListener('mouseleave', onMouseLeave)
  })

  return {
    cardRef
  }
}
