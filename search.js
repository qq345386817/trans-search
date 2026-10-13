import { buildSearchUrl, translateQuery } from './search-core.js';

const form = document.getElementById('search-form');
if (form) {
  const query = document.getElementById('search-query');
  const source = document.getElementById('source-language');
  const target = document.getElementById('target-language');
  const engine = document.getElementById('search-engine');
  const translateButton = document.getElementById('translate-query');
  const status = document.getElementById('search-status');
  const preview = document.getElementById('search-preview');
  const translated = document.getElementById('translated-query');
  const translatedLink = document.getElementById('translated-search-link');
  const originalLink = document.getElementById('original-search-link');
  const copyButton = document.getElementById('copy-translation');
  let requestId = 0;
  let controller;
  let timer;
  const toolMessages = JSON.parse(document.getElementById('tool-copy').textContent);

  function message(key, substitutions = []) {
    const value = toolMessages[key] || key;
    return value.replace(/\$(\d+)/g, (_, index) => substitutions[Number(index) - 1] || '');
  }

  function updateLinks() {
    const original = query.value.trim();
    const result = translated.value.trim();
    originalLink.hidden = !original;
    if (original) originalLink.href = buildSearchUrl(engine.value, original);
    else originalLink.removeAttribute('href');
    translatedLink.hidden = !result;
    if (result) translatedLink.href = buildSearchUrl(engine.value, result);
    else translatedLink.removeAttribute('href');
    copyButton.disabled = !result;
  }

  function invalidate() {
    query.setCustomValidity('');
    requestId += 1;
    controller?.abort();
    clearTimeout(timer);
    form.removeAttribute('aria-busy');
    translateButton.disabled = false;
    translateButton.textContent = message('translate_button');
    status.textContent = '';
    preview.hidden = true;
    translated.value = '';
    updateLinks();
  }

  [query, source, target].forEach((input) => input.addEventListener('input', invalidate));
  engine.addEventListener('change', updateLinks);
  translated.addEventListener('input', updateLinks);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!query.value.trim()) { query.setCustomValidity(message('empty')); query.reportValidity(); return; }
    query.setCustomValidity('');
    const id = ++requestId;
    const text = query.value.trim();
    controller?.abort();
    controller = new AbortController();
    clearTimeout(timer);
    timer = setTimeout(() => controller.abort(), 8000);
    translateButton.disabled = true;
    translateButton.textContent = message('translating');
    form.setAttribute('aria-busy', 'true');
    preview.hidden = true;
    status.textContent = message('pending');
    try {
      const result = await translateQuery(text, source.value, target.value, { signal: controller.signal });
      if (id !== requestId) return;
      translated.value = result;
      preview.hidden = false;
      updateLinks();
      status.textContent = message('done');
    } catch (error) {
      if (id !== requestId) return;
      translated.value = '';
      preview.hidden = false;
      updateLinks();
      status.textContent = message('failed');
    } finally {
      if (id === requestId) {
        clearTimeout(timer);
        form.removeAttribute('aria-busy');
        translateButton.disabled = false;
        translateButton.textContent = message('translate_button');
      }
    }
  });

  document.querySelectorAll('[data-example-query]').forEach((button) => button.addEventListener('click', () => {
    query.value = button.dataset.exampleQuery;
    source.value = button.dataset.sourceLanguage || 'auto';
    target.value = button.dataset.targetLanguage || 'en';
    invalidate();
    query.focus();
  }));

  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(translated.value); status.textContent = message('copied'); }
    catch { translated.focus(); translated.select(); status.textContent = message('copy_failed'); }
  });
  updateLinks();
}
