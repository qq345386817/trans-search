import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const locales = JSON.parse(fs.readFileSync('site-locales.json','utf8'));
const pages = JSON.parse(fs.readFileSync('site-pages.json','utf8'));
const publicFiles = [
  'assets/', 'index.html', 'about.html', 'help.html', 'privacy.html', 'faq.html', 'how_to_use.html',
  'styles.css', 'i18n.js', 'search.js', 'search-core.js',
  'robots.txt', 'sitemap.xml', 'llms.txt', '_headers', 'technical-search.html', 'learning-search.html',
  ...locales.filter(locale => locale.prefix).map(locale => locale.prefix),
];
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
for (const file of publicFiles) fs.cpSync(file, `dist/${file}`, { recursive: true });
for (const {prefix} of locales) {
  for (const page of [...pages,'how_to_use']) {
    const filename = `dist/${prefix}${page}.html`;
    const $ = load(fs.readFileSync(filename, 'utf8'));
    $('script[src],link[rel="stylesheet"]').each((_, node) => {
      const resource = ($(node).attr('src') || $(node).attr('href')).split(/[?#]/)[0];
      if (!fs.existsSync(path.resolve(path.dirname(filename), resource))) {
        throw new Error(`Missing deployed asset: ${filename} -> ${resource}`);
      }
    });
  }
}
// A real 404 prevents nonexistent paths from looking like duplicate homepages.
fs.writeFileSync('dist/404.html', '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | Translate & Search</title><h1>Page not found</h1><p><a href="/">Return to Translate &amp; Search</a></p></html>\n');
console.log('Packaged public website into dist/');
