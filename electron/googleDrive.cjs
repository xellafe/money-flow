/**
 * Servizio Google Drive per Electron
 * Gestisce autenticazione OAuth2 e operazioni su Drive
 */

const { google } = require('googleapis');
const { BrowserWindow, shell } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');

// Store per salvare i token in modo persistente
const store = new Store({
  name: 'google-auth',
  encryptionKey: 'moneyflow-secure-key-2026', // Chiave per cifrare i dati
});

// Carica le credenziali OAuth
const credentialsPath = path.join(__dirname, 'google-credentials.json');
let credentials = null;

try {
  credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
} catch (error) {
  console.error('Errore caricamento credenziali Google:', error);
}

// Configurazione OAuth2
const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
const OAUTH_PORT = 8095; // Porta per il callback OAuth
const REDIRECT_URI = `http://localhost:${OAUTH_PORT}/callback`;
const APP_FOLDER = 'appDataFolder'; // Cartella nascosta specifica per l'app
const BACKUP_FILENAME = 'moneyflow-backup.json';

let oauth2Client = null;

/**
 * Inizializza il client OAuth2
 */
function initializeOAuth() {
  if (!credentials) {
    throw new Error('Credenziali Google non trovate');
  }

  const { client_id, client_secret } = credentials.installed;
  
  oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  // Carica token salvati se esistono
  const savedTokens = store.get('tokens');
  if (savedTokens) {
    oauth2Client.setCredentials(savedTokens);
  }

  // Aggiorna i token quando vengono refreshati
  oauth2Client.on('tokens', (tokens) => {
    const currentTokens = store.get('tokens') || {};
    const newTokens = { ...currentTokens, ...tokens };
    store.set('tokens', newTokens);
  });

  return oauth2Client;
}

/**
 * Verifica se l'utente è autenticato (con token validi)
 */
function isAuthenticated() {
  const tokens = store.get('tokens');
  if (!tokens || !tokens.access_token) return false;
  
  // Se c'è un refresh_token, consideriamo l'utente autenticato
  // (il token può essere refreshato automaticamente)
  if (tokens.refresh_token) return true;
  
  // Altrimenti verifica se l'access_token è scaduto
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    return false;
  }
  
  return true;
}

/**
 * Ottiene l'URL per l'autenticazione OAuth
 */
function getAuthUrl() {
  if (!oauth2Client) initializeOAuth();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Forza la richiesta del refresh_token
  });
}

/**
 * Avvia il flusso di autenticazione OAuth con server HTTP locale
 * @returns {Promise<object>} Tokens di autenticazione
 */
let activeAuthServer = null;
let activeAuthCleanup = null;

async function signIn() {
  if (!oauth2Client) initializeOAuth();
  
  // Se c'è già un'autenticazione in corso, annullala
  if (activeAuthServer) {
    cancelSignIn();
  }

  return new Promise((resolve, reject) => {
    let server = null;
    let timeoutId = null;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (server) {
        server.close();
        server = null;
      }
      activeAuthServer = null;
      activeAuthCleanup = null;
    };

    // Crea server HTTP temporaneo per ricevere il callback
    server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${OAUTH_PORT}`);
        
        if (url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
                <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fef2f2;">
                  <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #dc2626;">❌ Errore</h1>
                    <p>Autenticazione fallita: ${error}</p>
                    <p style="color: #666;">Puoi chiudere questa finestra.</p>
                  </div>
                </body>
              </html>
            `);
            cleanup();
            reject(new Error(`Errore autenticazione: ${error}`));
            return;
          }

          if (code) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html>
                <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0fdf4;">
                  <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #16a34a;">✅ Autenticazione completata!</h1>
                    <p>MoneyFlow è ora connesso a Google Drive.</p>
                    <p style="color: #666;">Puoi chiudere questa finestra e tornare all'app.</p>
                  </div>
                </body>
              </html>
            `);

            // Scambia il codice per i token
            const { tokens } = await oauth2Client.getToken(code);
            oauth2Client.setCredentials(tokens);
            store.set('tokens', tokens);
            
            cleanup();
            resolve(tokens);
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fef2f2;">
              <div style="text-align: center; padding: 2rem;">
                <h1 style="color: #dc2626;">❌ Errore</h1>
                <p>${err.message}</p>
                <p style="color: #666;">Puoi chiudere questa finestra.</p>
              </div>
            </body>
          </html>
        `);
        cleanup();
        reject(err);
      }
    });

    server.on('error', (err) => {
      cleanup();
      reject(new Error(`Impossibile avviare il server OAuth: ${err.message}`));
    });

    server.listen(OAUTH_PORT, 'localhost', () => {
      // Salva riferimenti per poter annullare
      activeAuthServer = server;
      activeAuthCleanup = () => {
        cleanup();
        const error = new Error('Autenticazione annullata');
        error.code = 'AUTH_CANCELLED';
        reject(error);
      };
      
      // Genera l'URL di autenticazione
      const authUrl = getAuthUrl();
      
      // Apri il browser di sistema per l'autenticazione
      shell.openExternal(authUrl);
      
      // Timeout dopo 2 minuti - l'utente probabilmente ha chiuso la finestra
      timeoutId = setTimeout(() => {
        cleanup();
        const error = new Error('Autenticazione annullata o timeout');
        error.code = 'AUTH_CANCELLED';
        reject(error);
      }, 2 * 60 * 1000);
    });
  });
}

/**
 * Annulla l'autenticazione in corso
 */
function cancelSignIn() {
  if (activeAuthCleanup) {
    activeAuthCleanup();
  }
}

/**
 * Verifica se c'è un'autenticazione in corso
 */
function isSigningIn() {
  return activeAuthServer !== null;
}

/**
 * Effettua il logout e revoca i token
 */
async function signOut() {
  if (oauth2Client) {
    const tokens = store.get('tokens');
    if (tokens && tokens.access_token) {
      try {
        await oauth2Client.revokeToken(tokens.access_token);
      } catch (error) {
        console.error('Errore revoca token:', error);
      }
    }
    oauth2Client.setCredentials({});
  }
  store.delete('tokens');
}

/**
 * Ottiene il client Drive autenticato
 * @returns {object|null} Client Drive o null se non autenticato
 */
function getDriveClient() {
  if (!oauth2Client) initializeOAuth();
  
  const tokens = store.get('tokens');
  if (!tokens || !tokens.access_token) {
    return null;
  }
  
  oauth2Client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Cerca un file di backup esistente
 * @returns {Promise<object|null>} File trovato o null
 */
async function findBackupFile() {
  const drive = getDriveClient();
  if (!drive) return null;
  
  const response = await drive.files.list({
    spaces: APP_FOLDER,
    q: `name = '${BACKUP_FILENAME}' and trashed = false`,
    fields: 'files(id, name, modifiedTime, size)',
    pageSize: 1,
  });

  return response.data.files.length > 0 ? response.data.files[0] : null;
}

/**
 * Carica un backup su Google Drive
 * @param {object} data - Dati da salvare
 * @returns {Promise<object>} Risultato dell'operazione
 */
async function uploadBackup(data) {
  const drive = getDriveClient();
  if (!drive) throw new Error('Non autenticato');
  
  const content = JSON.stringify(data, null, 2);
  const existingFile = await findBackupFile();

  if (existingFile) {
    // Aggiorna il file esistente
    const response = await drive.files.update({
      fileId: existingFile.id,
      media: {
        mimeType: 'application/json',
        body: content,
      },
      fields: 'id, name, modifiedTime',
    });
    return { action: 'updated', file: response.data };
  } else {
    // Crea un nuovo file
    const response = await drive.files.create({
      requestBody: {
        name: BACKUP_FILENAME,
        parents: [APP_FOLDER],
      },
      media: {
        mimeType: 'application/json',
        body: content,
      },
      fields: 'id, name, modifiedTime',
    });
    return { action: 'created', file: response.data };
  }
}

/**
 * Scarica il backup da Google Drive
 * @returns {Promise<object|null>} Dati del backup o null se non esiste
 */
async function downloadBackup() {
  const drive = getDriveClient();
  if (!drive) return null;
  
  const existingFile = await findBackupFile();
  if (!existingFile) {
    return null;
  }

  const response = await drive.files.get({
    fileId: existingFile.id,
    alt: 'media',
  });

  return {
    data: response.data,
    modifiedTime: existingFile.modifiedTime,
    fileId: existingFile.id,
  };
}

/**
 * Ottiene informazioni sul backup esistente
 * @returns {Promise<object|null>} Info sul backup o null
 */
async function getBackupInfo() {
  try {
    const file = await findBackupFile();
    if (!file) return null;
    
    return {
      id: file.id,
      name: file.name,
      modifiedTime: file.modifiedTime,
      size: file.size,
    };
  } catch (error) {
    console.error('Errore recupero info backup:', error);
    return null;
  }
}

/**
 * Elimina il backup da Google Drive
 * @returns {Promise<boolean>} True se eliminato con successo
 */
async function deleteBackup() {
  const drive = getDriveClient();
  if (!drive) throw new Error('Non autenticato');
  
  const existingFile = await findBackupFile();
  if (!existingFile) {
    return false;
  }

  await drive.files.delete({
    fileId: existingFile.id,
  });

  return true;
}

/**
 * Ottiene info sull'account Google connesso
 * @returns {Promise<object|null>} Info utente
 */
async function getUserInfo() {
  try {
    if (!oauth2Client) initializeOAuth();
    
    const tokens = store.get('tokens');
    if (!tokens || !tokens.access_token) return null;
    
    // Se non c'è refresh_token e il token è scaduto, non possiamo fare nulla
    if (!tokens.refresh_token && tokens.expiry_date && tokens.expiry_date < Date.now()) {
      store.delete('tokens');
      return null;
    }
    
    oauth2Client.setCredentials(tokens);
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const response = await oauth2.userinfo.get();
    
    return {
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture,
    };
  } catch (error) {
    // Se è un errore 401, i token non sono più validi
    if (error.code === 401 || error.status === 401) {
      store.delete('tokens');
    }
    return null;
  }
}

module.exports = {
  initializeOAuth,
  isAuthenticated,
  isSigningIn,
  signIn,
  cancelSignIn,
  signOut,
  uploadBackup,
  downloadBackup,
  getBackupInfo,
  deleteBackup,
  getUserInfo,
};
