const encoder=new TextEncoder();
export async function validateInitData(initData,token,now=Math.floor(Date.now()/1000)){
 if(!initData||!token)return null;
 const p=new URLSearchParams(initData);const hash=p.get('hash'),auth=Number(p.get('auth_date'));
 if(!hash||!Number.isSafeInteger(auth)||auth>now+60||auth<now-3600)return null;
 const seen=new Set();const entries=[];
 for(const [k,v] of p){if(seen.has(k))return null;seen.add(k);if(k!=='hash'&&k!=='signature')entries.push([k,v]);}
 const check=entries.sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,v])=>k+'='+v).join('\n');
 const secret=await crypto.subtle.sign('HMAC',await crypto.subtle.importKey('raw',encoder.encode('WebAppData'),{name:'HMAC',hash:'SHA-256'},false,['sign']),encoder.encode(token));
 const signature=await crypto.subtle.sign('HMAC',await crypto.subtle.importKey('raw',secret,{name:'HMAC',hash:'SHA-256'},false,['sign']),encoder.encode(check));
 const wanted=[...new Uint8Array(signature)].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(hash.length!==wanted.length||!/^[0-9a-f]{64}$/i.test(hash))return null;
 let mismatch=0;for(let i=0;i<wanted.length;i++)mismatch|=wanted.charCodeAt(i)^hash.toLowerCase().charCodeAt(i);
 if(mismatch)return null;
 try{const user=JSON.parse(p.get('user')||'null');if(!user||!Number.isSafeInteger(user.id)||user.id<=0)return null;return user;}catch{return null;}
}
