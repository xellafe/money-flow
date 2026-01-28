import { useState, useRef } from 'react';
import { X, Cloud, CloudOff, RefreshCw, Upload, Download, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import GoogleSignInButton from '../GoogleSignInButton';

/**
 * Modal per le impostazioni di sincronizzazione Google Drive
 */
export default function SyncSettings({
  isAuthenticated,
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
        return <Loader2 size={16} className="spin" />;
      case 'success':
        return <Check size={16} style={{ color: 'var(--color-success)' }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: 'var(--color-danger)' }} />;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Cloud size={24} /> Sincronizzazione Cloud
          </h2>
          <button className="modal-close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Stato connessione */}
          <div className="sync-status-section" style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            backgroundColor: isAuthenticated ? 'var(--color-success-bg, #ecfdf5)' : 'var(--color-gray-100, #f3f4f6)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
              {isAuthenticated ? (
                <>
                  <Cloud size={20} style={{ color: 'var(--color-success, #10b981)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>Connesso a Google Drive</div>
                    {userInfo && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                        {userInfo.email}
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={onSignOut}
                    disabled={isLoading}
                    style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    Disconnetti
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '0.5rem 0', width: '100%' }}>
                  {isLoading ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gray-600)' }}>
                        <Loader2 size={20} className="spin" />
                        <span>In attesa di autenticazione...</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-500)', textAlign: 'center', margin: 0 }}>
                        Completa l'accesso nel browser
                      </p>
                      <button 
                        className="btn-secondary"
                        onClick={onCancelSignIn}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Annulla
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gray-500)' }}>
                        <CloudOff size={20} />
                        <span>Non connesso</span>
                      </div>
                      <GoogleSignInButton 
                        onClick={onSignIn}
                        disabled={isLoading}
                        isLoading={isLoading}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sezione azioni (solo se autenticato) */}
          {isAuthenticated && (
            <>
              {/* Info backup */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-gray-600)', textTransform: 'uppercase' }}>
                  Backup su Drive
                </h4>
                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--color-gray-200)',
                  backgroundColor: 'var(--color-gray-50)'
                }}>
                  {backupInfo ? (
                    <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-gray-500)' }}>Ultimo salvataggio:</span>
                        <span>{formatDate(backupInfo.modifiedTime)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-gray-500)' }}>Dimensione:</span>
                        <span>{formatSize(backupInfo.size)}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', textAlign: 'center' }}>
                      Nessun backup presente su Drive
                    </div>
                  )}
                </div>
              </div>

              {/* Azioni sync */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--color-gray-600)', textTransform: 'uppercase' }}>
                  Azioni
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={handleUpload}
                    disabled={currentOperation !== null}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.75rem' }}
                  >
                    {currentOperation === 'upload' ? (
                      <>
                        <Loader2 size={16} className="spin" />
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
                      className="btn-secondary" 
                      onClick={handleDownload}
                      disabled={currentOperation !== null}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.75rem' }}
                    >
                      {currentOperation === 'download' ? (
                        <>
                          <Loader2 size={16} className="spin" />
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
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn-danger" 
                          onClick={handleDelete}
                          disabled={currentOperation === 'delete'}
                          style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
                        >
                          {currentOperation === 'delete' ? (
                            <>
                              <Loader2 size={16} className="spin" />
                              Eliminazione in corso...
                            </>
                          ) : (
                            'Conferma eliminazione'
                          )}
                        </button>
                        {currentOperation !== 'delete' && (
                          <button 
                            className="btn-secondary" 
                            onClick={() => setConfirmDelete(false)}
                            style={{ padding: '0.75rem' }}
                          >
                            Annulla
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        className="btn-secondary" 
                        onClick={() => setConfirmDelete(true)}
                        disabled={currentOperation !== null}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', padding: '0.75rem', color: 'var(--color-danger)' }}
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
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  fontSize: '0.875rem',
                  color: syncStatus === 'success' ? 'var(--color-success, #10b981)' : syncStatus === 'error' ? 'var(--color-danger, #dc2626)' : 'var(--color-gray-500)',
                  justifyContent: 'center'
                }}>
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
            <div style={{ 
              padding: '1rem', 
              borderRadius: '8px', 
              backgroundColor: 'var(--color-warning-bg, #fffbeb)',
              color: 'var(--color-warning-text, #92400e)',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              <AlertCircle size={20} style={{ marginBottom: '0.5rem' }} />
              <div>La sincronizzazione con Google Drive è disponibile solo nella versione desktop.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
