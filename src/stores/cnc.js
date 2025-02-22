import { defineStore } from 'pinia'
// TODO: Take speeds and distances from config
const jogDistances = {
    mm: [0.01, 0.1, 1,5, 10, 20, 50, 100,200],
  in: [0.001, 0.01, 0.1, 1, 5, 10, 20],
}
const jogDistancesZ = {
  mm: [0.01, 0.1, 1,5, 10, 20, 50, 100,200],
  in: [0.001, 0.01, 0.1, 1, 5, 10, 20],
}
const jogSpeeds = {
  mm: [500, 2500, 5000],
  in: [15, 75, 150],
}

const changeListPosition = (item, list, fallback, offset = 1) => {
  const index = list.indexOf(item)
  if (index === -1) {
    return fallback
  }
  return list[Math.min(list.length - 1, Math.max(0, index + offset))]
}
const listIncrease = (item, list, fallback) =>
  changeListPosition(item, list, fallback, 1)

const listDecrease = (item, list, fallback) =>
  changeListPosition(item, list, fallback, -1)

const axisOrder = ['x', 'y', 'z', 'a', 'b', 'c']

export const cncStates = {
  IDLE: 'Idle',
  HOLD: 'Hold',
  ALARM: 'Alarm',
  JOG: 'Jog',
  RUNNING: 'Run',
  HOMING: 'Home',
}
export const workflowStates = {
  IDLE: 'idle',
  PAUSE: 'paused',
  RUNNING: 'running',
}
export const feederStates = {
  IDLE: 'idle',
  PAUSE: 'paused',
}

const formatDuration = (seconds) => {
  return new Date(seconds * 1000).toISOString().substring(11, 19)
}
const formatDimensions =(axes,maxaxis) =>
axes
    .map((axis) => {
      var adddim=""
      if (maxaxis && maxaxis["z"])
      {
        adddim=" ("+maxaxis[axis].substring(0,6)+")"
      }
      return `${axis.toUpperCase()}:${adddim.padStart(8, ' ')}`
    })
    .join('\n')

const formatAxes = (position, axes,maxaxis = null) =>
  axes
    .map((axis) => {
      var adddim=""
      if (maxaxis && maxaxis["z"])
      {
        adddim=" ("+maxaxis[axis].substring(0,6)+")"
      }
      return `${axis.toUpperCase()}:${position[axis].padStart(8, ' ')}${adddim.padStart(8, ' ')}`
    })
    .join('\n')

const pauseText = (reason, message) => {
  if (reason === 'M0' || reason === 'M1') {
    return message
  }

  if (reason !== 'M6') {
    return
  }
  const messages = ['Tool change']
  if (message && message !== 'M6') {
    messages.push(message.replace(/^M6 \((.*)\)$/, '$1'))
  }
  return messages.join('\n')
}


export const useCncStore = defineStore({
  id: 'cnc',
  state: () => ({
    connected: false,
    connecting: false,
    token: null,
    runState: cncStates.IDLE,
    workflowState: workflowStates.IDLE,
    feederState: feederStates.IDLE,
    locked: false,
    client: null,
    macros: null,
    commands: null,
    elapsedTime: null,
    remainingTime: null,
    

    alarmReason: '',
    pauseReason: '',
    pauseMessage: '',
    errorMessage: '',
    
    feedPauseReason: '',
    feedPauseMessage: '',
    jogDistance: 10,
    jogSpeed: 2500,
    jogDistanceZ: 10,
    machineSize: {'x':100,'y':100},
    machineRegion: {},
    settings: {},
    overrides: {
      feed: 100,
      spindle: 100,
      rapid: 100,
    },
       tooldiameter:0,
    wpos: {
      x: '0.000',
      y: '0.000',
      z: '0.000',
      a: '0.000',
      b: '0.000',
      c: '0.000',
    },
    mpos: {
      x: '0.000',
      y: '0.000',
      z: '0.000',
      a: '0.000',
      b: '0.000',
      c: '0.000',
    },
    modal: {
      distance: 'G90',
      units: 'G21',
      wcs: 'G54',
    },
    axes: ['x', 'y', 'z', 'a', 'b', 'c'],
    probeposition:false,
    activeCommands: {},
  }),

  actions: {
    setClient(client) {
      this.client = client
      this.loadMacros()
    },
    setConnected(connected) {
      this.connected = connected
      this.connecting = false
    },
    setConnecting(connecting = true) {
      this.connecting = connecting
    },
    setToken(token) {
      this.token = token
      
    },
    setElapsedTime(time) {
      this.elapsedTime = time
    },
    setRemainingTime(time) {
      this.remainingTime = time
    },
    setRunState(state) {
      if (Object.values(cncStates).includes(state)) {
        this.runState = state
        if (state !== cncStates.ALARM) {
          this.locked = false
        }
      } else if (state) {
        console.error('Unrecognized run state', state)
      }
    },
    setWorkflowState(state) {
      if (Object.values(workflowStates).includes(state)) {
        this.workflowState = state
        if (state !== workflowStates.PAUSE) {
          this.clearPause()
          this.clearError()
        }
      } else if (state) {
        console.error('Unrecognized workflow state', state)
      }
    },
    setFeedHold(data, message) {
      this.feederState = feederStates.PAUSE
      this.feedPauseReason = data
      this.feedPauseMessage = message
    },
    clearFeedHold() {
      this.feederState = feederStates.IDLE
      this.feedPauseReason = null
      this.feedPauseMessage = null
    },
    setAxes(axes) {
      if (axes) {
        this.axes = Object.freeze(axes)
      }
    },
    setVersion(version) {
      this.version = version
    },

    setSettings(settings) {
      this.settings = settings
    },

    increaseJogDistance() {
      this.jogDistance = listIncrease(this.jogDistance, this.distances, 1)
    },

    decreaseJogDistance() {
      this.jogDistance = listDecrease(this.jogDistance, this.distances, 1)
    },
    increaseJogDistanceZ() {
      this.jogDistanceZ = listIncrease(this.jogDistanceZ, this.distancesZ, 1)
    },

    decreaseJogDistanceZ() {
      this.jogDistanceZ = listDecrease(this.jogDistanceZ, this.distancesZ, 1)
    },

    increaseJogSpeed() {
      this.jogSpeed = listIncrease(
        this.jogSpeed,
        this.speeds,
        this.speedFallback
      )
    },

    decreaseJogSpeed() {
      this.jogSpeed = listDecrease(
        this.jogSpeed,
        this.speeds,
        this.speedFallback
      )
    },
    setError(error) {
      this.errorMessage = error
    },
    clearError(error) {
      this.errorMessage = null
    },
    setPause(reason, message) {
      this.workflowState = workflowStates.PAUSE
      this.pauseReason = reason
      this.pauseMessage = message
    },
    clearPause() {
      this.pauseReason = null
      this.pauseMessage = null
    },
    setAlarm(reason = '') {
      this.runState = cncStates.ALARM
      this.alarmReason = reason
    },
    setLocked(val = true) {
      this.locked = val
    },
    setModal(modal) {
      Object.entries(modal).forEach(([key, value]) => {
        this.modal[key] = value
      })
      if (this.modal.units !== modal.units) {
        this.jogDistance = 1
        this.jogSpeed = this.speedFallback
      }
    },
    setMpos(mpos) {
      Object.entries(mpos).forEach(([key, value]) => {
        this.mpos[key] = value
      })
    },
    setWpos(wpos) {
      Object.entries(wpos).forEach(([key, value]) => {
        this.wpos[key] = value
      })
    },
    setOverrides(feed, rapid, spindle) {
      this.overrides = {
        feed,
        rapid,
        spindle,
      }
    },
    getLimitsXYZ() {
      return {'x':this.axisLimits['x'],'y':this.axisLimits['y'],'z':this.axisLimits['z']}
    },
    getMpos()
    {
      return {'x':this.mpos['x'],'y':this.mpos['y']}
    }
    ,    
    getWpos()
    {
      return {'x':this.wpos['x'],'y':this.wpos['y'],'z':this.wpos['z']}
    }
    ,    
    async loadMacros() {
      
      if (!this.client) {
        return
      }
     console.log("LOADMACROS....") 
     const macros = await this.client.fetch('macros')
      
      if (!macros) {
        return
      }
      this.macros = macros.records.reduce((lookup, macro) => {
        lookup[macro.name] = macro.id
        if (macro.name == 'probeposition') {
          this.probeposition=true
        }
        return lookup
      }, {})
    },
    checkisprobeposition() {
      this.loadMacros() //.then(result => { return this.probeposition}) 
    },
    addActiveCommand(commandId, taskId) {
      this.activeCommands[commandId] = taskId
    },
    clearActiveCommand(taskId) {
      Object.keys(this.activeCommands).forEach((key) => {
        if (this.activeCommands[key] === taskId) {
          delete this.activeCommands[key]
        }
      })
    },
    clearActiveCommands() {
      Object.keys(this.activeCommands).forEach((key) => {
        delete this.activeCommands[key]
      })
    },
    commandRunning(id) {
      return !!this.activeCommands[id]
    },
    async loadCommands() {
      if (!this.client) {
        return
      }
          
      
      const commands = await this.client.fetch('commands')
      if (!commands) {
        return
      }

      this.commands = commands.records.reduce((lookup, command) => {
        lookup[command.title] = command.id
        return lookup
      }, {})
    },
    async runCommand(id) {
      if (!this.client) {
        return
      }
      
      
      const { taskId } = await this.client.post(`commands/run/${id}`)
      if (!taskId) {
        return
      }
      this.addActiveCommand(id, taskId)
    },
    async getMacroId(macroName) {
      if (!this.macros || !this.macros?.[macroName]) {
        await this.loadMacros()
      }
      console.log("---->",this.macros?.[macroName])
      return this.macros?.[macroName]
    },
    async deleteMacroId(macroId) {
      const { taskId } = await this.client.mydelete(`macros/${macroId}`)
      return macroId
      
    },
    async SaveProbeZPosition(position) {
      const myupdate = await this.client.mypost('macros',{"content":position,"name":"probeposition"}).then(result => { this.loadMacros()}) 
    },
    async getCommandId(commandName) {
      if (!this.commands) {
        await this.loadCommands()
      }
      return this.commands?.[commandName]
    },
  },
  getters: {
    isRelativeMove: (state) => state.modal.distance === 'G91',
    distanceUnit: (state) => (state.modal.units === 'G21' ? 'mm' : 'in'),
    distances: (state) => jogDistances[state.distanceUnit],
    distancesZ: (state) => jogDistancesZ[state.distanceUnit],
    speeds: (state) => jogSpeeds[state.distanceUnit],
    speedFallback: (state) => (state.distanceUnit === 'mm' ? 500 : 75),
    hold: (state) => state.runState === cncStates.HOLD,
    paused: (state) =>
      state.workflowState === workflowStates.PAUSE ||
      state.feederState === feederStates.PAUSE,
    feedPaused: (state) => state.feederState === feederStates.PAUSE,
    idle: (state) =>
      state.workflowState === workflowStates.IDLE &&
      state.feederState === feederStates.IDLE,
    running: (state) =>
      state.workflowState === workflowStates.RUNNING &&
      state.feederState === feederStates.IDLE,
    alarm: (state) => state.runState === cncStates.ALARM,    
    isprobepositionxy: (actions) => actions.checkisprobeposition(),
    isprobeposition: (state) => state.probeposition,
    elapsedTimeText: (state) => {
      if (!state.elapsedTime) {
        return ''
      }
      return formatDuration(state.elapsedTime)
    },
    displayWpos: (state) => formatAxes(state.wpos, state.axes),
    displayMpos: (state) => formatAxes(state.mpos, state.axes),
    displayMSize: (state) => formatDimensions( state.axes,state.axisLimits),
    machineSize: (state) => ('X :'+state.axisLimits['x']+"\nY :"+state.axisLimits['y']+"\nZ :"+state.axisLimits['z']),
    machineRegion: (state) => {} 
    ,
    remainingTimeText: (state) => {
      if (!state.remainingTime) {
        return ''
      }
      return formatDuration(state.remainingTime)
    },
    alarmText: (state) =>
      `${['Alarm', state.alarmReason, state.locked ? 'Locked' : null]
        .filter(Boolean)
        .join('\n')}`,
    pauseText: (state) => pauseText(state.pauseReason, state.pauseMessage),
    feedPauseText: (state) =>
      pauseText(state.feedPauseReason, state.feedPauseMessage),
    accelerations: (state) => {
      if (!state.settings) {
        return
      }
      return axisOrder
        .map((axis, i) => {
          return state.settings[`$${i + 121}`]
        })
        .filter((x) => x != null)
    },
    axisLimits: (state) => {
      if (!state.settings) {
        return {}
      }
      return axisOrder.reduce((limits, axis, i) => {
        limits[axis] = state.settings[`$${i + 130}`]
        return limits
      }, {})
    },

    ready: (state) =>
      state.connected &&
      state.feederState === feederStates.IDLE &&
      (state.runState === cncStates.IDLE || state.runState === cncStates.JOG),
  },
})
