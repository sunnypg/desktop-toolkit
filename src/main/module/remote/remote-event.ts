import { Button, keyboard, mouse, Point } from '@scanood/nut-js'
import { keymap } from './keymap'

keyboard.config.autoDelayMs = 5
export function keyboardAction(type: string, code: string) {
  const key = keymap.get(code)
  if (!key) return
  switch (type) {
    case 'keydown':
      keyboard.pressKey(key)
      break
    case 'keyup':
      keyboard.releaseKey(key)
      break
  }
}

mouse.config.mouseSpeed = 0
export async function mousemoveAction(x: number, y: number) {
  const point = new Point(x, y)
  await mouse.move([point])
}

export function mouseAction(data: any) {
  const buttonMap = {
    0: Button.LEFT,
    1: Button.MIDDLE,
    2: Button.RIGHT
  }

  if (data.type === 'mousedown') {
    mouse.pressButton(buttonMap[data.button])
  } else if (data.type === 'mouseup') {
    mouse.releaseButton(buttonMap[data.button])
  } else if (data.type === 'mousewheel') {
    if (data.deltaY > 0) {
      mouse.scrollDown(data.deltaY)
    } else if (data.deltaY < 0) {
      mouse.scrollUp(Math.abs(data.deltaY))
    }
  }
}
