import { defineStore } from 'pinia'
import { useCncStore } from '@/stores/cnc'
import Swal from 'sweetalert2'

export const useUiStore = defineStore({
  id: 'ui',

  state: () => ({
    active: true,
    activityTimeout: null,
    asleep: false,
    bgColor: 2,
    brightness: 60,
    columns: 5,
    font: 'monospace',
    fontSize: 12,
    lineHeight: 1.1,
    feedrateInterval: 1,
    spindleInterval: 1,
    fileDetailsPath: null,
    fileDetails: {},
    fileDetailsSort: 'alpha_asc',
    gcodeColors: {},
    gcodeLimit: 0,
    lineWidth:2,
    iconSize: 72,
    input: {
      value: '',
      previous: 0,
      type: '',
      callback: () => {},
    },
    clickMove :{
      value: '',
      gcode:null,
      callback: () => {},
    },
    pageColor: null,
    palette: ['#000', '#fff'],
    progressColor: 4,
    orientation: "ne",
    rows: 3,
    sceneStack: [],
    textColor: 1,
    textShadow: false,
    throttle: 0,
    timeout: 0,
    userFlags: {},
    web: true,
  }),

  getters: {
    
    sceneName: (state) => {
      return state.sceneStack[state.sceneStack.length - 1]
    },
    fileDetailSize: (state) => {
      if (!state.fileDetails) {
        return '0'
      }
      const size = state.fileDetails.size
      if (size > 1024) {
        const digits = size > 5120 ? 0 : 1
        return `${+(size / 1024).toFixed(digits)}K`
      } else {
        return `${size}`
      }
    },
    fileDetailModifiedTime: (state) => {
      if (!state.fileDetails) {
        return ''
      }
      return new Date(state.fileDetails.mtime).toLocaleString()
    },
    fileDetailCreatedTime: (state) => {
      if (!state.fileDetails) {
        return ''
      }
      return new Date(state.fileDetails.ctime).toLocaleString()
    },
    isWeb: () => !import.meta.env.SSR,
    displayBrightness: (state) => state.brightness,
    machineOrientation: (state) => state.orientation,
  },

  actions: {
    addInput(chars) {
      const inputTest = /^-?(0|[1-9]\d*)?(?:\.\d*)?$/
      // trim leading zeroes followed by non-zeroes
      const newValue = (this.input.value + chars).replace(/^0+(?=[1-9]|0)/, '')
      if (inputTest.test(newValue)) {
        this.input.value = newValue
      }
    },
    toggleInputSign() {
      if (this.input.value.startsWith('-')) {
        this.input.value = this.input.value.slice(1)
      } else {
        this.input.value = '-' + this.input.value
      }
    },
    startInput(value, type, scene = 'numpad', callback = () => {}) {
      this.input.value = ''
      this.input.previous = value
      this.input.type = type
      this.input.callback = callback
      this.goToScene(scene)
    },
    completeInput() {
      this.input.callback(this.input.value)
      this.input.value = ''
      this.goBack()
    },
    tellPos(event) {
    const ui = useUiStore()
    var rect = event.target.getBoundingClientRect();
    // if (this.sceneName=='MoveClic' && event.originalTarget.localName.toLowerCase().includes('canvas') && event.clientX>=rect.left && event.clientX<=rect.right && event.clientY>=rect.top && event.clientY<=rect.bottom)
    if (this.sceneName=='MoveClic' && event.target.localName.toLowerCase().includes('canvas') && event.clientX>=rect.left && event.clientX<=rect.right && event.clientY>=rect.top && event.clientY<=rect.bottom)
    {
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;      
      const machinesize=useCncStore().getLimitsXYZ()
      const machinesizeX=parseFloat(machinesize['x'])
      const machinesizeY=parseFloat(machinesize['y'])
      y=(y*(machinesizeY/rect.height)).toFixed(3)
      x=(x*(machinesizeX/rect.width)).toFixed(3)
      if (ui.orientation.toLowerCase().includes("e"))
      {
        x=-(machinesizeX-x).toFixed(3)     
        }
        
      if (ui.orientation.toLowerCase().includes("s"))
      {
        y=(machinesizeY-y).toFixed(3)
        }
        else {
          y=-y
        }
       
      let cmdgcode="G53 X"+x+" Y"+y
      this.clickMove.value = cmdgcode
      Swal.fire({  title: "Move To\nX:"+x+"\nY:"+y,  icon: 'info',  timer:1500,showConfirmButton:false, showCloseButton:false,backdrop:false,background:'#777',color:'#cc0'})
      this.clickMove.gcode(cmdgcode)

      }
    }  , 
    startClickMove(gcode, scene = 'MoveClic', callback = (tellPos) => {}) {
      this.clickMove.value = ''      
      this.clickMove.gcode=gcode
      this.clickMove.callback = callback
      this.goToScene(scene)
      window.addEventListener('click', this.tellPos, false);
    },
    completeClickMove() {
      //this.clickMove.callback(this.clickMove.value)
      this.clickMove.value = ''
      this.goBack()
    },
    toggleFeedrateInterval() {
      this.feedrateInterval = this.feedrateInterval === 1 ? 10 : 1
    },
    toggleSpindleInterval() {
      this.spindleInterval = this.spindleInterval === 1 ? 10 : 1
    },
    setGrid(rows, columns) {
      this.columns = columns
      this.rows = rows
    },
    setBgColor(color) {
      this.bgColor = color
    },
    clearUserFlag(id) {
      delete this.userFlags[id]
    },
    setBrightness(brightness) {
      if (brightness != null) {
        this.brightness = Math.max(Math.min(100, brightness), 10)
      }
    },
    setIconSize(size) {
      this.iconSize = size
    },
    setGcodeColors(colors) {
      if (!colors) {
        return
      }
      this.gcodeColors = Object.freeze(colors)
    },
    setLineWidth(lineWidth) {
      if (!lineWidth) {
        return
      }
      this.lineWidth = lineWidth
    },
    activity() {
      this.active = true
      clearTimeout(this.activityTimeout)
      this.activityTimeout = setTimeout(this.inactive.bind(this), this.timeout)
    },
    inactive() {
      this.active = false
    },
    decreaseBrightness() {
      this.setBrightness(this.brightness - 10)
    },
    increaseBrightness() {
      this.setBrightness(this.brightness + 10)
    },
    setGcodeLimit(limit) {
      this.gcodeLimit = limit
    },
    setTimeout(timeout) {
      this.timeout = timeout
    },
    setWeb(web) {
      this.web = !!web
    },
    setUserFlag(id, value) {
      this.userFlags[id] = value
    },
    setProgressColor(color) {
      this.progressColor = color
    },
    setOrientation(orientation) {
      if (orientation !=null) {
        orientation=orientation.toLowerCase()
        if (orientation.includes('ne') || orientation.includes('nw') || orientation.includes('se') || orientation.includes('sw'))
        {
          this.orientation = orientation.toLowerCase()
        }
    }
    },
    setPalette(colors) {
      this.palette = colors
    },
    setThrottle(throttle) {
      if (throttle != null) {
        const millis = parseInt(throttle)
        if (millis) {
          this.throttle = millis
        }
      }
    },
    setScene(scene) {
      this.sceneStack.splice(0)
      this.sceneStack.push(scene)
    },
    swapScene(scene) {
      this.sceneStack.splice(this.sceneStack.length - 1, 1, scene)
    },
    goToScene(scene) {
      if (this.sceneName !== scene) {
        this.sceneStack.push(scene)
      }
    },

    goBack(count = 1) {
      if (this.sceneStack.length > 1) {
        this.sceneStack.splice(-count, count)
      }
    },
  },
})
