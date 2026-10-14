import test from 'node:test';
import assert from 'node:assert/strict';
import { translateLocally, translateQuery } from '../search-core.js';

test('local mode reports missing APIs without invoking a remote provider', async () => {
  await assert.rejects(translateLocally('private query', 'en', 'fr', { Translator: null }), /unavailable/);
});

test('local translation normalizes Chinese codes and releases its model', async () => {
  let options, destroyed = 0;
  const Translator = { availability: async () => 'available', create: async value => {
    options = value; return { translate: async text => '  本機譯文  ', destroy: () => destroyed++ };
  } };
  assert.equal(await translateLocally('text', 'zh-CN', 'zh-TW', { Translator }), '本機譯文');
  assert.equal(options.sourceLanguage, 'zh'); assert.equal(options.targetLanguage, 'zh-Hant'); assert.equal(destroyed, 1);
});

test('low-confidence detection requests a language instead of guessing', async () => {
  let destroyed = 0, translated = 0;
  const LanguageDetector = { availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'fr', confidence: 0.2 }], destroy: () => destroyed++ }) };
  await assert.rejects(translateLocally('short', 'auto', 'en', { Translator: { create: () => translated++ }, LanguageDetector }), /source language/);
  assert.equal(destroyed, 1); assert.equal(translated, 0);
});

test('automatic local detection can bypass translation for the same language', async () => {
  const LanguageDetector = { availability: async () => 'available', create: async () => ({ detect: async () => [{ detectedLanguage: 'en', confidence: 0.9 }], destroy() {} }) };
  assert.equal(await translateLocally('hello world', 'auto', 'en', { Translator: {}, LanguageDetector }), 'hello world');
});

test('cancellation releases a model which finishes creating after abort', async () => {
  const controller = new AbortController(); let resolveModel, destroyed = 0;
  const Translator = { availability: async () => 'available', create: () => new Promise(resolve => { resolveModel = resolve; }) };
  const translation = translateLocally('private query', 'en', 'fr', { Translator, signal: controller.signal });
  // Allow the availability check to complete before cancelling model creation.
  await new Promise(resolve => setImmediate(resolve)); controller.abort();
  await assert.rejects(translation, { name: 'AbortError' });
  resolveModel({ destroy: () => destroyed++ }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(destroyed, 1);
});

test('transient online failure retries once with the same provider and omitted credentials', async () => {
  const requests = [];
  const result = await translateQuery('hello', 'en', 'fr', { fetchImpl: async (url, options) => {
    requests.push({ url, options }); return requests.length === 1 ? { ok: false, status: 503 } : { ok: true, json: async () => [[['bonjour']]] };
  } });
  assert.equal(result, 'bonjour'); assert.equal(requests.length, 2);
  assert.equal(requests[0].url, requests[1].url); assert.equal(requests[1].options.credentials, 'omit');
});

test('permanent online errors and user cancellation are not retried', async () => {
  let calls = 0;
  await assert.rejects(translateQuery('hello', 'en', 'fr', { fetchImpl: async () => { calls++; return { ok: false, status: 400 }; } }), /400/);
  assert.equal(calls, 1);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(translateQuery('hello', 'en', 'fr', { signal: controller.signal, fetchImpl: () => calls++ }), { name: 'AbortError' });
  assert.equal(calls, 1);
});
