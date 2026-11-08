'use strict';
const BASE='https://vulazhgszvxpxqdcfllq.supabase.co',KEY='sb_publishable_PRD3CofK1uXDHCsZyfhTqg_pSirK0SR',STORE='mt-account-session-v1',SELF='https://chihab27.github.io/mini-terminal-connect/consent.html';
const $=s=>document.querySelector(s),status=t=>{$('#status').textContent=t;};
const id=new URLSearchParams(location.search).get('authorization_id');
function needSignIn(msg){
  localStorage.setItem('mt-return',SELF+'?authorization_id='+encodeURIComponent(id));
  status(msg);
  const a=document.createElement('a');a.href='./auth.html';a.textContent='Sign in to continue';
  $('#status').append(' ',a);
}
(async()=>{
  try{
    if(!id)throw Error('Missing authorization request. Start the connection again from your app.');
    let stored=null;try{stored=JSON.parse(localStorage.getItem(STORE)||'null');}catch{}
    if(!stored||!stored.refresh_token)return needSignIn('You need to sign in first.');
    const sb=supabase.createClient(BASE,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:s,error:se}=await sb.auth.setSession({access_token:stored.access_token,refresh_token:stored.refresh_token});
    if(se||!s.session)return needSignIn('Your session expired.');
    localStorage.setItem(STORE,JSON.stringify({access_token:s.session.access_token,refresh_token:s.session.refresh_token,expires_at:s.session.expires_at}));
    const {data,error}=await sb.auth.oauth.getAuthorizationDetails(id);
    if(error)throw Error(error.message||'Authorization request not found or expired.');
    if(!('authorization_id' in data)){location.replace(data.redirect_url);return;}
    $('#who').textContent=((data.client&&data.client.name)||'An app')+' wants to connect to your MiniTerminal account ('+s.session.user.email+').';
    $('#scope').textContent=data.scope?'Requested access: '+data.scope:'';
    $('#details').hidden=false;status('');
    const finish=action=>async()=>{
      $('#approve').disabled=true;$('#deny').disabled=true;status('Working...');
      try{const {data:d,error:e}=await sb.auth.oauth[action](id);if(e)throw Error(e.message);location.replace(d.redirect_url);}
      catch(e){status(e.message||'Request failed');$('#approve').disabled=false;$('#deny').disabled=false;}
    };
    $('#approve').onclick=finish('approveAuthorization');
    $('#deny').onclick=finish('denyAuthorization');
  }catch(e){status(e.message||'Something went wrong.');}
})();
