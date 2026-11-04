import fs from 'node:fs/promises';
const path='src/usability.css';
let css=await fs.readFile(path,'utf8');
const replacements={
  '#bfb7a5':'var(--line)', '#eee7d8':'var(--paper)', '#e6eadf':'#eeece4',
  '#c9c1ad':'var(--line)', '#fcfaf3':'var(--paper)', '#53604e':'var(--green)',
  '#bfc7b6':'var(--line)', '#f4f5ec':'var(--paper)', '#e6ecdd':'#eeece4',
  '#58624f':'var(--muted)', '#eceee3':'var(--paper)', '#43573d':'var(--green)',
  '#5c6453':'var(--muted)', '#fff':'var(--paper)', '#c4ceb7':'var(--line)',
  '#3e5438':'var(--green)', '#e9eee0':'var(--paper)', '#d4ccb9':'var(--line)',
  '#465b3c':'var(--green)', '#5a624f':'var(--muted)'
};
css=css.replace(/#[\da-f]{3,8}\b/gi,color=>replacements[color]??color);
css=css.replace('box-shadow: 0 8px 20px #493c2220','box-shadow: var(--raised)');
css=css.replace(/font-size: (10|11)px/g,'font-size: 12px');
await fs.writeFile(path,css);
