'use strict';
const BASE='https://vulazhgszvxpxqdcfllq.supabase.co/functions/v1/mini-terminal-connections';
const statusEl=document.querySelector('#status'),form=document.querySelector('#form'),fields=document.querySelector('#fields');
const state=new URLSearchParams(location.search).get('s');
let config;
async function request(path,options={}){
 const r=await fetch(BASE+path,{...options,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(d.error||'Request failed: '+r.status);
 return d;
}
function updateClientSecret(){
 const method=form.elements.namedItem('token_auth_method'),secret=form.elements.namedItem('client_secret');
 if(!method||!secret)return;
 const needed=method.value!=='none';
 secret.disabled=!needed;secret.required=needed;
 const label=fields.querySelector('[data-field="client_secret"]');if(label)label.hidden=!needed;
 if(!needed)secret.value='';
}
function render(d){
 if(!d||!Array.isArray(d.fields))throw Error('Invalid connection setup response');
 config=d;fields.replaceChildren();
 document.querySelector('h1').textContent='Connect '+(d.name||'endpoint');
 document.querySelector('#intro').textContent=d.message||(d.mode==='oauth'?'Continue to the provider’s own login and consent page. Never enter your provider account password here.':'Enter credentials only here, not in chat. Values are stored in your MiniTerminal vault.');
 const names=new Set();
 for(const f of d.fields){
  if(typeof f.name!=='string'||!f.name||names.has(f.name))throw Error('Invalid setup field');
  names.add(f.name);
  const label=document.createElement('label'),caption=document.createElement('span');
  label.dataset.field=f.name;caption.textContent=f.label||f.name;label.append(caption);
  let input;
  if(Array.isArray(f.options)){
   input=document.createElement('select');
   for(const item of f.options){const option=document.createElement('option');option.value=typeof item==='string'?item:item.value;option.textContent=typeof item==='string'?item:item.label;input.append(option);}
  }else{input=document.createElement('input');input.type=f.secret===true||f.secret===undefined?'password':f.type==='url'?'url':'text';input.maxLength=10000;input.autocomplete='off';input.spellcheck=false;}
  input.name=f.name;input.id='field-'+f.name;input.required=f.required!==false;
  if(f.secret===false&&typeof f.value==='string')input.value=f.value;
  if(f.placeholder)input.placeholder=f.placeholder;
  label.append(input);
  if(f.help){const help=document.createElement('small');help.textContent=f.help;label.append(help);}
  fields.append(label);
 }
 form.querySelector('button').textContent=d.button_label||(d.action==='authorize'?'Connect with provider':'Save securely');
 form.querySelector('button').disabled=false;
 statusEl.textContent=d.expires_at?'Private setup link expires: '+new Date(d.expires_at).toLocaleString():'';
 form.hidden=false;updateClientSecret();
}
fields.addEventListener('change',updateClientSecret);
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button');button.disabled=true;statusEl.textContent='Working...';
 try{
  const values=Object.create(null);
  for(const f of config.fields){const input=form.elements.namedItem(f.name);if(input&&!input.disabled)values[f.name]=input.value;}
  const payload={state,values};if(config.action)payload.action=config.action;
  const r=await request('/entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  form.reset();
  if(r.authorization_url){const next=new URL(r.authorization_url);if(next.protocol!=='https:'||next.username||next.password)throw Error('Invalid provider authorization URL');form.hidden=true;statusEl.textContent='Opening provider sign-in...';location.assign(next.toString());return;}
  if(Array.isArray(r.fields)){render(r);return;}
  form.hidden=true;statusEl.textContent=r.connected?'Connected. You can return to your assistant.':'Credentials saved, but verification did not succeed. Return to MiniTerminal to retry verification or replace credentials.';
 }catch(e){statusEl.textContent=e.message||'Submission failed';button.disabled=false;}
});
(async()=>{try{if(!/^[a-f0-9]{64}$/.test(state||''))throw Error('Missing or invalid link. Ask MiniTerminal for a new setup link.');render(await request('/entry?s='+encodeURIComponent(state)));}catch(e){form.hidden=true;statusEl.textContent=e.message||'Unable to load link';}})();
