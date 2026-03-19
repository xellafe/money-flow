import { useState, useRef } from 'react';
import { Cloud, CloudOff, Upload, Download, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ModalShell } from '../ui';
import GoogleSignInButton from '../GoogleSignInButton';

/**
 * Modal per le impostazioni di sincronizzazione Google Drive
 */
export default function SyncSettings({
  isAuthenticated,
  hasDrivePermission = true,
  isLoading,
  userInfo,
  backupInfo,
  lastSyncTime,
  syncStatus,
  error,
  onSignIn,
  onCancelSignIn,
  onSignOut,
  onUpload,
  onDownload,
  onDelete,
  onClose,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null); // 'upload' | 'download' | 'delete' | null
  const isProcessingRef = useRef(false); // Protezione anti-spam immediata

  const handleUpload = async () => {
    // Blocca immediatamente click multipli
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setCurrentOperation('upload');
    try {
      await onUpload();
    } finally {
      setCurrentOperation(null);
      isProcessingRef.current = false;
    }
  };

  const handleDownload = async () => {
    // Blocca immediatamente click multipli
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setCurrentOperation('download');
    try {
      await onDownload();
    } finally {
      setCurrentOperation(null);
      isProcessingRef.current = false;
    }
  };

  const handleDelete = async () => {
    // Blocca immediatamente click multipli
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    setCurrentOperation('delete');
    try {
      await onDelete();
      setConfirmDelete(false);
    } finally {
      setCurrentOperation(null);
      isProcessingRef.current = false;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 size={16} className="animate-spin" />;
      case 'success':
        return <Check size={16} className="text-green-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <ModalShell title="Sincronizzazione Drive" onClose={onClose} size="lg">
      {/* Stato connessione */}
      {isAuthenticated ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
          <div className="flex items-center gap-3">
            <Cloud size={20} className="text-green-700 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-green-800">Connesso a Google Drive</div>
              {userInfo && (
                <div className="text-sm text-green-700">{userInfo.email}</div>
              )}
            </div>
            <button
              onClick={onSignOut}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
            >
              Disconnetti
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 size={20} className="animate-spin" />
                <span>In attesa di autenticazione...</span>
              </div>
              <p className="text-sm text-gray-500 text-center">Completa l&apos;accesso nel browser</p>
              <button
                onClick={onCancelSignIn}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Annulla
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-gray-500">
                <CloudOff size={20} />
                <span>Non connesso</span>
              </div>
              <GoogleSignInButton onClick={onSignIn} disabled={isLoading} isLoading={isLoading} />
            </div>
          )}
        </div>
      )}

      {/* Warning permessi mancanti */}
      {isAuthenticated && !hasDrivePermission && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-900 mb-1">Permessi mancanti</div>
            <div className="text-sm text-amber-700">
              Non hai concesso i permessi per Google Drive. Disconnettiti e rifai il login, assicurandoti di selezionare <strong>tutti i permessi richiesti</strong>.
            </div>
          </div>
        </div>
      )}

      {/* Sezione azioni (solo se autenticato) */}
      {isAuthenticated && (
        <>
          {/* Info backup */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Backup su Drive
            </h4>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              {backupInfo ? (
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ultimo salvataggio:</span>
                    <span className="text-gray-800">{formatDate(backupInfo.modifiedTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensione:</span>
                    <span className="text-gray-800">{formatSize(backupInfo.size)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center">Nessun backup presente su Drive</div>
              )}
            </div>
          </div>

          {/* Azioni sync */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Azioni
            </h4>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpload}
                disabled={currentOperation !== null}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {currentOperation === 'upload' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Salvataggio in corso...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Salva su Drive
                  </>
                )}
              </button>

              {backupInfo && (
                <button
                  onClick={handleDownload}
                  disabled={currentOperation !== null}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {currentOperation === 'download' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Ripristino in corso...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Ripristina da Drive
                    </>
                  )}
                </button>
              )}

              {backupInfo && (
                confirmDelete ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm mb-3">
                      Sei sicuro di voler eliminare il backup da Google Drive?
                    </p>
                    <div className="flex gap-3">
                      {currentOperation !== 'delete' && (
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        >
                          Annulla
                        </button>
                      )}
                      <button
                        onClick={handleDelete}
                        disabled={currentOperation === 'delete'}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {currentOperation === 'delete' ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Eliminazione in corso...
                          </>
                        ) : (
                          'Conferma eliminazione'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={currentOperation !== null}
                    className="bg-gray-100 hover:bg-gray-200 text-red-600 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Elimina backup da Drive
                  </button>
                )
              )}
            </div>
          </div>

          {/* Stato sync - solo quando non in corso */}
          {currentOperation === null && (syncStatus === 'success' || syncStatus === 'error' || lastSyncTime) && (
            <div className={`flex items-center gap-2 text-sm justify-center ${
              syncStatus === 'success' ? 'text-green-600' :
              syncStatus === 'error' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {getSyncStatusIcon()}
              {syncStatus === 'success' && 'Sincronizzazione completata!'}
              {syncStatus === 'error' && `Errore: ${error}`}
              {syncStatus === 'idle' && lastSyncTime && `Ultima sync: ${formatDate(lastSyncTime)}`}
            </div>
          )}
        </>
      )}

      {/* Messaggio per web */}
      {!window.electronAPI?.isElectron && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center text-sm text-amber-800">
          <AlertCircle size={20} className="mx-auto mb-2" />
          <div>La sincronizzazione con Google Drive è disponibile solo nella versione desktop.</div>
        </div>
      )}
    </ModalShell>
  );
}
