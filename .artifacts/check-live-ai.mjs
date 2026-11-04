import fs from 'node:fs/promises';
import {loadEnv} from 'vite';
const env={...loadEnv('development',process.cwd(),''),...process.env};
const image='data:image/png;base64,'+(await fs.readFile('public/assets/floor-0.png')).toString('base64');
try {
 const started=performance.now();
 const response=await fetch('http://127.0.0.1:5173/api/scan-floor-plan',{method:'POST',headers:{'Content-Type':'application/json','x-scan-code':env.AI_SCAN_ACCESS_CODE},body:JSON.stringify({image,consent:true}),signal:AbortSignal.timeout(65000)});
 const data=await response.json();
 console.log(JSON.stringify({stage:'configured endpoint',status:response.status,durationMs:Math.round(performance.now()-started),error:data.error,model:data.model,nodes:data.graph?.nodes?.length,edges:data.graph?.edges?.length}));
 if(response.ok)await fs.writeFile('.artifacts/live-ai-result.json',JSON.stringify(data));
} catch {console.log('Local endpoint could not be reached.');}
if(process.argv.includes('--list-models'))try {
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':env.GEMINI_API_KEY},signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 console.log(JSON.stringify({stage:'provider model availability',status:response.status,models:data.models?.filter(m=>m.name.includes('flash')&&m.supportedGenerationMethods?.includes('generateContent')).map(m=>({name:m.name,displayName:m.displayName}))}));
} catch {console.log('Provider model list could not be reached.');}
