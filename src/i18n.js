// i18n — lightweight multi-language support

var translations = {};
var currentLocale = 'en';

// Register a language pack
export function register(locale, strings) {
  translations[locale] = strings;
}

// Get translated string with {key} interpolation
export function t(key, params) {
  var str = (translations[currentLocale] && translations[currentLocale][key])
         || (translations.en && translations.en[key])
         || key;
  if (params) {
    for (var k in params) str = str.split('{' + k + '}').join(params[k]);
  }
  return str;
}

// Get array-type translation (e.g. random line pools)
export function tArray(key) {
  var val = (translations[currentLocale] && translations[currentLocale][key])
         || (translations.en && translations.en[key]);
  return Array.isArray(val) ? val : [key];
}

export function setLocale(locale) { currentLocale = locale; }
export function getLocale() { return currentLocale; }

// Detect system language → supported locale code
export function detectLocale() {
  var lang = (navigator.language || 'en').toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('es')) return 'es';
  return 'en';
}

// Scan DOM and apply translations via data-i18n attributes
export function applyI18nToDOM(root) {
  var el = root || document;
  el.querySelectorAll('[data-i18n]').forEach(function(node) {
    node.textContent = t(node.dataset.i18n);
  });
  el.querySelectorAll('[data-i18n-placeholder]').forEach(function(node) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  el.querySelectorAll('[data-i18n-title]').forEach(function(node) {
    node.title = t(node.dataset.i18nTitle);
  });
}
