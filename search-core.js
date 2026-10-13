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
  const response = await fetchImpl(url.href, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error(`Translation service returned ${response.status}`);
  return parseTranslation(await response.json());
}
