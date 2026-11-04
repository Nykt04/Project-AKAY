import fs from 'node:fs/promises';
for(const file of ['.env','.env.local','.env.development','.env.development.local']){
 let value;try{value=await fs.readFile(file,'utf8');}catch{continue;}
 const next=value.replace(/^(\s*GEMINI_MODEL\s*=\s*)["']?Gemini-3\.5 Flash-Lite["']?(\s*(?:#.*)?)$/m,'$1gemini-3.5-flash-lite$2');
 if(next!==value){await fs.writeFile(file,next);console.log(`Corrected GEMINI_MODEL in ${file}.`);}
}
