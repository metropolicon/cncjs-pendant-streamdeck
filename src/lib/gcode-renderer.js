import { preview } from '@/vendor/gcodethumbnail/gcodethumbnail'
import { MachinetoGrid } from '@/vendor/gcodethumbnail/gcodethumbnail'
import { calculateRatio } from '@/vendor/gcodethumbnail/gcodethumbnail'
import { drawMpos } from '@/vendor/gcodethumbnail/gcodethumbnail'
import { clickgrid } from '@/vendor/gcodethumbnail/clictomove'
import { useCncStore } from '@/stores/cnc'
import { useUiStore } from '@/stores/ui'
import { useGcodeStore } from '@/stores/gcode'




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
  const ui = useUiStore()
  const gcode = useGcodeStore()
  const machinesize=useCncStore().getLimitsXYZ()
  // const colors = { ...defaultColors, ...(settings.colors || {}) }
  const colors=ui.gcodeColors
  
  const options = { lineWidth:ui.lineWidth, autosize: true, ...settings }
  const size=parsedGcode.size
  
  
  try {
  if (myInterval) {
    clearInterval(myInterval);
    myInterval=null
  }
}
catch (error) {
  var myInterval=null
}
 
  // -------------------------------------
     
  const machinesizeX=parseFloat(machinesize['x'])
  const machinesizeY=parseFloat(machinesize['y'])
  const canvasWidth=canvas.width
  const canvasHeight=canvas.height   
  const rayon=parseInt((15*canvas.height)/1080)  
  var canvasPosition=document.getElementsByClassName('canvasposition')[0]  
  canvasPosition.id     = "CursorPosition";
  canvasPosition.width  = rayon*2;
  canvasPosition.height = rayon*2;  
  canvasPosition.style.zIndex   = 999;
  canvasPosition.style.position = "absolute";
  canvasPosition.style.top= "0px";
  canvasPosition.style.left= "0px";  
  
  const ctxPosition = canvasPosition.getContext('2d')
  var first=true
  // -------------------------------------
  const drawLine = preview(parsedGcode.size, colors, options, canvas,machinesize,first)
  if (!drawLine) {
    return
  }
  first=false
  var startXY=gcode.getStartXY()
  if (options.animate) {
    animatedDraw({
      lines: parsedGcode.lines,
      drawLine,
      duration: 4000,
      throttle: settings.throttle,
      callback,
      halted,
    })
  } 
  else 
  {
    draw(parsedGcode.lines, drawLine, callback, halted)
  }
  var Mpos={"X":65535,"Y":65535,"Z":65535 };
  let targetDimensions = {}   
  const centreX=gcode.displayRange.min.x<0 ? Math.abs(gcode.displayRange.min.x) : 0;
  const centreY=gcode.displayRange.min.y<0 ? Math.abs(gcode.displayRange.min.y) : 0;
  const RatioX=(canvas.width/parseFloat(gcode.displayDimensions.width)) 
  const RatioY=(canvas.height/parseFloat(gcode.displayDimensions.depth)) 
  const DiffX=Math.round((canvasWidth-canvas.width)/2)-rayon
  const DiffY=parseInt(canvas.height)+Math.round((canvasHeight-canvas.height)/2)-rayon
    
  if (Mpos.X>0)
  {
    // drawMpos(ctxPosition,rayon)
    const img = new Image()
    var idxImg=0
    const Img=["icons/z0.png","icons/z1.png","icons/z2.png","icons/z3.png"]
    img.src = Img[idxImg]    
    ctxPosition.drawImage(img,0,0,rayon*2,rayon*2)
    startXY=gcode.getStartXY()
    myInterval=setInterval(function() {
    var newValue = useCncStore().getWpos();
    if (Mpos.X!=parseFloat(newValue['x']).toFixed(3) || Mpos.Y!=parseFloat(newValue['y']).toFixed(3))   
    {      
        Mpos.X=parseFloat(newValue['x']).toFixed(3)
        Mpos.Y=parseFloat(newValue['y']).toFixed(3)
        
        var MposNX=Math.round((parseFloat(Mpos.X)+parseFloat(centreX))*RatioX)+DiffX
        var MposNY=Math.round(DiffY-((parseFloat(Mpos.Y)+parseFloat(centreY))*RatioY))
        
        canvasPosition.style.top= ""+MposNY+"px";
        canvasPosition.style.left= ""+MposNX+"px";  
       
        
    }
    if (Mpos.Z!=parseInt(newValue['z']))
    {
      Mpos.Z=parseInt(newValue['z'])
      idxImg=idxImg<3 ? idxImg+1:0
      ctxPosition.clearRect(0, 0, rayon*2,rayon*2)
      img.src = `icons/z${idxImg}.png`; 
      ctxPosition.drawImage(img,0,0,rayon*2,rayon*2)
      
    }
    if (ui.sceneName!="currentGcode" && ui.sceneName!="status") {
      clearInterval(myInterval);
      myInterval=null
      console.log("CLEARINTERVAL)")
    }
  }, 5); //
}
else {
  if (myInterval) {
    clearInterval(myInterval);
    myInterval=null
  }
}

}

// *************************telex***************
export const renderClicmove = (
  canvas, 
  settings  
) => {
  
  const ui = useUiStore()
  const machinesize=useCncStore().getLimitsXYZ()
  const getMpos=useCncStore().getMpos
  const options = { autosize: true, ...settings }
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
