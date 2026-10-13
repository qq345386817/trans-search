import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { load } from 'cheerio';

const configuration = JSON.parse(fs.readFileSync('site-config.json','utf8'));
const siteUrl = new URL(process.env.SITE_URL || configuration.siteUrl);
if (!siteUrl.pathname.endsWith('/')) siteUrl.pathname += '/';
if (siteUrl.search || siteUrl.hash || !['http:','https:'].includes(siteUrl.protocol)) throw new Error('Invalid site URL');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('translations.js','utf8'),context);
const copy = context.window.TRANS_SEARCH_I18N;
const locales = [{lang:'en',hrefLang:'en',prefix:''},{lang:'zh-CN',hrefLang:'zh-Hans',prefix:'zh-Hans/'},{lang:'zh-TW',hrefLang:'zh-Hant',prefix:'zh-Hant/'}];
const pages = ['index','about','help','privacy','faq'];
const getCopy = (lang,key) => { const [scope,name] = key.split('.'); const value = copy.translations[lang]?.[scope]?.[name] ?? copy.pages[scope]?.[name]; if (value === undefined) throw new Error(`Missing copy ${lang}:${key}`); return value; };
const route = (locale,page) => locale.prefix + (page === 'index' ? '' : page+'.html');
// Cloudflare Pages redirects .html requests to extensionless routes.
const canonical = (locale,page) => new URL(route(locale,page).replace(/\.html$/, ''),siteUrl).href;
function relativePage(from,locale,page) {
  const target = route(locale,page);
  const href = path.posix.relative(path.posix.dirname(from),target || '.') || '.';
  return href + (page === 'index' ? '/' : '');
}
const recordPath='scripts/page-lastmod.json';
const lastmod = fs.existsSync(recordPath) ? JSON.parse(fs.readFileSync(recordPath,'utf8')) : {};
const sitemap=[];
for (const locale of locales) for (const page of [...pages,'how_to_use']) {
  const filename=locale.prefix+page+'.html';
  const $=load(fs.readFileSync('_templates/'+page+'.html','utf8'));
  $('html').attr('lang',locale.lang).attr('data-page-name',page);
  $('body').attr('data-lang',locale.lang);
  $('[data-i18n]').each((_,element) => {
    const node=$(element);const value=getCopy(locale.lang,node.attr('data-i18n'));
    if (element.tagName === 'meta') node.attr('content',value);
    else if (node.attr('data-i18n-html') === 'true') node.html(value);
    else node.text(value);
  });
  $('[data-i18n-placeholder]').each((_,element)=>$(element).attr('placeholder',getCopy(locale.lang,$(element).attr('data-i18n-placeholder'))));
  $('title').text(getCopy(locale.lang,`${page}.meta_title`));
  for (const selector of ['link[rel="stylesheet"]','script[src]']) $(selector).each((_,element)=>{ const node=$(element);const attribute=element.tagName==='link'?'href':'src';node.attr(attribute,(locale.prefix?'../':'')+node.attr(attribute)); });
  $('link[rel="canonical"],link[rel="alternate"],meta[property^="og:"],meta[name^="twitter:"],script[type="application/ld+json"],script#language-urls').remove();
  const pageUrl=canonical(locale,page==='how_to_use'?'help':page);
  $('head').append($('<link rel="canonical">').attr('href',pageUrl));
  for(const alternate of locales) $('head').append($('<link rel="alternate">').attr({hreflang:alternate.hrefLang,href:canonical(alternate,page==='how_to_use'?'help':page)}));
  $('head').append($('<link rel="alternate" hreflang="x-default">').attr('href',canonical(locales[0],page==='how_to_use'?'help':page)));
  const description=getCopy(locale.lang,`${page}.meta_description`);
  for(const [property,content]of Object.entries({'og:type':'website','og:title':$('title').text(),'og:description':description,'og:url':pageUrl,'og:site_name':'Translate & Search'})) $('head').append($('<meta>').attr({property,content}));
  $('head').append($('<meta name="twitter:card" content="summary">'));
  $('head').append($('<link rel="describedby" type="text/plain">').attr('href',new URL('llms.txt',siteUrl).href));
  const languageUrls=Object.fromEntries(locales.map(alternate=>[alternate.lang,relativePage(filename,alternate,page==='how_to_use'?'help':page)]));
  $('head').append($('<script type="application/json" id="language-urls">').text(JSON.stringify(languageUrls)));
  $('a[href]').each((_,element)=>{ const node=$(element);const href=node.attr('href');if(/^index\.html(?:#|$)/.test(href))node.attr('href',href.replace(/^index\.html/,'./')); });
  const switcher=$('[data-lang-switcher]');switcher.empty();
  for(const alternate of locales) { const option=$('<option>').attr('value',alternate.lang).text(copy.languages[alternate.lang]);if(alternate.lang===locale.lang)option.attr('selected','selected');switcher.append(option); }
  switcher.attr('aria-label',getCopy(locale.lang,'common.language_label'));
  const graph=[{'@type':'WebSite','@id':new URL('#website',siteUrl).href,name:'Translate & Search',url:siteUrl.href},{'@type':page==='faq'?'FAQPage':'WebPage','@id':pageUrl+'#page',url:pageUrl,name:$('title').text(),description,inLanguage:locale.lang,isPartOf:{'@id':new URL('#website',siteUrl).href}}];
  if(page==='index')graph.push({'@type':'WebApplication','@id':pageUrl+'#tool',name:'Translate & Search',url:pageUrl,description:getCopy(locale.lang,'tool.intro'),applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,inLanguage:locale.lang});
  if(page==='faq')graph[1].mainEntity=Array.from({length:7},(_,index)=>({'@type':'Question',name:getCopy(locale.lang,`faq.q${index+1}`),acceptedAnswer:{'@type':'Answer',text:getCopy(locale.lang,`faq.a${index+1}`)}}));
  $('head').append($('<script type="application/ld+json">').text(JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')));
  if(page==='how_to_use'){
    $('meta[http-equiv="refresh"]').remove();
    $('head').append($('<meta name="robots" content="noindex,follow">'));
    $('head').append($('<meta http-equiv="refresh">').attr('content','0; url='+relativePage(filename,locale,'help')));
  }
  let html=$.html().split('\n').map(line=>line.trimEnd()).join('\n')+'\n';
  const hash=crypto.createHash('sha256').update(html).digest('hex');
  if(lastmod[filename]?.hash!==hash)lastmod[filename]={hash,date:new Date().toISOString().slice(0,10)};
  fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,html);
  if(pages.includes(page))sitemap.push(`<url><loc>${pageUrl}</loc><lastmod>${lastmod[filename].date}</lastmod>${locales.map(alternate=>`<xhtml:link rel="alternate" hreflang="${alternate.hrefLang}" href="${canonical(alternate,page)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${canonical(locales[0],page)}"/></url>`);
}
fs.writeFileSync(recordPath,JSON.stringify(lastmod,null,2)+'\n');
fs.writeFileSync('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+sitemap.join('\n')+'\n</urlset>\n');
fs.writeFileSync('robots.txt',`User-agent: *\nAllow: /\nDisallow: ${siteUrl.pathname}_templates/\nDisallow: ${siteUrl.pathname}scripts/\nDisallow: ${siteUrl.pathname}tests/\nDisallow: ${siteUrl.pathname}node_modules/\n\nSitemap: ${new URL('sitemap.xml',siteUrl).href}\n`);
fs.writeFileSync('llms.txt',`# Translate & Search\n\n> An online search-query translation tool and a browser-extension project for cross-language search.\n\nThe website translates user-entered queries with Google’s web translation endpoint, lets the user edit the translation, and opens Google, Bing, Baidu, or Sogou in a separate tab. It does not translate entire results pages or guarantee better results. No account or saved query-history database is used. Queries are sent to third-party services; hosting access logs may exist.\n\nThe companion app and Safari/Chromium extension are in development and have not officially launched. The extension can automatically or manually translate queries on supported search results pages; the companion Apple app helps enable the Safari extension.\n\n## Main pages\n\n- [Online tool](${siteUrl.href}): English tool and product overview.\n- [简体中文工具](${new URL('zh-Hans/',siteUrl).href}): Chinese-language tool and overview.\n- [繁體中文工具](${new URL('zh-Hant/',siteUrl).href}): Traditional Chinese tool and overview.\n- [FAQ](${new URL('faq',siteUrl).href}): Scope, usage, privacy, limitations, and troubleshooting.\n- [App and extension](${new URL('about',siteUrl).href}): Product capabilities and development status.\n- [Help](${new URL('help',siteUrl).href}): Browser-extension setup and usage.\n- [Privacy](${new URL('privacy',siteUrl).href}): Query processing, local extension storage, and third-party services.\n\n## Source\n\n- [Website source](https://github.com/qq345386817/trans-search): Website implementation.\n`);
console.log(`Rendered ${sitemap.length} canonical pages and 3 compatibility pages for ${siteUrl.href}`);
