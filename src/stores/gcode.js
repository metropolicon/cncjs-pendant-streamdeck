import { defineStore } from 'pinia'
import { useCncStore } from './cnc'
const lazyStore = {
  get cnc() {
    delete this.cnc
    return (this.cnc = useCncStore())
  },
}
export const useGcodeStore = defineStore({
  id: 'gcode',
  state: () => ({
    name: null,
    shortname: null,
    gcode: null,
    geometry: null,
    startxy: {},
  }),
  getters: {
    dimensions() {
      // translate default size information to mm
      if (!this.geometry) {
        return
      }
      const unit = lazyStore.cnc.distanceUnit

      if (unit === 'in') {
        return this.geometry.size
      }

      const res = {}
      ;['min', 'max'].forEach((dimKey) => {
        res[dimKey] = Object.entries(this.geometry.size[dimKey]).reduce(
          (res, [k, v]) => {
            res[k] = v * 25.4
            return res
          },
          {}
        )
      })
      return Object.freeze(res)
    },
    displayRange() {
      if (!this.dimensions) {
        return
      }
      const res = {}
      ;['min', 'max'].forEach((dimKey) => {
        res[dimKey] = Object.entries(this.dimensions[dimKey]).reduce(
          (res, [k, v]) => {
            res[k] = v.toFixed(3)
            return res
          },
          {}
        )
      })
      return Object.freeze(res)
    },
    displayDimensions() {
      if (!this.dimensions) {
        return
      }
      const dimensions = {
        width: (this.dimensions.max.x - this.dimensions.min.x).toFixed(3),
        depth: (this.dimensions.max.y - this.dimensions.min.y).toFixed(3),
        height: Math.abs(this.dimensions.min.z).toFixed(3),
      }
      return Object.freeze(dimensions)
    },
    
  },
  actions: {
    unload() {
      this.$reset()
    },
    setLoaded(filename, code) {
      this.name = filename
      
      const pathArray = filename.split("/")
      const lastIndex = pathArray.length - 1
      this.shortname =pathArray[lastIndex]

      if (code !== this.gcode) {
        this.geometry = null
      }
      this.gcode = code
    },
    setGeometry(geometry) {
      this.geometry = Object.freeze(geometry)
    },
    getStartXY(startxy) {
      return this.startxy
    },
    setStartXY(startxy) {
      this.startxy=startxy
    }
  },
})
