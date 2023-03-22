import { preview } from '@/vendor/gcodethumbnail/gcodethumbnail'
import { clickgrid } from '@/vendor/gcodethumbnail/clictomove'
import { useCncStore } from '@/stores/cnc'
import { useUiStore } from '@/stores/ui'

const animatedWait = (delay) => () => {
  return new Promise((resolve) => setTimeout(resolve, delay))
}
const defaultColors = {
  G0: '#ffff35',
  G1: '#ffffff',
  G2G3: '#ffffff',
}

export const renderToolpath = (
  canvas,
  parsedGcode,
  settings,
  callback = () => {},
  halted = () => false
) => {
  const colors = { ...defaultColors, ...(settings.colors || {}) }
  const options = { autosize: true, ...settings }

  const drawLine = preview(parsedGcode.size, colors, options, canvas)
  if (!drawLine) {
    return
  }

  if (options.animate) {
    return animatedDraw({
      lines: parsedGcode.lines,
      drawLine,
      duration: 4000,
      throttle: settings.throttle,
      callback,
      halted,
    })
  } else {
    return draw(parsedGcode.lines, drawLine, callback, halted)
  }
}

//telex
export const renderClicmove = (
  canvas, 
  settings  
) => {
  
  const ui = useUiStore()
  const machinesize=useCncStore().getLimitsXYZ()
  const getMpos=useCncStore().getMpos
  const options = { autosize: true, ...settings }
  console.log(machinesize)
  clickgrid( options, canvas,machinesize,ui.orientation,getMpos)
  
  
}

//------------------

function* chunkLines(lines, size = 1) {
  for (let i = 0, l = lines.length; i < l; i += size) {
    yield [i + size, lines.slice(i, i + size)]
  }
}

const animatedDraw = async ({
  lines,
  drawLine,
  duration,
  callback,
  halted,
  throttle,
}) => {
  let fps = 30
  if (throttle) {
    fps = 1000 / throttle
  }
  const linesPerFrame = Math.max(
    1,
    Math.floor(lines.length / ((duration / 1000) * fps))
  )

  const wait = animatedWait(1000 / fps)
  const gen = chunkLines(lines, linesPerFrame)
  for (const [index, chunk] of gen) {
    if (halted()) {
      return
    }
    chunk.forEach(drawLine)
    callback(index)
    await wait()
  }
  callback(lines.length)
}

const draw = async (lines, drawLine, callback, halted) => {
  let nextWait = Date.now()
  const wait = animatedWait(60)
  for (const [index, line] of Object.entries(lines)) {
    if (halted()) {
      return
    }
    drawLine(line)
    if (Date.now() > nextWait) {
      callback(index)
      await wait()
      nextWait = Date.now() + 50
    }
  }
  callback(lines.length)
}
