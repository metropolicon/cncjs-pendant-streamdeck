/*jslint todo: true, browser: true, continue: true, white: true*/

/**
 * Written by Alex Canales for ShopBotTools, Inc.
 */

'use strict'

/*
 * The colors for displaying G0, G1, G2 and G3 commands, each field is a string
 * of an hexadecimal color (ex: "#ff00ff"). If one field is undefined, the
 * corresponding G-Code command is not displayed.
 *
 * @typedef {object} Colors
 * @property {string} [colors.G0] - The colors for displaying G0 commands.
 * @property {string} [colors.G1] - The colors for displaying G1 commands.
 * @property {string} [colors.G2G3] - The colors for displaying G2 and G3
 *   commands.
 */

/**
 * Calculates the ratio for the scale.
 * @param {object} gcode The parsed G-Code.
 * @param {object} canvas The DOM Element canvas.
 * @return {number} The scale ratio.
 */
import { useGcodeStore } from '@/stores/gcode' 
//
 
 
 var first=true
export function calculateRatio(size, canvas) {
  var pW = Math.abs(size.max.x - size.min.x)
  var pH = Math.abs(size.max.y - size.min.y)
  var cW = parseInt(canvas.width, 10),
    cH = parseInt(canvas.height, 10)

  return Math.min(cW / pW, cH / pH)
}

/**
 * Draws a straight line.
 * @param {object} ctx The canvas 2D context.
 * @param {number} ratio The scale ratio.
 * @param {object} start The lowest point of the G-Code command.
 * @param {object} line The line defined by the G-Code command.
 * @param {number} height The canvas height.
 * @param {string} color The hexadecimal color in string.
 * @param {object} settings
 */
function drawStraightLine(
  ctx,
  ratio,
  start,
  line,
  height,
  color,
  settings = {}
) {
  
  const startX = ratio * (line.start.x - start.x)
  const startY = height - ratio * (line.start.y - start.y)
  const endX = ratio * (line.end.x - start.x)
  const endY = height - ratio * (line.end.y - start.y)
  if (startX === endX && startY === endY) {
    return
  }
  if (first==true)
  {
     const gcode = useGcodeStore()
     gcode.setStartXY({"x":startX,"y":startY})
     first=false
  }
  
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.strokeStyle = color
  ctx.lineWidth = settings.lineWidth
  ctx.stroke()
  ctx.closePath()
}
export function drawMpos(context,rayon) 
{
    
    context.beginPath();    
    context.fillStyle = "#FF0000";
    context.arc(rayon,rayon, rayon, 0, 2 * Math.PI);
    context.fill();
    context.closePath()
    context.beginPath();    
    context.fillStyle = "#FFFF00";
    context.arc(rayon,rayon, rayon/2, 0, 2 * Math.PI);
    context.fill();
    context.closePath()
  
} 

export function MachinetoGrid(machinesize,rect,MposX,MposY,orientation)
{
      

      var x=Math.abs(MposX)
      var y=Math.abs(MposY)
      const machinesizeX=parseFloat(machinesize['x'])
      const machinesizeY=parseFloat(machinesize['y'])
      y=(y*(rect.height/machinesizeY)).toFixed(3)
      x=(x*(rect.width/machinesizeX)).toFixed(3)
      //if (orientation.includes('n')) { y=rect.height-y}          
      //if (orientation.includes('e')) { x=rect.width-x}
      return { 'x':x,'y':y}
      
}
/**
 * Draws a curved line.
 * @param {object} ctx The canvas 2D context.
 * @param {number} ratio The scale ratio.
 * @param {object} start The lowest point of the G-Code command.
 * @param {object} line The line defined by the G-Code command.
 * @param {number} height The canvas height.
 * @param {string} color The hexadecimal color in string.
 * @param {object} settings
 */
function drawCurvedLine(ctx, ratio, start, line, height, color, settings = {}) {
  var i = 0
  var b = line.beziers,
    l = {}
  ctx.beginPath()
  for (i = 0; i < b.length; i++) {
    l = b[i]
    ctx.moveTo(ratio * (l.p0.x - start.x), height - ratio * (l.p0.y - start.y))
    ctx.bezierCurveTo(
      ratio * (l.p1.x - start.x),
      height - ratio * (l.p1.y - start.y),
      ratio * (l.p2.x - start.x),
      height - ratio * (l.p2.y - start.y),
      ratio * (l.p3.x - start.x),
      height - ratio * (l.p3.y - start.y)
    )
  }
  ctx.strokeStyle = color
  ctx.lineWidth = settings.lineWidth || 2
  ctx.stroke()
  ctx.closePath()
}

/**
 * Previews in a canvas the G-Code.
 *
 * @param {object} size - The G-Code size geometry
 * @param {Colors} colors - The colors for displaying the commands.
 * @param {object} settings - Settings for drawing
 * @param {Canvas|DOMElement} canvas - The canvas (from document or the canvas
 *   library).
 * @return {function} - Callback to parse and render a line of gcode
 */
export function preview(size, colors, settings, canvas,machinesize,premier) {
  if (colors === undefined) {
    return
  }
  settings ??= {}
  first=premier

  if (size.max.x === size.min.x && size.max.y === size.min.y) {
    return
  }
  let targetDimensions = {}

  if (settings.width && settings.height) {
    targetDimensions.width = settings.width
    targetDimensions.height = settings.height
  } else {
    targetDimensions.width = canvas.width
    targetDimensions.height = canvas.height
  }
  const imageWidth = Math.abs(size.max.x - size.min.x)
  const imageHeight = Math.abs(size.max.y - size.min.y)
  const ratio = calculateRatio(size, targetDimensions)

  if (settings.autosize) {
    canvas.height = imageHeight * ratio 
    canvas.width = imageWidth * ratio 
  }
  const start = {
    x: size.min.x - (canvas.width / ratio - imageWidth) / 2,
    y: size.min.y - (canvas.height / ratio - imageHeight) / 2,
  }
  const cH = parseInt(canvas.height, 10)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  const minLineWidth = settings.lineWidth ?? 0.08
  const drawSettings = {
    lineWidth: Math.max(minLineWidth, ratio * 0.003),
  }
  
  // Cleaning
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.beginPath()
  ctx.rect(0, 0, canvas.width, canvas.height)
  console.log("canvas.width, canvas.height :",canvas.width, canvas.height)
  ctx.fillStyle = settings.bg || 'transparent'
  ctx.fill()
  ctx.imageSmoothingEnabled = true
  ctx.lineCap = 'round'

  return (line) => {
    if (line.type === 'G0' && colors.G0 !== undefined) {
      drawStraightLine(ctx, ratio, start, line, cH, colors.G0, drawSettings)
    } else if (line.type === 'G1' && colors.G1 !== undefined) {
      drawStraightLine(ctx, ratio, start, line, cH, colors.G1, drawSettings)
    } else if (
      (line.type === 'G2' || line.type === 'G3') &&
      colors.G2G3 !== undefined
    ) {
      drawCurvedLine(ctx, ratio, start, line, cH, colors.G2G3, drawSettings)
    }
  }
}
