const path = require('path');
const fs = require('fs');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, dialog,globalShortcut } = require('electron');
const { spawn, exec } = require('child_process');

let mainWindow;
let width;
let height;

// Create the main window and handle Python execution
ipcMain.handle('runPythonRoomDetection', async (event, gameText, userCommand) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'room_detector.py');
    exec(`python "${scriptPath}" "${gameText}" "${userCommand}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing Python script: ${error}`);
        return reject(error);
      }
      resolve(stdout.trim() === 'True'); // Return true if room is detected
    });
  });
});


const template = [
  {
    label: 'View',
    submenu: [
      {
        role: 'toggledevtools'
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);


function createWindow() {
  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width, // all the width
    height,
    icon: path.join(__dirname, 'icons', 'marauder.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  mainWindow.maximize();
  mainWindow.loadFile('index.html');   

  mainWindow.on('closed', () => {
    mainWindow = null;   
  });

  Menu.setApplicationMenu(null);
}

app.on('ready', () => {
  ({ width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize); 
  createWindow(); 

    // Control+R to reload marauder, might be redundant..
    globalShortcut.register('Ctrl+R', () => {
      if (mainWindow) {
        mainWindow.reload(); 
      }
    });

});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Glulx,	Glulx/Blorb files', extensions: ['ulx','gblorb','blb','glb'] }
    ]
  });
  return { canceled, filePaths };
});

ipcMain.handle('convertFile', async (event, filePath) => {
  try {
    const pythonScriptPath = path.join(__dirname, 'game2js.py');
    const args = [pythonScriptPath, '--giload', filePath];

    const pythonProcess = spawn('python', args);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'game'));
        const fileName = path.basename(filePath, path.extname(filePath)) + '.js';
        const generatedFilePath = path.join(tempDir, fileName);
        fs.writeFileSync(generatedFilePath, stdout);

        mainWindow.webContents.send('file:converted', generatedFilePath);
      } else {
        console.error(`Conversion failed with code: ${code}, stderr: ${stderr}`);
        mainWindow.webContents.send('file:conversionError', stderr);
      }
    });
  } catch (error) {
    console.error('Error handling conversion:', error);
    mainWindow.webContents.send('file:conversionError', error.message);
  }
});
ipcMain.on('gameTitle', (event, title) => {
 // console.log('Game title received in main process:', title);
  mainWindow.webContents.send('gameTitle', title); // Send the title to renderer.js
});

ipcMain.on('userInput', (event, input) => {
  //console.log('Received user input in main.js:', input);
  mainWindow.webContents.send('userInput', input); 
});

ipcMain.on('detectedRoom', (event, room) => {
 // console.log('Detected room received in main.js:', room);
  mainWindow.webContents.send('detectedRoom', room); 
});

ipcMain.handle('saveMapToFile', async (event, mapData) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, mapData);
    return true; // Save successful
  }
  return false; // Save canceled
});

ipcMain.handle('loadMapFromFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (!canceled && filePaths.length > 0) {
    const mapData = fs.readFileSync(filePaths[0], 'utf-8');
    return mapData; // Return loaded map data
  }
  return null; // No file selected
});
