const PATH=/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;
function pathOK(value:any){return typeof value==='string'&&value.length<=160&&PATH.test(value);}
function at(value:any,path:string){for(const key of path.split('.')){if(value===null||typeof value!=='object'||!Object.hasOwn(value,key))return undefined;value=value[key];}return value;}
export function templateDefinition(o:any){
 const v:any={};
 if(o.token_response_path!==undefined){if(o.token_response_path!==''&&!pathOK(o.token_response_path))throw Error('Invalid token response path');v.token_response_path=o.token_response_path;}
 if(o.token_types!==undefined){if(!Array.isArray(o.token_types)||!o.token_types.length||o.token_types.length>8||o.token_types.some((x:any)=>typeof x!=='string'||! /^[a-z][a-z0-9_-]{0,31}$/i.test(x)))throw Error('Invalid token type labels');v.token_types=[...new Set(o.token_types.map((x:string)=>x.toLowerCase()))];}
 if(o.verification_method!==undefined){if(!['GET','POST'].includes(o.verification_method))throw Error('Invalid verification method');v.verification_method=o.verification_method;}
 if(o.verification_success!==undefined){const p=o.verification_success;if(!p||typeof p!=='object'||Array.isArray(p)||!pathOK(p.path)||!Object.hasOwn(p,'equals')||Object.keys(p).some(k=>!['path','equals'].includes(k))||(p.equals!==null&&!['string','boolean','number'].includes(typeof p.equals))||(typeof p.equals==='number'&&!Number.isFinite(p.equals)))throw Error('Invalid verification success condition');v.verification_success={path:p.path,equals:p.equals};}
 return v;
}
export function normalizeTokenResponse(data:any,template:any={}){
 const o=templateDefinition(template),t=o.token_response_path?at(data,o.token_response_path):data;
 if(!t||typeof t!=='object'||Array.isArray(t)||typeof t.access_token!=='string'||!t.access_token)throw Error('Provider returned no access token at configured response path');
 if(t.token_type&&(typeof t.token_type!=='string'||!(o.token_types??['bearer']).includes(t.token_type.toLowerCase())))throw Error('Provider returned an unsupported token type');
 if(t.refresh_token!=null&&typeof t.refresh_token!=='string')throw Error('Provider returned an invalid refresh token');
 return {access_token:t.access_token,token_type:'bearer',...(typeof t.refresh_token==='string'?{refresh_token:t.refresh_token}:{}),...(t.expires_in!==undefined?{expires_in:t.expires_in}:{}),...(typeof t.scope==='string'?{scope:t.scope}:{})};
}
export function verificationPassed(httpOK:boolean,text:string,truncated:boolean,template:any={}){
 const p=templateDefinition(template).verification_success;
 if(!httpOK)return false;
 if(!p)return true;
 if(truncated)return false;
 try{return at(JSON.parse(text),p.path)===p.equals;}catch{return false;}
}
