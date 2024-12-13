
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: async () => {
    try {
      return await ipcRenderer.invoke('dialog:openFile');
    } catch (error) {
      console.error('Error while opening file dialog:', error);
      return { canceled: true, filePaths: [] };
    }
  },
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  sendDetectedRoom: (roomName) => ipcRenderer.send('detectedRoom', roomName),
  invokeConvertFile: async (filePath) => {
    return await ipcRenderer.invoke('convertFile', filePath);
  },
  sendUserInput: (input) => {
    ipcRenderer.send('userInput', input);
  },
  sendDetectedRoom: (room) => ipcRenderer.send('detectedRoom', room),

  receive: (channel, listener) => {
    ipcRenderer.on(channel, (event, ...args) => listener(...args));
  },

  saveMapToFile: async (mapData) => {
    return await ipcRenderer.invoke('saveMapToFile', mapData);
  },

  // Expose the loadMapFromFile function
  loadMapFromFile: async () => {
    return await ipcRenderer.invoke('loadMapFromFile');
  },

  // Trigger Python-based room detection (communicates with main process)
  runPythonRoomDetection: (gameText, userCommand) => {
    return ipcRenderer.invoke('runPythonRoomDetection', gameText, userCommand);
  }

  
});

