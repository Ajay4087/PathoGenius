const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('pathogenius', {
  platform: process.platform,
})
