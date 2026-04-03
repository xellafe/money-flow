# MoneyFlow Privacy Policy

**Version:** 1.0  
**Effective Date:** April 3, 2026  
**Last Updated:** April 3, 2026

---

> This Privacy Policy is drafted in compliance with the **EU General Data Protection Regulation (GDPR) 2016/679**, the **California Consumer Privacy Act (CCPA/CPRA)**, and the **California Online Privacy Protection Act (CalOPPA)**. It applies to all users of the MoneyFlow desktop application, regardless of their geographic location.

---

## 1. Data Controller

The Data Controller for personal data processed by this application is:

**Federico Xella**  
Developer of MoneyFlow – Desktop application for personal finance tracking  
Version: 2.0.0  
E-mail: xellafe@gmail.com

For all privacy-related requests, including the exercise of data subject rights, please contact the Data Controller at the address above.

---

## 2. Scope of this Policy

This Privacy Policy applies exclusively to the **MoneyFlow** desktop application (hereinafter "the Application"). MoneyFlow is an **offline-first** application installed locally on the user's device for personal finance management and tracking.

**MoneyFlow is not a web service.** It does not operate its own servers for collecting or processing user data, and it does not collect usage metrics, telemetry, or analytics of any kind.

---

## 3. Categories of Personal Data Processed

### 3.1 Financial Data (provided directly by the user)

The user imports their own financial data into the Application by manually loading files of the following types:

| Category | Examples | Source |
|----------|----------|--------|
| Bank transactions | Date, amount, description, transaction type | Excel/CSV files exported from the user's bank (e.g. Illimity, Fineco) |
| PayPal transactions | Date, amount, sender/recipient name, description | CSV files exported from PayPal |
| Custom categories | Labels and keywords | Entered manually by the user |

This data qualifies as **personal financial data** under GDPR Art. 4 and as **"Sensitive Personal Information"** under CCPA/CPRA to the extent it reveals information about the user's finances.

> **⚠️ Note on third-party data in PayPal files:** PayPal CSV exports may contain the names and identifying information of **other natural persons** (senders or recipients of payments). These third parties are also data subjects under GDPR; however, their processing falls within the **personal/household use exemption** provided by GDPR Recital 18, which excludes from the Regulation's scope the processing of personal data by a natural person in the course of a purely personal or household activity. The user is therefore responsible for ensuring that imported data is used solely for personal finance management and is not disclosed to third parties.

### 3.2 Google Account Data (only if the user enables cloud sync)

If the user chooses to enable the optional Google Drive synchronization feature, the Application requests access to the following data via Google OAuth 2.0:

| Data | OAuth Scope Required | Purpose |
|------|---------------------|---------|
| Email address | `userinfo.email` | Identify the Google account and display it in the interface |
| App storage space on Drive | `drive.appdata` | Save the backup file (`moneyflow-backup.json`) in a hidden, private folder accessible only by the app |

**Google data is never transmitted to MoneyFlow servers.** The OAuth flow occurs directly between the user's device and Google's servers.

### 3.3 OAuth Authentication Tokens

The access and refresh tokens issued by Google are saved **locally on the user's device**, in **encrypted form** via `electron-store` with a dedicated encryption key. These tokens are never transmitted to any third party other than Google.

### 3.4 Data Not Collected

MoneyFlow does **not** collect or process:

- Browsing data or telemetry
- IP addresses
- Unique device identifiers for profiling purposes
- Geolocation data
- Third-party cookies or tracking pixels
- Biometric data
- Health data

---

## 4. Purposes and Legal Basis for Processing

### Under the GDPR (Art. 6 and Art. 9)

| Purpose | Data Involved | Legal Basis |
|---------|--------------|-------------|
| Recording and displaying financial transactions | Imported financial data | **Art. 6(1)(a)** – Explicit consent of the user who voluntarily imports their own data into the app |
| Automatic categorization of transactions | Transaction descriptions, keywords | **Art. 6(1)(a)** – Consent |
| Backup and sync with Google Drive | Financial data, OAuth tokens, Google account data | **Art. 6(1)(a)** – Consent (opt-in feature, can be enabled or disabled at any time) |
| PayPal description enrichment | Bank transactions and PayPal CSV | **Art. 6(1)(a)** – Consent |
| Data export to Excel | All user financial data | **Art. 6(1)(a)** – Consent |

Since the Application may process **financial data** that can be classified as a special category under GDPR Art. 9, processing is based on the user's **explicit consent** (Art. 9(2)(a)), expressed through the informed installation and use of the Application and the voluntary import of their own data.

---

## 5. Data Storage and Security

### 5.1 Local Storage

All user financial data is stored **exclusively on the user's local device** via the `localStorage` of the Chromium browser embedded in Electron (typical path: `%AppData%\MoneyFlow\`). Data is never automatically transmitted to third-party servers, except for the Google Drive backup (if enabled).

> **Note on encryption:** Financial data saved in `localStorage` is stored **in plaintext** (unencrypted) on the local file system. The protection of this data therefore depends on the user's operating system security measures (password-protected account, full-disk encryption via BitLocker/FileVault, etc.). Google **OAuth tokens** are stored in **encrypted form** via `electron-store` (see §5.3). The user acknowledges this level of protection by installing and using the Application.

### 5.2 Google Drive Backup

If the user enables cloud synchronization:
- The backup is saved in the app's private folder (`appDataFolder`) on Google Drive, **not visible** in the user's regular Drive folders.
- The backup file (`moneyflow-backup.json`) contains a full copy of the user's financial data.
- The backup is performed automatically when the application is closed (if authenticated).
- The backup can be restored or deleted at any time from the app's settings.

### 5.3 OAuth Tokens

OAuth tokens are encrypted with `electron-store` before being written to disk. The encryption key is **randomly generated at first launch** and is unique to each installation. It is protected by native OS security APIs (DPAPI on Windows, Keychain on macOS, libsecret on Linux) and is never exposed in the application's distributed code.

### 5.4 Technical Security Measures

The Application implements the following security measures:

- Strict **Content Security Policy (CSP)** to prevent XSS attacks
- **Context Isolation** and **preload script** to isolate the renderer process from Electron's main process
- **Node Integration disabled** in the renderer to reduce the attack surface
- No data transmission to MoneyFlow servers
- OAuth tokens stored in encrypted storage

---

## 6. Sharing Data with Third Parties

MoneyFlow **does not sell, rent, or transfer** users' personal data to third parties for any commercial or marketing purpose.

The only third party that may access user data is:

### 6.1 Google LLC

When the user enables Google Drive synchronization, financial data is uploaded to the app's private folder on Google Drive. Google processes this data in accordance with its own [Privacy Policy](https://policies.google.com/privacy) and [Google Drive Terms of Service](https://www.google.com/drive/terms-of-service). MoneyFlow uses exclusively the `drive.appdata` scope, which restricts access to a hidden folder not accessible by other applications.

**Google acts as a Data Processor** under GDPR Art. 28 for data synchronized to Drive, pursuant to the [Google Cloud Data Processing Terms](https://cloud.google.com/terms/data-processing-addendum).

### 6.2 No Other Third Parties

MoneyFlow does not integrate analytics SDKs, advertising platforms, social media plugins, or any other third-party service that could collect user data.

---

## 7. International Data Transfers

Transferring data to Google Drive entails a transfer of data to Google LLC infrastructure, headquartered in the United States of America.

This transfer is carried out in compliance with the GDPR by virtue of:
- The Standard Contractual Clauses (SCCs) adopted by Google in its [Data Processing Terms](https://cloud.google.com/terms/data-processing-addendum)
- The adequate safeguards provided by Google pursuant to GDPR Art. 46

The user can opt out of any international data transfer simply by not enabling the Google Drive synchronization feature.

---

## 8. Data Retention

| Data Type | Storage Location | Retention Period |
|-----------|-----------------|-----------------|
| Financial data | Local device (localStorage) | Until the app is uninstalled or the user manually deletes the data |
| OAuth tokens | Local device (encrypted electron-store) | Until the user disconnects their Google account in the app or uninstalls it |
| Google Drive backup | Google Drive (appDataFolder) | Until manually deleted by the user from the app settings or from their Google Drive |

The user retains full control over how long their data is retained.

---

## 9. Data Subject Rights (GDPR – Arts. 15–22)

As a data subject under the GDPR, the user has the right to:

### 9.1 Right of Access (Art. 15)
Obtain confirmation that their data is being processed and receive a copy. Since all data is saved locally within the app, it is directly accessible and viewable by the user through the interface.

### 9.2 Right to Rectification (Art. 16)
Correct or supplement their data. The user can edit descriptions, categories, and any other data directly from the application interface.

### 9.3 Right to Erasure ("Right to be Forgotten") (Art. 17)
Request deletion of their personal data. The user can:
- **Delete individual transactions** from the app interface
- **Delete all data** by uninstalling the application
- **Delete the Google Drive backup** from the app settings (Sync section)
- **Revoke OAuth access** directly from Google account settings: [myaccount.google.com/permissions](https://myaccount.google.com/permissions)

### 9.4 Right to Data Portability (Art. 20)
Receive their data in a structured, machine-readable format. The application allows the export of all transactions in **Excel (.xlsx)** format via the "Export" function in the Transactions section.

### 9.5 Right to Restriction of Processing (Art. 18)
Request restriction of processing. Since the app is a local application with no server component, the user can restrict processing simply by not using specific features (e.g. not enabling Drive sync).

### 9.6 Right to Object (Art. 21)
Object to processing at any time. The user can stop using the application and delete their data at any time.

### 9.7 Right to Withdraw Consent (Art. 7(3))
The user may withdraw consent to processing at any time, which includes:
- Disconnecting their Google account from the app
- Uninstalling the application

### 9.8 Right to Lodge a Complaint (Art. 77)
The user has the right to lodge a complaint with the supervisory authority competent in their EU Member State. For EU/EEA users, please refer to your national data protection authority. A list is available at: [edpb.europa.eu/about-edpb/about-edpb/members_en](https://www.edpb.europa.eu/about-edpb/about-edpb/members_en).

---

## 10. Rights of California Residents (CCPA/CPRA)

For users residing in California, the following rights apply under the **California Consumer Privacy Act (Cal. Civ. Code § 1798.100 et seq.)** and the **California Privacy Rights Act**:

### 10.1 Categories of Personal Information Collected

Under the CCPA, MoneyFlow collects the following categories of Personal Information:

| CCPA Category | Collected | Description |
|---------------|-----------|-------------|
| **A. Identifiers** | Yes (only if Drive enabled) | Google email address |
| **B. Personal information (Cal. Civ. Code § 1798.80(e))** | No | — |
| **C. Protected classification characteristics** | No | — |
| **D. Commercial information** | Yes | Financial transaction history, spending categories |
| **E. Biometric information** | No | — |
| **F. Internet/network activity** | No | — |
| **G. Geolocation data** | No | — |
| **H. Sensory information** | No | — |
| **I. Professional information** | No | — |
| **J. Education information** | No | — |
| **K. Inferences** | No | — |
| **L. Sensitive Personal Information (CPRA)** | Yes | Financial data (bank transaction history) |

### 10.2 Purpose of Collection

Personal information is collected **exclusively** to provide the service requested by the user (personal finance management) and to support Google Drive backup functionality (if enabled by the user).

### 10.3 Sale or Sharing for Commercial Purposes

**MoneyFlow does not sell or share** users' personal information with third parties for commercial or marketing purposes (**"Do Not Sell or Share My Personal Information"** – Cal. Civ. Code § 1798.120).

As MoneyFlow has no public web interface with remote login or data collection, and is a purely local desktop application, no opt-out mechanism via Global Privacy Control or "Do Not Sell" link is applicable.

### 10.4 Right to Know – § 1798.110
The user has the right to request disclosure of the categories and specific purposes for which personal information is collected. This information is fully documented in this Privacy Policy.

### 10.5 Right to Delete – § 1798.105
The user has the right to request deletion of their personal information. As described in §9.3, the user has full ability to delete all local data and remote backups.

### 10.6 Right to Correct – § 1798.106 (CPRA)
The user has the right to correct inaccurate personal information. The app interface allows modification of any data.

### 10.7 Right to Data Portability – § 1798.130
The user has the right to receive a copy of their data in a portable format via the Excel export feature.

### 10.8 Right to Non-Discrimination – § 1798.125
MoneyFlow does not discriminate against users who exercise their rights under CCPA/CPRA.

### 10.9 Right to Limit Use of Sensitive Personal Information – § 1798.121 (CPRA)
Financial data collected by MoneyFlow is used exclusively for the stated purpose (personal finance management) and not for any secondary or inferential purposes.

---

## 11. CalOPPA Compliance (California Online Privacy Protection Act)

Pursuant to **California Business and Professions Code §§ 22575–22579**:

### 11.1 Identification of this Policy
This Privacy Policy is identified by the name "MoneyFlow Privacy Policy" and clearly states the effective date.

### 11.2 Personally Identifiable Information (PII) Collected
The application collects the following PII (only if the user enables Drive sync):
- Google account email address

### 11.3 Third Parties with Whom Information Is Shared
As described in §6: **Google LLC** is the only third party with whom data is shared (only if Drive backup is active). No data is disclosed to advertising agencies, data brokers, or any other third parties.

### 11.4 Response to "Do Not Track" Signals
MoneyFlow is a desktop application, not a web platform. Browser "Do Not Track" (DNT) signals do not apply. The application does not track users through any tracking technology.

### 11.5 User Ability to Review and Modify Information
The user may review, edit, and delete their information directly from the application interface at any time, without the need to contact support.

### 11.6 How Changes to this Policy Will Be Communicated
Changes to this Privacy Policy will be communicated by:
- Updating the "Last Updated" date at the top of this document
- A new application release (noted in the changelog)

---

## 12. Children's Privacy

MoneyFlow is not intended for users under the age of **16** (or the minimum age required by applicable law in the user's country of residence). The Application does not knowingly collect personal data from minors.

If a parent or legal guardian believes that a minor has provided personal data through the application, they are asked to contact us at the address listed in §1 to request immediate deletion.

---

## 13. Changes to this Privacy Policy

The Data Controller reserves the right to modify this Privacy Policy at any time. Changes will take effect from the date the updated version is published, as indicated in the "Last Updated" section at the top of this document.

In the event of material changes to the user's rights or data processing practices, users will be notified via a visible in-app notification at the next application launch.

---

## 14. Contact and Privacy Requests

To exercise the rights described in this Privacy Policy, or for any question or complaint regarding the processing of your personal data, please contact:

**Federico Xella – Data Controller**  
E-mail: xellafe@gmail.com

The Data Controller will respond to data subject requests within **30 days** of receipt (extendable to 90 days in complex cases, with prior notice).

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Data Controller** | The entity that determines the purposes and means of processing personal data (MoneyFlow / Federico Xella) |
| **Data Subject** | The natural person to whom the personal data relates (the app user) |
| **Personal Data** | Any information relating to an identified or identifiable natural person |
| **Processing** | Any operation performed on personal data (collection, storage, modification, deletion, etc.) |
| **GDPR** | General Data Protection Regulation (EU) 2016/679 |
| **CCPA/CPRA** | California Consumer Privacy Act / California Privacy Rights Act |
| **CalOPPA** | California Online Privacy Protection Act |
| **OAuth 2.0** | Open authorization protocol used for secure access to the Google account |
| **appDataFolder** | A private, hidden folder on Google Drive accessible exclusively by the application that created it |

---

*© 2026 MoneyFlow. All rights reserved.*
