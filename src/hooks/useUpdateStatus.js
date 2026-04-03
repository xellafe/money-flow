import { useState, useEffect, useCallback } from 'react';

/**
 * Central hook for auto-update state management.
 * Subscribes to all IPC updater events and provides unified state.
 *
 * Status values: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error'
 */
export function useUpdateStatus() {
  const [status, setStatus] = useState('idle');
  const [version, setVersion] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [appVersion, setAppVersion] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Fetch app version once on mount — optional chaining guards non-Electron environments
  useEffect(() => {
    window.electronAPI?.getAppVersion?.()?.then(setAppVersion);
  }, []);

  // Subscribe to all 5 IPC events — combined cleanup
  useEffect(() => {
    const cleanups = [
      window.electronAPI.updater.onUpdateAvailable((info) => {
        setStatus('available');
        setVersion(info?.version ?? null);
        setIsDismissed(false); // Reset dismiss so new version shows banner
        // D-01: auto-start download — no user action required
        window.electronAPI.updater.startDownload().catch((err) => {
          setStatus('error');
          setError(err?.message ?? 'Download non avviato');
        });
      }),
      window.electronAPI.updater.onDownloadProgress((prog) => {
        setStatus('downloading');
        // prog is { percent, bytesPerSecond, transferred, total }
        setProgress(Math.round(prog.percent));
      }),
      window.electronAPI.updater.onUpdateDownloaded(() => {
        setStatus('ready');
      }),
      window.electronAPI.updater.onUpdateNotAvailable(() => {
        setStatus('up-to-date');
      }),
      window.electronAPI.updater.onUpdateError((message) => {
        setStatus('error');
        setError(message);
      }),
    ];
    return () => cleanups.forEach(fn => fn());
  }, []);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');
    setError(null);
    setVersion(null);
    setProgress(0);
    try {
      await window.electronAPI.updater.checkForUpdates();
      // Result handled by event listeners above
    } catch (err) {
      setStatus('error');
      setError(err?.message ?? 'Errore sconosciuto');
    }
  }, []);

  const installUpdate = useCallback(() => {
    setIsInstalling(true);
    window.electronAPI.updater.installUpdate();
  }, []);

  const dismissBanner = useCallback(() => {
    // D-06: Does NOT change status — Settings still shows 'ready' state
    setIsDismissed(true);
  }, []);

  return {
    status,
    version,
    progress,
    error,
    appVersion,
    isDismissed,
    isInstalling,
    checkForUpdates,
    installUpdate,
    dismissBanner,
  };
}
