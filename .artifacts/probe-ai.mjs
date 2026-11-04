import {loadEnv} from 'vite';
const env={...loadEnv('development',process.cwd(),''),...process.env};
const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:'Reply with OK.'}]}],generationConfig:{maxOutputTokens:20}}),signal:AbortSignal.timeout(30000)});
const data=await response.json();
console.log(JSON.stringify({status:response.status,error:data.error,finishReason:data.candidates?.[0]?.finishReason,text:data.candidates?.[0]?.content?.parts?.filter(p=>!p.thought).map(p=>p.text).join('')}).replaceAll(env.GEMINI_API_KEY,'[redacted]').replaceAll(env.AI_SCAN_ACCESS_CODE,'[redacted]'));
