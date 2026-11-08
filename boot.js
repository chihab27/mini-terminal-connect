'use strict';
const params=new URLSearchParams(location.search),oauth=params.get('oauth');
if(oauth==='connected'||oauth==='failed'){
 const ok=oauth==='connected';
 document.querySelector('h1').textContent=ok?'Connection ready':'Connection needs attention';
 document.querySelector('#intro').textContent=ok?'Provider authorization completed and your connection is verified. You can return to your assistant.':'Provider authorization returned, but your connection is not verified. Open your account to retry verification or setup.';
 document.querySelector('#status').textContent=ok?'Connected.':'Not connected yet.';
 document.querySelector('#form').hidden=true;
 history.replaceState(null,'',location.pathname);
}else if(params.has('s')&&!location.hash){
 const script=document.createElement('script');script.src='./app.js';document.body.append(script);
}else{location.replace('./auth.html'+location.search+location.hash);}
