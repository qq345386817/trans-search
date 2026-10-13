import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const publicFiles = [
  'index.html', 'about.html', 'help.html', 'privacy.html', 'faq.html', 'how_to_use.html',
  'styles.css', 'translations.js', 'i18n.js', 'search.js', 'search-core.js',
  'robots.txt', 'sitemap.xml', 'llms.txt', 'zh-Hans', 'zh-Hant',
];
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
for (const file of publicFiles) fs.cpSync(file, `dist/${file}`, { recursive: true });
for (const prefix of ['', 'zh-Hans/', 'zh-Hant/']) {
  for (const page of ['index', 'about', 'help', 'privacy', 'faq', 'how_to_use']) {
    const filename = `dist/${prefix}${page}.html`;
    const $ = load(fs.readFileSync(filename, 'utf8'));
    $('script[src],link[rel="stylesheet"]').each((_, node) => {
      const resource = $(node).attr('src') || $(node).attr('href');
      if (!fs.existsSync(path.resolve(path.dirname(filename), resource))) {
        throw new Error(`Missing deployed asset: ${filename} -> ${resource}`);
      }
    });
  }
}
// A real 404 prevents nonexistent paths from looking like duplicate homepages.
fs.writeFileSync('dist/404.html', '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Page not found | Translate & Search</title><h1>Page not found</h1><p><a href="/">Return to Translate &amp; Search</a></p></html>\n');
console.log('Packaged public website into dist/');
