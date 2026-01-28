// Funzioni di utilità

/**
 * Formatta un valore come valuta EUR
 * @param {number} value - Valore da formattare
 * @returns {string} Valore formattato come valuta
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(value);
};

/**
 * Parse di una data Excel
 * @param {number|string} val - Valore da parsare
 * @returns {Date} Data parsata
 */
export const parseDate = (val) => {
  if (!val) return new Date();
  if (typeof val === 'number') {
    return new Date((val - 25569) * 86400 * 1000);
  }
  if (typeof val === 'string') {
    const parts = val.split('/');
    if (parts.length === 3) return new Date(parts[2], parts[1]-1, parts[0]);
  }
  return new Date(val);
};

/**
 * Parse di un importo (gestisce formati italiani con virgola)
 * @param {number|string} val - Valore da parsare
 * @returns {number} Importo parsato
 */
export const parseAmount = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  // Rimuove tutto tranne numeri, virgola, punto e segno meno
  const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Genera un ID univoco
 * @returns {string} ID univoco
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Trova tutte le categorie che matchano una descrizione
 * @param {string} description - Descrizione della transazione
 * @param {Object} categories - Oggetto categorie { nome: [keywords] }
 * @returns {Array} Array di match { category, keyword }
 */
export const findMatchingCategories = (description, categories) => {
  const desc = description.toUpperCase();
  const matches = [];
  for (const [cat, keywords] of Object.entries(categories)) {
    for (const k of keywords) {
      if (desc.includes(k.toUpperCase())) {
        matches.push({ category: cat, keyword: k });
        break; // Una sola keyword per categoria
      }
    }
  }
  return matches;
};

/**
 * Auto-categorizza una descrizione
 * @param {string} description - Descrizione della transazione
 * @param {Object} categories - Oggetto categorie
 * @returns {string} Nome della categoria
 */
export const categorize = (description, categories) => {
  const matches = findMatchingCategories(description, categories);
  if (matches.length === 0) return 'Altro';
  if (matches.length === 1) return matches[0].category;
  // Più match: prendi quello con la keyword più lunga (più specifica)
  const best = matches.reduce((a, b) => a.keyword.length >= b.keyword.length ? a : b);
  return best.category;
};
