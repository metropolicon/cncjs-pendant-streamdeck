import { useFileListStore } from '@/stores/file-list'
import { useUiStore } from '@/stores/ui'
import { useCncStore } from '@/stores/cnc'
import { useGcodeStore } from '@/stores/gcode'

import Swal from 'sweetalert2'

const lazyStore = () => {
  return {
    get ui() {
      delete this.ui
      return (this.ui = useUiStore())
    },
    get cnc() {
      delete this.cnc
      return (this.cnc = useCncStore())
    },
    get fileList() {
      delete this.fileList
      return (this.fileList = useFileListStore())
    },
    get gcode() {
      delete this.gcode
      return (this.gcode = useGcodeStore())
    },
  }
}

const machineCommands = new Set([
  'clearGcode',
  'enterPosition',
  'enterWcs',
  'enterToolDiameter',
  'clickMoveTo',
  'MessageBox',
  'ConfirmBox',
  'SaveProbeZPosition',
  'enterStepXY',
  'enterStepZ',
  'gcode',
  'goto',
  'homing',
  'jog',
  'loadDetailFile',
  'loadGcode',
  'macro',
  'resetFeedrate',
  'resetRapids',
  'resetSpindle',
  'decreaseFeedrate',
  'increaseFeedrate',
  'setRapids',
  'increaseSpindle',
  'decreaseSpindle',
  'startSmoothJog',
  'stopSmoothJog',
])

const runningCommands = new Set([
  'decreaseFeedrate',
  'decreaseSpindle',
  'increaseFeedrate',
  'increaseSpindle',
  'resetFeedrate',
  'resetRapids',
  'resetSpindle',
  'setRapids',
])

// commands that can be run after reset
const alarmCommands = new Set(['homing', 'unlock'])

// map configuration to actions
export default (actionBus, connectionBus) => {
  const store = lazyStore()

  const backScene = (count = 1) => {
    store.ui.goBack(count)
  }

  const swapScene = (scene) => {
    store.ui.swapScene(scene)
  }

  const navigate = (scene) => {
    store.ui.goToScene(scene)
  }

  const enterWcs = (axis, scene = 'numpad') => {
    const label = `${store.cnc.modal.wcs}\n${axis.toUpperCase()} offset`
    store.ui.startInput(store.cnc.wpos[axis], label, scene, (result) => {
      gcode(`G10 L20 P1 ${axis}${result}`)
    })
  }

  const enterPosition = (axis, scene = 'numpad') => {
    const label = `${store.cnc.modal.wcs}\nGo to ${axis.toUpperCase()}`
    store.ui.startInput(store.cnc.wpos[axis], label, scene, (result) => {
      gcode(`G0 ${axis}${result}`)
    })
  }
// TELEX 
  const MessageBox = (message,timeout=500) => {
    
    Swal.fire({  title: message,  icon: 'info',  timer:timeout,showConfirmButton:false, showCloseButton:false,backdrop:false,background:'#777',color:'#cc0'})
    
  }
  const ConfirmBox = (message,commande) => {
   // Swal.fire({  title: message,  icon: 'question',  showCloseButton:false,backdrop:false,background:'#777',color:'#cc0'})
    Swal.fire({  title: 'Are you sure?',
  text: message,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'Yes'
}).then((result) => {
  if (result.isConfirmed) {
    Swal.fire(
      'Deleted!',
      'Your file has been deleted.',
      'success'
    )
  }
})
    
  }

  const clickMoveTo = (scene = 'MoveClic')  => {
    store.ui.startClickMove(gcode,scene, (result) => {
      MessageBox("GOTO XY",1500)
    }  )
    
  }
  const enterToolDiameter = (VZ,VX,VY, scene = 'numpad') => {
    console.error(`RPROBEXYZ could not be found`)
    const label = `Enter tool diameter\n(${store.cnc.tooldiameter}mm)`
    store.ui.startInput(store.cnc.tooldiameter, label, scene, (result) => {
      MessageBox("Probe XYZ",1500)
      const PX=VX-(result/2)
      const PY=VY-(result/2)
      store.cnc.tooldiameter=result
      gcode(`G21\nG91\nG38.2 Z-45 F190\nG0 Z2\nG38.2 Z-25 F45\nG4 P0.1\nG10 L20 P1 Z${VZ}\nG4 P0.1\nG0 Z3\nG0 X-45\nG0 Z-10\nG38.2 X45 F190\nG0 X-2\nG38.2 X45 F45\nG4 P0.1\nG10 L20 P1 X${PX}\nG4 P0.1\nG0 X-1 Y-1 Z20\nG91\nG0 X25 Y-45\nG0 Z-20\nG38.2 Y45 F190\nG0 Y-2\nG38.2 Y45 F45\nG4 P0.1\nG10 L20 P1 Y${PY}\nG4 P0.1\nG0 Y-10\nG0 Z10\nG90\nG0 X0Y0`)
    })
  }
  
  const enterStepXY = (scene = 'numpad') => {
    const label = `Enter XY step\n(${store.cnc.jogDistance}mm)`
    store.ui.startInput(store.cnc.jodDistance, label, scene, (result) => {
      store.cnc.jogDistance=result
    })
  }
  
  const enterStepZ = ( scene = 'numpad') => {
    const label = `Enter Z step\n(${store.cnc.jogDistanceZ}mm)`
    store.ui.startInput(store.cnc.jodDistanceZ, label, scene, (result) => {
      store.cnc.jogDistanceZ=result
    })
  }
  
  
  const jogDistanceZ = (sign) => {
    if (sign === '-') {
      store.cnc.decreaseJogDistanceZ()
    } else {
      store.cnc.increaseJogDistanceZ()
    }
  }
  const completeClickMove = () => {
    store.ui.completeClickMove()
  }
  
  const SaveProbeZPosition = () => {
    console.log("SaveProbeZPosition")
    
    
    store.cnc.getMacroId("probeposition").then(macroid => {
    console.log("???: ",macroid)
    store.cnc.deleteMacroId(macroid).then( macroid => {
      
      
    console.log("attente creation")
    store.cnc.SaveProbeZPosition("G53Z-5\nG53X"+store.cnc.mpos.x+"Y"+store.cnc.mpos.y+"F3000")
    macroid=store.cnc.getMacroId("probeposition")
    MessageBox("Position Probe Z sauvegardée",1000)
    console.log("creation de la macro !",macroid) 
    console.log("X:",store.cnc.mpos.x," Y:",store.cnc.mpos.y)
    store.cnc.probeposition=true
  
      
    })
    })
    
  }
// FIN TELEX
  
  const completeInput = () => {
    store.ui.completeInput()
  }

  const input = (chars) => {
    store.ui.addInput(chars)
  }

  const inputCommand = (command) => {
    const input = store.ui.input
    if (command === 'backspace') {
      input.value = input.value.slice(0, -1)
    } else if (command === 'toggleSign') {
      input.value = input.value.startsWith('-')
        ? input.value.slice(1)
        : '-' + input.value
    }
  }

  const jog = (direction, axis) => {
    MessageBox("Jog "+axis)
    actionBus.emit('jog', { direction, axis })
  }

  const jogDistance = (sign) => {
    if (sign === '-') {
      store.cnc.decreaseJogDistance()
    } else {
      store.cnc.increaseJogDistance()
    }
  }
  

  const jogSpeed = (sign) => {
    if (sign === '-') {
      store.cnc.decreaseJogSpeed()
    } else {
      store.cnc.increaseJogSpeed()
    }
  }

  const run = () => {
    if (store.cnc.idle) {
      command('gcode:start')
      return
    }
    if (store.cnc.paused) {
      command('gcode:resume')
    }
  }

  const pause = () => {
    if (store.cnc.running) {
      command('gcode:pause')
    }
  }

  const stop = () => {
    if (store.cnc.paused) {
      command('gcode:stop', { force: true })
    }
  }

  const clearGcode = () => {
    if (store.cnc.idle && store.gcode.gcode) {
      command('gcode:unload', 'cake')
    }
  }

  const startSmoothJog = (direction, axis) => {
    actionBus.emit('smoothJog', { direction, axis })
  }

  const stopSmoothJog = (direction, axis) => {
    actionBus.emit('stopSmoothJog', { direction, axis })
  }

  const gcode = (code) => {
    if (code.startsWith('G0')) {
      const message = code.split('G0 ')[1]
      MessageBox("Go to "+message,1000)
    }
    if (code.startsWith('G10')) {
      const message = code.split(' ')
      MessageBox("set Zero "+message[3],1000)
    }
    actionBus.emit('gcode', code)
  }
  const command = (cmd, ...args) => {
    //Swal.fire({  title: cmd,  icon: 'info',  timer:1000,showConfirmButton:false, showCloseButton:false})
    actionBus.emit('command', { command: cmd, args: args })
  }
  const reset = () => {
    command('reset')
    command('unlock')
  }
  const connect = () => {
    if (!store.cnc.connected) {
      store.cnc.setConnecting()
      connectionBus.emit('connect')
    }
  }

  const userCommand = async (commandId, commandName) => {
    if (!commandId && commandName) {
      commandId = await store.cnc.getCommandId(commandName)
      if (!commandId) {
        console.error(`Requested command "${commandName}" could not be found`)
        return
      }
    }
    store.cnc.runCommand(commandId)
  }

  const macro = async (macroId, macroName) => {
    if (!macroId && macroName) {
      macroId = await store.cnc.getMacroId(macroName)
      if (!macroId) {
        console.error(`Requested macro "${macroName}" could not be found`)
        return
      }
    }
    MessageBox("Execute macro [<span style='color:white'>"+macroName+'</span>]',1500) 
    command('macro:run', macroId)
  }
  const homing = () => {
    MessageBox("Homing....",1500)
    command('homing')
  }
  const unlock = () => {
    command('unlock')
  }
  const hold = () => {
    command('feedhold')
  }
  const unhold = () => {
    command('cyclestart')
  }
  const fullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  const fileDetails = (path, file) => {
    store.ui.fileDetailsPath = path
    store.ui.fileDetails = file

    navigate('fileDetails')
  }

  const previousFolder = () => {
    store.fileList.previousFolder()
  }

  const loadFolder = (path) => {
    store.fileList.loadFolder(path)
  }

  const refreshWatchFolder = async () => {
    await store.fileList.loadFiles()
    navigate('gcodeList')
  }

  const toggleFeedrateInterval = () => {
    store.ui.toggleFeedrateInterval()
  }
  const increaseFeedrate = () => {
    command('feedOverride', store.ui.feedrateInterval)
  }
  const decreaseFeedrate = () => {
    command('feedOverride', -store.ui.feedrateInterval)
  }
  const resetFeedrate = () => {
    command('feedOverride', 0)
  }

  const toggleSpindleInterval = () => {
    store.ui.toggleSpindleInterval()
  }
  const increaseSpindle = () => {
    command('spindleOverride', store.ui.spindleInterval)
  }
  const decreaseSpindle = () => {
    command('spindleOverride', -store.ui.spindleInterval)
  }
  const resetSpindle = () => {
    command('spindleOverride', 0)
  }
  const setRapids = (speed) => {
    if (['25', '50', '100'].includes(speed)) {
      command('rapidOverride', Number(speed))
    }
  }
  const brightness = (sign) => {
    if (sign === '-') {
      store.ui.decreaseBrightness()
    } else {
      store.ui.increaseBrightness()
    }
  }

  const loadFile = (path) => {
    store.gcode.setLoaded(path, null)
    command('watchdir:load', path)
  }
  const loadDetailFile = () => {
    if (!store.ui.fileDetailsPath) {
      return
    }
    loadFile(store.ui.fileDetailsPath)
  }
  const fileListScrollUp = () => {
    store.fileList.scrollUp()
  }

  const fileListScrollDown = () => {
    store.fileList.scrollDown()
  }

  const sortDetails = (sort) => {
    store.ui.fileDetailsSort = sort
  }

  const goto = (x, y, z, a, b, c) => {
    const limits = store.cnc.axisLimits

    const move = Object.entries({ x, y, z, a, b, c })
      .map(([axis, position]) => {
        if (position?.endsWith('%')) {
          if (limits[axis]) {
            const absPosition = parseFloat(position) * -0.01 * limits[axis]
            return `${axis}${absPosition.toFixed(5)}`
          }
        } else if (position != null) {
          return `${axis}${position}`
        }
      })
      .filter(Boolean)
      .join(' ')

    actionBus.emit('absolutePosition', move)
  }
  const startFeed = () => {
    command('feeder:start')
  }
  const stopFeed = () => {
    command('feeder:stop')
  }
  const setUserFlag = (id, value) => {
    store.ui.setUserFlag(id, value)
  }
  const clearUserFlag = (id, value) => {
    store.ui.clearUserFlag(id, value)
  }
  const toggleUserFlag = (id) => {
    store.ui.setUserFlag(id, !store.ui.userFlags[id])
  }

  const actionTypes = {}

  const actions = {
    backScene,
    brightness,
    clearGcode,
    clearUserFlag,
    command: userCommand,
    completeInput,
    completeClickMove,
    SaveProbeZPosition,
    connect,
    decreaseFeedrate,
    decreaseSpindle,
    enterPosition,
    enterWcs,
    enterToolDiameter,
    clickMoveTo,
    MessageBox,
    ConfirmBox,
    enterStepXY,
    enterStepZ,
    fileDetails,
    loadDetailFile,
    fileListScrollDown,
    fileListScrollUp,
    fullscreen,
    gcode,
    goto,
    hold,
    homing,
    increaseFeedrate,
    increaseSpindle,
    input,
    inputCommand,
    jog,
    jogDistance,
    jogDistanceZ,
    jogSpeed,
    loadFile,
    loadFolder,
    macro,
    navigate,
    pause,
    previousFolder,
    refreshWatchFolder,
    reset,
    resetFeedrate,
    resetSpindle,
    run,
    setRapids,
    setUserFlag,
    sortDetails,
    startFeed,
    startSmoothJog,
    stop,
    stopFeed,
    stopSmoothJog,
    swapScene,
    toggleFeedrateInterval,
    toggleSpindleInterval,
    toggleUserFlag,
    unhold,
    unlock,
  }

  const ensureHandler = (cfg) => {
    if (!cfg) {
      return
    }
    const smoothJog = cfg.filter((action) => {
      return action?.action === 'startSmoothJog'
    })
    if (smoothJog.length > 0) {
      return smoothJog.map((action) => {
        return {
          action: stopSmoothJog,
          arguments: action.arguments,
        }
      })
    }
  }

  const enabled = (cfg) =>
    store.cnc.ready ||
    !cfg?.every((action) => machineCommands.has(action.action)) ||
    (store.cnc.running &&
      cfg?.some((action) => runningCommands.has(action.action))) ||
    (store.cnc.alarm && cfg?.some((action) => alarmCommands.has(action.action)))

  const getCallback = (cfg) => {
    return cfg.action && actions[cfg.action]
  }

  const getHandlers = (cfg) => {
    if (!cfg) {
      return {}
    }
    return cfg.reduce((grouped, action) => {
      const callback = getCallback(action)
      if (!callback) {
        return grouped
      }
      const event = action.event ?? 'down'
      grouped[event] ??= []
      grouped[event].push({
        action: callback,
        type: actionTypes[action.action],
        arguments: action.arguments,
      })
      return grouped
    }, {})
  }
  return {
    getHandlers,
    ensureHandler,
    enabled,
  }
}

export const gogcode = (gcode) =>
{
  
 this.gcode(gcode) 
}