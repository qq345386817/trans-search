import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchUrl, parseTranslation, translateQuery } from '../search-core.js';

for (const [engine,param] of [['google','q'],['bing','q'],['baidu','wd'],['sogou','query']]) {
 test(`${engine} preserves literal search syntax`,()=>{
  const query='"OAuth 2.0" C++ 100% 跨语言';const url=new URL(buildSearchUrl(engine,query));
  assert.equal(url.protocol,'https:');assert.equal(url.searchParams.get(param),query);
 });
}
test('unknown engines and empty input do not produce search URLs',()=>{
 assert.throws(()=>buildSearchUrl('javascript','test'));assert.throws(()=>buildSearchUrl('google','  '));
});
test('translation parsing joins segments without inventing spaces',()=>{
 assert.equal(parseTranslation([[['Cross-language ','跨语言'],['search','搜索']]]),'Cross-language search');
 assert.throws(()=>parseTranslation({error:'failed'}));assert.throws(()=>parseTranslation([[]]));
});
test('translation uses a credential-free request and preserves target and query',async()=>{
 let request;
 const result=await translateQuery('跨语言搜索','auto','en',{fetchImpl:async(url,options)=>{request={url:new URL(url),options};return {ok:true,json:async()=>[[['Cross-language search','跨语言搜索']]]};}});
 assert.equal(result,'Cross-language search');assert.equal(request.url.searchParams.get('q'),'跨语言搜索');assert.equal(request.url.searchParams.get('tl'),'en');assert.equal(request.options.credentials,'omit');
});
test('same-language translation bypasses the network',async()=>{
 let calls=0;assert.equal(await translateQuery('hello','en','en',{fetchImpl:()=>{calls++;}}),'hello');assert.equal(calls,0);
});
test('network errors propagate so the UI can offer manual translation',async()=>{
 await assert.rejects(translateQuery('你好','auto','en',{fetchImpl:async()=>({ok:false,status:503})}),/503/);
});
