import fs from 'node:fs/promises';
import {loadEnv} from 'vite';
import {createScanService} from '../server/scan-service.mjs';
const env={...loadEnv('development',process.cwd(),''),...process.env};
const sanitize=value=>String(value).replaceAll(env.GEMINI_API_KEY,'[redacted]').replaceAll(env.AI_SCAN_ACCESS_CODE,'[redacted]').slice(0,1600);
const scan=createScanService({env,fetchImpl:async(url,options)=>{
 if(process.argv.includes('--without-thinking')){const body=JSON.parse(options.body);delete body.generationConfig.thinkingConfig;options={...options,body:JSON.stringify(body)};}
 if(process.argv.includes('--legacy-schema')){const body=JSON.parse(options.body);body.generationConfig.responseSchema=body.generationConfig.responseJsonSchema;delete body.generationConfig.responseJsonSchema;options={...options,body:JSON.stringify(body)};}
 if(process.argv.includes('--simple-bounds')){const body=JSON.parse(options.body);body.generationConfig.responseJsonSchema=JSON.parse(JSON.stringify(body.generationConfig.responseJsonSchema,(key,value)=>['maxItems','minimum','maximum'].includes(key)?undefined:value));options={...options,body:JSON.stringify(body)};}
 const response=await fetch(url,options);
 if(!response.ok){const payload=await response.clone().json().catch(()=>({}));console.log(JSON.stringify({providerStatus:response.status,error:sanitize(JSON.stringify(payload.error??{}))}));}
 return response;
}});
const image='data:image/png;base64,'+(await fs.readFile('public/assets/floor-0.png')).toString('base64');
const start=performance.now();
const result=await scan({accessCode:env.AI_SCAN_ACCESS_CODE,body:{image,consent:true}});
console.log(JSON.stringify({status:result.status,durationMs:Math.round(performance.now()-start),error:result.body.error,nodes:result.body.graph?.nodes.length,edges:result.body.graph?.edges.length}));
if(result.status===200)await fs.writeFile('.artifacts/live-ai-result.json',JSON.stringify(result.body));
