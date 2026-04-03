/**
 * Preload script per esporre API sicure al renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Google Drive
  googleDrive: {
    isAuthenticated: () => ipcRenderer.invoke('google-drive:is-authenticated'),
    hasDrivePermission: () => ipcRenderer.invoke('google-drive:has-drive-permission'),
    isSigningIn: () => ipcRenderer.invoke('google-drive:is-signing-in'),
    signIn: () => ipcRenderer.invoke('google-drive:sign-in'),
    cancelSignIn: () => ipcRenderer.invoke('google-drive:cancel-sign-in'),
    signOut: () => ipcRenderer.invoke('google-drive:sign-out'),
    uploadBackup: (data) => ipcRenderer.invoke('google-drive:upload-backup', data),
    downloadBackup: () => ipcRenderer.invoke('google-drive:download-backup'),
    getBackupInfo: () => ipcRenderer.invoke('google-drive:get-backup-info'),
    deleteBackup: () => ipcRenderer.invoke('google-drive:delete-backup'),
    getUserInfo: () => ipcRenderer.invoke('google-drive:get-user-info'),
  },
  
  // Backup automatico alla chiusura
  onRequestBackupData: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('request-backup-data', handler);
    // Ritorna funzione per rimuovere il listener
    return () => ipcRenderer.removeListener('request-backup-data', handler);
  },
  sendBackupDataForClose: (data) => {
    ipcRenderer.send('backup-data-for-close', data);
  },
  
  // Auto-updater bridge (D-09, D-10, D-11)
  updater: {
    // Invoke methods (renderer → main, awaited)
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    startDownload: () => ipcRenderer.invoke('updater:start-download'),
    installUpdate: () => ipcRenderer.invoke('updater:install-update'),

    // Listener methods — each returns a cleanup function (D-11)
    onUpdateAvailable: (cb) => {
      const handler = (_, info) => cb(info);
      ipcRenderer.on('updater:update-available', handler);
      return () => ipcRenderer.removeListener('updater:update-available', handler);
    },
    onUpdateNotAvailable: (cb) => {
      const handler = (_, info) => cb(info);
      ipcRenderer.on('updater:update-not-available', handler);
      return () => ipcRenderer.removeListener('updater:update-not-available', handler);
    },
    onDownloadProgress: (cb) => {
      const handler = (_, progress) => cb(progress);
      ipcRenderer.on('updater:download-progress', handler);
      return () => ipcRenderer.removeListener('updater:download-progress', handler);
    },
    onUpdateDownloaded: (cb) => {
      const handler = (_, info) => cb(info);
      ipcRenderer.on('updater:update-downloaded', handler);
      return () => ipcRenderer.removeListener('updater:update-downloaded', handler);
    },
    onUpdateError: (cb) => {
      const handler = (_, message) => cb(message);
      ipcRenderer.on('updater:error', handler);
      return () => ipcRenderer.removeListener('updater:error', handler);
    },
  },
  
  // Utility per sapere se siamo in Electron
  isElectron: true,

  // App version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
