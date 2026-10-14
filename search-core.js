export const SEARCH_ENGINES = Object.freeze({
  google: { label: 'Google', url: 'https://www.google.com/search', parameter: 'q' },
  bing: { label: 'Bing', url: 'https://www.bing.com/search', parameter: 'q' },
  baidu: { label: 'Baidu', url: 'https://www.baidu.com/s', parameter: 'wd' },
  sogou: { label: 'Sogou', url: 'https://www.sogou.com/web', parameter: 'query' },
});

export function buildSearchUrl(engine, query) {
  const adapter = SEARCH_ENGINES[engine];
  if (!adapter) throw new Error('Unsupported search engine');
  const text = String(query || '').trim();
  if (!text) throw new Error('Empty search query');
  const url = new URL(adapter.url);
  url.searchParams.set(adapter.parameter, text);
  return url.href;
}

export function parseTranslation(data) {
  if (!Array.isArray(data?.[0])) throw new Error('Invalid translation response');
  const translated = data[0].map((sentence) => typeof sentence?.[0] === 'string' ? sentence[0] : '').join('').trim();
  if (!translated) throw new Error('Empty translation response');
  return translated;
}

export async function translateQuery(text, source, target, { fetchImpl = fetch, signal } = {}) {
  if (source === target) return text;
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.search = new URLSearchParams({ client: 'gtx', sl: source, tl: target, dt: 't', q: text });
  for (let attempt = 0; attempt < 2; attempt++) {
    signal?.throwIfAborted();
    const request = new AbortController();
    const cancel = () => request.abort(signal.reason);
    signal?.addEventListener('abort', cancel, { once: true });
    const timeout = setTimeout(() => request.abort(), 6000);
    try {
      const response = await fetchImpl(url.href, { signal: request.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) {
        const error = new Error(`Translation service returned ${response.status}`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      return parseTranslation(await response.json());
    } catch (error) {
      signal?.throwIfAborted();
      if (attempt || !(error.retryable || error.name === 'TypeError' || error.name === 'AbortError')) throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', cancel);
    }
  }
}

function abortable(promise, signal, cleanupLateResult) {
  if (!signal) return promise;
  return new Promise((resolve, reject) => {
    const cancel = () => reject(signal.reason || new DOMException('Cancelled', 'AbortError'));
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) cancel();
    Promise.resolve(promise).then(value => {
      if (signal.aborted) cleanupLateResult?.(value);
      else resolve(value);
    }, reject).finally(() => signal.removeEventListener('abort', cancel));
  });
}

const nativeLanguage = language => ({ 'zh-CN': 'zh', 'zh-TW': 'zh-Hant' }[language] || language);

// This path never falls back to a network provider. The caller must ask users
// to choose online translation explicitly when local capabilities are absent.
export async function translateLocally(text, source, target, { Translator = globalThis.Translator, LanguageDetector = globalThis.LanguageDetector, signal, onProgress = () => {} } = {}) {
  signal?.throwIfAborted();
  if (source === target) return text;
  if (!Translator) throw new Error('Local translation unavailable');
  const monitor = m => m.addEventListener('downloadprogress', event => onProgress(Math.round(event.loaded * 100)));
  if (source === 'auto') {
    if (!LanguageDetector || await abortable(LanguageDetector.availability(), signal) === 'unavailable') throw new Error('Choose a source language');
    const detector = await abortable(LanguageDetector.create({ monitor, signal }), signal, value => value.destroy());
    try {
      const [detected] = await abortable(detector.detect(text, { signal }), signal);
      if (!detected || detected.confidence < 0.6 || detected.detectedLanguage === 'und') throw new Error('Choose a source language');
      source = detected.detectedLanguage;
    } finally { detector.destroy(); }
  }
  const options = { sourceLanguage: nativeLanguage(source), targetLanguage: nativeLanguage(target) };
  if (options.sourceLanguage === options.targetLanguage) return text;
  if (await abortable(Translator.availability(options), signal) === 'unavailable') throw new Error('Language pair unavailable');
  const translator = await abortable(Translator.create({ ...options, monitor, signal }), signal, value => value.destroy());
  try {
    const translated = await abortable(translator.translate(text, { signal }), signal);
    if (!translated?.trim()) throw new Error('Empty translation');
    return translated.trim();
  } finally { translator.destroy(); }
}
