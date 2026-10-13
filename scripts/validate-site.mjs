import fs from 'node:fs';
import path from 'node:path';
import { load } from 'cheerio';

const configured = JSON.parse(fs.readFileSync('site-config.json','utf8')).siteUrl;
const base = new URL(process.env.SITE_URL || configured);
if (!base.pathname.endsWith('/')) base.pathname += '/';
const sitemap = load(fs.readFileSync('sitemap.xml','utf8'),{xmlMode:true});
const urls=sitemap('url > loc').map((_,node)=>sitemap(node).text()).get();
if(urls.length!==15 || new Set(urls).size!==15)throw new Error('Expected 15 unique canonical URLs');
const hrefLangs=['en','zh-Hans','zh-Hant','x-default'];
const files=new Set();
for(const url of urls){
 const parsed=new URL(url);if(parsed.origin!==base.origin || !parsed.pathname.startsWith(base.pathname) || parsed.search || parsed.hash)throw new Error('Invalid sitemap URL '+url);
 const relative=decodeURIComponent(parsed.pathname.slice(base.pathname.length));const file=relative.endsWith('/')||!relative?relative+'index.html':relative+'.html';
 files.add(file);const $=load(fs.readFileSync(file,'utf8'));
 if($('link[rel="canonical"]').length!==1 || $('link[rel="canonical"]').attr('href')!==url)throw new Error('Canonical mismatch '+file);
 if(!$('title').text().trim() || !$('meta[name="description"]').attr('content')?.trim() || $('h1').length!==1)throw new Error('Missing content metadata '+file);
 if($('meta[name="robots"]').attr('content')?.includes('noindex'))throw new Error('Indexable page has noindex '+file);
 const alternates=$('link[rel="alternate"][hreflang]');
 if(alternates.length!==4)throw new Error('Missing alternates '+file);
 const links={};alternates.each((_,node)=>{links[$(node).attr('hreflang')]=$(node).attr('href');});
 for(const lang of hrefLangs)if(!urls.includes(links[lang]))throw new Error('Unknown alternate '+file+':'+lang);
 for(const target of Object.values(links)){
  const p=new URL(target).pathname.slice(base.pathname.length);const f=p.endsWith('/')||!p?p+'index.html':p+'.html';const other=load(fs.readFileSync(f,'utf8'));
  const reciprocal=other('link[rel="alternate"]').map((_,node)=>other(node).attr('href')).get();if(!reciprocal.includes(url))throw new Error('Nonreciprocal hreflang '+file);
 }
 $('script[type="application/ld+json"]').each((_,node)=>JSON.parse($(node).text()));
 const languageRoutes=JSON.parse($('#language-urls').text());
 for(const route of Object.values(languageRoutes))assertLocal(route,file);
 $('[href],[src]').each((_,node)=>{const value=$(node).attr('href')||$(node).attr('src');if(value&&!/^(https?:|mailto:|#)/.test(value))assertLocal(value,file);});
 $('[data-i18n]').each((_,node)=>{const value=node.tagName==='meta'?$(node).attr('content'):$(node).text();if(!value?.trim())throw new Error('Unrendered translation '+file+':'+$(node).attr('data-i18n'));});
}
function assertLocal(value,file){
 const [pathname]=value.split(/[?#]/);let target=path.posix.normalize(path.posix.join(path.posix.dirname(file),pathname));if(target==='.'||value.endsWith('/'))target=(target==='.'?'':target+'/')+'index.html';
 if(!fs.existsSync(target))throw new Error('Missing local target '+file+' -> '+value+' ('+target+')');
}
for(const prefix of ['','zh-Hans/','zh-Hant/']){
 const $=load(fs.readFileSync(prefix+'how_to_use.html','utf8'));if(!$('meta[http-equiv="refresh"]').attr('content')?.includes('help.html') || !$('meta[name="robots"]').attr('content')?.includes('noindex'))throw new Error('Invalid legacy help redirect');
}
if(!fs.readFileSync('robots.txt','utf8').includes(new URL('sitemap.xml',base).href))throw new Error('Sitemap not declared');
if(!fs.readFileSync('llms.txt','utf8').startsWith('# Translate & Search'))throw new Error('Missing llms.txt project title');
console.log(`Validated ${files.size} canonical pages: metadata, static translations, reciprocal hreflang, local resources, structured data, and compatibility redirects.`);
