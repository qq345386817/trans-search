(function () {
  const config = window.TRANS_SEARCH_I18N;
  if (!config) return;

  const STORAGE_KEY = 'trans-search-lang';
  const pages = config.pages || {};
  const supported = new Set(config.supportedLangs || []);

  function normalizeLang(raw) {
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;
    if (supported.has(value)) return value;

    const lower = value.toLowerCase();
    if (lower === 'zh' || lower.startsWith('zh-cn') || lower.startsWith('zh-hans') || lower === 'zh-sg') return 'zh-CN';
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-mo') || lower.startsWith('zh-hant')) return 'zh-TW';
    if (lower.startsWith('en')) return 'en';
    return null;
  }

  function browserLang() {
    const candidates = [navigator.language].concat(navigator.languages || []);
    for (const item of candidates) {
      const normalized = normalizeLang(item);
      if (normalized) return normalized;
    }
    return null;
  }

  function detectLang() {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = normalizeLang(params.get('lang'));
    if (fromQuery) {
      localStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }

    const fromStorage = normalizeLang(localStorage.getItem(STORAGE_KEY));
    if (fromStorage) return fromStorage;

    return browserLang() || config.defaultLang || 'en';
  }

  function getValue(path, lang, page) {
    const [scope, key] = path.split('.');
    const langPack = (config.translations[lang] && config.translations[lang][scope]) || {};
    const defaultPack = (pages[scope] || {});
    if (Object.prototype.hasOwnProperty.call(langPack, key)) return langPack[key];
    if (scope === page && Object.prototype.hasOwnProperty.call(defaultPack, key)) return defaultPack[key];
    const commonPack = pages.common || {};
    if (scope === 'common' && Object.prototype.hasOwnProperty.call(commonPack, key)) return commonPack[key];
    return '';
  }

  function setText(el, value) {
    if (el.dataset.i18nHtml === 'true') {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  }

  function applyTranslations(lang) {
    const page = document.body.dataset.page;
    document.documentElement.lang = lang;
    document.body.dataset.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      setText(el, getValue(key, lang, page));
    });

    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      const attr = el.dataset.i18nAttr;
      const key = el.dataset.i18n;
      el.setAttribute(attr, getValue(key, lang, page));
    });

    const titleKey = document.documentElement.dataset.i18nTitle;
    if (titleKey) document.title = getValue(titleKey, lang, page);

    const desc = document.querySelector('meta[name="description"]');
    const descKey = desc && desc.dataset.i18n;
    if (desc && descKey) desc.setAttribute('content', getValue(descKey, lang, page));

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', withLang(canonical.getAttribute('href') || canonical.href, lang));

    document.querySelectorAll('a[href]').forEach((anchor) => {
      if (anchor.dataset.skipLang === 'true') return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
      anchor.setAttribute('href', withLang(href, lang));
    });

    const switcher = document.querySelector('[data-lang-switcher]');
    if (switcher) switcher.value = lang;
  }

  function withLang(href, lang) {
    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return href;
      url.searchParams.set('lang', lang);
      return url.pathname.split('/').pop() + url.search + url.hash;
    } catch (err) {
      return href;
    }
  }

  function initLanguageSwitcher(currentLang) {
    const switcher = document.querySelector('[data-lang-switcher]');
    if (!switcher) return;

    switcher.innerHTML = '';
    (config.supportedLangs || []).forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = config.languages[lang] || lang;
      switcher.appendChild(option);
    });
    switcher.value = currentLang;
    switcher.addEventListener('change', (event) => {
      const lang = normalizeLang(event.target.value) || config.defaultLang || 'en';
      localStorage.setItem(STORAGE_KEY, lang);
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.location.href = url.toString();
    });
  }

  function initRedirect() {
    if (document.body.dataset.page !== 'how_to_use') return;
    const lang = detectLang();
    const target = new URL('help.html', window.location.href);
    target.searchParams.set('lang', lang);
    const fallback = document.querySelector('[data-redirect-link]');
    if (fallback) fallback.href = withLang('help.html', lang);
    window.setTimeout(() => {
      window.location.replace(target.toString());
    }, 80);
  }

  const lang = detectLang();
  initLanguageSwitcher(lang);
  applyTranslations(lang);
  initRedirect();
})();
