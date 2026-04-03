# Informativa sulla Privacy di MoneyFlow

**Versione:** 1.0  
**Data di entrata in vigore:** 3 aprile 2026  
**Ultima revisione:** 3 aprile 2026

---

> Questa Informativa sulla Privacy è redatta in conformità al **Regolamento (UE) 2016/679 (GDPR)**, al **California Consumer Privacy Act (CCPA/CPRA)** e al **California Online Privacy Protection Act (CalOPPA)**. Si applica a tutti gli utenti dell'applicazione desktop MoneyFlow, indipendentemente dalla loro residenza geografica.

---

## 1. Titolare del Trattamento

Il Titolare del trattamento dei dati personali è:

**Federico Xella**  
Sviluppatore di MoneyFlow – Applicazione desktop per il monitoraggio delle finanze personali  
Versione: 2.0.0  
E-mail: xellafe@gmail.com  

Per tutte le richieste relative alla privacy, incluse le richieste di esercizio dei diritti degli interessati, è possibile contattare il Titolare all'indirizzo sopra indicato.

---

## 2. Ambito di Applicazione

La presente Informativa si applica esclusivamente all'applicazione desktop **MoneyFlow** (di seguito "l'Applicazione"). MoneyFlow è un'applicazione **offline-first** installata localmente sul dispositivo dell'utente per la gestione e il monitoraggio delle proprie finanze personali.

**MoneyFlow non è un servizio web**, non dispone di server propri per la raccolta o l'elaborazione dei dati degli utenti, e non raccoglie metriche di utilizzo, telemetria o dati analitici di alcun tipo.

---

## 3. Categorie di Dati Personali Trattati

### 3.1 Dati Finanziari (forniti direttamente dall'utente)

L'utente importa nell'Applicazione i propri dati finanziari caricando manualmente file nelle seguenti tipologie:

| Categoria | Esempi | Fonte |
|-----------|--------|-------|
| Movimenti bancari | Data, importo, causale, tipo operazione | File Excel/CSV esportati dalla banca (es. Illimity, Fineco) |
| Transazioni PayPal | Data, importo, nome mittente/destinatario, descrizione | File CSV esportati da PayPal |
| Categorie personalizzate | Etichette e parole chiave | Inserite manualmente dall'utente |

Questi dati sono classificabili come **dati finanziari personali** ai sensi dell'art. 4 GDPR e come **"Sensitive Personal Information"** ai sensi del CCPA/CPRA nella misura in cui rivelano informazioni circa le finanze dell'utente.

> **⚠️ Nota sui dati di terze parti nei file PayPal:** I file CSV esportati da PayPal possono contenere nomi e informazioni di identificazione di **altre persone fisiche** (mittenti o destinatari dei pagamenti). Questi soggetti terzi sono anch'essi interessati ai sensi del GDPR, ma il loro trattamento rientra nell'**esenzione per uso personale e domestico** prevista dal Considerando 18 del GDPR, che esclude dall'ambito di applicazione del Regolamento il trattamento di dati effettuato da una persona fisica nell'esercizio di attività a carattere esclusivamente personale o domestico. L'utente è pertanto responsabile di assicurarsi che i dati importati siano utilizzati solo per finalità di gestione personale delle proprie finanze e non vengano divulgati a terzi.

### 3.2 Dati dell'Account Google (solo se l'utente attiva la sincronizzazione cloud)

Se l'utente sceglie di attivare la funzionalità opzionale di sincronizzazione con Google Drive, l'Applicazione richiede l'accesso ai seguenti dati tramite autenticazione Google OAuth 2.0:

| Dato | Scope OAuth richiesto | Finalità |
|------|-----------------------|----------|
| Indirizzo e-mail | `userinfo.email` | Identificare l'account Google e mostrarlo nell'interfaccia |
| Spazio di archiviazione app su Drive | `drive.appdata` | Salvare il file di backup (`moneyflow-backup.json`) in una cartella nascosta e privata, accessibile solo dall'app |

**I dati di Google non vengono mai trasmessi a server di MoneyFlow.** Il flusso OAuth avviene direttamente tra il dispositivo dell'utente e i server di Google.

### 3.3 Token di Autenticazione OAuth

I token di accesso e di aggiornamento (access token / refresh token) rilasciati da Google vengono salvati **localmente sul dispositivo dell'utente**, in forma **cifrata** tramite `electron-store` con chiave di cifratura dedicata. Questi token non vengono mai trasmessi a terze parti diverse da Google.

### 3.4 Dati Non Raccolti

MoneyFlow **non raccoglie** e **non tratta**:

- Dati di navigazione o telemetria
- Indirizzi IP
- Identificatori univoci di dispositivo a fini di profilazione
- Dati di geolocalizzazione
- Cookie di terze parti o pixel di tracciamento
- Dati biometrici
- Dati sanitari

---

## 4. Finalità e Base Giuridica del Trattamento

### Ai sensi del GDPR (art. 6 e art. 9)

| Finalità | Dati coinvolti | Base giuridica |
|----------|---------------|----------------|
| Registrazione e visualizzazione dei movimenti finanziari | Dati finanziari importati | **Art. 6(1)(a)** – Consenso esplicito dell'utente che importa volontariamente i propri dati nell'app |
| Categorizzazione automatica delle transazioni | Descrizioni delle transazioni, parole chiave | **Art. 6(1)(a)** – Consenso |
| Backup e sincronizzazione su Google Drive | Dati finanziari, token OAuth, dati account Google | **Art. 6(1)(a)** – Consenso (funzionalità opt-in, attivabile e disattivabile in qualsiasi momento) |
| Arricchimento descrizioni PayPal | Transazioni bancarie e CSV PayPal | **Art. 6(1)(a)** – Consenso |
| Esportazione dati in Excel | Tutti i dati finanziari dell'utente | **Art. 6(1)(a)** – Consenso |

Trattandosi di un'applicazione che può trattare **dati finanziari** classificabili come categorie particolari ai sensi dell'art. 9 GDPR, il trattamento si fonda sul **consenso esplicito** dell'utente (art. 9(2)(a)), manifestato attraverso l'installazione e l'utilizzo consapevole dell'applicazione e l'importazione volontaria dei propri dati.

---

## 5. Modalità di Conservazione e Sicurezza dei Dati

### 5.1 Archiviazione Locale

Tutti i dati finanziari dell'utente sono conservati **esclusivamente sul dispositivo locale** dell'utente, tramite `localStorage` del browser Chromium integrato in Electron (percorso tipico: `%AppData%\MoneyFlow\`). I dati non vengono mai trasmessi automaticamente a server di terze parti, ad eccezione del backup su Google Drive (se attivato).

> **Nota sulla cifratura:** I dati finanziari salvati in `localStorage` sono conservati **in chiaro** (non cifrati) sul file system locale. La protezione di questi dati dipende pertanto dalle misure di sicurezza del sistema operativo dell'utente (account protetto da password, cifratura del disco con BitLocker/FileVault, ecc.). I **token OAuth** di Google sono invece conservati in forma **cifrata** tramite `electron-store` (vedi §5.3). L'utente è consapevole di questo livello di protezione installando e utilizzando l'applicazione.

### 5.2 Backup su Google Drive

Se l'utente attiva la sincronizzazione cloud:
- Il backup viene salvato nella cartella riservata all'app (`appDataFolder`) su Google Drive, **non visibile** nelle cartelle normali di Drive dell'utente.
- Il file di backup (`moneyflow-backup.json`) contiene l'intera copia dei dati finanziari dell'utente.
- Il backup viene effettuato automaticamente alla chiusura dell'applicazione (se autenticati).
- Il backup può essere ripristinato o eliminato in qualsiasi momento dalle impostazioni dell'app.

### 5.3 Token OAuth

I token OAuth vengono cifrati con `electron-store` prima di essere scritti su disco. La chiave di cifratura è **generata in modo casuale al primo avvio** ed è unica per ogni installazione. Viene protetta dalle API di sicurezza native del sistema operativo (DPAPI su Windows, Keychain su macOS, libsecret su Linux) e mai esposta nel codice distribuibile dell'applicazione.

### 5.4 Misure di Sicurezza Tecniche

L'Applicazione implementa le seguenti misure di sicurezza:

- **Content Security Policy (CSP)** rigorosa per prevenire attacchi XSS
- **Context Isolation** e **preload script** per isolare il processo renderer dal processo principale di Electron
- **Disabilitazione Node Integration** nel renderer per ridurre la superficie di attacco
- Nessuna trasmissione di dati verso server di MoneyFlow
- Token OAuth in archivio cifrato

---

## 6. Condivisione dei Dati con Terze Parti

MoneyFlow **non vende, non affitta e non cede** i dati personali degli utenti a terze parti per nessuna finalità commerciale o di marketing.

I soli soggetti terzi che possono accedere a dati dell'utente sono:

### 6.1 Google LLC

Quando l'utente attiva la sincronizzazione con Google Drive, i dati finanziari vengono caricati nella cartella privata dell'app su Google Drive. Google tratta questi dati secondo la propria [Privacy Policy](https://policies.google.com/privacy) e i [Termini di servizio di Google Drive](https://www.google.com/drive/terms-of-service). MoneyFlow utilizza esclusivamente lo scope `drive.appdata`, che limita l'accesso a una cartella hidden, non accessibile da altre applicazioni.

**Google è da considerarsi Responsabile del trattamento (Data Processor)** ai sensi dell'art. 28 GDPR per i dati sincronizzati su Drive, sulla base dei [Google Cloud Data Processing Terms](https://cloud.google.com/terms/data-processing-addendum).

### 6.2 Nessun Altro Soggetto Terzo

MoneyFlow non integra SDK di analisi, piattaforme pubblicitarie, social media plugin o qualsiasi altro servizio di terze parti che possa raccogliere dati degli utenti.

---

## 7. Trasferimenti Internazionali di Dati

Il trasferimento dei dati verso Google Drive comporta un trasferimento di dati verso infrastrutture di Google LLC, con sede negli Stati Uniti d'America.

Questo trasferimento avviene nel rispetto del GDPR in virtù di:
- Le Standard Contractual Clauses (SCC) adottate da Google nei propri [Data Processing Terms](https://cloud.google.com/terms/data-processing-addendum)
- Le adeguate garanzie fornite da Google ai sensi dell'art. 46 GDPR

L'utente può rinunciare a qualsiasi trasferimento internazionale di dati semplicemente non attivando la funzionalità di sincronizzazione con Google Drive.

---

## 8. Periodo di Conservazione dei Dati

| Tipo di Dato | Luogo di Conservazione | Periodo |
|---|---|---|
| Dati finanziari | Dispositivo locale (localStorage) | Fino alla disinstallazione dell'app o alla cancellazione manuale da parte dell'utente |
| Token OAuth | Dispositivo locale (electron-store cifrato) | Fino alla disconnessione dall'account Google nell'app o alla disinstallazione |
| Backup su Google Drive | Google Drive (appDataFolder) | Fino all'eliminazione manuale da parte dell'utente dalle impostazioni o dal proprio Google Drive |

L'utente ha il pieno controllo sulla durata di conservazione dei propri dati.

---

## 9. Diritti degli Interessati (GDPR – Artt. 15-22)

L'utente, in qualità di interessato ai sensi del GDPR, ha il diritto di:

### 9.1 Diritto di Accesso (Art. 15)
Ottenere conferma del trattamento dei propri dati e riceverne copia. Poiché tutti i dati sono salvati localmente sull'app dell'utente, questi sono direttamente accessibili e visualizzabili dall'utente stesso nell'interfaccia.

### 9.2 Diritto di Rettifica (Art. 16)
Correggere o integrare i propri dati. L'utente può modificare descrizioni, categorie e qualsiasi dato direttamente dall'interfaccia dell'applicazione.

### 9.3 Diritto alla Cancellazione ("diritto all'oblio") (Art. 17)
Richiedere la cancellazione dei propri dati. L'utente può:
- **Eliminare singole transazioni** dall'interfaccia dell'app
- **Cancellare tutti i dati** disinstallando l'applicazione
- **Eliminare il backup su Google Drive** dalle impostazioni dell'app (sezione "Sincronizzazione")
- **Revocare l'accesso OAuth** direttamente dalle impostazioni dell'account Google: [myaccount.google.com/permissions](https://myaccount.google.com/permissions)

### 9.4 Diritto alla Portabilità dei Dati (Art. 20)
Ricevere i propri dati in formato strutturato e leggibile da macchina. L'applicazione consente l'esportazione di tutte le transazioni in formato **Excel (.xlsx)** attraverso la funzione "Esporta" nella sezione Movimenti.

### 9.5 Diritto di Limitazione del Trattamento (Art. 18)
Richiedere la limitazione del trattamento. Essendo l'app un'applicazione locale senza server, l'utente può limitare il trattamento semplicemente non utilizzando le funzionalità specifiche (es. non attivando la sincronizzazione Drive).

### 9.6 Diritto di Opposizione (Art. 21)
Opporsi al trattamento in qualsiasi momento. L'utente può cessare l'utilizzo dell'applicazione ed eliminare i dati in qualsiasi momento.

### 9.7 Diritto di Revoca del Consenso (Art. 7(3))
L'utente può revocare il consenso al trattamento in qualsiasi momento, il che implica la possibilità di:
- Disconnettere il proprio account Google dall'app
- Disinstallare l'applicazione

### 9.8 Diritto di Proporre Reclamo (Art. 77)
L'utente ha il diritto di proporre reclamo all'Autorità Garante per la Protezione dei Dati Personali competente nel proprio Stato membro UE. Per gli utenti italiani: **Garante per la Protezione dei Dati Personali** ([www.garanteprivacy.it](https://www.garanteprivacy.it)).

---

## 10. Diritti degli Utenti della California (CCPA/CPRA)

Per gli utenti residenti in California, si applicano i seguenti diritti ai sensi del **California Consumer Privacy Act (Cal. Civ. Code § 1798.100 et seq.)** e del **California Privacy Rights Act**:

### 10.1 Categorie di Informazioni Personali Raccolte

Ai sensi del CCPA, MoneyFlow raccoglie le seguenti categorie di Informazioni Personali:

| Categoria CCPA | Raccolta | Descrizione |
|----------------|----------|-------------|
| **A. Identificatori** | Sì (solo se Drive attivo) | Indirizzo e-mail Google |
| **B. Informazioni personali (Cal. Civ. Code § 1798.80(e))** | No | — |
| **C. Caratteristiche delle classi protette** | No | — |
| **D. Informazioni commerciali** | Sì | Storico transazioni finanziarie, categoria di spesa |
| **E. Informazioni biometriche** | No | — |
| **F. Attività su Internet/rete** | No | — |
| **G. Dati di geolocalizzazione** | No | — |
| **H. Informazioni sensoriali** | No | — |
| **I. Informazioni professionali** | No | — |
| **J. Informazioni educative** | No | — |
| **K. Inferenze** | No | — |
| **L. Informazioni personali sensibili (CPRA)** | Sì | Dati finanziari (storico transazioni bancarie) |

### 10.2 Scopo della Raccolta

Le informazioni personali vengono raccolte **esclusivamente** per fornire il servizio richiesto dall'utente (gestione delle proprie finanze personali) e per le funzionalità di backup su Google Drive (se attivate dall'utente).

### 10.3 Vendita o Condivisione con Terze Parti a Fini Commerciali

**MoneyFlow non vende e non condivide** le informazioni personali degli utenti con terze parti a fini commerciali o di marketing (**"Do Not Sell or Share My Personal Information"** – Cal. Civ. Code § 1798.120).

Non avendo un sito web pubblico con login o raccolta dati remota, e trattandosi di un'applicazione desktop locale, non si applicano meccanismi di opt-out tramite Global Privacy Control o link "Do Not Sell".

### 10.4 Diritto di Sapere (Right to Know) – § 1798.110
L'utente ha il diritto di richiedere la divulgazione delle categorie e delle finalità specifiche dei dati personali raccolti. Queste informazioni sono interamente documentate nella presente Informativa.

### 10.5 Diritto di Cancellazione (Right to Delete) – § 1798.105
L'utente ha il diritto di richiedere la cancellazione dei propri dati personali. Come descritto al § 9.3, l'utente ha piena facoltà di eliminare tutti i dati locali e i backup remoti.

### 10.6 Diritto di Correzione (Right to Correct) – § 1798.106 (CPRA)
L'utente ha il diritto di correggere le informazioni personali inaccurate. L'interfaccia dell'app consente la modifica di qualsiasi dato.

### 10.7 Diritto di Portabilità – § 1798.130
L'utente ha il diritto di ricevere una copia dei propri dati in formato portatile tramite la funzione di esportazione Excel.

### 10.8 Diritto alla Non Discriminazione – § 1798.125
MoneyFlow non esercita alcuna discriminazione nei confronti degli utenti che esercitano i propri diritti ai sensi della CCPA/CPRA.

### 10.9 Diritto di Limitare l'Uso delle Informazioni Personali Sensibili – § 1798.121 (CPRA)
I dati finanziari raccolti da MoneyFlow vengono utilizzati esclusivamente per la finalità dichiarata (gestione delle finanze personali) e non per finalità secondarie o inferenziali.

---

## 11. Conformità CalOPPA (California Online Privacy Protection Act)

Ai sensi del **California Business and Professions Code §§ 22575-22579**, si forniscono le seguenti informazioni:

### 11.1 Identificazione di questa Informativa
La presente Informativa sulla Privacy è identificabile con il nome "Informativa sulla Privacy di MoneyFlow" e indica chiaramente la data di entrata in vigore.

### 11.2 Raccolta di Informazioni di Identificazione Personale (PII)
L'applicazione raccoglie le seguenti PII (solo se l'utente attiva la sincronizzazione Drive):
- Indirizzo e-mail dell'account Google

### 11.3 Terze Parti a Cui le Informazioni Sono Condivise
Come descritto al § 6: **Google LLC** è l'unica terza parte con cui vengono condivisi dati (solo se il backup Drive è attivo). Nessun dato viene ceduto ad agenzie pubblicitarie, broker di dati o altri soggetti terzi.

### 11.4 Risposta ai Segnali "Do Not Track"
Essendo MoneyFlow un'applicazione desktop e non una piattaforma web, i segnali "Do Not Track" (DNT) del browser non si applicano. L'applicazione non tracciagli utenti tramite tecnologie di tracciamento.

### 11.5 Possibilità per l'Utente di Rivedere e Modificare le Informazioni
L'utente può rivedere, modificare ed eliminare le proprie informazioni direttamente dall'interfaccia dell'applicazione in qualsiasi momento, senza necessità di contattare il supporto.

### 11.6 Come Verrà Notificata una Modifica all'Informativa
Le modifiche alla presente Informativa saranno notificate tramite:
- Aggiornamento della data di "Ultima revisione" in cima al documento
- Nuova versione dell'applicazione (release note nel changelog)

---

## 12. Privacy dei Minori

MoneyFlow non è destinata a utenti di età inferiore a **16 anni** (o l'età minima prevista dalla legge applicabile nel Paese di residenza dell'utente). L'Applicazione non raccoglie consapevolmente dati personali di minori.

Se un genitore o tutore legale ritiene che un minore abbia fornito dati personali attraverso l'applicazione, è pregato di contattarci all'indirizzo indicato al § 1 per richiederne la cancellazione immediata.

---

## 13. Modifiche alla Presente Informativa

Il Titolare si riserva il diritto di modificare la presente Informativa in qualsiasi momento. Le modifiche entreranno in vigore a partire dalla data di pubblicazione della versione aggiornata, che sarà indicata nella sezione "Ultima revisione" in cima al documento.

In caso di modifiche sostanziali ai propri diritti o alle modalità di trattamento dei dati, gli utenti saranno informati tramite una notifica visibile all'interno dell'applicazione al successivo avvio.

---

## 14. Contatti e Richieste relative alla Privacy

Per esercitare i diritti descritti nella presente Informativa, o per qualsiasi domanda o reclamo relativo al trattamento dei propri dati personali, è possibile contattare:

**Federico Xella – Titolare del trattamento**  
E-mail: xellafe@gmail.com  

Il Titolare risponderà alle richieste degli interessati entro **30 giorni** dalla ricezione (termine estendibile a 90 giorni in caso di complessità, con relativa comunicazione).

---

## 15. Glossario

| Termine | Definizione |
|---------|------------|
| **Titolare del trattamento** | Il soggetto che determina le finalità e i mezzi del trattamento dei dati personali (MoneyFlow) |
| **Interessato** | La persona fisica a cui si riferiscono i dati personali (l'utente dell'app) |
| **Dato personale** | Qualsiasi informazione relativa a una persona fisica identificata o identificabile |
| **Trattamento** | Qualsiasi operazione effettuata sui dati personali (raccolta, conservazione, modifica, cancellazione, ecc.) |
| **GDPR** | Regolamento Generale sulla Protezione dei Dati (UE) 2016/679 |
| **CCPA/CPRA** | California Consumer Privacy Act / California Privacy Rights Act |
| **CalOPPA** | California Online Privacy Protection Act |
| **OAuth 2.0** | Protocollo aperto di autorizzazione utilizzato per l'accesso sicuro all'account Google |
| **appDataFolder** | Cartella privata e nascosta su Google Drive accessibile esclusivamente dall'applicazione che la crea |

---

*© 2026 MoneyFlow. Tutti i diritti riservati.*
