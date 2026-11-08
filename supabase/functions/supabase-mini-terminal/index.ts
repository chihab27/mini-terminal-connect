import {createClient} from 'npm:@supabase/supabase-js@2.49.1';
const BASE=Deno.env.get('SUPABASE_URL')!,VERSION='2.17.0',PROTOCOL='2025-03-26',MCP=BASE+'/functions/v1/supabase-mini-terminal';
const schema=(properties:any={},required:string[]=[])=>({type:'object',properties,required,additionalProperties:false});
const id={type:'string',format:'uuid'},uri={type:'string',format:'uri'};
const oauth=schema({provider:{type:'string',pattern:'^[a-z0-9][a-z0-9_-]{0,79}$',description:'Optional existing shared app; not required for new providers.'},issuer:uri,discovery_url:uri,authorize_url:uri,token_url:uri,registration_url:uri,scopes:{type:'string'},token_auth_method:{type:'string',enum:['none','client_secret_basic','client_secret_post']},authorization_params:{type:'object',additionalProperties:{type:'string'}},token_response_path:{type:'string',maxLength:160,description:'Dot-separated token object path, e.g. authed_user. Empty or omitted means root.'},token_types:{type:'array',minItems:1,maxItems:8,items:{type:'string',pattern:'^[A-Za-z][A-Za-z0-9_-]{0,31}$'},description:'Accepted provider token labels; default bearer. Requests still use Bearer authentication.'},verification_method:{type:'string',enum:['GET','POST']},verification_success:schema({path:{type:'string',maxLength:160},equals:{type:['string','number','boolean','null']}},['path','equals'])});
const endpoint=schema({name:{type:'string',maxLength:80},base_url:uri,auth:{type:'string',enum:['bearer','basic','oauth2','header']},fields:{type:'array',items:{type:'object',properties:{name:{type:'string'},label:{type:'string'},secret:{type:'boolean'}},required:['name']}},headers:{type:'object'},query:{type:'object'},verify_path:{type:'string'},oauth},['name','base_url']);
const tools=[
{name:'get_docs',description:'Describe adaptive connection setup and generic OAuth templates.',inputSchema:schema()},
{name:'list_connections',description:'List this user’s endpoint connections.',inputSchema:schema()},
{name:'setup_connection',description:'Start self-service provider setup with a name and HTTPS API URL. OAuth is the default. Supply documented non-secret metadata and optional token-response/verification settings. Returns a private entry_url and setup readiness. Shared or same-user application credentials may be reused; dynamic registration is attempted only where supported. Missing application setup is a maintainer task, not normal-user onboarding. Never collect secrets in chat.',inputSchema:endpoint},
{name:'add_endpoint',description:'Create a user-owned endpoint and return a private setup/credential link. Defaults to bearer; use setup_connection for OAuth-first setup. Supports generic OAuth token-response and verification settings.',inputSchema:endpoint},
{name:'start_oauth',description:'Start provider consent when an OAuth connection is configured. Use get_credentials_link if setup is incomplete.',inputSchema:schema({connection_id:id},['connection_id'])},
{name:'get_credentials_link',description:'Return a private adaptive setup link for an existing connection, including OAuth. Use it for application setup or replacing static credentials.',inputSchema:schema({connection_id:id},['connection_id'])},
{name:'verify_connection',description:'Verify stored credentials with the configured request method and optional exact JSON success condition.',inputSchema:schema({connection_id:id},['connection_id'])},
{name:'revoke_connection',description:'Revoke a connection.',inputSchema:schema({connection_id:id},['connection_id'])},
{name:'connection_request',description:'Call a connected endpoint with stored credentials and automatic OAuth refresh when available. ok reports HTTP success; inspect the provider response for application-level errors.',inputSchema:schema({connection_id:id,method:{type:'string',enum:['GET','POST','PUT','PATCH','DELETE']},path:{type:'string'},query:{type:'object'},body:{}},['connection_id'])}
];
const routes:Record<string,[string,string]>={list_connections:['connections','GET'],setup_connection:['setup','POST'],add_endpoint:['endpoints','POST'],start_oauth:['oauth-start','POST'],get_credentials_link:['credentials-link','POST'],verify_connection:['verify','POST'],revoke_connection:['revoke','POST'],connection_request:['request','POST']};
const docs='MiniTerminal '+VERSION+'. Use setup_connection({name,base_url,...known non-secret metadata}) for OAuth-first setup. add_endpoint retains its bearer default. Provider configuration is JSON, not provider-specific code. Shared applications or matching same-user saved applications may be reused; otherwise supported dynamic registration may obtain application credentials. If unavailable, setup returns maintainer_setup_required or unsupported_configuration; do not ask normal users to enter developer settings. App registration may still be necessary on the provider website. Credentials belong in the private setup flow or Vault, never chat. Callback: /functions/v1/mini-terminal-connections/oauth/callback. Generic OAuth options: token_response_path selects a dot-separated token object (default root); token_types accepts provider labels (default bearer) while outgoing API authentication remains Bearer; verification_method is GET (default) or POST; verification_success={path,equals} requires an exact primitive JSON value in addition to HTTP success. Malformed, missing or truncated predicate responses fail verification. These response settings apply to code exchange and refresh. For example, bot tokens can use token_types=[bot], while nested user tokens can use token_response_path=authed_user and token_types=[user]. Slack-style auth.test verification uses POST plus {path:ok,equals:true}; the Slack application must support the existing PKCE flow. These examples describe configuration, not an already-tested Slack integration. get_credentials_link works for static credentials and OAuth. start_oauth remains available for configured connections. API requests require connected status. connection_request.ok describes HTTP success only; check provider-level errors in its body. Static bearer/basic/header templates remain supported. Test real authorization, credential persistence and refresh before claiming provider compatibility.';
const anon=()=>createClient(BASE,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const H={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'authorization,content-type,mcp-protocol-version,mcp-session-id','Cache-Control':'no-store'};
const json=(v:any,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(v),{status,headers:{...H,'Content-Type':'application/json',...extra}});
const result=(rid:any,v:any)=>json({jsonrpc:'2.0',id:rid,result:v});
const error=(rid:any,code:number,message:string,status=200,extra:Record<string,string>={})=>json({jsonrpc:'2.0',id:rid,error:{code,message}},status,extra);
const challenge={'WWW-Authenticate':'Bearer resource_metadata='+JSON.stringify(MCP+'/.well-known/oauth-protected-resource')};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:H});
 const path=new URL(req.url).pathname.replace(/^\/functions\/v1(?=\/|$)/,'').replace(/^\/supabase-mini-terminal(?=\/|$)/,'').replace(/\/$/,'');
 try{
  if(req.method==='GET'){if(path.endsWith('/.well-known/oauth-protected-resource'))return json({resource:MCP,authorization_servers:[BASE+'/auth/v1'],bearer_methods_supported:['header']});if(path==='/health')return json({ok:true,service:'supabase-mini-terminal',version:VERSION,auth:'supabase-oauth-server'});return json({error:'GET transport not supported'},405,{Allow:'POST, OPTIONS'});}
  if(req.method!=='POST')return json({error:'Method not allowed'},405,{Allow:'POST, OPTIONS'});
  const raw=await req.text();if(raw.length>65536)return error(null,-32600,'Request too large',413);
  let a:any;try{a=JSON.parse(raw);}catch{return error(null,-32700,'Parse error',400);}
  if(!a||Array.isArray(a)||a.jsonrpc!=='2.0'||typeof a.method!=='string')return error(null,-32600,'Invalid request',400);
  const rid=a.id??null,method=a.method;
  if(method==='initialize')return result(rid,{protocolVersion:PROTOCOL,capabilities:{tools:{}},serverInfo:{name:'supabase-mini-terminal',version:VERSION}});
  if(method==='notifications/initialized')return new Response(null,{status:202,headers:H});
  if(method==='ping')return result(rid,{});
  if(method==='tools/list')return result(rid,{tools});
  if(method!=='tools/call')return error(rid,-32601,'Method unavailable');
  const auth=req.headers.get('authorization')??'',token=auth.startsWith('Bearer ')?auth.slice(7):'';let user:any=null;
  if(token){const r=await anon().auth.getUser(token);user=r.data.user;}
  if(!user||!user.email_confirmed_at)return error(rid,-32001,'MiniTerminal login required',401,challenge);
  const name=a.params?.name,tool=tools.find(t=>t.name===name);if(!tool)return error(rid,-32602,'Tool unavailable');
  const args=a.params?.arguments??{};
  try{
   if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Arguments must be an object');
   for(const k of Object.keys(args))if(!(k in tool.inputSchema.properties))throw Error('Unexpected argument: '+k);
   for(const k of tool.inputSchema.required)if(args[k]===undefined)throw Error('Missing argument: '+k);
   if('connection_id'in args&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.connection_id))throw Error('Invalid connection ID');
   if(name==='add_endpoint'||name==='setup_connection'){if(typeof args.name!=='string'||!args.name.trim())throw Error('Invalid name');const u=new URL(args.base_url);if(u.protocol!=='https:'||u.username||u.password)throw Error('Invalid base_url');if(args.auth&&!['bearer','basic','oauth2','header'].includes(args.auth))throw Error('Unsupported auth');if(args.oauth!==undefined){if(!args.oauth||typeof args.oauth!=='object'||Array.isArray(args.oauth))throw Error('Invalid OAuth configuration');for(const k of Object.keys(args.oauth))if(!(k in oauth.properties))throw Error('Unexpected OAuth argument: '+k);}}
   if(name==='connection_request'){if(args.method&&!['GET','POST','PUT','PATCH','DELETE'].includes(args.method))throw Error('Unsupported method');if(args.path!==undefined&&(typeof args.path!=='string'||!args.path.startsWith('/')||args.path.startsWith('//')||args.path.includes('..')||args.path.includes('\\')))throw Error('Invalid relative path');if(args.query!==undefined&&(!args.query||typeof args.query!=='object'||Array.isArray(args.query)))throw Error('Invalid query');}
  }catch(e){return error(rid,-32602,e instanceof Error?e.message:'Invalid arguments');}
  if(name==='get_docs')return result(rid,{content:[{type:'text',text:docs}],isError:false});
  const [route,verb]=routes[name];const r=await fetch(BASE+'/functions/v1/mini-terminal-connections/'+route,{method:verb,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:verb==='GET'?undefined:JSON.stringify(args),redirect:'error',signal:AbortSignal.timeout(25000)});
  const data=await r.json().catch(()=>({error:'Invalid connection service response'}));
  if(!r.ok)return result(rid,{content:[{type:'text',text:typeof data.error==='string'?data.error:'Connection service failed ('+r.status+')'}],isError:true});
  return result(rid,{content:[{type:'text',text:JSON.stringify(data)}],isError:false});
 }catch(e){console.log(JSON.stringify({event:'mcp_request_failed',error:e instanceof Error?e.message:'unknown'}));return error(null,-32603,'Request failed',500);}
});
