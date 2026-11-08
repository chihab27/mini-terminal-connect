const method = (o:any) => o.token_auth_method || (o.app_client_secret_name ? 'client_secret_post' : 'none');
const scopes = (value:any) => [...new Set(String(value || '').split(/\s+/).filter(Boolean))].sort().join(' ');
const valid = (o:any) => !o.app_client_expires_at || Date.parse(o.app_client_expires_at) > Date.now() + 60000;
export async function resolveApplication(ctx:any, input:any, ownerId?:string) {
  const o = {...input};
  if (o.app_client_id_secret_name && !valid(o)) {
    delete o.app_client_id_secret_name;
    delete o.app_client_secret_name;
    delete o.app_client_expires_at;
  }
  if (o.provider || o.app_client_id_secret_name || !o.authorize_url || !o.token_url) return o;
  const shared = await ctx.db().from('oauth_providers').select('provider').eq('authorize_url', o.authorize_url).eq('token_url', o.token_url).limit(2);
  if (shared.error) throw Error('OAuth application lookup failed');
  if (shared.data?.length === 1) return {...o, provider: shared.data[0].provider};
  if (!ownerId) return o;
  const saved = await ctx.db().from('mt_integration_providers').select('configuration').eq('owner_id', ownerId).eq('enabled', true).eq('configuration->oauth->>token_url', o.token_url).order('created_at', {ascending: false});
  if (saved.error) throw Error('Saved OAuth application lookup failed');
  for (const row of saved.data || []) {
    const app = row.configuration?.oauth;
    if (!app?.app_client_id_secret_name || !valid(app) || app.authorize_url !== o.authorize_url || scopes(app.scopes) !== scopes(o.scopes) || method(app) !== method(o)) continue;
    return {...o, app_client_id_secret_name: app.app_client_id_secret_name, ...(app.app_client_secret_name ? {app_client_secret_name: app.app_client_secret_name} : {}), ...(app.app_client_expires_at ? {app_client_expires_at: app.app_client_expires_at} : {})};
  }
  return o;
}
export async function rememberApplication(ctx:any, c:any, p:any, o:any, client:any) {
  const until = Number(client.secretExpiresAt || 0);
  if (!Number.isFinite(until) || until < 0) throw Error('Invalid registered application lifetime');
  const name = 'MT_APP_' + crypto.randomUUID().replaceAll('-', '').toUpperCase() + '_CLIENT_ID';
  await ctx.rpc('mini_terminal_store_vault_secret', {p_name: name, p_secret: client.id, p_description: 'MiniTerminal reusable OAuth application client ID'});
  const previous = {...p.configuration.oauth};
  delete previous.app_client_expires_at;
  delete previous.app_client_secret_name;
  const oauth = {...previous, authorize_url: o.authorize_url, token_url: o.token_url, scopes: o.scopes || '', token_auth_method: client.method, app_client_id_secret_name: name, ...(client.secretName ? {app_client_secret_name: client.secretName} : {}), ...(until ? {app_client_expires_at: new Date(until * 1000).toISOString()} : {})};
  const saved = await ctx.db().from('mt_integration_providers').update({configuration: {...p.configuration, oauth}, configuration_version: p.configuration_version + 1, updated_at: new Date().toISOString()}).eq('id', p.id).eq('owner_id', c.owner_id).eq('configuration_version', p.configuration_version).select('*').maybeSingle();
  if (saved.error || !saved.data) throw Error('OAuth configuration changed; retry connecting');
  const sessions = await ctx.db().from('mt_integration_sessions').update({provider_configuration_version: saved.data.configuration_version}).eq('connection_id', c.id).eq('provider_configuration_version', p.configuration_version).eq('kind', 'credential_entry').eq('status', 'pending');
  if (sessions.error) throw Error('OAuth application saved; request a fresh setup link');
  Object.assign(p, saved.data);
}
