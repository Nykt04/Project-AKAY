import fs from 'node:fs/promises';
import {loadEnv} from 'vite';
import {createScanService} from '../server/scan-service.mjs';
const env={...loadEnv('development',process.cwd(),''),...process.env};
const image='data:image/png;base64,'+(await fs.readFile('C:/Users/Gian Karlo/Downloads/office-building.png')).toString('base64');
const fetchImpl=async(url,options)=>{
  const body=JSON.parse(options.body);body.generationConfig.thinkingConfig={thinkingLevel:'HIGH'};
  return fetch(url,{...options,body:JSON.stringify(body)});
};
const started=performance.now();
const response=await createScanService({env,fetchImpl})({accessCode:env.AI_SCAN_ACCESS_CODE,body:{image,consent:true}});
const summary={status:response.status,durationMs:Math.round(performance.now()-started),error:response.body.error,model:response.body.model,nodes:response.body.graph?.nodes?.length,edges:response.body.graph?.edges?.length,thinking:'HIGH'};
console.log(JSON.stringify(summary));
if(response.status===200)await fs.writeFile('.artifacts/office-ai-high-result.json',JSON.stringify({...response.body,measurement:summary},null,2));
