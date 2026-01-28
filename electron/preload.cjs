/**
 * Preload script per esporre API sicure al renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Google Drive
  googleDrive: {
    isAuthenticated: () => ipcRenderer.invoke('google-drive:is-authenticated'),
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
    ipcRenderer.on('request-backup-data', () => callback());
  },
  sendBackupDataForClose: (data) => {
    ipcRenderer.send('backup-data-for-close', data);
  },
  
  // Utility per sapere se siamo in Electron
  isElectron: true,
});
