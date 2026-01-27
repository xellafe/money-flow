const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Disabilita la GPU cache per evitare errori di permessi su Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// Determina se siamo in development o production
const distPath = path.join(__dirname, '../dist/index.html');
const isDev = process.env.ELECTRON_DEV === 'true' || !fs.existsSync(distPath);

// Hot reload in development
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit',
      forceHardReset: true,
    });
  } catch (e) {
    console.log('electron-reload not available');
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'MoneyFlow',
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Mostra la finestra quando è pronta (evita flash bianco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    // In development, carica dal server Vite
    mainWindow.loadURL('http://localhost:5173');
    // Apri DevTools in development
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, carica i file buildati
    mainWindow.loadFile(distPath);
  }
}

// Quando Electron è pronto
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // Su macOS, ricrea la finestra se l'icona nel dock viene cliccata
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Chiudi l'app quando tutte le finestre sono chiuse (eccetto su macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
