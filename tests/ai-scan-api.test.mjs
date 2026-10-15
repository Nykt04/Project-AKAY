import test from 'node:test';
import assert from 'node:assert/strict';
import { createScanService, createScanHandler } from '../server/scan-service.mjs';
import { Readable } from 'node:stream';

const env={GEMINI_API_KEY:'test-key-never-real',AI_SCAN_ACCESS_CODE:'test-staff-code-12345'};
const request={accessCode:env.AI_SCAN_ACCESS_CODE,body:{image:'data:image/jpeg;base64,/9j/AA==',consent:true}};
const graph={nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b'}],notes:[]};
const successful=()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(graph)}]}}]}),{status:200});
test('AI endpoint requires server configuration and correct staff code before contacting Google',async()=>{
  let calls=0;const fetchImpl=async()=>{calls++;return successful();};
  assert.equal((await createScanService({env:{},fetchImpl})(request)).status,503);
  assert.equal((await createScanService({env,fetchImpl})({...request,accessCode:'wrong'})).status,401);
  assert.equal(calls,0);
});
test('AI rejects missing consent, oversized uploads, invalid MIME and external URLs',async()=>{
  let calls=0;const scan=createScanService({env,fetchImpl:async()=>{calls++;return successful();}});
  assert.equal((await scan({...request,body:{...request.body,consent:false}})).status,400);
  assert.equal((await scan({...request,body:{...request.body,image:'x'.repeat(2_200_001)}})).status,413);
  assert.equal((await scan({...request,body:{...request.body,image:'https://example.com/plan.png'}})).status,400);
  assert.equal((await scan({...request,body:{...request.body,image:'data:image/png;base64,/9j/AA=='}})).status,400);
  assert.equal(calls,0);
});
test('server calls only the fixed Google endpoint with structured output, keeping secrets out of the result',async()=>{
  let sent;
  const scan=createScanService({env,fetchImpl:async(url,options)=>{sent={url,options};return successful();}});
  const result=await scan(request);
  assert.equal(result.status,200);assert.deepEqual(result.body.graph,graph);
  assert.match(sent.url,/^https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/gemini-3.8-flash:generateContent$/);
  assert.equal(sent.options.headers['x-goog-api-key'],env.GEMINI_API_KEY);
  assert.ok(JSON.parse(sent.options.body).generationConfig.responseJsonSchema);
  assert.ok(!JSON.stringify(result).includes(env.GEMINI_API_KEY));
  assert.equal((await scan(request)).status,429);
});
test('quota, authentication, timeout and truncated responses have explicit errors without retry',async()=>{
  for(const upstream of [429,403,404,500]){
    let calls=0;const result=await createScanService({env,fetchImpl:async()=>{calls++;return new Response('secret upstream details',{status:upstream});}})(request);
    assert.equal(result.status,upstream===429?429:502);assert.equal(calls,1);assert.ok(!JSON.stringify(result).includes('secret upstream'));
  }
  const timeout=await createScanService({env,fetchImpl:async()=>{throw new DOMException('timeout','TimeoutError');}})(request);
  assert.match(timeout.body.error,/timed out/);
  const truncated=await createScanService({env,fetchImpl:async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(graph)}]}}]}))})(request);
  assert.equal(truncated.status,502);
});
test('malformed AI JSON never becomes a success result',async()=>{
  const response=()=>new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:'not json'}]}}]}));
  assert.equal((await createScanService({env,fetchImpl:async()=>response()})(request)).status,502);
});
test('HTTP adapter parses JSON and returns a no-store configuration error without a key',async()=>{
  const req=Readable.from([JSON.stringify(request.body)]);req.method='POST';req.headers={'x-scan-code':request.accessCode};
  let status,body;const headers={};const res={setHeader:(key,value)=>headers[key]=value,set statusCode(value){status=value;},end:value=>body=JSON.parse(value)};
  await createScanHandler({env:{}})(req,res);
  assert.equal(status,503);assert.match(body.error,/not configured/);assert.equal(headers['Cache-Control'],'no-store');
});
