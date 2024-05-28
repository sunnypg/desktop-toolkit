import { ref, onMounted } from 'vue'

let isDragging = false
const offset = { x: 0, y: 0 }
function mousedown(e: MouseEvent, target: HTMLElement) {
  const targetElement = e.target as Element
  if (targetElement === target) {
    isDragging = true
    offset.x = e.screenX - window.screenX
    offset.y = e.screenY - window.screenY
  }
}

function mousemove(e: MouseEvent) {
  if (isDragging) {
    const { screenX, screenY } = e
    window.moveTo(screenX - offset.x, screenY - offset.y)
  }
}

function mouseup() {
  isDragging = false
}

export default function useDrag() {
  const dragRef = ref()
  onMounted(() => {
    let target: HTMLElement
    // 判断dragRef是否为html元素还是Element组件
    if (dragRef.value instanceof HTMLElement) {
      target = dragRef.value
    } else {
      target = dragRef.value.$el
    }
    document.addEventListener('mousedown', (e) => mousedown(e, target))
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
  })
  return dragRef
}
