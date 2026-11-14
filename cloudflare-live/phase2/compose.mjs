export function compose(source,js,css){
 function transform(name,fn){const marker='const '+name+'=',start=source.indexOf(marker)+marker.length,end=source.indexOf(';\n',start);if(start<marker.length||end<start)throw Error('Missing bundle '+name);source=source.slice(0,start)+JSON.stringify(fn(JSON.parse(source.slice(start,end))))+source.slice(end);}
 transform('SITE_APP',app=>{const i=app.indexOf('/* Candidate six-card information architecture, safe preview */');if(i<0)throw Error('Unexpected baseline');const prefix=app.slice(0,i);if(!prefix.includes('let seen=false;try'))throw Error('Missing guide hook');return prefix.replace('let seen=false;try','overlay.addEventListener("candidate:guide",show);let seen=false;try')+js;});
 transform('SITE_CSS',base=>base+'\n'+css);return source;
}
