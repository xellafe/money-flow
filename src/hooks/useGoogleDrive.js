import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook per gestire la sincronizzazione con Google Drive
 * Funziona solo in ambiente Electron
 */
export function useGoogleDrive() {
  const [isElectron, setIsElectron] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasDrivePermission, setHasDrivePermission] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [backupInfo, setBackupInfo] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | success | error
  const [error, setError] = useState(null);
  
  const syncTimeoutRef = useRef(null);

  // Aggiorna info utente
  const refreshUserInfo = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return;
    
    try {
      const result = await window.electronAPI.googleDrive.getUserInfo();
      if (result.success && result.userInfo) {
        setUserInfo(result.userInfo);
      }
    } catch (err) {
      console.error('Errore recupero info utente:', err);
    }
  }, []);

  // Aggiorna info backup
  const refreshBackupInfo = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return;
    
    try {
      const result = await window.electronAPI.googleDrive.getBackupInfo();
      if (result.success) {
        setBackupInfo(result.info);
      }
    } catch (err) {
      console.error('Errore recupero info backup:', err);
    }
  }, []);

  // Verifica stato autenticazione
  const checkAuthStatus = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return;
    
    try {
      const authenticated = await window.electronAPI.googleDrive.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Verifica anche che abbia i permessi per Drive
        const hasPermission = await window.electronAPI.googleDrive.hasDrivePermission();
        setHasDrivePermission(hasPermission);
        
        await refreshUserInfo();
        await refreshBackupInfo();
      }
    } catch (err) {
      console.error('Errore verifica auth:', err);
      setIsAuthenticated(false);
    }
  }, [refreshUserInfo, refreshBackupInfo]);

  // Verifica se siamo in Electron
  useEffect(() => {
    const electronAvailable = typeof window !== 'undefined' && window.electronAPI?.isElectron;
    setIsElectron(electronAvailable);
    
    if (electronAvailable) {
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

  // Login
  const signIn = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return { success: false, error: 'Non disponibile' };
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await window.electronAPI.googleDrive.signIn();
      
      if (result.success) {
        setIsAuthenticated(true);
        await refreshUserInfo();
        await refreshBackupInfo();
      } else if (!result.cancelled) {
        // Mostra errore solo se non è stato annullato dall'utente
        setError(result.error);
      }
      // Se cancelled === true, l'utente ha semplicemente chiuso la finestra, non mostrare errori
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Errore durante il login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [refreshUserInfo, refreshBackupInfo]);

  // Annulla login in corso
  const cancelSignIn = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return;
    
    try {
      await window.electronAPI.googleDrive.cancelSignIn();
      setIsLoading(false);
    } catch (err) {
      console.error('Errore annullamento login:', err);
    }
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return { success: false, error: 'Non disponibile' };
    
    setIsLoading(true);
    
    try {
      const result = await window.electronAPI.googleDrive.signOut();
      
      if (result.success) {
        setIsAuthenticated(false);
        setUserInfo(null);
        setBackupInfo(null);
        setLastSyncTime(null);
      }
      
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upload backup
  const uploadBackup = useCallback(async (data) => {
    if (!window.electronAPI?.googleDrive) return { success: false, error: 'Non disponibile' };
    if (!isAuthenticated) return { success: false, error: 'Non autenticato' };
    
    setSyncStatus('syncing');
    setError(null);
    
    try {
      const result = await window.electronAPI.googleDrive.uploadBackup(data);
      
      if (result.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        await refreshBackupInfo();
        
        // Reset status dopo 3 secondi
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      setSyncStatus('error');
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [isAuthenticated, refreshBackupInfo]);

  // Download backup
  const downloadBackup = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return { success: false, error: 'Non disponibile' };
    if (!isAuthenticated) return { success: false, error: 'Non autenticato' };
    
    setSyncStatus('syncing');
    setError(null);
    
    try {
      const result = await window.electronAPI.googleDrive.downloadBackup();
      
      if (result.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => setSyncStatus('idle'), 3000);
      } else {
        setSyncStatus('error');
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      setSyncStatus('error');
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [isAuthenticated]);

  // Elimina backup
  const deleteBackup = useCallback(async () => {
    if (!window.electronAPI?.googleDrive) return { success: false, error: 'Non disponibile' };
    if (!isAuthenticated) return { success: false, error: 'Non autenticato' };
    
    try {
      const result = await window.electronAPI.googleDrive.deleteBackup();
      
      if (result.success) {
        setBackupInfo(null);
      }
      
      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [isAuthenticated]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Stato
    isElectron,
    isAuthenticated,
    hasDrivePermission,
    isLoading,
    userInfo,
    backupInfo,
    lastSyncTime,
    syncStatus,
    error,
    
    // Azioni
    signIn,
    cancelSignIn,
    signOut,
    uploadBackup,
    downloadBackup,
    deleteBackup,
    refreshBackupInfo,
    checkAuthStatus,
  };
}

export default useGoogleDrive;
