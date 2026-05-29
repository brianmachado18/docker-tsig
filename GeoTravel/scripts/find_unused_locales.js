const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'frontend', 'src');
const localesDir = path.join(srcDir, 'locales');

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function collectKeys(obj, prefix=''){
  const keys = [];
  for(const k of Object.keys(obj)){
    const v = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if(typeof v === 'object'){
      keys.push(...collectKeys(v,p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

function walkDir(dir, fileList=[]){
  const entries = fs.readdirSync(dir,{withFileTypes:true});
  for(const e of entries){
    const full = path.join(dir,e.name);
    if(e.isDirectory()){
      // skip stitch folder
      if(full.includes(path.sep + 'stitch' + path.sep)) continue;
      walkDir(full,fileList);
    } else {
      // only scan .jsx, .js, .md files under src
      if(/\.(jsx|js|ts|tsx|md|html)$/.test(e.name)) fileList.push(full);
    }
  }
  return fileList;
}

function gatherUsedKeys(files){
  const used = new Set();
  const re = /t\(['\"]([a-zA-Z0-9_.-]+)['\"]\)/g;
  for(const f of files){
    try{
      const txt = fs.readFileSync(f,'utf8');
      let m;
      while((m=re.exec(txt))!==null){
        used.add(m[1]);
      }
    }catch(e){/*ignore*/}
  }
  return used;
}

function main(){
  const files = walkDir(srcDir);
  const used = gatherUsedKeys(files);
  const localeFiles = fs.readdirSync(localesDir).filter(f=>f.endsWith('.json'));
  const report = {};
  for(const lf of localeFiles){
    const file = path.join(localesDir, lf);
    const json = readJson(file);
    const keys = collectKeys(json);
    const unused = keys.filter(k=>!used.has(k));
    report[lf] = { total: keys.length, used: keys.filter(k=>used.has(k)).length, unused };
  }
  console.log(JSON.stringify({used:Array.from(used).sort(), report}, null, 2));
}

main();
