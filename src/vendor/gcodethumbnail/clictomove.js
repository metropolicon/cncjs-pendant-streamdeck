/*jslint todo: true, browser: true, continue: true, white: true*/

/**
 * Written by Alex Canales for ShopBotTools, Inc.
 */

'use strict'


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
 const space=10
 function drawLine(ctx,fromx,fromy,tox,toy,color,widthline)
 {
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = widthline
  ctx.moveTo(fromx, fromy)
  ctx.lineTo(tox, toy)
  ctx.stroke() 
  ctx.closePath()
 }
 
function drawMpos(context,x=0,y=0) 
{
    context.fillStyle = "#FFFF00";
    context.beginPath();
    context.arc(15,15, 10, 0, 2 * Math.PI);
    context.fill();
    context.closePath()
  
} 

function MachinetoGrid(machinesize,rect,MposX,MposY,orientation)
{

      var x=Math.abs(MposX)
      var y=Math.abs(MposY)
      const machinesizeX=parseFloat(machinesize['x'])
      const machinesizeY=parseFloat(machinesize['y'])
      y=(y*(rect.height/machinesizeY)).toFixed(3)
      x=(x*(rect.width/machinesizeX)).toFixed(3)
      if (orientation.includes('s')) { y=rect.height-y}          
      if (orientation.includes('e')) { x=rect.width-x}
      return { 'x':x,'y':y}
      
}

function arrow (ctx,position,color,width=3,legende) {
   
  
  var x0=position.x0
  var y0=position.y0
  var x1=position.x1
  var y1=position.y1
  
  const head_len = 16;
  const head_angle = Math.PI / 6;
  const angle = Math.atan2(y1 - y0, x1 - x0);

  ctx.lineWidth = width;
 ctx.fillStyle = color;
 ctx.strokeStyle = color
  /* Adjust the point */
  x1 -= width * Math.cos(angle);
  y1 -= width * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.closePath()
  ctx.beginPath();
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - head_len * Math.cos(angle - head_angle), y1 - head_len * Math.sin(angle - head_angle));
  ctx.lineTo(x1 - head_len * Math.cos(angle + head_angle), y1 - head_len * Math.sin(angle + head_angle));
  ctx.stroke();
  ctx.fill();  
  ctx.closePath();
  return {x:x1,y:y1}
}


 
function drawgrid(canvas,ctx,orientation,MposX=0,MposY=0,machinesize)
{
   
   const gridcolor="#777777"
   const axeXcolor="#aaaaff"
   const axeYcolor="#ff2222"
   const gridCent="#ffff00"
   ctx.clearRect(0, 0, canvas.width, canvas.height)
  //TELEX
   //ctx.setLineDash([5,5])
  const CanvasRect=canvas.getBoundingClientRect()
  var arrowXY={x0:0,y0:0,x1:0,y1:0}
  const maxWidth=(Math.trunc(canvas.width/space)*space)
  const maxHeight=(Math.trunc(canvas.height/space)*space)
  var MyPos=MachinetoGrid(machinesize,CanvasRect,0,0,orientation)  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  for (let pas = 0; pas <= maxHeight; pas=pas+space) { // horizontal lines 
    MyPos=MachinetoGrid(machinesize,CanvasRect,0,pas,orientation)
    if (pas % 100 !==0 ) drawLine(ctx,0,MyPos.y,canvas.width,MyPos.y,gridcolor,1)          
  } 
  
  
  for (let pas = 0; pas <= maxWidth; pas=pas+space) { //vertical lines
    // drawLine(ctx,pas,0,pas,maxHeight,gridcolor,1)    
    MyPos=MachinetoGrid(machinesize,CanvasRect,pas,0,orientation)
    if (pas % 100 !==0 ) drawLine(ctx,MyPos.x,0,MyPos.x,canvas.height,gridcolor,1) 
  } 
  
  
  ctx.beginPath()
  
  
  const Centre={x:maxWidth/2,y:maxHeight/2}
   if (orientation.includes('n')) Centre.y=10
    else Centre.y=maxHeight-10
      
    if (orientation.includes('w')) Centre.x=10
    else Centre.x=maxWidth-10

    if (orientation.includes('e')) arrowXY={x0:Centre.x,y0:Centre.y,x1:Centre.x-100,y1:Centre.y}
    else arrowXY={x0:Centre.x,y0:Centre.y,x1:Centre.x+100,y1:Centre.y}
    
  var texteXY =arrow(ctx,arrowXY,axeXcolor,4,"X")
    ctx.font = "24px serif"    
    if (orientation.includes('w')) ctx.fillText("X", texteXY.x+30 , texteXY.y+9)
    else ctx.fillText("X", texteXY.x-40 , texteXY.y+9)

  
  ctx.closePath()
  ctx.beginPath()
  
 
    if (orientation.includes('s')) arrowXY={x0:Centre.x,y0:Centre.y,x1:Centre.x,y1:Centre.y-100}
    else arrowXY={x0:Centre.x,y0:Centre.y,x1:Centre.x,y1:Centre.y+100}
     
   
  texteXY =arrow(ctx,arrowXY,axeYcolor,4,"Y")
  ctx.font = "24px serif"    
  if (orientation.includes('s')) ctx.fillText("Y", texteXY.x-9 , texteXY.y-30)
  else ctx.fillText("Y", texteXY.x-9, texteXY.y+30)
   
  ctx.closePath()  
  
  
  for (let pas = 0; pas <= Math.round(machinesize['y']); pas=pas+100) { // horizontal lines 100
    MyPos=MachinetoGrid(machinesize,CanvasRect,0,pas,orientation)
    var posy=parseInt(MyPos.y) 
    ctx.setLineDash([5,5])
    drawLine(ctx,0,posy,canvas.width,posy,"#ffffff",1)
    if (pas>0) {  
    ctx.font = "16px serif" 
    ctx.fillStyle = "#ffffff"   
    ctx.fillText(pas, 0 , posy)
    ctx.fillText(pas, canvas.width-30 , posy)
  }
            
  } 
  for (let pas = 0; pas <= Math.round(machinesize['x']); pas=pas+100) { // horizontal lines 100
    MyPos=MachinetoGrid(machinesize,CanvasRect,pas,0,orientation)
    var posx=parseInt(MyPos.x)
    ctx.setLineDash([5,5])
    drawLine(ctx,posx,0,posx,canvas.height,"#ffffff",1)
     if (pas>0)  {  
    ctx.font = "16px serif" 
    ctx.fillStyle = "#ffffff"  
   
    ctx.fillText(pas, posx-15,15 )
    ctx.fillText(pas, posx-15,canvas.height)
  }
            
  } 
  
}




export function clickgrid(settings, canvas, machinesize,orientation,getMpos) {
   
  let startx=0
  let starty=0
  const machinesizeX=parseFloat(machinesize['x'])
  const machinesizeY=parseFloat(machinesize['y'])
  let canvasratioX=machinesizeX/machinesizeY
  let machinevertical=false  
  const originalWidth  = canvas.width;
  const originalHeight = canvas.height;  
  
  var canvasPosition=document.getElementsByClassName('canvasposition')[0]  
  canvasPosition.id     = "CursorPosition";
  canvasPosition.width  = 30;
  canvasPosition.height = 30;  
  canvasPosition.style.zIndex   = 999;
  canvasPosition.style.position = "absolute";
  canvasPosition.style.top= "0px";
  canvasPosition.style.left= "0px";
  
  const ctxPosition = canvasPosition.getContext('2d')
  
  if (canvasratioX<1) { machinevertical=true  }
  
  
  if (machinevertical==true)
  {
    let ratiocanvasH=canvas.height/machinesizeY
    canvas.height=Math.trunc(machinesizeY*ratiocanvasH )-50
    canvas.width=Math.trunc(machinesizeX*ratiocanvasH )
    
  }
  else
    {
      let ratiocanvasH=canvas.height/machinesizeY
    canvas.height=Math.trunc(machinesizeY*ratiocanvasH )
    canvas.width=Math.trunc(machinesizeX*ratiocanvasH )
    
    }
  const CanvasRect=canvas.getBoundingClientRect()
  
  
  
  const maxWidth=(Math.trunc(canvas.width/space)*space)
  const maxHeight=(Math.trunc(canvas.height/space)*space)
  
  const ctx = canvas.getContext('2d')
  let lastvalue = getMpos();
  let MposX = lastvalue['x']
  let MposY = lastvalue['y']
  var MyPos=MachinetoGrid(machinesize,CanvasRect,MposX,MposY,orientation)
  drawgrid(canvas,ctx,orientation,MyPos['x'],MyPos['y'],machinesize)
     
  
  MposX=65535;
  MposY=65535;
  const diffY=((originalHeight-canvas.height)/2)-15
  const diffX=((originalWidth-canvas.width)/2)-15
  drawMpos(ctxPosition,MposX,MposY)
  setInterval(function() {
    var newValue = getMpos();
    if (MposX!=newValue['x'] || MposY!=newValue['y'])
    
    {
    //if (lastvalue != newValue) {
       
        MposX=newValue['x']
        MposY=newValue['y']
        MyPos=MachinetoGrid(machinesize,CanvasRect,MposX,MposY,orientation)
        var MposNX=parseInt(MyPos['x'])+parseInt(diffX)
        var MposNY=parseInt(MyPos['y'])+parseInt(diffY)
        canvasPosition.style.top= ""+MposNY+"px";
        canvasPosition.style.left= ""+MposNX+"px";
        

        
    }
  }, 5); //
  
  
}
