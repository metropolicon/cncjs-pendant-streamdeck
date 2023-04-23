import { defineStore } from 'pinia'

export const useFileListStore = defineStore({
  id: 'file-list',
  state: () => ({
    rowOffset: 0,
    path: null,
    files: [],
    loaded: false,
    client: null,
  }),
  actions: {
    setClient(client) {
      this.client = client
    },
    scrollUp() {
      this.rowOffset = Math.max(0, this.rowOffset - 1)
    },
    scrollDown() {
      this.rowOffset += 1
    },
    previousFolder() {
      this.files = []
      this.path = this.path.split('/').slice(0, -1).join('/')
      this.loadFiles(this.path)
    },
    loadFolder(folder = null) {
      this.files = []
      this.path = [this.path, folder].filter(Boolean).join('/')
      this.loadFiles(this.path)
    },
    async loadFiles(path = '') {
      if (!this.client) {
        return
      }
      
      

      const fileList = await this.client.fetch('watch/files', { path })
      if (fileList) {
        this.rowOffset = 0
        //this.files = []
        var tfl=this.files.length
        var ffl=fileList.files.length
        
          this.loaded = true
          this.path = fileList.path
          this.files = fileList.files
          console.log("update files :",this.files.length,this.files)
        
      }
    },
  },
})
